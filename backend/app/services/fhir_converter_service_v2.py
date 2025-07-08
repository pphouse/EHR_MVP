"""
FHIR変換サービス（簡易実装版）
Pydantic v2対応のため、辞書ベースでFHIRリソースを生成
"""
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import uuid4
import logging

from app.services.ai_assistant_service import AIAssistantService
from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleFHIRConverterService:
    """簡易FHIR変換サービス"""
    
    def __init__(self):
        self.ai_service = AIAssistantService()
        
    async def convert_patient_to_fhir(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """患者データをFHIR Patient リソースに変換"""
        try:
            fhir_patient = {
                "resourceType": "Patient",
                "id": str(patient_data.get("id")),
                "identifier": [{
                    "system": "http://ehr-mvp.local/patient-id",
                    "value": patient_data.get("patient_id", str(uuid4()))
                }],
                "name": [{
                    "use": "official",
                    "family": patient_data.get("family_name", ""),
                    "given": [patient_data.get("given_name", "")],
                    "text": f"{patient_data.get('family_name', '')} {patient_data.get('given_name', '')}"
                }],
                "gender": patient_data.get("gender", "unknown"),
                "birthDate": patient_data.get("birth_date")
            }
            
            # 連絡先情報
            if patient_data.get("phone"):
                fhir_patient["telecom"] = [{
                    "system": "phone",
                    "value": patient_data.get("phone"),
                    "use": "mobile"
                }]
            
            return fhir_patient
            
        except Exception as e:
            logger.error(f"Patient FHIR conversion error: {e}")
            raise
    
    async def convert_encounter_to_fhir(self, encounter_data: Dict[str, Any]) -> Dict[str, Any]:
        """診療記録をFHIR Encounter リソースに変換"""
        try:
            fhir_encounter = {
                "resourceType": "Encounter",
                "id": str(encounter_data.get("id")),
                "identifier": [{
                    "system": "http://ehr-mvp.local/encounter-id",
                    "value": encounter_data.get("encounter_id", str(uuid4()))
                }],
                "status": encounter_data.get("status", "finished"),
                "class": {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": encounter_data.get("encounter_class", "AMB"),
                    "display": "ambulatory"
                },
                "subject": {
                    "reference": f"Patient/{encounter_data.get('patient_id')}"
                },
                "period": {
                    "start": encounter_data.get("start_time"),
                    "end": encounter_data.get("end_time")
                }
            }
            
            # 主訴
            if encounter_data.get("chief_complaint"):
                fhir_encounter["reasonCode"] = [{
                    "text": encounter_data.get("chief_complaint")
                }]
            
            return fhir_encounter
            
        except Exception as e:
            logger.error(f"Encounter FHIR conversion error: {e}")
            raise
    
    async def extract_medical_info(self, text: str) -> Dict[str, List[Any]]:
        """
        テキストから5情報・6情報を抽出
        """
        try:
            # AI安全性チェック
            safety_result = await self.ai_service.process_medical_text(text)
            
            # Azure OpenAIで構造化情報抽出
            prompt = f"""
以下の医療テキストから、構造化された医療情報を抽出してください。

テキスト: {safety_result.processed_text}

以下の形式でJSON出力してください：
{{
    "diagnoses": [
        {{"name": "診断名", "code": "ICD10コード（分かれば）", "type": "primary|secondary"}}
    ],
    "allergies": [
        {{"substance": "アレルゲン物質", "reaction": "反応", "severity": "mild|moderate|severe"}}
    ],
    "infections": [
        {{"name": "感染症名", "status": "active|resolved", "date": "発症日"}}
    ],
    "contraindications": [
        {{"medication": "薬剤名", "reason": "禁忌理由"}}
    ],
    "labResults": [
        {{"name": "検査項目", "value": "値", "unit": "単位", "reference": "基準値"}}
    ],
    "prescriptions": [
        {{"medication": "薬剤名", "dose": "用量", "frequency": "頻度", "duration": "期間"}}
    ]
}}
"""
            
            messages = [
                {"role": "system", "content": "あなたは医療情報抽出の専門家です。"},
                {"role": "user", "content": prompt}
            ]
            
            response = self.ai_service.azure_client.chat.completions.create(
                model=self.ai_service.deployment_name,
                messages=messages,
                max_tokens=1000,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            extracted = json.loads(content)
            
            return extracted
            
        except Exception as e:
            logger.error(f"Medical info extraction error: {e}")
            return {
                "diagnoses": [],
                "allergies": [],
                "infections": [],
                "contraindications": [],
                "labResults": [],
                "prescriptions": []
            }
    
    async def create_condition_resources(self, diagnoses: List[Dict]) -> List[Dict[str, Any]]:
        """診断情報をFHIR Conditionリソースに変換"""
        conditions = []
        
        for diagnosis in diagnoses:
            condition = {
                "resourceType": "Condition",
                "id": str(uuid4()),
                "code": {
                    "coding": [{
                        "system": "http://hl7.org/fhir/sid/icd-10",
                        "code": diagnosis.get("code", ""),
                        "display": diagnosis.get("name")
                    }],
                    "text": diagnosis.get("name")
                },
                "clinicalStatus": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active"
                    }]
                }
            }
            conditions.append(condition)
            
        return conditions
    
    async def create_allergy_resources(self, allergies: List[Dict]) -> List[Dict[str, Any]]:
        """アレルギー情報をFHIR AllergyIntoleranceリソースに変換"""
        allergy_resources = []
        
        for allergy in allergies:
            severity_map = {
                "mild": "mild",
                "moderate": "moderate", 
                "severe": "severe"
            }
            
            allergy_resource = {
                "resourceType": "AllergyIntolerance",
                "id": str(uuid4()),
                "code": {
                    "text": allergy.get("substance")
                },
                "criticality": severity_map.get(
                    allergy.get("severity", "moderate"), 
                    "unable-to-assess"
                )
            }
            
            # 反応
            if allergy.get("reaction"):
                allergy_resource["reaction"] = [{
                    "manifestation": [{
                        "text": allergy.get("reaction")
                    }]
                }]
            
            allergy_resources.append(allergy_resource)
            
        return allergy_resources
    
    async def create_observation_resources(self, lab_results: List[Dict]) -> List[Dict[str, Any]]:
        """検査結果をFHIR Observationリソースに変換"""
        observations = []
        
        for result in lab_results:
            observation = {
                "resourceType": "Observation",
                "id": str(uuid4()),
                "status": "final",
                "code": {
                    "text": result.get("name")
                }
            }
            
            # 検査値
            if result.get("value"):
                try:
                    observation["valueQuantity"] = {
                        "value": float(result.get("value", 0)),
                        "unit": result.get("unit", ""),
                        "system": "http://unitsofmeasure.org"
                    }
                except ValueError:
                    observation["valueString"] = str(result.get("value"))
            
            # 基準値
            if result.get("reference"):
                observation["referenceRange"] = [{
                    "text": result.get("reference")
                }]
            
            observations.append(observation)
            
        return observations
    
    async def create_medication_resources(self, prescriptions: List[Dict]) -> List[Dict[str, Any]]:
        """処方情報をFHIR MedicationRequestリソースに変換"""
        medication_requests = []
        
        for prescription in prescriptions:
            med_request = {
                "resourceType": "MedicationRequest",
                "id": str(uuid4()),
                "status": "active",
                "intent": "order",
                "medicationCodeableConcept": {
                    "text": prescription.get("medication")
                },
                "dosageInstruction": [{
                    "text": f"{prescription.get('dose')} {prescription.get('frequency')}"
                }]
            }
            
            if prescription.get("duration"):
                med_request["dosageInstruction"][0]["timing"] = {
                    "repeat": {
                        "duration": prescription.get("duration")
                    }
                }
            
            medication_requests.append(med_request)
            
        return medication_requests
    
    async def create_fhir_bundle(self, 
                                patient_data: Dict,
                                encounter_data: Dict,
                                medical_text: str) -> Dict[str, Any]:
        """
        完全なFHIRバンドルを作成
        """
        try:
            bundle = {
                "resourceType": "Bundle",
                "id": str(uuid4()),
                "type": "document",
                "timestamp": datetime.now().isoformat(),
                "entry": []
            }
            
            # 1. 患者リソース
            patient = await self.convert_patient_to_fhir(patient_data)
            bundle["entry"].append({"resource": patient})
            
            # 2. 診療記録リソース
            if encounter_data:
                encounter = await self.convert_encounter_to_fhir(encounter_data)
                bundle["entry"].append({"resource": encounter})
            
            # 3. 医療情報の抽出と変換
            if medical_text:
                extracted_info = await self.extract_medical_info(medical_text)
                
                # 診断情報
                conditions = await self.create_condition_resources(
                    extracted_info.get("diagnoses", [])
                )
                for condition in conditions:
                    bundle["entry"].append({"resource": condition})
                
                # アレルギー情報
                allergies = await self.create_allergy_resources(
                    extracted_info.get("allergies", [])
                )
                for allergy in allergies:
                    bundle["entry"].append({"resource": allergy})
                
                # 検査結果
                observations = await self.create_observation_resources(
                    extracted_info.get("labResults", [])
                )
                for observation in observations:
                    bundle["entry"].append({"resource": observation})
                
                # 処方情報
                medications = await self.create_medication_resources(
                    extracted_info.get("prescriptions", [])
                )
                for medication in medications:
                    bundle["entry"].append({"resource": medication})
            
            # バリデーション
            validation_result = await self.validate_fhir_bundle(bundle)
            if not validation_result["is_valid"]:
                logger.warning(f"FHIR validation warnings: {validation_result['errors']}")
            
            return bundle
            
        except Exception as e:
            logger.error(f"FHIR bundle creation error: {e}")
            raise
    
    async def validate_fhir_bundle(self, bundle: Dict[str, Any]) -> Dict[str, Any]:
        """FHIRバンドルのバリデーション"""
        errors = []
        warnings = []
        
        try:
            # 必須フィールドのチェック
            if not bundle.get("resourceType") == "Bundle":
                errors.append("Invalid resourceType for Bundle")
            
            if not bundle.get("type"):
                errors.append("Bundle type is required")
            
            if not bundle.get("entry"):
                errors.append("Bundle must contain at least one entry")
            
            # 各エントリーのバリデーション
            for i, entry in enumerate(bundle.get("entry", [])):
                if not entry.get("resource"):
                    errors.append(f"Bundle entry {i} must contain a resource")
                    continue
                
                resource = entry["resource"]
                
                # リソースタイプ別のバリデーション
                resource_type = resource.get("resourceType")
                
                if resource_type == "Patient":
                    if not resource.get("name"):
                        warnings.append(f"Patient {resource.get('id')} should have a name")
                        
                elif resource_type == "Encounter":
                    if not resource.get("status"):
                        errors.append(f"Encounter {resource.get('id')} status is required")
            
            return {
                "is_valid": len(errors) == 0,
                "errors": errors,
                "warnings": warnings
            }
            
        except Exception as e:
            logger.error(f"FHIR validation error: {e}")
            return {
                "is_valid": False,
                "errors": [str(e)],
                "warnings": []
            }