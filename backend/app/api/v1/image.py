from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends
from typing import List, Dict, Any
from pathlib import Path
from app.core.config import settings
from app.core.storage import storage_manager
from app.services.image_service import ImageService
from app.services.rename_service import RenameService
from app.services.ocr_service import OCRService
from app.services.code_gen_service import CodeGenService
from app.services.job_queue_service import job_queue_service
from app.models.schemas import (
    ImageRenameRequest, ImageRenamePreviewRequest, ImageCompressRequest, OCRRequest, CodeGenRequest
)
from app.core.security import get_current_user

router = APIRouter(prefix="/image", tags=["Image Tools"])

@router.post("/upload")
async def upload_image_files(files: List[UploadFile] = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    uploaded = []
    for f in files:
        content = await f.read()
        saved = storage_manager.save_local_file(content, f.filename, settings.UPLOAD_DIR)
        uploaded.append({
            "filename": f.filename,
            "path": str(saved),
            "size": len(content)
        })
    return {"status": "success", "files": uploaded}

@router.post("/rename/preview")
async def preview_image_rename(req: ImageRenamePreviewRequest, user: Dict[str, Any] = Depends(get_current_user)):
    excel_path = settings.UPLOAD_DIR / req.excel_file_name
    if not excel_path.exists():
        raise HTTPException(status_code=404, detail="File Excel metadata tidak ditemukan.")
    
    try:
        preview = RenameService.preview_rename(
            sample_image_names=req.sample_images,
            excel_path=excel_path,
            template=req.template,
            match_excel_column=req.match_excel_column,
            prefix=req.prefix,
            suffix=req.suffix,
            regex_pattern=req.regex_pattern,
            regex_replace=req.regex_replace,
            case_transform=req.case_transform
        )
        return {"status": "success", "preview": preview}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def process_rename_job(job_id: str, req: ImageRenameRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=20.0, message="Menyiapkan berkas gambar...")
        img_paths = [settings.UPLOAD_DIR / name for name in req.image_names]
        excel_path = settings.UPLOAD_DIR / req.excel_file_name

        job_queue_service.update_job(job_id, progress=60.0, message="Memproses pengubahan nama massal...")
        zip_path, summary = RenameService.batch_rename(
            image_paths=img_paths,
            excel_path=excel_path,
            template=req.template,
            match_excel_column=req.match_excel_column,
            prefix=req.prefix,
            suffix=req.suffix,
            regex_pattern=req.regex_pattern,
            regex_replace=req.regex_replace,
            case_transform=req.case_transform
        )

        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Berhasil mengubah {summary['renamed_count']} nama gambar.",
            result_url=f"/api/v1/storage/download/{zip_path.name}",
            download_filename=zip_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/rename")
async def batch_rename_images(req: ImageRenameRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Image Rename", "Menjadwalkan pengubahan nama gambar")
    bg_tasks.add_task(process_rename_job, job["job_id"], req)
    return {"status": "success", "job": job}

def process_compress_job(job_id: str, req: ImageCompressRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=20.0, message="Mengompresi berkas gambar...")
        img_paths = [settings.UPLOAD_DIR / name for name in req.image_names]
        
        zip_path, summary = ImageService.batch_compress(
            image_paths=img_paths,
            quality=req.quality,
            max_width=req.max_width,
            max_height=req.max_height,
            target_format=req.target_format,
            remove_metadata=req.remove_metadata
        )

        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Kompresi selesai! Ukuran hemat {summary['overall_reduction_percent']}%.",
            result_url=f"/api/v1/storage/download/{zip_path.name}",
            download_filename=zip_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/compress")
async def batch_compress_images(req: ImageCompressRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Image Compress", "Menjadwalkan kompresi gambar")
    bg_tasks.add_task(process_compress_job, job["job_id"], req)
    return {"status": "success", "job": job}

def process_ocr_job(job_id: str, req: OCRRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=30.0, message="Ekstraksi teks OCR dari gambar...")
        img_paths = [settings.UPLOAD_DIR / name for name in req.image_names]
        out_path, summary = OCRService.batch_ocr(img_paths, req.export_format, req.lang)

        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"OCR Berhasil diproses dari {summary['total_images']} gambar.",
            result_url=f"/api/v1/storage/download/{out_path.name}",
            download_filename=out_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/ocr")
async def process_ocr(req: OCRRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("OCR Extract", "Menjadwalkan ekstraksi OCR")
    bg_tasks.add_task(process_ocr_job, job["job_id"], req)
    return {"status": "success", "job": job}

def process_code_gen_job(job_id: str, req: CodeGenRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=40.0, message="Generasi QR / Barcode masif...")
        zip_path, summary = CodeGenService.batch_generate(
            code_type=req.code_type,
            content_list=req.content_list,
            barcode_format=req.barcode_format,
            dark_color=req.dark_color,
            light_color=req.light_color
        )

        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Berhasil merilis {summary['generated_count']} berkas {req.code_type.upper()}.",
            result_url=f"/api/v1/storage/download/{zip_path.name}",
            download_filename=zip_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/code-gen")
async def generate_codes(req: CodeGenRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job(f"{req.code_type.upper()} Generator", "Menjadwalkan pembuatan kode")
    bg_tasks.add_task(process_code_gen_job, job["job_id"], req)
    return {"status": "success", "job": job}
