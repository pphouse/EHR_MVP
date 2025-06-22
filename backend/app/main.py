from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn

from .core.config import settings
from .core.database import create_tables
from .api.v1.router import api_router

# Create FastAPI application
app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="Electronic Health Records MVP API",
    openapi_url=f"{settings.api_v1_str}/openapi.json",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.api_v1_str)

# Security scheme for OpenAPI docs
security = HTTPBearer()


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    create_tables()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EHR MVP API",
        "version": settings.version,
        "docs_url": "/docs",
        "api_version": "v1",
        "api_base_url": settings.api_v1_str
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": settings.version}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )