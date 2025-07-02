from fastapi import APIRouter
from .auth import auth_router
from .patients import patients_router
from .encounters import encounters_router
from .medications import router as medications_router
from .prescriptions import router as prescriptions_router
from .fhir import router as fhir_router
from .ai_assistant import router as ai_assistant_router

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(patients_router, prefix="/patients", tags=["patients"])
api_router.include_router(encounters_router, prefix="/encounters", tags=["encounters"])
api_router.include_router(medications_router, prefix="/medications", tags=["medications"])
api_router.include_router(prescriptions_router, prefix="/prescriptions", tags=["prescriptions"])
api_router.include_router(fhir_router, prefix="/fhir", tags=["fhir"])
api_router.include_router(ai_assistant_router, prefix="/ai-assistant", tags=["ai-assistant"])