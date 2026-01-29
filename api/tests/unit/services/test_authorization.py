"""Tests for authorization helper."""

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.project import Project
from app.models.project_member import MemberRole
from app.repositories.project_member import ProjectMemberRepository
from app.services.authorization import (
    Permission,
    check_project_permission,
    get_user_permissions,
)


class TestCheckProjectPermission:
    """Tests for check_project_permission function."""

    @pytest.fixture
    def mock_member_repo(self) -> MagicMock:
        """Create a mock project member repository."""
        return MagicMock(spec=ProjectMemberRepository)

    @pytest.fixture
    def mock_project(self) -> MagicMock:
        """Create a mock project."""
        project = MagicMock(spec=Project)
        project.id = uuid4()
        project.owner_id = uuid4()
        project.visibility = MagicMock()
        project.visibility.value = "private"
        return project

    @pytest.mark.asyncio
    async def test_owner_has_all_permissions(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that owner has all permissions."""
        user_id = mock_project.owner_id

        for permission in Permission:
            result = await check_project_permission(
                mock_project, user_id, permission, mock_member_repo
            )
            assert result is True

        # Member repo should not be called for owner
        mock_member_repo.get_user_role.assert_not_called()

    @pytest.mark.asyncio
    async def test_public_project_view_access(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that public projects allow view access to everyone."""
        mock_project.visibility.value = "public"
        user_id = uuid4()

        result = await check_project_permission(
            mock_project, user_id, Permission.VIEW, mock_member_repo
        )

        assert result is True
        mock_member_repo.get_user_role.assert_not_called()

    @pytest.mark.asyncio
    async def test_public_project_edit_requires_membership(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that public projects still require membership for edit."""
        mock_project.visibility.value = "public"
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=None)

        result = await check_project_permission(
            mock_project, user_id, Permission.EDIT, mock_member_repo
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_viewer_can_view(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that viewer role has view permission."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=MemberRole.VIEWER)

        result = await check_project_permission(
            mock_project, user_id, Permission.VIEW, mock_member_repo
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_viewer_cannot_edit(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that viewer role cannot edit."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=MemberRole.VIEWER)

        result = await check_project_permission(
            mock_project, user_id, Permission.EDIT, mock_member_repo
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_editor_can_view_and_edit(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that editor role has view and edit permissions."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=MemberRole.EDITOR)

        for permission in [Permission.VIEW, Permission.EDIT]:
            result = await check_project_permission(
                mock_project, user_id, permission, mock_member_repo
            )
            assert result is True

    @pytest.mark.asyncio
    async def test_editor_cannot_manage_members(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that editor role cannot manage members."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=MemberRole.EDITOR)

        result = await check_project_permission(
            mock_project, user_id, Permission.MANAGE_MEMBERS, mock_member_repo
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_admin_can_manage_members(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that admin role can manage members."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=MemberRole.ADMIN)

        for permission in [Permission.VIEW, Permission.EDIT, Permission.MANAGE_MEMBERS]:
            result = await check_project_permission(
                mock_project, user_id, permission, mock_member_repo
            )
            assert result is True

    @pytest.mark.asyncio
    async def test_admin_cannot_manage_settings(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that admin role cannot manage project settings."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=MemberRole.ADMIN)

        result = await check_project_permission(
            mock_project, user_id, Permission.MANAGE_SETTINGS, mock_member_repo
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_non_member_no_access(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that non-members have no access to private projects."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=None)

        for permission in Permission:
            result = await check_project_permission(
                mock_project, user_id, permission, mock_member_repo
            )
            assert result is False


class TestGetUserPermissions:
    """Tests for get_user_permissions function."""

    @pytest.fixture
    def mock_member_repo(self) -> MagicMock:
        """Create a mock project member repository."""
        return MagicMock(spec=ProjectMemberRepository)

    @pytest.fixture
    def mock_project(self) -> MagicMock:
        """Create a mock project."""
        project = MagicMock(spec=Project)
        project.id = uuid4()
        project.owner_id = uuid4()
        project.visibility = MagicMock()
        project.visibility.value = "private"
        return project

    @pytest.mark.asyncio
    async def test_owner_gets_all_permissions(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that owner gets all permissions."""
        user_id = mock_project.owner_id

        result = await get_user_permissions(mock_project, user_id, mock_member_repo)

        assert Permission.VIEW in result
        assert Permission.EDIT in result
        assert Permission.MANAGE_MEMBERS in result
        assert Permission.MANAGE_SETTINGS in result
        assert Permission.DELETE_PROJECT in result

    @pytest.mark.asyncio
    async def test_public_project_includes_view(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test that public projects include view permission."""
        mock_project.visibility.value = "public"
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=None)

        result = await get_user_permissions(mock_project, user_id, mock_member_repo)

        assert Permission.VIEW in result
        assert Permission.EDIT not in result

    @pytest.mark.asyncio
    async def test_editor_permissions(
        self, mock_member_repo: MagicMock, mock_project: MagicMock
    ) -> None:
        """Test editor role permissions."""
        user_id = uuid4()
        mock_member_repo.get_user_role = AsyncMock(return_value=MemberRole.EDITOR)

        result = await get_user_permissions(mock_project, user_id, mock_member_repo)

        assert Permission.VIEW in result
        assert Permission.EDIT in result
        assert Permission.MANAGE_MEMBERS not in result
