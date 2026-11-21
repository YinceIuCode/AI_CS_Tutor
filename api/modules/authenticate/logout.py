from fastapi import APIRouter, Response, HTTPException, status
from modules.common.response import success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/logout")
def logout(response: Response):
    """
    TODO:
    1. Nhiệm vụ:
       - Xử lý đăng xuất phiên làm việc của người dùng.
       - Xóa HttpOnly Cookies (refresh_token và access_token) trên trình duyệt bằng cách xóa cookie hoặc set expire ngay lập tức.
       - Trả về thông báo thành công để client Frontend dọn dẹp bộ nhớ state.
    2. Input / Output:
       - Input: response: Response
       - Output: JSON success_response(message="Logged out successfully.")
    3. Bảng Supabase liên quan:
       - Không can thiệp trực tiếp database (nếu phát triển mở rộng: có thể lưu Refresh Token Blacklist vào bảng sessions hoặc Redis để thu hồi sớm).
    4. Các bước gợi ý:
       - Step 1: Gọi response.delete_cookie(key="refresh_token", path="/")
       - Step 2: Gọi response.delete_cookie(key="access_token", path="/")
       - Step 3: Trả về success_response(message="Logged out successfully.")
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/auth/logout")
