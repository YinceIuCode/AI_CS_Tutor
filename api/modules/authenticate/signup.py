import uuid
from fastapi import APIRouter, Response, status
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
    # 1. Validation
    if not request.fullName or not request.fullName.strip():
        return error_response("Please enter your full name.", status_code=status.HTTP_400_BAD_REQUEST)

    norm_email = request.email.strip().lower()
    if not norm_email or "@" not in norm_email:
        return error_response("Please enter a valid email address.", status_code=status.HTTP_400_BAD_REQUEST)

    if len(request.password) < 8:
        return error_response("Password must contain at least 8 characters.", status_code=status.HTTP_400_BAD_REQUEST)

    if request.confirmPassword and request.password != request.confirmPassword:
        return error_response("Password confirmation does not match.", status_code=status.HTTP_400_BAD_REQUEST)

    # 2. Check if email already exists
    existing = DatabaseService.get_user_by_email(norm_email)
    if existing:
        return error_response("An account with this email already exists.", status_code=status.HTTP_400_BAD_REQUEST)

    # 3. Create user in Supabase with Bcrypt Hash
    new_user_id = str(uuid.uuid4())
    password_hash = hash_password(request.password)

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
        return error_response("Could not create user account on database.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 4. Initialize empty user_progress
    DatabaseService.upsert_user_progress({
        "user_id": new_user_id,
        "completed_tasks": {},
        "quiz_answers": {},
        "code_drafts": {},
        "hints_remaining": 3
    })

    # 5. Dual Token Generation (Access 15m, Refresh 7d)
    access_token = create_access_token(new_user_id, norm_email, "student", "registered")
    refresh_token = create_refresh_token(new_user_id)

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
        "id": new_user_id,
        "email": norm_email,
        "fullName": request.fullName.strip(),
        "role": "student",
        "accountType": "registered",
        "token": access_token
    }

    return success_response(
        {
            "user": public_user,
            "accessToken": access_token
        },
        message="Account created successfully!",
        status_code=status.HTTP_201_CREATED
    )
