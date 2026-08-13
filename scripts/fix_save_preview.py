import re

with open("backend/app/api/v1/excel.py", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """@router.post("/save-preview")
async def save_preview_changes(req: SavePreviewRequest, user: Dict[str, Any] = Depends(get_current_user)):
    path = settings.UPLOAD_DIR / req.filename
    
    if req.url:
        try:
            import urllib.request
            path.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(req.url, str(path))
        except Exception as e:
            logger.error(f"Failed to download remote file for saving preview: {e}")

    if not path.exists():
        path = settings.OUTPUT_DIR / req.filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File Excel tidak ditemukan di direktori penyimpanan.")
    
    try:
        res = await run_in_threadpool(ExcelService.save_preview_data, path, req.rows_data)
        return {"status": "success", "data": res, "message": f"Berhasil menyimpan {res.get('saved_rows')} baris data ke {req.filename}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal menyimpan file Excel: {str(e)}")"""

new_func = """@router.post("/save-preview")
async def save_preview_changes(req: SavePreviewRequest, user: Dict[str, Any] = Depends(get_current_user)):
    # Selalu simpan ke OUTPUT_DIR agar selalu menjadi file terbaru yang di-download
    out_path = settings.OUTPUT_DIR / req.filename
    
    if req.url:
        try:
            import urllib.request
            out_path.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(req.url, str(out_path))
        except Exception as e:
            logger.error(f"Failed to download remote file for saving preview: {e}")

    if not out_path.exists():
        upload_path = settings.UPLOAD_DIR / req.filename
        if upload_path.exists():
            import shutil
            out_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(upload_path, out_path)
            
    if not out_path.exists():
        raise HTTPException(status_code=404, detail="File Excel tidak ditemukan di direktori penyimpanan.")
    
    try:
        res = await run_in_threadpool(ExcelService.save_preview_data, out_path, req.rows_data)
        return {"status": "success", "data": res, "message": f"Berhasil menyimpan {res.get('saved_rows')} baris data ke {req.filename}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal menyimpan file Excel: {str(e)}")"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open("backend/app/api/v1/excel.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced successfully.")
else:
    print("Could not find the function exactly. Regex might be needed.")
