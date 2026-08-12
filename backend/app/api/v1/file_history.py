import time
import uuid
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.models.schemas import FileHistorySchema
from app.core.security import get_current_user
from app.core.firestore import firestore_service

router = APIRouter(prefix="/file-history", tags=["FileHistory"])

FILE_HISTORY_DB: Dict[str, Dict[str, Any]] = {}

@router.get("")
async def list_file_history(user: Dict[str, Any] = Depends(get_current_user)):
    if firestore_service.is_available:
        db_history = firestore_service.list_file_history()
        return {"status": "success", "history": db_history}
    return {"status": "success", "history": list(FILE_HISTORY_DB.values())}

@router.post("")
async def save_file_history(history: FileHistorySchema, user: Dict[str, Any] = Depends(get_current_user)):
    hist_id = history.id or f"hist-{uuid.uuid4().hex[:12]}"
    item = {
        "id": hist_id,
        "file_name": history.file_name,
        "file_url": history.file_url,
        "columns": history.columns,
        "total_rows": history.total_rows,
        "created_at": time.time()
    }
    
    FILE_HISTORY_DB[hist_id] = item
    
    if firestore_service.is_available:
        firestore_service.save_file_history(item)
        
    return {"status": "success", "history": item}

@router.delete("/{history_id}")
async def delete_file_history(history_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    if history_id in FILE_HISTORY_DB:
        del FILE_HISTORY_DB[history_id]
        
    if firestore_service.is_available:
        firestore_service.delete_file_history(history_id)
        
    return {"status": "success", "message": "Riwayat berhasil dihapus"}
