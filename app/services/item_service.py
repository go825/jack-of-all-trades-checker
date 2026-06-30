import json
from pathlib import Path

import requests

from app.services.riot_api import get_latest_patch


CACHE_DIR = Path("cache")


def get_all_items():
    patch = get_latest_patch()
    patch_cache_dir = CACHE_DIR / patch
    item_cache_path = patch_cache_dir / "items.json"

    patch_cache_dir.mkdir(parents=True, exist_ok=True)

    if item_cache_path.exists():
        with item_cache_path.open("r", encoding="utf-8") as f:
            return json.load(f)

    raw_items = fetch_item_data(patch)
    filtered_items = filter_shop_items(raw_items)
    normalized_items = normalize_items(filtered_items, patch)

    with item_cache_path.open("w", encoding="utf-8") as f:
        json.dump(normalized_items, f, ensure_ascii=False, indent=2)

    return normalized_items


def fetch_item_data(patch):
    url = (
        f"https://ddragon.leagueoflegends.com/cdn/"
        f"{patch}/data/ja_JP/item.json"
    )

    response = requests.get(url, timeout=10)
    response.raise_for_status()

    data = response.json()
    return data["data"]


def filter_shop_items(raw_items):
    filtered = {}

    for item_id, item in raw_items.items():
        maps = item.get("maps", {})
        gold = item.get("gold", {})
        tags = item.get("tags", [])

        if not maps.get("11", False):
            continue

        if not gold.get("purchasable", False):
            continue

        if gold.get("total", 0) <= 0:
            continue

        if "Trinket" in tags:
            continue

        filtered[item_id] = item

    return filtered


def normalize_items(items, patch):
    normalized = []

    for item_id, item in items.items():
        normalized.append(
            {
                "id": item_id,
                "name": item.get("name", ""),
                "description": item.get("description", ""),
                "plaintext": item.get("plaintext", ""),
                "gold": item.get("gold", {}),
                "tags": item.get("tags", []),
                "stats": item.get("stats", {}),
                "image": {
                    "full": item.get("image", {}).get("full", f"{item_id}.png"),
                    "url": (
                        f"https://ddragon.leagueoflegends.com/cdn/"
                        f"{patch}/img/item/{item_id}.png"
                    ),
                },
            }
        )

    return normalized