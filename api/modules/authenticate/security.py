import time
from typing import Optional, Dict, Any, Tuple
import bcrypt
import jwt
from fastapi import Request
from modules.common.config import JWT_SECRET_KEY, JWT_ALGORITHM

# Hằng số thời gian sống của Token
ACCESS_TOKEN_EXPIRE_SECONDS = 15 * 60            # 15 phút
REFRESH_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60  # 7 ngày

# Dummy hash Bcrypt chuẩn bị sẵn để chống tấn công Timing Attack (cost factor = 12)
DUMMY_BCRYPT_HASH = "$2b$12$e8Y6lDkGv2X5F3K7.W4ZheoB1V2M3N4O5P6Q7R8S9T0U1V2W3X4Y6"

# ====================================================================
# 1. BCRYPT PASSWORD HASHING & VERIFICATION
# ====================================================================

def hash_password(plain_password: str) -> str:
    """
    Băm mật khẩu người dùng bằng thuật toán Bcrypt an toàn (cost factor = 12).
    Trả về chuỗi hash dạng str (bắt đầu bằng '$2b$12$...').
    """
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def is_bcrypt_hash(hash_str: str) -> bool:
    """
    Kiểm tra xem chuỗi hash có phải định dạng chuẩn Bcrypt ($2a$, $2b$, hoặc $2y$) hay không.
    """
    if not hash_str:
        return False
    return hash_str.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password_internal(plain_password: str, stored_hash: str) -> Tuple[bool, bool]:
    """
    Xác thực mật khẩu nhập vào với hash lưu trong database.
    Hỗ trợ tương thích ngược với hash demo cũ ('offbyone_demo_hash::...').
    Trả về (is_valid, needs_upgrade):
      - needs_upgrade = True nếu mật khẩu đúng nhưng hash ở định dạng cũ cần nâng cấp lên Bcrypt.
    """
    if not stored_hash:
        return False, False

    # 1. Nếu là chuẩn Bcrypt
    if is_bcrypt_hash(stored_hash):
        try:
            is_valid = bcrypt.checkpw(
                plain_password.encode("utf-8"),
                stored_hash.encode("utf-8")
            )
            return is_valid, False
        except Exception:
            return False, False

    # 2. Định dạng demo cũ (legacy format): 'offbyone_demo_hash::...'
    if stored_hash.startswith("offbyone_demo_hash::"):
        parts = stored_hash.split("::")
        # Phía frontend lưu: 'offbyone_demo_hash::password' hoặc 'offbyone_demo_hash::email::password'
        expected_raw = parts[-1]
        if plain_password == expected_raw:
            return True, True
        return False, False

    # 3. Fallback so sánh trực tiếp plain-text cũ (nếu có tài khoản chưa băm)
    if plain_password == stored_hash:
        return True, True

    return False, False


def verify_password_with_timing_mitigation(plain_password: str, stored_hash: Optional[str]) -> Tuple[bool, bool]:
    """
    Xác thực mật khẩu với kỹ thuật phòng chống Timing Attack.
    Nếu user không tồn tại (stored_hash is None), vẫn chạy một phép toán Bcrypt giả
    để thời gian phản hồi bằng nhau giữa user có và không có trong hệ thống.
    """
    if stored_hash is None:
        try:
            bcrypt.checkpw(plain_password.encode("utf-8"), DUMMY_BCRYPT_HASH.encode("utf-8"))
        except Exception:
            pass
        return False, False

    return verify_password_internal(plain_password, stored_hash)


# ====================================================================
# 2. DUAL TOKEN CREATION & VERIFICATION (ACCESS + REFRESH)
# ====================================================================

def create_access_token(user_id: str, email: str, role: str, account_type: str = "registered") -> str:
    """
    Tạo JWT Access Token ngắn hạn (15 phút) chứa thông tin định danh và vai trò.
    """
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "accountType": account_type,
        "type": "access",
        "iat": now,
        "exp": now + ACCESS_TOKEN_EXPIRE_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Tạo JWT Refresh Token dài hạn (7 ngày) dùng để cấp mới Access Token.
    """
    now = int(time.time())
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + REFRESH_TOKEN_EXPIRE_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str, expected_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Giải mã và xác thực token JWT (chữ ký hợp lệ, chưa hết hạn, đúng type).
    Trả về Dict payload nếu hợp lệ, None nếu có lỗi.
    """
    if not token or not JWT_SECRET_KEY:
        return None

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if expected_type and payload.get("type") != expected_type:
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        return None


# ====================================================================
# 3. RATE LIMITER & CLIENT IP
# ====================================================================

class LoginRateLimiter:
    """
    Bộ đếm giới hạn tần suất đăng nhập (Rate Limiter) chống tấn công dò mật khẩu (Brute-Force).
    Quản lý bộ nhớ RAM in-memory theo cặp khóa: f"{ip}:{email}".
    Quy tắc:
      - 3 lần sai liên tiếp: khóa 30 giây.
      - 5 lần sai liên tiếp trở lên: khóa 300 giây (5 phút).
    """

    def __init__(self):
        # Lưu trữ trạng thái: { key: {"failures": int, "locked_until": float} }
        self._records: Dict[str, Dict[str, Any]] = {}

    def _get_key(self, ip: str, email: str) -> str:
        return f"{ip.strip()}:{email.strip().lower()}"

    def check(self, ip: str, email: str) -> Tuple[bool, int]:
        """
        Kiểm tra trạng thái khóa.
        Trả về (is_allowed: bool, remaining_lock_seconds: int).
        """
        key = self._get_key(ip, email)
        record = self._records.get(key)
        if not record:
            return True, 0

        now = time.time()
        locked_until = record.get("locked_until", 0)
        if now < locked_until:
            remaining = int(locked_until - now) + 1
            return False, remaining

        return True, 0

    def record_failure(self, ip: str, email: str) -> Tuple[int, int]:
        """
        Ghi nhận một lần đăng nhập thất bại và áp dụng thời gian khóa tương ứng.
        Trả về (consecutive_failures, lock_seconds_applied).
        """
        key = self._get_key(ip, email)
        now = time.time()
        record = self._records.setdefault(key, {"failures": 0, "locked_until": 0})

        record["failures"] += 1
        failures = record["failures"]

        lock_seconds = 0
        if failures >= 5:
            lock_seconds = 300  # Khóa 5 phút
        elif failures >= 3:
            lock_seconds = 30   # Khóa 30 giây

        if lock_seconds > 0:
            record["locked_until"] = now + lock_seconds

        return failures, lock_seconds

    def record_success(self, ip: str, email: str) -> None:
        """
        Xóa lịch sử thất bại ngay khi người dùng đăng nhập thành công.
        """
        key = self._get_key(ip, email)
        if key in self._records:
            del self._records[key]


# Khởi tạo singleton instance cho rate limiter
login_limiter = LoginRateLimiter()


def get_client_ip(request: Request) -> str:
    """
    Trích xuất IP của Client, hỗ trợ chạy qua các Reverse Proxy (Cloudflare, Nginx,...).
    """
    # 1. Ưu tiên header X-Forwarded-For (lấy IP đầu tiên trong chuỗi nếu có proxy chuỗi)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    # 2. Thử lấy X-Real-IP
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    # 3. Fallback về IP trực tiếp của client
    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"
