"""
JointSense API — FastAPI Backend
Run locally: uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analysis, materials, ai_assistant, upload
from app.core.config import settings

app = FastAPI(
    title="JointSense API",
    description="Aerospace Structural Joint Analysis Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Build allowed origins list — always include frontend URL if set
origins = list(settings.ALLOWED_ORIGINS)
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)

# In production allow all if no specific origins configured
if settings.APP_ENV == "production" and not settings.FRONTEND_URL:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router,     prefix="/api/analysis",  tags=["Analysis"])
app.include_router(materials.router,    prefix="/api/materials", tags=["Materials"])
app.include_router(ai_assistant.router, prefix="/api/ai",        tags=["AI Assistant"])
app.include_router(upload.router,       prefix="/api/upload",    tags=["File Upload"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "JointSense API", "version": "1.0.0"}
