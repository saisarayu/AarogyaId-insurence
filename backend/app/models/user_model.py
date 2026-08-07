from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    name: Optional[str] = "Applicant"
    age: Optional[int] = 35
    lifestyle: Optional[str] = "Moderate"
    conditions: List[str] = Field(default_factory=list)
    diseases: List[str] = Field(default_factory=list)
    income: Optional[Any] = "3-8L"
    city: Optional[str] = "Metro"

    class Config:
        extra = "allow"


class ChatRequest(BaseModel):
    question: str
    user_profile: Dict[str, Any] = Field(default_factory=dict)


class DeletePolicyRequest(BaseModel):
    policy_name: str
