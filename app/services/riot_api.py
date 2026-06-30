import requests

DDRAGON_VERSION_URL = "https://ddragon.leagueoflegends.com/api/versions.json"


def get_latest_patch():
    """
    最新パッチ番号を取得する
    例: 15.13.1
    """

    response = requests.get(DDRAGON_VERSION_URL, timeout=10)
    response.raise_for_status()

    versions = response.json()

    return versions[0]