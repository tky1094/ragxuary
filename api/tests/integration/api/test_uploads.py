"""Tests for upload endpoints."""

import io
import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from PIL import Image


@pytest.fixture
def test_image_bytes() -> bytes:
    """Create a test PNG image."""
    img = Image.new("RGB", (100, 100), color="red")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def large_test_image_bytes() -> bytes:
    """Create a large test image that exceeds max dimension."""
    img = Image.new("RGB", (3000, 3000), color="blue")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def project_data() -> dict[str, Any]:
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
async def test_project(
    client: AsyncClient,
    auth_headers: dict[str, str],
    project_data: dict[str, Any],
) -> dict[str, Any]:
    """Create a test project and return its data."""
    with patch(
        "app.api.deps.is_token_blacklisted",
        new_callable=AsyncMock,
        return_value=False,
    ):
        response = await client.post(
            "/api/v1/projects", json=project_data, headers=auth_headers
        )
        return response.json()


def mock_filetype_png():
    """Create context manager for mocking filetype to return PNG."""
    mock_kind = MagicMock()
    mock_kind.mime = "image/png"
    return patch(
        "app.services.upload.filetype.guess",
        return_value=mock_kind,
    )


@pytest.mark.asyncio
class TestUploadImage:
    """Tests for POST /api/v1/projects/{project_id}/uploads."""

    async def test_upload_image_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project: dict[str, Any],
        test_image_bytes: bytes,
    ) -> None:
        """Test successful image upload."""
        with (
            patch(
                "app.api.deps.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            mock_filetype_png(),
        ):
            files = {"file": ("test.png", test_image_bytes, "image/png")}
            response = await client.post(
                f"/api/v1/projects/{test_project['id']}/uploads",
                files=files,
                headers=auth_headers,
            )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["filename"] == "test.png"
        assert data["mime_type"] == "image/png"
        assert "url" in data
        assert "created_at" in data

    async def test_upload_image_project_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_image_bytes: bytes,
    ) -> None:
        """Test upload to nonexistent project returns 404."""
        fake_id = str(uuid.uuid4())
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            files = {"file": ("test.png", test_image_bytes, "image/png")}
            response = await client.post(
                f"/api/v1/projects/{fake_id}/uploads",
                files=files,
                headers=auth_headers,
            )

        assert response.status_code == 404

    async def test_upload_image_no_permission(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        test_project: dict[str, Any],
        test_image_bytes: bytes,
    ) -> None:
        """Test upload without edit permission returns 403."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            files = {"file": ("test.png", test_image_bytes, "image/png")}
            response = await client.post(
                f"/api/v1/projects/{test_project['id']}/uploads",
                files=files,
                headers=second_user_headers,
            )

        assert response.status_code == 403

    async def test_upload_image_invalid_mime_type(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project: dict[str, Any],
    ) -> None:
        """Test upload with invalid MIME type returns 415."""
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Send text file claiming to be text
            files = {"file": ("test.txt", b"not an image", "text/plain")}
            response = await client.post(
                f"/api/v1/projects/{test_project['id']}/uploads",
                files=files,
                headers=auth_headers,
            )

        assert response.status_code == 415

    async def test_upload_image_unauthorized(
        self,
        client: AsyncClient,
        test_image_bytes: bytes,
    ) -> None:
        """Test upload without auth returns 401."""
        fake_id = str(uuid.uuid4())
        files = {"file": ("test.png", test_image_bytes, "image/png")}
        response = await client.post(
            f"/api/v1/projects/{fake_id}/uploads",
            files=files,
        )

        assert response.status_code == 401


@pytest.mark.asyncio
class TestGetUpload:
    """Tests for GET /api/v1/uploads/{upload_id}."""

    async def test_get_upload_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project: dict[str, Any],
        test_image_bytes: bytes,
    ) -> None:
        """Test successful upload retrieval."""
        with (
            patch(
                "app.api.deps.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            mock_filetype_png(),
        ):
            # First upload an image
            files = {"file": ("test.png", test_image_bytes, "image/png")}
            upload_response = await client.post(
                f"/api/v1/projects/{test_project['id']}/uploads",
                files=files,
                headers=auth_headers,
            )
            upload_id = upload_response.json()["id"]

            # Then retrieve it
            response = await client.get(
                f"/api/v1/uploads/{upload_id}",
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == upload_id
        assert data["filename"] == "test.png"

    async def test_get_upload_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test get nonexistent upload returns 404."""
        fake_id = str(uuid.uuid4())
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.get(
                f"/api/v1/uploads/{fake_id}",
                headers=auth_headers,
            )

        assert response.status_code == 404

    async def test_get_upload_unauthorized(
        self,
        client: AsyncClient,
    ) -> None:
        """Test get upload without auth returns 401."""
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/api/v1/uploads/{fake_id}")

        assert response.status_code == 401


@pytest.mark.asyncio
class TestDeleteUpload:
    """Tests for DELETE /api/v1/uploads/{upload_id}."""

    async def test_delete_upload_success(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        test_project: dict[str, Any],
        test_image_bytes: bytes,
    ) -> None:
        """Test successful upload deletion."""
        with (
            patch(
                "app.api.deps.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            mock_filetype_png(),
        ):
            # First upload an image
            files = {"file": ("test.png", test_image_bytes, "image/png")}
            upload_response = await client.post(
                f"/api/v1/projects/{test_project['id']}/uploads",
                files=files,
                headers=auth_headers,
            )
            upload_id = upload_response.json()["id"]

            # Then delete it
            response = await client.delete(
                f"/api/v1/uploads/{upload_id}",
                headers=auth_headers,
            )

        assert response.status_code == 204

    async def test_delete_upload_not_owner(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        second_user_headers: dict[str, str],
        test_project: dict[str, Any],
        test_image_bytes: bytes,
    ) -> None:
        """Test delete upload by non-owner returns 403."""
        with (
            patch(
                "app.api.deps.is_token_blacklisted",
                new_callable=AsyncMock,
                return_value=False,
            ),
            mock_filetype_png(),
        ):
            # Upload as first user
            files = {"file": ("test.png", test_image_bytes, "image/png")}
            upload_response = await client.post(
                f"/api/v1/projects/{test_project['id']}/uploads",
                files=files,
                headers=auth_headers,
            )
            upload_id = upload_response.json()["id"]

            # Try to delete as second user
            response = await client.delete(
                f"/api/v1/uploads/{upload_id}",
                headers=second_user_headers,
            )

        assert response.status_code == 403

    async def test_delete_upload_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Test delete nonexistent upload returns 404."""
        fake_id = str(uuid.uuid4())
        with patch(
            "app.api.deps.is_token_blacklisted",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = await client.delete(
                f"/api/v1/uploads/{fake_id}",
                headers=auth_headers,
            )

        assert response.status_code == 404

    async def test_delete_upload_unauthorized(
        self,
        client: AsyncClient,
    ) -> None:
        """Test delete upload without auth returns 401."""
        fake_id = str(uuid.uuid4())
        response = await client.delete(f"/api/v1/uploads/{fake_id}")

        assert response.status_code == 401
