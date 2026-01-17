# ragxuary 要件定義書

> RAG ネイティブなドキュメンテーションツール

ドキュメントを書いて公開するだけでなく、そのドキュメントをナレッジベースにした AI チャットを提供する。

---

## 目次

1. [概要](#概要)
2. [ターゲットユーザー](#ターゲットユーザー)
3. [技術スタック](#技術スタック)
4. [機能要件](#機能要件)
5. [非機能要件](#非機能要件)
6. [URL 設計](#url設計)
7. [データベース設計](#データベース設計)
8. [API 設計](#api設計)
9. [RAG アーキテクチャ](#ragアーキテクチャ)
10. [認証・認可](#認証認可)
11. [デプロイメント](#デプロイメント)
12. [MVP 定義](#mvp定義)

---

## 概要

### プロダクトビジョン

ragxuary は、技術ドキュメントの作成・公開・検索を一元化し、AI による自然言語での質問応答を可能にするプラットフォームである。

### 主要な価値提案

- **ドキュメント作成**: マークダウンベースの直感的なエディタ
- **公開・共有**: プロジェクト単位での公開/非公開設定
- **AI 検索**: RAG ベースの自然言語検索・質問応答
- **セルフホスト**: エンタープライズ環境での完全なデータ主権

---

## ターゲットユーザー

### 個人開発者

- OSS プロジェクトのドキュメント公開
- 個人ナレッジベースの構築

### チーム・スタートアップ

- 社内ドキュメントの整備
- 新メンバーオンボーディング効率化

### エンタープライズ

- 大規模ナレッジベースの構築
- LDAP による既存認証基盤との統合
- オンプレミス・プライベートクラウドでの運用

---

## 技術スタック

### フロントエンド

| 技術           | バージョン | 用途                      |
| -------------- | ---------- | ------------------------- |
| Next.js        | 14+        | App Router 使用、RSC 活用 |
| React          | 18+        | UI ライブラリ             |
| TypeScript     | 5+         | 型安全性                  |
| TailwindCSS    | 3+         | スタイリング              |
| shadcn/ui      | latest     | UI コンポーネント         |
| NextAuth.js    | 5+         | 認証                      |
| CodeMirror     | 6+         | マークダウンエディタ      |
| TanStack Query | 5+         | サーバー状態管理          |
| Zustand        | 4+         | クライアント状態管理      |

### バックエンド

| 技術       | バージョン | 用途               |
| ---------- | ---------- | ------------------ |
| FastAPI    | 0.110+     | REST API           |
| Python     | 3.11+      | ランタイム         |
| SQLAlchemy | 2.0+       | ORM                |
| Pydantic   | 2.0+       | バリデーション     |
| GitPython  | 3.1+       | Git 連携           |
| LangChain  | 0.2+       | RAG フレームワーク |
| pgvector   | 0.5+       | ベクトル検索       |

### インフラストラクチャ

| 技術           | バージョン | 用途                               |
| -------------- | ---------- | ---------------------------------- |
| Docker         | 24+        | コンテナ化                         |
| Docker Compose | 2.20+      | オーケストレーション               |
| PostgreSQL     | 16+        | データベース                       |
| Redis          | 7+         | キャッシュ・セッション・レート制限 |
| Nginx          | 1.25+      | リバースプロキシ                   |

---

## 機能要件

### F1: ドキュメンテーション

#### F1.1 プロジェクト管理

- プロジェクトの作成・編集・削除
- プロジェクトメタデータ（名前、説明、アイコン、公開設定）
- プロジェクトスラッグ（URL 用識別子）の設定

#### F1.2 ドキュメント閲覧

- マークダウンレンダリング（GFM 準拠）
- シンタックスハイライト
- 目次自動生成（見出しベース）
- ページ間ナビゲーション
- パンくずリスト
- ダークモード対応

#### F1.3 検索機能

- プロジェクト内全文検索
- 検索結果ハイライト
- 検索クエリサジェスト
- フィルタリング（日付、作成者）

### F2: エディタ

#### F2.1 基本編集機能

- マークダウンエディタ（WYSIWYG 風プレビュー）
- 2 ペインレイアウト（エクスプローラ / エディタ）
- リアルタイムプレビュー
- ファイルツリー表示
- ドラッグ&ドロップでファイル移動

#### F2.2 Web 編集モード

- ブラウザ内で直接編集
- 自動保存（デバウンス付き）
- 編集履歴（Undo/Redo）
- 画像アップロード

#### F2.3 Git 連携モード

- リポジトリ URL 指定
- ブランチ選択
- ドキュメントルートフォルダ指定（例: `/docs`）
- Pull（手動 / Webhook 自動同期）
- 読み取り専用（コンフリクト防止のためブラウザ編集は無効化）

##### Git 認証方式

| 方式        | 対象                      |
| ----------- | ------------------------- |
| HTTPS + PAT | GitHub, GitLab, Bitbucket |
| SSH Key     | 任意の Git サーバー       |
| GitHub App  | GitHub（推奨）            |

### F3: RAG チャット

#### F3.1 チャット UI

- Cursor 風の 3 ペインレイアウト（Explorer / Document / Chat）
- ストリーミングレスポンス
- チャット履歴（会話ごと）
- コードブロックのコピー機能
- 引用元ドキュメントへのリンク

#### F3.2 RAG 動作仕様

- ドキュメント内容のみを情報源とする
- 回答不可時の明示的な応答（「ドキュメントに記載がありません」）
- 複数ドキュメントからの情報統合
- ソース引用の明示

#### F3.3 LLM プロバイダー

| プロバイダー    | モデル例                           |
| --------------- | ---------------------------------- |
| OpenAI          | gpt-4o, gpt-4o-mini                |
| Anthropic       | claude-4-5-sonnet, claude-4-5-opus |
| Ollama          | gpt-oss, qwen3                     |
| OpenAI 互換 API | Azure OpenAI, LocalAI 等           |

### F4: 管理機能

#### F4.1 ユーザー管理

- ユーザー一覧・検索
- ユーザー作成・編集・無効化
- グループ割り当て
- API 利用制限設定

#### F4.2 グループ管理

- グループ作成・編集・削除
- メンバー管理
- プロジェクトアクセス権設定

#### F4.3 プロジェクト設定

- 公開/非公開切り替え
- アクセス権限（閲覧者/編集者/管理者）
- Git 連携設定
- チャット機能の有効/無効

#### F4.4 システム設定

- LLM プロバイダー設定
- 埋め込みモデル設定
- デフォルトレート制限
- LDAP 接続設定

---

## 非機能要件

### NFR1: パフォーマンス

| 項目                 | 目標値         |
| -------------------- | -------------- |
| ドキュメント表示     | < 500ms (TTFB) |
| 検索応答             | < 1s           |
| RAG チャット初回応答 | < 3s           |
| 同時接続ユーザー     | 1,000+         |

### NFR2: セキュリティ

- HTTPS 必須
- CSRF 保護
- XSS 対策
- SQL インジェクション対策
- レート制限
- 監査ログ

### NFR3: 可用性

- 目標稼働率: 99.9%
- ヘルスチェックエンドポイント
- グレースフルシャットダウン

### NFR4: スケーラビリティ

- ステートレスなアプリケーション設計
- 水平スケーリング対応
- データベースコネクションプーリング

### NFR5: 運用性

- 構造化ログ出力（JSON）
- メトリクス公開（Prometheus 形式）
- バックアップ・リストア手順
- 設定の環境変数化

---

## URL 設計

### ルート構成

| パス                                        | 説明                 | 認証           |
| ------------------------------------------- | -------------------- | -------------- |
| `/`                                         | ダッシュボード       | 要             |
| `/login`                                    | ログイン             | 不要           |
| `/register`                                 | 新規登録             | 不要           |
| `/docs/{projectSlug}`                       | ドキュメントトップ   | 公開設定依存   |
| `/docs/{projectSlug}/{...docPath}`          | ドキュメントページ   | 公開設定依存   |
| `/docs/{projectSlug}/search`                | プロジェクト内検索   | 公開設定依存   |
| `/projects/new`                             | 新規プロジェクト作成 | 要             |
| `/projects/{projectSlug}/edit`              | エディタトップ       | 要（編集権限） |
| `/projects/{projectSlug}/edit/{...docPath}` | ドキュメント編集     | 要（編集権限） |
| `/projects/{projectSlug}/new`               | 新規ドキュメント作成 | 要（編集権限） |
| `/projects/{projectSlug}/settings`          | プロジェクト設定     | 要（管理権限） |
| `/chat/{projectSlug}`                       | RAG チャット         | 要             |
| `/chat/{projectSlug}/{conversationId}`      | チャット履歴         | 要             |
| `/admin`                                    | 管理画面トップ       | 要（管理者）   |
| `/admin/users`                              | ユーザー管理         | 要（管理者）   |
| `/admin/groups`                             | グループ管理         | 要（管理者）   |
| `/admin/settings`                           | システム設定         | 要（管理者）   |

### Next.js App Router 構成

```
app/
├── (auth)/                                   # 認証関連（Route Group）
│   ├── login/page.tsx                        # /login
│   └── register/page.tsx                     # /register
├── (public)/                                 # 公開ページ（Route Group）
│   └── docs/
│       └── [projectSlug]/
│           ├── page.tsx                      # /docs/{projectSlug}
│           ├── [...docPath]/page.tsx         # /docs/{projectSlug}/{...docPath}
│           └── search/page.tsx               # /docs/{projectSlug}/search
├── projects/
│   ├── new/page.tsx                          # /projects/new
│   └── [projectSlug]/
│       ├── edit/
│       │   ├── page.tsx                      # /projects/{projectSlug}/edit
│       │   └── [...docPath]/page.tsx         # /projects/{projectSlug}/edit/{...docPath}
│       ├── new/page.tsx                      # /projects/{projectSlug}/new
│       └── settings/page.tsx                 # /projects/{projectSlug}/settings
├── chat/
│   └── [projectSlug]/
│       ├── page.tsx                          # /chat/{projectSlug}
│       └── [conversationId]/page.tsx         # /chat/{projectSlug}/{conversationId}
├── admin/
│   ├── page.tsx                              # /admin
│   ├── users/page.tsx                        # /admin/users
│   ├── groups/page.tsx                       # /admin/groups
│   └── settings/page.tsx                     # /admin/settings
├── api/
│   └── auth/
│       └── [...nextauth]/route.ts            # NextAuth.js API Routes
├── page.tsx                                  # / (ダッシュボード)
├── layout.tsx
└── globals.css
```

---

## データベース設計

### 主要テーブル定義

#### users

| カラム        | 型           | 説明                                         |
| ------------- | ------------ | -------------------------------------------- |
| id            | UUID         | 主キー                                       |
| email         | VARCHAR(255) | メールアドレス（一意）                       |
| name          | VARCHAR(100) | 表示名                                       |
| password_hash | VARCHAR(255) | パスワードハッシュ（NULL 許容：OAuth 用）    |
| auth_provider | VARCHAR(50)  | 認証プロバイダー（local/ldap/google/github） |
| is_active     | BOOLEAN      | 有効フラグ                                   |
| is_admin      | BOOLEAN      | 管理者フラグ                                 |
| api_limit     | INTEGER      | API 呼び出し制限（NULL=無制限）              |
| created_at    | TIMESTAMP    | 作成日時                                     |
| updated_at    | TIMESTAMP    | 更新日時                                     |

#### projects

| カラム       | 型           | 説明                   |
| ------------ | ------------ | ---------------------- |
| id           | UUID         | 主キー                 |
| slug         | VARCHAR(100) | URL スラッグ（一意）   |
| name         | VARCHAR(200) | プロジェクト名         |
| description  | TEXT         | 説明                   |
| visibility   | ENUM         | public/private         |
| owner_id     | UUID         | オーナーユーザー ID    |
| git_url      | VARCHAR(500) | Git リポジトリ URL     |
| git_branch   | VARCHAR(100) | 同期ブランチ           |
| git_doc_root | VARCHAR(200) | ドキュメントルートパス |
| chat_enabled | BOOLEAN      | チャット機能有効フラグ |
| created_at   | TIMESTAMP    | 作成日時               |
| updated_at   | TIMESTAMP    | 更新日時               |

#### documents

| カラム     | 型           | 説明                        |
| ---------- | ------------ | --------------------------- |
| id         | UUID         | 主キー                      |
| project_id | UUID         | プロジェクト ID（外部キー） |
| path       | VARCHAR(500) | ドキュメントパス            |
| title      | VARCHAR(200) | タイトル                    |
| content    | TEXT         | マークダウンコンテンツ      |
| created_at | TIMESTAMP    | 作成日時                    |
| updated_at | TIMESTAMP    | 更新日時                    |

#### embeddings

| カラム      | 型        | 説明                                                 |
| ----------- | --------- | ---------------------------------------------------- |
| id          | UUID      | 主キー                                               |
| document_id | UUID      | ドキュメント ID（外部キー）                          |
| chunk_index | INTEGER   | チャンクインデックス                                 |
| chunk_text  | TEXT      | チャンクテキスト                                     |
| vector      | VECTOR    | 埋め込みベクトル（次元数は埋め込みモデル設定に依存） |
| metadata    | JSONB     | メタデータ（見出し階層等）                           |
| created_at  | TIMESTAMP | 作成日時                                             |

#### groups

| カラム      | 型           | 説明       |
| ----------- | ------------ | ---------- |
| id          | UUID         | 主キー     |
| name        | VARCHAR(100) | グループ名 |
| description | TEXT         | 説明       |
| created_at  | TIMESTAMP    | 作成日時   |
| updated_at  | TIMESTAMP    | 更新日時   |

#### group_members

| カラム     | 型        | 説明                    |
| ---------- | --------- | ----------------------- |
| id         | UUID      | 主キー                  |
| group_id   | UUID      | グループ ID（外部キー） |
| user_id    | UUID      | ユーザー ID（外部キー） |
| created_at | TIMESTAMP | 作成日時                |

#### project_members

| カラム     | 型          | 説明                             |
| ---------- | ----------- | -------------------------------- |
| id         | UUID        | 主キー                           |
| project_id | UUID        | プロジェクト ID（外部キー）      |
| group_id   | UUID        | グループ ID（外部キー、NULL 可） |
| user_id    | UUID        | ユーザー ID（外部キー、NULL 可） |
| role       | VARCHAR(20) | ロール（viewer/editor/admin）    |
| created_at | TIMESTAMP   | 作成日時                         |
| updated_at | TIMESTAMP   | 更新日時                         |

※ group_id または user_id のいずれかを指定（排他的）

#### conversations

| カラム     | 型           | 説明                        |
| ---------- | ------------ | --------------------------- |
| id         | UUID         | 主キー                      |
| project_id | UUID         | プロジェクト ID（外部キー） |
| user_id    | UUID         | ユーザー ID（外部キー）     |
| title      | VARCHAR(200) | 会話タイトル                |
| created_at | TIMESTAMP    | 作成日時                    |
| updated_at | TIMESTAMP    | 更新日時                    |

#### messages

| カラム          | 型          | 説明                              |
| --------------- | ----------- | --------------------------------- |
| id              | UUID        | 主キー                            |
| conversation_id | UUID        | 会話 ID（外部キー）               |
| role            | VARCHAR(20) | ロール（user/assistant）          |
| content         | TEXT        | メッセージ内容                    |
| sources         | JSONB       | 引用元ドキュメント情報（NULL 可） |
| created_at      | TIMESTAMP   | 作成日時                          |

---

## API 設計

### 認証

```
POST   /api/v1/auth/register       # ユーザー新規登録
POST   /api/v1/auth/login          # ログイン
POST   /api/v1/auth/logout         # ログアウト
POST   /api/v1/auth/refresh        # トークンリフレッシュ
GET    /api/v1/auth/me             # 現在のユーザー情報
```

### プロジェクト

```
GET    /api/v1/projects            # プロジェクト一覧
POST   /api/v1/projects            # プロジェクト作成
GET    /api/v1/projects/{slug}     # プロジェクト詳細
PATCH  /api/v1/projects/{slug}     # プロジェクト更新
DELETE /api/v1/projects/{slug}     # プロジェクト削除
```

### ドキュメント

```
GET    /api/v1/projects/{slug}/docs                 # ドキュメント一覧（ツリー）
GET    /api/v1/projects/{slug}/docs/{path}          # ドキュメント取得
PUT    /api/v1/projects/{slug}/docs/{path}          # ドキュメント作成・更新
DELETE /api/v1/projects/{slug}/docs/{path}          # ドキュメント削除
POST   /api/v1/projects/{slug}/docs/{path}/move     # ドキュメント移動
```

### 検索

```
GET    /api/v1/projects/{slug}/search?q={query}     # 全文検索
```

### RAG チャット

```
GET    /api/v1/projects/{slug}/conversations        # 会話一覧
POST   /api/v1/projects/{slug}/conversations        # 新規会話
GET    /api/v1/projects/{slug}/conversations/{id}   # 会話詳細
DELETE /api/v1/projects/{slug}/conversations/{id}   # 会話削除
POST   /api/v1/projects/{slug}/chat                 # チャットメッセージ送信（SSE）
```

### Git 連携

```
POST   /api/v1/projects/{slug}/git/pull             # Gitからプル
POST   /api/v1/projects/{slug}/git/push             # Gitへプッシュ
GET    /api/v1/projects/{slug}/git/status           # Git状態取得
POST   /api/v1/projects/{slug}/git/webhook          # Webhook受信
```

### 管理

```
GET    /api/v1/admin/users                          # ユーザー一覧
POST   /api/v1/admin/users                          # ユーザー作成
PATCH  /api/v1/admin/users/{id}                     # ユーザー更新
DELETE /api/v1/admin/users/{id}                     # ユーザー削除

GET    /api/v1/admin/groups                         # グループ一覧
POST   /api/v1/admin/groups                         # グループ作成
PATCH  /api/v1/admin/groups/{id}                    # グループ更新
DELETE /api/v1/admin/groups/{id}                    # グループ削除

GET    /api/v1/admin/settings                       # システム設定取得
PATCH  /api/v1/admin/settings                       # システム設定更新
```

---

## RAG アーキテクチャ

### 処理フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                        Indexing Pipeline                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Document    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  (Markdown)  │ Chunking │───▶│Embedding │───▶│  Store   │      │
│      │       │ Strategy │    │  Model   │    │(pgvector)│      │
│      ▼       └──────────┘    └──────────┘    └──────────┘      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ 1. ヘッダーベース分割 (## / ### で分割)              │      │
│  │ 2. 最大チャンクサイズ: 1000 tokens                   │      │
│  │ 3. オーバーラップ: 200 tokens                        │      │
│  │ 4. メタデータ付与: 見出し階層、ファイルパス          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Query Pipeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Query                                                     │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────┐                                                   │
│  │  Query   │  クエリの書き換え・拡張                          │
│  │ Rewrite  │                                                   │
│  └────┬─────┘                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────┐              │
│  │          Hybrid Search                       │              │
│  │  ┌─────────────┐    ┌─────────────┐         │              │
│  │  │   Vector    │    │  Keyword    │         │              │
│  │  │   Search    │    │   Search    │         │              │
│  │  │ (pgvector)  │    │ (pg_trgm)   │         │              │
│  │  └──────┬──────┘    └──────┬──────┘         │              │
│  │         │                  │                 │              │
│  │         └────────┬─────────┘                 │              │
│  │                  ▼                           │              │
│  │           ┌──────────┐                       │              │
│  │           │  Re-rank │  RRF (Reciprocal     │              │
│  │           │          │  Rank Fusion)        │              │
│  │           └────┬─────┘                       │              │
│  └────────────────┼─────────────────────────────┘              │
│                   │                                             │
│                   ▼                                             │
│  ┌──────────────────────────────────────────────┐              │
│  │         Context Assembly                     │              │
│  │  - Top-K chunks (k=5~10)                    │              │
│  │  - Total context: max 4000 tokens          │              │
│  │  - ソースURL付与                            │              │
│  └────────────────┬─────────────────────────────┘              │
│                   │                                             │
│                   ▼                                             │
│  ┌──────────────────────────────────────────────┐              │
│  │              LLM Generation                  │              │
│  │  - System prompt (制約: ドキュメント内のみ) │              │
│  │  - Streaming response                       │              │
│  │  - Citation injection                       │              │
│  └──────────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 埋め込みモデル

| プロバイダー | モデル                 | 次元数 | 備考           |
| ------------ | ---------------------- | ------ | -------------- |
| OpenAI       | text-embedding-3-small | 1536   | コスト効率良好 |
| OpenAI       | text-embedding-3-large | 3072   | 高精度         |
| Ollama       | nomic-embed-text       | 768    | ローカル実行   |
| HuggingFace  | multilingual-e5-large  | 1024   | 多言語対応     |

> **注意**: 埋め込みモデルの次元数はモデルごとに異なります。システム設定で選択したモデルに応じて、`embeddings` テーブルのベクトル次元数が決定されます。一度設定したモデルを変更する場合は、既存の埋め込みデータの再生成が必要です。

### システムプロンプト（例）

```
あなたは「{project_name}」のドキュメントに関する質問に回答するアシスタントです。

## 制約事項
1. 回答は提供されたドキュメントの内容のみに基づいてください
2. ドキュメントに記載がない情報については「この情報はドキュメントに記載されていません」と回答してください
3. 推測や一般的な知識での補完は行わないでください
4. 回答の根拠となるドキュメントページを引用してください

## 参照ドキュメント
{context}

## ユーザーの質問
{question}
```

---

## 認証・認可

### 認証フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐                                                │
│  │   User     │                                                │
│  └─────┬──────┘                                                │
│        │                                                        │
│        ▼                                                        │
│  ┌─────────────────────────────────────────────┐               │
│  │            NextAuth.js (Frontend)           │               │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │               │
│  │  │Credential│ │  LDAP   │ │  OAuth  │       │               │
│  │  │Provider │ │ Provider│ │ Provider│       │               │
│  │  └────┬────┘ └────┬────┘ └────┬────┘       │               │
│  │       │           │           │             │               │
│  │       └───────────┼───────────┘             │               │
│  │                   ▼                         │               │
│  │            ┌──────────┐                     │               │
│  │            │  JWT     │                     │               │
│  │            │ Session  │                     │               │
│  │            └────┬─────┘                     │               │
│  └─────────────────┼───────────────────────────┘               │
│                    │                                            │
│                    ▼                                            │
│  ┌─────────────────────────────────────────────┐               │
│  │            FastAPI (Backend)                │               │
│  │            JWT Validation                   │               │
│  │            ┌──────────┐                     │               │
│  │            │  JWKS    │  公開鍵による検証   │               │
│  │            │ Endpoint │                     │               │
│  │            └──────────┘                     │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 認可モデル

```
Role-Based Access Control (RBAC)

ユーザー ─belongs to─▶ グループ ─has access─▶ プロジェクト
                            │
                            └─ role: viewer / editor / admin

プロジェクトロール:
- viewer:  閲覧のみ
- editor:  閲覧 + 編集
- admin:   閲覧 + 編集 + 設定変更

システムロール:
- user:    一般ユーザー
- admin:   システム管理者（全プロジェクトアクセス可）
```

### OAuth プロバイダー

| プロバイダー | 用途                 |
| ------------ | -------------------- |
| Google       | 一般ユーザー向け     |
| GitHub       | 開発者向け           |
| LDAP         | エンタープライズ向け |

---

## デプロイメント

### Docker Compose 構成

```yaml
# docker-compose.yml 構成イメージ
services:
  nginx: # リバースプロキシ
  frontend: # Next.js
  backend: # FastAPI
  postgres: # PostgreSQL + pgvector
  redis: # セッション・キャッシュ
```

### 環境変数

```bash
# 必須
DATABASE_URL=postgresql://user:pass@postgres:5432/ragxuary
REDIS_URL=redis://redis:6379
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# LLM設定
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
OLLAMA_BASE_URL=http://ollama:11434

# オプション
LDAP_URL=ldap://ldap.example.com
LDAP_BASE_DN=dc=example,dc=com
```

### システム要件（最小構成）

| リソース | 最小値  | 推奨値   |
| -------- | ------- | -------- |
| CPU      | 2 cores | 4+ cores |
| Memory   | 4 GB    | 8+ GB    |
| Storage  | 20 GB   | 100+ GB  |

---

## MVP 定義

### Phase 1: MVP（v0.1.0）

**スコープ:**

- [ ] ユーザー認証（メール+パスワード）
- [ ] プロジェクト作成・管理
- [ ] マークダウンエディタ（Web 編集モードのみ）
- [ ] ドキュメント閲覧
- [ ] 基本的な RAG チャット（OpenAI）
- [ ] Docker Compose デプロイ

**除外:**

- Git 連携
- LDAP 認証
- OAuth
- ローカル LLM 対応

### Phase 2: 拡張（v0.2.0）

- [ ] Git 連携モード
- [ ] OAuth 認証（Google, GitHub）
- [ ] グループ・権限管理
- [ ] 全文検索

### Phase 3: エンタープライズ（v0.3.0）

- [ ] LDAP 対応
- [ ] ローカル LLM 対応（Ollama）
- [ ] 監査ログ
- [ ] API 利用制限

### Phase 4: 高度な機能（v1.0.0）

- [ ] マルチ言語対応
- [ ] アナリティクス
- [ ] カスタムドメイン
- [ ] プラグインシステム

---

## 付録

### 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LangChain Documentation](https://python.langchain.com/)
- [pgvector](https://github.com/pgvector/pgvector)
- [shadcn/ui](https://ui.shadcn.com/)

### 用語集

| 用語      | 説明                                           |
| --------- | ---------------------------------------------- |
| RAG       | Retrieval-Augmented Generation。検索拡張生成。 |
| Embedding | テキストを数値ベクトルに変換したもの           |
| Chunk     | ドキュメントを分割した単位                     |
| pgvector  | PostgreSQL のベクトル検索拡張                  |
