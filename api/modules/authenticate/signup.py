import uuid
from fastapi import APIRouter, Response, status
from modules.common.request import SignupRequest
from modules.common.response import success_response, error_response
from modules.authenticate.login import create_jwt_token
from modules.common.config import ACCESS_TOKEN_EXPIRE_MINUTES
from services.database.database import DatabaseService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
@router.post("/signup")
def signup(request: SignupRequest, response: Response):
    # 1. Validation
    if not request.fullName or not request.fullName.strip():
        return error_response("Vui lòng nhập họ và tên.", status_code=status.HTTP_400_BAD_REQUEST)

    norm_email = request.email.strip().lower()
    if not norm_email or "@" not in norm_email:
        return error_response("Email không hợp lệ.", status_code=status.HTTP_400_BAD_REQUEST)

    if len(request.password) < 8:
        return error_response("Mật khẩu phải chứa ít nhất 8 ký tự.", status_code=status.HTTP_400_BAD_REQUEST)

    if request.confirmPassword and request.password != request.confirmPassword:
        return error_response("Mật khẩu xác nhận không khớp.", status_code=status.HTTP_400_BAD_REQUEST)

    # 2. Check if email already exists
    existing = DatabaseService.get_user_by_email(norm_email)
    if existing:
        return error_response("Email này đã được đăng ký tài khoản.", status_code=status.HTTP_400_BAD_REQUEST)

    # 3. Create user in Supabase
    new_user_id = str(uuid.uuid4())
    password_hash = f"offbyone_demo_hash::{norm_email}::{request.password}"

    new_user = {
        "id": new_user_id,
        "email": norm_email,
        "full_name": request.fullName.strip(),
        "password_hash": password_hash,
        "role": "student",
        "account_type": "registered"
    }

    created = DatabaseService.create_user(new_user)
    if not created:
        return error_response("Không thể tạo tài khoản trên máy chủ CSDL.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 4. Initialize empty user_progress
    DatabaseService.upsert_user_progress({
        "user_id": new_user_id,
        "completed_tasks": {},
        "quiz_answers": {},
        "code_drafts": {},
        "hints_remaining": 3
    })

    # 5. Issue token & set cookie
    token = create_jwt_token(new_user_id, norm_email, "student")
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False
    )

    public_user = {
        "id": new_user_id,
        "email": norm_email,
        "fullName": request.fullName.strip(),
        "role": "student",
        "accountType": "registered",
        "token": token
    }
    return success_response({"user": public_user}, message="Đăng ký tài khoản thành công!", status_code=status.HTTP_201_CREATED)
