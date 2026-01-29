"""Tests for project member service."""

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.project import Project
from app.models.project_member import MemberRole, ProjectMember
from app.models.user import User
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.user import UserRepository
from app.services import (
    CannotModifyOwnerError,
    CannotModifySelfError,
    MemberAlreadyExistsError,
    MemberNotFoundError,
    PermissionDeniedError,
    ProjectMemberService,
    ProjectNotFoundError,
    UserNotFoundError,
)


class TestProjectMemberServiceListMembers:
    """Tests for ProjectMemberService.list_members method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        member_repo = MagicMock(spec=ProjectMemberRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        user_repo = MagicMock(spec=UserRepository)
        return member_repo, project_repo, user_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectMemberService:
        """Create service with mock repositories."""
        return ProjectMemberService(*mock_repos)

    @pytest.mark.asyncio
    async def test_list_members_as_owner(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test owner can list members."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)

        mock_member = MagicMock(spec=ProjectMember)
        mock_member.id = uuid4()
        mock_member.project_id = mock_project.id
        mock_member.user_id = uuid4()
        mock_member.role = MemberRole.VIEWER
        mock_member.user = MagicMock(spec=User)
        mock_member.user.name = "Test User"
        mock_member.user.email = "test@example.com"
        mock_member.user.avatar_url = None

        member_repo.get_members_by_project = AsyncMock(return_value=[mock_member])

        result = await service.list_members("my-project", owner_id)

        assert len(result) == 1
        member_repo.get_members_by_project.assert_called_once()

    @pytest.mark.asyncio
    async def test_list_members_project_not_found(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test list members fails when project not found."""
        _, project_repo, _ = mock_repos
        project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError):
            await service.list_members("nonexistent", uuid4())


