# Issue 駆動開発ワークフロー

このドキュメントでは、ragxuary プロジェクトにおける Issue 駆動開発のワークフローと確認フローを定義します。

---

## 目次

1. [概要](#概要)
2. [Issue 作成ガイドライン](#issue-作成ガイドライン)
3. [開発フロー](#開発フロー)
4. [確認フロー](#確認フロー)
5. [コマンドリファレンス](#コマンドリファレンス)

---

## 概要

本プロジェクトでは、すべての機能開発・バグ修正を GitHub Issue を起点として行います。
各 Issue は明確なタスクリストを持ち、完了時には確認フローを通じて品質を担保します。

### 開発サイクル

```
Issue 作成 → 計画立案 → 実装 → テスト → 確認フロー → マージ → Issue クローズ
```

---

## Issue 作成ガイドライン

### Issue テンプレート

```markdown
## 概要

[この Issue で達成したいことを簡潔に記述]

## タスク

- [ ] タスク 1
- [ ] タスク 2
- [ ] タスク 3

## 受け入れ条件

- [ ] 条件 1
- [ ] 条件 2

## 関連 Issue

- #XX
```

### ラベル

| ラベル          | 用途                 |
| --------------- | -------------------- |
| `frontend`      | フロントエンド関連   |
| `backend`       | バックエンド関連     |
| `infra`         | インフラ・CI/CD 関連 |
| `documentation` | ドキュメント関連     |
| `bug`           | バグ修正             |
| `enhancement`   | 機能追加             |

---

## 開発フロー

### 1. Issue の確認と計画

```bash
# Issue 一覧を確認
gh issue list

# 特定の Issue を確認
gh issue view <issue_number>
```

### 2. ブランチの作成

```bash
# Issue に対応するブランチを作成
git checkout -b feature/<issue_number>-<short_description>

# 例: Issue #25 のテスト基盤構築
git checkout -b feature/25-test-foundation
```

### 3. 実装

- 計画に基づいて実装を進める
- 小さなコミットを心がける
- コミットメッセージに Issue 番号を含める

```bash
git commit -m "feat: Add pytest-cov to backend dependencies (#25)"
```

### 4. ローカルテストの実行

実装完了後、必ずローカルでテストを実行する。

---

## 確認フロー

Issue の完了を宣言する前に、以下の確認フローを **必ず** 実行してください。

### Step 1: ローカル依存関係の更新

#### バックエンド

```bash
cd api
source .venv/bin/activate  # 仮想環境を有効化
pip install -e ".[dev]"
```

#### フロントエンド

```bash
cd web
npm install
```

### Step 2: テストの実行

#### バックエンドテスト

```bash
cd api
source .venv/bin/activate
pytest --cov=app --cov-report=term-missing
```

**期待される結果:**

- すべてのテストが成功（`PASSED`）
- カバレッジレポートが表示される
- 目標カバレッジ: 70% 以上（MUST）、80% 以上（SHOULD）

#### フロントエンドテスト

```bash
cd web
npm run test:run
```

**期待される結果:**

- すべてのテストが成功
- エラーや警告がないこと

#### フロントエンドカバレッジ

```bash
cd web
npm run test:coverage
```

**期待される結果:**

- カバレッジレポートが生成される
- 目標カバレッジ: 60% 以上（MUST）、70% 以上（SHOULD）

### Step 3: Lint チェック

#### バックエンド

```bash
cd api
source .venv/bin/activate
ruff check .
ruff format --check .
```

#### フロントエンド

```bash
cd web
npm run lint
npm run format:check
```

### Step 4: Docker Compose での動作確認

#### 4.1 サービスのビルドと起動

```bash
cd /path/to/ragxuary
docker compose down -v  # 既存のコンテナとボリュームを削除
docker compose up -d --build
```

#### 4.2 サービス状態の確認

```bash
docker compose ps
```

**期待される結果:**

```
NAME       STATUS
backend    Up (healthy)
frontend   Up
postgres   Up (healthy)
redis      Up (healthy)
```

#### 4.3 マイグレーションの実行

```bash
docker compose exec api alembic upgrade head
```

#### 4.4 API の動作確認

**ヘルスチェック:**

```bash
curl -s http://localhost:8000/api/v1/health | jq .
```

**期待される結果:**

```json
{
  "status": "ok",
  "database": "healthy"
}
```

**認証 API テスト（オプション）:**

```bash
# ユーザー登録
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "password": "TestPassword123"}' | jq .
```

#### 4.5 フロントエンドの動作確認

```bash
# ログインページ
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ja/login

# 登録ページ
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ja/register
```

**期待される結果:** HTTP ステータス `200`

### Step 5: 確認チェックリスト

以下のチェックリストをすべて満たしていることを確認してください：

```markdown
## 確認チェックリスト

### テスト

- [ ] バックエンドテストが全て成功
- [ ] フロントエンドテストが全て成功
- [ ] カバレッジが目標値を満たしている

### Lint

- [ ] バックエンド lint エラーなし
- [ ] フロントエンド lint エラーなし

### Docker Compose

- [ ] ビルドが成功
- [ ] 全サービスが healthy 状態
- [ ] マイグレーションが成功
- [ ] ヘルスチェック API が正常
- [ ] フロントエンドページが表示可能

### Issue タスク

- [ ] Issue に記載された全タスクが完了
- [ ] 受け入れ条件を満たしている
```

---

## コマンドリファレンス

### クイックリファレンス

| 操作                 | コマンド                                           |
| -------------------- | -------------------------------------------------- |
| Issue 一覧           | `gh issue list`                                    |
| Issue 詳細           | `gh issue view <number>`                           |
| バックエンドテスト   | `cd api && pytest --cov=app`                   |
| フロントエンドテスト | `cd web && npm run test:run`                  |
| Docker ビルド        | `docker compose up -d --build`                     |
| Docker 状態確認      | `docker compose ps`                                |
| マイグレーション     | `docker compose exec api alembic upgrade head` |
| ヘルスチェック       | `curl http://localhost:8000/api/v1/health`         |

### 一括確認スクリプト

以下のスクリプトを使用して、確認フローを一括実行できます：

```bash
#!/bin/bash
# scripts/verify.sh

set -e

echo "=== 確認フロー開始 ==="

# バックエンドテスト
echo "📦 バックエンドテスト..."
cd api
source .venv/bin/activate
pytest --cov=app --cov-report=term-missing
cd ..

# フロントエンドテスト
echo "📦 フロントエンドテスト..."
cd web
npm run test:run
cd ..

# Docker Compose
echo "🐳 Docker Compose ビルド..."
docker compose down -v 2>/dev/null || true
docker compose up -d --build

echo "⏳ サービス起動待機..."
sleep 10

# マイグレーション
echo "📊 マイグレーション実行..."
docker compose exec api alembic upgrade head

# ヘルスチェック
echo "🏥 ヘルスチェック..."
curl -s http://localhost:8000/api/v1/health | jq .

# フロントエンド確認
echo "🌐 フロントエンド確認..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ja/login)
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ フロントエンド: OK"
else
  echo "❌ フロントエンド: NG (HTTP $HTTP_STATUS)"
  exit 1
fi

echo "=== 確認フロー完了 ✅ ==="
```

---

## トラブルシューティング

### Docker Compose ビルドエラー

**package-lock.json の同期エラー:**

```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

**Docker キャッシュのクリア:**

```bash
docker compose build --no-cache
```

### テスト失敗時

1. エラーメッセージを確認
2. 該当するテストファイルを確認
3. 必要に応じてテストを修正または実装を修正

### マイグレーションエラー

```bash
# マイグレーション履歴を確認
docker compose exec api alembic history

# 特定のリビジョンにダウングレード
docker compose exec api alembic downgrade <revision>
```

---

## 参考

- [pytest ドキュメント](https://docs.pytest.org/)
- [Vitest ドキュメント](https://vitest.dev/)
- [Docker Compose ドキュメント](https://docs.docker.com/compose/)
- [GitHub CLI ドキュメント](https://cli.github.com/manual/)
