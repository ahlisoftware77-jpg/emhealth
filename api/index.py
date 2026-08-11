import sys
import os
from pathlib import Path

# Add project root and backend folder to sys.path for Vercel Serverless
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(backend_dir))

# Import FastAPI app — 'main' resolves to backend/main.py via sys.path
from main import app
