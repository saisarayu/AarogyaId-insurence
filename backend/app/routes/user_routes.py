from fastapi import APIRouter, HTTPException
from app.models.user_model import UserProfile, ChatRequest
from app.services.ai_service import generate_recommendation, chat_with_user

router = APIRouter(tags=["user"])


@router.post("/recommend")
def recommend(user: UserProfile):
    try:
        result = generate_recommendation(user.dict())
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # Return structured keys directly so the frontend can render the table and cards.
    return {
        "peer_comparison": result.get("peer_comparison", []),
        "coverage_details": result.get("coverage_details", {}),
        "why_this_policy": result.get("why_this_policy", ""),
        "source_policies": result.get("source_policies", []),
    }


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        result = chat_with_user(request.question, request.user_profile.dict())
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if not result:
        raise HTTPException(status_code=500, detail="Unable to process chat request")

    return {
        "answer": result["answer"],
        "sources": result["sources"],
    }
