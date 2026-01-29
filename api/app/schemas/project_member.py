"""Project member Pydantic schemas."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.project_member import MemberRole

if TYPE_CHECKING:
    from app.models.project_member import ProjectMember


class ProjectMemberCreate(BaseModel):
    """Schema for adding a project member."""

    user_id: UUID
    role: MemberRole = MemberRole.VIEWER


class ProjectMemberUpdate(BaseModel):
    """Schema for updating a project member's role."""

    role: MemberRole


class ProjectMemberRead(BaseModel):
    """Schema for reading a project member."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    role: MemberRole
    created_at: datetime
    updated_at: datetime


class ProjectMemberWithUserRead(BaseModel):
    """Schema for reading a project member with user details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    role: MemberRole
    created_at: datetime
    updated_at: datetime
    user_name: str | None = None
    user_email: str | None = None
    user_avatar_url: str | None = None

    @classmethod
    def from_member(cls, member: "ProjectMember") -> "ProjectMemberWithUserRead":
        """Create from ProjectMember model with user relationship loaded.

        Args:
            member: ProjectMember model with user relationship.

        Returns:
            Schema instance with user details populated.
        """
        return cls(
            id=member.id,
            project_id=member.project_id,
            user_id=member.user_id,
            role=member.role,
            created_at=member.created_at,
            updated_at=member.updated_at,
            user_name=member.user.name if member.user else None,
            user_email=member.user.email if member.user else None,
            user_avatar_url=member.user.avatar_url if member.user else None,
        )
