from typing import Optional, Dict, Any, Callable
from fastapi import Request, HTTPException, status, Depends
from modules.authenticate.security import verify_token


def get_current_user(request: Request) -> Dict[str, Any]:
    """
    TODO:
    1. Nhiệm vụ:
       - Dependency trích xuất Access Token từ Header 'Authorization: Bearer <token>' hoặc HttpOnly Cookie 'access_token'.
       - Giải mã và xác thực JWT, trả về payload người dùng hiện tại cho các router được bảo vệ.
    2. Input / Output:
       - Input: request (FastAPI Request).
       - Output: Dict payload của user gồm {"id": str, "email": str, "role": str, "accountType": str}.
       - Ngoại lệ: Ném HTTPException(401 Unauthorized) nếu thiếu token hoặc token hết hạn.
    3. Bảng Supabase liên quan:
       - Bảng: public.users (đối chiếu ID nếu cần xác thực tính tồn tại thời gian thực).
    4. Các bước gợi ý:
       - Step 1: Lấy Authorization header -> tách chuỗi sau 'Bearer '.
       - Step 2: Nếu không có header, đọc request.cookies.get('access_token').
       - Step 3: Gọi verify_token(token, expected_type='access').
       - Step 4: Nếu không hợp lệ, raise HTTPException(status_code=401, detail='Authentication required').
       - Step 5: Trả về payload dict {id, email, role, accountType}.
    """
    raise NotImplementedError("TODO: Implement get_current_user JWT extraction & verification dependency")


def require_role(*allowed_roles: str) -> Callable:
    """
    TODO:
    1. Nhiệm vụ:
       - Factory function tạo dependency kiểm tra quyền (Role-Based Access Control - RBAC).
       - Đảm bảo người dùng phải có vai trò nằm trong danh sách allowed_roles (ví dụ 'admin', 'tutor').
    2. Input / Output:
       - Input: *allowed_roles (str, ví dụ 'admin', 'tutor').
       - Output: Dependency function nhận current_user từ get_current_user, trả về current_user hoặc raise 403 Forbidden.
    3. Bảng Supabase liên quan:
       - Bảng: public.users, Cột: role ('student' | 'tutor' | 'admin').
    4. Các bước gợi ý:
       - Step 1: Tạo hàm wrapper role_checker(current_user: Dict = Depends(get_current_user)).
       - Step 2: Kiểm tra current_user.get('role') in allowed_roles.
       - Step 3: Nếu không thỏa mãn, raise HTTPException(status_code=403, detail='Access denied').
       - Step 4: Trả về current_user.
    """
    raise NotImplementedError("TODO: Implement require_role RBAC authorization dependency")
