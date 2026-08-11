from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional
import uuid
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserApprovalRequest(BaseModel):
    uid: str
    action: str  # "approve" or "reject"
    role: Optional[str] = "User"

@router.post("/register")
async def register(req: RegisterRequest):
    email = req.email.strip().lower()
    name = req.name.strip()
    password = req.password

    if not email or not password or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama, email, dan password wajib diisi."
        )
    
    if len(password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password minimal 4 karakter."
        )

    from app.core.firestore import firestore_service
    uid = f"usr-{uuid.uuid4().hex[:8]}"
    
    # Cek apakah email sudah terdaftar
    if firestore_service.is_available:
        try:
            docs = list(firestore_service.db.collection("users").where("email", "==", email).limit(1).stream())
            if docs:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email sudah terdaftar. Silakan gunakan email lain atau login."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    # Akun Super Admin langsung disetujui (Approved)
    is_super_admin = (email == "triyadi72@gmail.com")
    user_status = "Approved" if is_super_admin else "Pending"
    user_role = "Super Admin" if is_super_admin else "User"

    user_data = {
        "uid": uid,
        "name": name,
        "email": email,
        "password": password,
        "role": user_role,
        "status": user_status,  # "Pending" | "Approved" | "Rejected"
        "created_at": __import__("time").time()
    }

    if firestore_service.is_available:
        try:
            firestore_service.db.collection("users").document(uid).set(user_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Gagal menyimpan data pendaftaran ke Firestore: {str(e)}"
            )

    msg = "Pendaftaran berhasil! Akun Anda memerlukan konfirmasi dari Super Admin sebelum dapat masuk." if user_status == "Pending" else "Pendaftaran Super Admin Berhasil! Silakan masuk."
    return {"status": "success", "message": msg, "user_status": user_status}

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

    # 1. Verifikasi dan baca user dari Firestore jika tersedia
    if firestore_service.is_available:
        try:
            docs = list(firestore_service.db.collection("users").where("email", "==", email).limit(1).stream())
            if docs:
                user_doc = docs[0].to_dict()
                user_id = docs[0].id
                
                # Pengecekan Password
                stored_pass = user_doc.get("password")
                if stored_pass and stored_pass != password:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Password salah untuk akun ini."
                    )

                # Pengecekan Status Persetujuan Super Admin
                acc_status = user_doc.get("status", "Approved")  # Fallback default Approved untuk kompatibilitas lama
                if acc_status == "Pending":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Akun Anda masih dalam antrean konfirmasi oleh Super Admin. Silakan tunggu hingga disetujui."
                    )
                elif acc_status == "Rejected":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Pendaftaran akun Anda ditolak oleh Admin. Hubungi Super Admin untuk bantuan."
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

@router.get("/users")
async def list_users(current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.core.firestore import firestore_service
    if not firestore_service.is_available:
        return {"status": "success", "users": []}

    try:
        docs = firestore_service.db.collection("users").stream()
        users_list = []
        for d in docs:
            u = d.to_dict()
            # Hapus password dari respon untuk keamanan
            u.pop("password", None)
            users_list.append(u)
        return {"status": "success", "users": users_list}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengambil daftar pengguna: {str(e)}"
        )

@router.post("/approve-user")
async def approve_user(
    req: UserApprovalRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Hanya Super Admin atau Admin yang berhak menyetujui/menolak
    user_role = current_user.get("role", "User")
    if user_role not in ["Super Admin", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya Super Admin atau Admin yang dapat menyetujui akun pendaftaran baru."
        )

    from app.core.firestore import firestore_service
    if not firestore_service.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Layanan Firestore tidak aktif. Hubungkan Firestore terlebih dahulu."
        )

    new_status = "Approved" if req.action == "approve" else "Rejected"
    update_payload = {"status": new_status}
    if req.role:
        update_payload["role"] = req.role

    try:
        firestore_service.db.collection("users").document(req.uid).set(update_payload, merge=True)
        act_str = "disetujui" if req.action == "approve" else "ditolak"
        return {"status": "success", "message": f"Akun pengguna berhasil {act_str}!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memperbarui status pengguna: {str(e)}"
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


