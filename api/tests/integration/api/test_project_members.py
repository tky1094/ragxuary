"""Tests for project member endpoints."""

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
class TestListMembers:
    """Tests for GET /api/v1/projects/{slug}/members."""

    async def test_list_members_as_owner(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test owner can list members."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # List members (should be empty, owner is not in members table)
            response = await client.get(
                "/api/v1/projects/test-project/members", headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_members_unauthorized(self, client: AsyncClient) -> None:
        """Test listing members without auth."""
        response = await client.get("/api/v1/projects/test-project/members")
        assert response.status_code == 401

    async def test_list_members_project_not_found(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Test listing members of nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get(
                "/api/v1/projects/nonexistent/members", headers=auth_headers
            )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestAddMember:
    """Tests for POST /api/v1/projects/{slug}/members."""

    async def test_add_member_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test successfully adding a member."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add member
            response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "viewer"},
                headers=auth_headers,
            )

        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == second_user_id
        assert data["role"] == "viewer"

    async def test_add_member_as_admin(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test admin can add members."""
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

            # Register third user
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                third_response = await client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "third@example.com",
                        "name": "Third User",
                        "password": "ThirdPassword123",
                    },
                )
                third_token = third_response.json()["access_token"]
                third_headers = {"Authorization": f"Bearer {third_token}"}

            # Get third user ID via /me endpoint
            me_response = await client.get("/api/v1/auth/me", headers=third_headers)
            third_user_id = me_response.json()["id"]

            # Admin adds third user
            response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": third_user_id, "role": "viewer"},
                headers=second_user_headers,
            )

        assert response.status_code == 201

    async def test_add_member_as_viewer_forbidden(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test viewer cannot add members."""
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

            # Register third user
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                third_response = await client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "third@example.com",
                        "name": "Third User",
                        "password": "ThirdPassword123",
                    },
                )
                third_token = third_response.json()["access_token"]
                third_headers = {"Authorization": f"Bearer {third_token}"}

            # Get third user ID via /me endpoint
            me_response = await client.get("/api/v1/auth/me", headers=third_headers)
            third_user_id = me_response.json()["id"]

            # Viewer tries to add third user
            response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": third_user_id, "role": "viewer"},
                headers=second_user_headers,
            )

        assert response.status_code == 403

    async def test_add_member_already_exists(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test adding member who is already a member."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add member
            await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "viewer"},
                headers=auth_headers,
            )

            # Try to add again
            response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "editor"},
                headers=auth_headers,
            )

        assert response.status_code == 409


@pytest.mark.asyncio
class TestUpdateMemberRole:
    """Tests for PATCH /api/v1/projects/{slug}/members/{member_id}."""

    async def test_update_role_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test successfully updating member role."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add member
            add_response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "viewer"},
                headers=auth_headers,
            )
            member_id = add_response.json()["id"]

            # Update role
            response = await client.patch(
                f"/api/v1/projects/test-project/members/{member_id}",
                json={"role": "editor"},
                headers=auth_headers,
            )

        assert response.status_code == 200
        assert response.json()["role"] == "editor"

    async def test_update_role_member_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test updating role of nonexistent member."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Try to update nonexistent member
            response = await client.patch(
                "/api/v1/projects/test-project/members/00000000-0000-0000-0000-000000000000",
                json={"role": "editor"},
                headers=auth_headers,
            )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestRemoveMember:
    """Tests for DELETE /api/v1/projects/{slug}/members/{member_id}."""

    async def test_remove_member_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test successfully removing a member."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add member
            add_response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "viewer"},
                headers=auth_headers,
            )
            member_id = add_response.json()["id"]

            # Remove member
            response = await client.delete(
                f"/api/v1/projects/test-project/members/{member_id}",
                headers=auth_headers,
            )

        assert response.status_code == 204

    async def test_self_removal(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test member can remove themselves (leave project)."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Add member
            add_response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": second_user_id, "role": "viewer"},
                headers=auth_headers,
            )
            member_id = add_response.json()["id"]

            # Member removes themselves
            response = await client.delete(
                f"/api/v1/projects/test-project/members/{member_id}",
                headers=second_user_headers,
            )

        assert response.status_code == 204

    async def test_remove_member_forbidden(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        second_user_id: str,
        test_project_data: dict[str, Any],
    ) -> None:
        """Test viewer cannot remove other members."""
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

            # Register third user and add as viewer
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                third_response = await client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "third@example.com",
                        "name": "Third User",
                        "password": "ThirdPassword123",
                    },
                )
                third_token = third_response.json()["access_token"]
                third_headers = {"Authorization": f"Bearer {third_token}"}

            # Get third user ID via /me endpoint
            me_response = await client.get("/api/v1/auth/me", headers=third_headers)
            third_user_id = me_response.json()["id"]

            add_response = await client.post(
                "/api/v1/projects/test-project/members",
                json={"user_id": third_user_id, "role": "viewer"},
                headers=auth_headers,
            )
            third_member_id = add_response.json()["id"]

            # Second user (viewer) tries to remove third user
            response = await client.delete(
                f"/api/v1/projects/test-project/members/{third_member_id}",
                headers=second_user_headers,
            )

        assert response.status_code == 403
