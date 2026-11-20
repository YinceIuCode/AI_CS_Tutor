from typing import Optional, Dict, Any, Tuple
from fastapi import Request
from modules.common.config import JWT_SECRET_KEY, JWT_ALGORITHM

# Hằng số thời gian sống của Token
ACCESS_TOKEN_EXPIRE_SECONDS = 15 * 60            # 15 phút
REFRESH_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60  # 7 ngày


# ====================================================================
# 1. BCRYPT PASSWORD HASHING & VERIFICATION
# ====================================================================

def hash_password(plain_password: str) -> str:
    """
    TODO:
    1. Nhiệm vụ: Băm mật khẩu người dùng bằng thuật toán Bcrypt an toàn (cost factor = 12).
    2. Input / Output:
       - Input: plain_password (str, ví dụ 'Demo1234').
       - Output: Chuỗi hash dạng Bcrypt (str, bắt đầu bằng '$2b$12$...').
    3. Bảng Supabase liên quan:
       - Bảng: public.users, Cột: password_hash.
    4. Các bước gợi ý:
       - Step 1: Encode plain_password sang bytes UTF-8.
       - Step 2: Dùng bcrypt.gensalt(rounds=12) sinh muối ngẫu nhiên.
       - Step 3: Dùng bcrypt.hashpw(password_bytes, salt) và decode UTF-8 để lưu vào database.
    """
    raise NotImplementedError("TODO: Implement hash_password using bcrypt")


def is_bcrypt_hash(hash_str: str) -> bool:
    """
    TODO:
    1. Nhiệm vụ: Kiểm tra xem chuỗi hash trong database có phải định dạng chuẩn Bcrypt hay không.
    2. Input / Output:
       - Input: hash_str (str).
       - Output: bool (True nếu bắt đầu bằng '$2a$', '$2b$', hoặc '$2y$', ngược lại False).
    3. Bảng Supabase liên quan:
       - Bảng: public.users, Cột: password_hash.
    4. Các bước gợi ý:
       - Step 1: Kiểm tra hash_str có rỗng không.
       - Step 2: So khớp tiền tố '$2a$', '$2b$', '$2y$'.
    """
    raise NotImplementedError("TODO: Implement is_bcrypt_hash check")


def verify_password_internal(plain_password: str, stored_hash: str) -> Tuple[bool, bool]:
    """
    TODO:
    1. Nhiệm vụ: Xác thực mật khẩu nhập vào với hash lưu trong database, đồng thời kiểm tra có cần nâng cấp hash cũ lên Bcrypt không.
    2. Input / Output:
       - Input: plain_password (str), stored_hash (str).
       - Output: Tuple[bool, bool] -> (is_valid: bool, needs_upgrade: bool).
    3. Bảng Supabase liên quan:
       - Bảng: public.users, Cột: password_hash.
    4. Các bước gợi ý:
       - Step 1: Nếu stored_hash là bcrypt: dùng bcrypt.checkpw(plain.encode(), hash.encode()) -> return (valid, False).
       - Step 2: Nếu stored_hash là định dạng cũ ('offbyone_demo_hash::...'): kiểm tra khớp -> return (True, True) để kích hoạt nâng cấp.
       - Step 3: Ngược lại return (False, False).
    """
    raise NotImplementedError("TODO: Implement verify_password_internal with legacy format migration")


def verify_password_with_timing_mitigation(plain_password: str, stored_hash: Optional[str]) -> Tuple[bool, bool]:
    """
    TODO:
    1. Nhiệm vụ: Xác thực mật khẩu với kỹ thuật phòng chống tấn công Timing Attack.
       Khi user không tồn tại trong database (stored_hash = None), vẫn thực hiện một phép tính toán Bcrypt giả
       để kẻ tấn công không thể phân biệt user có tồn tại hay không thông qua thời gian phản hồi API.
    2. Input / Output:
       - Input: plain_password (str), stored_hash (Optional[str]).
       - Output: Tuple[bool, bool] -> (is_valid, needs_upgrade).
    3. Bảng Supabase liên quan:
       - Bảng: public.users.
    4. Các bước gợi ý:
       - Step 1: Nếu stored_hash is None: chạy bcrypt.checkpw với dummy hash dựng sẵn rồi trả về (False, False).
       - Step 2: Nếu có stored_hash: gọi verify_password_internal(plain_password, stored_hash).
    """
    raise NotImplementedError("TODO: Implement verify_password_with_timing_mitigation against timing attacks")


# ====================================================================
# 2. DUAL TOKEN CREATION & VERIFICATION (ACCESS + REFRESH)
# ====================================================================

def create_access_token(user_id: str, email: str, role: str, account_type: str = "registered") -> str:
    """
    TODO:
    1. Nhiệm vụ: Tạo JWT Access Token ngắn hạn (thời hạn 15 phút) chứa thông tin định danh và vai trò của người dùng.
    2. Input / Output:
       - Input: user_id (str uuid), email (str), role (str: 'student' | 'tutor' | 'admin'), account_type (str).
       - Output: Chuỗi JWT Access Token (str).
    3. Bảng Supabase liên quan:
       - Bảng: public.users (cung cấp id, email, role, account_type).
    4. Các bước gợi ý:
       - Step 1: Chuẩn bị claims payload: sub = user_id, email = email, role = role, accountType = account_type, type = 'access', iat, exp = now + 15m.
       - Step 2: Ký token bằng jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM).
       - Step 3: Trả về chuỗi JWT đã ký.
    """
    raise NotImplementedError("TODO: Implement create_access_token with JWT")


