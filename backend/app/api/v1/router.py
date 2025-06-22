from fastapi import APIRouter
from .auth import auth_router
from .patients import patients_router
from .encounters import encounters_router

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(patients_router, prefix="/patients", tags=["patients"])
api_router.include_router(encounters_router, prefix="/encounters", tags=["encounters"])