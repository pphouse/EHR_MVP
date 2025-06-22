from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/ehr_mvp"
    test_database_url: str = "postgresql://user:password@localhost:5432/ehr_mvp_test"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Security
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Azure Configuration
    azure_client_id: Optional[str] = None
    azure_client_secret: Optional[str] = None
    azure_tenant_id: Optional[str] = None
    azure_subscription_id: Optional[str] = None
    
    # Azure FHIR
    fhir_server_url: Optional[str] = None
    fhir_resource_id: Optional[str] = None
    
    # Azure Storage
    azure_storage_account_name: Optional[str] = None
    azure_storage_container_name: str = "ehr-documents"
    
    # Azure Key Vault
    azure_key_vault_url: Optional[str] = None
    
    # Environment
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "EHR MVP"
    version: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()