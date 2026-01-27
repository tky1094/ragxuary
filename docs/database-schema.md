# ragxuary データベーススキーマ定義

> 本ドキュメントは ragxuary のデータベーステーブル定義を記載する。

---

## 目次

1. [users](#users)
2. [projects](#projects)
3. [tags](#tags)
4. [project_tags](#project_tags)
5. [project_bookmarks](#project_bookmarks)
6. [project_versions](#project_versions)
7. [git_credentials](#git_credentials)
8. [documents](#documents)
9. [document_revisions](#document_revisions)
10. [document_snapshots](#document_snapshots)
11. [uploads](#uploads)
12. [embeddings](#embeddings)
13. [groups](#groups)
14. [group_members](#group_members)
15. [project_members](#project_members)
16. [conversations](#conversations)
17. [messages](#messages)
18. [audit_logs](#audit_logs)
19. [settings](#settings)

---

## users

ユーザー情報を管理するテーブル。

| カラム           | 型           | NULL | 説明                                         |
| ---------------- | ------------ | ---- | -------------------------------------------- |
| id               | UUID         | NO   | 主キー                                       |
| email            | VARCHAR(255) | NO   | メールアドレス（一意）                       |
| name             | VARCHAR(100) | NO   | 表示名                                       |
| avatar_url       | VARCHAR(500) | YES  | アバター画像 URL（NULL=Gravatar/デフォルト） |
| password_hash    | VARCHAR(255) | YES  | パスワードハッシュ（NULL：OAuth 用）         |
| auth_provider    | VARCHAR(50)  | NO   | 認証プロバイダー（local/ldap/google/github） |
| is_active        | BOOLEAN      | NO   | 有効フラグ（デフォルト: true）               |
| is_admin         | BOOLEAN      | NO   | 管理者フラグ（デフォルト: false）            |
| api_limit        | INTEGER      | YES  | API 呼び出し制限（NULL=無制限）              |
| preferred_locale | VARCHAR(10)  | YES  | 優先言語（ja/en、NULL=ブラウザ設定に従う）   |
| created_at       | TIMESTAMP    | NO   | 作成日時                                     |
| updated_at       | TIMESTAMP    | NO   | 更新日時                                     |

**インデックス:**

- `users_email_key` UNIQUE (email)

---

## projects

プロジェクト情報を管理するテーブル。

| カラム       | 型           | NULL | 説明                          |
| ------------ | ------------ | ---- | ----------------------------- |
| id           | UUID         | NO   | 主キー                        |
| slug         | VARCHAR(100) | NO   | URL スラッグ（一意）          |
| name         | VARCHAR(200) | NO   | プロジェクト名                |
| description  | TEXT         | YES  | 説明                          |
| visibility   | VARCHAR(20)  | NO   | 公開設定（public/private）    |
| owner_id     | UUID         | NO   | オーナーユーザー ID（FK）     |
| git_url      | VARCHAR(500) | YES  | Git リポジトリ URL            |
| git_branch   | VARCHAR(100) | YES  | 同期ブランチ                  |
| git_doc_root | VARCHAR(200) | YES  | ドキュメントルートパス        |
| chat_enabled | BOOLEAN      | NO   | チャット機能有効フラグ        |
| created_at   | TIMESTAMP    | NO   | 作成日時                      |
| updated_at   | TIMESTAMP    | NO   | 更新日時                      |

**インデックス:**

- `projects_slug_key` UNIQUE (slug)

**外部キー:**

- `owner_id` → `users(id)` ON DELETE RESTRICT

---

## tags

タグのマスター情報を管理するテーブル。

| カラム     | 型          | NULL | 説明                                     |
| ---------- | ----------- | ---- | ---------------------------------------- |
| id         | UUID        | NO   | 主キー                                   |
| name       | VARCHAR(50) | NO   | タグ名（一意）                           |
| color      | VARCHAR(20) | YES  | 色（NULL=gray）                          |
| created_at | TIMESTAMP   | NO   | 作成日時                                 |

**インデックス:**

- `tags_name_key` UNIQUE (name)

**備考:**

- `color` の有効値: `gray`, `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`
- NULL の場合は `gray` として扱う

---

## project_tags

プロジェクトとタグの関連を管理する中間テーブル。

| カラム     | 型   | NULL | 説明                  |
| ---------- | ---- | ---- | --------------------- |
| project_id | UUID | NO   | プロジェクト ID（FK） |
| tag_id     | UUID | NO   | タグ ID（FK）         |

**インデックス:**

- `project_tags_pkey` PRIMARY KEY (project_id, tag_id)
- `project_tags_tag_idx` (tag_id)

**外部キー:**

- `project_id` → `projects(id)` ON DELETE CASCADE
- `tag_id` → `tags(id)` ON DELETE CASCADE

---

## project_bookmarks

ユーザーのプロジェクトブックマークを管理するテーブル。

| カラム     | 型        | NULL | 説明                  |
| ---------- | --------- | ---- | --------------------- |
| user_id    | UUID      | NO   | ユーザー ID（FK）     |
| project_id | UUID      | NO   | プロジェクト ID（FK） |
| created_at | TIMESTAMP | NO   | 作成日時              |

**インデックス:**

- `project_bookmarks_pkey` PRIMARY KEY (user_id, project_id)

**外部キー:**

- `user_id` → `users(id)` ON DELETE CASCADE
- `project_id` → `projects(id)` ON DELETE CASCADE

---

## project_versions

プロジェクトのバージョン（版）を管理するテーブル。

| カラム       | 型           | NULL | 説明                              |
| ------------ | ------------ | ---- | --------------------------------- |
| id           | UUID         | NO   | 主キー                            |
| project_id   | UUID         | NO   | プロジェクト ID（FK）             |
| version      | VARCHAR(50)  | NO   | バージョン番号（"1.0.0" など）    |
| name         | VARCHAR(100) | YES  | バージョン名（"初版" など）       |
| description  | TEXT         | YES  | リリースノート                    |
| is_published | BOOLEAN      | NO   | 公開フラグ（デフォルト: false）   |
| published_at | TIMESTAMP    | YES  | 公開日時                          |
| created_at   | TIMESTAMP    | NO   | 作成日時                          |

**インデックス:**

- `project_versions_project_version_key` UNIQUE (project_id, version)

**外部キー:**

- `project_id` → `projects(id)` ON DELETE CASCADE

---

## git_credentials

Git 連携の認証情報を管理するテーブル。

| カラム               | 型          | NULL | 説明                                  |
| -------------------- | ----------- | ---- | ------------------------------------- |
| id                   | UUID        | NO   | 主キー                                |
| project_id           | UUID        | NO   | プロジェクト ID（FK、一意）           |
| auth_type            | VARCHAR(20) | NO   | 認証種別（pat/ssh/github_app）        |
| encrypted_credential | TEXT        | NO   | 暗号化された認証情報                  |
| created_at           | TIMESTAMP   | NO   | 作成日時                              |
| updated_at           | TIMESTAMP   | NO   | 更新日時                              |

**インデックス:**

- `git_credentials_project_key` UNIQUE (project_id)

**外部キー:**

- `project_id` → `projects(id)` ON DELETE CASCADE

**備考:**

- `auth_type` の値: `pat`（Personal Access Token）, `ssh`（SSH Key）, `github_app`（GitHub App）
- `encrypted_credential` はアプリケーション側で暗号化して保存
- 1 プロジェクトにつき 1 つの認証情報

---

## documents

ドキュメント情報を管理するテーブル。階層構造をサポート。

| カラム     | 型           | NULL | 説明                                    |
| ---------- | ------------ | ---- | --------------------------------------- |
| id         | UUID         | NO   | 主キー                                  |
| project_id | UUID         | NO   | プロジェクト ID（FK）                   |
| parent_id  | UUID         | YES  | 親ドキュメント ID（FK、NULL=ルート）    |
| slug       | VARCHAR(200) | NO   | URL 用識別子（同階層内で一意）          |
| path       | VARCHAR(500) | NO   | フルパス（検索用、parent_id/slug から生成） |
| index      | INTEGER      | NO   | 同階層内での並び順（デフォルト: 0）     |
| is_folder  | BOOLEAN      | NO   | フォルダフラグ（デフォルト: false）     |
| title      | VARCHAR(200) | NO   | タイトル                                |
| content    | TEXT         | YES  | マークダウンコンテンツ（フォルダは NULL） |
| created_at | TIMESTAMP    | NO   | 作成日時                                |
| updated_at | TIMESTAMP    | NO   | 更新日時                                |

**インデックス:**

- `documents_project_path_key` UNIQUE (project_id, path)
- `documents_parent_slug_key` UNIQUE (project_id, parent_id, slug)
- `documents_project_parent_idx` (project_id, parent_id, index)

**外部キー:**

- `project_id` → `projects(id)` ON DELETE CASCADE
- `parent_id` → `documents(id)` ON DELETE CASCADE

**備考:**

- `path` は `parent_id` と `slug` から自動生成される派生データ
- 親ドキュメントが移動した場合、子孫の `path` も再計算が必要
- フォルダ（`is_folder=true`）の場合、`content` は NULL

---

## document_revisions

ドキュメントの編集履歴を管理するテーブル。変更ごとに記録され、差分表示に使用。

| カラム      | 型        | NULL | 説明                                     |
| ----------- | --------- | ---- | ---------------------------------------- |
| id          | UUID      | NO   | 主キー                                   |
| document_id | UUID      | NO   | ドキュメント ID（FK）                    |
| user_id     | UUID      | YES  | 変更したユーザー ID（FK、削除時 NULL）   |
| content     | TEXT      | NO   | 変更後のコンテンツ                       |
| created_at  | TIMESTAMP | NO   | 変更日時                                 |

**インデックス:**

- `document_revisions_document_idx` (document_id, created_at DESC)
- `document_revisions_user_idx` (user_id, created_at DESC)

**外部キー:**

- `document_id` → `documents(id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE SET NULL

**備考:**

- ドキュメント保存時に自動的にリビジョンを作成
- 差分表示は前後のリビジョンの `content` を比較してアプリケーション側で計算
- `document_snapshots`（公開版）とは独立して管理
- ユーザー削除後も編集履歴は保持（`ON DELETE SET NULL`）
- 古いリビジョンの自動削除ポリシーを検討（例: 最新 100 件のみ保持）

---

## document_snapshots

バージョン公開時のドキュメントスナップショットを管理するテーブル。

| カラム               | 型           | NULL | 説明                                  |
| -------------------- | ------------ | ---- | ------------------------------------- |
| id                   | UUID         | NO   | 主キー                                |
| version_id           | UUID         | NO   | プロジェクトバージョン ID（FK）       |
| original_document_id | UUID         | YES  | 元ドキュメント ID（FK、削除時 NULL）  |
| parent_snapshot_id   | UUID         | YES  | 親スナップショット ID（FK、NULL=ルート）|
| slug                 | VARCHAR(200) | NO   | URL 用識別子                          |
| path                 | VARCHAR(500) | NO   | フルパス                              |
| index                | INTEGER      | NO   | 同階層内での並び順                    |
| is_folder            | BOOLEAN      | NO   | フォルダフラグ                        |
| title                | VARCHAR(200) | NO   | タイトル                              |
| content              | TEXT         | YES  | マークダウンコンテンツ                |
| created_at           | TIMESTAMP    | NO   | 作成日時                              |

**インデックス:**

- `document_snapshots_version_path_key` UNIQUE (version_id, path)
- `document_snapshots_version_parent_idx` (version_id, parent_snapshot_id, index)

**外部キー:**

- `version_id` → `project_versions(id)` ON DELETE CASCADE
- `original_document_id` → `documents(id)` ON DELETE SET NULL
- `parent_snapshot_id` → `document_snapshots(id)` ON DELETE CASCADE

**備考:**

- バージョン作成時に `documents` の内容をコピーして作成
- `original_document_id` は参照用（元ドキュメントが削除されても履歴は残る）
- 階層構造は `parent_snapshot_id` で管理（スナップショット内で独立）

---

## uploads

アップロードされたファイル（画像など）を管理するテーブル。

| カラム       | 型           | NULL | 説明                            |
| ------------ | ------------ | ---- | ------------------------------- |
| id           | UUID         | NO   | 主キー                          |
| user_id      | UUID         | NO   | アップロードユーザー ID（FK）   |
| project_id   | UUID         | YES  | プロジェクト ID（FK、NULL=共有）|
| filename     | VARCHAR(255) | NO   | 元のファイル名                  |
| storage_path | VARCHAR(500) | NO   | ストレージ上のパス              |
| mime_type    | VARCHAR(100) | NO   | MIME タイプ                     |
| size_bytes   | BIGINT       | NO   | ファイルサイズ（バイト）        |
| created_at   | TIMESTAMP    | NO   | 作成日時                        |

**インデックス:**

- `uploads_user_idx` (user_id, created_at DESC)
- `uploads_project_idx` (project_id, created_at DESC)

**外部キー:**

- `user_id` → `users(id)` ON DELETE CASCADE
- `project_id` → `projects(id)` ON DELETE CASCADE

**備考:**

- 実際のファイルはローカルストレージまたは S3 互換ストレージに保存
- `storage_path` は相対パスまたは S3 キーを格納
- プロジェクト削除時は関連ファイルも削除

---

## embeddings

ドキュメントの埋め込みベクトルを管理するテーブル。

| カラム      | 型           | NULL | 説明                                                 |
| ----------- | ------------ | ---- | ---------------------------------------------------- |
| id          | UUID         | NO   | 主キー                                               |
| document_id | UUID         | NO   | ドキュメント ID（FK）                                |
| chunk_index | INTEGER      | NO   | チャンクインデックス                                 |
| chunk_text  | TEXT         | NO   | チャンクテキスト                                     |
| model_name  | VARCHAR(100) | NO   | 埋め込みモデル名                                     |
| vector      | VECTOR       | NO   | 埋め込みベクトル（次元数は埋め込みモデル設定に依存） |
| metadata    | JSONB        | YES  | メタデータ（見出し階層等）                           |
| created_at  | TIMESTAMP    | NO   | 作成日時                                             |

**インデックス:**

- `embeddings_document_chunk_key` UNIQUE (document_id, chunk_index)
- `embeddings_vector_idx` USING ivfflat (vector vector_cosine_ops)
- `embeddings_model_idx` (model_name)

**外部キー:**

- `document_id` → `documents(id)` ON DELETE CASCADE

**備考:**

- `model_name` の例: `text-embedding-3-small`, `text-embedding-3-large`, `nomic-embed-text`
- 埋め込みモデルの次元数はモデルごとに異なる
- モデル変更時は `model_name` でフィルタして再生成対象を特定可能

---

## groups

グループ情報を管理するテーブル。

| カラム      | 型           | NULL | 説明       |
| ----------- | ------------ | ---- | ---------- |
| id          | UUID         | NO   | 主キー     |
| name        | VARCHAR(100) | NO   | グループ名 |
| description | TEXT         | YES  | 説明       |
| created_at  | TIMESTAMP    | NO   | 作成日時   |
| updated_at  | TIMESTAMP    | NO   | 更新日時   |

**インデックス:**

- `groups_name_key` UNIQUE (name)

---

## group_members

グループとユーザーの関連を管理する中間テーブル。

| カラム     | 型        | NULL | 説明              |
| ---------- | --------- | ---- | ----------------- |
| id         | UUID      | NO   | 主キー            |
| group_id   | UUID      | NO   | グループ ID（FK） |
| user_id    | UUID      | NO   | ユーザー ID（FK） |
| created_at | TIMESTAMP | NO   | 作成日時          |

**インデックス:**

- `group_members_group_user_key` UNIQUE (group_id, user_id)

**外部キー:**

- `group_id` → `groups(id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE CASCADE

---

## project_members

プロジェクトへのアクセス権限を管理するテーブル。

| カラム     | 型          | NULL | 説明                             |
| ---------- | ----------- | ---- | -------------------------------- |
| id         | UUID        | NO   | 主キー                           |
| project_id | UUID        | NO   | プロジェクト ID（FK）            |
| group_id   | UUID        | YES  | グループ ID（FK、user_id と排他） |
| user_id    | UUID        | YES  | ユーザー ID（FK、group_id と排他）|
| role       | VARCHAR(20) | NO   | ロール（viewer/editor/admin）    |
| created_at | TIMESTAMP   | NO   | 作成日時                         |
| updated_at | TIMESTAMP   | NO   | 更新日時                         |

**インデックス:**

- `project_members_project_group_key` UNIQUE (project_id, group_id) WHERE group_id IS NOT NULL
- `project_members_project_user_key` UNIQUE (project_id, user_id) WHERE user_id IS NOT NULL

**外部キー:**

- `project_id` → `projects(id)` ON DELETE CASCADE
- `group_id` → `groups(id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE CASCADE

**制約:**

- CHECK ((group_id IS NOT NULL AND user_id IS NULL) OR (group_id IS NULL AND user_id IS NOT NULL))

---

## conversations

RAG チャットの会話を管理するテーブル。

| カラム     | 型           | NULL | 説明                           |
| ---------- | ------------ | ---- | ------------------------------ |
| id         | UUID         | NO   | 主キー                         |
| project_id | UUID         | NO   | プロジェクト ID（FK）          |
| user_id    | UUID         | NO   | ユーザー ID（FK）              |
| title      | VARCHAR(200) | YES  | 会話タイトル                   |
| model_name | VARCHAR(100) | YES  | 使用 LLM モデル名              |
| created_at | TIMESTAMP    | NO   | 作成日時                       |
| updated_at | TIMESTAMP    | NO   | 更新日時                       |

**インデックス:**

- `conversations_project_user_idx` (project_id, user_id, created_at DESC)

**外部キー:**

- `project_id` → `projects(id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE CASCADE

**備考:**

- `model_name` の例: `gpt-4o`, `gpt-4o-mini`, `claude-sonnet-4-20250514`

---

## messages

チャットメッセージを管理するテーブル。

| カラム          | 型          | NULL | 説明                                   |
| --------------- | ----------- | ---- | -------------------------------------- |
| id              | UUID        | NO   | 主キー                                 |
| conversation_id | UUID        | NO   | 会話 ID（FK）                          |
| role            | VARCHAR(20) | NO   | ロール（user/assistant）               |
| content         | TEXT        | NO   | メッセージ内容                         |
| sources         | JSONB       | YES  | 引用元ドキュメント情報                 |
| tokens_used     | INTEGER     | YES  | トークン使用量（assistant のみ）       |
| created_at      | TIMESTAMP   | NO   | 作成日時                               |

**インデックス:**

- `messages_conversation_idx` (conversation_id, created_at)

**外部キー:**

- `conversation_id` → `conversations(id)` ON DELETE CASCADE

**備考:**

- `tokens_used` は LLM API レスポンスから取得（user メッセージは NULL）
- API 利用制限のカウントや利用状況分析に使用

---

## audit_logs

システム全体の監査ログを管理するテーブル。

| カラム      | 型           | NULL | 説明                                       |
| ----------- | ------------ | ---- | ------------------------------------------ |
| id          | UUID         | NO   | 主キー                                     |
| user_id     | UUID         | YES  | 実行ユーザー ID（FK、NULL=システム）       |
| action      | VARCHAR(50)  | NO   | アクション種別                             |
| target_type | VARCHAR(50)  | NO   | 対象の種類（project/document/user など）   |
| target_id   | UUID         | YES  | 対象の ID                                  |
| details     | JSONB        | YES  | 変更内容などの詳細                         |
| ip_address  | VARCHAR(45)  | YES  | クライアント IP アドレス                   |
| user_agent  | VARCHAR(500) | YES  | ユーザーエージェント                       |
| created_at  | TIMESTAMP    | NO   | 作成日時                                   |

**インデックス:**

- `audit_logs_user_idx` (user_id, created_at DESC)
- `audit_logs_target_idx` (target_type, target_id, created_at DESC)
- `audit_logs_action_idx` (action, created_at DESC)
- `audit_logs_created_at_idx` (created_at DESC)

**外部キー:**

- `user_id` → `users(id)` ON DELETE SET NULL

**備考:**

- `action` の例: `create`, `update`, `delete`, `login`, `logout`, `publish_version`
- `target_type` の例: `project`, `document`, `user`, `group`, `project_version`
- ユーザー削除後も監査ログは保持（`ON DELETE SET NULL`）
- 古いログは定期的にアーカイブ/削除を検討

---

## settings

システム設定をキーバリュー形式で管理するテーブル。

| カラム     | 型           | NULL | 説明                 |
| ---------- | ------------ | ---- | -------------------- |
| key        | VARCHAR(100) | NO   | 設定キー（主キー）   |
| value      | JSONB        | NO   | 設定値               |
| updated_at | TIMESTAMP    | NO   | 更新日時             |

**インデックス:**

- `settings_pkey` PRIMARY KEY (key)

**設定キー一覧:**

| キー | 値の型 | 説明 |
|------|--------|------|
| `site_name` | `string` | サイト名 |
| `default_locale` | `string` | デフォルト言語（`ja` / `en`） |
| `registration_enabled` | `boolean` | 新規ユーザー登録の許可 |
| `allow_public_projects` | `boolean` | 公開プロジェクトの許可 |
| `default_api_limit` | `number` | デフォルト API 制限（回/日） |
| `chat_rate_limit` | `number` | チャット制限（回/分） |
| `oauth_google_enabled` | `boolean` | Google OAuth 有効/無効 |
| `oauth_github_enabled` | `boolean` | GitHub OAuth 有効/無効 |
| `ldap_enabled` | `boolean` | LDAP 認証有効/無効 |
| `llm_providers` | `object[]` | LLM プロバイダー設定（下記参照） |
| `default_llm_provider` | `string` | デフォルト LLM プロバイダー ID |
| `default_embedding_model` | `string` | デフォルト埋め込みモデル |
| `rag_chunk_size` | `number` | チャンクサイズ（トークン） |
| `rag_chunk_overlap` | `number` | チャンクオーバーラップ |
| `rag_retrieval_top_k` | `number` | 検索で取得するチャンク数 |
| `rag_max_context_tokens` | `number` | コンテキスト最大トークン |

**llm_providers の構造:**

```json
[
  {
    "id": "openai-1",
    "name": "OpenAI",
    "provider_type": "openai",
    "api_key": "sk-xxx (encrypted)",
    "base_url": null,
    "models": ["gpt-4o", "gpt-4o-mini"],
    "is_enabled": true
  },
  {
    "id": "ollama-1",
    "name": "Local Ollama",
    "provider_type": "ollama",
    "api_key": null,
    "base_url": "http://localhost:11434",
    "models": ["llama3", "qwen3"],
    "is_enabled": true
  }
]
```

---

## 付録

### パス再計算のサンプルクエリ

ドキュメント移動時に子孫の `path` を再計算する例：

```sql
WITH RECURSIVE descendants AS (
  -- 移動したドキュメント自身
  SELECT id, parent_id, slug,
         CASE
           WHEN parent_id IS NULL THEN slug
           ELSE (SELECT path FROM documents WHERE id = d.parent_id) || '/' || slug
         END AS new_path
  FROM documents d
  WHERE id = :moved_document_id

  UNION ALL

  -- 子孫を再帰的に取得
  SELECT d.id, d.parent_id, d.slug,
         desc.new_path || '/' || d.slug
  FROM documents d
  JOIN descendants desc ON d.parent_id = desc.id
)
UPDATE documents
SET path = descendants.new_path,
    updated_at = NOW()
FROM descendants
WHERE documents.id = descendants.id;
```

### ドキュメント編集履歴の取得

ドキュメントの編集履歴を取得する例：

```sql
SELECT
  dr.id,
  dr.content,
  dr.created_at,
  u.id AS user_id,
  u.name AS user_name,
  u.avatar_url
FROM document_revisions dr
LEFT JOIN users u ON dr.user_id = u.id
WHERE dr.document_id = :document_id
ORDER BY dr.created_at DESC
LIMIT 50;
```

### 差分表示用の連続リビジョン取得

2 つの連続するリビジョンを取得して差分計算に使用：

```sql
WITH ranked_revisions AS (
  SELECT
    id,
    content,
    created_at,
    user_id,
    LAG(content) OVER (ORDER BY created_at) AS previous_content
  FROM document_revisions
  WHERE document_id = :document_id
)
SELECT
  rr.id,
  rr.content AS current_content,
  rr.previous_content,
  rr.created_at,
  u.name AS user_name
FROM ranked_revisions rr
LEFT JOIN users u ON rr.user_id = u.id
WHERE rr.id = :revision_id;
