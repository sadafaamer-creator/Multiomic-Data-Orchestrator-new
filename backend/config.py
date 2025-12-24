from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "Multiomic Data Orchestrator"
    mongodb_uri: str = "mongodb://localhost:27017"
    db_name: str = "mdo_db"
    cors_origins: List[str] = ["http://localhost:5173"]

    # JWT Settings
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()