from pydantic import BaseSettings, validator
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
    
    # Azure OpenAI
    azure_openai_endpoint: Optional[str] = None
    azure_openai_key: Optional[str] = None
    azure_openai_version: str = "2024-02-15-preview"
    azure_openai_deployment_name: Optional[str] = None
    
    # AI Assistant Settings
    hallucination_threshold: float = 0.7
    pii_threshold: float = 0.8
    enable_auto_rewrite: bool = True
    max_rewrite_attempts: int = 3
    
    @validator("azure_openai_key", pre=True)
    def get_azure_openai_key(cls, v):
        """Azure OpenAI APIキーを ~/.azure/auth.json から読み取る"""
        # 既に有効な値が設定されている場合はそれを使用
        if v and v != "your-api-key-here":
            return v
        
        # ~/.azure/auth.json から読み取り
        azure_auth_path = Path.home() / ".azure" / "auth.json"
        if azure_auth_path.exists():
            try:
                import json
                with open(azure_auth_path, 'r') as f:
                    auth_data = json.load(f)
                    # auth.json 内の azure_openai_key を探す
                    key = auth_data.get("azure_openai_key") or auth_data.get("AZURE_OPENAI_KEY")
                    if key:
                        print(f"Azure OpenAI key loaded from {azure_auth_path}")
                        return key
            except Exception as e:
                print(f"Warning: Could not read Azure OpenAI key from {azure_auth_path}: {e}")
        
        # 環境変数から読み取り（フォールバック）
        env_key = os.environ.get("AZURE_OPENAI_KEY")
        if env_key and env_key != "your-api-key-here":
            print("Azure OpenAI key loaded from environment variable")
            return env_key
        
        print("Warning: Azure OpenAI key not found. AI features will use mock data.")
        return None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()