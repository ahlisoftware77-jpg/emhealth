try:
    import uvicorn
except ImportError:
    uvicorn = None  # type: ignore  # Tidak diperlukan di Vercel Serverless

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
from app.api.v1.file_history import router as file_history_router
from app.api.v1.local_file import router as local_file_router

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
app.include_router(file_history_router, prefix=settings.API_V1_STR)
app.include_router(local_file_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/v1/health")
async def health_check():
    """Endpoint diagnostik publik - cek apakah backend berjalan dan semua paket tersedia."""
    import sys
    import platform
    checks = {"python": sys.version, "platform": platform.system()}
    
    # Cek paket kritis
    for pkg in ["pandas", "openpyxl", "fastapi", "firebase_admin"]:
        try:
            mod = __import__(pkg)
            checks[pkg] = getattr(mod, "__version__", "ok")
        except ImportError as e:
            checks[pkg] = f"MISSING: {e}"
    
    return {"status": "ok", "runtime": checks}

if __name__ == "__main__":
    import os
    if uvicorn is None:
        print("uvicorn tidak tersedia. Jalankan dengan: uvicorn main:app --reload")
    else:
        port = int(os.getenv("PORT", 8003))
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
