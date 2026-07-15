import json
import re
import time
from pathlib import Path

import requests
from pykakasi import kakasi

from app.services.riot_api import get_latest_patch


CACHE_DIR = Path("cache")
ITEM_CACHE_VERSION = 13
FALLBACK_CACHE_RETRY_SECONDS = 30 * 60
MAX_ITEM_COUNT_CHANGE = 10
KAKASI = kakasi()
EXCLUDED_SHOP_ITEM_IDS = {
    "2003",  # 体力ポーション
    "2031",  # 詰め替えポーション
    "2055",  # コントロール ワード
}
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

        cache_is_current = cached_items and all(
            item.get("cache_version") == ITEM_CACHE_VERSION
            for item in cached_items
        )
        cache_source = (
            cached_items[0].get("shop_metadata_source")
            if cached_items
            else None
        )
        fallback_cache_is_fresh = (
            cache_source == "fallback"
            and time.time() - item_cache_path.stat().st_mtime
            < FALLBACK_CACHE_RETRY_SECONDS
        )

        if cache_is_current and (
            cache_source == "community" or fallback_cache_is_fresh
        ):
            return cached_items

    raw_items = fetch_item_data(patch)
    shop_classes, available_shop_ids = fetch_shop_metadata(patch)
    fallback_shop_items = load_previous_shop_items(patch)
    shop_metadata_source = (
        "community" if available_shop_ids is not None else "fallback"
    )
    filtered_items = filter_shop_items(
        raw_items,
        available_shop_ids,
        fallback_shop_items,
    )

    if is_item_count_suspicious(filtered_items, fallback_shop_items):
        print(
            "ショップアイテム数の急変を検出したため、"
            "直前パッチの許可リストへ切り替えます。"
        )
        shop_classes = {}
        shop_metadata_source = "fallback"
        filtered_items = filter_shop_items(
            raw_items,
            None,
            fallback_shop_items,
        )

    normalized_items = normalize_items(
        filtered_items,
        patch,
        shop_classes,
        shop_metadata_source,
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


def generate_search_aliases(name):
    hiragana = "".join(part["hira"] for part in KAKASI.convert(name)).strip()
    compact = re.sub(r"\s+", "", hiragana)
    return list(dict.fromkeys(alias for alias in (hiragana, compact) if alias))


def write_item_cache(item_cache_path, items):
    with item_cache_path.open("w", encoding="utf-8") as file:
        json.dump(items, file, ensure_ascii=False, indent=2)


def load_previous_shop_items(current_patch):
    candidates = sorted(
        (
            directory
            for directory in CACHE_DIR.iterdir()
            if (
                directory.is_dir()
                and directory.name != current_patch
                and re.fullmatch(r"\d+\.\d+\.\d+", directory.name)
            )
        ),
        key=lambda directory: tuple(
            int(part) for part in directory.name.split(".")
        ),
        reverse=True,
    )

    for directory in candidates:
        item_path = directory / "items.json"
        if not item_path.exists():
            continue

        with item_path.open("r", encoding="utf-8") as file:
            items = json.load(file)

        return {
            "ids": {str(item["id"]) for item in items},
            "names_by_id": {str(item["id"]): item["name"] for item in items},
        }

    return None


def is_item_count_suspicious(items, fallback_shop_items):
    if fallback_shop_items is None:
        return False

    previous_count = len(fallback_shop_items["ids"] )
    return abs(len(items) - previous_count) > MAX_ITEM_COUNT_CHANGE


def filter_shop_items(
    raw_items,
    available_shop_ids=None,
    fallback_shop_items=None,
):
    filtered = {}
    fallback_replacement_names = set()

    if fallback_shop_items is not None:
        sellable_names = {
            item.get("name")
            for item in raw_items.values()
            if item.get("gold", {}).get("sell", 0) > 0
        }
        fallback_replacement_names = {
            name
            for item_id, name in fallback_shop_items["names_by_id"].items()
            if (
                item_id not in raw_items
                or (
                    raw_items[item_id].get("gold", {}).get("sell", 0) <= 0
                    and name in sellable_names
                )
            )
        }

    for item_id, item in raw_items.items():
        maps = item.get("maps", {})
        gold = item.get("gold", {})
        tags = item.get("tags", [])

        if item_id in EXCLUDED_SHOP_ITEM_IDS:
            continue
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
        elif fallback_shop_items is not None:
            is_replaced_previous_item = (
                item_id in fallback_shop_items["ids"]
                and item.get("name") in fallback_replacement_names
                and gold.get("sell", 0) <= 0
            )
            is_replacement_item = (
                item.get("name") in fallback_replacement_names
                and gold.get("sell", 0) > 0
            )
            if (
                item_id not in fallback_shop_items["ids"]
                and not is_replacement_item
            ) or is_replaced_previous_item:
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

def normalize_items(
    items,
    patch,
    shop_classes=None,
    shop_metadata_source="community",
):
    normalized = []
    shop_classes = shop_classes or {}

    for item_id, item in items.items():
        normalized.append(
            {
                "cache_version": ITEM_CACHE_VERSION,
                "shop_metadata_source": shop_metadata_source,
                "id": item_id,
                "name": item.get("name", ""),
                "description": item.get("description", ""),
                "plaintext": item.get("plaintext", ""),
                "search_aliases": generate_search_aliases(item.get("name", "")),
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