import re

with open("backend/app/core/config.py", "r", encoding="utf-8") as f:
    content = f.read()

# Ubah lokasi storage ke luar folder backend agar tidak memicu uvicorn reload
old_storage_base = '    STORAGE_BASE = BASE_DIR / "storage"'
new_storage_base = '    STORAGE_BASE = BASE_DIR.parent / "storage"'

content = content.replace(old_storage_base, new_storage_base)

with open("backend/app/core/config.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated STORAGE_BASE to be outside of backend directory")
