# Hami Video 運動館 頻道清單 (contentPk -> 顯示名稱)
CHANNELS = {
    "OTT_LIVE_0000002124": "Hami大聯盟1台",
    "OTT_LIVE_0000002125": "Hami大聯盟2台",
    "OTT_LIVE_0000001744": "愛爾達體育1台",
    "OTT_LIVE_0000001743": "愛爾達體育2台",
    "OTT_LIVE_0000001745": "愛爾達體育3台",
    "OTT_LIVE_0000002055": "愛爾達體育4台",
    "OTT_LIVE_0000001853": "愛爾達體育MAX1台",
    "OTT_LIVE_0000001854": "愛爾達體育MAX2台",
    "OTT_LIVE_0000001855": "愛爾達體育MAX3台",
    "OTT_LIVE_0000001856": "愛爾達體育MAX4台",
    "OTT_LIVE_0000002126": "Hami亞運熱播台",
    "OTT_LIVE_0000002127": "Hami亞運1台",
    "OTT_LIVE_0000001908": "Hami WBC1台",
    "OTT_LIVE_0000001983": "Hami足球1台",
    "OTT_LIVE_0000002089": "Hami體育1台",
    "OTT_LIVE_0000001816": "Hami體育1台(免費)",
    "OTT_LIVE_0000002091": "Hami體育2台",
    "OTT_LIVE_0000001845": "博斯運動一台",
    "OTT_LIVE_0000002110": "博斯運動二台",
    "OTT_LIVE_0000001903": "博斯網球台",
    "OTT_LIVE_0000001972": "博斯魅力網",
    "OTT_LIVE_0000001882": "博斯無限台",
    "OTT_LIVE_0000001973": "博斯無限二台",
    "OTT_LIVE_0000001846": "博斯高球一台",
    "OTT_LIVE_0000001771": "EUROSPORT",
    "OTT_LIVE_0000001759": "TRACE Sport Stars",
}

# 分類關鍵字比對 (依序檢查，一個節目可命中多個分類)
CATEGORY_KEYWORDS = {
    "asiangames": ["亞運", "愛知", "名古屋", "Asian Games", "Aichi-Nagoya", "亞洲運動會", "亞洲運動"],
    "baseball": [
        "棒球", "MLB", "中華職棒", "CPBL", "大聯盟", "三級棒球", "U18", "U15", "U12",
        "WBC", "樂天桃猿", "富邦悍將", "中信兄弟", "統一7-ELEVEn", "統一獅", "味全龍",
        "台鋼雄鷹", "亞洲棒球", "世界棒球", "培瑞士", "12強",
    ],
    "f1": ["F1", "一級方程式", "Formula 1", "F2 ", "F3 ", "方程式賽車", "GP排位", "GP正賽"],
    "table_tennis": ["桌球", "乒乓", "WTT", "世界桌球"],
    "volleyball": ["排球", "VNL", "世界排球聯賽", "CEV", "FIVB", "沙灘排球", "九人制排球", "世界女排", "世界男排"],
}

CATEGORY_LABELS = {
    "asiangames": "名古屋亞運",
    "baseball": "棒球",
    "f1": "F1",
    "table_tennis": "桌球",
    "volleyball": "排球",
    "other": "其他運動",
}


def classify(title: str):
    tags = []
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in title.lower():
                tags.append(cat)
                break
    if not tags:
        tags.append("other")
    return tags
