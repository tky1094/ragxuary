"""Tests for project permissions endpoint."""

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
def public_project_data() -> dict[str, Any]:
    """Return test public project data."""
    return {
        "slug": "public-project",
        "name": "Public Project",
        "description": "A public project",
        "visibility": "public",
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
class TestGetProjectPermissions:
    """Tests for GET /api/v1/projects/{slug}/permissions."""

    async def test_owner_has_all_permissions(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test owner has all permissions."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Get permissions
            response = await client.get(
                "/api/v1/projects/test-project/permissions", headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "owner"
        assert "view" in data["permissions"]
        assert "edit" in data["permissions"]
        assert "manage_members" in data["permissions"]
        assert "manage_settings" in data["permissions"]
        assert "delete_project" in data["permissions"]

    async def test_viewer_has_view_permission_only(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test viewer only has view permission."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add second user as viewer
            await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "viewer"},
                headers=auth_headers,
            )

            # Get permissions as viewer
            response = await client.get(
                "/api/v1/projects/test-project/permissions", headers=second_user_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "viewer"
        assert data["permissions"] == ["view"]

    async def test_editor_has_view_and_edit_permissions(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test editor has view and edit permissions."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add second user as editor
            await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "editor"},
                headers=auth_headers,
            )

            # Get permissions as editor
            response = await client.get(
                "/api/v1/projects/test-project/permissions", headers=second_user_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "editor"
        assert "view" in data["permissions"]
        assert "edit" in data["permissions"]
        assert "manage_members" not in data["permissions"]
        assert "manage_settings" not in data["permissions"]

    async def test_admin_has_manage_members_permission(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test admin has manage_members permission but not manage_settings."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add second user as admin
            await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "admin"},
                headers=auth_headers,
            )

            # Get permissions as admin
            response = await client.get(
                "/api/v1/projects/test-project/permissions", headers=second_user_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        assert "view" in data["permissions"]
        assert "edit" in data["permissions"]
        assert "manage_members" in data["permissions"]
        assert "manage_settings" not in data["permissions"]

    async def test_public_project_non_member_has_view_permission(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        public_project_data: dict[str, Any],
    ) -> None:
        """Test non-member has view permission on public project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create public project as first user
            await client.post(
                "/api/v1/projects", json=public_project_data, headers=auth_headers
            )

            # Get permissions as second user (non-member)
            response = await client.get(
                "/api/v1/projects/public-project/permissions",
                headers=second_user_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] is None
        assert data["permissions"] == ["view"]

    async def test_private_project_non_member_no_permissions(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test non-member has no permissions on private project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create private project as first user
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Get permissions as second user (non-member)
            response = await client.get(
                "/api/v1/projects/test-project/permissions",
                headers=second_user_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] is None
        assert data["permissions"] == []

    async def test_project_not_found(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Test getting permissions for nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get(
                "/api/v1/projects/nonexistent/permissions", headers=auth_headers
            )

        assert response.status_code == 404

    async def test_unauthorized(self, client: AsyncClient) -> None:
        """Test getting permissions without auth."""
        response = await client.get("/api/v1/projects/test-project/permissions")
        assert response.status_code == 401
