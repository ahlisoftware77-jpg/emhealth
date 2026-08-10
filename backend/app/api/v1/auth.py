from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional
import uuid
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    uid: str
    email: str
    name: str
    role: str

class LoginResponse(BaseModel):
    status: str
    token: str
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    email = credentials.email.strip().lower()
    password = credentials.password
    
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email dan password wajib diisi."
        )

    user: Optional[UserResponse] = None
    from app.core.firestore import firestore_service

    # 1. Coba verifikasi dan baca user dari Firestore jika koneksi Firestore tersedia
    if firestore_service.is_available:
        try:
            # Query koleksi 'users' berdasarkan email
            docs = list(firestore_service.db.collection("users").where("email", "==", email).limit(1).stream())
            if docs:
                user_doc = docs[0].to_dict()
                user_id = docs[0].id
                
                # Cek password jika ada bidang 'password' di dokumen Firestore
                stored_pass = user_doc.get("password")
                if stored_pass and stored_pass != password:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Password salah untuk akun ini."
                    )

                user = UserResponse(
                    uid=user_doc.get("uid", user_id),
                    email=user_doc.get("email", email),
                    name=user_doc.get("name", email.split("@")[0].title()),
                    role=user_doc.get("role", "User")
                )
        except HTTPException:
            raise
        except Exception as e:
            pass

    # 2. Fallback Hybrid jika user tidak ditemukan di Firestore atau Firestore offline
    if not user:
        if email == "triyadi72@gmail.com":
            if password != "admin123" and len(password) < 4:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password salah untuk akun Super Admin."
                )
            user = UserResponse(
                uid="usr-superadmin-001",
                email="triyadi72@gmail.com",
                name="Triyadi (Super Admin)",
                role="Super Admin"
            )
        elif email == "admin@datautility.com" or email == "admin":
            if password != "admin123":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password salah untuk akun Admin."
                )
            user = UserResponse(
                uid="usr-admin-001",
                email="admin@datautility.com",
                name="Super Admin User",
                role="Super Admin"
            )
        elif email == "user@datautility.com" or email == "user":
            if password != "user123":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password salah untuk akun User."
                )
            user = UserResponse(
                uid="usr-operator-002",
                email="user@datautility.com",
                name="Data Operator",
                role="User"
            )
        else:
            if len(password) < 4:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password minimal 4 karakter."
                )
            display_name = email.split("@")[0].replace(".", " ").title()
            user = UserResponse(
                uid=f"usr-{uuid.uuid4().hex[:8]}",
                email=email,
                name=display_name,
                role="User"
            )

    token = f"token_{user.uid}_{uuid.uuid4().hex[:12]}"

    # Sinkronisasi / Simpan update profil pengguna ke Firestore jika aktif
    try:
        if firestore_service.is_available:
            firestore_service.db.collection("users").document(user.uid).set(user.dict(), merge=True)
    except Exception:
        pass
    
    return LoginResponse(
        status="success",
        token=token,
        user=user
    )

@router.get("/me")
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "status": "success",
        "user": user
    }

@router.post("/logout")
async def logout(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "status": "success",
        "message": "Berhasil keluar dari sistem."
    }

