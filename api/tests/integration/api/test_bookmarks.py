"""Tests for bookmark endpoints."""

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.fixture
def public_project_data() -> dict[str, Any]:
    """Return public project data."""
    return {
        "slug": "public-project",
        "name": "Public Project",
        "description": "A public project",
        "visibility": "public",
    }


@pytest.fixture
def private_project_data() -> dict[str, Any]:
    """Return private project data."""
    return {
        "slug": "private-project",
        "name": "Private Project",
        "description": "A private project",
        "visibility": "private",
    }


@pytest.fixture
async def auth_headers(
    client: AsyncClient, test_user_data: dict[str, Any]
) -> dict[str, str]:
    """Register a user and return auth headers."""
    with patch("app.services.auth.add_token_to_blacklist", new_callable=AsyncMock):
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        access_token = response.json()["access_token"]
        return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def second_user_headers(client: AsyncClient) -> dict[str, str]:
    """Register a second user and return auth headers."""
    user_data = {
        "email": "second@example.com",
        "name": "Second User",
        "password": "SecondPassword123",
    }
    with patch("app.services.auth.add_token_to_blacklist", new_callable=AsyncMock):
        response = await client.post("/api/v1/auth/register", json=user_data)
        access_token = response.json()["access_token"]
        return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def second_user_id(
    client: AsyncClient, second_user_headers: dict[str, str]
) -> str:
    """Get the second user's ID."""
    with patch(
        "app.api.deps.is_token_blacklisted",
        new_callable=AsyncMock,
        return_value=False,
    ):
        response = await client.get("/api/v1/auth/me", headers=second_user_headers)
        return response.json()["id"]


@pytest.mark.asyncio
class TestListBookmarks:
    """Tests for GET /api/v1/bookmarks."""

    async def test_list_bookmarks_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test listing bookmarks for authenticated user."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create a project
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )

            # Add bookmark
            await client.post(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

            # List bookmarks
            response = await client.get("/api/v1/bookmarks", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["project"]["slug"] == "public-project"

    async def test_list_bookmarks_empty(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test listing bookmarks when none exist."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get("/api/v1/bookmarks", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_bookmarks_unauthorized(self, client: AsyncClient) -> None:
        """Test listing bookmarks without auth."""
        response = await client.get("/api/v1/bookmarks")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAddBookmark:
    """Tests for POST /api/v1/projects/{slug}/bookmark."""

    async def test_add_bookmark_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test successfully adding a bookmark."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )

            # Add bookmark
            response = await client.post(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

        assert response.status_code == 201
        data = response.json()
        assert "user_id" in data
        assert "project_id" in data
        assert "created_at" in data

    async def test_add_bookmark_idempotent(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test adding bookmark multiple times is idempotent."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )

            # Add bookmark twice
            response1 = await client.post(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )
            response2 = await client.post(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

        assert response1.status_code == 201
        assert response2.status_code == 201
        # Both should return the same bookmark
        assert response1.json()["created_at"] == response2.json()["created_at"]

    async def test_add_bookmark_project_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test adding bookmark to nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.post(
                "/api/v1/projects/nonexistent/bookmark", headers=auth_headers
            )

        assert response.status_code == 404

    async def test_add_bookmark_forbidden(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        private_project_data: dict[str, Any],
    ) -> None:
        """Test adding bookmark to private project without access."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create private project as first user
            await client.post(
                "/api/v1/projects", json=private_project_data, headers=auth_headers
            )

            # Second user tries to bookmark
            response = await client.post(
                "/api/v1/projects/private-project/bookmark", headers=second_user_headers
            )

        assert response.status_code == 403

    async def test_add_bookmark_public_project_by_other_user(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test any user can bookmark public projects."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create public project as first user
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )

            # Second user bookmarks
            response = await client.post(
                "/api/v1/projects/public-project/bookmark", headers=second_user_headers
            )

        assert response.status_code == 201

    async def test_add_bookmark_as_member(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        private_project_data: dict[str, Any],
    ) -> None:
        """Test member can bookmark private project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create private project
            await client.post(
                "/api/v1/projects", json=private_project_data, headers=auth_headers
            )

            # Add second user as member
            await client.post(
                "/api/v1/projects/private-project/members",
                json={"user_id": second_user_id, "role": "viewer"},
                headers=auth_headers,
            )

            # Member bookmarks
            response = await client.post(
                "/api/v1/projects/private-project/bookmark", headers=second_user_headers
            )

        assert response.status_code == 201

    async def test_add_bookmark_unauthorized(self, client: AsyncClient) -> None:
        """Test adding bookmark without auth."""
        response = await client.post("/api/v1/projects/some-project/bookmark")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestRemoveBookmark:
    """Tests for DELETE /api/v1/projects/{slug}/bookmark."""

    async def test_remove_bookmark_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test successfully removing a bookmark."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project and bookmark
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )
            await client.post(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

            # Remove bookmark
            response = await client.delete(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

        assert response.status_code == 204

    async def test_remove_bookmark_idempotent(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test removing bookmark when it doesn't exist returns 204 (idempotent)."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project without bookmark
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )

            # Remove nonexistent bookmark
            response = await client.delete(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

        assert response.status_code == 204

    async def test_remove_bookmark_project_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test removing bookmark from nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.delete(
                "/api/v1/projects/nonexistent/bookmark", headers=auth_headers
            )

        assert response.status_code == 404

    async def test_remove_bookmark_unauthorized(self, client: AsyncClient) -> None:
        """Test removing bookmark without auth."""
        response = await client.delete("/api/v1/projects/some-project/bookmark")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestGetBookmarkStatus:
    """Tests for GET /api/v1/projects/{slug}/bookmark."""

    async def test_get_bookmark_status_bookmarked(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test getting bookmark status when bookmarked."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project and bookmark
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )
            await client.post(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

            # Check status
            response = await client.get(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json()["is_bookmarked"] is True

    async def test_get_bookmark_status_not_bookmarked(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test getting bookmark status when not bookmarked."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project without bookmark
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )

            # Check status
            response = await client.get(
                "/api/v1/projects/public-project/bookmark", headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json()["is_bookmarked"] is False

    async def test_get_bookmark_status_project_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test getting bookmark status for nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get(
                "/api/v1/projects/nonexistent/bookmark", headers=auth_headers
            )

        assert response.status_code == 404

    async def test_get_bookmark_status_unauthorized(self, client: AsyncClient) -> None:
        """Test getting bookmark status without auth."""
        response = await client.get("/api/v1/projects/some-project/bookmark")
        assert response.status_code == 401
