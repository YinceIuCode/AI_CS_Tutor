from typing import Optional, Dict, Any, Callable
from fastapi import Request, HTTPException, status, Depends
from modules.authenticate.security import verify_token


def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Dependency trích xuất Access Token từ Header 'Authorization: Bearer <token>'
    hoặc HttpOnly Cookie 'accessToken' / 'access_token'.
    Giải mã và xác thực JWT, trả về payload thông tin user cho các router được bảo vệ.
    """
    token: Optional[str] = None

    # Step 1: Lấy token từ header Authorization
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()

    # Step 2: Nếu không có trong header, đọc từ cookie (hỗ trợ cả accessToken và access_token)
    if not token:
        token = request.cookies.get("accessToken") or request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3: Xác thực JWT token
    payload = verify_token(token, expected_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 4: Trả về payload chuẩn
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role", "student"),
        "accountType": payload.get("accountType", "registered"),
    }


def require_role(*allowed_roles: str) -> Callable:
    """
    Factory function tạo dependency kiểm tra quyền (Role-Based Access Control - RBAC).
    Đảm bảo người dùng phải có vai trò nằm trong danh sách allowed_roles.
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {list(allowed_roles)}",
            )
        return current_user

    return role_checker
