import sys
import os
from pathlib import Path

# Fix sys.path for Vercel Python runtime
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir / "backend"
sys.path.insert(0, str(backend_dir))

from backend.main import app
