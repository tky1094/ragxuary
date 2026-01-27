"""Document service for business logic."""

from uuid import UUID

from app.models.document import Document
from app.models.document_revision import ChangeType
from app.models.project import Project
from app.repositories.document import DocumentRepository
from app.repositories.project import ProjectRepository
from app.repositories.revision import RevisionRepository
from app.schemas.document import (
    DocumentPutRequest,
    DocumentRevisionRead,
    DocumentTreeNode,
    RevisionBatchRead,
    RevisionDocumentSummary,
)
from app.services.exceptions import (
    DocumentNotFoundError,
    InvalidPathError,
    ParentNotFoundError,
    PermissionDeniedError,
    ProjectNotFoundError,
)


class DocumentService:
    """Service for document operations."""

    def __init__(
        self,
        document_repo: DocumentRepository,
        revision_repo: RevisionRepository,
        project_repo: ProjectRepository,
    ) -> None:
        """Initialize the service with repositories.

        Args:
            document_repo: Repository for document database operations.
            revision_repo: Repository for revision database operations.
            project_repo: Repository for project database operations.
        """
        self.document_repo = document_repo
        self.revision_repo = revision_repo
        self.project_repo = project_repo

    async def get_document_tree(
        self, project_slug: str, user_id: UUID
    ) -> list[DocumentTreeNode]:
        """Get document tree for a project.

        Args:
            project_slug: The project slug.
            user_id: UUID of the requesting user.

        Returns:
            List of root-level document tree nodes.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have access.
        """
        project = await self._validate_project_access(project_slug, user_id)
        documents = await self.document_repo.get_all_by_project(project.id)
        return self._build_tree(documents)

    async def get_document(
        self, project_slug: str, path: str, user_id: UUID
    ) -> Document:
        """Get document by path.

        Args:
            project_slug: The project slug.
            path: Document path.
            user_id: UUID of the requesting user.

        Returns:
            The document.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have access.
            DocumentNotFoundError: If document is not found.
        """
        project = await self._validate_project_access(project_slug, user_id)
        document = await self.document_repo.get_by_path(project.id, path)
        if document is None:
            raise DocumentNotFoundError(f"Document with path '{path}' not found")
        return document

    async def put_document(
        self,
        project_slug: str,
        path: str,
        request: DocumentPutRequest,
        user_id: UUID,
    ) -> Document:
        """Create or update document (upsert).

        Args:
            project_slug: The project slug.
            path: Document path.
            request: Document data.
            user_id: UUID of the requesting user.

        Returns:
            The created or updated document.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have access.
            ParentNotFoundError: If parent document does not exist.
            InvalidPathError: If path is invalid.
        """
        project = await self._validate_project_access(
            project_slug, user_id, require_write=True
        )

        # Parse path to get parent_path and slug
        parent_path, slug = self._parse_path(path)

        # Validate parent exists if specified
        parent_id = None
        if parent_path:
            parent = await self.document_repo.get_parent_by_path(
                project.id, parent_path
            )
            if parent is None:
                raise ParentNotFoundError(
                    f"Parent document with path '{parent_path}' not found"
                )
            if not parent.is_folder:
                raise InvalidPathError(f"Parent '{parent_path}' is not a folder")
            parent_id = parent.id

        # Check if document exists
        existing = await self.document_repo.get_by_path(project.id, path)

        # Create revision batch
        batch = await self.revision_repo.create_batch(
            project_id=project.id,
            user_id=user_id,
            message=request.message,
        )

        if existing:
            # Update existing document
            change_type = self._determine_change_type(
                existing, request.title, request.content
            )
            document = await self.document_repo.update(
                existing,
                title=request.title,
                content=request.content,
            )
        else:
            # Create new document
            change_type = ChangeType.CREATE
            index = await self.document_repo.get_max_index(project.id, parent_id) + 1
            document = await self.document_repo.create(
                project_id=project.id,
                slug=slug,
                path=path,
                title=request.title,
                content=request.content,
                parent_id=parent_id,
                is_folder=request.is_folder,
                index=index,
            )

        # Create revision
        await self.revision_repo.create_revision(
            batch_id=batch.id,
            document_id=document.id,
            change_type=change_type,
            title=document.title,
            content=document.content,
        )

        return document

    async def delete_document(
        self,
        project_slug: str,
        path: str,
        user_id: UUID,
        message: str | None = None,
    ) -> None:
        """Delete document.

        Args:
            project_slug: The project slug.
            path: Document path.
            user_id: UUID of the requesting user.
            message: Optional delete message.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have access.
            DocumentNotFoundError: If document is not found.
        """
        project = await self._validate_project_access(
            project_slug, user_id, require_write=True
        )

        document = await self.document_repo.get_by_path(project.id, path)
        if document is None:
            raise DocumentNotFoundError(f"Document with path '{path}' not found")

        # Create revision batch and revision for the delete
        batch = await self.revision_repo.create_batch(
            project_id=project.id,
            user_id=user_id,
            message=message,
        )

        await self.revision_repo.create_revision(
            batch_id=batch.id,
            document_id=document.id,
            change_type=ChangeType.DELETE,
            title=document.title,
            content=None,
        )

        # Delete document (cascades to children)
        await self.document_repo.delete(document)

    async def get_project_activity(
        self,
        project_slug: str,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[RevisionBatchRead]:
        """Get project activity feed.

        Args:
            project_slug: The project slug.
            user_id: UUID of the requesting user.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of revision batches with document summaries.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have access.
        """
        project = await self._validate_project_access(project_slug, user_id)
        batches = await self.revision_repo.get_project_activity(
            project.id, skip=skip, limit=limit
        )

        result = []
        for batch in batches:
            documents = []
            for rev in batch.revisions:
                doc = rev.document
                documents.append(
                    RevisionDocumentSummary(
                        revision_id=rev.id,
                        document_id=rev.document_id,
                        change_type=rev.change_type.value,
                        document_title=rev.title,
                        document_path=doc.path if doc else None,
                    )
                )

            result.append(
                RevisionBatchRead(
                    id=batch.id,
                    project_id=batch.project_id,
                    user_id=batch.user_id,
                    user_name=batch.user.name if batch.user else None,
                    user_avatar_url=batch.user.avatar_url if batch.user else None,
                    message=batch.message,
                    created_at=batch.created_at,
                    documents=documents,
                )
            )

        return result

    async def get_document_history(
        self,
        project_slug: str,
        path: str,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> list[DocumentRevisionRead]:
        """Get document revision history.

        Args:
            project_slug: The project slug.
            path: Document path.
            user_id: UUID of the requesting user.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.

        Returns:
            List of document revisions.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have access.
            DocumentNotFoundError: If document is not found.
        """
        project = await self._validate_project_access(project_slug, user_id)
        document = await self.document_repo.get_by_path(project.id, path)
        if document is None:
            raise DocumentNotFoundError(f"Document with path '{path}' not found")

        revisions = await self.revision_repo.get_document_history(
            document.id, skip=skip, limit=limit
        )

        result = []
        for rev in revisions:
            batch = rev.batch
            result.append(
                DocumentRevisionRead(
                    id=rev.id,
                    batch_id=rev.batch_id,
                    document_id=rev.document_id,
                    change_type=rev.change_type.value,
                    title=rev.title,
                    content=rev.content,
                    created_at=batch.created_at,
                    user_id=batch.user_id,
                    user_name=batch.user.name if batch.user else None,
                    message=batch.message,
                )
            )

        return result

    # --- Helper methods ---

    async def _validate_project_access(
        self,
        project_slug: str,
        user_id: UUID,
        require_write: bool = False,
    ) -> Project:
        """Validate user has access to project.

        Args:
            project_slug: The project slug.
            user_id: UUID of the requesting user.
            require_write: Whether write access is required.

        Returns:
            The project.

        Raises:
            ProjectNotFoundError: If project is not found.
            PermissionDeniedError: If user does not have access.
        """
        project = await self.project_repo.get_by_slug(project_slug)
        if project is None:
            raise ProjectNotFoundError(f"Project with slug '{project_slug}' not found")

        # Check access
        is_owner = project.owner_id == user_id
        is_public = project.visibility.value == "public"

        if require_write:
            # Write access requires being the owner
            # TODO: Add project_members check for editor/admin role
            if not is_owner:
                raise PermissionDeniedError(
                    "You do not have permission to modify documents in this project"
                )
        else:
            # Read access for owner or public projects
            # TODO: Add project_members check for viewer role
            if not is_owner and not is_public:
                raise PermissionDeniedError(
                    "You do not have permission to view this project"
                )

        return project

    def _parse_path(self, path: str) -> tuple[str | None, str]:
        """Parse path into (parent_path, slug).

        Args:
            path: Document path (e.g., "folder/subfolder/doc").

        Returns:
            Tuple of (parent_path, slug).
            - "folder/subfolder/doc" -> ("folder/subfolder", "doc")
            - "doc" -> (None, "doc")

        Raises:
            InvalidPathError: If path is empty or invalid.
        """
        if not path or path.strip() == "":
            raise InvalidPathError("Path cannot be empty")

        # Remove leading/trailing slashes
        path = path.strip("/")

        if "/" in path:
            parts = path.rsplit("/", 1)
            return (parts[0], parts[1])
        else:
            return (None, path)

    def _build_tree(self, documents: list[Document]) -> list[DocumentTreeNode]:
        """Build hierarchical tree from flat document list.

        Args:
            documents: Flat list of documents.

        Returns:
            List of root-level tree nodes.
        """
        # Create lookup by ID
        doc_map: dict[UUID, DocumentTreeNode] = {}
        for doc in documents:
            doc_map[doc.id] = DocumentTreeNode(
                id=doc.id,
                slug=doc.slug,
                path=doc.path,
                title=doc.title,
                index=doc.index,
                is_folder=doc.is_folder,
                children=[],
            )

        # Build tree structure
        roots: list[DocumentTreeNode] = []
        for doc in documents:
            node = doc_map[doc.id]
            if doc.parent_id is None:
                roots.append(node)
            elif doc.parent_id in doc_map:
                doc_map[doc.parent_id].children.append(node)

        # Sort children by index
        def sort_children(node: DocumentTreeNode) -> None:
            node.children.sort(key=lambda x: x.index)
            for child in node.children:
                sort_children(child)

        roots.sort(key=lambda x: x.index)
        for root in roots:
            sort_children(root)

        return roots

    def _determine_change_type(
        self,
        existing: Document,
        new_title: str,
        new_content: str | None,
    ) -> ChangeType:
        """Determine change type for revision.

        Args:
            existing: Existing document.
            new_title: New title.
            new_content: New content.

        Returns:
            The change type.
        """
        title_changed = existing.title != new_title
        content_changed = existing.content != new_content

        if title_changed and not content_changed:
            return ChangeType.RENAME
        return ChangeType.UPDATE
