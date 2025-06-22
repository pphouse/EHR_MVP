from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from ...core.database import get_db
from ...core.deps import get_current_active_user
from ...schemas.auth import Token, UserCreate, UserResponse, LoginRequest
from ...services.auth_service import AuthService

auth_router = APIRouter()


@auth_router.post("/register", response_model=UserResponse)
def register(
    user_create: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new user"""
    auth_service = AuthService(db)
    user = auth_service.create_user(user_create)
    return user


@auth_router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Login user and return access token"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = auth_service.create_access_token_for_user(user)
    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.post("/login/oauth", response_model=Token)
def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """OAuth2 compatible login endpoint"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = auth_service.create_access_token_for_user(user)
    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user = Depends(get_current_active_user)
) -> Any:
    """Get current user information"""
    return current_user


@auth_router.post("/test-token", response_model=UserResponse)
def test_token(
    current_user = Depends(get_current_active_user)
) -> Any:
    """Test access token"""
    return current_user