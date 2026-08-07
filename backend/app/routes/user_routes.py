from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path

from app.models.policy_model import RecommendationQuery
from app.models.user_model import UserProfile, ChatRequest
from app.services.ai_service import generate_recommendation
from app.services.chat_service import chat_with_user
from app.services.policy_service import POLICIES_DIR, list_policies_raw
from app.services.recommendation_service import evaluate_recommendations, get_current_day_name

router = APIRouter(tags=["user"])


@router.post("/policies/recommend")
def recommend_policies(query: RecommendationQuery):
    """
    Intelligent Policy Recommendation Endpoint.
    Applies the strict 8-step filtering sequence:
    1. Active status check
    2. Today's activation day schedule check
    3. Disease category matching
    4. Income eligibility check
    5. Age eligibility check
    6. Deduplication
    7. Relevance scoring
    8. Returns list of eligible policies with downloadable PDFs
    """
    try:
        result = evaluate_recommendations(
            diseases=query.diseases,
            annual_income=query.annual_income,
            age=query.age,
            day_of_week=query.day_of_week,
            scheme_type=query.scheme_type,
            min_coverage=query.min_coverage,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation evaluation failed: {str(exc)}")


@router.get("/policies/active")
def get_active_policies(day: Optional[str] = None):
    """Returns policies active on the specified day (or today)."""
    target_day = (day or get_current_day_name()).lower()
    all_policies = list_policies_raw()
    active_today = []
    for p in all_policies:
        if p.get("status", "Active").lower() == "active":
            activation = [d.lower() for d in (p.get("activation_days") or [])]
            if target_day in activation or not activation:
                active_today.append(p)
    return {"day": target_day.title(), "count": len(active_today), "policies": active_today}


@router.get("/policies/by-disease")
def get_policies_by_disease(disease: str = Query(..., description="Disease category to filter")):
    all_policies = list_policies_raw()
    d_lower = disease.strip().lower()
    matched = []
    for p in all_policies:
        cats = [c.lower() for c in (p.get("disease_categories") or [])]
        if any(d_lower in c for c in cats):
            matched.append(p)
    return {"disease": disease, "count": len(matched), "policies": matched}


@router.get("/policies/by-diseases")
def get_policies_by_multiple_diseases(diseases: str = Query(..., description="Comma-separated list of diseases")):
    disease_list = [d.strip() for d in diseases.split(",") if d.strip()]
    result = evaluate_recommendations(
        diseases=disease_list,
        annual_income=10000000.0,
        age=30,
    )
    return {"diseases": disease_list, "count": result["count"], "policies": result["recommended_policies"]}


@router.get("/policies/by-income")
def get_policies_by_income(income: float = Query(..., description="Annual income in INR")):
    all_policies = list_policies_raw()
    eligible = []
    for p in all_policies:
        limit = float(p.get("annual_income_limit", 10000000.0))
        if income <= limit and p.get("status", "Active").lower() == "active":
            eligible.append(p)
    return {"user_income": income, "count": len(eligible), "policies": eligible}


@router.get("/policies/download/{file_name}")
def download_policy_pdf(file_name: str):
    """Secure PDF stream/download endpoint."""
    # Sanitize filename
    safe_filename = Path(file_name).name
    file_path = POLICIES_DIR / safe_filename

    if not file_path.exists():
        # Fallback to create a stub if missing
        content = (
            f"%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
            f"2 0 obj <</Type /Pages /Count 1 /Kids [3 0 R]>> endobj\n"
            f"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n"
            f"4 0 obj <</Length 100>> stream\nBT /F1 12 Tf 50 700 TD (AarogyaId Insurance Policy Document - {safe_filename}) Tj ET\nendstream\nendobj\n"
            f"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \n"
            f"trailer <</Size 5 /Root 1 0 R>>\nstartxref\n360\n%%EOF"
        )
        file_path.write_bytes(content.encode("latin-1"))

    return FileResponse(
        path=str(file_path),
        filename=safe_filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={safe_filename}"}
    )


# Legacy endpoints maintained for existing frontend compatibility
@router.post("/recommend")
def recommend_legacy(user: UserProfile):
    try:
        # Convert legacy user profile to recommendation engine query
        raw_health = None
        for attr in ("health_condition", "health_conditions", "condition", "medical_condition"):
            if hasattr(user, attr):
                raw_health = getattr(user, attr)
                break
        if isinstance(raw_health, list):
            disease = raw_health[0] if raw_health else ""
        else:
            disease = str(raw_health).strip() if raw_health else ""
        diseases = [disease] if disease else ["Cancer", "Diabetes"]
        
        income_map = {
            "under 3l": 280000.0,
            "3-8l": 500000.0,
            "8-15l": 1000000.0,
            "15l+": 1500000.0
        }
        raw_income = getattr(user, "annual_income", None) or getattr(user, "income", "")
        annual_income = income_map.get(str(raw_income).lower(), 500000.0)

        result = evaluate_recommendations(
            diseases=diseases,
            annual_income=annual_income,
            age=user.age or 35,
        )

        return {
            "peer_comparison": result.get("recommended_policies", []),
            "coverage_details": {"eligible_count": result.get("count", 0), "target_day": result.get("target_day", "")},
            "why_this_policy": f"Selected top matching health policies active on {result.get('target_day')} based on selected conditions and income limit.",
            "source_policies": [p.get("file_name") for p in result.get("recommended_policies", [])],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        profile_dict = request.user_profile if isinstance(request.user_profile, dict) else request.user_profile.dict()
        result = chat_with_user(request.question, profile_dict)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(exc)}")

    if not result:
        raise HTTPException(status_code=500, detail="Unable to process chat request")

    return {
        "answer": result.get("answer", "No answer available."),
        "sources": result.get("sources", []),
    }
