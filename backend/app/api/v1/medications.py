from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.medication import Medication, MedicationForm, MedicationCategory
from app.schemas.medication import (
    MedicationResponse,
    MedicationCreate,
    MedicationUpdate,
    MedicationSearch,
    MedicationListResponse
)

router = APIRouter()

@router.get("/search", response_model=MedicationListResponse)
def search_medications(
    query: Optional[str] = Query(None, description="薬剤名、一般名、商品名で検索"),
    form: Optional[MedicationForm] = Query(None, description="剤形で絞り込み"),
    category: Optional[MedicationCategory] = Query(None, description="薬効分類で絞り込み"),
    is_prescription_required: Optional[bool] = Query(None, description="処方箋必要薬で絞り込み"),
    is_active: bool = Query(True, description="有効な薬剤のみ"),
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """薬剤検索"""
    
    # クエリ作成
    db_query = db.query(Medication)
    
    # 有効な薬剤のみ
    if is_active:
        db_query = db_query.filter(Medication.is_active == True)
    
    # テキスト検索
    if query:
        search_filter = or_(
            Medication.drug_name.ilike(f"%{query}%"),
            Medication.generic_name.ilike(f"%{query}%"),
            Medication.brand_name.ilike(f"%{query}%"),
            Medication.drug_code.ilike(f"%{query}%")
        )
        db_query = db_query.filter(search_filter)
    
    # 剤形フィルター
    if form:
        db_query = db_query.filter(Medication.form == form)
    
    # 薬効分類フィルター
    if category:
        db_query = db_query.filter(Medication.category == category)
    
    # 処方箋必要薬フィルター
    if is_prescription_required is not None:
        db_query = db_query.filter(Medication.is_prescription_required == is_prescription_required)
    
    # 総数取得
    total = db_query.count()
    
    # ページネーション
    medications = db_query.order_by(Medication.drug_name).offset(offset).limit(limit).all()
    
    return MedicationListResponse(
        items=medications,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(medications) < total
    )

@router.get("/", response_model=MedicationListResponse)
def get_medications(
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    is_active: bool = Query(True, description="有効な薬剤のみ"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """薬剤一覧取得"""
    
    db_query = db.query(Medication)
    
    if is_active:
        db_query = db_query.filter(Medication.is_active == True)
    
    total = db_query.count()
    medications = db_query.order_by(Medication.drug_name).offset(offset).limit(limit).all()
    
    return MedicationListResponse(
        items=medications,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(medications) < total
    )

@router.get("/{medication_id}", response_model=MedicationResponse)
def get_medication(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """薬剤詳細取得"""
    
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=404, detail="薬剤が見つかりません")
    
    return medication

@router.get("/code/{drug_code}", response_model=MedicationResponse)
def get_medication_by_code(
    drug_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """薬剤コードで薬剤取得"""
    
    medication = db.query(Medication).filter(Medication.drug_code == drug_code).first()
    if not medication:
        raise HTTPException(status_code=404, detail="薬剤が見つかりません")
    
    return medication

@router.post("/", response_model=MedicationResponse)
def create_medication(
    medication: MedicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """薬剤作成（管理者のみ）"""
    
    # 管理者権限チェック
    if current_user.role.value not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="薬剤作成権限がありません")
    
    # 薬剤コードの重複チェック
    existing_medication = db.query(Medication).filter(
        Medication.drug_code == medication.drug_code
    ).first()
    if existing_medication:
        raise HTTPException(status_code=400, detail="薬剤コードが既に存在します")
    
    db_medication = Medication(**medication.dict())
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)
    
    return db_medication

@router.put("/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: int,
    medication_update: MedicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """薬剤更新（管理者のみ）"""
    
    # 管理者権限チェック
    if current_user.role.value not in ["admin", "doctor"]:
        raise HTTPException(status_code=403, detail="薬剤更新権限がありません")
    
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=404, detail="薬剤が見つかりません")
    
    # 更新データを適用
    update_data = medication_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(medication, field, value)
    
    db.commit()
    db.refresh(medication)
    
    return medication

@router.delete("/{medication_id}")
def delete_medication(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """薬剤無効化（管理者のみ）"""
    
    # 管理者権限チェック
    if current_user.role.value not in ["admin"]:
        raise HTTPException(status_code=403, detail="薬剤削除権限がありません")
    
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=404, detail="薬剤が見つかりません")
    
    # 物理削除ではなく無効化
    medication.is_active = False
    db.commit()
    
    return {"message": "薬剤を無効化しました"}

@router.get("/forms/list")
def get_medication_forms(
    current_user: User = Depends(get_current_user)
):
    """薬剤剤形一覧取得"""
    
    return [{"value": form.value, "label": form.value} for form in MedicationForm]

@router.get("/categories/list")
def get_medication_categories(
    current_user: User = Depends(get_current_user)
):
    """薬効分類一覧取得"""
    
    return [{"value": category.value, "label": category.value} for category in MedicationCategory]