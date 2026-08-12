import subprocess
import sys
import os
import time

def main():
    # Menentukan direktori kerja
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")
    backend_dir = os.path.join(base_dir, "backend")

    print("🚀 Memulai Backend & Frontend secara bersamaan...")

    # Start Backend (FastAPI di port 8003)
    # Gunakan --reload-exclude "storage" agar uvicorn tidak merestart server saat menyimpan file.
    print("▶ Menjalankan Backend (Uvicorn pada port 8003)...")
    backend_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "main:app", "--reload", "--port", "8003", "--reload-exclude", "storage"],
        cwd=backend_dir,
        shell=True
    )

    # Start Frontend (Next.js)
    print("▶ Menjalankan Frontend (Next.js npm run dev)...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )

    print("\n✅ Server sedang berjalan. Tekan CTRL+C untuk menghentikan keduanya.\n")

    try:
        # Menjaga script tetap berjalan
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Menghentikan server...")
        
        # Menghentikan proses anak
        backend_process.terminate()
        frontend_process.terminate()
        
        backend_process.wait()
        frontend_process.wait()
        
        print("✅ Server berhasil dihentikan.")
        sys.exit(0)

if __name__ == "__main__":
    main()
