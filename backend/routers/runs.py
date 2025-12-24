from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status, Request
from typing import Annotated, List
from bson import ObjectId
import csv
import io
from datetime import datetime

from backend.models.run import RunSchema, RunStats
from backend.models.user import UserSchema
from backend.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[RunSchema])
async def list_runs(
    request: Request,
    current_user: UserSchema = Depends(get_current_user)
):
    runs = await request.app.mongodb["runs"].find({"user_id": str(current_user.id)}).sort("timestamp", -1).to_list(length=100)
    return runs

@router.get("/stats", response_model=RunStats)
async def get_run_stats(
    request: Request,
    current_user: UserSchema = Depends(get_current_user)
):
    user_id = str(current_user.id)
    total_runs = await request.app.mongodb["runs"].count_documents({"user_id": user_id})
    passed_runs = await request.app.mongodb["runs"].count_documents({"user_id": user_id, "status": "pass"})
    failed_runs = await request.app.mongodb["runs"].count_documents({"user_id": user_id, "status": "fail"})
    
    return RunStats(
        total_runs=total_runs,
        passed_runs=passed_runs,
        failed_runs=failed_runs
    )

@router.post("/upload", response_model=RunSchema, status_code=status.HTTP_201_CREATED)
async def upload_run(
    request: Request,
    file: UploadFile = File(...),
    template_id: str = Form(...),
    current_user: UserSchema = Depends(get_current_user)
):
    db = request.app.mongodb

    # 1. Fetch Template
    if not ObjectId.is_valid(template_id):
        raise HTTPException(status_code=400, detail="Invalid template_id format")
    
    template = await db["templates"].find_one({"_id": ObjectId(template_id)})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # 2. Parse CSV Headers
    if not file.filename.endswith('.csv'):
         raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    try:
        # Decode bytes to string
        decoded_content = content.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(decoded_content))
        headers = next(csv_reader, None)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if not headers:
        raise HTTPException(status_code=400, detail="CSV file is empty or missing headers")

    # 3. Validation: Check if columns exist
    required_columns = template.get("columns", [])
    missing_columns = [col for col in required_columns if col not in headers]
    
    run_status = "pass"
    errors = []
    
    if missing_columns:
        run_status = "fail"
        errors.append(f"Missing columns: {', '.join(missing_columns)}")

    # 4. Store Run Record
    run_doc = {
        "user_id": str(current_user.id),
        "template_id": template_id,
        "status": run_status,
        "errors": errors,
        "timestamp": datetime.utcnow()
    }
    
    new_run = await db["runs"].insert_one(run_doc)
    created_run = await db["runs"].find_one({"_id": new_run.inserted_id})
    
    return RunSchema(**created_run)