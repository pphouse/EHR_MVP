from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.prescription import Prescription, PrescriptionItem, PrescriptionStatus
from app.models.medication import Medication
from app.models.patient import Patient
from app.models.encounter import Encounter
from app.schemas.prescription import (
    PrescriptionResponse,
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionListResponse,
    PrescriptionSearch,
    DispensingUpdate,
    PrescriptionItemUpdate
)

router = APIRouter()

def generate_prescription_number(db: Session) -> str:
    """処方箋番号を生成"""
    today = datetime.now().strftime("%Y%m%d")
    
    # 今日の処方箋数を取得
    count = db.query(Prescription).filter(
        Prescription.prescription_number.like(f"{today}%")
    ).count()
    
    return f"{today}-{count + 1:04d}"

@router.post("/", response_model=PrescriptionResponse)
def create_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """処方箋作成"""
    
    
    # 医師・管理者のみ処方可能
    if current_user.role.value not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="処方箋作成権限がありません")
    
    # 患者存在確認
    patient = db.query(Patient).filter(Patient.id == prescription.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="患者が見つかりません")
    
    # 診療記録存在確認
    encounter = db.query(Encounter).filter(Encounter.id == prescription.encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="診療記録が見つかりません")
    
    # 薬剤存在確認
    medication_ids = [item.medication_id for item in prescription.prescription_items]
    medications = db.query(Medication).filter(Medication.id.in_(medication_ids)).all()
    if len(medications) != len(medication_ids):
        raise HTTPException(status_code=404, detail="指定された薬剤が見つかりません")
    
    # 処方箋作成
    prescription_data = prescription.dict(exclude={"prescription_items"})
    prescription_data["prescriber_id"] = current_user.id
    prescription_data["prescription_number"] = generate_prescription_number(db)
    
    # instructionsをdispensing_instructionsにマッピング
    if "instructions" in prescription_data:
        prescription_data["dispensing_instructions"] = prescription_data.pop("instructions")
    
    # 有効期限設定（処方日から4日後）
    if not prescription_data.get("expiry_date"):
        prescription_data["expiry_date"] = prescription.prescription_date + timedelta(days=4)
    
    db_prescription = Prescription(**prescription_data)
    db.add(db_prescription)
    db.flush()  # IDを取得するためフラッシュ
    
    # 処方明細作成
    total_cost = 0
    for item_data in prescription.prescription_items:
        medication = next(m for m in medications if m.id == item_data.medication_id)
        
        # 費用計算
        unit_cost = medication.unit_price or 0
        item_total_cost = unit_cost * item_data.quantity
        total_cost += item_total_cost
        
        prescription_item = PrescriptionItem(
            prescription_id=db_prescription.id,
            unit_cost=unit_cost,
            total_cost=item_total_cost,
            **item_data.dict()
        )
        db.add(prescription_item)
    
    # 処方箋総費用更新
    db_prescription.total_cost = total_cost
    db_prescription.patient_payment = total_cost * 0.3  # 仮の患者負担3割
    db_prescription.insurance_coverage = total_cost * 0.7  # 保険適用7割
    
    db.commit()
    db.refresh(db_prescription)
    
    return db_prescription

@router.get("/", response_model=PrescriptionListResponse)
def get_prescriptions(
    patient_id: Optional[int] = Query(None, description="患者IDで絞り込み"),
    encounter_id: Optional[int] = Query(None, description="診療記録IDで絞り込み"),
    status: Optional[PrescriptionStatus] = Query(None, description="ステータスで絞り込み"),
    prescription_date_from: Optional[datetime] = Query(None, description="処方日範囲（開始）"),
    prescription_date_to: Optional[datetime] = Query(None, description="処方日範囲（終了）"),
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """処方箋一覧取得"""
    
    from sqlalchemy.orm import joinedload
    
    db_query = db.query(Prescription).options(
        joinedload(Prescription.patient),
        joinedload(Prescription.prescriber),
        joinedload(Prescription.prescription_items).joinedload(PrescriptionItem.medication)
    )
    
    # 患者IDフィルター
    if patient_id:
        db_query = db_query.filter(Prescription.patient_id == patient_id)
    
    # 診療記録IDフィルター
    if encounter_id:
        db_query = db_query.filter(Prescription.encounter_id == encounter_id)
    
    # ステータスフィルター
    if status:
        db_query = db_query.filter(Prescription.status == status)
    
    # 処方日範囲フィルター
    if prescription_date_from:
        db_query = db_query.filter(Prescription.prescription_date >= prescription_date_from)
    if prescription_date_to:
        db_query = db_query.filter(Prescription.prescription_date <= prescription_date_to)
    
    # 医師の場合は自分の処方箋のみ表示（管理者は全て表示）
    if current_user.role.value == "doctor":
        db_query = db_query.filter(Prescription.prescriber_id == current_user.id)
    
    total = db_query.count()
    prescriptions = db_query.order_by(Prescription.prescription_date.desc()).offset(offset).limit(limit).all()
    
    return PrescriptionListResponse(
        items=prescriptions,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(prescriptions) < total
    )

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """処方箋詳細取得"""
    
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="処方箋が見つかりません")
    
    # 権限チェック（医師は自分の処方箋のみ、管理者は全て）
    if current_user.role.value == "doctor" and prescription.prescriber_id != current_user.id:
        raise HTTPException(status_code=403, detail="この処方箋にアクセスする権限がありません")
    
    return prescription