def create_refresh_token(user_id: str) -> str:
    """
    TODO:
    1. Nhiệm vụ: Tạo JWT Refresh Token dài hạn (thời hạn 7 ngày) dùng để cấp mới Access Token mà không cần đăng nhập lại.
    2. Input / Output:
       - Input: user_id (str uuid).
       - Output: Chuỗi JWT Refresh Token (str).
    3. Bảng Supabase liên quan:
       - Bảng: public.users (cột id).
    4. Các bước gợi ý:
       - Step 1: Chuẩn bị payload: sub = user_id, type = 'refresh', iat, exp = now + 7 days.
       - Step 2: Ký token bằng jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM).
       - Step 3: Trả về chuỗi token.
    """
    raise NotImplementedError("TODO: Implement create_refresh_token with JWT")


def verify_token(token: str, expected_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    TODO:
    1. Nhiệm vụ: Giải mã và xác thực tính hợp lệ của chữ ký JWT và thời hạn hết hạn (exp).
    2. Input / Output:
       - Input: token (str), expected_type (Optional[str]: 'access' hoặc 'refresh').
       - Output: Dict payload đã giải mã nếu hợp lệ, hoặc None nếu token sai chữ ký, hết hạn hoặc sai type.
    3. Bảng Supabase liên quan:
       - Không truy vấn DB trực tiếp (Stateless verification qua JWT Secret).
    4. Các bước gợi ý:
       - Step 1: Gọi jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]).
       - Step 2: Kiểm tra payload.get('type') == expected_type (nếu có yêu cầu).
       - Step 3: Trả về payload dict, bắt lỗi ExpiredSignatureError / InvalidTokenError và trả về None.
    """
    raise NotImplementedError("TODO: Implement verify_token with signature & expiry checks")


# ====================================================================
# 3. RATE LIMITER & CLIENT IP
# ====================================================================

class LoginRateLimiter:
    """
    Bộ đếm giới hạn tần suất đăng nhập (Rate Limiter) chống tấn công dò mật khẩu (Brute-Force).
    Khóa tạm thời theo cặp khóa (Client IP, Email).
    """

    def check(self, ip: str, email: str) -> Tuple[bool, int]:
        """
        TODO:
        1. Nhiệm vụ: Kiểm tra xem IP và Email này có đang bị khóa đăng nhập hay không.
        2. Input / Output:
           - Input: ip (str), email (str).
           - Output: Tuple[bool, int] -> (is_allowed, remaining_lock_seconds).
        3. Bảng Supabase liên quan:
           - Lưu bộ nhớ RAM (In-memory) hoặc Redis cache.
        4. Các bước gợi ý:
           - Step 1: Tra cứu entry theo key = f"{ip}:{email}".
           - Step 2: Nếu now < locked_until: return (False, remaining_seconds).
           - Step 3: Ngược lại return (True, 0).
        """
        raise NotImplementedError("TODO: Implement LoginRateLimiter.check")

    def record_failure(self, ip: str, email: str) -> Tuple[int, int]:
        """
        TODO:
        1. Nhiệm vụ: Ghi nhận 1 lần đăng nhập thất bại. Nếu >= 3 lần: khóa 30s; nếu >= 5 lần: khóa 300s (5 phút).
        2. Input / Output:
           - Input: ip (str), email (str).
           - Output: Tuple[int, int] -> (consecutive_failures, lock_seconds_applied).
        3. Bảng Supabase liên quan: In-memory tracker hoặc Redis.
        4. Các bước gợi ý:
           - Step 1: Tăng số lần failures += 1.
           - Step 2: Tính toán thời gian khóa locked_until tương ứng.
           - Step 3: Trả về (failures, lock_seconds).
        """
        raise NotImplementedError("TODO: Implement LoginRateLimiter.record_failure")

    def record_success(self, ip: str, email: str) -> None:
        """
        TODO:
        1. Nhiệm vụ: Xóa bỏ lịch sử thất bại và mở khóa ngay khi đăng nhập thành công.
        2. Input / Output: Input ip (str), email (str). Output: None.
        3. Bảng Supabase liên quan: In-memory tracker.
        4. Các bước gợi ý:
           - Step 1: Xóa entry f"{ip}:{email}" khỏi bộ nhớ tracker.
        """
        raise NotImplementedError("TODO: Implement LoginRateLimiter.record_success")


# Khởi tạo singleton instance cho rate limiter
login_limiter = LoginRateLimiter()


def get_client_ip(request: Request) -> str:
    """
    TODO:
    1. Nhiệm vụ: Trích xuất chính xác địa chỉ IP của Client, tính đến các tầng Reverse Proxy (X-Forwarded-For, X-Real-IP).
    2. Input / Output:
       - Input: request (FastAPI Request).
       - Output: str IP (ví dụ '127.0.0.1' hoặc '14.161.x.x').
    3. Bảng Supabase liên quan: Không.
    4. Các bước gợi ý:
       - Step 1: Kiểm tra request.headers.get("x-forwarded-for") -> lấy IP đầu tiên.
       - Step 2: Kiểm tra request.headers.get("x-real-ip").
       - Step 3: Fallback về request.client.host.
    """
    raise NotImplementedError("TODO: Implement get_client_ip resolving proxy headers")
