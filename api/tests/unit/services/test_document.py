"""Unit tests for DocumentService."""

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.document import Document
from app.models.document_revision import ChangeType
from app.models.project import Project, ProjectVisibility
from app.services.document import DocumentService
from app.services.exceptions import (
    InvalidPathError,
    ParentNotFoundError,
    PermissionDeniedError,
    ProjectNotFoundError,
)


class TestDocumentServiceGetTree:
    """Tests for get_document_tree method."""

    @pytest.fixture
    def mock_document_repo(self) -> MagicMock:
        """Create mock document repository."""
        return MagicMock()

    @pytest.fixture
    def mock_revision_repo(self) -> MagicMock:
        """Create mock revision repository."""
        return MagicMock()

    @pytest.fixture
    def mock_project_repo(self) -> MagicMock:
        """Create mock project repository."""
        return MagicMock()

    @pytest.fixture
    def document_service(
        self,
        mock_document_repo: MagicMock,
        mock_revision_repo: MagicMock,
        mock_project_repo: MagicMock,
    ) -> DocumentService:
        """Create DocumentService with mocked repositories."""
        return DocumentService(
            mock_document_repo,
            mock_revision_repo,
            mock_project_repo,
        )

    @pytest.mark.asyncio
    async def test_get_tree_project_not_found(
        self,
        document_service: DocumentService,
        mock_project_repo: MagicMock,
    ) -> None:
        """Test get_document_tree raises error when project not found."""
        mock_project_repo.get_by_slug = AsyncMock(return_value=None)

        with pytest.raises(ProjectNotFoundError):
            await document_service.get_document_tree("non-existent", uuid4())

    @pytest.mark.asyncio
    async def test_get_tree_permission_denied(
        self,
        document_service: DocumentService,
        mock_project_repo: MagicMock,
    ) -> None:
        """Test get_document_tree raises error for private project."""
        project = MagicMock(spec=Project)
        project.owner_id = uuid4()
        project.visibility = ProjectVisibility.PRIVATE
        mock_project_repo.get_by_slug = AsyncMock(return_value=project)

        with pytest.raises(PermissionDeniedError):
            await document_service.get_document_tree("private-project", uuid4())

    @pytest.mark.asyncio
    async def test_get_tree_success(
        self,
        document_service: DocumentService,
        mock_project_repo: MagicMock,
        mock_document_repo: MagicMock,
    ) -> None:
        """Test get_document_tree returns tree for owner."""
        owner_id = uuid4()
        project_id = uuid4()

        project = MagicMock(spec=Project)
        project.id = project_id
        project.owner_id = owner_id
        project.visibility = ProjectVisibility.PRIVATE
        mock_project_repo.get_by_slug = AsyncMock(return_value=project)

        doc1 = MagicMock(spec=Document)
        doc1.id = uuid4()
        doc1.slug = "doc1"
        doc1.path = "doc1"
        doc1.title = "Document 1"
        doc1.index = 0
        doc1.is_folder = False
        doc1.parent_id = None

        mock_document_repo.get_all_by_project = AsyncMock(return_value=[doc1])

        result = await document_service.get_document_tree("test-project", owner_id)

        assert len(result) == 1
        assert result[0].slug == "doc1"


class TestDocumentServiceParsePath:
    """Tests for _parse_path helper method."""

    @pytest.fixture
    def document_service(self) -> DocumentService:
        """Create DocumentService with mocked repositories."""
        return DocumentService(MagicMock(), MagicMock(), MagicMock())

    def test_parse_path_root_level(self, document_service: DocumentService) -> None:
        """Test parsing root level path."""
        parent_path, slug = document_service._parse_path("doc")
        assert parent_path is None
        assert slug == "doc"

    def test_parse_path_nested(self, document_service: DocumentService) -> None:
        """Test parsing nested path."""
        parent_path, slug = document_service._parse_path("folder/subfolder/doc")
        assert parent_path == "folder/subfolder"
        assert slug == "doc"

    def test_parse_path_empty_raises_error(
        self, document_service: DocumentService
    ) -> None:
        """Test empty path raises error."""
        with pytest.raises(InvalidPathError):
            document_service._parse_path("")

    def test_parse_path_strips_slashes(self, document_service: DocumentService) -> None:
        """Test path with leading/trailing slashes."""
        parent_path, slug = document_service._parse_path("/folder/doc/")
        assert parent_path == "folder"
        assert slug == "doc"


class TestDocumentServiceDetermineChangeType:
    """Tests for _determine_change_type helper method."""

    @pytest.fixture
    def document_service(self) -> DocumentService:
        """Create DocumentService with mocked repositories."""
        return DocumentService(MagicMock(), MagicMock(), MagicMock())

    def test_rename_only(self, document_service: DocumentService) -> None:
        """Test rename detection when only title changes."""
        existing = MagicMock(spec=Document)
        existing.title = "Old Title"
        existing.content = "Content"

        result = document_service._determine_change_type(
            existing, "New Title", "Content"
        )
        assert result == ChangeType.RENAME

    def test_update_content(self, document_service: DocumentService) -> None:
        """Test update detection when content changes."""
        existing = MagicMock(spec=Document)
        existing.title = "Title"
        existing.content = "Old Content"

        result = document_service._determine_change_type(
            existing, "Title", "New Content"
        )
        assert result == ChangeType.UPDATE

    def test_update_both(self, document_service: DocumentService) -> None:
        """Test update detection when both title and content change."""
        existing = MagicMock(spec=Document)
        existing.title = "Old Title"
        existing.content = "Old Content"

        result = document_service._determine_change_type(
            existing, "New Title", "New Content"
        )
        assert result == ChangeType.UPDATE


class TestDocumentServicePutDocument:
    """Tests for put_document method."""

    @pytest.fixture
    def mock_document_repo(self) -> MagicMock:
        """Create mock document repository."""
        return MagicMock()

    @pytest.fixture
    def mock_revision_repo(self) -> MagicMock:
        """Create mock revision repository."""
        return MagicMock()

    @pytest.fixture
    def mock_project_repo(self) -> MagicMock:
        """Create mock project repository."""
        return MagicMock()

    @pytest.fixture
    def document_service(
        self,
        mock_document_repo: MagicMock,
        mock_revision_repo: MagicMock,
        mock_project_repo: MagicMock,
    ) -> DocumentService:
        """Create DocumentService with mocked repositories."""
        return DocumentService(
            mock_document_repo,
            mock_revision_repo,
            mock_project_repo,
        )

    @pytest.mark.asyncio
    async def test_put_document_parent_not_found(
        self,
        document_service: DocumentService,
        mock_project_repo: MagicMock,
        mock_document_repo: MagicMock,
    ) -> None:
        """Test put_document raises error when parent not found."""
        owner_id = uuid4()
        project = MagicMock(spec=Project)
        project.id = uuid4()
        project.owner_id = owner_id
        project.visibility = ProjectVisibility.PRIVATE
        mock_project_repo.get_by_slug = AsyncMock(return_value=project)

        mock_document_repo.get_parent_by_path = AsyncMock(return_value=None)

        from app.schemas.document import DocumentPutRequest

        request = DocumentPutRequest(title="Test", content="Content")

        with pytest.raises(ParentNotFoundError):
            await document_service.put_document(
                "test-project", "nonexistent/doc", request, owner_id
            )
