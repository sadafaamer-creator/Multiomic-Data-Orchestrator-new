from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Annotated

# Helper to convert ObjectId to str
PyObjectId = Annotated[str, BeforeValidator(str)]

class TemplateSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: Optional[str] = None
    columns: List[str]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "name": "Illumina NovaSeq",
                "description": "Standard audit template for NovaSeq runs",
                "columns": ["Flowcell ID", "Sample ID", "Lane", "Index"]
            }
        }

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    columns: List[str]

class TemplateInDB(TemplateCreate):
    pass