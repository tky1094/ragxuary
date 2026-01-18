#!/bin/bash
# Issue 完了確認スクリプト
# 使用方法: ./scripts/verify.sh

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Issue 完了確認フロー${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 結果を記録する変数
BACKEND_TEST_RESULT=""
FRONTEND_TEST_RESULT=""
DOCKER_BUILD_RESULT=""
HEALTH_CHECK_RESULT=""
FRONTEND_CHECK_RESULT=""

# Step 1: バックエンドテスト
echo -e "${YELLOW}📦 Step 1: バックエンドテスト${NC}"
echo "----------------------------------------"
cd backend

# 依存関係をインストール
uv sync --frozen --extra dev

if uv run pytest --cov=app --cov-report=term-missing 2>&1; then
    BACKEND_TEST_RESULT="${GREEN}✅ 成功${NC}"
    echo -e "${GREEN}✅ バックエンドテスト成功${NC}"
else
    BACKEND_TEST_RESULT="${RED}❌ 失敗${NC}"
    echo -e "${RED}❌ バックエンドテスト失敗${NC}"
fi
cd "$PROJECT_ROOT"
echo ""

# Step 2: フロントエンドテスト
echo -e "${YELLOW}📦 Step 2: フロントエンドテスト${NC}"
echo "----------------------------------------"
cd frontend

if npm run test:run 2>&1; then
    FRONTEND_TEST_RESULT="${GREEN}✅ 成功${NC}"
    echo -e "${GREEN}✅ フロントエンドテスト成功${NC}"
else
    FRONTEND_TEST_RESULT="${RED}❌ 失敗${NC}"
    echo -e "${RED}❌ フロントエンドテスト失敗${NC}"
fi
cd "$PROJECT_ROOT"
echo ""

# Step 3: Docker Compose ビルド
echo -e "${YELLOW}🐳 Step 3: Docker Compose ビルド${NC}"
echo "----------------------------------------"

# 既存のコンテナを停止
docker compose down -v 2>/dev/null || true

if docker compose up -d --build 2>&1; then
    DOCKER_BUILD_RESULT="${GREEN}✅ 成功${NC}"
    echo -e "${GREEN}✅ Docker Compose ビルド成功${NC}"
else
    DOCKER_BUILD_RESULT="${RED}❌ 失敗${NC}"
    echo -e "${RED}❌ Docker Compose ビルド失敗${NC}"
    exit 1
fi
echo ""

# サービス起動待機
echo -e "${YELLOW}⏳ サービス起動待機中...${NC}"
sleep 15

# サービス状態確認
echo -e "${YELLOW}📊 サービス状態:${NC}"
docker compose ps
echo ""

# Step 4: マイグレーション
echo -e "${YELLOW}📊 Step 4: マイグレーション実行${NC}"
echo "----------------------------------------"
docker compose exec -T backend alembic upgrade head
echo ""

# Step 5: ヘルスチェック
echo -e "${YELLOW}🏥 Step 5: ヘルスチェック${NC}"
echo "----------------------------------------"

HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/v1/health)
echo "レスポンス: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    HEALTH_CHECK_RESULT="${GREEN}✅ 成功${NC}"
    echo -e "${GREEN}✅ ヘルスチェック成功${NC}"
else
    HEALTH_CHECK_RESULT="${RED}❌ 失敗${NC}"
    echo -e "${RED}❌ ヘルスチェック失敗${NC}"
fi
echo ""

# Step 6: フロントエンド確認
echo -e "${YELLOW}🌐 Step 6: フロントエンド確認${NC}"
echo "----------------------------------------"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ja/login)
echo "ログインページ HTTP ステータス: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    FRONTEND_CHECK_RESULT="${GREEN}✅ 成功${NC}"
    echo -e "${GREEN}✅ フロントエンド確認成功${NC}"
else
    FRONTEND_CHECK_RESULT="${RED}❌ 失敗${NC}"
    echo -e "${RED}❌ フロントエンド確認失敗 (HTTP $HTTP_STATUS)${NC}"
fi
echo ""

# 結果サマリー
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    確認結果サマリー${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "バックエンドテスト:    $BACKEND_TEST_RESULT"
echo -e "フロントエンドテスト:  $FRONTEND_TEST_RESULT"
echo -e "Docker Compose ビルド: $DOCKER_BUILD_RESULT"
echo -e "ヘルスチェック:        $HEALTH_CHECK_RESULT"
echo -e "フロントエンド確認:    $FRONTEND_CHECK_RESULT"
echo ""

# 全体結果
if [[ "$BACKEND_TEST_RESULT" == *"成功"* ]] && \
   [[ "$FRONTEND_TEST_RESULT" == *"成功"* ]] && \
   [[ "$DOCKER_BUILD_RESULT" == *"成功"* ]] && \
   [[ "$HEALTH_CHECK_RESULT" == *"成功"* ]] && \
   [[ "$FRONTEND_CHECK_RESULT" == *"成功"* ]]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    🎉 全ての確認が成功しました！${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}    ⚠️  一部の確認が失敗しました${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
