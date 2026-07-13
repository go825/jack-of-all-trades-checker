import json
import re
from pathlib import Path

import requests

from app.services.riot_api import get_latest_patch


CACHE_DIR = Path("cache")
ITEM_CACHE_VERSION = 5
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
SHOP_TIER_PATTERN = re.compile(r"_(?:T|Tier)(\d+)_", re.IGNORECASE)


def get_all_items():
    patch = get_latest_patch()
    patch_cache_dir = CACHE_DIR / patch
    item_cache_path = patch_cache_dir / "items.json"

    patch_cache_dir.mkdir(parents=True, exist_ok=True)

    if item_cache_path.exists():
        with item_cache_path.open("r", encoding="utf-8") as file:
            cached_items = json.load(file)

        if all(
            item.get("cache_version") == ITEM_CACHE_VERSION
            for item in cached_items
        ):
            return cached_items

    raw_items = fetch_item_data(patch)
    shop_classes, available_shop_ids, shop_tiers = fetch_shop_metadata(patch)
    filtered_items = filter_shop_items(raw_items, available_shop_ids)
    normalized_items = normalize_items(
        filtered_items, patch, shop_classes, shop_tiers
    )

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


def fetch_shop_metadata(patch):
    community_patch = ".".join(patch.split(".")[:2])
    url = COMMUNITY_DRAGON_ITEMS_URL.format(patch=community_patch)

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as error:
        print(f"CommunityDragonのショップ情報を取得できませんでした: {error}")
        return {}, None, {}

    shop_classes = {}
    available_shop_ids = set()
    shop_tiers = {}

    for item in response.json():
        item_id = str(item["id"])
        shop_class = extract_shop_class(item.get("iconPath", ""))

        if shop_class is not None:
            shop_classes[item_id] = shop_class

        shop_tier = extract_shop_tier(item.get("iconPath", ""))
        if shop_tier is not None:
            shop_tiers[item_id] = shop_tier

        if is_client_shop_item(item):
            available_shop_ids.add(item_id)

    return shop_classes, available_shop_ids, shop_tiers


def is_client_shop_item(item):
    item_id = int(item["id"])

    icon_path = item.get("iconPath", "")

    return (
        item_id < 100000
        and "_ARAM_" not in icon_path.upper()
        and item.get("inStore", False)
        and item.get("displayInItemSets", False)
        and not item.get("requiredChampion")
        and not item.get("requiredAlly")
    )


def extract_shop_tier(icon_path):
    match = SHOP_TIER_PATTERN.search(icon_path)

    if match is None:
        return None

    tier = int(match.group(1))
    return max(1, tier)

def extract_shop_class(icon_path):
    match = SHOP_CLASS_PATTERN.search(icon_path)

    if match is None:
        return None

    return SHOP_CLASS_NAMES.get(match.group(1))


def write_item_cache(item_cache_path, items):
    with item_cache_path.open("w", encoding="utf-8") as file:
        json.dump(items, file, ensure_ascii=False, indent=2)


def filter_shop_items(raw_items, available_shop_ids=None):
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

        if available_shop_ids is not None:
            if item_id not in available_shop_ids:
                continue
        elif gold.get("sell", 0) <= 0:
            continue

        filtered[item_id] = item

    return filtered


def normalize_items(items, patch, shop_classes=None, shop_tiers=None):
    normalized = []
    shop_classes = shop_classes or {}
    shop_tiers = shop_tiers or {}

    for item_id, item in items.items():
        normalized.append(
            {
                "cache_version": ITEM_CACHE_VERSION,
                "id": item_id,
                "name": item.get("name", ""),
                "description": item.get("description", ""),
                "plaintext": item.get("plaintext", ""),
                "gold": item.get("gold", {}),
                "tags": item.get("tags", []),
                "stats": item.get("stats", {}),
                "shop_tier": shop_tiers.get(str(item_id))
                or item.get("depth")
                or 1,
                "from": [str(source_id) for source_id in item.get("from", [])],
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

    normalized.sort(
        key=lambda item: (
            item.get("shop_tier", 1),
            item.get("gold", {}).get("total", 0),
            item.get("name", ""),
            int(item["id"]),
        )
    )

    return normalized