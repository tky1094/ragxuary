"""Document Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# --- Document Schemas ---


class DocumentBase(BaseModel):
    """Base document schema."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str | None = None
    is_folder: bool = False


class DocumentCreate(DocumentBase):
    """Schema for creating a document."""

    slug: str = Field(..., min_length=1, max_length=200, pattern=r"^[a-z0-9-]+$")
    parent_path: str | None = None
    index: int = 0


class DocumentUpdate(BaseModel):
    """Schema for updating a document."""

    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = None


class DocumentRead(BaseModel):
    """Schema for reading a document."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    parent_id: UUID | None
    slug: str
    path: str
    index: int
    is_folder: bool
    title: str
    content: str | None
    created_at: datetime
    updated_at: datetime


class DocumentTreeNode(BaseModel):
    """Schema for document tree node."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    path: str
    title: str
    index: int
    is_folder: bool
    children: list["DocumentTreeNode"] = []


# --- PUT Request Schema ---


class DocumentPutRequest(BaseModel):
    """Schema for PUT document (create or update)."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str | None = None
    is_folder: bool = False
    message: str | None = Field(None, max_length=500)


# --- Batch Update Schema ---


class BatchDocumentUpdate(BaseModel):
    """Single document update in a batch."""

    path: str
    title: str = Field(..., min_length=1, max_length=200)
    content: str | None = None


class BatchUpdateRequest(BaseModel):
    """Schema for batch document update."""

    documents: list[BatchDocumentUpdate] = Field(..., min_length=1)
    message: str | None = Field(None, max_length=500)


# --- Revision Schemas ---


class RevisionDocumentSummary(BaseModel):
    """Summary of document change in a revision."""

    revision_id: UUID
    document_id: UUID
    change_type: str
    document_title: str
    document_path: str | None


class RevisionBatchRead(BaseModel):
    """Schema for reading a revision batch."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID | None
    user_name: str | None = None
    user_avatar_url: str | None = None
    message: str | None
    created_at: datetime
    documents: list[RevisionDocumentSummary] = []


class DocumentRevisionRead(BaseModel):
    """Schema for reading a document revision."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    batch_id: UUID
    document_id: UUID
    change_type: str
    title: str
    content: str | None
    created_at: datetime
    user_id: UUID | None
    user_name: str | None = None
    message: str | None = None
