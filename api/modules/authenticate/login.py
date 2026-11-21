from typing import Optional
from fastapi import APIRouter, Request, Response, Depends, HTTPException, status
from modules.common.request import LoginRequest, RefreshRequest
from modules.common.response import success_response, error_response
from modules.authenticate.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login")
def login(request_data: LoginRequest, request: Request, response: Response):
    """
    TODO:
    1. Nhiệm vụ:
       - Xử lý đăng nhập an toàn bằng email và mật khẩu cho người dùng (Student, Tutor, Admin).
       - Chống brute-force bằng Rate Limiting và chống timing attack.
       - Cấp cặp Token kép (Access Token 15 phút, Refresh Token 7 ngày) và gắn HttpOnly Cookie.
    2. Input / Output:
       - Input: LoginRequest body {email: str, password: str}, request, response.
       - Output: JSON success_response chứa {"accessToken": str, "user": {id, email, fullName, role, accountType}}.
       - Lỗi: 429 Too Many Requests (nếu bị khóa), 401 Unauthorized (sai thông tin).
    3. Bảng Supabase liên quan:
       - Bảng: public.users
       - Cột: email (text), password_hash (text: bcrypt $2b$12$...), role (text), account_type (text), full_name (text).
    4. Các bước gợi ý:
       - Step 1: Kiểm tra rate limit: login_limiter.check(ip, email). Nếu bị khóa, trả về 429 kèm retryAfter.
       - Step 2: Tìm user theo email: DatabaseService.get_user_by_email(email).
       - Step 3: Xác thực mật khẩu: verify_password_with_timing_mitigation(password, stored_hash). Nếu sai, ghi nhận failure và trả về 401.
       - Step 4: Tạo Access Token và Refresh Token qua create_access_token và create_refresh_token.
       - Step 5: Gắn refresh_token và access_token vào HttpOnly cookie của response.
       - Step 6: Trả về success_response chứa thông tin user và accessToken.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/auth/login")


@router.post("/refresh")
def refresh_token_endpoint(request: Request, response: Response, body: Optional[RefreshRequest] = None):
    """
    TODO:
    1. Nhiệm vụ:
       - Cấp mới Access Token khi token cũ hết hạn (15 phút) thông qua Refresh Token hợp lệ (7 ngày).
       - Đọc Refresh Token từ HttpOnly Cookie hoặc request payload.
    2. Input / Output:
       - Input: request, response, body Optional[RefreshRequest].
       - Output: JSON success_response chứa {"accessToken": str, "user": {...}}.
       - Lỗi: 401 Unauthorized nếu refresh token thiếu, không hợp lệ hoặc hết hạn.
    3. Bảng Supabase liên quan:
       - Bảng: public.users (kiểm tra tài khoản người dùng còn tồn tại hay không).
    4. Các bước gợi ý:
       - Step 1: Trích xuất refresh_token từ cookie hoặc body.refreshToken.
       - Step 2: Giải mã verify_token(token, expected_type='refresh').
       - Step 3: Lấy user_id từ claim 'sub' và kiểm tra user trên database: DatabaseService.get_user_by_id(user_id).
       - Step 4: Tạo Access Token mới và cập nhật cookie access_token.
       - Step 5: Trả về accessToken mới kèm thông tin user.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/auth/refresh")


@router.get("/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    TODO:
    1. Nhiệm vụ:
       - Trả về thông tin hồ sơ của tài khoản đang đăng nhập trong phiên làm việc hiện tại.
    2. Input / Output:
       - Input: current_user (được tiêm tự động từ dependency get_current_user).
       - Output: JSON success_response chứa {"user": {id, email, fullName, role, accountType}}.
    3. Bảng Supabase liên quan:
       - Bảng: public.users.
    4. Các bước gợi ý:
       - Step 1: Đọc current_user["id"].
       - Step 2: Truy vấn thông tin cập nhật mới nhất từ DatabaseService.get_user_by_id(user_id).
       - Step 3: Trả về success_response với payload chuẩn cho Frontend.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/auth/me")


@router.post("/guest")
def login_as_guest(response: Response):
    """
    TODO:
    1. Nhiệm vụ:
       - Khởi tạo phiên học tập tức thì cho khách vãng lai (Guest Student) không cần đăng ký tài khoản.
       - Cấp Access Token với role='student' và accountType='guest'.
    2. Input / Output:
       - Input: response (FastAPI Response để gắn Cookie).
       - Output: JSON success_response chứa {"accessToken": str, "user": {id, email, fullName, role: 'student', accountType: 'guest'}}.
    3. Bảng Supabase liên quan:
       - Không bắt buộc ghi vào users vĩnh viễn, hoặc ghi bản ghi tạm với account_type='guest'.
    4. Các bước gợi ý:
       - Step 1: Sinh UUID ngẫu nhiên: guest_id = str(uuid.uuid4()).
       - Step 2: Tạo access token với role='student', account_type='guest'.
       - Step 3: Gắn access_token vào cookie và trả về payload cho Frontend.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/auth/guest")
