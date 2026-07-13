import json
import re
from pathlib import Path

import requests

from app.services.riot_api import get_latest_patch


CACHE_DIR = Path("cache")
ITEM_CACHE_VERSION = 7
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

        if all(
            item.get("cache_version") == ITEM_CACHE_VERSION
            for item in cached_items
        ):
            return cached_items

    raw_items = fetch_item_data(patch)
    shop_classes, available_shop_ids = fetch_shop_metadata(patch)
    filtered_items = filter_shop_items(raw_items, available_shop_ids)
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


def fetch_shop_metadata(patch):
    community_patch = ".".join(patch.split(".")[:2])
    url = COMMUNITY_DRAGON_ITEMS_URL.format(patch=community_patch)

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as error:
        print(f"CommunityDragonのショップ情報を取得できませんでした: {error}")
        return {}, None

    shop_classes = {}
    available_shop_ids = set()

    for item in response.json():
        item_id = str(item["id"])
        shop_class = extract_shop_class(item.get("iconPath", ""))

        if shop_class is not None:
            shop_classes[item_id] = shop_class


        if is_client_shop_item(item):
            available_shop_ids.add(item_id)

    return shop_classes, available_shop_ids


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


def get_item_sort_group(item):
    tags = set(item.get("tags", []))

    if "Jungle" in tags:
        return "01-jungle"
    if "GoldPer" in tags or "Vision" in tags:
        return "02-support"
    if "Lane" in tags:
        return "03-lane-starter"
    if "Boots" in tags:
        return "04-boots"
    if "Consumable" in tags:
        return "05-consumable"

    shop_class = item.get("shop_class")
    class_order = {
        "fighter": "10-fighter",
        "marksman": "11-marksman",
        "assassin": "12-assassin",
        "mage": "13-mage",
        "tank": "14-tank",
        "support": "15-support",
    }
    if shop_class in class_order:
        return class_order[shop_class]

    stat_groups = [
        ("Damage", "20-attack-damage"),
        ("AttackSpeed", "21-attack-speed"),
        ("CriticalStrike", "22-critical-strike"),
        ("SpellDamage", "23-ability-power"),
        ("Mana", "24-mana"),
        ("ManaRegen", "25-mana-regen"),
        ("Health", "26-health"),
        ("Armor", "27-armor"),
        ("SpellBlock", "28-magic-resist"),
        ("AbilityHaste", "29-ability-haste"),
        ("LifeSteal", "30-life-steal"),
        ("NonbootsMovement", "31-movement"),
    ]

    for tag, group in stat_groups:
        if tag in tags:
            return group

    return "99-other"

def normalize_items(items, patch, shop_classes=None):
    normalized = []
    shop_classes = shop_classes or {}

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
                "shop_tier": item.get("depth") or 1,
                "from": [str(source_id) for source_id in item.get("from", [])],
                "shop_class": shop_classes.get(str(item_id)),
                "sort_group": None,
                "image": {
                    "full": item.get("image", {}).get("full", f"{item_id}.png"),
                    "url": (
                        f"https://ddragon.leagueoflegends.com/cdn/"
                        f"{patch}/img/item/{item_id}.png"
                    ),
                },
            }
        )

    for item in normalized:
        item["sort_group"] = get_item_sort_group(item)

    normalized.sort(
        key=lambda item: (
            item.get("shop_tier", 1),
            item.get("gold", {}).get("total", 0),
            item.get("sort_group", "99-other"),
            item.get("name", ""),
            int(item["id"]),
        )
    )

    return normalized