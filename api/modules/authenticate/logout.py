from fastapi import APIRouter, Response, status
from modules.common.response import success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/logout")
def logout(response: Response):
    """
    Xử lý đăng xuất phiên làm việc của người dùng:
    - Xóa HttpOnly Cookies (refreshToken và accessToken) trên trình duyệt.
    - Trả về thông báo thành công để Frontend dọn dẹp state và chuyển hướng về /auth.
    """
    # Xóa cả hai định dạng cookie có thể có (camelCase hoặc snake_case)
    response.delete_cookie(key="refreshToken", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="accessToken", path="/")
    response.delete_cookie(key="access_token", path="/")

    return success_response(
        data=None,
        message="Đăng xuất thành công.",
        status_code=status.HTTP_200_OK,
    )
