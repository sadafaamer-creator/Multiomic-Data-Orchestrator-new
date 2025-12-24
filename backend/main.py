from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from backend.routers import auth, templates, runs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.mongodb_client = AsyncIOMotorClient(settings.mongodb_uri)
    app.mongodb = app.mongodb_client[settings.db_name]
    print("Connected to the MongoDB database!")
    yield
    # Shutdown
    app.mongodb_client.close()

app = FastAPI(title=settings.app_name, lifespan=lifespan)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(runs.router, prefix="/api/v1/runs", tags=["runs"])

@app.get("/api/v1/healthz")
async def health_check():
    try:
        # Check if we can list collection names (lightweight check)
        await app.mongodb.list_collection_names()
        return {"status": "ok", "db_status": "connected"}
    except Exception as e:
        return {"status": "error", "db_status": "disconnected", "details": str(e)}
