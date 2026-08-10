import os
import sys
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.utils import formatdate, make_msgid

try:
    import openpyxl
except ImportError:
    print("Error: Library 'openpyxl' belum terinstall.")
    print("Silakan jalankan: pip install openpyxl")
    sys.exit(1)

# ==============================================================================
# KONFIGURASI PENGIRIMAN EMAIL (PILIH AKUN PENGIRIM)
# ==============================================================================
# Pilih Mode Pengirim:
# "GMAIL"         : Menggunakan emhealth.medicalcenter2@gmail.com (Gmail SMTP)
# "CUSTOM_DOMAIN" : Menggunakan info@klinikutamaemhealth.com (Custom Domain Webmail/SMTP)
MODE_PENGIRIM = "CUSTOM_DOMAIN"   # Ubah ke "CUSTOM_DOMAIN" jika ingin pakai info@klinikutamaemhealth.com

# ------------------------------------------------------------------------------
# 1. AKUN GMAIL
# ------------------------------------------------------------------------------
GMAIL_SENDER_EMAIL = "emhealth.medicalcenter2@gmail.com"
GMAIL_APP_PASSWORD = "fkfu xkvx dlcg gwpp"  # 16-digit App Password Gmail

# ------------------------------------------------------------------------------
# 2. AKUN CUSTOM DOMAIN (info@klinikutamaemhealth.com)
# ------------------------------------------------------------------------------
CUSTOM_SENDER_EMAIL = "info@klinikutamaemhealth.com"
CUSTOM_SENDER_PASSWORD = "123klinikem123" # Password email domain Anda
CUSTOM_SMTP_SERVER = "mail.klinikutamaemhealth.com"   # Server SMTP domain Anda
CUSTOM_SMTP_PORT = 465                                # Port 465 (SSL) atau 587 (TLS)
CUSTOM_USE_SSL = True                                 # True jika port 465 (SSL), False jika 587 (TLS)

# ------------------------------------------------------------------------------
# PENGATURAN UMUM
# ------------------------------------------------------------------------------
SENDER_NAME = "EM-Health Admin"  # Nama Pengirim di inbox penerima

# Set variabel aktif berdasarkan MODE_PENGIRIM yang dipilih:
if MODE_PENGIRIM == "GMAIL":
    SENDER_EMAIL = GMAIL_SENDER_EMAIL
    SENDER_PASSWORD = GMAIL_APP_PASSWORD
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    USE_SSL = False
else:
    SENDER_EMAIL = CUSTOM_SENDER_EMAIL
    SENDER_PASSWORD = CUSTOM_SENDER_PASSWORD
    SMTP_SERVER = CUSTOM_SMTP_SERVER
    SMTP_PORT = CUSTOM_SMTP_PORT
    USE_SSL = CUSTOM_USE_SSL

# PATH DATA EXCEL & LAMPIRAN
EXCEL_PATH = r"D:\COMPRESS\idpass-update2.xlsx"
ATTACHMENT_DIR = r"D:\COMPRESS\output"       # Folder foto tersimpan (opsional)

# PENGATURAN TEKS EMAIL (Manual)
PROGRAM_NAME = "Medical Check Up"                 # Isi manual nama program
COMPANY_NAME = "PT. YADIKOMPUTER"                 # Isi manual nama perusahaan

# PENGATURAN LOGIKA
DRY_RUN = False           # Set False untuk langsung mengirim email nyata secara asli
                          # Set True jika hanya ingin tes/simulasi terminal

DELAY_BETWEEN_EMAILS = 5  # Jeda 5 detik antar email agar tidak terdeteksi bot/spam
# ==============================================================================

# TEMPLATE EMAIL (Bisa disesuaikan)
EMAIL_SUBJECT = "Hasil Pemeriksaan MCU - EM-HEALTH"

