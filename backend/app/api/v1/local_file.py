from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Dict, Any
import os
import mimetypes
from pathlib import Path

from app.core.security import get_current_user

router = APIRouter(prefix="/local-file", tags=["Local File"])

@router.get("/preview")
async def preview_local_file(path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """
    Membaca file lokal dari hard disk dan mengembalikannya sebagai byte stream
    untuk digunakan di tag <img> pada browser.
    """
    # Gunakan absolute path
    file_path = Path(path)
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"File tidak ditemukan di lokal: {path}")
    
    # Deteksi mimetype agar browser bisa menampilkan dengan benar
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type or not mime_type.startswith('image/'):
        # Tetap izinkan jika tidak ada mimetype, default ke octet-stream
        mime_type = "application/octet-stream"
        
    return FileResponse(file_path, media_type=mime_type)
