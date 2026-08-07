import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from pymongo import errors

from app.config.mongo import get_mongo_collection

# Storage directory for uploaded PDFs
POLICIES_DIR = Path(__file__).resolve().parent.parent.parent / "policies"
POLICIES_DIR.mkdir(parents=True, exist_ok=True)

# Fallback local JSON database file
FALLBACK_DB_PATH = Path(__file__).resolve().parent.parent.parent / "policies_db.json"

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Default Seed Policies covering all 20+ disease categories
SEED_POLICIES: List[Dict[str, Any]] = [
    {
        "id": "pol_cancer_01",
        "policy_name": "Ayushman Cancer Care Shield",
        "file_name": "cancer_care_shield.pdf",
        "insurer": "National Health Insurance Authority",
        "description": "Comprehensive oncology coverage including chemotherapy, radiotherapy, targeted therapy, and post-treatment rehabilitation with zero co-payment.",
        "disease_categories": ["Cancer", "Rare Diseases"],
        "eligibility_criteria": "Resident of India, annual household income below Rs 5 Lakhs, age 0 to 75 years.",
        "annual_income_limit": 500000.0,
        "min_age": 0,
        "max_age": 75,
        "scheme_type": "Government",
        "coverage_amount": 500000.0,
        "required_documents": ["Aadhaar Card", "Income Certificate", "Medical History / Biopsy Report", "Bank Passbook"],
        "status": "Active",
        "activation_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "upload_date": "2026-01-01T00:00:00Z"
    },
    {
        "id": "pol_cardio_02",
        "policy_name": "Pradhan Mantri Heart Health Yojana",
        "file_name": "heart_health_yojana.pdf",
        "insurer": "Ministry of Health & Family Welfare",
        "description": "Full coverage for cardiac surgeries, angioplasty, pacemaker implantation, and treatment for Hypertension and Heart Disease.",
        "disease_categories": ["Heart Disease", "Hypertension", "Blood Disorders"],
        "eligibility_criteria": "Low and middle income families, annual income up to Rs 3 Lakhs, all age groups up to 80.",
        "annual_income_limit": 300000.0,
        "min_age": 18,
        "max_age": 80,
        "scheme_type": "Government",
        "coverage_amount": 750000.0,
        "required_documents": ["Aadhaar Card", "Ration Card", "Cardiologist Consultation Report"],
        "status": "Active",
        "activation_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "upload_date": "2026-01-05T00:00:00Z"
    },
    {
        "id": "pol_diab_kidney_03",
        "policy_name": "Sanjivani Diabetes & Renal Support Scheme",
        "file_name": "diabetes_kidney_care.pdf",
        "insurer": "State Health Mission",
        "description": "Dedicated financial protection for Diabetes, Chronic Kidney Disease, Kidney Dialysis, and Liver Disease management.",
        "disease_categories": ["Diabetes", "Kidney Disease", "Liver Disease"],
        "eligibility_criteria": "Individuals with diagnosed metabolic or kidney disorders, income limit up to Rs 10 Lakhs.",
        "annual_income_limit": 1000000.0,
        "min_age": 20,
        "max_age": 85,
        "scheme_type": "Government",
        "coverage_amount": 400000.0,
        "required_documents": ["Aadhaar Card", "Lab Diagnostic Reports (HbA1c/Creatinine)", "Income Proof"],
        "status": "Active",
        "activation_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "upload_date": "2026-01-10T00:00:00Z"
    },
    {
        "id": "pol_neuro_04",
        "policy_name": "Arogya Neuro Care & Stroke Plan",
        "file_name": "neuro_stroke_care.pdf",
        "insurer": "Star Health Insurance",
        "description": "Specialized neurology scheme covering Stroke, Parkinson's Disease, Alzheimer's Disease, and brain disorder ICU admissions.",
        "disease_categories": ["Stroke", "Parkinson's Disease", "Alzheimer's Disease", "Senior Citizen Care"],
        "eligibility_criteria": "Senior citizens and adults with neuro-degenerative diseases, annual income up to Rs 8 Lakhs.",
        "annual_income_limit": 800000.0,
        "min_age": 40,
        "max_age": 90,
        "scheme_type": "Private",
        "coverage_amount": 1000000.0,
        "required_documents": ["Aadhaar Card", "Neurology Assessment Report", "Age Proof"],
        "status": "Active",
        "activation_days": ["Saturday", "Sunday"],  # Weekend activation example
        "upload_date": "2026-01-15T00:00:00Z"
    },
    {
        "id": "pol_resp_05",
        "policy_name": "Swastha Pulmonary Protection Cover",
        "file_name": "pulmonary_asthma_tb_care.pdf",
        "insurer": "Care Health Insurance",
        "description": "Complete hospitalization & respiratory aid cover for Asthma, Tuberculosis, and severe pulmonary infections.",
        "disease_categories": ["Asthma", "Tuberculosis"],
        "eligibility_criteria": "All individuals diagnosed with pulmonary conditions, income up to Rs 5 Lakhs.",
        "annual_income_limit": 500000.0,
        "min_age": 5,
        "max_age": 70,
        "scheme_type": "Private",
        "coverage_amount": 350000.0,
        "required_documents": ["Aadhaar Card", "Chest X-Ray / Pulmonologist Prescription"],
        "status": "Active",
        "activation_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "upload_date": "2026-01-20T00:00:00Z"
    },
    {
        "id": "pol_maternal_06",
        "policy_name": "Matru Vandana Pregnancy & Child Care Scheme",
        "file_name": "pregnancy_child_care.pdf",
        "insurer": "National Rural Health Mission",
        "description": "Comprehensive maternity coverage including antenatal care, delivery charges, postnatal care, and newborn Child Health immunization.",
        "disease_categories": ["Pregnancy Care", "Child Health"],
        "eligibility_criteria": "Pregnant women and mothers with infants, income under Rs 3 Lakhs.",
        "annual_income_limit": 300000.0,
        "min_age": 18,
        "max_age": 45,
        "scheme_type": "Government",
        "coverage_amount": 300000.0,
        "required_documents": ["MCP Card", "Aadhaar Card", "Bank Account Details"],
        "status": "Active",
        "activation_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "upload_date": "2026-01-25T00:00:00Z"
    },
    {
        "id": "pol_mental_ortho_07",
        "policy_name": "Mind & Motion Comprehensive Health Cover",
        "file_name": "mental_arthritis_care.pdf",
        "insurer": "HDFC ERGO Health",
        "description": "Integrated insurance for Arthritis, Joint Replacements, Mental Health Disorders, Eye Disorders, and Hearing Disorders.",
        "disease_categories": ["Arthritis", "Mental Health Disorders", "Eye Disorders", "Hearing Disorders", "Senior Citizen Care"],
        "eligibility_criteria": "Adults seeking mental wellness support, orthopedic care, or sensory treatments. Income limit up to Rs 15 Lakhs.",
        "annual_income_limit": 1500000.0,
        "min_age": 18,
        "max_age": 85,
        "scheme_type": "Private",
        "coverage_amount": 600000.0,
        "required_documents": ["Aadhaar Card", "Specialist Consultation Notes", "Income Slip"],
        "status": "Active",
        "activation_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "upload_date": "2026-02-01T00:00:00Z"
    }
]