EMAIL_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }}
        .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 6px 6px 0 0; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; }}
        .content {{ padding: 25px; background-color: #f9f9f9; text-align: center; }}
        .section-title {{ font-size: 18px; font-weight: bold; color: #007bff; margin-top: 15px; margin-bottom: 10px; text-align: center; }}
        .card {{ background: white; padding: 20px; border-radius: 6px; border: 1px solid #007bff; margin: 20px auto; text-align: left; max-width: 480px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .footer {{ text-align: center; padding: 15px; font-size: 12px; color: #777; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EM-HEALTH</h1>
        </div>
        <div class="content">
            <br><br>
            <div class="section-title">Hasil Pemeriksaan MCU</div>
            <br>
            <p>Halo <b>{Nama}</b>,</p>
            <br>
            <p>Hasil pemeriksaan <b>{ProgramName}</b>, <b>{CompanyName}</b> anda telah tersedia.</p>
            <br>
            <p><b>Informasi Login Peserta</b></p>
            
            <div class="card">
                <p style="margin: 6px 0;"><b>NIK (Username Login):</b> <code>{UseriD}</code></p>
                <p style="margin: 6px 0;"><b>Password:</b> <code>{Password}</code></p>
                <p style="margin: 6px 0;"><b>Email Terdaftar:</b> {Email}</p>
            </div>

            <p>Harap simpan informasi akun ini dengan baik dan jangan berikan password Anda kepada pihak lain.</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="https://mcu-emhealth.com/login-employee" target="_blank" style="background-color: #28a745; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">Unduh Hasil</a>
            </div>

            <p style="font-size: 13px; color: #666;">Jika ada foto yang dilampirkan, file tersebut telah dikompresi sesuai ketentuan sistem.</p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara resmi oleh Sistem Admin EM-Health. Harap tidak membalas email otomatis ini.</p>
        </div>
    </div>
</body>
</html>
"""

def load_recipients_from_excel(excel_file):
    """Membaca daftar penerima dari Excel (Kolom A: Nama, B: UseriD, C: Password, D: Email)"""
    if not os.path.exists(excel_file):
        print(f"[ERROR] File Excel tidak ditemukan di: {excel_file}")
        return []

    wb = openpyxl.load_workbook(excel_file, data_only=True)
    sheet = wb.active

    recipients = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if row and len(row) >= 4:
            nama = str(row[0]).strip() if row[0] else ""
            userid = str(row[1]).strip('"\' ') if row[1] else ""
            password = str(row[2]).strip() if row[2] else ""
            email = str(row[3]).strip() if row[3] else ""

            if email and "@" in email:
                recipients.append({
                    "Nama": nama,
                    "UseriD": userid,
                    "Password": password,
                    "Email": email
                })

    return recipients

def send_single_email(server, recipient, dry_run=True):
    r"""Mengirim satu email dengan Header Lengkap Anti-Spam (RFC 2822) & Plain-Text Fallback"""
    email_to = recipient["Email"]
    nama = recipient["Nama"]
    userid = recipient["UseriD"]
    password = recipient["Password"]

    # Buat struktur MIME gabungan (Root: Mixed untuk lampiran)
    msg_root = MIMEMultipart("mixed")
    msg_root["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg_root["To"] = email_to
    msg_root["Reply-To"] = SENDER_EMAIL
    msg_root["Subject"] = EMAIL_SUBJECT
    msg_root["Date"] = formatdate(localtime=True)
    msg_root["Message-ID"] = make_msgid(domain=SENDER_EMAIL.split('@')[-1])

    # Bagian Alternatif (Text & HTML)
    msg_alternative = MIMEMultipart("alternative")

    # 1. Plain Text Version (Penting bagi Anti-Spam Filter!)
    plain_text = f"""EM-HEALTH

Hasil Pemeriksaan MCU

Halo {nama},

Hasil pemeriksaan {PROGRAM_NAME}, {COMPANY_NAME} anda telah tersedia.

Informasi Login Peserta:
- NIK (Username Login): {userid}
- Password: {password}
- Email Terdaftar: {email_to}

Harap simpan informasi akun ini dengan baik dan jangan berikan password Anda kepada pihak lain.

Unduh hasil pemeriksaan pada tautan berikut:
https://mcu-emhealth.com/login-employee

---
Email ini dikirim secara resmi oleh Sistem Admin EM-Health.
"""
    msg_alternative.attach(MIMEText(plain_text, "plain", "utf-8"))

    # 2. HTML Version
    html_content = EMAIL_HTML_TEMPLATE.format(
        Nama=nama,
        UseriD=userid,
        Password=password,
        Email=email_to,
        ProgramName=PROGRAM_NAME,
        CompanyName=COMPANY_NAME
    )
    msg_alternative.attach(MIMEText(html_content, "html", "utf-8"))

    msg_root.attach(msg_alternative)

    # 3. Lampirkan Foto jika ada di folder D:\COMPRESS\output\<UseriD>.jpg
    attachment_filename = f"{userid}.jpg"
    attachment_path = os.path.join(ATTACHMENT_DIR, attachment_filename)

    has_attachment = False
    if os.path.exists(attachment_path):
        try:
            with open(attachment_path, "rb") as attachment:
                part = MIMEBase("image", "jpeg")
                part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={attachment_filename}",
            )
            msg_root.attach(part)
            has_attachment = True
        except Exception as e:
            print(f"     [WARN] Gagal melampirkan file {attachment_path}: {e}")

    # Kirim atau Simulasi
    if dry_run:
        attach_str = f" + Lampiran ({attachment_filename})" if has_attachment else ""
        print(f"[SIMULASI OK] To: {nama} <{email_to}> | UserID: {userid}{attach_str}")
        return True
    else:
        try:
            server.sendmail(SENDER_EMAIL, email_to, msg_root.as_string())
            attach_str = f" + Lampiran ({attachment_filename})" if has_attachment else ""
            print(f"[SUKSES TERKIRIM] To: {nama} <{email_to}> | UserID: {userid}{attach_str}")
            return True
        except Exception as e:
            print(f"[GAGAL KIRIM] To: {nama} <{email_to}> - Error: {e}")
            return False

def main():
    print("=" * 70)
    print(f"       SCRIPT BLAST EMAIL VIA SMTP ({SENDER_EMAIL})")
    print("=" * 70)

    # 1. Muat Data Excel
    recipients = load_recipients_from_excel(EXCEL_PATH)
    if not recipients:
        print("Tidak ada daftar penerima email yang valid di Excel. Script dihentikan.")
        return

    print(f"Ditemukan {len(recipients)} penerima email di Excel.\n")

    # 2. Cek Mode DRY_RUN
    if DRY_RUN:
        print("[PERHATIAN] Mode DRY_RUN = True aktif.")
        print("            Email TIDAK AKAN dikirim secara nyata. Ini hanya tes/simulasi.")
        print("            Ubah DRY_RUN = False pada script jika ingin mengirim sungguhan.\n")

    # 3. Konek ke Server SMTP (jika bukan DRY_RUN)
    server = None
    if not DRY_RUN:
        print(f"Menghubungkan ke server SMTP ({SMTP_SERVER}:{SMTP_PORT})...")
        try:
            if USE_SSL:
                server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
            else:
                server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
                server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            print(f"Berhasil login ke SMTP ({SENDER_EMAIL})!\n")
        except Exception as e:
            print(f"[ERROR] Gagal konek/login ke SMTP ({SMTP_SERVER}): {e}")
            return

    print("-" * 70)

    # 4. Kirim Blast Email
    success_count = 0
    fail_count = 0

    try:
        for idx, r in enumerate(recipients, 1):
            print(f"[{idx}/{len(recipients)}] Processing...", end=" ")
            res = send_single_email(server, r, dry_run=DRY_RUN)
            if res:
                success_count += 1
            else:
                fail_count += 1

            if not DRY_RUN and idx < len(recipients):
                time.sleep(DELAY_BETWEEN_EMAILS)

    finally:
        if server:
            server.quit()
            print("\nKoneksi SMTP ditutup.")

    print("-" * 75)
    print(f"Selesai! Berhasil: {success_count} | Gagal: {fail_count}")

if __name__ == "__main__":
    main()
