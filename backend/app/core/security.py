from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import os
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
security_scheme = HTTPBearer(auto_error=False)

# Optional Firebase Admin SDK initialization
firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import auth, credentials
    if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully.")
    else:
        logger.info("Firebase credentials file not found. Running with mock/local auth token validator.")
except Exception as e:
    logger.warning(f"Firebase Admin SDK initialization skipped: {e}")

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> Dict[str, Any]:
    if not credentials:
        # Development / Guest mode fallback user
        return {
            "uid": "demo-user-123",
            "email": "admin@datautility.com",
            "name": "Demo Admin",
            "role": "Super Admin"
        }
    
    token = credentials.credentials
    if firebase_initialized:
        try:
            decoded_token = auth.verify_id_token(token)
            return {
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name", "User"),
                "role": decoded_token.get("role", "Admin")
            }
        except Exception as e:
            logger.warning(f"Firebase token verification failed ({e}), falling back to local Super Admin user.")
            return {
                "uid": "demo-user-123",
                "email": "admin@datautility.com",
                "name": "Demo Admin",
                "role": "Super Admin"
            }
    else:
        # Mock payload decoding for demo authorization
        return {
            "uid": "user-" + token[:8],
            "email": "user@datautility.com",
            "name": "Authenticated User",
            "role": "Super Admin"
        }

def require_role(allowed_roles: list[str]):
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role", "User")
        if user_role not in allowed_roles and "Super Admin" not in user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak. Peran anda tidak memiliki izin."
            )
        return user
    return role_checker
