import uuid
from typing import Optional
from fastapi import APIRouter, Request, Response, Depends, status
from modules.common.request import LoginRequest, RefreshRequest
from modules.common.response import success_response, error_response
from modules.authenticate.dependencies import get_current_user
from modules.authenticate.security import (
    hash_password,
    verify_password_with_timing_mitigation,
    create_access_token,
    create_refresh_token,
    verify_token,
    login_limiter,
    get_client_ip,
    ACCESS_TOKEN_EXPIRE_SECONDS,
    REFRESH_TOKEN_EXPIRE_SECONDS,
)
from services.database.client import DatabaseService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login")
def login(request_data: LoginRequest, request: Request, response: Response):
    """
    Xử lý đăng nhập an toàn bằng email và mật khẩu:
    1. Kiểm tra Rate Limiting chống Brute-Force theo cặp (IP, Email).
    2. Tra cứu tài khoản trong database Supabase.
    3. Xác thực mật khẩu kèm phòng chống Timing Attack.
    4. Tự động nâng cấp hash mật khẩu cũ lên chuẩn Bcrypt nếu cần.
    5. Cấp cặp Token kép (Access Token 15 phút, Refresh Token 7 ngày) và set HttpOnly Cookie.
    6. Trả về thông tin user và accessToken cho Frontend.
    """
    client_ip = get_client_ip(request)
    email = request_data.email.strip().lower()
    password = request_data.password

    # 1. Kiểm tra Rate Limiting
    is_allowed, remaining_seconds = login_limiter.check(client_ip, email)
    if not is_allowed:
        return error_response(
            message=f"Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau {remaining_seconds} giây.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retryAfter": remaining_seconds},
        )

    # 2. Tìm tài khoản trong database
    user = DatabaseService.get_user_by_email(email)
    stored_hash = user.get("password_hash") if user else None

    # 3. Xác thực mật khẩu với Timing Attack Mitigation
    is_valid, needs_upgrade = verify_password_with_timing_mitigation(password, stored_hash)

    if not user or not is_valid:
        failures, lock_seconds = login_limiter.record_failure(client_ip, email)
        if lock_seconds > 0:
            return error_response(
                message=f"Đăng nhập thất bại quá nhiều lần. Bạn bị tạm khóa trong {lock_seconds} giây.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                details={"retryAfter": lock_seconds},
            )
        return error_response(
            message="Email hoặc mật khẩu không chính xác.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Đăng nhập thành công -> Xóa bộ đếm vi phạm
    login_limiter.record_success(client_ip, email)

    # 4. Tự động nâng cấp hash cũ lên Bcrypt nếu cần
    user_id = user["id"]
    if needs_upgrade:
        try:
            new_hash = hash_password(password)
            DatabaseService.update_user_password(user_id, new_hash)
        except Exception as e:
            print(f"[Auto-Upgrade Bcrypt Warning]: {e}")

    # 5. Cấp cặp JWT Tokens
    role = user.get("role", "student")
    account_type = user.get("account_type", "registered")
    full_name = user.get("full_name") or user.get("email")

    access_token = create_access_token(
        user_id=user_id,
        email=email,
        role=role,
        account_type=account_type,
    )
    refresh_token = create_refresh_token(user_id=user_id)

    # Set Cookie HttpOnly
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,
    )
    response.set_cookie(
        key="accessToken",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,
    )

    user_payload = {
        "id": user_id,
        "email": email,
        "fullName": full_name,
        "role": role,
        "accountType": account_type,
    }

    return success_response(
        data={
            "accessToken": access_token,
            "user": user_payload,
        },
        message="Đăng nhập thành công.",
    )


@router.post("/refresh")
def refresh_token_endpoint(request: Request, response: Response, body: Optional[RefreshRequest] = None):
    """
    Cấp mới Access Token khi token cũ hết hạn (15 phút) thông qua Refresh Token hợp lệ (7 ngày).
    Đọc Refresh Token từ HttpOnly Cookie hoặc request body.
    """
    token: Optional[str] = None

    # Step 1: Đọc từ HttpOnly Cookie
    token = request.cookies.get("refreshToken") or request.cookies.get("refresh_token")

    # Hoặc fallback đọc từ payload body nếu client không dùng cookie
    if not token and body and body.refreshToken:
        token = body.refreshToken

    if not token:
        return error_response(
            message="Không tìm thấy refresh token. Vui lòng đăng nhập lại.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Step 2: Giải mã và xác thực refresh token
    payload = verify_token(token, expected_type="refresh")
    if not payload:
        return error_response(
            message="Refresh token không hợp lệ hoặc đã hết hạn.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    user_id = payload.get("sub")
    if not user_id:
        return error_response(
            message="Token không chứa định danh người dùng.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Step 3: Kiểm tra người dùng còn tồn tại trong DB
    user = DatabaseService.get_user_by_id(user_id)
    if not user:
        return error_response(
            message="Người dùng không còn tồn tại trên hệ thống.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Step 4: Tạo Access Token mới
    role = user.get("role", "student")
    account_type = user.get("account_type", "registered")
    email = user.get("email", "")
    full_name = user.get("full_name", "")

    new_access_token = create_access_token(
        user_id=user_id,
        email=email,
        role=role,
        account_type=account_type,
    )

    # Cập nhật lại cookie accessToken
    response.set_cookie(
        key="accessToken",
        value=new_access_token,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,
    )

    user_payload = {
        "id": user_id,
        "email": email,
        "fullName": full_name,
        "role": role,
        "accountType": account_type,
    }

    return success_response(
        data={
            "accessToken": new_access_token,
            "user": user_payload,
        },
        message="Làm mới token thành công.",
    )


@router.get("/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Trả về thông tin hồ sơ của tài khoản đang đăng nhập trong phiên làm việc hiện tại.
    """
    user_id = current_user.get("id")
    if not user_id:
        return error_response(
            message="Không tìm thấy định danh người dùng.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    db_user = DatabaseService.get_user_by_id(user_id)
    if not db_user:
        return error_response(
            message="Người dùng không tồn tại.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    user_payload = {
        "id": db_user["id"],
        "email": db_user.get("email"),
        "fullName": db_user.get("full_name"),
        "role": db_user.get("role", "student"),
        "accountType": db_user.get("account_type", "registered"),
    }

    return success_response(
        data={"user": user_payload},
        message="Lấy thông tin tài khoản thành công.",
    )


@router.post("/guest")
def login_as_guest(response: Response):
    """
    Khởi tạo phiên học tập tức thì cho khách vãng lai (Guest Student).
    """
    guest_id = str(uuid.uuid4())
    guest_email = f"guest_{guest_id[:8]}@offbyone.local"
    role = "student"
    account_type = "guest"

    access_token = create_access_token(
        user_id=guest_id,
        email=guest_email,
        role=role,
        account_type=account_type,
    )

    response.set_cookie(
        key="accessToken",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,
    )

    user_payload = {
        "id": guest_id,
        "email": guest_email,
        "fullName": "Guest Student",
        "role": role,
        "accountType": account_type,
    }

    return success_response(
        data={
            "accessToken": access_token,
            "user": user_payload,
        },
        message="Khởi tạo phiên khách thành công.",
    )
