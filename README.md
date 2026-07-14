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

## 開発フロー

### ブランチの役割

- `main`：公開用の安定版。Renderはこのブランチをデプロイする
- `develop`：普段の開発・動作確認に使用する

原則として、`main`では直接開発せず、変更は`develop`で行います。

### 1. 作業を始める

```powershell
git switch develop
git pull origin develop
```

仮想環境を有効にして、ローカルサーバーを起動します。

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python run.py
```

### 2. 開発・動作確認

1. `develop`でコードを変更する
2. ブラウザで `http://127.0.0.1:5000` を開く
3. 変更した機能と既存機能を確認する
4. 構文チェックや必要なテストを実行する
5. `git status`と`git diff`で変更内容を確認する

### 3. developへ保存する

```powershell
git add <変更したファイル>
git commit -m "変更内容を表すメッセージ"
git push origin develop
```

作業途中のコミットを`develop`へPushしても、公開サイトには反映されません。

### 4. 公開する

`develop`で十分に動作確認してから、変更を`main`へ反映します。

```powershell
git switch main
git pull origin main
git merge --no-ff develop
git push origin main
```

Renderが`main`へのPushを検知し、公開サイトを自動更新します。

公開後は`develop`へ戻り、`main`の最新状態を取り込みます。

```powershell
git switch develop
git merge main
git push origin develop
```

### 5. 公開後に不具合が見つかった場合

1. `develop`で修正する
2. ローカルで動作確認する
3. `develop`へコミット・Pushする
4. 修正を`main`へマージする
5. `main`をPushして再デプロイする

### 運用ルール

- 開発前に必ず現在のブランチを確認する
- 通常の作業は`develop`で行う
- 動作確認前の変更を`main`へ入れない
- `main`へ反映する直前に、構文チェックとブラウザ確認を行う
- Renderのデプロイブランチは`main`に設定する

## Renderへの公開

リポジトリ直下の `render.yaml` を使ってBlueprintとして作成できます。

- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn run:app`
- Health Check Path: `/health`
- Plan: Free

RenderでGitHubリポジトリを接続し、Blueprintからこのリポジトリを選択してください。実際の公開は、公開対象のコミットをGitHubへPushしてから行います。

## Riot Games

Jack of All Trades Checker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
