"""Tests for project repository."""

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.project import Project, ProjectVisibility
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class TestProjectRepositoryCreate:
    """Tests for ProjectRepository.create method."""

    @pytest.mark.asyncio
    async def test_create_project_success(self) -> None:
        """Test successful project creation."""
        mock_db = MagicMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        repo = ProjectRepository(mock_db)
        owner_id = uuid4()
        project_data = ProjectCreate(
            slug="test-project",
            name="Test Project",
            description="A test project",
            visibility=ProjectVisibility.PRIVATE,
        )

        result = await repo.create(project_data, owner_id)

        assert result.slug == "test-project"
        assert result.name == "Test Project"
        assert result.owner_id == owner_id
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()


class TestProjectRepositoryGet:
    """Tests for ProjectRepository.get_by_* methods."""

    @pytest.mark.asyncio
    async def test_get_by_slug_found(self) -> None:
        """Test getting project by slug when found."""
        mock_project = MagicMock(spec=Project)
        mock_project.slug = "test-project"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_project

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = ProjectRepository(mock_db)
        result = await repo.get_by_slug("test-project")

        assert result is not None
        assert result.slug == "test-project"

    @pytest.mark.asyncio
    async def test_get_by_slug_not_found(self) -> None:
        """Test getting project by slug when not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = ProjectRepository(mock_db)
        result = await repo.get_by_slug("nonexistent")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_id_found(self) -> None:
        """Test getting project by ID when found."""
        project_id = uuid4()
        mock_project = MagicMock(spec=Project)
        mock_project.id = project_id

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_project

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = ProjectRepository(mock_db)
        result = await repo.get_by_id(project_id)

        assert result is not None
        assert result.id == project_id

    @pytest.mark.asyncio
    async def test_get_by_owner(self) -> None:
        """Test getting projects by owner."""
        owner_id = uuid4()
        mock_projects = [MagicMock(spec=Project), MagicMock(spec=Project)]

        mock_scalars = MagicMock()
        mock_scalars.all.return_value = mock_projects

        mock_result = MagicMock()
        mock_result.scalars.return_value = mock_scalars

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = ProjectRepository(mock_db)
        result = await repo.get_by_owner(owner_id)

        assert len(result) == 2


class TestProjectRepositoryUpdate:
    """Tests for ProjectRepository.update method."""

    @pytest.mark.asyncio
    async def test_update_project_success(self) -> None:
        """Test successful project update."""
        mock_project = MagicMock(spec=Project)
        mock_project.name = "Old Name"

        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        repo = ProjectRepository(mock_db)
        update_data = ProjectUpdate(name="New Name")

        result = await repo.update(mock_project, update_data)

        assert result.name == "New Name"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()


class TestProjectRepositoryDelete:
    """Tests for ProjectRepository.delete method."""

    @pytest.mark.asyncio
    async def test_delete_project_success(self) -> None:
        """Test successful project deletion."""
        mock_project = MagicMock(spec=Project)

        mock_db = MagicMock()
        mock_db.delete = AsyncMock()
        mock_db.commit = AsyncMock()

        repo = ProjectRepository(mock_db)

        await repo.delete(mock_project)

        mock_db.delete.assert_called_once_with(mock_project)
        mock_db.commit.assert_called_once()


class TestProjectRepositorySlugExists:
    """Tests for ProjectRepository.slug_exists method."""

    @pytest.mark.asyncio
    async def test_slug_exists_true(self) -> None:
        """Test slug exists returns true when found."""
        mock_project = MagicMock(spec=Project)

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_project

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = ProjectRepository(mock_db)
        result = await repo.slug_exists("existing-project")

        assert result is True

    @pytest.mark.asyncio
    async def test_slug_exists_false(self) -> None:
        """Test slug exists returns false when not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        repo = ProjectRepository(mock_db)
        result = await repo.slug_exists("nonexistent")

        assert result is False
