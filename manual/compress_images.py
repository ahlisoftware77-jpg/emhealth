import os
import sys
import re
from PIL import Image, ImageOps

# Quick check if Pillow is installed
try:
    from PIL import Image, ImageOps
except ImportError:
    print("Error: Library 'Pillow' belum terinstall.")
    print("Silakan jalankan perintah ini di terminal: pip install Pillow")
    sys.exit(1)

# Check openpyxl for Excel reading
try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

# Register HEIC/HEIF format support if pillow_heif is installed
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HAS_HEIF = True
except ImportError:
    HAS_HEIF = False

# Configuration
INPUT_DIR = r"D:\COMPRESS\foto asli"
OUTPUT_DIR = r"D:\COMPRESS\output"
EXCEL_PATH = r"D:\COMPRESS\idpass-update2.xlsx"
MAX_SIZE_KB = 500
MAX_SIZE_BYTES = MAX_SIZE_KB * 1024
SUPPORTED_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.heic', '.heif')

def load_excel_users(excel_file):
    r"""
    Membaca data nama, UserID, dan Email dari file Excel D:\COMPRESS\idpass-update2.xlsx
    Kolom A: Nama, Kolom B: UseriD, Kolom D: Email
    """
    if not HAS_OPENPYXL:
        print("[WARN] Library 'openpyxl' belum terinstall. Untuk auto-rename dengan Excel, install dengan: pip install openpyxl")
        return []
    
    if not os.path.exists(excel_file):
        print(f"[WARN] File Excel tidak ditemukan di: {excel_file}")
        return []

    try:
        wb = openpyxl.load_workbook(excel_file, data_only=True)
        sheet = wb.active
        users = []
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if row and len(row) >= 2:
                name = str(row[0]).strip() if row[0] else ""
                user_id = str(row[1]).strip('"\' ') if row[1] else ""
                email = str(row[3]).strip() if len(row) >= 4 and row[3] else ""
                if user_id:
                    users.append((name, user_id, email))
        print(f"[INFO] Berhasil memuat {len(users)} data user dari Excel '{excel_file}'")
        return users
    except Exception as e:
        print(f"[ERROR] Gagal membaca Excel: {e}")
        return []

def match_user_id(file_name, users_list):
    """
    Pencocokan bertahap:
    1. Cari kecocokan kata kunci/inisial pada Kolom Nama (Kolom A).
    2. Jika tidak ditemukan pada Kolom Nama, menggeser pencarian ke Kolom Email (Kolom D).
    
    Mengembalikan (UserID, detail_pencocokan, jenis_pencocokan) jika cocok, atau None.
    """
    if not users_list:
        return None

    name_part = os.path.splitext(file_name)[0]
    
    # Bersihkan prefix ID acak / unik jika ada ' - ' (misal: 178248492... - D. Dody Supriady)
    if ' - ' in name_part:
        name_part = name_part.split(' - ', 1)[1]
    elif '-' in name_part and not name_part.lower().startswith('image'):
        parts = name_part.split('-')
        if len(parts) > 1 and (parts[0].strip().isdigit() or 'IMG' in parts[0].upper()):
            name_part = parts[-1]

    # Ambil token kata dari nama file
    fname_tokens = [t.lower() for t in re.split(r'[\s\._]+', name_part) if t and not t.isdigit()]
    fname_tokens = [t for t in fname_tokens if t not in ('image', 'img', 'photo', 'foto')]

    if not fname_tokens:
        return None

    # Step 1: Pencocokan ke Kolom NAMA (Kolom A)
    best_name_match = None
    best_name_score = 0

    for excel_name, uid, email in users_list:
        if not excel_name:
            continue
        name_tokens = [t.lower() for t in re.split(r'[\s\._]+', excel_name) if t]
        score = 0
        matched_words = 0
        
        for ft in fname_tokens:
            for nt in name_tokens:
                # Exact word match (misal 'dody' == 'dody')
                if ft == nt:
                    score += 20
                    matched_words += 1
                    break
                # Initial match (misal 'd' atau 'd.' cocok dengan 'didik')
                elif len(ft) == 1 and nt.startswith(ft):
                    score += 10
                    matched_words += 1
                    break
                elif len(nt) == 1 and ft.startswith(nt):
                    score += 10
                    matched_words += 1
                    break
                # Substring match (misal 'dody' ada dalam 'didikdody')
                elif len(ft) > 2 and ft in nt:
                    score += 15
                    matched_words += 1
                    break

        if score > best_name_score and matched_words > 0:
            best_name_score = score
            best_name_match = (uid, excel_name, "Nama Excel")

    if best_name_score >= 10:
        return best_name_match

    # Step 2: Menggeser pencocokan ke Kolom EMAIL (Kolom D) jika di Nama tidak ditemukan
    best_email_match = None
    best_email_score = 0

    for excel_name, uid, email in users_list:
        if not email:
            continue
        
        email_clean = email.lower()
        email_user = email_clean.split('@')[0] if '@' in email_clean else email_clean
        
        score = 0
        matched_words = 0
        
        for ft in fname_tokens:
            if len(ft) <= 1:
                continue
            if ft in email_user:
                score += 20
                matched_words += 1

        if score > best_email_score and matched_words > 0:
            best_email_score = score
            best_email_match = (uid, email, "Email Excel")

    if best_email_score >= 10:
        return best_email_match

    return None

