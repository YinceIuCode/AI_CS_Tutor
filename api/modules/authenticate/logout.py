from fastapi import APIRouter, Response
from modules.common.response import success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="access_token", path="/")
    return success_response(message="Logged out successfully.")
