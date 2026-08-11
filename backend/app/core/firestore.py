import logging
import os
from typing import Optional, Dict, Any, List
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

logger = logging.getLogger(__name__)

def _get_or_init_firebase_app():
    """Inisialisasi Firebase Admin SDK jika belum ada.
    Gunakan app yang sudah ada jika sudah diinisialisasi — hindari konflik."""
    try:
        # Jika sudah ada app default, langsung pakai
        if firebase_admin._apps:
            return firebase_admin.get_app()
        
        import json
        raw_json = (settings.FIREBASE_SERVICE_ACCOUNT_JSON or "").strip()
        
        if raw_json:
            try:
                cred_dict = json.loads(raw_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin Initialized dari raw Service Account JSON.")
                return firebase_admin.get_app()
            except Exception as json_err:
                logger.warning(f"Gagal parse Raw Service Account JSON: {json_err}")
        
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin Initialized dari file JSON.")
            return firebase_admin.get_app()
        
        if settings.FIREBASE_PROJECT_ID:
            firebase_admin.initialize_app(options={'projectId': settings.FIREBASE_PROJECT_ID})
            logger.info(f"Firebase Admin Initialized dengan Project ID: {settings.FIREBASE_PROJECT_ID}")
            return firebase_admin.get_app()
        
        logger.info("Service Account / Project ID tidak ditemukan — Firebase tidak diinisialisasi.")
        return None
    except Exception as e:
        logger.warning(f"Firebase Admin SDK init error: {e}")
        return None


class FirestoreService:
    def __init__(self):
        self.db: Optional[Any] = None
        self._initialized = False
        self._init_firestore()

    def _init_firestore(self):
        try:
            app = _get_or_init_firebase_app()
            if app is not None:
                try:
                    self.db = firestore.client()
                    self._initialized = True
                    logger.info("Koneksi Firestore Client berhasil dibuat.")
                except Exception as db_err:
                    logger.warning(f"Koneksi Firestore client gagal ({db_err}). Menggunakan mode fallback lokal.")
                    self.db = None
                    self._initialized = False
        except Exception as e:
            logger.warning(f"Gagal menginisialisasi Firestore ({e}). Mode fallback memori.")
            self.db = None
            self._initialized = False

    @property
    def is_available(self) -> bool:
        return self._initialized and self.db is not None

    # --- JOB QUEUE FIRESTORE PERSISTENCE ---
    def save_job(self, job_data: Dict[str, Any]):
        if not self.is_available:
            return
        try:
            doc_ref = self.db.collection("jobs").document(job_data["job_id"])
            doc_ref.set(job_data, merge=True)
        except Exception as e:
            logger.error(f"Gagal menyimpan job ke Firestore: {e}")

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_available:
            return None
        try:
            doc = self.db.collection("jobs").document(job_id).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logger.error(f"Gagal mengambil job dari Firestore: {e}")
            return None

    def list_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.is_available:
            return []
        try:
            docs = self.db.collection("jobs").order_by("updated_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
            return [d.to_dict() for d in docs]
        except Exception as e:
            logger.error(f"Gagal membaca list jobs dari Firestore: {e}")
            return []

    # --- PRESETS FIRESTORE PERSISTENCE ---
    def save_preset(self, preset_data: Dict[str, Any]):
        if not self.is_available:
            return
        try:
            self.db.collection("presets").document(preset_data["id"]).set(preset_data)
        except Exception as e:
            logger.error(f"Gagal menyimpan preset ke Firestore: {e}")

    def delete_preset(self, preset_id: str):
        if not self.is_available:
            return
        try:
            self.db.collection("presets").document(preset_id).delete()
        except Exception as e:
            logger.error(f"Gagal menghapus preset dari Firestore: {e}")

    def list_presets(self) -> List[Dict[str, Any]]:
        if not self.is_available:
            return []
        try:
            docs = self.db.collection("presets").stream()
            return [d.to_dict() for d in docs]
        except Exception as e:
            logger.error(f"Gagal membaca presets dari Firestore: {e}")
            return []

    # --- SYSTEM SETTINGS FIRESTORE PERSISTENCE ---
    def save_settings(self, settings_data: Dict[str, Any]) -> bool:
        if not self.is_available:
            raise Exception("Firestore service tidak aktif. Silakan masukkan Service Account JSON / Project ID yang valid.")
        try:
            self.db.collection("settings").document("system_config").set(settings_data, merge=True)
            logger.info("Pengaturan sistem berhasil disimpan ke Firestore (collection: settings/system_config).")
            return True
        except Exception as e:
            logger.error(f"Gagal menyimpan settings ke Firestore: {e}")
            raise Exception(f"Gagal menulis ke Firestore: {str(e)}")

    def get_settings(self) -> Optional[Dict[str, Any]]:
        if not self.is_available:
            return None
        try:
            doc = self.db.collection("settings").document("system_config").get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logger.error(f"Gagal mengambil settings dari Firestore: {e}")
            return None

firestore_service = FirestoreService()
