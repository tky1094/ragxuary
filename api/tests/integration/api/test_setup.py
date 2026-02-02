"""Tests for setup endpoints."""

from typing import Any

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestGetSetupStatus:
    """Tests for GET /api/v1/setup/status."""

    async def test_status_requires_admin(self, client: AsyncClient) -> None:
        """Test status when no admin exists."""
        response = await client.get("/api/v1/setup/status")

        assert response.status_code == 200
        data = response.json()
        assert data["is_setup_completed"] is False
        assert data["requires_admin"] is True

    async def test_status_completed(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test status when admin exists."""
        # Create admin first
        await client.post("/api/v1/setup/admin", json=test_user_data)

        response = await client.get("/api/v1/setup/status")

        assert response.status_code == 200
        data = response.json()
        assert data["is_setup_completed"] is True
        assert data["requires_admin"] is False


@pytest.mark.asyncio
class TestCreateAdmin:
    """Tests for POST /api/v1/setup/admin."""

    async def test_create_admin_success(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test successful admin creation."""
        response = await client.post("/api/v1/setup/admin", json=test_user_data)

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_create_admin_already_completed(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test admin creation when setup already completed."""
        # Create first admin
        await client.post("/api/v1/setup/admin", json=test_user_data)

        # Try to create another admin
        response = await client.post(
            "/api/v1/setup/admin",
            json={
                "email": "admin2@example.com",
                "name": "Admin 2",
                "password": "Admin123Pass",
            },
        )

        assert response.status_code == 403
        assert "already been completed" in response.json()["detail"]

    async def test_create_admin_invalid_password(
        self,
        client: AsyncClient,
    ) -> None:
        """Test admin creation with weak password."""
        response = await client.post(
            "/api/v1/setup/admin",
            json={
                "email": "admin@example.com",
                "name": "Admin",
                "password": "weak",
            },
        )

        assert response.status_code == 422

    async def test_create_admin_invalid_email(
        self,
        client: AsyncClient,
    ) -> None:
        """Test admin creation with invalid email."""
        response = await client.post(
            "/api/v1/setup/admin",
            json={
                "email": "invalid-email",
                "name": "Admin",
                "password": "AdminPass123",
            },
        )

        assert response.status_code == 422
