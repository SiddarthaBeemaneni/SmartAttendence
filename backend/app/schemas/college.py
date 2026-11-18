"""
SmartAttend AI / CampusAI - College Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class CollegeVerifyRequest(BaseModel):
    college_name: Optional[str] = None
    college_code: Optional[str] = None
    college_id: Optional[str] = None


class CollegeResponse(BaseModel):
    college_id: str
    college_name: str
    college_code: str
    location: str
    state: str
    affiliation: str
    verification_status: str

    class Config:
        from_attributes = True


class CollegeVerifyResponse(BaseModel):
    status: str
    message: str
    college: CollegeResponse


class CollegeSearchResponse(BaseModel):
    total: int
    colleges: List[CollegeResponse]
