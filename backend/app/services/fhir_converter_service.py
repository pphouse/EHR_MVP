"""
FHIR変換サービス
電子カルテデータをFHIR準拠形式に変換
"""
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import uuid4

from fhir.resources.patient import Patient
from fhir.resources.encounter import Encounter
from fhir.resources.observation import Observation
from fhir.resources.condition import Condition
from fhir.resources.medicationrequest import MedicationRequest
from fhir.resources.allergyintolerance import AllergyIntolerance
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.documentreference import DocumentReference
from fhir.resources.composition import Composition
from fhir.resources.humanname import HumanName
from fhir.resources.identifier import Identifier
from fhir.resources.reference import Reference
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding

from app.services.ai_assistant_service import AIAssistantService
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class FHIRConverterService:
    """FHIR変換サービス"""
    
    def __init__(self):
        self.ai_service = AIAssistantService()
        
    async def convert_patient_to_fhir(self, patient_data: Dict[str, Any]) -> Patient:
        """患者データをFHIR Patient リソースに変換"""
        try:
            # 名前の作成
            name = HumanName()
            name.use = "official"
            name.family = patient_data.get("family_name", "")
            name.given = [patient_data.get("given_name", "")]
            name.text = f"{name.family} {name.given[0]}"
            
            # 患者リソースの作成
            patient = Patient()
            patient.id = str(patient_data.get("id"))
            patient.identifier = [
                Identifier(
                    system="http://ehr-mvp.local/patient-id",
                    value=patient_data.get("patient_id", str(uuid4()))
                )
            ]
            patient.name = [name]
            patient.gender = patient_data.get("gender", "unknown")
            patient.birthDate = patient_data.get("birth_date")
            
            # 連絡先情報
            if patient_data.get("phone"):
                patient.telecom = [{
                    "system": "phone",
                    "value": patient_data.get("phone"),
                    "use": "mobile"
                }]
            
            return patient
            
        except Exception as e:
            logger.error(f"Patient FHIR conversion error: {e}")
            raise
    
    async def convert_encounter_to_fhir(self, encounter_data: Dict[str, Any]) -> Encounter:
        """診療記録をFHIR Encounter リソースに変換"""
        try:
            encounter = Encounter()
            encounter.id = str(encounter_data.get("id"))
            encounter.identifier = [
                Identifier(
                    system="http://ehr-mvp.local/encounter-id",
                    value=encounter_data.get("encounter_id", str(uuid4()))
                )
            ]
            
            # ステータス
            encounter.status = encounter_data.get("status", "finished")
            
            # クラス（外来・入院等）
            encounter.class_fhir = Coding()
            encounter.class_fhir.system = "http://terminology.hl7.org/CodeSystem/v3-ActCode"
            encounter.class_fhir.code = encounter_data.get("encounter_class", "AMB")
            encounter.class_fhir.display = "ambulatory"
            
            # 患者参照
            encounter.subject = Reference(
                reference=f"Patient/{encounter_data.get('patient_id')}"
            )
            
            # 期間
            encounter.period = {
                "start": encounter_data.get("start_time"),
                "end": encounter_data.get("end_time")
            }
            
            # 主訴
            if encounter_data.get("chief_complaint"):
                encounter.reasonCode = [
                    CodeableConcept(
                        text=encounter_data.get("chief_complaint")
                    )
                ]
            
            return encounter
            
        except Exception as e:
            logger.error(f"Encounter FHIR conversion error: {e}")
            raise
    
    async def extract_medical_info(self, text: str) -> Dict[str, List[Any]]:
        """
        テキストから5情報・6情報を抽出
        - 傷病名
        - アレルギー
        - 感染症
        - 薬剤禁忌
        - 検査結果
        - 処方情報
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
    
    async def create_condition_resources(self, diagnoses: List[Dict]) -> List[Condition]:
        """診断情報をFHIR Conditionリソースに変換"""
        conditions = []
        
        for diagnosis in diagnoses:
            condition = Condition()
            condition.id = str(uuid4())
            
            # 診断コード
            coding = Coding()
            coding.system = "http://hl7.org/fhir/sid/icd-10"
            coding.code = diagnosis.get("code", "")
            coding.display = diagnosis.get("name")
            
            condition.code = CodeableConcept()
            condition.code.coding = [coding]
            condition.code.text = diagnosis.get("name")
            
            # 臨床ステータス
            condition.clinicalStatus = CodeableConcept(
                coding=[Coding(
                    system="http://terminology.hl7.org/CodeSystem/condition-clinical",
                    code="active"
                )]
            )
            
            conditions.append(condition)
            
        return conditions
    
    async def create_allergy_resources(self, allergies: List[Dict]) -> List[AllergyIntolerance]:
        """アレルギー情報をFHIR AllergyIntoleranceリソースに変換"""
        allergy_resources = []
        
        for allergy in allergies:
            allergy_resource = AllergyIntolerance()
            allergy_resource.id = str(uuid4())
            
            # アレルゲン
            allergy_resource.code = CodeableConcept(
                text=allergy.get("substance")
            )
            
            # 重症度
            severity_map = {
                "mild": "mild",
                "moderate": "moderate", 
                "severe": "severe"
            }
            allergy_resource.criticality = severity_map.get(
                allergy.get("severity", "moderate"), 
                "unable-to-assess"
            )
            
            # 反応
            if allergy.get("reaction"):
                allergy_resource.reaction = [{
                    "manifestation": [
                        CodeableConcept(text=allergy.get("reaction"))
                    ]
                }]
            
            allergy_resources.append(allergy_resource)
            
        return allergy_resources
    
    async def create_observation_resources(self, lab_results: List[Dict]) -> List[Observation]:
        """検査結果をFHIR Observationリソースに変換"""
        observations = []
        
        for result in lab_results:
            observation = Observation()
            observation.id = str(uuid4())
            observation.status = "final"
            
            # 検査項目
            observation.code = CodeableConcept(
                text=result.get("name")
            )
            
            # 検査値
            if result.get("value"):
                observation.valueQuantity = {
                    "value": float(result.get("value", 0)),
                    "unit": result.get("unit", ""),
                    "system": "http://unitsofmeasure.org"
                }
            
            # 基準値
            if result.get("reference"):
                observation.referenceRange = [{
                    "text": result.get("reference")
                }]
            
            observations.append(observation)
            
        return observations
    
    async def create_medication_resources(self, prescriptions: List[Dict]) -> List[MedicationRequest]:
        """処方情報をFHIR MedicationRequestリソースに変換"""
        medication_requests = []
        
        for prescription in prescriptions:
            med_request = MedicationRequest()
            med_request.id = str(uuid4())
            med_request.status = "active"
            med_request.intent = "order"
            
            # 薬剤情報
            med_request.medicationCodeableConcept = CodeableConcept(
                text=prescription.get("medication")
            )
            
            # 用法用量
            dosage = {
                "text": f"{prescription.get('dose')} {prescription.get('frequency')}"
            }
            
            if prescription.get("duration"):
                dosage["timing"] = {
                    "repeat": {
                        "duration": prescription.get("duration")
                    }
                }
            
            med_request.dosageInstruction = [dosage]
            
            medication_requests.append(med_request)
            
        return medication_requests
    
    async def create_fhir_bundle(self, 
                                patient_data: Dict,
                                encounter_data: Dict,
                                medical_text: str) -> Bundle:
        """
        完全なFHIRバンドルを作成
        """
        try:
            # バンドルの作成
            bundle = Bundle()
            bundle.id = str(uuid4())
            bundle.type = "document"
            bundle.timestamp = datetime.now().isoformat()
            
            entries = []
            
            # 1. 患者リソース
            patient = await self.convert_patient_to_fhir(patient_data)
            entries.append(BundleEntry(resource=patient))
            
            # 2. 診療記録リソース
            encounter = await self.convert_encounter_to_fhir(encounter_data)
            entries.append(BundleEntry(resource=encounter))
            
            # 3. 医療情報の抽出と変換
            if medical_text:
                extracted_info = await self.extract_medical_info(medical_text)
                
                # 診断情報
                conditions = await self.create_condition_resources(
                    extracted_info.get("diagnoses", [])
                )
                for condition in conditions:
                    entries.append(BundleEntry(resource=condition))
                
                # アレルギー情報
                allergies = await self.create_allergy_resources(
                    extracted_info.get("allergies", [])
                )
                for allergy in allergies:
                    entries.append(BundleEntry(resource=allergy))
                
                # 検査結果
                observations = await self.create_observation_resources(
                    extracted_info.get("labResults", [])
                )
                for observation in observations:
                    entries.append(BundleEntry(resource=observation))
                
                # 処方情報
                medications = await self.create_medication_resources(
                    extracted_info.get("prescriptions", [])
                )
                for medication in medications:
                    entries.append(BundleEntry(resource=medication))
            
            bundle.entry = entries
            
            # バリデーション
            validation_result = await self.validate_fhir_bundle(bundle)
            if not validation_result["is_valid"]:
                logger.warning(f"FHIR validation warnings: {validation_result['errors']}")
            
            return bundle
            
        except Exception as e:
            logger.error(f"FHIR bundle creation error: {e}")
            raise
    
    async def validate_fhir_bundle(self, bundle: Bundle) -> Dict[str, Any]:
        """FHIRバンドルのバリデーション"""
        errors = []
        warnings = []
        
        try:
            # 必須フィールドのチェック
            if not bundle.type:
                errors.append("Bundle type is required")
            
            if not bundle.entry:
                errors.append("Bundle must contain at least one entry")
            
            # 各エントリーのバリデーション
            for entry in bundle.entry:
                if not entry.resource:
                    errors.append("Bundle entry must contain a resource")
                    continue
                
                # リソースタイプ別のバリデーション
                resource_type = entry.resource.resource_type
                
                if resource_type == "Patient":
                    if not entry.resource.name:
                        warnings.append("Patient should have a name")
                        
                elif resource_type == "Encounter":
                    if not entry.resource.status:
                        errors.append("Encounter status is required")
            
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
    
    def bundle_to_json(self, bundle: Bundle) -> str:
        """FHIRバンドルをJSON文字列に変換"""
        return bundle.json(indent=2)
    
    def bundle_to_dict(self, bundle: Bundle) -> Dict[str, Any]:
        """FHIRバンドルを辞書に変換"""
        return bundle.dict()