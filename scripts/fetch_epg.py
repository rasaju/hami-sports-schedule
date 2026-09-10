#!/usr/bin/env python3
"""
抓取 Hami Video 運動頻道的節目表 (epg.do)，並將結果累積寫入 data/programs.json。
採用「合併累加」策略：每次執行只會新增/更新資料，不會刪除舊資料，
讓「過去五週」的歷史紀錄能隨著每日排程執行逐漸完整收集。
"""
import json
import os
import sys
import time
import datetime
import concurrent.futures
import urllib.request
import urllib.parse

sys.path.insert(0, os.path.dirname(__file__))
from channels import CHANNELS, classify  # noqa: E402

TAIPEI_OFFSET = datetime.timedelta(hours=8)
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "programs.json")
DATA_PATH = os.path.abspath(DATA_PATH)

EPG_URL = "https://hamivideo.hinet.net/channel/epg.do"

# 抓取範圍：以台北目前日期為中心，往前後各抓 N 天 (Hami 官方本身只會回傳約 -8~+8 天內的資料，
# 抓取範圍設寬一點是安全邊界，多出來的日期會回傳空陣列，不影響結果)
DAYS_BACK = 12
DAYS_FORWARD = 12
MAX_WORKERS = 12
TIMEOUT = 12


def taipei_today():
    utc_now = datetime.datetime.utcnow()
    return (utc_now + TAIPEI_OFFSET).date()


def fetch_one(channel_id, date_str):
    body = urllib.parse.urlencode({"contentPk": channel_id, "date": date_str}).encode()
    req = urllib.request.Request(
        EPG_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Referer": f"https://hamivideo.hinet.net/channel/{channel_id}.do",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
        items = json.loads(raw) if raw.strip() else []
    except Exception as exc:  # noqa: BLE001
        print(f"  ! {channel_id} {date_str} failed: {exc}", file=sys.stderr)
        return channel_id, date_str, []
    return channel_id, date_str, items


def load_existing():
    if os.path.exists(DATA_PATH):
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                doc = json.load(f)
            return {p["tsId"]: p for p in doc.get("programs", [])}
        except Exception:
            return {}
    return {}


def main():
    today = taipei_today()
    dates = [
        (today + datetime.timedelta(days=d)).isoformat()
        for d in range(-DAYS_BACK, DAYS_FORWARD + 1)
    ]

    existing = load_existing()
    print(f"目前已累積節目數: {len(existing)}")

    jobs = [(cid, d) for cid in CHANNELS for d in dates]
    print(f"預計查詢 {len(jobs)} 組 (頻道 x 日期)...")

    new_count = 0
    updated_count = 0
    fetched_any_for_date = {d: False for d in dates}

    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = [pool.submit(fetch_one, cid, d) for cid, d in jobs]
        for fut in concurrent.futures.as_completed(futures):
            channel_id, date_str, items = fut.result()
            if not items:
                continue
            fetched_any_for_date[date_str] = True
            channel_name = CHANNELS.get(channel_id, channel_id)
            for item in items:
                ts_id = item.get("tsId")
                if not ts_id:
                    continue
                title = item.get("programName", "")
                record = {
                    "tsId": ts_id,
                    "channelId": channel_id,
                    "channelName": channel_name,
                    "title": title,
                    "startTime": int(item.get("startTime", 0)),
                    "endTime": int(item.get("endTime", 0)),
                    "reviewDate": item.get("reviewDate", date_str),
                    "epgTime": item.get("epgTime", ""),
                    "timeClass": item.get("timeClass", ""),
                    "playButtonText": item.get("playButtonText", ""),
                    "canPlay": bool(item.get("canPlay", False)),
                    "categories": classify(title),
                }
                if ts_id in existing:
                    updated_count += 1
                else:
                    new_count += 1
                existing[ts_id] = record

    covered_dates = sorted(d for d, ok in fetched_any_for_date.items() if ok)

    programs = sorted(existing.values(), key=lambda p: p["startTime"])
    doc = {
        "lastUpdated": datetime.datetime.utcnow().isoformat() + "Z",
        "lastFetchCoverage": {
            "from": covered_dates[0] if covered_dates else None,
            "to": covered_dates[-1] if covered_dates else None,
        },
        "totalPrograms": len(programs),
        "programs": programs,
    }

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=None, separators=(",", ":"))

    print(f"新增 {new_count} 筆、更新 {updated_count} 筆，累積總數 {len(programs)} 筆")
    print(f"本次實際抓到資料的日期範圍: {covered_dates[0] if covered_dates else '無'} ~ {covered_dates[-1] if covered_dates else '無'}")


if __name__ == "__main__":
    start = time.time()
    main()
    print(f"耗時 {time.time() - start:.1f} 秒")
