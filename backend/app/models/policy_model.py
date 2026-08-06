from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PolicyMetadata(BaseModel):
    """Metadata stored in MongoDB for each uploaded policy document."""

    id: Optional[str] = Field(None, description="Unique policy identifier")
    policy_name: str = Field(..., description="Display name of the policy")
    file_name: str = Field(..., description="Original PDF filename stored on disk")
    insurer: Optional[str] = Field(None, description="Insurance provider name")
    description: str = Field("", description="Detailed summary of coverage and benefits")
    disease_categories: List[str] = Field(default_factory=list, description="List of targeted disease categories")
    eligibility_criteria: str = Field("", description="Detailed eligibility conditions")
    annual_income_limit: float = Field(10000000.0, description="Maximum annual income in INR allowed for eligibility")
    min_age: int = Field(0, description="Minimum eligible age")
    max_age: int = Field(100, description="Maximum eligible age")
    scheme_type: str = Field("Government", description="Government or Private scheme")
    coverage_amount: float = Field(500000.0, description="Total financial coverage in INR")
    required_documents: List[str] = Field(default_factory=list, description="List of required application documents")
    status: str = Field("Active", description="Active or Inactive")
    activation_days: List[str] = Field(
        default_factory=lambda: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        description="Days of the week when this policy is active",
    )
    upload_date: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Creation/upload timestamp")


class PolicyCreate(BaseModel):
    policy_name: str
    description: Optional[str] = ""
    insurer: Optional[str] = "National Health Care"
    disease_categories: List[str]
    eligibility_criteria: Optional[str] = "Standard eligibility applies"
    annual_income_limit: float = 10000000.0
    min_age: int = 0
    max_age: int = 100
    scheme_type: str = "Government"
    coverage_amount: float = 500000.0
    required_documents: Optional[List[str]] = []
    status: str = "Active"
    activation_days: Optional[List[str]] = None


class PolicyUpdate(BaseModel):
    policy_name: Optional[str] = None
    description: Optional[str] = None
    insurer: Optional[str] = None
    disease_categories: Optional[List[str]] = None
    eligibility_criteria: Optional[str] = None
    annual_income_limit: Optional[float] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    scheme_type: Optional[str] = None
    coverage_amount: Optional[float] = None
    required_documents: Optional[List[str]] = None
    status: Optional[str] = None
    activation_days: Optional[List[str]] = None


class RecommendationQuery(BaseModel):
    diseases: List[str] = Field(default_factory=list, description="Selected disease categories")
    annual_income: float = Field(..., description="User's annual income in INR")
    age: int = Field(..., description="User's current age")
    day_of_week: Optional[str] = Field(None, description="Specific day to test (defaults to today)")
    scheme_type: Optional[str] = Field("All", description="Filter by Government, Private, or All")
    min_coverage: Optional[float] = Field(0.0, description="Minimum coverage amount requested")

