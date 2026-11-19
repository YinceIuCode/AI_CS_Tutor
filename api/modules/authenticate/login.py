import uuid
from typing import Optional
from fastapi import APIRouter, Request, Response, Depends, status
from pydantic import BaseModel
from modules.common.request import LoginRequest
from modules.common.response import success_response, error_response
from modules.authenticate.security import (
    verify_password_with_timing_mitigation,
    hash_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    login_limiter,
    get_client_ip,
    REFRESH_TOKEN_EXPIRE_SECONDS,
    ACCESS_TOKEN_EXPIRE_SECONDS,
)
from modules.authenticate.dependencies import get_current_user
from services.database.database import DatabaseService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RefreshRequest(BaseModel):
    refreshToken: Optional[str] = None

@router.post("/login")
def login(request_data: LoginRequest, request: Request, response: Response):
    ip = get_client_ip(request)
    normalized_email = (request_data.email or "").strip().lower()

    # 1. Rate Limiting Check
    allowed, remaining_seconds = login_limiter.check(ip, normalized_email)
    if not allowed:
        return error_response(
            message=f"Too many failed login attempts. Please wait {remaining_seconds} seconds.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retryAfter": remaining_seconds}
        )

    # 2. Database Lookup & Timing Attack Mitigation
    user = DatabaseService.get_user_by_email(normalized_email)
    stored_hash = user.get("password_hash") if user else None

    # Always executes timing mitigation check
    is_valid, needs_upgrade = verify_password_with_timing_mitigation(request_data.password, stored_hash)

    if not user or not is_valid:
        failures, lock_seconds = login_limiter.record_failure(ip, normalized_email)
        if lock_seconds > 0:
            return error_response(
                message=f"Locked due to multiple failed attempts. Please wait {lock_seconds} seconds.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                details={"retryAfter": lock_seconds}
            )
        return error_response("Invalid email or password.", status_code=status.HTTP_401_UNAUTHORIZED)

    # 3. Successful Login - Reset Failure Counter
    login_limiter.record_success(ip, normalized_email)

    # 4. Automatic Seed Data Bcrypt Upgrade
    if needs_upgrade:
        try:
            upgraded_hash = hash_password(request_data.password)
            DatabaseService.update_user_password(user["id"], upgraded_hash)
        except Exception as e:
            print(f"[Auth Upgrade Warning] Failed to upgrade hash: {e}")

    # 5. Dual Token Generation (Access 15m, Refresh 7d)
    user_id = str(user["id"])
    role = user.get("role", "student")
    account_type = user.get("account_type", "registered")
    access_token = create_access_token(user_id, normalized_email, role, account_type)
    refresh_token = create_refresh_token(user_id)

    # Set HttpOnly Cookies
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_SECONDS,
        samesite="lax",
        secure=False,
        path="/"
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        samesite="lax",
        secure=False,
        path="/"
    )

    public_user = {
        "id": user_id,
        "email": normalized_email,
        "fullName": user.get("full_name") or "User",
        "role": role,
        "accountType": account_type,
        "token": access_token
    }

    return success_response(
        {
            "user": public_user,
            "accessToken": access_token
        },
        message="Login successful."
    )

@router.post("/refresh")
def refresh_token_endpoint(request: Request, response: Response, body: Optional[RefreshRequest] = None):
    """
    Refresh access token using the HttpOnly refresh_token cookie or payload.
    """
    token = request.cookies.get("refresh_token")
    if not token and body and body.refreshToken:
        token = body.refreshToken

    if not token:
        return error_response("Refresh token missing.", status_code=status.HTTP_401_UNAUTHORIZED)

    payload = verify_token(token, expected_type="refresh")
    if not payload or not payload.get("sub"):
        return error_response("Invalid or expired refresh token.", status_code=status.HTTP_401_UNAUTHORIZED)

    user_id = str(payload["sub"])
    user = DatabaseService.get_user_by_id(user_id)
    if not user:
        return error_response("User account no longer exists.", status_code=status.HTTP_401_UNAUTHORIZED)

    email = user.get("email", "")
    role = user.get("role", "student")
    account_type = user.get("account_type", "registered")

    new_access_token = create_access_token(user_id, email, role, account_type)

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        samesite="lax",
        secure=False,
        path="/"
    )

    public_user = {
        "id": user_id,
        "email": email,
        "fullName": user.get("full_name") or "User",
        "role": role,
        "accountType": account_type,
        "token": new_access_token
    }

    return success_response(
        {
            "accessToken": new_access_token,
            "user": public_user
        },
        message="Token refreshed successfully."
    )

@router.get("/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Protected route returning active user information.
    """
    user_db = DatabaseService.get_user_by_id(current_user["id"])
    full_name = user_db.get("full_name") if user_db else "User"
    return success_response({
        "user": {
            "id": current_user["id"],
            "email": current_user["email"],
            "fullName": full_name,
            "role": current_user["role"],
            "accountType": current_user["accountType"]
        }
    })

@router.post("/guest")
def login_as_guest(response: Response):
    """
    Create a guest student session with guest access token.
    """
    guest_id = str(uuid.uuid4())
    email = f"guest_{guest_id[:8]}@offbyone.demo"
    role = "student"
    account_type = "guest"

    access_token = create_access_token(guest_id, email, role, account_type)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        samesite="lax",
        secure=False,
        path="/"
    )

    public_user = {
        "id": guest_id,
        "email": email,
        "fullName": "Guest Student",
        "role": role,
        "accountType": account_type,
        "token": access_token
    }

    return success_response({
        "user": public_user,
        "accessToken": access_token
    }, message="Guest session started.")
