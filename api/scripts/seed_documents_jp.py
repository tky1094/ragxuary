"""Seed script to populate sample documents in Japanese for development.

Usage:
    # Basic usage (uses defaults: localhost:8000)
    python scripts/seed_documents_jp.py --email admin@example.com --password YourPass123

    # Specify API URL and project slug
    python scripts/seed_documents_jp.py \
        --api-url http://localhost:8000 \
        --email admin@example.com \
        --password YourPass123 \
        --project-slug sample-docs-jp

    # Create a new project automatically
    python scripts/seed_documents_jp.py \
        --email admin@example.com \
        --password YourPass123 \
        --create-project
"""

import argparse
import sys
import time

import httpx

API_PREFIX = "/api/v1"

# Sample document tree structure (Japanese)
# Each entry: (path, title, is_folder, content)
SAMPLE_DOCUMENTS: list[tuple[str, str, bool, str | None]] = [
    # --- Top-level folders ---
    ("guides", "ガイド", True, None),
    ("api-reference", "APIリファレンス", True, None),
    ("examples", "使用例", True, None),
    # --- Root document ---
    (
        "introduction",
        "はじめに",
        False,
        """\
# はじめに

**ragxuary** のドキュメントへようこそ！このガイドでは、RAG を活用した
ドキュメントプラットフォームの構築とデプロイについて説明します。

## ragxuary とは？

ragxuary は以下の機能を組み合わせたドキュメントツールです：

- **Markdown ベースの編集** — VSCode ライクなインターフェース
- **AI 搭載検索** — Retrieval-Augmented Generation (RAG) による検索
- **セルフホスト対応** — 完全なデータ主権を実現

## 主な機能

| 機能 | 説明 |
|------|------|
| Markdown エディタ | CodeMirror 6 ベースのエディタとライブプレビュー |
| ドキュメントビューア | VitePress 風の3カラムレイアウト |
| RAG チャット | ドキュメントに基づいた AI チャット |
| アクセス制御 | ロールベースの権限管理（閲覧者/編集者/管理者） |

## クイックリンク

- [はじめよう](./guides/getting-started) - 最初のプロジェクトをセットアップ
- [インストール](./guides/installation) - ragxuary のインストールと設定
- [API リファレンス](./api-reference/overview) - REST API ドキュメント
""",
    ),
    # --- Guides ---
    (
        "guides/getting-started",
        "はじめよう",
        False,
        """\
# はじめよう

このガイドでは、最初のプロジェクトを作成し、ドキュメントを書くまでの手順を説明します。

## 前提条件

作業を始める前に、以下を確認してください：

- [ ] Docker と Docker Compose がインストール済み
- [ ] モダンなウェブブラウザ（Chrome、Firefox、Safari、Edge）
- [ ] Markdown の基本的な知識

## ステップ 1: プロジェクトを作成する

1. ragxuary のインスタンスにログインします
2. ダッシュボードで **「新しいプロジェクト」** をクリックします
3. プロジェクトの詳細を入力します：
   - **名前**: プロジェクト名
   - **スラッグ**: URL 用の識別子（例: `my-docs`）
   - **公開設定**: 公開 または 非公開

## ステップ 2: 最初のドキュメントを書く

**編集** タブに移動して、新しいドキュメントを作成します：

```markdown
# 最初のドキュメント

こんにちは！これは ragxuary での最初のドキュメントです。

## セクション 1

ここにコンテンツを書きます...
```

## ステップ 3: プレビューと公開

**ドキュメント** タブに切り替えると、レンダリングされたドキュメントが表示されます：
- 自動生成される目次
- シンタックスハイライト
- ナビゲーションサイドバー

## 次のステップ

- [インストールガイド](./installation) でセルフホスティングについて確認
- [設定](./configuration) オプションについて学ぶ
- [API リファレンス](../api-reference/overview) を参照する
""",
    ),
    (
        "guides/installation",
        "インストール",
        False,
        """\
# インストール

ragxuary は、開発環境と本番環境の両方で Docker Compose を使ってデプロイできます。

## システム要件

| コンポーネント | 最低要件 | 推奨 |
|---------------|---------|------|
| CPU | 2 コア | 4 コア |
| RAM | 4 GB | 8 GB |
| ストレージ | 10 GB | 50 GB |
| Docker | 24 以上 | 最新版 |

## Docker Compose でクイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/tky1094/ragxuary.git
cd ragxuary

# 環境ファイルをコピー
cp .env.example .env

# 全サービスを起動
docker compose up -d
```

## 環境変数

`.env` の主な設定項目：

```bash
# データベース
POSTGRES_USER=ragxuary
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ragxuary

# アプリケーション
SECRET_KEY=your_secret_key
API_URL=http://localhost:8000
WEB_URL=http://localhost:3000
```

## インストールの確認

起動後、全サービスが動作していることを確認します：

```bash
# サービスの状態を確認
docker compose ps

# API のヘルスエンドポイントをテスト
curl http://localhost:8000/api/v1/health
```

期待されるレスポンス：

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

## トラブルシューティング

### ポートの競合

ポート 3000 または 8000 が既に使用されている場合：

```bash
# docker-compose.yml でポートを変更
ports:
  - "3001:3000"  # Web
  - "8001:8000"  # API
```

### データベース接続の問題

```bash
# データベースのログを確認
docker compose logs postgres

# データベースをリセット
docker compose down -v
docker compose up -d
```
""",
    ),
    (
        "guides/configuration",
        "設定",
        False,
        """\
# 設定

ragxuary は環境変数とプロジェクト設定で構成されます。

## アプリケーション設定

### 認証

```bash
# JWT 設定
JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

### ファイルアップロード

```bash
# アップロード制限
MAX_UPLOAD_SIZE_MB=10
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_STORAGE_PATH=./storage/uploads
```

## プロジェクトレベルの設定

各プロジェクトは個別に設定できます：

### 公開設定

| 設定 | 説明 |
|------|------|
| `private` | プロジェクトメンバーのみアクセス可能 |
| `public` | 誰でも閲覧可能（編集にはメンバーシップが必要） |

### チャット設定

> **注意**: RAG チャットには LLM プロバイダーの設定が必要です。

```yaml
chat_enabled: true
llm_provider: openai
llm_model: gpt-4o
```

## 高度な設定

### Redis キャッシュ

```bash
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_SECONDS=300
```

### ログ設定

```bash
LOG_LEVEL=INFO        # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=json       # json または text
```
""",
    ),
    # --- API Reference ---
    (
        "api-reference/overview",
        "API 概要",
        False,
        """\
# API 概要

ragxuary は、プロジェクト、ドキュメント、ユーザーを管理するための RESTful API を提供します。

## ベース URL

```
http://localhost:8000/api/v1
```

## 認証

公開エンドポイントを除くすべての API リクエストには Bearer トークンが必要です：

```bash
curl -H "Authorization: Bearer <access_token>" \\
  http://localhost:8000/api/v1/projects
```

### トークンの取得

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password123"}'
```

レスポンス：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

## エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/auth/register` | 新規ユーザー登録 |
| `POST` | `/auth/login` | ログイン |
| `GET` | `/projects` | プロジェクト一覧 |
| `POST` | `/projects` | プロジェクト作成 |
| `GET` | `/projects/{slug}` | プロジェクト取得 |
| `GET` | `/projects/{slug}/docs` | ドキュメントツリー取得 |
| `PUT` | `/projects/{slug}/docs/{path}` | ドキュメント作成/更新 |

## レート制限

API リクエストには不正利用防止のためレート制限が設けられています：

| 種別 | 制限 |
|------|------|
| 匿名 | 60 リクエスト/分 |
| 認証済み | 300 リクエスト/分 |
| 管理者 | 1000 リクエスト/分 |

## エラーレスポンス

すべてのエラーは統一されたフォーマットに従います：

```json
{
  "detail": "エラーの内容を説明するメッセージ"
}
```

| ステータスコード | 意味 |
|----------------|------|
| `400` | Bad Request — 入力が不正 |
| `401` | Unauthorized — トークンが未設定または無効 |
| `403` | Forbidden — 権限が不足 |
| `404` | Not Found — リソースが存在しない |
| `429` | Too Many Requests — レート制限超過 |
""",
    ),
    (
        "api-reference/authentication",
        "認証 API",
        False,
        """\
# 認証 API

## POST /auth/register

新しいユーザーアカウントを作成します。

### リクエストボディ

```json
{
  "email": "user@example.com",
  "name": "山田太郎",
  "password": "SecurePass123"
}
```

### バリデーションルール

| フィールド | ルール |
|-----------|-------|
| `email` | 有効なメールアドレス形式、一意 |
| `name` | 1〜100 文字、前後の空白は除去 |
| `password` | 最低 8 文字、英字と数字を各1文字以上含む |

### レスポンス（201 Created）

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## POST /auth/login

既存のユーザーを認証します。

### リクエストボディ

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### レスポンス（200 OK）

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### エラーレスポンス

| ステータス | 条件 |
|-----------|------|
| `401` | メールアドレスまたはパスワードが無効 |
| `403` | アカウントが無効化されている |

---

## POST /auth/refresh

期限切れのアクセストークンを更新します。

### リクエストボディ

```json
{
  "refresh_token": "eyJ..."
}
```

### レスポンス（200 OK）

```json
{
  "access_token": "eyJ...(新しいトークン)",
  "refresh_token": "eyJ...(新しいトークン)",
  "token_type": "bearer"
}
```
""",
    ),
    (
        "api-reference/documents",
        "ドキュメント API",
        False,
        """\
# ドキュメント API

プロジェクト内のドキュメントを管理します。

## GET /projects/{slug}/docs

プロジェクトのドキュメントツリーを取得します。

### レスポンス（200 OK）

```json
[
  {
    "id": "uuid",
    "slug": "guides",
    "path": "guides",
    "title": "ガイド",
    "index": 0,
    "is_folder": true,
    "children": [
      {
        "id": "uuid",
        "slug": "getting-started",
        "path": "guides/getting-started",
        "title": "はじめよう",
        "index": 0,
        "is_folder": false,
        "children": []
      }
    ]
  }
]
```

---

## GET /projects/{slug}/docs/{path}

単一のドキュメントを取得します。

### レスポンス（200 OK）

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "parent_id": "uuid or null",
  "slug": "getting-started",
  "path": "guides/getting-started",
  "index": 0,
  "is_folder": false,
  "title": "はじめよう",
  "content": "# はじめよう\\n\\nようこそ...",
  "created_at": "2026-01-28T12:00:00Z",
  "updated_at": "2026-01-28T12:00:00Z"
}
```

---

## PUT /projects/{slug}/docs/{path}

ドキュメントを作成または更新します（アップサート）。

### リクエストボディ

```json
{
  "title": "はじめよう",
  "content": "# はじめよう\\n\\nドキュメントへようこそ。",
  "is_folder": false,
  "message": "はじめようガイドを更新"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `title` | string | はい | ドキュメントタイトル（1〜200 文字） |
| `content` | string | いいえ | Markdown コンテンツ |
| `is_folder` | boolean | いいえ | フォルダかどうか（デフォルト: false） |
| `message` | string | いいえ | コミットメッセージ（最大 500 文字） |

### レスポンス（200 OK）

作成/更新された `DocumentRead` オブジェクトを返します。

---

## DELETE /projects/{slug}/docs/{path}

ドキュメントとそのすべての子要素を削除します。

### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|------|------|
| `message` | string | 任意の削除メッセージ |

### レスポンス（204 No Content）

レスポンスボディはありません。
""",
    ),
    # --- Examples ---
    (
        "examples/basic-usage",
        "基本的な使い方",
        False,
        """\
# 基本的な使い方

## シンプルなドキュメントサイトを作成する

### 1. プロジェクト構成

一般的な ragxuary プロジェクトのドキュメント構成：

```
introduction
guides/
  getting-started
  installation
  configuration
api-reference/
  overview
  endpoints
```

### 2. Markdown の書き方

ragxuary は **GitHub Flavored Markdown**（GFM）をサポートしています：

#### テキストの書式設定

- **太字** は `**太字**` で記述
- *斜体* は `*斜体*` で記述
- ~~取り消し線~~ は `~~取り消し線~~` で記述
- `インラインコード` はバッククォートで記述

#### タスクリスト

- [x] プロジェクトを作成
- [x] はじめにを執筆
- [ ] API リファレンスを追加
- [ ] RAG チャットを設定

#### テーブル

| 構文 | 説明 | 例 |
|------|------|------|
| `#` | 見出し 1 | `# タイトル` |
| `##` | 見出し 2 | `## セクション` |
| `- [ ]` | タスク項目 | `- [ ] やること` |
| `` ``` `` | コードブロック | 下記参照 |

### 3. コードブロック

多くの言語のシンタックスハイライトに対応しています：

**Python:**
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "こんにちは、世界！"}
```

**TypeScript:**
```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

async function fetchDocument(path: string): Promise<Document> {
  const response = await fetch(`/api/v1/docs/${path}`);
  return response.json();
}
```

**Bash:**
```bash
#!/bin/bash
echo "ragxuary を起動中..."
docker compose up -d
echo "サービスが起動しました！"
```
""",
    ),
    (
        "examples/diagrams",
        "ダイアグラム",
        False,
        """\
# Mermaid ダイアグラム

ragxuary では、Markdown 内で Mermaid ダイアグラムを使用できます。
`mermaid` 言語識別子を付けたコードブロックで記述します。

## システム構成図

```mermaid
flowchart TB
  subgraph フロントエンド
    Web[Next.js ウェブアプリ]
  end
  subgraph バックエンド
    API[FastAPI サーバー]
    Worker[バックグラウンドワーカー]
  end
  subgraph ストレージ
    DB[(PostgreSQL)]
    Redis[(Redis)]
  end

  Web --> API
  API --> DB
  API --> Redis
  Worker --> DB
  Worker --> Redis
```

## 認証フロー

```mermaid
flowchart LR
  User[ユーザー] -->|POST /auth/login| API
  API -->|資格情報を検証| DB[(データベース)]
  DB -->|ユーザー情報| API
  API -->|JWT トークン| User
  User -->|Bearer トークン| ProtectedAPI[保護されたエンドポイント]
```

## ドキュメントのライフサイクル

```mermaid
flowchart TB
  Create[ドキュメント作成] --> Draft[下書き]
  Draft -->|編集| Draft
  Draft -->|保存| Published[公開済み]
  Published -->|編集| NewRevision[新しいリビジョン]
  NewRevision -->|保存| Published
  Published -->|削除| Archived[アーカイブ]
```

## 通常のコードブロック

Mermaid 以外のコードブロックは通常通りハイライトされます：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}
```
""",
    ),
    (
        "examples/advanced-usage",
        "応用的な使い方",
        False,
        """\
# 応用的な使い方

## 大規模ドキュメントの整理

### ネストされたフォルダ構造

大きなプロジェクトでは、ドキュメントを論理的なセクションに整理します：

```
overview
architecture/
  system-design
  data-flow
  security
guides/
  user-guides/
    getting-started
    writing-docs
    collaboration
  admin-guides/
    setup
    user-management
    backup-restore
api/
  v1/
    auth
    projects
    documents
  webhooks
```

### ドキュメントの並び順

ドキュメントは同じ親内で `index` フィールドの値順に並びます。
エディタでドラッグ＆ドロップして並び替えが可能です。

## API を使った操作

### ドキュメントの一括作成

バッチ更新 API を使って、複数のドキュメントを一度に作成できます：

```python
import httpx

documents = [
    {"path": "guides/intro", "title": "はじめに", "content": "# はじめに"},
    {"path": "guides/setup", "title": "セットアップ", "content": "# セットアップ"},
    {"path": "guides/usage", "title": "使い方", "content": "# 使い方"},
]

response = httpx.put(
    "http://localhost:8000/api/v1/projects/my-project/docs/batch",
    json={"documents": documents, "message": "ガイドドキュメントを追加"},
    headers={"Authorization": f"Bearer {token}"},
)
```

### ドキュメント履歴

リビジョン履歴を使って変更を追跡できます：

```bash
# ドキュメント履歴を取得
curl -H "Authorization: Bearer $TOKEN" \\
  "http://localhost:8000/api/v1/projects/my-project/docs/guides/intro/history"
```

レスポンスには変更タイプ付きの全リビジョンが含まれます：

```json
[
  {
    "id": "rev-uuid",
    "change_type": "update",
    "title": "はじめに",
    "created_at": "2026-02-01T10:00:00Z",
    "user_name": "管理者",
    "message": "はじめにの誤字を修正"
  }
]
```
""",
    ),
]


