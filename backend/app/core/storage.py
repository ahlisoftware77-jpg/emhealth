import os
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class StorageManager:
    """
    Unified Storage Manager supporting both Local Storage and Cloudinary.
    """
    def __init__(self):
        self.mode = settings.PRIMARY_STORAGE_ENGINE
        self._init_cloudinary()

    def _init_cloudinary(self):
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            try:
                import cloudinary
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True
                )
                logger.info("Cloudinary initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Cloudinary: {e}")

    def save_local_file(self, content: bytes, filename: str, target_dir: Optional[Path] = None) -> Path:
        target = target_dir or settings.UPLOAD_DIR
        target.mkdir(parents=True, exist_ok=True)
        file_path = target / filename
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path

    def get_storage_stats(self) -> Dict[str, Any]:
        def get_dir_size(path: Path) -> int:
            total = 0
            if path.exists():
                for p in path.glob('**/*'):
                    if p.is_file():
                        total += p.stat().st_size
            return total

        upload_size = get_dir_size(settings.UPLOAD_DIR)
        output_size = get_dir_size(settings.OUTPUT_DIR)
        temp_size = get_dir_size(settings.TEMP_DIR)
        cache_size = get_dir_size(settings.CACHE_DIR)
        
        return {
            "primary_engine": settings.PRIMARY_STORAGE_ENGINE,
            "upload_bytes": upload_size,
            "output_bytes": output_size,
            "temp_bytes": temp_size,
            "cache_bytes": cache_size,
            "total_local_bytes": upload_size + output_size + temp_size + cache_size
        }

    def list_local_files(self, folder_name: str) -> List[Dict[str, Any]]:
        folder_map = {
            "upload": settings.UPLOAD_DIR,
            "output": settings.OUTPUT_DIR,
            "temp": settings.TEMP_DIR,
            "cache": settings.CACHE_DIR
        }
        target_path = folder_map.get(folder_name.lower(), settings.OUTPUT_DIR)
        result = []
        if target_path.exists():
            for p in target_path.glob('*'):
                if p.is_file():
                    stat = p.stat()
                    result.append({
                        "name": p.name,
                        "path": str(p),
                        "size": stat.st_size,
                        "created_at": stat.st_ctime,
                        "modified_at": stat.st_mtime,
                        "folder": folder_name
                    })
        return sorted(result, key=lambda x: x["modified_at"], reverse=True)

    def clear_folder(self, folder_name: str) -> int:
        folder_map = {
            "upload": settings.UPLOAD_DIR,
            "output": settings.OUTPUT_DIR,
            "temp": settings.TEMP_DIR,
            "cache": settings.CACHE_DIR
        }
        target_path = folder_map.get(folder_name.lower())
        if not target_path or not target_path.exists():
            return 0
        
        count = 0
        for p in target_path.glob('*'):
            if p.is_file():
                p.unlink()
                count += 1
            elif p.is_dir():
                shutil.rmtree(p)
                count += 1
        return count

storage_manager = StorageManager()
