from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Annotated
from datetime import datetime

# Helper to convert ObjectId to str
PyObjectId = Annotated[str, BeforeValidator(str)]

class RunSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    template_id: str
    status: str
    errors: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "user_id": "60d5ecb8b5c9e8a8c8e8e8e8",
                "template_id": "60d5ecb8b5c9e8a8c8e8e8e9",
                "status": "fail",
                "errors": ["Missing column: Sample ID"],
                "timestamp": "2023-10-27T10:00:00Z"
            }
        }

class RunStats(BaseModel):
    total_runs: int
    passed_runs: int
    failed_runs: int