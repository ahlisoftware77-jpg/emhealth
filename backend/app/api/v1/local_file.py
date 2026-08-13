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

@router.get("/list-directory")
async def list_directory(path: str = "", user: Dict[str, Any] = Depends(get_current_user)):
    """
    Mengembalikan daftar isi dari folder. Jika path kosong, kembalikan daftar drive.
    """
    import string
    
    if not path:
        # Jika root (Windows), kembalikan daftar drive
        if os.name == 'nt':
            drives = []
            for d in string.ascii_uppercase:
                drive = f"{d}:\\"
                if os.path.exists(drive):
                    drives.append({
                        "name": drive,
                        "path": drive,
                        "type": "drive"
                    })
            return {"path": "", "contents": drives}
        else:
            path = "/"
            
    dir_path = Path(path)
    if not dir_path.exists() or not dir_path.is_dir():
        raise HTTPException(status_code=404, detail=f"Direktori tidak ditemukan: {path}")
        
    contents = []
    try:
        # Parent directory
        parent = dir_path.parent
        if parent != dir_path:
            contents.append({
                "name": "..",
                "path": str(parent),
                "type": "parent"
            })
            
        for item in dir_path.iterdir():
            # Skip hidden files
            if item.name.startswith('.'):
                continue
            
            # We only show directories here for folder selection, 
            # or files if needed, but for Folder Browser we only need dirs.
            # Let's show both but differentiate.
            try:
                is_dir = item.is_dir()
                contents.append({
                    "name": item.name,
                    "path": str(item),
                    "type": "dir" if is_dir else "file"
                })
            except PermissionError:
                pass
                
        # Sort: parent first, then dirs, then files
        def sort_key(x):
            if x["type"] == "parent": return (0, x["name"])
            if x["type"] == "dir": return (1, x["name"].lower())
            return (2, x["name"].lower())
            
        contents.sort(key=sort_key)
        return {"path": str(dir_path), "contents": contents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membaca direktori: {str(e)}")

@router.get("/images-in-directory")
async def images_in_directory(path: str, user: Dict[str, Any] = Depends(get_current_user)):
    """
    Mengambil semua path gambar di dalam direktori.
    """
    dir_path = Path(path)
    if not dir_path.exists() or not dir_path.is_dir():
        raise HTTPException(status_code=404, detail=f"Direktori tidak ditemukan: {path}")
        
    supported_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.bmp', '.gif']
    images = []
    
    try:
        for item in dir_path.iterdir():
            if item.is_file() and item.suffix.lower() in supported_extensions:
                images.append({
                    "name": item.name,
                    "path": str(item)
                })
                
        return {"path": str(dir_path), "images": images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membaca direktori: {str(e)}")

