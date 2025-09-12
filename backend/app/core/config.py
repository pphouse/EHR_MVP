from pydantic_settings import BaseSettings
from pydantic import validator
from typing import List, Optional
import os
from pathlib import Path


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
    
    # Cerebras API
    cerebras_api_key: Optional[str] = None
    cerebras_api_url: str = "https://api.cerebras.ai/v1"
    cerebras_model_name: str = "qwen-3-235b-a22b-instruct-2507"
    
    # AI Assistant Settings
    hallucination_threshold: float = 0.7
    pii_threshold: float = 0.8
    enable_auto_rewrite: bool = True
    max_rewrite_attempts: int = 3
    
    @validator("cerebras_api_key", pre=True)
    def get_cerebras_api_key(cls, v):
        """Cerebras APIキーを環境変数から読み取る"""
        # 既に有効な値が設定されている場合はそれを使用
        if v:
            return v
        
        # 環境変数から読み取り
        env_key = os.environ.get("CEREBRAS_API_KEY")
        if env_key:
            print("Cerebras API key loaded from environment variable")
            return env_key
        
        print("Warning: Cerebras API key not found. AI features will not be available.")
        return None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()