class TestProjectMemberServiceAddMember:
    """Tests for ProjectMemberService.add_member method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        member_repo = MagicMock(spec=ProjectMemberRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        user_repo = MagicMock(spec=UserRepository)
        return member_repo, project_repo, user_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectMemberService:
        """Create service with mock repositories."""
        return ProjectMemberService(*mock_repos)

    @pytest.mark.asyncio
    async def test_add_member_success(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test successfully adding a member."""
        member_repo, project_repo, user_repo = mock_repos
        owner_id = uuid4()
        new_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        user_repo.get_by_id = AsyncMock(return_value=MagicMock(spec=User))
        member_repo.get_user_role = AsyncMock(return_value=None)
        member_repo.get_by_project_and_user = AsyncMock(return_value=None)

        mock_member = MagicMock(spec=ProjectMember)
        member_repo.create = AsyncMock(return_value=mock_member)

        result = await service.add_member(
            "my-project", new_user_id, MemberRole.VIEWER, owner_id
        )

        assert result is not None
        member_repo.create.assert_called_once_with(
            mock_project.id, new_user_id, MemberRole.VIEWER
        )

    @pytest.mark.asyncio
    async def test_add_member_permission_denied(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test add member fails without permission."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()
        viewer_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_user_role = AsyncMock(return_value=MemberRole.VIEWER)

        with pytest.raises(PermissionDeniedError):
            await service.add_member(
                "my-project", uuid4(), MemberRole.VIEWER, viewer_id
            )

    @pytest.mark.asyncio
    async def test_add_member_user_not_found(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test add member fails when target user not found."""
        member_repo, project_repo, user_repo = mock_repos
        owner_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        user_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(UserNotFoundError):
            await service.add_member("my-project", uuid4(), MemberRole.VIEWER, owner_id)

    @pytest.mark.asyncio
    async def test_add_member_cannot_add_owner(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test cannot add owner as a member."""
        member_repo, project_repo, user_repo = mock_repos
        owner_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        user_repo.get_by_id = AsyncMock(return_value=MagicMock(spec=User))

        with pytest.raises(CannotModifyOwnerError):
            await service.add_member("my-project", owner_id, MemberRole.ADMIN, owner_id)

    @pytest.mark.asyncio
    async def test_add_member_already_exists(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test add member fails when user is already a member."""
        member_repo, project_repo, user_repo = mock_repos
        owner_id = uuid4()
        existing_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        existing_member = MagicMock(spec=ProjectMember)
        existing_member.role = MemberRole.VIEWER

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        user_repo.get_by_id = AsyncMock(return_value=MagicMock(spec=User))
        member_repo.get_by_project_and_user = AsyncMock(return_value=existing_member)

        with pytest.raises(MemberAlreadyExistsError):
            await service.add_member(
                "my-project", existing_user_id, MemberRole.EDITOR, owner_id
            )


class TestProjectMemberServiceUpdateRole:
    """Tests for ProjectMemberService.update_member_role method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        member_repo = MagicMock(spec=ProjectMemberRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        user_repo = MagicMock(spec=UserRepository)
        return member_repo, project_repo, user_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectMemberService:
        """Create service with mock repositories."""
        return ProjectMemberService(*mock_repos)

    @pytest.mark.asyncio
    async def test_update_role_success(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test successfully updating member role."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()
        member_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        mock_member = MagicMock(spec=ProjectMember)
        mock_member.id = uuid4()
        mock_member.project_id = mock_project.id
        mock_member.user_id = member_user_id
        mock_member.role = MemberRole.VIEWER

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_by_id = AsyncMock(return_value=mock_member)
        member_repo.update_role = AsyncMock(return_value=mock_member)

        await service.update_member_role(
            "my-project", mock_member.id, MemberRole.EDITOR, owner_id
        )

        member_repo.update_role.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_role_member_not_found(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test update fails when member not found."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(MemberNotFoundError):
            await service.update_member_role(
                "my-project", uuid4(), MemberRole.EDITOR, owner_id
            )

    @pytest.mark.asyncio
    async def test_admin_cannot_modify_self(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test admin cannot modify their own role."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()
        admin_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        mock_member = MagicMock(spec=ProjectMember)
        mock_member.id = uuid4()
        mock_member.project_id = mock_project.id
        mock_member.user_id = admin_id
        mock_member.role = MemberRole.ADMIN

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_user_role = AsyncMock(return_value=MemberRole.ADMIN)
        member_repo.get_by_id = AsyncMock(return_value=mock_member)

        with pytest.raises(CannotModifySelfError):
            await service.update_member_role(
                "my-project", mock_member.id, MemberRole.VIEWER, admin_id
            )


class TestProjectMemberServiceRemoveMember:
    """Tests for ProjectMemberService.remove_member method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        member_repo = MagicMock(spec=ProjectMemberRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        user_repo = MagicMock(spec=UserRepository)
        return member_repo, project_repo, user_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectMemberService:
        """Create service with mock repositories."""
        return ProjectMemberService(*mock_repos)

    @pytest.mark.asyncio
    async def test_remove_member_success(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test successfully removing a member."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        mock_member = MagicMock(spec=ProjectMember)
        mock_member.id = uuid4()
        mock_member.project_id = mock_project.id
        mock_member.user_id = uuid4()

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_by_id = AsyncMock(return_value=mock_member)
        member_repo.delete = AsyncMock()

        await service.remove_member("my-project", mock_member.id, owner_id)

        member_repo.delete.assert_called_once_with(mock_member)

    @pytest.mark.asyncio
    async def test_self_removal_allowed(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test that members can remove themselves (leave project)."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()
        member_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        mock_member = MagicMock(spec=ProjectMember)
        mock_member.id = uuid4()
        mock_member.project_id = mock_project.id
        mock_member.user_id = member_user_id

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_by_id = AsyncMock(return_value=mock_member)
        member_repo.delete = AsyncMock()

        # Member removes themselves
        await service.remove_member("my-project", mock_member.id, member_user_id)

        member_repo.delete.assert_called_once_with(mock_member)

    @pytest.mark.asyncio
    async def test_remove_member_permission_denied(
        self,
        service: ProjectMemberService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test remove fails without permission."""
        member_repo, project_repo, _ = mock_repos
        owner_id = uuid4()
        viewer_id = uuid4()
        other_member_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        mock_member = MagicMock(spec=ProjectMember)
        mock_member.id = uuid4()
        mock_member.project_id = mock_project.id
        mock_member.user_id = other_member_id

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_by_id = AsyncMock(return_value=mock_member)
        member_repo.get_user_role = AsyncMock(return_value=MemberRole.VIEWER)

        with pytest.raises(PermissionDeniedError):
            await service.remove_member("my-project", mock_member.id, viewer_id)
