from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Engine"])

class AIProcessRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None  # 'openai', 'gemini', 'deepseek', or use primary
    model: Optional[str] = None

@router.get("/status")
async def get_ai_status(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "status": "success",
        "primary_provider": settings.PRIMARY_AI_PROVIDER,
        "providers": {
            "openai": {"configured": bool(settings.OPENAI_API_KEY)},
            "gemini": {"configured": bool(settings.GEMINI_API_KEY)},
            "deepseek": {"configured": bool(settings.DEEPSEEK_API_KEY)},
        }
    }

EMHEALTH_SYSTEM_PROMPT = """
Anda adalah EMHealth Smart System AI Assistant, asisten AI pintar yang terintegrasi langsung di dalam aplikasi website "EMHealth Data Utility Center & MCU System". Anda memiliki pengetahuan dan pemahaman mendalam terkait seluruh fitur, modul, dan alur kerja aplikasi ini:

1. UTAMA & TUJUAN SISTEM WEB:
- Nama Platform: EMHealth Data Utility Center & Medical Check Up (MCU) Management System.
- Framework: Next.js (Frontend) dan FastAPI (Backend Python).
- Pengguna: Klinik Utama EMHealth / PT. YADIKOMPUTER / Admin Medis.

2. FITUR & MODUL LENGKAP PADA WEBSITE:
- ✉️ MCU Email Blast & Image Optimizer (/mcu-email-blast):
  * Pengolahan Foto: Kompresi foto di bawah 500 KB, konversi otomatis ke posisi Portrait (width <= height), penanganan EXIF orientation & format HEIC/HEIF dari HP.
  * Auto-Rename & Excel Matching: Mencocokkan foto pasien dengan Excel (idpass-update2.xlsx) berdasarkan Nama (Kolom A), UserID/NIK (Kolom B), dan Email (Kolom D). Output file foto di-rename menjadi <NIK>.jpg.
  * Multi-Sender SMTP: Mendukung pengirim Gmail (emhealth.medicalcenter2@gmail.com) dan Custom Domain (info@klinikutamaemhealth.com, port 465 SSL).
  * Fitur Anti-Spam: Header RFC 2822 (Message-ID, Date, Reply-To), dual-mode HTML + Plain-text fallback, jeda antar email 5 detik, serta mode Simulasi (Dry Run).
  * Portal Login Peserta: Tautan https://mcu-emhealth.com/login-employee dengan Username Login berupa NIK.
- 📊 Excel & Data Utility Suite (/excel-tools):
  * Web Data Viewer: Menampilkan pratinjau tabel data Excel (headers & baris data) secara langsung di web.
  * Compare Excel: Komparasi data antar 2 berkas Excel menggunakan Exact Match (100%) dan RapidFuzz Fuzzy Similar Match (threshold 50-100%).
  * Remove Duplicate: Menghapus baris duplikat berdasarkan kolom acuan (Keep First, Keep Last, Unique).
  * Merge Files: Penggabungan banyak file Excel dengan penanda kolom asal (_SourceFile).
  * Split Files: Pemecahan file Excel berukuran besar berdasarkan jumlah baris atau nilai kolom kategori.
- 🖼️ Image Batch Rename (/image-rename): Batch renaming foto massal dengan kustom template {Nama}_{NIK}, prefix/suffix, transformasi huruf, dan regex.
- 🗜️ Image Compression (/image-compress): Kompresi massal foto dengan kontrol kualitas (1-100%), resize rasio, serta hapus EXIF.
- 🔍 Image Utilities (/image-utilities): OCR Text Extraction (Tesseract Bahasa Indonesia + Inggris) & Generator QR Code / Barcode (Code128, EAN).
- ☁️ Cloudinary Tools (/cloudinary-tools) & Storage Explorer (/storage-explorer): Upload & download massal Cloudinary CDN serta penjelajah file lokal (upload, output, temp, cache).
- ⚡ Job Queue Monitor (/job-queue): Pemantauan dan manajemen tugas latar belakang (background jobs) realtime.
- ⚙️ Settings & Config (/settings): Pengaturan storage engine (Cloudinary vs Local), Tesseract path, Firestore sync, dan API Keys AI.

3. PANDUAN RESPONS:
- Jawablah setiap pertanyaan pengguna dengan ramah, lugas, presisi, dan terstruktur dalam Bahasa Indonesia dengan format Markdown.
- Jika pengguna bertanya tentang masalah teknis (email spam, gagal match foto, kompresi, atau komparasi data), berikan panduan solutif langkah demi langkah sesuai fitur website ini.
"""

@router.post("/chat")
async def ai_chat(
    req: AIProcessRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    provider = (req.provider or settings.PRIMARY_AI_PROVIDER or "openai").lower()
    prompt = req.prompt.strip()

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt tidak boleh kosong.")

    if provider == "openai":
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise HTTPException(status_code=400, detail="OpenAI API Key belum dikonfigurasi di Pengaturan.")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": req.model or "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": EMHEALTH_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                }
            )
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=f"OpenAI Error: {res.text}")
            data = res.json()
            reply = data["choices"][0]["message"]["content"]
            return {"status": "success", "provider": "openai", "response": reply}

    elif provider == "gemini":
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise HTTPException(status_code=400, detail="Google Gemini API Key belum dikonfigurasi di Pengaturan.")

        candidate_models = [req.model] if req.model else ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
        last_error = ""

        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                res = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {"text": f"{EMHEALTH_SYSTEM_PROMPT}\n\n[Pertanyaan Pengguna]\n{prompt}"}
                                ]
                            }
                        ]
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    reply = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"status": "success", "provider": "gemini", "model": model_name, "response": reply}
                else:
                    last_error = res.text

            raise HTTPException(status_code=400, detail=f"Gemini Error: {last_error}")

    elif provider == "deepseek":
        api_key = settings.DEEPSEEK_API_KEY
        if not api_key:
            raise HTTPException(status_code=400, detail="DeepSeek API Key belum dikonfigurasi di Pengaturan.")

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": req.model or "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": EMHEALTH_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                }
            )
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=f"DeepSeek Error: {res.text}")
            data = res.json()
            reply = data["choices"][0]["message"]["content"]
            return {"status": "success", "provider": "deepseek", "response": reply}

    else:
        raise HTTPException(status_code=400, detail=f"Provider AI '{provider}' tidak didukung.")
