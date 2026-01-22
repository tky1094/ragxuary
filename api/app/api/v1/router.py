"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, projects

api_router = APIRouter()

# Include health endpoint
api_router.include_router(health.router, tags=["health"])

# Include auth endpoints
api_router.include_router(auth.router)

# Include projects endpoints
api_router.include_router(projects.router)
