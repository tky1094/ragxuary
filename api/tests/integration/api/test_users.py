"""Tests for user profile endpoints."""

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


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
class TestUpdateMyProfile:
    """Tests for PATCH /api/v1/users/me."""

    async def test_update_profile_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test successfully updating all profile fields."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.patch(
                "/api/v1/users/me",
                json={
                    "name": "Updated Name",
                    "avatar_url": "https://example.com/avatar.png",
                    "preferred_locale": "ja",
                },
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["avatar_url"] == "https://example.com/avatar.png"
        assert data["preferred_locale"] == "ja"

    async def test_update_profile_partial_update(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test updating only some fields."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Update only name
            response = await client.patch(
                "/api/v1/users/me",
                json={"name": "New Name Only"},
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name Only"

    async def test_update_profile_empty_body(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test updating with empty body returns current user."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.patch(
                "/api/v1/users/me",
                json={},
                headers=auth_headers,
            )

        assert response.status_code == 200
        # User data should be returned unchanged

    async def test_update_profile_unauthorized(
        self,
        client: AsyncClient,
    ) -> None:
        """Test updating profile without auth."""
        response = await client.patch(
            "/api/v1/users/me",
            json={"name": "New Name"},
        )
        assert response.status_code == 401  # No auth header

    async def test_update_profile_invalid_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test updating profile with invalid token."""
        response = await client.patch(
            "/api/v1/users/me",
            json={"name": "New Name"},
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    async def test_update_profile_name_too_short(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test validation error for name that is too short."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.patch(
                "/api/v1/users/me",
                json={"name": ""},  # Empty name
                headers=auth_headers,
            )

        assert response.status_code == 422

    async def test_update_profile_name_too_long(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test validation error for name that is too long."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.patch(
                "/api/v1/users/me",
                json={"name": "x" * 101},  # 101 characters
                headers=auth_headers,
            )

        assert response.status_code == 422

    async def test_update_profile_locale_too_short(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test validation error for locale that is too short."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.patch(
                "/api/v1/users/me",
                json={"preferred_locale": "x"},  # 1 character
                headers=auth_headers,
            )

        assert response.status_code == 422

    async def test_update_profile_preserves_other_fields(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_user_data: dict[str, Any],
    ) -> None:
        """Test that updating profile preserves other user fields."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.patch(
                "/api/v1/users/me",
                json={"name": "New Name"},
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        # Email should remain unchanged
        assert data["email"] == test_user_data["email"]
        # is_active should remain True
        assert data["is_active"] is True
