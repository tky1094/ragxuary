"""Tests for authentication endpoints."""

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRegister:
    """Tests for POST /api/v1/auth/register."""

    async def test_register_success(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test successful user registration."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            response = await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test registration with duplicate email."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            # Register first user
            await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )

            # Try to register with same email
            response = await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )

        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    async def test_register_weak_password(
        self,
        client: AsyncClient,
    ) -> None:
        """Test registration with weak password."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "weak",  # Too short
            },
        )

        assert response.status_code == 422

    async def test_register_password_no_number(
        self,
        client: AsyncClient,
    ) -> None:
        """Test registration with password without numbers."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "noNumbersHere",
            },
        )

        assert response.status_code == 422

    async def test_register_password_no_letters(
        self,
        client: AsyncClient,
    ) -> None:
        """Test registration with password without letters."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "12345678",
            },
        )

        assert response.status_code == 422

    async def test_register_invalid_email(
        self,
        client: AsyncClient,
    ) -> None:
        """Test registration with invalid email."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "name": "Test User",
                "password": "ValidPass123",
            },
        )

        assert response.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    """Tests for POST /api/v1/auth/login."""

    async def test_login_success(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test successful login."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            # Register user first
            await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )

            # Login
            response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": test_user_data["email"],
                    "password": test_user_data["password"],
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test login with wrong password."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            # Register user first
            await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )

            # Login with wrong password
            response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": test_user_data["email"],
                    "password": "WrongPassword123",
                },
            )

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    async def test_login_nonexistent_user(
        self,
        client: AsyncClient,
    ) -> None:
        """Test login with nonexistent user."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SomePassword123",
            },
        )

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
class TestLogout:
    """Tests for POST /api/v1/auth/logout."""

    async def test_logout_success(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test successful logout."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ) as mock_blacklist:
            # Register and get token
            register_response = await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )
            access_token = register_response.json()["access_token"]

            # Logout
            response = await client.post(
                "/api/v1/auth/logout",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        assert response.status_code == 204
        # Verify blacklist was called
        mock_blacklist.assert_called()

    async def test_logout_without_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test logout without token."""
        response = await client.post("/api/v1/auth/logout")

        # HTTPBearer returns 401 when no credentials are provided
        assert response.status_code == 401


@pytest.mark.asyncio
class TestRefresh:
    """Tests for POST /api/v1/auth/refresh."""

    async def test_refresh_success(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test successful token refresh."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            with patch(
                "app.api.v1.endpoints.auth.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ):
                # Register and get tokens
                register_response = await client.post(
                    "/api/v1/auth/register",
                    json=test_user_data,
                )
                refresh_token = register_response.json()["refresh_token"]

                # Refresh
                response = await client.post(
                    "/api/v1/auth/refresh",
                    json={"refresh_token": refresh_token},
                )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_refresh_invalid_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test refresh with invalid token."""
        with patch(
            "app.api.v1.endpoints.auth.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "invalid_token"},
            )

        assert response.status_code == 401

    async def test_refresh_blacklisted_token(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test refresh with blacklisted token."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            # Register and get tokens
            register_response = await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )
            refresh_token = register_response.json()["refresh_token"]

        # Mock blacklisted token
        with patch(
            "app.api.v1.endpoints.auth.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=True,
        ):
            response = await client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": refresh_token},
            )

        assert response.status_code == 401


@pytest.mark.asyncio
class TestGetCurrentUser:
    """Tests for GET /api/v1/auth/me."""

    async def test_get_current_user_success(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test getting current user info."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            with patch(
                "app.api.deps.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ):
                # Register and get token
                register_response = await client.post(
                    "/api/v1/auth/register",
                    json=test_user_data,
                )
                access_token = register_response.json()["access_token"]

                # Get current user
                response = await client.get(
                    "/api/v1/auth/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["name"] == test_user_data["name"]
        assert data["auth_provider"] == "local"
        assert data["is_active"] is True

    async def test_get_current_user_no_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test getting current user without token."""
        response = await client.get("/api/v1/auth/me")

        # HTTPBearer returns 401 when no credentials are provided
        assert response.status_code == 401

    async def test_get_current_user_invalid_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test getting current user with invalid token."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer invalid_token"},
            )

        assert response.status_code == 401

    async def test_get_current_user_blacklisted_token(
        self,
        client: AsyncClient,
        test_user_data: dict[str, Any],
    ) -> None:
        """Test getting current user with blacklisted token."""
        with patch(
            "app.api.v1.endpoints.auth.add_token_to_blacklist", new_callable=AsyncMock
        ):
            # Register and get token
            register_response = await client.post(
                "/api/v1/auth/register",
                json=test_user_data,
            )
            access_token = register_response.json()["access_token"]

        # Mock blacklisted token
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=True,
        ):
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        assert response.status_code == 401