def login(client: httpx.Client, email: str, password: str) -> str:
    """Login and return access token."""
    resp = client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": email, "password": password},
    )
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        sys.exit(1)
    token = resp.json()["access_token"]
    print(f"Logged in as {email}")
    return token


def get_or_create_project(
    client: httpx.Client, headers: dict, slug: str, create: bool
) -> str:
    """Get existing project or create a new one. Returns project slug."""
    resp = client.get(f"{API_PREFIX}/projects/{slug}", headers=headers)
    if resp.status_code == 200:
        print(f"Using existing project: {slug}")
        return slug

    if not create:
        print(f"Project '{slug}' not found. Use --create-project to create it.")
        sys.exit(1)

    resp = client.post(
        f"{API_PREFIX}/projects",
        headers=headers,
        json={
            "slug": slug,
            "name": "サンプルドキュメント（日本語）",
            "description": "開発用の日本語サンプルドキュメント",
            "visibility": "public",
        },
    )
    if resp.status_code == 201:
        print(f"Created project: {slug}")
        return slug

    print(f"Failed to create project: {resp.status_code} {resp.text}")
    sys.exit(1)


def seed_documents(client: httpx.Client, headers: dict, project_slug: str) -> None:
    """Create sample documents in the project."""
    total = len(SAMPLE_DOCUMENTS)
    success = 0
    skipped = 0

    for i, (path, title, is_folder, content) in enumerate(SAMPLE_DOCUMENTS, 1):
        payload: dict = {
            "title": title,
            "is_folder": is_folder,
            "message": f"Seed: add {title}",
        }
        if content is not None:
            payload["content"] = content

        resp = client.put(
            f"{API_PREFIX}/projects/{project_slug}/docs/{path}",
            headers=headers,
            json=payload,
        )

        status = resp.status_code
        if status == 200:
            icon = "+" if "created" not in resp.text.lower() else "+"
            print(f"  [{i:2d}/{total}] {icon} {path}")
            success += 1
        elif status == 409:
            print(f"  [{i:2d}/{total}] = {path} (already exists)")
            skipped += 1
        else:
            print(f"  [{i:2d}/{total}] ! {path} FAILED ({status}: {resp.text})")

        # Small delay to ensure ordering
        time.sleep(0.05)

    print(
        f"\nDone: {success} created, {skipped} skipped, {total - success - skipped} failed"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed sample documents in Japanese for development"
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        help="API base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Login email address",
    )
    parser.add_argument(
        "--password",
        required=True,
        help="Login password",
    )
    parser.add_argument(
        "--project-slug",
        default="sample-docs-jp",
        help="Project slug to seed documents into (default: sample-docs-jp)",
    )
    parser.add_argument(
        "--create-project",
        action="store_true",
        help="Create the project if it doesn't exist",
    )
    args = parser.parse_args()

    client = httpx.Client(base_url=args.api_url, timeout=30.0)

    print(f"Connecting to {args.api_url}...")
    token = login(client, args.email, args.password)
    headers = {"Authorization": f"Bearer {token}"}

    slug = get_or_create_project(
        client, headers, args.project_slug, args.create_project
    )

    print(f"\nSeeding documents into project '{slug}'...")
    seed_documents(client, headers, slug)


if __name__ == "__main__":
    main()
