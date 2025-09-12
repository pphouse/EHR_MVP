#!/usr/bin/env python3
"""
デモユーザーを作成するスクリプト
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_demo_user():
    """デモユーザーを作成"""
    db = SessionLocal()
    
    try:
        # 既存のデモユーザーをチェック
        existing_user = db.query(User).filter(User.username == "demo").first()
        if existing_user:
            print("デモユーザーは既に存在します")
            return
        
        # デモユーザーを作成
        demo_user = User(
            username="demo",
            email="demo@example.com",
            full_name="Demo User",
            hashed_password=get_password_hash("demo123"),
            is_active=True,
            is_verified=True,
            role=UserRole.DOCTOR  # 医師ロールを設定
        )
        
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        print(f"デモユーザーを作成しました:")
        print(f"  ユーザー名: {demo_user.username}")
        print(f"  メール: {demo_user.email}")
        print(f"  フルネーム: {demo_user.full_name}")
        print(f"  ロール: {demo_user.role}")
        print(f"  アクティブ: {demo_user.is_active}")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_demo_user()