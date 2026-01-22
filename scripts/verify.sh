#!/bin/bash
# Issue completion verification script
# Usage: ./scripts/verify.sh

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Move to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker compose down -v 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Execute cleanup on script exit
trap cleanup EXIT

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Issue Verification Flow${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Variables to store results
BACKEND_LINT_RESULT=""
BACKEND_FORMAT_RESULT=""
FRONTEND_LINT_RESULT=""
BACKEND_TEST_RESULT=""
FRONTEND_TEST_RESULT=""
DOCKER_BUILD_RESULT=""
HEALTH_CHECK_RESULT=""
FRONTEND_CHECK_RESULT=""

# Step 1: Backend lint check
echo -e "${YELLOW}🔍 Step 1: Backend Lint Check${NC}"
echo "----------------------------------------"
cd api

# Install dependencies
uv sync --frozen --extra dev

if uv run ruff check . 2>&1; then
    BACKEND_LINT_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Backend lint check passed${NC}"
else
    BACKEND_LINT_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Backend lint check failed${NC}"
fi
cd "$PROJECT_ROOT"
echo ""

# Step 2: Backend format check
echo -e "${YELLOW}🔍 Step 2: Backend Format Check${NC}"
echo "----------------------------------------"
cd api

if uv run ruff format --check . 2>&1; then
    BACKEND_FORMAT_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Backend format check passed${NC}"
else
    BACKEND_FORMAT_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Backend format check failed${NC}"
fi
cd "$PROJECT_ROOT"
echo ""

# Step 3: Frontend lint & format check
echo -e "${YELLOW}🔍 Step 3: Frontend Lint & Format Check${NC}"
echo "----------------------------------------"
cd web

if pnpm run check 2>&1; then
    FRONTEND_LINT_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Frontend lint & format check passed${NC}"
else
    FRONTEND_LINT_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Frontend lint & format check failed${NC}"
fi
cd "$PROJECT_ROOT"
echo ""

# Step 4: Backend tests
echo -e "${YELLOW}📦 Step 4: Backend Tests${NC}"
echo "----------------------------------------"
cd api

if uv run pytest --cov=app --cov-report=term-missing 2>&1; then
    BACKEND_TEST_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Backend tests passed${NC}"
else
    BACKEND_TEST_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Backend tests failed${NC}"
fi
cd "$PROJECT_ROOT"
echo ""

# Step 5: Frontend tests
echo -e "${YELLOW}📦 Step 5: Frontend Tests${NC}"
echo "----------------------------------------"
cd web

if pnpm run test:run 2>&1; then
    FRONTEND_TEST_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
else
    FRONTEND_TEST_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Frontend tests failed${NC}"
fi
cd "$PROJECT_ROOT"
echo ""

# Step 6: Docker Compose build
echo -e "${YELLOW}🐳 Step 6: Docker Compose Build${NC}"
echo "----------------------------------------"

# Stop existing containers
docker compose down -v 2>/dev/null || true

if docker compose up -d --build 2>&1; then
    DOCKER_BUILD_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Docker Compose build succeeded${NC}"
else
    DOCKER_BUILD_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Docker Compose build failed${NC}"
    exit 1
fi
echo ""

# Wait for services to start (health check loop)
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/api/v1/health 2>/dev/null | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✅ API service started${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API service startup timeout${NC}"
    fi
    sleep 2
done

# Check service status
echo -e "${YELLOW}📊 Service Status:${NC}"
docker compose ps
echo ""

# Step 7: Migration
echo -e "${YELLOW}📊 Step 7: Run Migration${NC}"
echo "----------------------------------------"
docker compose exec -T api alembic upgrade head
echo ""

# Step 8: Health check
echo -e "${YELLOW}🏥 Step 8: Health Check${NC}"
echo "----------------------------------------"

HEALTH_RESPONSE=$(curl -s --max-time 10 http://localhost:8000/api/v1/health)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    HEALTH_CHECK_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    HEALTH_CHECK_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Health check failed${NC}"
fi
echo ""

# Step 9: Frontend verification
echo -e "${YELLOW}🌐 Step 9: Frontend Verification${NC}"
echo "----------------------------------------"

HTTP_STATUS=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" http://localhost:3000/ja/login)
echo "Login page HTTP status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    FRONTEND_CHECK_RESULT="${GREEN}✅ Passed${NC}"
    echo -e "${GREEN}✅ Frontend verification passed${NC}"
else
    FRONTEND_CHECK_RESULT="${RED}❌ Failed${NC}"
    echo -e "${RED}❌ Frontend verification failed (HTTP $HTTP_STATUS)${NC}"
fi
echo ""

# Results summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Verification Results Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Backend Lint:          $BACKEND_LINT_RESULT"
echo -e "Backend Format:        $BACKEND_FORMAT_RESULT"
echo -e "Frontend Lint/Format:  $FRONTEND_LINT_RESULT"
echo -e "Backend Tests:         $BACKEND_TEST_RESULT"
echo -e "Frontend Tests:        $FRONTEND_TEST_RESULT"
echo -e "Docker Compose Build:  $DOCKER_BUILD_RESULT"
echo -e "Health Check:          $HEALTH_CHECK_RESULT"
echo -e "Frontend Verification: $FRONTEND_CHECK_RESULT"
echo ""

# Overall result
if [[ "$BACKEND_LINT_RESULT" == *"Passed"* ]] && \
   [[ "$BACKEND_FORMAT_RESULT" == *"Passed"* ]] && \
   [[ "$FRONTEND_LINT_RESULT" == *"Passed"* ]] && \
   [[ "$BACKEND_TEST_RESULT" == *"Passed"* ]] && \
   [[ "$FRONTEND_TEST_RESULT" == *"Passed"* ]] && \
   [[ "$DOCKER_BUILD_RESULT" == *"Passed"* ]] && \
   [[ "$HEALTH_CHECK_RESULT" == *"Passed"* ]] && \
   [[ "$FRONTEND_CHECK_RESULT" == *"Passed"* ]]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    🎉 All verifications passed!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}    ⚠️  Some verifications failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
