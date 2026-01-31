"""Project Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectVisibility


class ProjectBase(BaseModel):
    """Base project schema."""

    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    visibility: ProjectVisibility = ProjectVisibility.PRIVATE


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""

    git_url: str | None = None
    git_branch: str | None = None
    git_doc_root: str | None = None
    chat_enabled: bool = True


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    visibility: ProjectVisibility | None = None
    git_url: str | None = None
    git_branch: str | None = None
    git_doc_root: str | None = None
    chat_enabled: bool | None = None


class ProjectRead(ProjectBase):
    """Schema for reading a project."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    git_url: str | None
    git_branch: str | None
    git_doc_root: str | None
    chat_enabled: bool
    created_at: datetime
    updated_at: datetime


class ProjectPermissionsRead(BaseModel):
    """Schema for reading user permissions on a project.

    Returns the list of permissions the current user has on the project,
    along with their role (if they are a member or owner).
    """

    permissions: list[str]
    role: str | None = Field(
        None,
        description="User's role: 'owner', 'admin', 'editor', 'viewer', or null for non-members",
    )
