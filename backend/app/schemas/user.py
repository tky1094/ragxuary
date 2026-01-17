"""User Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    email: EmailStr | None = None
    name: str | None = None
    password: str | None = None
    is_active: bool | None = None
    api_limit: int | None = None


class UserRead(UserBase):
    """Schema for reading a user."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    auth_provider: str
    is_active: bool
    is_admin: bool
    api_limit: int | None
    created_at: datetime
    updated_at: datetime
