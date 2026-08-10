from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Dict, Any
from app.core.config import settings
from app.core.storage import storage_manager
from app.core.security import get_current_user

import os, subprocess, platform
from pathlib import Path

router = APIRouter(prefix="/storage", tags=["Storage Explorer"])

@router.get("/stats")
async def get_storage_statistics(user: Dict[str, Any] = Depends(get_current_user)):
    return {"status": "success", "stats": storage_manager.get_storage_stats()}

@router.get("/files/{folder_name}")
async def list_folder_files(folder_name: str, user: Dict[str, Any] = Depends(get_current_user)):
    files = storage_manager.list_local_files(folder_name)
    return {"status": "success", "folder": folder_name, "files": files}

@router.delete("/clear/{folder_name}")
async def clear_folder_contents(folder_name: str, user: Dict[str, Any] = Depends(get_current_user)):
    count = storage_manager.clear_folder(folder_name)
    return {"status": "success", "message": f"Berhasil menghapus {count} berkas dari folder {folder_name}."}

@router.post("/open-folder")
async def open_local_folder(folder_name: str = "output", user: Dict[str, Any] = Depends(get_current_user)):
    folder_map = {
        "output": settings.OUTPUT_DIR,
        "upload": settings.UPLOAD_DIR,
        "temp": settings.TEMP_DIR,
        "cache": settings.CACHE_DIR,
        "compress_output": Path(r"D:\COMPRESS\output"),
        "compress_input": Path(r"D:\COMPRESS\foto asli"),
    }
    target_dir = folder_map.get(folder_name, settings.OUTPUT_DIR)
    target_dir.mkdir(parents=True, exist_ok=True)

    try:
        if platform.system() == "Windows":
            os.startfile(str(target_dir))
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", str(target_dir)])
        else:
            subprocess.Popen(["xdg-open", str(target_dir)])
        return {
            "status": "success",
            "message": f"Folder '{folder_name}' ({target_dir}) berhasil dibuka di File Explorer!",
            "path": str(target_dir)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuka folder di File Explorer: {str(e)}")

@router.get("/download/{filename}")
async def download_file(filename: str):
    # Search in output, temp, upload
    search_dirs = [settings.OUTPUT_DIR, settings.TEMP_DIR, settings.UPLOAD_DIR]
    target_file = None
    for d in search_dirs:
        possible = d / filename
        if possible.exists() and possible.is_file():
            target_file = possible
            break

    if not target_file:
        raise HTTPException(status_code=404, detail="Berkas tidak ditemukan untuk diunduh.")

    return FileResponse(
        path=target_file,
        filename=filename,
        media_type="application/octet-stream"
    )
