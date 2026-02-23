"""Tests for project endpoints."""

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


@pytest.mark.asyncio
class TestListProjects:
    """Tests for GET /api/v1/projects."""

    async def test_list_projects_empty(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Test listing projects when user has none."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get("/api/v1/projects", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_projects_with_projects(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test listing projects when user has some."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create a project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # List projects
            response = await client.get("/api/v1/projects", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["slug"] == "test-project"

    async def test_list_projects_unauthorized(self, client: AsyncClient) -> None:
        """Test listing projects without auth."""
        response = await client.get("/api/v1/projects")
        assert response.status_code == 401

    async def test_list_projects_includes_public_projects(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test that public projects from other users are included."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                # Create a public project as first user
                await client.post(
                    "/api/v1/projects",
                    json={
                        "slug": "public-project",
                        "name": "Public Project",
                        "visibility": "public",
                    },
                    headers=auth_headers,
                )

                # Register second user
                other_response = await client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "other@example.com",
                        "name": "Other User",
                        "password": "OtherPassword123",
                    },
                )
                other_token = other_response.json()["access_token"]
                other_headers = {"Authorization": f"Bearer {other_token}"}

                # List projects as second user - should see public project
                response = await client.get("/api/v1/projects", headers=other_headers)

        assert response.status_code == 200
        data = response.json()
        slugs = [p["slug"] for p in data]
        assert "public-project" in slugs

    async def test_list_projects_includes_member_projects(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test that projects where user is a member are included."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                # Create a private project as first user
                await client.post(
                    "/api/v1/projects", json=test_project_data, headers=auth_headers
                )

                # Register second user
                other_response = await client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "member@example.com",
                        "name": "Member User",
                        "password": "MemberPassword123",
                    },
                )
                other_token = other_response.json()["access_token"]
                other_headers = {"Authorization": f"Bearer {other_token}"}

                # Get second user's ID
                me_response = await client.get("/api/v1/auth/me", headers=other_headers)
                other_user_id = me_response.json()["id"]

                # Add second user as member
                await client.post(
                    "/api/v1/projects/test-project/members",
                    json={"user_id": other_user_id, "role": "viewer"},
                    headers=auth_headers,
                )

                # List projects as second user - should see member project
                response = await client.get("/api/v1/projects", headers=other_headers)

        assert response.status_code == 200
        data = response.json()
        slugs = [p["slug"] for p in data]
        assert "test-project" in slugs

    async def test_list_projects_excludes_private_unrelated(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test that private projects from other users are excluded."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                # Create a private project as first user
                await client.post(
                    "/api/v1/projects", json=test_project_data, headers=auth_headers
                )

                # Register second user
                other_response = await client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "stranger@example.com",
                        "name": "Stranger User",
                        "password": "StrangerPassword123",
                    },
                )
                other_token = other_response.json()["access_token"]
                other_headers = {"Authorization": f"Bearer {other_token}"}

                # List projects as second user - should NOT see private project
                response = await client.get("/api/v1/projects", headers=other_headers)

        assert response.status_code == 200
        data = response.json()
        slugs = [p["slug"] for p in data]
        assert "test-project" not in slugs


