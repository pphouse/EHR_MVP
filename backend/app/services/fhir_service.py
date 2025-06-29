"""
FHIR (Fast Healthcare Interoperability Resources) サービス
Azure API for FHIR との統合を管理
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import httpx
from sqlalchemy.orm import Session

from app.models.patient import Patient as DBPatient
from app.models.encounter import Encounter as DBEncounter
from app.models.prescription import Prescription as DBPrescription
from app.models.user import User as DBUser

logger = logging.getLogger(__name__)


class FHIRService:
    """FHIR サービスクラス"""
    
    def __init__(self):
        # 将来的にAzure API for FHIRに接続する際の設定
        self.fhir_base_url = os.getenv("AZURE_FHIR_BASE_URL", "https://your-fhir-server.azurehealthcareapis.com")
        self.tenant_id = os.getenv("AZURE_TENANT_ID")
        self.client_id = os.getenv("AZURE_CLIENT_ID")
        self.client_secret = os.getenv("AZURE_CLIENT_SECRET")
        self.fhir_version = "4.0.1"
        
    def patient_to_fhir(self, db_patient: DBPatient) -> Dict[str, Any]:
        """
        データベースの患者情報をFHIR Patientリソースに変換
        """
        # FHIR Patient リソースをdict形式で作成
        patient = {
            "resourceType": "Patient",
            "id": str(db_patient.id),
            "identifier": [{
                "system": "http://hospital.example.com/patients",
                "value": db_patient.patient_id
            }],
            "active": db_patient.is_active,
            "name": [{
                "use": "official",
                "family": db_patient.last_name,
                "given": [db_patient.first_name]
            }]
        }
        
        # 性別
        if db_patient.gender:
            patient["gender"] = db_patient.gender.lower()
        
        # 生年月日
        if db_patient.date_of_birth:
            patient["birthDate"] = db_patient.date_of_birth.isoformat()
        
        # 連絡先情報
        telecom = []
        if db_patient.phone_number:
            telecom.append({
                "system": "phone",
                "value": db_patient.phone_number,
                "use": "mobile"
            })
        
        if db_patient.email:
            telecom.append({
                "system": "email",
                "value": db_patient.email
            })
        
        if telecom:
            patient["telecom"] = telecom
        
        # 住所
        if db_patient.address:
            patient["address"] = [{
                "text": db_patient.address,
                "country": "JP"
            }]
        
        return patient
    
    def practitioner_to_fhir(self, db_user: DBUser) -> Dict[str, Any]:
        """
        データベースのユーザー（医療従事者）情報をFHIR Practitionerリソースに変換
        """
        # FHIR Practitioner リソースをdict形式で作成
        practitioner = {
            "resourceType": "Practitioner",
            "id": str(db_user.id),
            "identifier": [{
                "system": "http://hospital.example.com/practitioners",
                "value": db_user.username
            }],
            "active": db_user.is_active,
            "name": [{
                "use": "official",
                "text": db_user.full_name
            }]
        }
        
        # 資格情報
        if db_user.role:
            practitioner["qualification"] = [{
                "code": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0360",
                        "code": db_user.role.value,
                        "display": db_user.role.value.title()
                    }]
                }
            }]
        
        return practitioner
    
    def encounter_to_fhir(self, db_encounter: DBEncounter, db: Session) -> Dict[str, Any]:
        """
        データベースの診療記録をFHIR Encounterリソースに変換
        """
        # FHIR Encounter リソースをdict形式で作成
        encounter = {
            "resourceType": "Encounter",
            "id": str(db_encounter.id),
            "status": "finished",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "ambulatory"
            },
            "subject": {
                "reference": f"Patient/{db_encounter.patient_id}"
            },
            "period": {
                "start": db_encounter.encounter_date.isoformat(),
                "end": db_encounter.encounter_date.isoformat()
            }
        }
        
        # 医療従事者参照
        if db_encounter.provider_id:
            encounter["participant"] = [{
                "individual": {
                    "reference": f"Practitioner/{db_encounter.provider_id}"
                },
                "type": [{
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                        "code": "PPRF",
                        "display": "primary performer"
                    }]
                }]
            }]
        
        # 主訴
        if db_encounter.chief_complaint:
            encounter["reasonCode"] = [{
                "text": db_encounter.chief_complaint
            }]
        
        return encounter
    
    def prescription_to_fhir(self, db_prescription: DBPrescription, db: Session) -> List[Dict[str, Any]]:
        """
        データベースの処方箋をFHIR MedicationRequestリソースのリストに変換
        """
        medication_requests = []
        
        for item in db_prescription.prescription_items:
            med_request = {
                "resourceType": "MedicationRequest",
                "id": f"{db_prescription.id}-{item.id}",
                "status": "active",
                "intent": "order",
                "subject": {
                    "reference": f"Patient/{db_prescription.patient_id}"
                },
                "authoredOn": db_prescription.prescription_date.isoformat()
            }
            
            # 処方者参照
            if db_prescription.prescriber_id:
                med_request["requester"] = {
                    "reference": f"Practitioner/{db_prescription.prescriber_id}"
                }
            
            # 診療記録参照
            if db_prescription.encounter_id:
                med_request["encounter"] = {
                    "reference": f"Encounter/{db_prescription.encounter_id}"
                }
            
            # 薬剤情報
            med_request["medicationCodeableConcept"] = {
                "coding": [{
                    "display": item.medication.drug_name
                }],
                "text": item.medication.drug_name
            }
            
            # 用法用量
            dosage = {}
            if item.dosage:
                dosage["text"] = item.dosage
            if item.frequency:
                dosage["timing"] = {"code": {"text": item.frequency}}
            if item.instructions:
                dosage["patientInstruction"] = item.instructions
            
            if dosage:
                med_request["dosageInstruction"] = [dosage]
            
            medication_requests.append(med_request)
        
        return medication_requests
    
    def create_bundle(self, resources: List[Dict[str, Any]], bundle_type: str = "collection") -> Dict[str, Any]:
        """
        複数のFHIRリソースをBundleにまとめる
        """
        entries = []
        for resource in resources:
            entry = {
                "resource": resource,
                "fullUrl": f"urn:uuid:{resource.get('id', 'unknown')}"
            }
            entries.append(entry)
        
        bundle = {
            "resourceType": "Bundle",
            "type": bundle_type,
            "timestamp": datetime.now().isoformat(),
            "total": len(entries),
            "entry": entries
        }
        
        return bundle
    
    async def upload_to_fhir_server(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        FHIRリソースをAzure API for FHIRにアップロード
        注: 現在はモック実装。実際のAzure接続には認証設定が必要
        """
        # TODO: Azure AD認証の実装
        # TODO: 実際のHTTPリクエストの実装
        
        logger.info(f"Uploading {resource.get('resourceType')} to FHIR server (mock)")
        
        # モックレスポンス
        return {
            "resourceType": resource.get("resourceType"),
            "id": resource.get("id"),
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.now().isoformat()
            }
        }
    
    def validate_fhir_resource(self, resource: Dict[str, Any]) -> bool:
        """
        FHIRリソースのバリデーション
        """
        try:
            # 必須フィールドの確認
            if "resourceType" not in resource:
                return False
            
            return True
        except Exception as e:
            logger.error(f"FHIR resource validation failed: {e}")
            return False