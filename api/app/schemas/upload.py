"""Upload Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UploadRead(BaseModel):
    """Schema for reading an upload."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    project_id: UUID | None
    filename: str
    mime_type: str
    size_bytes: int
    created_at: datetime
    url: str = Field(description="URL to access the uploaded file")


class UploadCreateResponse(BaseModel):
    """Schema for upload creation response."""

    id: UUID
    filename: str
    mime_type: str
    size_bytes: int
    url: str
    created_at: datetime
