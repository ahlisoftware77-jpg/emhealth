import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.v1.auth import router as auth_router
from app.api.v1.excel import router as excel_router
from app.api.v1.image import router as image_router
from app.api.v1.cloudinary import router as cloudinary_router
from app.api.v1.storage import router as storage_router
from app.api.v1.job_queue import router as job_queue_router
from app.api.v1.presets import router as presets_router
from app.api.v1.settings import router as settings_router
from app.api.v1.stats import router as stats_router
from app.api.v1.ai import router as ai_router
from app.api.v1.mcu_blast import router as mcu_blast_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "https://emhealth.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(excel_router, prefix=settings.API_V1_STR)
app.include_router(image_router, prefix=settings.API_V1_STR)
app.include_router(cloudinary_router, prefix=settings.API_V1_STR)
app.include_router(storage_router, prefix=settings.API_V1_STR)
app.include_router(job_queue_router, prefix=settings.API_V1_STR)
app.include_router(presets_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(stats_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(mcu_blast_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8003))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
