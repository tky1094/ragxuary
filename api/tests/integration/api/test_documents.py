"""Integration tests for document API endpoints."""

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.fixture
def test_project_data() -> dict[str, Any]:
    """Return test project data."""
    return {
        "slug": "test-project",
        "name": "Test Project",
        "description": "A test project",
        "visibility": "private",
    }


@pytest.fixture
def test_document_data() -> dict[str, Any]:
    """Return test document data."""
    return {
        "title": "Test Document",
        "content": "# Test Content\n\nThis is test content.",
        "is_folder": False,
    }


@pytest.fixture
async def auth_headers(
    client: AsyncClient,
    test_user_data: dict[str, Any],
) -> dict[str, str]:
    """Register a user and return auth headers."""
    with patch("app.services.auth.add_token_to_blacklist", new_callable=AsyncMock):
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        access_token = response.json()["access_token"]
        return {"Authorization": f"Bearer {access_token}"}


@pytest.mark.asyncio
class TestDocumentTree:
    """Tests for GET /api/v1/projects/{slug}/docs endpoint."""

    async def test_get_tree_empty(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test getting empty document tree."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project first
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Get document tree
            response = await client.get(
                f"/api/v1/projects/{test_project_data['slug']}/docs",
                headers=auth_headers,
            )

        assert response.status_code == 200
        assert response.json() == []

    async def test_get_tree_unauthorized(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test getting tree without authentication."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project first
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

        # Get without auth
        response = await client.get(
            f"/api/v1/projects/{test_project_data['slug']}/docs",
        )

        assert response.status_code == 401


@pytest.mark.asyncio
class TestPutDocument:
    """Tests for PUT /api/v1/projects/{slug}/docs/{path} endpoint."""

    async def test_create_document(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
        test_document_data: dict[str, Any],
    ) -> None:
        """Test creating a new document."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Create document
            response = await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/getting-started",
                json=test_document_data,
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == test_document_data["title"]
        assert data["content"] == test_document_data["content"]
        assert data["path"] == "getting-started"

    async def test_update_document(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
        test_document_data: dict[str, Any],
    ) -> None:
        """Test updating an existing document."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Create document
            await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/update-test",
                json=test_document_data,
                headers=auth_headers,
            )

            # Update document
            updated_data = {
                "title": "Updated Title",
                "content": "Updated content",
            }
            response = await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/update-test",
                json=updated_data,
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated content"


@pytest.mark.asyncio
class TestGetDocument:
    """Tests for GET /api/v1/projects/{slug}/docs/{path} endpoint."""

    async def test_get_document_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
        test_document_data: dict[str, Any],
    ) -> None:
        """Test getting a document by path."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Create document
            await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/test-doc",
                json=test_document_data,
                headers=auth_headers,
            )

            # Get document
            response = await client.get(
                f"/api/v1/projects/{test_project_data['slug']}/docs/test-doc",
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == test_document_data["title"]

    async def test_get_document_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test getting non-existent document."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Get non-existent document
            response = await client.get(
                f"/api/v1/projects/{test_project_data['slug']}/docs/non-existent",
                headers=auth_headers,
            )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestDeleteDocument:
    """Tests for DELETE /api/v1/projects/{slug}/docs/{path} endpoint."""

    async def test_delete_document_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
        test_document_data: dict[str, Any],
    ) -> None:
        """Test deleting a document."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Create document
            await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/delete-test",
                json=test_document_data,
                headers=auth_headers,
            )

            # Delete document
            response = await client.delete(
                f"/api/v1/projects/{test_project_data['slug']}/docs/delete-test",
                headers=auth_headers,
            )

        assert response.status_code == 204

        # Verify deleted
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get(
                f"/api/v1/projects/{test_project_data['slug']}/docs/delete-test",
                headers=auth_headers,
            )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestProjectActivity:
    """Tests for GET /api/v1/projects/{slug}/activity endpoint."""

    async def test_activity_feed(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
        test_document_data: dict[str, Any],
    ) -> None:
        """Test getting project activity feed."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Create document
            await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/activity-test",
                json=test_document_data,
                headers=auth_headers,
            )

            # Get activity
            response = await client.get(
                f"/api/v1/projects/{test_project_data['slug']}/activity",
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["documents"][0]["change_type"] == "create"


@pytest.mark.asyncio
class TestDocumentHistory:
    """Tests for GET /api/v1/projects/{slug}/docs/{path}/history endpoint."""

    async def test_document_history(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
        test_document_data: dict[str, Any],
    ) -> None:
        """Test getting document revision history."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects",
                json=test_project_data,
                headers=auth_headers,
            )

            # Create document
            await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/history-test",
                json=test_document_data,
                headers=auth_headers,
            )

            # Update document
            await client.put(
                f"/api/v1/projects/{test_project_data['slug']}/docs/history-test",
                json={"title": "Updated Title", "content": "Updated content"},
                headers=auth_headers,
            )

            # Get history
            response = await client.get(
                f"/api/v1/projects/{test_project_data['slug']}/docs/history-test/history",
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["change_type"] == "update"
        assert data[1]["change_type"] == "create"
