"""User Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: str
    avatar_url: str | None = None


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user (admin use)."""

    email: EmailStr | None = None
    name: str | None = None
    avatar_url: str | None = None
    password: str | None = None
    is_active: bool | None = None
    api_limit: int | None = None
    preferred_locale: str | None = None


class UserProfileUpdate(BaseModel):
    """Schema for user self-profile update."""

    name: str | None = Field(None, min_length=1, max_length=100)
    avatar_url: str | None = Field(None, max_length=500)
    preferred_locale: str | None = Field(None, min_length=2, max_length=10)

    model_config = ConfigDict(from_attributes=True)


class UserRead(UserBase):
    """Schema for reading a user."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    auth_provider: str
    is_active: bool
    is_admin: bool
    api_limit: int | None
    preferred_locale: str | None
    created_at: datetime
    updated_at: datetime
