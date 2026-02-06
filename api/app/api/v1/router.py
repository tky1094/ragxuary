"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    bookmarks,
    documents,
    health,
    project_members,
    projects,
    setup,
    uploads,
    users,
)

api_router = APIRouter()

# Include health endpoint
api_router.include_router(health.router, tags=["health"])

# Include auth endpoints
api_router.include_router(auth.router)

# Include users endpoints
api_router.include_router(users.router)

# Include projects endpoints
api_router.include_router(projects.router)

# Include documents endpoints
api_router.include_router(documents.router)

# Include project members endpoints
api_router.include_router(project_members.router)

# Include bookmarks endpoints
api_router.include_router(bookmarks.router)

# Include setup endpoints
api_router.include_router(setup.router)

# Include uploads endpoints
api_router.include_router(uploads.router)