@pytest.mark.asyncio
class TestCreateProject:
    """Tests for POST /api/v1/projects."""

    async def test_create_project_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test successful project creation."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

        assert response.status_code == 201
        data = response.json()
        assert data["slug"] == "test-project"
        assert data["name"] == "Test Project"
        assert "id" in data
        assert "owner_id" in data
        assert "created_at" in data

    async def test_create_project_duplicate_slug(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test creating project with duplicate slug."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create first project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Try to create with same slug
            response = await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    async def test_create_project_invalid_slug(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Test creating project with invalid slug."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.post(
                "/api/v1/projects",
                json={"slug": "Invalid Slug!", "name": "Test"},
                headers=auth_headers,
            )

        assert response.status_code == 422

    async def test_create_project_unauthorized(
        self, client: AsyncClient, test_project_data: dict[str, Any]
    ) -> None:
        """Test creating project without auth."""
        response = await client.post("/api/v1/projects", json=test_project_data)
        assert response.status_code == 401


@pytest.mark.asyncio
class TestGetProject:
    """Tests for GET /api/v1/projects/{slug}."""

    async def test_get_project_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test successful project retrieval."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Get project
            response = await client.get(
                "/api/v1/projects/test-project", headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json()["slug"] == "test-project"

    async def test_get_project_not_found(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Test getting nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get(
                "/api/v1/projects/nonexistent", headers=auth_headers
            )

        assert response.status_code == 404

    async def test_get_project_unauthorized(self, client: AsyncClient) -> None:
        """Test getting project without auth."""
        response = await client.get("/api/v1/projects/test-project")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestUpdateProject:
    """Tests for PATCH /api/v1/projects/{slug}."""

    async def test_update_project_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test successful project update."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Update project
            response = await client.patch(
                "/api/v1/projects/test-project",
                json={"name": "Updated Name"},
                headers=auth_headers,
            )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    async def test_update_project_not_found(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Test updating nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.patch(
                "/api/v1/projects/nonexistent",
                json={"name": "Updated"},
                headers=auth_headers,
            )

        assert response.status_code == 404

    async def test_update_project_not_owner(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
        test_user_data: dict[str, Any],
    ) -> None:
        """Test updating project by non-owner."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                # Create project as first user
                await client.post(
                    "/api/v1/projects", json=test_project_data, headers=auth_headers
                )

                # Register second user
                other_user_data = {
                    "email": "other@example.com",
                    "name": "Other User",
                    "password": "OtherPassword123",
                }
                other_response = await client.post(
                    "/api/v1/auth/register", json=other_user_data
                )
                other_token = other_response.json()["access_token"]
                other_headers = {"Authorization": f"Bearer {other_token}"}

                # Try to update as other user
                response = await client.patch(
                    "/api/v1/projects/test-project",
                    json={"name": "Hacked"},
                    headers=other_headers,
                )

        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeleteProject:
    """Tests for DELETE /api/v1/projects/{slug}."""

    async def test_delete_project_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test successful project deletion."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Delete project
            response = await client.delete(
                "/api/v1/projects/test-project", headers=auth_headers
            )

        assert response.status_code == 204

        # Verify deletion
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            get_response = await client.get(
                "/api/v1/projects/test-project", headers=auth_headers
            )
        assert get_response.status_code == 404

    async def test_delete_project_with_documents(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test deleting a project that has related documents succeeds."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Create project
            await client.post(
                "/api/v1/projects", json=test_project_data, headers=auth_headers
            )

            # Create documents
            await client.put(
                "/api/v1/projects/test-project/docs/getting-started",
                json={"title": "Getting Started", "content": "# Hello"},
                headers=auth_headers,
            )
            await client.put(
                "/api/v1/projects/test-project/docs/guide",
                json={"title": "Guide", "content": "# Guide"},
                headers=auth_headers,
            )

            # Delete project with related documents
            response = await client.delete(
                "/api/v1/projects/test-project", headers=auth_headers
            )

        assert response.status_code == 204

    async def test_delete_project_not_found(
        self, client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        """Test deleting nonexistent project."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.delete(
                "/api/v1/projects/nonexistent", headers=auth_headers
            )

        assert response.status_code == 404

    async def test_delete_project_not_owner(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project_data: dict[str, Any],
    ) -> None:
        """Test deleting project by non-owner."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            with patch(
                "app.services.auth.add_token_to_blacklist", new_callable=AsyncMock
            ):
                # Create project as first user
                await client.post(
                    "/api/v1/projects", json=test_project_data, headers=auth_headers
                )

                # Register second user
                other_user_data = {
                    "email": "other@example.com",
                    "name": "Other User",
                    "password": "OtherPassword123",
                }
                other_response = await client.post(
                    "/api/v1/auth/register", json=other_user_data
                )
                other_token = other_response.json()["access_token"]
                other_headers = {"Authorization": f"Bearer {other_token}"}

                # Try to delete as other user
                response = await client.delete(
                    "/api/v1/projects/test-project", headers=other_headers
                )

        assert response.status_code == 403
