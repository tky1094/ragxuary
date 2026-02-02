"""Setup Pydantic schemas."""

import re

from pydantic import BaseModel, EmailStr, field_validator


class SetupStatusResponse(BaseModel):
    """Schema for setup status response."""

    is_setup_completed: bool
    requires_admin: bool


class AdminCreateRequest(BaseModel):
    """Schema for admin creation request."""

    email: EmailStr
    name: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name is not empty and within length limit."""
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        if len(v) > 100:
            raise ValueError("Name must be 100 characters or less")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v
