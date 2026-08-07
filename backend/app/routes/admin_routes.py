import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app.models.policy_model import PolicyCreate, PolicyUpdate
from app.services.parser_service import chunk_text, extract_text
from app.services.policy_service import (
    DAYS_OF_WEEK,
    POLICIES_DIR,
    delete_policy_by_id_or_name,
    get_policy_by_identifier,
    list_policies_raw,
    save_policy,
)
from app.services.rag_service import (
    delete_policy_chunks,
    store_policy_chunks,
)

router = APIRouter(tags=["admin"])


@router.post("/upload-policy")
@router.post("/admin/policies")
async def create_or_upload_policy(
    file: Optional[UploadFile] = File(None),
    policy_name: str = Form(...),
    description: Optional[str] = Form(""),
    insurer: Optional[str] = Form("National Health Care"),
    disease_categories: str = Form("[]"),  # JSON string or comma-separated
    eligibility_criteria: Optional[str] = Form("Standard eligibility"),
    annual_income_limit: float = Form(10000000.0),
    min_age: int = Form(0),
    max_age: int = Form(100),
    scheme_type: str = Form("Government"),
    coverage_amount: float = Form(500000.0),
    required_documents: str = Form("[]"),
    status: str = Form("Active"),
    activation_days: str = Form("[]"),
):
    try:
        # Parse JSON or comma-separated lists
        def parse_list(raw_val: str) -> List[str]:
            if not raw_val:
                return []
            raw_val = raw_val.strip()
            if raw_val.startswith("["):
                try:
                    res = json.loads(raw_val)
                    if isinstance(res, list):
                        return [str(x).strip() for x in res if str(x).strip()]
                except Exception:
                    pass
            return [x.strip() for x in raw_val.split(",") if x.strip()]

        cat_list = parse_list(disease_categories)
        doc_list = parse_list(required_documents)
        days_list = parse_list(activation_days) or DAYS_OF_WEEK

        # File Handling
        file_name = ""
        if file and file.filename:
            file_name = file.filename
            file_path = POLICIES_DIR / file_name
            content = await file.read()
            file_path.write_bytes(content)

            # RAG indexing if PDF/TXT
            try:
                text = extract_text(str(file_path))
                chunks = chunk_text(text)
                if chunks:
                    store_policy_chunks(
                        policy_name=policy_name,
                        source_file=file_name,
                        chunks=chunks,
                    )
            except Exception:
                pass  # Optional index fallback
        else:
            # Generate a PDF stub if no file uploaded
            safe_name = policy_name.lower().replace(" ", "_").replace("/", "_")
            file_name = f"{safe_name}.pdf"
            file_path = POLICIES_DIR / file_name
            if not file_path.exists():
                pdf_content = (
                    f"%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
                    f"2 0 obj <</Type /Pages /Count 1 /Kids [3 0 R]>> endobj\n"
                    f"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n"
                    f"4 0 obj <</Length 100>> stream\nBT /F1 12 Tf 50 700 TD ({policy_name} - {insurer}) Tj ET\nendstream\nendobj\n"
                    f"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \n"
                    f"trailer <</Size 5 /Root 1 0 R>>\nstartxref\n360\n%%EOF"
                )
                file_path.write_bytes(pdf_content.encode("latin-1"))

        policy_dict = {
            "policy_name": policy_name,
            "file_name": file_name,
            "description": description or f"Health insurance scheme covering {', '.join(cat_list)}.",
            "insurer": insurer,
            "disease_categories": cat_list,
            "eligibility_criteria": eligibility_criteria,
            "annual_income_limit": annual_income_limit,
            "min_age": min_age,
            "max_age": max_age,
            "scheme_type": scheme_type,
            "coverage_amount": coverage_amount,
            "required_documents": doc_list,
            "status": status,
            "activation_days": days_list,
            "upload_date": datetime.utcnow().isoformat() + "Z",
        }

        saved = save_policy(policy_dict)

        return {
            "message": "Policy successfully created/uploaded.",
            "policy": saved,
        }

    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Failed to upload policy: {str(e)}\n{traceback.format_exc()}")


@router.get("/policies")
@router.get("/admin/policies")
def list_policies():
    """Returns all stored policies for Admin management."""
    policies = list_policies_raw()
    return {"policies": policies, "total": len(policies)}


@router.get("/admin/stats")
def get_admin_stats():
    """Return dashboard analytics for the admin panel."""
    policies = list_policies_raw()
    total_policies = len(policies)
    active_policies = sum(1 for p in policies if p.get("status", "Active").lower() == "active")
    inactive_policies = total_policies - active_policies
    total_coverage = sum(float(p.get("coverage_amount", 0)) for p in policies)

    # Categories breakdown
    categories_count = {}
    for p in policies:
        for cat in p.get("disease_categories", []):
            categories_count[cat] = categories_count.get(cat, 0) + 1

    return {
        "total_policies": total_policies,
        "active_policies": active_policies,
        "inactive_policies": inactive_policies,
        "total_coverage_value": total_coverage,
        "disease_breakdown": categories_count,
    }


@router.put("/admin/policies/{policy_id}")
def update_policy(policy_id: str, updates: PolicyUpdate):
    existing = get_policy_by_identifier(policy_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Policy not found")

    update_data = updates.dict(exclude_unset=True)
    existing.update(update_data)
    saved = save_policy(existing)

    return {"message": "Policy updated successfully", "policy": saved}


@router.delete("/delete-policy")
@router.delete("/admin/policies/{policy_id}")
def delete_policy(
    policy_id: Optional[str] = None,
    file_name: Optional[str] = Query(None)
):
    target = policy_id or file_name
    if not target:
        raise HTTPException(status_code=400, detail="Must provide policy_id or file_name")

    deleted = delete_policy_by_id_or_name(target)
    try:
        delete_policy_chunks(target)
    except Exception:
        pass

    if not deleted:
        raise HTTPException(status_code=404, detail=f"Policy '{target}' not found.")

    return {"message": f"Policy '{target}' deleted successfully."}


@router.post("/refresh-vector-db")
def refresh_vector_db():
    policies = list_policies_raw()
    refreshed = []
    for pol in policies:
        fname = pol.get("file_name")
        if fname:
            fpath = POLICIES_DIR / fname
            if fpath.exists():
                try:
                    text = extract_text(str(fpath))
                    chunks = chunk_text(text)
                    if chunks:
                        delete_policy_chunks(fname)
                        store_policy_chunks(policy_name=pol.get("policy_name", fname), source_file=fname, chunks=chunks)
                        refreshed.append(fname)
                except Exception:
                    pass
    return {"message": f"Refreshed vector database for {len(refreshed)} policies.", "policies": refreshed}
