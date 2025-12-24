from fastapi import APIRouter, HTTPException, status, Request
from typing import List
from bson import ObjectId
from backend.models.template import TemplateSchema

router = APIRouter()

@router.get("/", response_model=List[TemplateSchema])
async def list_templates(request: Request):
    """
    Retrieve all audit templates.
    """
    db = request.app.mongodb
    templates = await db["templates"].find().to_list(1000)
    return templates

@router.get("/{id}", response_model=TemplateSchema)
async def get_template(id: str, request: Request):
    """
    Retrieve a specific audit template by ID.
    """
    db = request.app.mongodb
    
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
        
    template = await db["templates"].find_one({"_id": ObjectId(id)})
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
        
    return template