# Data Utility Center - Production-Ready Web Application

**Data Utility Center** adalah aplikasi web enterprise berbasis Next.js 15 App Router dan FastAPI yang dirancang khusus untuk memproses berkas Excel volume tinggi dan alur kerja pengolahan gambar massal dengan arsitektur bersih (*Clean Architecture*), type-safe, serta pemrosesan *asynchronous* dan *streaming/chunking*.

---

## 🌟 Fitur Utama Aplikasi

1. **Excel & Data Utility Suite**
   - **Compare Excel/CSV**: Komparasi dua berkas Excel berdasarkan kolom pilihan pengguna (NIK, Nama, Email, No HP, ID, custom) dengan algoritma **Exact Match** & **Similar Match (RapidFuzz)** dilengkapi ambang skor kemiripan (50%-100%) dan ekspor hasil ke Excel multi-sheet / CSV.
   - **Remove Duplicate**: Pembersihan baris duplikat berdasarkan satu atau beberapa kolom acuan dengan pilihan aturan simpan (*Keep First*, *Keep Last*, *Keep Unique*).
   - **Merge Excel**: Penggabungan banyak file/sheet Excel sekaligus dengan opsi penambahan kolom tag asal file.
   - **Split Excel**: Pemecahan file Excel besar berdasarkan batas jumlah baris maksimal atau nilai unik pada kolom tertentu.

2. **Mass Image Renaming Engine**
   - Pengubahan nama gambar massal berdasarkan data metadata Excel.
   - Template dinamis dengan sintaks placeholder: `{Nama}`, `{NIK}`, `{NoHP}`, `{Tanggal}`, `{RunningNumber}`.
   - Opsi awalan (prefix), akhiran (suffix), pencarian & penggantian Regex, serta ubah kapitalisasi (*UPPERCASE*, *lowercase*, *Title Case*).
   - **Interactive Live Preview**: Tabel peninjauan nama asli vs nama usulan sebelum dieksekusi.

3. **Mass Image Compression & Converter**
   - Kompresi massal format JPG, PNG, WEBP, BMP, dan HEIC.
   - Slider presisi kualitas (1%-100%), resize dimensi max width/height, konversi format target, dan penghapusan EXIF metadata secara otomatis.

4. **Image Utilities (OCR, QR Code & Barcode)**
   - **OCR Engine**: Ekstraksi teks dari dokumen/gambar ke berkas TXT, CSV, atau Excel menggunakan Tesseract OCR.
   - **QR Code Generator**: Pembuatan QR Code massal dengan kustomisasi warna dan skala.
   - **Barcode Generator**: Pembuatan Barcode massal (Code 128, Code 39, EAN-13).

5. **Cloudinary & Storage Management**
   - **Cloudinary Bulk Tools**: Upload massal gambar dengan tag dan folder kustom, serta download aset berformat ZIP.
   - **Local Storage File Explorer**: Penjelajah direktori `upload/`, `output/`, `temp/`, dan `cache/` di backend server.
   - **Storage Engine Selector**: Pengalihan opsi penyimpanan utama (Cloudinary vs Local Storage) melalui halaman Settings.

6. **Realtime Job Queue Monitor & RBAC**
   - Pemantauan tugas *asynchronous* secara realtime menggunakan **Server-Sent Events (SSE)**.
   - Status tugas lengkap: `Waiting`, `Running`, `Completed`, `Failed`, dan `Retry`.
   - Role-Based Access Control (**Super Admin**, **Admin**, **User**) terintegrasi dengan Firebase Auth & Firestore DB.

---

## 🛠️ Teknologi & Stack

### Frontend
- **Framework**: Next.js 15 (App Router, React 19)
- **Bahasa**: TypeScript (Type-Safe)
- **Styling**: Tailwind CSS & Vercel Dashboard Theme (Dark/Light mode)
- **UI Components**: Lucide Icons, Shadcn UI / Custom Components, React Dropzone
- **State & Caching**: Zustand, TanStack Query (React Query v5), TanStack Table v8
- **Auth & DB**: Firebase Authentication & Firestore Database (HANYA Auth & Firestore, tanpa Storage/Hosting/Functions/Realtime DB)

### Backend
- **Framework**: Python 3.11+ FastAPI (Clean Architecture)
- **Data & Matching**: Pandas, Openpyxl, XlsxWriter, RapidFuzz
- **Image Processing**: Pillow, OpenCV, Pillow-HEIF
- **OCR & Code Gen**: PyTesseract OCR, QRCode, Python-Barcode
- **Storage & Cloud**: Cloudinary Python SDK, Local Storage Engine Manager

---

## 📁 Struktur Repositori

```
emhealth/
├── frontend/                  # Next.js 15 Frontend Web Application
│   ├── src/
│   │   ├── app/               # App Router pages (/dashboard, /excel-tools, /image-rename, dst.)
│   │   ├── components/        # UI & Layout components (Sidebar, Navbar, FileUploader)
│   │   ├── lib/               # Firebase SDK client & API Axios instance
│   │   └── store/             # Zustand state management
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/                   # Python FastAPI REST API Backend
│   ├── app/
│   │   ├── api/v1/            # API Routers (excel, image, cloudinary, storage, job_queue, settings, stats)
│   │   ├── core/              # Config, Security (Firebase verification), Storage Engine Manager
│   │   ├── models/            # Pydantic Schemas & DTOs
│   │   └── services/          # Business logic services (excel, image, rename, ocr, code_gen, job_queue)
│   ├── main.py                # FastAPI Application Entrypoint
│   └── requirements.txt
└── README.md
```

---

## 🚀 Panduan Penyiapan & Jalankan Lokal

### 1. Penyiapan Backend (Python FastAPI)

```bash
# Pindah ke direktori backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependensi Python
pip install -r requirements.txt

# Jalankan server backend FastAPI
python main.py
```
Backend akan berjalan di `http://localhost:8003`. Dokumentasi OpenAPI Swagger dapat diakses di `http://localhost:8003/docs`.

> **Catatan Tesseract OCR**: Pastikan binary `tesseract` terinstall pada sistem operasi Anda.
> - Windows: Download installer dari UB-Mannheim Tesseract dan set jalurnya di Halaman Settings (default: `C:\Program Files\Tesseract-OCR\tesseract.exe`).
> - Linux: `sudo apt-get install tesseract-ocr tesseract-ocr-ind`

---

### 2. Penyiapan Frontend (Next.js 15)

```bash
# Pindah ke direktori frontend
cd frontend

# Install dependensi npm
npm install

# Jalankan dev server Next.js
npm run dev
```
Frontend akan berjalan di `http://localhost:3000`.

---

## 🔑 Pengaturan Variabel Lingkungan (.env)

Buat file `.env.local` pada folder `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8003/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyYourFirebaseApiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=data-utility-center.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=data-utility-center
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=data-utility-center.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

Buat file `.env` pada folder `backend/`:

```env
PRIMARY_STORAGE_ENGINE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

---

## 🌐 Panduan Deployment

1. **Frontend (Vercel)**:
   - Hubungkan repositori GitHub ke Vercel.
   - Set Root Directory ke `frontend`.
   - Masukkan Environment Variables `NEXT_PUBLIC_API_URL` mengarah ke domain REST API backend Anda.

2. **Backend (VPS / Railway / Render / Docker)**:
   - Deploy folder `backend` ke layanan hosting yang mendukung Python (seperti VPS Ubuntu, Railway, Render).
   - Pastikan variabel lingkungan Cloudinary & Tesseract telah diatur.
