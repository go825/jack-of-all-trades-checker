# Jack of All Trades Checker

League of Legendsのルーン「何でも屋（Jack of All Trades）」のスタックを、選択したアイテムから確認するWebツールです。

## 主な機能

- ロール別ビルド作成
- 何でも屋スタックのリアルタイム判定
- 取得済み・未取得ステータスの表示
- アイテム検索とショップクラス絞り込み
- ロール別ビルドのブラウザ保存
- Data Dragonの最新パッチへの自動追従

## ローカル起動

必要環境：Python 3.13、Git

```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

ブラウザで `http://127.0.0.1:5000` を開きます。

## Renderへの公開

リポジトリ直下の `render.yaml` を使ってBlueprintとして作成できます。

- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn run:app`
- Health Check Path: `/health`
- Plan: Free

RenderでGitHubリポジトリを接続し、Blueprintからこのリポジトリを選択してください。実際の公開は、公開対象のコミットをGitHubへPushしてから行います。

## Riot Games

Jack of All Trades Checker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.