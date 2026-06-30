import json
import requests
from app.services.riot_api import get_latest_patch

TARGETS = [
    "ゼファー",
    "ギャンブラーの剣",
    "ガーディアン ホーン",
    "星空のマント",
]

patch = get_latest_patch()
url = f"https://ddragon.leagueoflegends.com/cdn/{patch}/data/ja_JP/item.json"

data = requests.get(url, timeout=10).json()["data"]

for item_id, item in data.items():
    name = item.get("name", "")
    if any(target in name for target in TARGETS):
        print("=" * 80)
        print(item_id, name)
        print(json.dumps(item, ensure_ascii=False, indent=2))