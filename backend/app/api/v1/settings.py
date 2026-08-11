from fastapi import APIRouter, Depends
from typing import Dict, Any
import logging
from app.core.config import settings
from app.models.schemas import SettingsSchema
from app.core.security import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
async def get_system_settings(user: Dict[str, Any] = Depends(get_current_user)):
    fs_settings = None
    try:
        from app.core.firestore import firestore_service
        if firestore_service.is_available:
            fs_settings = firestore_service.get_settings()
    except Exception:
        pass

    active_config = fs_settings or {}

    return {
        "status": "success",
        "settings": {
            "primary_storage_engine": active_config.get("PRIMARY_STORAGE_ENGINE", settings.PRIMARY_STORAGE_ENGINE),
            "tesseract_cmd": active_config.get("TESSERACT_CMD", settings.TESSERACT_CMD),
            "cloudinary_cloud_name": active_config.get("CLOUDINARY_CLOUD_NAME", settings.CLOUDINARY_CLOUD_NAME),
            "cloudinary_api_key": active_config.get("CLOUDINARY_API_KEY", settings.CLOUDINARY_API_KEY),
            "openai_api_key": active_config.get("OPENAI_API_KEY", settings.OPENAI_API_KEY),
            "gemini_api_key": active_config.get("GEMINI_API_KEY", settings.GEMINI_API_KEY),
            "deepseek_api_key": active_config.get("DEEPSEEK_API_KEY", settings.DEEPSEEK_API_KEY),
            "primary_ai_provider": active_config.get("PRIMARY_AI_PROVIDER", settings.PRIMARY_AI_PROVIDER),
            "firebase_api_key": active_config.get("FIREBASE_API_KEY", settings.FIREBASE_API_KEY),
            "firebase_auth_domain": settings.FIREBASE_AUTH_DOMAIN,
            "firebase_project_id": active_config.get("FIREBASE_PROJECT_ID", settings.FIREBASE_PROJECT_ID),
            "firebase_service_account_json": active_config.get("FIREBASE_SERVICE_ACCOUNT_JSON", settings.FIREBASE_SERVICE_ACCOUNT_JSON),
            "firebase_storage_bucket": settings.FIREBASE_STORAGE_BUCKET,
            "firebase_messaging_sender_id": settings.FIREBASE_MESSAGING_SENDER_ID,
            "firebase_app_id": settings.FIREBASE_APP_ID,
            "firestore_connected": __import__("app.core.firestore", fromlist=["firestore_service"]).firestore_service.is_available,
            "upload_dir": str(settings.UPLOAD_DIR),
            "output_dir": str(settings.OUTPUT_DIR),
            "temp_dir": str(settings.TEMP_DIR),
            "cache_dir": str(settings.CACHE_DIR)
        }
    }

@router.put("")
async def update_system_settings(
    req: SettingsSchema,
    user: Dict[str, Any] = Depends(require_role(["Super Admin", "Admin"]))
):
    settings.PRIMARY_STORAGE_ENGINE = req.primary_storage_engine
    if req.tesseract_cmd:
        settings.TESSERACT_CMD = req.tesseract_cmd
    if req.cloudinary_cloud_name:
        settings.CLOUDINARY_CLOUD_NAME = req.cloudinary_cloud_name
    if req.cloudinary_api_key:
        settings.CLOUDINARY_API_KEY = req.cloudinary_api_key
    if req.cloudinary_api_secret:
        settings.CLOUDINARY_API_SECRET = req.cloudinary_api_secret
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key
    if req.deepseek_api_key is not None:
        settings.DEEPSEEK_API_KEY = req.deepseek_api_key
    if req.primary_ai_provider is not None:
        settings.PRIMARY_AI_PROVIDER = req.primary_ai_provider
    if req.firebase_api_key is not None:
        settings.FIREBASE_API_KEY = req.firebase_api_key
    if req.firebase_auth_domain is not None:
        settings.FIREBASE_AUTH_DOMAIN = req.firebase_auth_domain
    if req.firebase_project_id is not None:
        settings.FIREBASE_PROJECT_ID = req.firebase_project_id
    if req.firebase_service_account_json is not None:
        settings.FIREBASE_SERVICE_ACCOUNT_JSON = req.firebase_service_account_json
        if '"project_id"' in req.firebase_service_account_json:
            import json
            try:
                pj_id = json.loads(req.firebase_service_account_json).get("project_id")
                if pj_id:
                    settings.FIREBASE_PROJECT_ID = pj_id
            except Exception:
                pass

    env_updates = {
        "PRIMARY_STORAGE_ENGINE": settings.PRIMARY_STORAGE_ENGINE,
        "TESSERACT_CMD": settings.TESSERACT_CMD,
        "CLOUDINARY_CLOUD_NAME": settings.CLOUDINARY_CLOUD_NAME,
        "CLOUDINARY_API_KEY": settings.CLOUDINARY_API_KEY,
        "CLOUDINARY_API_SECRET": settings.CLOUDINARY_API_SECRET,
        "OPENAI_API_KEY": settings.OPENAI_API_KEY,
        "GEMINI_API_KEY": settings.GEMINI_API_KEY,
        "DEEPSEEK_API_KEY": settings.DEEPSEEK_API_KEY,
        "PRIMARY_AI_PROVIDER": settings.PRIMARY_AI_PROVIDER,
        "FIREBASE_API_KEY": settings.FIREBASE_API_KEY,
        "FIREBASE_PROJECT_ID": settings.FIREBASE_PROJECT_ID,
        "FIREBASE_SERVICE_ACCOUNT_JSON": settings.FIREBASE_SERVICE_ACCOUNT_JSON,
    }

    # 1. Coba simpan permanently ke file .env lokal (jika diizinkan os)
    try:
        from app.core.config import save_settings_to_env
        save_settings_to_env(env_updates)
    except Exception as env_err:
        logger.warning(f"Tidak dapat menulis file .env: {env_err}")

    # 2. Inisialisasi ulang & Simpan ke Firestore
    firestore_msg = ""
    try:
        from app.core.firestore import firestore_service
        firestore_service._init_firebase()
        if firestore_service.is_available:
            firestore_service.save_settings(env_updates)
            firestore_msg = " dan tersinkronisasi permanen ke Cloud Firestore!"
        else:
            firestore_msg = " (Firestore belum aktif, silakan masukkan Service Account JSON)."
    except Exception as e:
        logger.warning(f"Gagal menyimpan ke firestore: {e}")
        firestore_msg = f" (Peringatan Firestore: {str(e)})"

    return {"status": "success", "message": f"Pengaturan sistem berhasil disimpan{firestore_msg}"}
