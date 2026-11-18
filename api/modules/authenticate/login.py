import hashlib
import hmac
import time
import json
import base64
from fastapi import APIRouter, Response, HTTPException, status
from modules.common.request import LoginRequest
from modules.common.response import success_response, error_response
from modules.common.config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from services.database.database import DatabaseService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def verify_password(plain_password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    # Check demo hash format: offbyone_demo_hash::email::pass or offbyone_demo_hash::pass
    if stored_hash.startswith("offbyone_demo_hash::"):
        parts = stored_hash.split("::")
        if parts[-1] == plain_password:
            return True

    # Standard salted sha256
    computed = "h_" + hashlib.sha256(f"algopath_salt_{plain_password}".encode("utf-8")).hexdigest()[:8]
    if stored_hash == computed:
        return True

    # Fallback direct string match (for initial dev seeds)
    return plain_password == stored_hash

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": JWT_ALGORITHM, "typ": "JWT"}).encode()).decode().rstrip("=")
    payload_data = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": int(time.time()) + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    }
    payload = base64.urlsafe_b64encode(json.dumps(payload_data).encode()).decode().rstrip("=")
    signature = hmac.new(JWT_SECRET_KEY.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{header}.{payload}.{sig_b64}"

@router.post("/login")
def login(request: LoginRequest, response: Response):
    user = DatabaseService.get_user_by_email(request.email)
    if not user:
        return error_response("Email hoặc mật khẩu không chính xác.", status_code=status.HTTP_401_UNAUTHORIZED)

    if not verify_password(request.password, user.get("password_hash", "")):
        return error_response("Email hoặc mật khẩu không chính xác.", status_code=status.HTTP_401_UNAUTHORIZED)

    token = create_jwt_token(user["id"], user["email"], user.get("role", "student"))

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False  # Set to True in HTTPS production
    )

    public_user = {
        "id": user["id"],
        "email": user["email"],
        "fullName": user["full_name"],
        "role": user.get("role", "student"),
        "accountType": user.get("account_type", "registered"),
        "token": token
    }
    return success_response({"user": public_user}, message="Đăng nhập thành công!")
