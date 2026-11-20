import uuid
from fastapi import APIRouter, Response, HTTPException, status
from modules.common.request import SignupRequest
from modules.common.response import success_response, error_response
from modules.authenticate.security import (
    hash_password,
    create_access_token,
    create_refresh_token,
    REFRESH_TOKEN_EXPIRE_SECONDS,
    ACCESS_TOKEN_EXPIRE_SECONDS,
)
from services.database.database import DatabaseService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
@router.post("/signup")
def signup(request: SignupRequest, response: Response):
    """
    TODO:
    1. Nhiệm vụ:
       - Đăng ký tài khoản người dùng mới (vai trò mặc định: student, loại tài khoản: registered).
       - Validate định dạng dữ liệu (email hợp lệ, mật khẩu >= 8 ký tự, mật khẩu xác nhận trùng khớp).
       - Kiểm tra email chưa tồn tại trong hệ thống.
       - Mã hóa mật khẩu bằng bcrypt và lưu tài khoản mới vào database Supabase.
       - Khởi tạo bản ghi tiến độ rỗng (user_progress) cho tài khoản mới.
       - Cấp cặp Token kép (Access Token 15 phút, Refresh Token 7 ngày), gán HttpOnly Cookie và trả về thông tin user.
    2. Input / Output:
       - Input: SignupRequest {fullName: str, email: str, password: str, confirmPassword: Optional[str]}, response: Response.
       - Output: JSON success_response chứa {"user": {id, email, fullName, role, accountType, token}, "accessToken": str}, HTTP 201 Created.
       - Lỗi: 400 Bad Request (dữ liệu không hợp lệ hoặc email đã tồn tại), 500 Internal Server Error (lỗi ghi database).
    3. Bảng Supabase liên quan:
       - public.users:
         + id: uuid (UUIDv4)
         + email: text (unique, lowercase)
         + full_name: text
         + password_hash: text (bcrypt hash $2b$12$...)
         + role: text ("student")
         + account_type: text ("registered")
       - public.user_progress:
         + user_id: uuid (foreign key users.id)
         + completed_tasks: jsonb (mặc định {})
         + quiz_answers: jsonb (mặc định {})
         + code_drafts: jsonb (mặc định {})
         + hints_remaining: jsonb hoặc integer (mặc định 3 hoặc {"current": 3, "max": 3})
    4. Các bước gợi ý:
       - Step 1: Validate đầu vào (fullName không rỗng, email hợp lệ, len(password) >= 8, password == confirmPassword).
       - Step 2: Gọi DatabaseService.get_user_by_email(email). Nếu tồn tại -> trả về 400.
       - Step 3: Tạo new_user_id = str(uuid.uuid4()), hash mật khẩu qua hash_password(password).
       - Step 4: Tạo record user trong public.users qua DatabaseService.create_user(new_user).
       - Step 5: Khởi tạo user_progress rỗng qua DatabaseService.upsert_user_progress(...).
       - Step 6: Tạo access_token và refresh_token, gắn cookie httponly vào response.
       - Step 7: Trả về success_response với HTTP 201 Created.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/auth/register")
