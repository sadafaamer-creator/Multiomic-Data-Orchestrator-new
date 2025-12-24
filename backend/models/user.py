from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from typing import Optional, Annotated

# Helper to convert ObjectId to str
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserSchema(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr
    full_name: Optional[str] = None
    disabled: Optional[bool] = False

class UserCreate(UserSchema):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserSchema):
    password_hash: str

class Token(BaseModel):
    access_token: str
    token_type: str