"""Tests for project bookmark service."""

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.project import Project
from app.models.project_bookmark import ProjectBookmark
from app.models.project_member import ProjectMember
from app.repositories.project import ProjectRepository
from app.repositories.project_bookmark import ProjectBookmarkRepository
from app.repositories.project_member import ProjectMemberRepository
from app.services import (
    PermissionDeniedError,
    ProjectBookmarkService,
    ProjectNotFoundError,
)


class TestProjectBookmarkServiceAddBookmark:
    """Tests for ProjectBookmarkService.add_bookmark method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        bookmark_repo = MagicMock(spec=ProjectBookmarkRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        member_repo = MagicMock(spec=ProjectMemberRepository)
        return bookmark_repo, project_repo, member_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectBookmarkService:
        """Create service with mock repositories."""
        return ProjectBookmarkService(*mock_repos)

    @pytest.mark.asyncio
    async def test_add_bookmark_success(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test successfully adding a bookmark as project owner."""
        bookmark_repo, project_repo, _ = mock_repos
        owner_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        bookmark_repo.get = AsyncMock(return_value=None)

        mock_bookmark = MagicMock(spec=ProjectBookmark)
        mock_bookmark.user_id = owner_id
        mock_bookmark.project_id = mock_project.id
        bookmark_repo.create = AsyncMock(return_value=mock_bookmark)

        result = await service.add_bookmark("my-project", owner_id)

        assert result is not None
        bookmark_repo.create.assert_called_once_with(owner_id, mock_project.id)

    @pytest.mark.asyncio
    async def test_add_bookmark_idempotent(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test adding existing bookmark returns existing one (idempotent)."""
        bookmark_repo, project_repo, _ = mock_repos
        owner_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        existing_bookmark = MagicMock(spec=ProjectBookmark)
        existing_bookmark.user_id = owner_id
        existing_bookmark.project_id = mock_project.id

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        bookmark_repo.get = AsyncMock(return_value=existing_bookmark)

        result = await service.add_bookmark("my-project", owner_id)

        assert result == existing_bookmark
        bookmark_repo.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_add_bookmark_project_not_found(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test add bookmark fails when project not found."""
        _, project_repo, _ = mock_repos
        project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError):
            await service.add_bookmark("nonexistent", uuid4())

    @pytest.mark.asyncio
    async def test_add_bookmark_permission_denied(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test add bookmark fails without access to private project."""
        bookmark_repo, project_repo, member_repo = mock_repos
        owner_id = uuid4()
        other_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_by_project_and_user = AsyncMock(return_value=None)

        with pytest.raises(PermissionDeniedError):
            await service.add_bookmark("my-project", other_user_id)

    @pytest.mark.asyncio
    async def test_add_bookmark_public_project(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test any user can bookmark public projects."""
        bookmark_repo, project_repo, _ = mock_repos
        owner_id = uuid4()
        other_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "public"

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        bookmark_repo.get = AsyncMock(return_value=None)

        mock_bookmark = MagicMock(spec=ProjectBookmark)
        bookmark_repo.create = AsyncMock(return_value=mock_bookmark)

        result = await service.add_bookmark("public-project", other_user_id)

        assert result is not None
        bookmark_repo.create.assert_called_once_with(other_user_id, mock_project.id)

    @pytest.mark.asyncio
    async def test_add_bookmark_as_member(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test project member can bookmark private project."""
        bookmark_repo, project_repo, member_repo = mock_repos
        owner_id = uuid4()
        member_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.owner_id = owner_id
        mock_project.visibility = MagicMock()
        mock_project.visibility.value = "private"

        mock_member = MagicMock(spec=ProjectMember)

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        member_repo.get_by_project_and_user = AsyncMock(return_value=mock_member)
        bookmark_repo.get = AsyncMock(return_value=None)

        mock_bookmark = MagicMock(spec=ProjectBookmark)
        bookmark_repo.create = AsyncMock(return_value=mock_bookmark)

        result = await service.add_bookmark("my-project", member_user_id)

        assert result is not None
        bookmark_repo.create.assert_called_once_with(member_user_id, mock_project.id)


class TestProjectBookmarkServiceRemoveBookmark:
    """Tests for ProjectBookmarkService.remove_bookmark method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        bookmark_repo = MagicMock(spec=ProjectBookmarkRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        member_repo = MagicMock(spec=ProjectMemberRepository)
        return bookmark_repo, project_repo, member_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectBookmarkService:
        """Create service with mock repositories."""
        return ProjectBookmarkService(*mock_repos)

    @pytest.mark.asyncio
    async def test_remove_bookmark_success(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test successfully removing a bookmark."""
        bookmark_repo, project_repo, _ = mock_repos
        user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        bookmark_repo.delete = AsyncMock(return_value=True)

        result = await service.remove_bookmark("my-project", user_id)

        assert result is True
        bookmark_repo.delete.assert_called_once_with(user_id, mock_project.id)

    @pytest.mark.asyncio
    async def test_remove_bookmark_not_exists(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test removing non-existent bookmark returns False (idempotent)."""
        bookmark_repo, project_repo, _ = mock_repos
        user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        bookmark_repo.delete = AsyncMock(return_value=False)

        result = await service.remove_bookmark("my-project", user_id)

        assert result is False

    @pytest.mark.asyncio
    async def test_remove_bookmark_project_not_found(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test remove bookmark fails when project not found."""
        _, project_repo, _ = mock_repos
        project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError):
            await service.remove_bookmark("nonexistent", uuid4())


class TestProjectBookmarkServiceIsBookmarked:
    """Tests for ProjectBookmarkService.is_bookmarked method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        bookmark_repo = MagicMock(spec=ProjectBookmarkRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        member_repo = MagicMock(spec=ProjectMemberRepository)
        return bookmark_repo, project_repo, member_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectBookmarkService:
        """Create service with mock repositories."""
        return ProjectBookmarkService(*mock_repos)

    @pytest.mark.asyncio
    async def test_is_bookmarked_true(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test is_bookmarked returns True when bookmarked."""
        bookmark_repo, project_repo, _ = mock_repos
        user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        bookmark_repo.exists = AsyncMock(return_value=True)

        result = await service.is_bookmarked("my-project", user_id)

        assert result is True
        bookmark_repo.exists.assert_called_once_with(user_id, mock_project.id)

    @pytest.mark.asyncio
    async def test_is_bookmarked_false(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test is_bookmarked returns False when not bookmarked."""
        bookmark_repo, project_repo, _ = mock_repos
        user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()

        project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        bookmark_repo.exists = AsyncMock(return_value=False)

        result = await service.is_bookmarked("my-project", user_id)

        assert result is False

    @pytest.mark.asyncio
    async def test_is_bookmarked_project_not_found(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test is_bookmarked fails when project not found."""
        _, project_repo, _ = mock_repos
        project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError):
            await service.is_bookmarked("nonexistent", uuid4())


class TestProjectBookmarkServiceGetBookmarkedProjects:
    """Tests for ProjectBookmarkService.get_bookmarked_projects method."""

    @pytest.fixture
    def mock_repos(self) -> tuple[MagicMock, MagicMock, MagicMock]:
        """Create mock repositories."""
        bookmark_repo = MagicMock(spec=ProjectBookmarkRepository)
        project_repo = MagicMock(spec=ProjectRepository)
        member_repo = MagicMock(spec=ProjectMemberRepository)
        return bookmark_repo, project_repo, member_repo

    @pytest.fixture
    def service(
        self, mock_repos: tuple[MagicMock, MagicMock, MagicMock]
    ) -> ProjectBookmarkService:
        """Create service with mock repositories."""
        return ProjectBookmarkService(*mock_repos)

    @pytest.mark.asyncio
    async def test_get_bookmarked_projects_success(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test successfully getting bookmarked projects."""
        bookmark_repo, _, _ = mock_repos
        user_id = uuid4()

        mock_bookmark1 = MagicMock(spec=ProjectBookmark)
        mock_bookmark2 = MagicMock(spec=ProjectBookmark)
        bookmarks = [mock_bookmark1, mock_bookmark2]

        bookmark_repo.get_by_user = AsyncMock(return_value=bookmarks)

        result = await service.get_bookmarked_projects(user_id)

        assert len(result) == 2
        bookmark_repo.get_by_user.assert_called_once_with(user_id, 0, 100)

    @pytest.mark.asyncio
    async def test_get_bookmarked_projects_empty(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test getting bookmarks when none exist."""
        bookmark_repo, _, _ = mock_repos
        user_id = uuid4()

        bookmark_repo.get_by_user = AsyncMock(return_value=[])

        result = await service.get_bookmarked_projects(user_id)

        assert len(result) == 0

    @pytest.mark.asyncio
    async def test_get_bookmarked_projects_pagination(
        self,
        service: ProjectBookmarkService,
        mock_repos: tuple[MagicMock, MagicMock, MagicMock],
    ) -> None:
        """Test pagination parameters are passed correctly."""
        bookmark_repo, _, _ = mock_repos
        user_id = uuid4()

        bookmark_repo.get_by_user = AsyncMock(return_value=[])

        await service.get_bookmarked_projects(user_id, skip=10, limit=20)

        bookmark_repo.get_by_user.assert_called_once_with(user_id, 10, 20)
