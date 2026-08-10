from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from typing import List, Dict, Any
from app.core.config import settings
from app.services.cloudinary_service import CloudinaryService
from app.services.job_queue_service import job_queue_service
from app.models.schemas import CloudinaryUploadRequest
from app.core.security import get_current_user

router = APIRouter(prefix="/cloudinary", tags=["Cloudinary Tools"])

def process_cld_upload_job(job_id: str, req: CloudinaryUploadRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=30.0, message="Mengunggah berkas ke Cloudinary...")
        paths = [settings.UPLOAD_DIR / f for f in req.file_names]
        result = CloudinaryService.bulk_upload(paths, req.folder_path, req.tags)
        
        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Upload Cloudinary Selesai. {result['uploaded_count']} sukses, {result['failed_count']} gagal."
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/bulk-upload")
async def bulk_upload_cloudinary(req: CloudinaryUploadRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Cloudinary Upload", "Memulai upload masal ke Cloudinary")
    bg_tasks.add_task(process_cld_upload_job, job["job_id"], req)
    return {"status": "success", "job": job}

def process_cld_download_job(job_id: str, urls: List[str]):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=30.0, message="Mendownload aset dari Cloudinary...")
        zip_path, info = CloudinaryService.bulk_download_by_urls(urls)
        
        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Download Cloudinary Selesai ({info['downloaded_count']} file).",
            result_url=f"/api/v1/storage/download/{zip_path.name}",
            download_filename=zip_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/bulk-download")
async def bulk_download_cloudinary(urls: List[str], bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Cloudinary Download", "Memulai unduhan masal Cloudinary")
    bg_tasks.add_task(process_cld_download_job, job["job_id"], urls)
    return {"status": "success", "job": job}
