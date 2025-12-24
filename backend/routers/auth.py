from fastapi import APIRouter, HTTPException, status, Request, Depends
from backend.models.user import UserCreate, UserLogin, Token, UserSchema, UserInDB
from backend.core.security import get_password_hash, verify_password, create_access_token
from backend.deps import get_current_user

router = APIRouter()

@router.post("/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, request: Request):
    db = request.app.mongodb
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = get_password_hash(user.password)
    
    # Create user document
    user_in_db = UserInDB(
        **user.model_dump(exclude={"password"}),
        password_hash=password_hash
    )
    
    # Insert into database
    new_user = await db["users"].insert_one(user_in_db.model_dump())
    
    created_user = await db["users"].find_one({"_id": new_user.inserted_id})
    
    return UserSchema(**created_user)

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, request: Request):
    db = request.app.mongodb
    
    user = await db["users"].find_one({"email": user_login.email})
    
    if not user or not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(
        data={"sub": user["email"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: UserSchema = Depends(get_current_user)):
    """
    Get current user.
    """
    return current_user

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    return {"message": "Logged out successfully"}