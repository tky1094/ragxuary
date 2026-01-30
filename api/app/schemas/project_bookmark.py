"""Project bookmark Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.project import ProjectRead


class ProjectBookmarkRead(BaseModel):
    """Schema for reading a bookmark."""

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    project_id: UUID
    created_at: datetime


class BookmarkedProjectRead(BaseModel):
    """Schema for reading a bookmark with project details."""

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    project_id: UUID
    created_at: datetime
    project: ProjectRead


class BookmarkStatusRead(BaseModel):
    """Schema for bookmark status check response."""

    is_bookmarked: bool
