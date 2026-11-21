import re
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
from services.database.client import DatabaseService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w\.-]+\.)+[\w-]{2,4}$")


@router.post("/register")
@router.post("/signup")
def signup(request: SignupRequest, response: Response):
    """
    Xử lý đăng ký tài khoản người dùng mới:
    1. Validate dữ liệu đầu vào (fullName, email hợp lệ, độ dài mật khẩu >= 8, confirmPassword khớp).
    2. Kiểm tra email đã tồn tại hay chưa.
    3. Mã hóa mật khẩu bằng bcrypt.
    4. Lưu bản ghi tài khoản vào Supabase (public.users).
    5. Khởi tạo bản ghi tiến độ rỗng (public.user_progress).
    6. Tạo cặp Token kép (Access Token 15 phút, Refresh Token 7 ngày) và set HttpOnly Cookie.
    7. Trả về thông tin user và accessToken theo định dạng chuẩn của frontend.
    """
    # ---------------------------------------------------------
    # Bước 1: Validate dữ liệu đầu vào
    # ---------------------------------------------------------
    full_name = request.fullName.strip()
    if not full_name:
        return error_response(
            message="Họ và tên không được để trống.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    email = request.email.strip().lower()
    if not email or not EMAIL_REGEX.match(email):
        return error_response(
            message="Địa chỉ email không hợp lệ.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    password = request.password
    if len(password) < 8:
        return error_response(
            message="Mật khẩu phải có tối thiểu 8 ký tự.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Nếu người dùng có gửi confirmPassword thì bắt buộc phải trùng khớp
    if request.confirmPassword is not None and request.confirmPassword != password:
        return error_response(
            message="Mật khẩu xác nhận không trùng khớp.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # Bước 2: Kiểm tra email đã tồn tại chưa
    # ---------------------------------------------------------
    existing_user = DatabaseService.get_user_by_email(email)
    if existing_user:
        return error_response(
            message="Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # Bước 3: Mã hóa mật khẩu & chuẩn bị dữ liệu
    # ---------------------------------------------------------
    new_user_id = str(uuid.uuid4())
    pw_hash = hash_password(password)

    new_user_data = {
        "id": new_user_id,
        "email": email,
        "full_name": full_name,
        "password_hash": pw_hash,
        "role": "student",
        "account_type": "registered",
    }

    # ---------------------------------------------------------
    # Bước 4: Lưu user vào Supabase
    # ---------------------------------------------------------
    created_user = DatabaseService.create_user(new_user_data)
    if not created_user:
        return error_response(
            message="Không thể tạo tài khoản trên cơ sở dữ liệu. Vui lòng thử lại sau.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ---------------------------------------------------------
    # Bước 5: Khởi tạo bảng tiến độ học tập (user_progress)
    # ---------------------------------------------------------
    initial_progress = {
        "user_id": new_user_id,
        "completed_tasks": {},
        "quiz_answers": {},
        "code_drafts": {},
        "hints_remaining": 3,
    }
    DatabaseService.upsert_user_progress(initial_progress)

    # ---------------------------------------------------------
    # Bước 6: Cấp cặp JWT Tokens & Thiết lập HttpOnly Cookie
    # ---------------------------------------------------------
    access_token = create_access_token(
        user_id=new_user_id,
        email=email,
        role="student",
        account_type="registered",
    )
    refresh_token = create_refresh_token(user_id=new_user_id)

    # Gắn Refresh Token vào HttpOnly cookie để chống XSS
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,  # Đổi True nếu chạy trên production HTTPS
    )

    # Gắn Access Token vào Cookie (hỗ trợ trình duyệt tự gửi kèm)
    response.set_cookie(
        key="accessToken",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,
    )

    # ---------------------------------------------------------
    # Bước 7: Trả về kết quả cho Frontend (HTTP 201 Created)
    # ---------------------------------------------------------
    user_payload = {
        "id": new_user_id,
        "email": email,
        "fullName": full_name,
        "role": "student",
        "accountType": "registered",
    }

    return success_response(
        data={
            "accessToken": access_token,
            "user": user_payload,
        },
        message="Đăng ký tài khoản thành công.",
        status_code=status.HTTP_201_CREATED,
    )
