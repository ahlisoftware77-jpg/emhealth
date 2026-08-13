import logging
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
from app.core.config import settings
from app.core.storage import storage_manager
from app.services.excel_service import ExcelService
from app.services.job_queue_service import job_queue_service
from app.models.schemas import CompareRequest, RemoveDuplicateRequest, MergeRequest, SplitRequest
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/excel", tags=["Excel Tools"])

@router.post("/upload")
async def upload_excel_files(files: List[UploadFile] = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    uploaded_info = []
    for f in files:
        content = await f.read()
        saved_path = storage_manager.save_local_file(content, f.filename, settings.UPLOAD_DIR)
        
        # Try uploading to cloudinary if configured
        cloudinary_url = None
        if settings.PRIMARY_STORAGE_ENGINE == "cloudinary":
            try:
                cloudinary_url = storage_manager.upload_to_cloudinary_unsigned(str(saved_path))
            except Exception as e:
                logger.warning(f"Failed to upload {f.filename} to Cloudinary: {e}")
                
        uploaded_info.append({
            "filename": f.filename,
            "path": str(saved_path),
            "size": len(content),
            "cloudinary_url": cloudinary_url
        })
    return {"status": "success", "files": uploaded_info}

from starlette.concurrency import run_in_threadpool

@router.post("/inspect")
async def inspect_excel(filename: str, user: Dict[str, Any] = Depends(get_current_user)):
    path = settings.UPLOAD_DIR / filename
    if not path.exists():
        path = settings.OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    
    try:
        data = await run_in_threadpool(ExcelService.get_columns_and_preview, path)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

import requests
import uuid

@router.post("/preview-url")
async def preview_from_url(url: str, user: Dict[str, Any] = Depends(get_current_user)):
    try:
        # Download file to a temporary name
        temp_filename = f"temp_preview_{uuid.uuid4().hex[:8]}.xlsx"
        path = settings.UPLOAD_DIR / temp_filename
        
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        data = await run_in_threadpool(ExcelService.get_columns_and_preview, path)
        
        # Cleanup temp file
        if path.exists():
            path.unlink()
            
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Failed to preview from URL {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Gagal memuat file dari URL: {str(e)}")

class SavePreviewRequest(BaseModel):
    filename: str
    rows_data: List[Dict[str, Any]]
    url: str = None

@router.post("/save-preview")
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
        raise HTTPException(status_code=400, detail=f"Gagal menyimpan file Excel: {str(e)}")

@router.post("/inspect-file")
async def inspect_uploaded_file(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    try:
        content = await file.read()
        
        # Simpan file ke UPLOAD_DIR agar bisa ditemukan saat save-preview
        path = settings.UPLOAD_DIR / file.filename
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            f.write(content)

        # Baca preview dari memory

        data = await run_in_threadpool(
            ExcelService.get_columns_and_preview_from_bytes,
            content,
            file.filename
        )
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file Excel: {str(e)}")

def process_compare_job(job_id: str, req: CompareRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=20.0, message="Membaca file Excel...")
        f1_path = settings.UPLOAD_DIR / req.file1_name
        f2_path = settings.UPLOAD_DIR / req.file2_name

        job_queue_service.update_job(job_id, progress=50.0, message="Melakukan perbandingan fuzzy/exact data...")
        out_path, summary = ExcelService.compare_files(
            f1_path, f2_path, req.key_columns_file1, req.key_columns_file2,
            req.match_mode, req.similarity_threshold, req.export_format
        )

        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message="Perbandingan Excel selesai",
            result_url=f"/api/v1/storage/download/{out_path.name}",
            download_filename=out_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e), message="Gagal memproses perbandingan")

@router.post("/compare")
async def compare_excel(req: CompareRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Excel Compare", "Memulai komparasi Excel")
    bg_tasks.add_task(process_compare_job, job["job_id"], req)
    return {"status": "success", "job": job}

def process_dedup_job(job_id: str, req: RemoveDuplicateRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=30.0, message="Menghapus duplikasi baris...")
        f_path = settings.UPLOAD_DIR / req.file_name
        out_path, summary = ExcelService.remove_duplicates(
            f_path, 
            req.target_columns, 
            req.keep_strategy, 
            req.sort_column, 
            req.sort_order, 
            req.export_format
        )
        job_queue_service.update_job(job_id, status="Running", progress=90.0, message="Mengunggah hasil...")
        
        cloudinary_url = None
        if settings.PRIMARY_STORAGE_ENGINE == "cloudinary":
            cloudinary_url = storage_manager.upload_to_cloudinary_unsigned(out_path)
            
        final_url = cloudinary_url if cloudinary_url else f"/api/v1/storage/download/{out_path.name}"
        
        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Selesai! {summary['removed_duplicates']} baris duplikat dihapus." + (" (Tersimpan di Cloud)" if cloudinary_url else " (Tersimpan Lokal)"),
            result_url=final_url,
            download_filename=out_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/deduplicate")
async def deduplicate_excel(req: RemoveDuplicateRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Remove Duplicate", "Menjadwalkan pembersihan duplikat")
    bg_tasks.add_task(process_dedup_job, job["job_id"], req)
    return {"status": "success", "job": job}

def process_merge_job(job_id: str, req: MergeRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=30.0, message="Penggabungan file Excel...")
        paths = [settings.UPLOAD_DIR / name for name in req.file_names]
        out_path, summary = ExcelService.merge_files(paths, req.add_source_column, req.export_format)
        
        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Berhasil menggabungkan {summary['total_input_files']} file.",
            result_url=f"/api/v1/storage/download/{out_path.name}",
            download_filename=out_path.name
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/merge")
async def merge_excel(req: MergeRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Merge Excel", "Menyiapkan merge file Excel")
    bg_tasks.add_task(process_merge_job, job["job_id"], req)
    return {"status": "success", "job": job}

def process_split_job(job_id: str, req: SplitRequest):
    try:
        job_queue_service.update_job(job_id, status="Running", progress=30.0, message="Pemisahan data Excel...")
        f_path = settings.UPLOAD_DIR / req.file_name
        gen_files, summary = ExcelService.split_file(f_path, req.split_mode, req.max_rows_per_file, req.split_column, req.export_format)
        
        # If single file output, offer direct download, else zip folder
        first_file = gen_files[0].name if gen_files else ""
        job_queue_service.update_job(
            job_id,
            status="Completed",
            progress=100.0,
            message=f"Berhasil memecah menjadi {summary['generated_files_count']} file.",
            result_url=f"/api/v1/storage/download/{first_file}",
            download_filename=first_file
        )
    except Exception as e:
        job_queue_service.update_job(job_id, status="Failed", error_detail=str(e))

@router.post("/split")
async def split_excel(req: SplitRequest, bg_tasks: BackgroundTasks, user: Dict[str, Any] = Depends(get_current_user)):
    job = job_queue_service.create_job("Split Excel", "Menyiapkan pemisahan Excel")
    bg_tasks.add_task(process_split_job, job["job_id"], req)
    return {"status": "success", "job": job}

# AI COMPARISON & SMART INCOMPLETE NAME RECONCILIATION ENDPOINT
class AICompareAnalyzeRequest(BaseModel):
    file1_name: str = ""
    file2_name: str = ""
    file1_data: List[Dict[str, Any]] = []
    file2_data: List[Dict[str, Any]] = []
    key_cols1: str = "Nama"
    key_cols2: str = "Nama"

def smart_reconcile_names_fallback(rows1: List[Dict[str, Any]], rows2: List[Dict[str, Any]], key1_str: str, key2_str: str):
    """Smart reconciliation algorithm to find identical/similar names even if incomplete, abbreviated, or typed differently."""
    from rapidfuzz import fuzz
    matches = []
    
    key1 = key1_str.split(",")[0].strip() if key1_str else "Nama"
    key2 = key2_str.split(",")[0].strip() if key2_str else "Nama"

    list1 = [str(r.get(key1, "") or r.get("Nama", "") or r.get("NIK", "")).strip() for r in rows1 if r]
    list2 = [str(r.get(key2, "") or r.get("Nama", "") or r.get("NIK", "")).strip() for r in rows2 if r]

    seen = set()

    for n1 in list1:
        if not n1 or len(n1) < 2:
            continue
        n1_clean = n1.replace(".", " ").replace(",", " ")
        n1_tokens = set(n1_clean.lower().split())
        
        for n2 in list2:
            if not n2 or len(n2) < 2 or n1.lower() == n2.lower():
                continue
            
            pair_key = tuple(sorted([n1.lower(), n2.lower()]))
            if pair_key in seen:
                continue

            n2_clean = n2.replace(".", " ").replace(",", " ")
            n2_tokens = set(n2_clean.lower().split())
            
            common_tokens = n1_tokens.intersection(n2_tokens)
            fuzzy_score = int(fuzz.token_sort_ratio(n1_clean.lower(), n2_clean.lower()))
            
            is_partial = False
            reason = ""

            # Check matching initial or abbreviated token (e.g. M. Rizky vs Muhammad Rizky)
            has_abbreviation = any(len(t1) == 1 and any(t2.startswith(t1) for t2 in n2_tokens) for t1 in n1_tokens) or \
                               any(len(t2) == 1 and any(t1.startswith(t2) for t1 in n1_tokens) for t2 in n2_tokens)

            if has_abbreviation and len(common_tokens) >= 1:
                is_partial = True
                reason = "Identik: Deteksi Singkatan Nama Depan/Tengah (misal M. / Muhammad / Budi S.)"
            elif fuzzy_score >= 70 and fuzzy_score < 100:
                is_partial = True
                reason = f"Kemiripan Fonetik & Susunan Kata Tinggi (RapidFuzz Score: {fuzzy_score}%)"
            elif len(common_tokens) >= 1 and (len(n1_tokens) != len(n2_tokens)):
                is_partial = True
                reason = f"Kata Kunci Utama Cocok: '{' '.join(common_tokens)}' (Nama Parsial / Gelar Tidak Lengkap)"

            if is_partial:
                seen.add(pair_key)
                matches.append({
                    "name_file1": n1,
                    "name_file2": n2,
                    "similarity_score": max(fuzzy_score, 85 if has_abbreviation else 75),
                    "status": "Identik (Nama Parsial)",
                    "reason": reason
                })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches[:20]

def detect_field_discrepancies(rows1: List[Dict[str, Any]], rows2: List[Dict[str, Any]]):
    """
    Detects cases where a KEY identifier (like Email, NIK, UserID) is EXACTLY MATCHED,
    but another attribute (like Nama) has an INCONSISTENCY/DIFFERENCE.
    """
    discrepancies = []
    if not rows1 or not rows2:
        return discrepancies
    
    cols1 = list(rows1[0].keys())
    cols2 = list(rows2[0].keys())

    key_candidates = ["Email", "email", "NIK", "nik", "UserID", "userid", "UseriD", "NoHP", "Phone", "ID"]
    match_key1 = next((c for c in cols1 if c.strip() in key_candidates or "email" in c.lower() or "nik" in c.lower()), cols1[0] if cols1 else "")
    match_key2 = next((c for c in cols2 if c.strip() in key_candidates or "email" in c.lower() or "nik" in c.lower()), cols2[0] if cols2 else "")

    name_col1 = next((c for c in cols1 if "nama" in c.lower() or "name" in c.lower()), None)
    name_col2 = next((c for c in cols2 if "nama" in c.lower() or "name" in c.lower()), None)

    map_rows2 = {}
    for r2 in rows2:
        kv = str(r2.get(match_key2, "")).strip().lower()
        if kv:
            map_rows2[kv] = r2

    for r1 in rows1:
        kv1 = str(r1.get(match_key1, "")).strip().lower()
        if not kv1 or kv1 not in map_rows2:
            continue
        
        r2 = map_rows2[kv1]
        n1 = str(r1.get(name_col1, "") if name_col1 else "").strip()
        n2 = str(r2.get(name_col2, "") if name_col2 else "").strip()

        if n1 and n2 and n1.lower() != n2.lower():
            discrepancies.append({
                "match_field": match_key1,
                "match_value": str(r1.get(match_key1, "")).strip(),
                "file1_name": n1,
                "file2_name": n2,
                "discrepancy_type": "⚠️ Inkonsistensi Penulisan Nama (Email/NIK Sama)",
                "detail": f"Kolom {match_key1} persis sama ('{r1.get(match_key1)}'), namun Nama di File 1 adalah '{n1}' sedangkan di File 2 adalah '{n2}'."
            })

    return discrepancies[:25]

@router.post("/ai-analyze-comparison")
async def ai_analyze_comparison(req: AICompareAnalyzeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    f1_rows = req.file1_data[:200]
    f2_rows = req.file2_data[:200]

    key1 = req.key_cols1.split(",")[0].strip() if req.key_cols1 else "Nama"
    key2 = req.key_cols2.split(",")[0].strip() if req.key_cols2 else "Nama"

    reconciled_matches = smart_reconcile_names_fallback(f1_rows, f2_rows, key1, key2)
    name_discrepancies = detect_field_discrepancies(f1_rows, f2_rows)

    sample_f1 = [str(r.get(key1, "") or r.get("Nama", "")) for r in f1_rows[:25] if r]
    sample_f2 = [str(r.get(key2, "") or r.get("Nama", "")) for r in f2_rows[:25] if r]

    ai_reply = ""
    provider_used = "EMHealth Smart Engine (Local AI Matcher)"

    # Call LLM if API Key exists
    api_key = settings.GEMINI_API_KEY or settings.OPENAI_API_KEY or settings.DEEPSEEK_API_KEY
    if api_key:
        try:
            from app.api.v1.ai import ai_chat, AIProcessRequest
            provider = "gemini" if settings.GEMINI_API_KEY else ("openai" if settings.OPENAI_API_KEY else "deepseek")
            
            prompt_text = f"""
            Analisis Rekonsiliasi Identitas & Komparasi Berkas Excel:
            - Berkas 1 (Master): {req.file1_name} ({len(req.file1_data)} baris).
            - Berkas 2 (Pembanding): {req.file2_name} ({len(req.file2_data)} baris).
            - Pasangan Nama Parsial/Tersingkat Terdeteksi: {json.dumps(reconciled_matches[:8], ensure_ascii=False)}
            - TEMUAN KHUSUS (Email/NIK Sama tapi Nama Berbeda): {json.dumps(name_discrepancies[:8], ensure_ascii=False)}

            Buatkan Laporan Eksekutif Analisis AI (Format Markdown) dalam Bahasa Indonesia yang berisi:
            1. **Ringkasan Tingkat Kecocokan Data**: Evaluasi kualitas data.
            2. **Temuan Khusus Inkonsistensi Identitas (Email Sama, Nama Berbeda)**: Jelaskan secara rinci akun-akun yang memiliki Email/NIK sama namun nama ditulis berbeda (misal: singkatan, nama depan saja, atau beda ejaan).
            3. **Rekomendasi Pembersihan & Standarisasi Data**: 3 langkah konkrit untuk tim medis/HRD.
            """
            
            ai_res = await ai_chat(AIProcessRequest(prompt=prompt_text, provider=provider))
            ai_reply = ai_res.get("response", "")
            provider_used = f"AI Intelligence ({provider.upper()})"
        except Exception as e:
            ai_reply = ""

    if not ai_reply:
        ai_reply = f"""
### 📊 Laporan AI Analytics & Rekonsiliasi Identitas Data
- **File 1 (Master):** `{req.file1_name or 'File 1'}` ({len(req.file1_data)} Baris)
- **File 2 (Pembanding):** `{req.file2_name or 'File 2'}` ({len(req.file2_data)} Baris)
- **Inkonsistensi Nama (Email Sama, Nama Berbeda):** `{len(name_discrepancies)}` Akun Terdeteksi
- **Nama Identik Tersingkat Terdeteksi:** `{len(reconciled_matches)}` Pasangan Identitas

#### 💡 Temuan Analisis AI & Rekomendasi:
1. **Peringatan Inkonsistensi Identitas:** Ditemukan `{len(name_discrepancies)}` akun dengan Email/NIK persis sama tetapi penulisan Nama tidak identik (tersingkat/berbeda gelar).
2. **Pembersihan Data:** Gunakan tabel rincian **Inkonsistensi Identitas (Email Sama, Nama Berbeda)** di bawah ini untuk melakukan verifikasi dan penyesuaian sebelum penggabungan akhir.
3. **Standarisasi:** Disarankan menjadikan nama pada File 1 sebagai standar master utama.
        """

    return {
        "status": "success",
        "provider": provider_used,
        "total_file1": len(req.file1_data),
        "total_file2": len(req.file2_data),
        "reconciled_matches": reconciled_matches,
        "name_discrepancies": name_discrepancies,
        "executive_report": ai_reply
    }
