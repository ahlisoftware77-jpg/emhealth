import os
import zipfile
import requests
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class CloudinaryService:
    @staticmethod
    def upload_file(
        file_path: Path,
        folder_path: str = "data_utility_center",
        tags: List[str] = []
    ) -> Dict[str, Any]:
        try:
            import cloudinary.uploader
            response = cloudinary.uploader.upload(
                str(file_path),
                folder=folder_path,
                tags=tags,
                resource_type="auto"
            )
            return {
                "success": True,
                "public_id": response.get("public_id"),
                "secure_url": response.get("secure_url"),
                "format": response.get("format"),
                "bytes": response.get("bytes")
            }
        except Exception as e:
            logger.error(f"Cloudinary upload error for {file_path.name}: {e}")
            return {
                "success": False,
                "filename": file_path.name,
                "error": str(e)
            }

    @staticmethod
    def bulk_upload(
        file_paths: List[Path],
        folder_path: str = "data_utility_center",
        tags: List[str] = []
    ) -> Dict[str, Any]:
        uploaded = []
        failed = []
        for path in file_paths:
            res = CloudinaryService.upload_file(path, folder_path, tags)
            if res.get("success"):
                uploaded.append(res)
            else:
                failed.append(res)

        return {
            "total_files": len(file_paths),
            "uploaded_count": len(uploaded),
            "failed_count": len(failed),
            "uploaded": uploaded,
            "failed": failed
        }

    @staticmethod
    def bulk_download_by_urls(urls: List[str]) -> Tuple[Path, Dict[str, Any]]:
        temp_dir = settings.TEMP_DIR / f"cld_download_{os.urandom(4).hex()}"
        temp_dir.mkdir(parents=True, exist_ok=True)

        downloaded_count = 0
        for idx, url in enumerate(urls):
            try:
                r = requests.get(url, stream=True, timeout=30)
                if r.status_code == 200:
                    filename = os.path.basename(url.split('?')[0]) or f"image_{idx+1}.jpg"
                    out_path = temp_dir / filename
                    with open(out_path, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                    downloaded_count += 1
            except Exception as e:
                logger.error(f"Failed to download Cloudinary URL {url}: {e}")

        zip_filename = f"cloudinary_download_{os.urandom(4).hex()}.zip"
        zip_path = settings.OUTPUT_DIR / zip_filename

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for f in temp_dir.glob('*'):
                zipf.write(f, arcname=f.name)

        return zip_path, {
            "requested_urls": len(urls),
            "downloaded_count": downloaded_count,
            "zip_filename": zip_filename
        }