@router.put("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    prescription_update: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """処方箋更新"""
    
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="処方箋が見つかりません")
    
    # 権限チェック
    if current_user.role.value == "doctor" and prescription.prescriber_id != current_user.id:
        raise HTTPException(status_code=403, detail="この処方箋を更新する権限がありません")
    
    # 調剤済みの場合は更新制限
    if prescription.status == PrescriptionStatus.DISPENSED:
        raise HTTPException(status_code=400, detail="調剤済みの処方箋は更新できません")
    
    # 更新データを適用
    update_data = prescription_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prescription, field, value)
    
    db.commit()
    db.refresh(prescription)
    
    return prescription

@router.post("/{prescription_id}/dispense")
def dispense_prescription(
    prescription_id: int,
    dispensing_updates: List[DispensingUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """処方箋調剤処理"""
    
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="処方箋が見つかりません")
    
    # 薬剤師・管理者のみ調剤可能
    if current_user.role.value not in ["pharmacist", "admin"]:
        raise HTTPException(status_code=403, detail="調剤権限がありません")
    
    # 処方明細更新
    for dispensing in dispensing_updates:
        prescription_item = db.query(PrescriptionItem).filter(
            and_(
                PrescriptionItem.id == dispensing.prescription_item_id,
                PrescriptionItem.prescription_id == prescription_id
            )
        ).first()
        
        if not prescription_item:
            raise HTTPException(status_code=404, detail="処方明細が見つかりません")
        
        # 調剤量チェック
        if dispensing.dispensed_quantity > prescription_item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"調剤量が処方量を超えています: {prescription_item.medication.drug_name}"
            )
        
        # 調剤情報更新
        prescription_item.dispensed_quantity = dispensing.dispensed_quantity
        prescription_item.dispensed_date = dispensing.dispensed_date or datetime.now()
        prescription_item.is_dispensed = dispensing.dispensed_quantity >= prescription_item.quantity
    
    # 処方箋ステータス更新
    all_dispensed = all(item.is_dispensed for item in prescription.prescription_items)
    partially_dispensed = any(item.dispensed_quantity > 0 for item in prescription.prescription_items)
    
    if all_dispensed:
        prescription.status = PrescriptionStatus.DISPENSED
    elif partially_dispensed:
        prescription.status = PrescriptionStatus.PARTIALLY_DISPENSED
    
    prescription.dispensing_date = datetime.now()
    
    # 薬剤師名設定
    if hasattr(dispensing_updates[0], 'pharmacist_name') and dispensing_updates[0].pharmacist_name:
        prescription.pharmacist_name = dispensing_updates[0].pharmacist_name
    else:
        prescription.pharmacist_name = current_user.full_name
    
    db.commit()
    
    return {"message": "調剤処理が完了しました", "status": prescription.status}

@router.get("/patient/{patient_id}/history", response_model=PrescriptionListResponse)
def get_patient_prescription_history(
    patient_id: int,
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """患者の処方履歴取得"""
    
    # 患者存在確認
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="患者が見つかりません")
    
    db_query = db.query(Prescription).filter(Prescription.patient_id == patient_id)
    
    total = db_query.count()
    prescriptions = db_query.order_by(Prescription.prescription_date.desc()).offset(offset).limit(limit).all()
    
    return PrescriptionListResponse(
        items=prescriptions,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(prescriptions) < total
    )

@router.delete("/{prescription_id}")
def cancel_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """処方箋中止"""
    
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="処方箋が見つかりません")
    
    # 権限チェック
    if current_user.role.value == "doctor" and prescription.prescriber_id != current_user.id:
        raise HTTPException(status_code=403, detail="この処方箋を中止する権限がありません")
    
    # 調剤済みの場合は中止不可
    if prescription.status in [PrescriptionStatus.DISPENSED, PrescriptionStatus.PARTIALLY_DISPENSED]:
        raise HTTPException(status_code=400, detail="調剤済みの処方箋は中止できません")
    
    prescription.status = PrescriptionStatus.CANCELLED
    db.commit()
    
    return {"message": "処方箋を中止しました"}