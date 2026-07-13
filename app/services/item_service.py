import json
import re
from pathlib import Path

import requests

from app.services.riot_api import get_latest_patch


CACHE_DIR = Path("cache")
COMMUNITY_DRAGON_ITEMS_URL = (
    "https://raw.communitydragon.org/{patch}/plugins/"
    "rcp-be-lol-game-data/global/default/v1/items.json"
)
SHOP_CLASS_NAMES = {
    "Fighter": "fighter",
    "Marksman": "marksman",
    "Assassin": "assassin",
    "Assasin": "assassin",
    "Mage": "mage",
    "Battlemage": "mage",
    "Tank": "tank",
    "Enchanter": "support",
}
SHOP_CLASS_PATTERN = re.compile(r"_([A-Za-z]+)_T\d+_")


def get_all_items():
    patch = get_latest_patch()
    patch_cache_dir = CACHE_DIR / patch
    item_cache_path = patch_cache_dir / "items.json"

    patch_cache_dir.mkdir(parents=True, exist_ok=True)

    if item_cache_path.exists():
        with item_cache_path.open("r", encoding="utf-8") as file:
            cached_items = json.load(file)

        if all("shop_class" in item for item in cached_items):
            return cached_items

        enriched_items = add_shop_classes(cached_items, fetch_shop_classes(patch))
        write_item_cache(item_cache_path, enriched_items)
        return enriched_items

    raw_items = fetch_item_data(patch)
    filtered_items = filter_shop_items(raw_items)
    shop_classes = fetch_shop_classes(patch)
    normalized_items = normalize_items(filtered_items, patch, shop_classes)

    write_item_cache(item_cache_path, normalized_items)
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


def fetch_shop_classes(patch):
    community_patch = ".".join(patch.split(".")[:2])
    url = COMMUNITY_DRAGON_ITEMS_URL.format(patch=community_patch)

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as error:
        print(f"CommunityDragonのショップ分類を取得できませんでした: {error}")
        return {}

    return {
        str(item["id"]): extract_shop_class(item.get("iconPath", ""))
        for item in response.json()
        if extract_shop_class(item.get("iconPath", "")) is not None
    }


def extract_shop_class(icon_path):
    match = SHOP_CLASS_PATTERN.search(icon_path)

    if match is None:
        return None

    return SHOP_CLASS_NAMES.get(match.group(1))


def add_shop_classes(items, shop_classes):
    for item in items:
        item["shop_class"] = shop_classes.get(str(item.get("id")))

    return items


def write_item_cache(item_cache_path, items):
    with item_cache_path.open("w", encoding="utf-8") as file:
        json.dump(items, file, ensure_ascii=False, indent=2)


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
        if gold.get("sell", 0) <= 0:
            continue
        if "Trinket" in tags:
            continue

        filtered[item_id] = item

    return filtered


def normalize_items(items, patch, shop_classes=None):
    normalized = []
    shop_classes = shop_classes or {}

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
                "shop_class": shop_classes.get(str(item_id)),
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