def compress_image(input_path, output_path, target_bytes=MAX_SIZE_BYTES):
    """
    Mengompresi gambar hingga ukurannya di bawah target_bytes (500 KB).
    Memastikan posisi gambar selalu portrait (tinggi >= lebar).
    """
    file_name = os.path.basename(input_path)
    orig_size = os.path.getsize(input_path)
    
    img = Image.open(input_path)
    
    # Terapkan orientasi EXIF (foto HP/kamera)
    img = ImageOps.exif_transpose(img)
    
    # Jika posisi landscape (lebar > tinggi), putar 270 derajat agar portrait
    if img.width > img.height:
        img = img.rotate(270, expand=True)
    
    # Konversi RGBA ke RGB jika gambar memiliki saluran alpha (PNG transparan)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
        
    ext = os.path.splitext(output_path)[1].lower()
    save_format = "JPEG"
    if ext == ".webp":
        save_format = "WEBP"
    elif ext in (".png", ".heic", ".heif"):
        output_path = os.path.splitext(output_path)[0] + ".jpg"
        save_format = "JPEG"

    # Iterasi kualitas dari 95 ke 20
    quality = 95
    current_img = img.copy()
    
    while quality >= 20:
        current_img.save(output_path, format=save_format, optimize=True, quality=quality)
        current_size = os.path.getsize(output_path)
        
        if current_size <= target_bytes:
            print(f"     Ukuran awal: {orig_size / 1024:.2f} KB | Ukuran akhir: {current_size / 1024:.2f} KB (Quality: {quality}, Dimensi: {current_img.width}x{current_img.height})")
            return
        
        quality -= 5

    # Jika dengan quality=20 masih > 500 KB, lakukan resize bertahap (skala 90%)
    while True:
        new_width = int(current_img.width * 0.9)
        new_height = int(current_img.height * 0.9)
        
        if new_width < 100 or new_height < 100:
            print(f"[WARN] {file_name}: Resolusi terlalu kecil.")
            break

        current_img = current_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        current_img.save(output_path, format=save_format, optimize=True, quality=35)
        current_size = os.path.getsize(output_path)

        if current_size <= target_bytes:
            print(f"     Ukuran awal: {orig_size / 1024:.2f} KB | Ukuran akhir: {current_size / 1024:.2f} KB (Resized: {current_img.width}x{current_img.height})")
            return

def main():
    # Pastikan folder input & output ada
    if not os.path.exists(INPUT_DIR):
        os.makedirs(INPUT_DIR, exist_ok=True)
        print(f"Folder input dibuat di: {INPUT_DIR}")
        print(f"Silakan letakkan foto yang ingin dikompres di folder tersebut lalu jalankan ulang script ini.")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        print(f"Folder output dibuat di: {OUTPUT_DIR}")

    if not HAS_HEIF:
        print("[INFO] Pustaka 'pillow-heif' terdeteksi. Dukungan .heic/.heif aktif.")

    files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(SUPPORTED_EXTENSIONS)]

    if not files:
        print(f"Tidak ada file gambar ditemukan di: {INPUT_DIR}")
        print(f"Format yang didukung: {', '.join(SUPPORTED_EXTENSIONS)}")
        return

    # Memuat data dari Excel
    excel_users = load_excel_users(EXCEL_PATH)

    print(f"\nDitemukan {len(files)} gambar di '{INPUT_DIR}'. Memulai kompresi dan auto-rename...\n" + "-"*75)

    success_count = 0
    for file_name in files:
        input_path = os.path.join(INPUT_DIR, file_name)
        
        # Cari UserID (Tahap 1: Nama, Tahap 2: Email)
        match_result = match_user_id(file_name, excel_users)
        
        if match_result:
            matched_uid, matched_detail, match_source = match_result
            ext = os.path.splitext(file_name)[1].lower()
            if ext in (".png", ".heic", ".heif"):
                ext = ".jpg"
            out_file_name = f"{matched_uid}{ext}"
            print(f"[RENAME & COMPRESS] '{file_name}'")
            print(f"     -> Matched via {match_source}: '{matched_detail}' => UserID: {matched_uid} (Hasil: {out_file_name})")
        else:
            out_file_name = file_name
            ext = os.path.splitext(file_name)[1].lower()
            if ext in (".heic", ".heif"):
                out_file_name = os.path.splitext(file_name)[0] + ".jpg"
            print(f"[COMPRESS ONLY] '{file_name}' (Tidak cocok di Kolom Nama maupun Email Excel)")

        output_path = os.path.join(OUTPUT_DIR, out_file_name)
        
        try:
            compress_image(input_path, output_path)
            success_count += 1
        except Exception as e:
            print(f"[ERROR] Gagal memproses {file_name}: {e}")
        print()

    print("-" * 75)
    print(f"Selesai! {success_count}/{len(files)} gambar berhasil dikompresi & diproses ke: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