def _ensure_seed_pdfs():
    """Ensure dummy/sample PDF files exist in policies/ directory for seed policies."""
    for pol in SEED_POLICIES:
        fname = pol["file_name"]
        fpath = POLICIES_DIR / fname
        if not fpath.exists():
            content = (
                f"%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
                f"2 0 obj <</Type /Pages /Count 1 /Kids [3 0 R]>> endobj\n"
                f"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n"
                f"4 0 obj <</Length 100>> stream\nBT /F1 12 Tf 50 700 TD ({pol['policy_name']} - {pol['insurer']}) Tj ET\nendstream\nendobj\n"
                f"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \n"
                f"trailer <</Size 5 /Root 1 0 R>>\nstartxref\n360\n%%EOF"
            )
            try:
                fpath.write_bytes(content.encode("latin-1"))
            except Exception:
                pass


def _read_fallback_db() -> List[Dict[str, Any]]:
    _ensure_seed_pdfs()
    if not FALLBACK_DB_PATH.exists():
        with open(FALLBACK_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(SEED_POLICIES, f, indent=2)
        return SEED_POLICIES
    try:
        with open(FALLBACK_DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else SEED_POLICIES
    except Exception:
        return SEED_POLICIES


def _write_fallback_db(policies: List[Dict[str, Any]]) -> None:
    try:
        with open(FALLBACK_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(policies, f, indent=2)
    except Exception:
        pass


def _get_mongo():
    try:
        collection = get_mongo_collection()
        return collection
    except Exception:
        return None


def list_policies_raw() -> List[Dict[str, Any]]:
    mongo = _get_mongo()
    if mongo is not None:
        try:
            docs = list(mongo.find({}, {"_id": 0}))
            if docs and len(docs) > 0:
                return docs
        except Exception:
            pass
    return _read_fallback_db()


def save_policy(policy_dict: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_seed_pdfs()
    if not policy_dict.get("id"):
        policy_dict["id"] = f"pol_{uuid.uuid4().hex[:8]}"
    if not policy_dict.get("upload_date"):
        policy_dict["upload_date"] = datetime.utcnow().isoformat() + "Z"

    if not policy_dict.get("activation_days"):
        policy_dict["activation_days"] = DAYS_OF_WEEK

    mongo = _get_mongo()
    if mongo is not None:
        try:
            mongo.update_one(
                {"id": policy_dict["id"]},
                {"$set": policy_dict},
                upsert=True
            )
        except Exception:
            pass

    fallback = _read_fallback_db()
    idx = next((i for i, p in enumerate(fallback) if p.get("id") == policy_dict["id"] or p.get("file_name") == policy_dict.get("file_name")), None)
    if idx is not None:
        fallback[idx] = policy_dict
    else:
        fallback.append(policy_dict)
    _write_fallback_db(fallback)

    return policy_dict


def delete_policy_by_id_or_name(identifier: str) -> bool:
    mongo = _get_mongo()
    deleted = False
    if mongo is not None:
        try:
            res = mongo.delete_one({"$or": [{"id": identifier}, {"file_name": identifier}, {"policy_name": identifier}]})
            if res.deleted_count > 0:
                deleted = True
        except Exception:
            pass

    fallback = _read_fallback_db()
    new_fallback = [
        p for p in fallback
        if p.get("id") != identifier and p.get("file_name") != identifier and p.get("policy_name") != identifier
    ]
    if len(new_fallback) < len(fallback):
        deleted = True
        _write_fallback_db(new_fallback)

    return deleted


def get_policy_by_identifier(identifier: str) -> Optional[Dict[str, Any]]:
    policies = list_policies_raw()
    for p in policies:
        if p.get("id") == identifier or p.get("file_name") == identifier or p.get("policy_name") == identifier:
            return p
    return None
