"""Tests for project service."""

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.project import Project
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services import (
    PermissionDeniedError,
    ProjectNotFoundError,
    ProjectService,
    SlugAlreadyExistsError,
)


class TestProjectServiceCreate:
    """Tests for ProjectService.create_project method."""

    @pytest.fixture
    def mock_project_repo(self) -> MagicMock:
        """Create a mock project repository."""
        return MagicMock(spec=ProjectRepository)

    @pytest.fixture
    def project_service(self, mock_project_repo: MagicMock) -> ProjectService:
        """Create a ProjectService instance with mock repository."""
        return ProjectService(mock_project_repo)

    @pytest.mark.asyncio
    async def test_create_project_success(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test successful project creation."""
        owner_id = uuid4()
        project_data = ProjectCreate(
            slug="my-project",
            name="My Project",
            description="Test project",
        )

        mock_project = MagicMock(spec=Project)
        mock_project.id = uuid4()
        mock_project.slug = "my-project"
        mock_project.name = "My Project"
        mock_project.owner_id = owner_id

        mock_project_repo.slug_exists = AsyncMock(return_value=False)
        mock_project_repo.create = AsyncMock(return_value=mock_project)

        result = await project_service.create_project(project_data, owner_id)

        assert result.slug == "my-project"
        mock_project_repo.slug_exists.assert_called_once_with("my-project")
        mock_project_repo.create.assert_called_once_with(project_data, owner_id)

    @pytest.mark.asyncio
    async def test_create_project_slug_already_exists(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test project creation fails when slug already exists."""
        project_data = ProjectCreate(
            slug="existing-project",
            name="Existing Project",
        )

        mock_project_repo.slug_exists = AsyncMock(return_value=True)

        with pytest.raises(SlugAlreadyExistsError, match="already exists"):
            await project_service.create_project(project_data, uuid4())

        mock_project_repo.create.assert_not_called()


class TestProjectServiceGetBySlug:
    """Tests for ProjectService.get_project_by_slug method."""

    @pytest.fixture
    def mock_project_repo(self) -> MagicMock:
        """Create a mock project repository."""
        return MagicMock(spec=ProjectRepository)

    @pytest.fixture
    def project_service(self, mock_project_repo: MagicMock) -> ProjectService:
        """Create a ProjectService instance with mock repository."""
        return ProjectService(mock_project_repo)

    @pytest.mark.asyncio
    async def test_get_project_success(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test successful project retrieval."""
        mock_project = MagicMock(spec=Project)
        mock_project.slug = "my-project"

        mock_project_repo.get_by_slug = AsyncMock(return_value=mock_project)

        result = await project_service.get_project_by_slug("my-project")

        assert result.slug == "my-project"

    @pytest.mark.asyncio
    async def test_get_project_not_found(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test project retrieval fails when not found."""
        mock_project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError, match="not found"):
            await project_service.get_project_by_slug("nonexistent")


class TestProjectServiceUpdate:
    """Tests for ProjectService.update_project method."""

    @pytest.fixture
    def mock_project_repo(self) -> MagicMock:
        """Create a mock project repository."""
        return MagicMock(spec=ProjectRepository)

    @pytest.fixture
    def project_service(self, mock_project_repo: MagicMock) -> ProjectService:
        """Create a ProjectService instance with mock repository."""
        return ProjectService(mock_project_repo)

    @pytest.mark.asyncio
    async def test_update_project_success(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test successful project update."""
        owner_id = uuid4()
        mock_project = MagicMock(spec=Project)
        mock_project.slug = "my-project"
        mock_project.owner_id = owner_id

        update_data = ProjectUpdate(name="Updated Name")

        mock_project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        mock_project_repo.update = AsyncMock(return_value=mock_project)

        result = await project_service.update_project(
            "my-project", update_data, owner_id
        )

        assert result is not None
        mock_project_repo.update.assert_called_once_with(mock_project, update_data)

    @pytest.mark.asyncio
    async def test_update_project_not_found(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test update fails when project not found."""
        mock_project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError):
            await project_service.update_project(
                "nonexistent", ProjectUpdate(name="Test"), uuid4()
            )

    @pytest.mark.asyncio
    async def test_update_project_permission_denied(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test update fails when user is not owner."""
        owner_id = uuid4()
        other_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.owner_id = owner_id

        mock_project_repo.get_by_slug = AsyncMock(return_value=mock_project)

        with pytest.raises(PermissionDeniedError, match="Only the project owner"):
            await project_service.update_project(
                "my-project", ProjectUpdate(name="Test"), other_user_id
            )


class TestProjectServiceDelete:
    """Tests for ProjectService.delete_project method."""

    @pytest.fixture
    def mock_project_repo(self) -> MagicMock:
        """Create a mock project repository."""
        return MagicMock(spec=ProjectRepository)

    @pytest.fixture
    def project_service(self, mock_project_repo: MagicMock) -> ProjectService:
        """Create a ProjectService instance with mock repository."""
        return ProjectService(mock_project_repo)

    @pytest.mark.asyncio
    async def test_delete_project_success(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test successful project deletion."""
        owner_id = uuid4()
        mock_project = MagicMock(spec=Project)
        mock_project.owner_id = owner_id

        mock_project_repo.get_by_slug = AsyncMock(return_value=mock_project)
        mock_project_repo.delete = AsyncMock()

        await project_service.delete_project("my-project", owner_id)

        mock_project_repo.delete.assert_called_once_with(mock_project)

    @pytest.mark.asyncio
    async def test_delete_project_not_found(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test delete fails when project not found."""
        mock_project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError):
            await project_service.delete_project("nonexistent", uuid4())

    @pytest.mark.asyncio
    async def test_delete_project_permission_denied(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test delete fails when user is not owner."""
        owner_id = uuid4()
        other_user_id = uuid4()

        mock_project = MagicMock(spec=Project)
        mock_project.owner_id = owner_id

        mock_project_repo.get_by_slug = AsyncMock(return_value=mock_project)

        with pytest.raises(PermissionDeniedError):
            await project_service.delete_project("my-project", other_user_id)


class TestProjectServiceGetByOwner:
    """Tests for ProjectService.get_projects_by_owner method."""

    @pytest.fixture
    def mock_project_repo(self) -> MagicMock:
        """Create a mock project repository."""
        return MagicMock(spec=ProjectRepository)

    @pytest.fixture
    def project_service(self, mock_project_repo: MagicMock) -> ProjectService:
        """Create a ProjectService instance with mock repository."""
        return ProjectService(mock_project_repo)

    @pytest.mark.asyncio
    async def test_get_projects_by_owner_success(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test successful project list retrieval."""
        owner_id = uuid4()
        mock_projects = [MagicMock(spec=Project), MagicMock(spec=Project)]

        mock_project_repo.get_by_owner = AsyncMock(return_value=mock_projects)

        result = await project_service.get_projects_by_owner(owner_id)

        assert len(result) == 2
        mock_project_repo.get_by_owner.assert_called_once_with(owner_id, 0, 100)

    @pytest.mark.asyncio
    async def test_get_projects_by_owner_empty(
        self, project_service: ProjectService, mock_project_repo: MagicMock
    ) -> None:
        """Test returns empty list when user has no projects."""
        mock_project_repo.get_by_owner = AsyncMock(return_value=[])

        result = await project_service.get_projects_by_owner(uuid4())

        assert result == []
