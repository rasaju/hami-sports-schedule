# 賽事雷達 · Hami Video 運動節目表

自動整理中華電信 Hami Video 運動台節目表的靜態網站，標記棒球、F1、桌球、排球、名古屋亞運等分類，方便尋找賽事回放與設定行事曆提醒。

## 功能
- 每日自動抓取 Hami Video 運動台 26 個相關頻道的節目表（`scripts/fetch_epg.py`）
- 依標題關鍵字自動分類：棒球、F1、桌球、排球、名古屋亞運、其他運動
- 依分類、時段（全部／即將登場／可回看）、關鍵字搜尋節目
- 一鍵「新增到 Google 日曆」或下載 `.ics` 檔（Apple/Outlook 日曆）
- 深色／淺色主題切換，響應式版面（桌面／手機）

## 專案結構
```
index.html          網站主頁
style.css           樣式與設計token
app.js              前端互動邏輯（篩選、搜尋、行事曆匯出）
assets/favicon.svg  網站圖示
data/programs.json  累積的節目資料（每日自動更新、合併，不刪除舊資料）
scripts/channels.py 頻道對照表與分類關鍵字
scripts/fetch_epg.py 抓取並合併 Hami Video EPG 資料的腳本
```

## 資料來源與更新方式
資料透過 Hami Video 官方節目表介面（`https://hamivideo.hinet.net/channel/epg.do`）取得。Hami Video 官方一次只公開約前後 1~3 週的節目表，本專案透過每日排程執行 `scripts/fetch_epg.py`，將新抓取的資料與 `data/programs.json` 中既有紀錄依節目唯一 ID 合併（不刪除舊資料），逐步累積成完整的歷史節目表，涵蓋過去與未來約五週的範圍。

手動更新：
```bash
python3 scripts/fetch_epg.py
```

## 使用方式
這是純靜態網站，直接用任何靜態伺服器或開啟 `index.html` 即可瀏覽，例如：
```bash
python3 -m http.server 8000
```
然後開啟 `http://localhost:8000`。

## 授權
節目資料版權屬於中華電信 Hami Video 及各節目版權方，本專案僅供個人整理賽事時刻表使用。
