import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_BASE = BASE_DIR / "storage"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Utility Center API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage Engine Configuration: 'cloudinary' or 'local'
    PRIMARY_STORAGE_ENGINE: str = "cloudinary"
    
    # Local Storage Folders
    UPLOAD_DIR: Path = STORAGE_BASE / "upload"
    OUTPUT_DIR: Path = STORAGE_BASE / "output"
    TEMP_DIR: Path = STORAGE_BASE / "temp"
    CACHE_DIR: Path = STORAGE_BASE / "cache"
    
    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # Tesseract OCR Executable Path
    TESSERACT_CMD: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe" if os.name == 'nt' else "/usr/bin/tesseract"
    
    # AI Assistant API Keys Config
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    PRIMARY_AI_PROVIDER: str = "openai"  # 'openai', 'gemini', or 'deepseek'

    # Firebase Client Config
    FIREBASE_API_KEY: str = ""
    FIREBASE_AUTH_DOMAIN: str = ""
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""
    FIREBASE_MESSAGING_SENDER_ID: str = ""
    FIREBASE_APP_ID: str = ""

    # Firebase Service Account Credentials Path or Raw JSON string
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""
    FIREBASE_CREDENTIALS_PATH: str = str(BASE_DIR / "firebase-service-account.json")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

def save_settings_to_env(new_settings: dict):
    env_path = BASE_DIR / ".env"
    env_dict = {}
    
    # Read existing .env if present
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_dict[k.strip()] = v.strip()

    # Update with new values
    for key, val in new_settings.items():
        if val is not None:
            clean_v = str(val).replace("\r\n", "\\n").replace("\n", "\\n")
            env_dict[key] = clean_v

    # Write back to .env
    with open(env_path, "w", encoding="utf-8") as f:
        for k, v in env_dict.items():
            f.write(f"{k}={v}\n")

# Ensure directories exist
for folder in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.TEMP_DIR, settings.CACHE_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
