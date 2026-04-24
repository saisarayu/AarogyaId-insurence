from datetime import datetime
from pydantic import BaseModel, Field


class PolicyMetadata(BaseModel):
    """Metadata stored in MongoDB for each uploaded policy document."""

    policy_name: str = Field(..., description="Display name or filename of the policy")
    file_name: str = Field(..., description="Original filename as stored on disk")
    insurer: str | None = Field(None, description="Name of the insurance company, if available")
    upload_date: datetime | None = Field(None, description="UTC timestamp of when the policy was uploaded")
