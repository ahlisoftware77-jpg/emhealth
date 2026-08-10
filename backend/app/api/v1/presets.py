import time
import uuid
from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.models.schemas import PresetSchema
from app.core.security import get_current_user

router = APIRouter(prefix="/presets", tags=["Presets"])

# Default initial presets
PRESETS_DB: Dict[str, Dict[str, Any]] = {
    "preset-1": {
        "id": "preset-1",
        "name": "Format Rename KTP Standar",
        "category": "rename",
        "configuration": {
            "template": "{Nama}_{NIK}_{Tanggal}",
            "match_excel_column": "NIK",
            "case_transform": "uppercase"
        },
        "created_at": time.time()
    },
    "preset-2": {
        "id": "preset-2",
        "name": "Kompresi Gambar Web Standard (80%)",
        "category": "compress",
        "configuration": {
            "quality": 80,
            "target_format": "WEBP",
            "remove_metadata": True
        },
        "created_at": time.time()
    }
}

@router.get("")
async def list_presets(user: Dict[str, Any] = Depends(get_current_user)):
    from app.core.firestore import firestore_service
    if firestore_service.is_available:
        db_presets = firestore_service.list_presets()
        if db_presets:
            return {"status": "success", "presets": db_presets}
    return {"status": "success", "presets": list(PRESETS_DB.values())}

@router.post("")
async def create_preset(preset: PresetSchema, user: Dict[str, Any] = Depends(get_current_user)):
    preset_id = f"preset-{uuid.uuid4().hex[:8]}"
    item = {
        "id": preset_id,
        "name": preset.name,
        "category": preset.category,
        "configuration": preset.configuration,
        "created_at": time.time()
    }
    PRESETS_DB[preset_id] = item

    from app.core.firestore import firestore_service
    firestore_service.save_preset(item)

    return {"status": "success", "preset": item}

@router.delete("/{preset_id}")
async def delete_preset(preset_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    if preset_id in PRESETS_DB:
        del PRESETS_DB[preset_id]

    from app.core.firestore import firestore_service
    firestore_service.delete_preset(preset_id)

    return {"status": "success", "message": "Preset berhasil dihapus."}
