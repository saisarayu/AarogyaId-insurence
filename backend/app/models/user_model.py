from typing import Literal
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    name: str = Field(..., description="Full name of the user")
    age: int = Field(..., ge=1, le=99, description="Age of the user")
    lifestyle: Literal["Sedentary", "Moderate", "Active", "Athlete"]
    conditions: list[str] = Field(default_factory=list)
    income: Literal["under 3L", "3-8L", "8-15L", "15L+"]
    city: Literal["Metro", "Tier-2", "Tier-3"]


class ChatRequest(BaseModel):
    question: str
    user_profile: UserProfile


class DeletePolicyRequest(BaseModel):
    policy_name: str
