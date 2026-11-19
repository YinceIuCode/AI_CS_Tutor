import time
import json
import base64
import hmac
import hashlib
from typing import Optional, Dict, Any, Tuple
from fastapi import Request
from modules.common.config import JWT_SECRET_KEY, JWT_ALGORITHM

# Attempt to load native bcrypt
try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    bcrypt = None
    HAS_BCRYPT = False

# Attempt to load pyjwt
try:
    import jwt
    HAS_PYJWT = True
except ImportError:
    jwt = None
    HAS_PYJWT = False

# Pre-computed valid bcrypt cost 12 dummy hash for timing attack mitigation
DUMMY_BCRYPT_HASH = "$2b$12$8Y.4e1Qy2fE07KzHj0nNweq70jL5o8mBvV2N0D1E3F4G5H6I7J8K9"

# ====================================================================
# 1. BCRYPT PASSWORD HASHING & UPGRADE LOGIC
# ====================================================================

def hash_password(plain_password: str) -> str:
    """Hash password using Bcrypt (cost factor = 12) with SHA-256 fallback."""
    if HAS_BCRYPT and bcrypt:
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")
    
    # Pure Python SHA-256 + Salt fallback
    salt_hex = hashlib.sha256(f"offbyone_salt_{time.time()}".encode()).hexdigest()[:16]
    hashed = hashlib.sha256(f"{salt_hex}{plain_password}".encode()).hexdigest()
    return f"pbkdf2_sha256$12000${salt_hex}${hashed}"

def is_bcrypt_hash(hash_str: str) -> bool:
    """Check if string matches standard bcrypt signature ($2a$, $2b$, or $2y$)."""
    if not hash_str:
        return False
    return hash_str.startswith("$2a$") or hash_str.startswith("$2b$") or hash_str.startswith("$2y$")

def verify_password_internal(plain_password: str, stored_hash: str) -> Tuple[bool, bool]:
    """
    Verifies password and checks if the hash needs upgrading to Bcrypt.
    Returns: (is_valid, needs_upgrade)
    """
    if not stored_hash:
        return False, False

    # 1. Standard Bcrypt format
    if is_bcrypt_hash(stored_hash):
        if HAS_BCRYPT and bcrypt:
            try:
                valid = bcrypt.checkpw(plain_password.encode("utf-8"), stored_hash.encode("utf-8"))
                return valid, False
            except Exception:
                return False, False
        return False, False

    # 2. Legacy seed data format: 'offbyone_demo_hash::<email>::<pass>' or 'offbyone_demo_hash::<pass>'
    if stored_hash.startswith("offbyone_demo_hash::"):
        parts = stored_hash.split("::")
        plain_in_db = parts[-1]
        if plain_in_db == plain_password:
            return True, True  # Match found, mark for automatic upgrade to Bcrypt!
        return False, False

    # 3. Old sha256 development salt format
    old_computed = "h_" + hashlib.sha256(f"algopath_salt_{plain_password}".encode("utf-8")).hexdigest()[:8]
    if stored_hash == old_computed:
        return True, True

    # 4. Fallback direct plain-text match (dev seeds)
    if stored_hash == plain_password:
        return True, True

    return False, False

def verify_password_with_timing_mitigation(plain_password: str, stored_hash: Optional[str]) -> Tuple[bool, bool]:
    """
    Executes password verification.
    If stored_hash is None (user does not exist), executes verification against
    DUMMY_BCRYPT_HASH to prevent timing attacks.
    """
    if stored_hash is None:
        if HAS_BCRYPT and bcrypt:
            try:
                bcrypt.checkpw(plain_password.encode("utf-8"), DUMMY_BCRYPT_HASH.encode("utf-8"))
            except Exception:
                pass
        else:
            hashlib.sha256(f"dummy_salt_{plain_password}".encode()).hexdigest()
        return False, False

    return verify_password_internal(plain_password, stored_hash)

# ====================================================================
# 2. DUAL TOKEN CREATION & VERIFICATION (ACCESS + REFRESH)
# ====================================================================

ACCESS_TOKEN_EXPIRE_SECONDS = 15 * 60            # 15 minutes
REFRESH_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60  # 7 days

def _encode_jwt_pure(payload_dict: Dict[str, Any]) -> str:
    """RFC7519 pure Python HS256 JWT encoder as universal fallback."""
    header = {"alg": "HS256", "typ": "JWT"}
    h_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(',', ':')).encode()).decode().rstrip("=")
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload_dict, separators=(',', ':')).encode()).decode().rstrip("=")
    signing_input = f"{h_b64}.{p_b64}".encode()
    signature = hmac.new(JWT_SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    s_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{h_b64}.{p_b64}.{s_b64}"

def _decode_jwt_pure(token: str) -> Optional[Dict[str, Any]]:
    """RFC7519 pure Python HS256 JWT decoder and verifier."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        h_b64, p_b64, s_b64 = parts
        
        # Verify signature
        padding = '=' * (4 - len(s_b64) % 4)
        sig = base64.urlsafe_b64decode(s_b64 + padding)
        expected_sig = hmac.new(JWT_SECRET_KEY.encode(), f"{h_b64}.{p_b64}".encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        
        # Decode payload
        p_padding = '=' * (4 - len(p_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(p_b64 + p_padding).decode("utf-8"))
        
        # Expiry check
        if "exp" in payload and int(time.time()) > int(payload["exp"]):
            return None
            
        return payload
    except Exception:
        return None

def create_access_token(user_id: str, email: str, role: str, account_type: str = "registered") -> str:
    """Generate short-lived 15m Access Token."""
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "accountType": account_type,
        "type": "access",
        "iat": now,
        "exp": now + ACCESS_TOKEN_EXPIRE_SECONDS
    }
    if HAS_PYJWT and jwt:
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return _encode_jwt_pure(payload)

def create_refresh_token(user_id: str) -> str:
    """Generate long-lived 7-day Refresh Token."""
    now = int(time.time())
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + REFRESH_TOKEN_EXPIRE_SECONDS
    }
    if HAS_PYJWT and jwt:
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return _encode_jwt_pure(payload)

def verify_token(token: str, expected_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT token signature and expiration."""
    if not token:
        return None
        
    payload = None
    if HAS_PYJWT and jwt:
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        except Exception:
            payload = _decode_jwt_pure(token)
    else:
        payload = _decode_jwt_pure(token)
        
    if not payload:
        return None
        
    if expected_type and payload.get("type") != expected_type:
        return None
        
    return payload

# ====================================================================
# 3. SLIDING WINDOW RATE LIMITER (KEYED BY IP + EMAIL)
# ====================================================================

class LoginRateLimiter:
    """
    In-memory Sliding Window Rate Limiter.
    - >= 3 consecutive failed attempts: 30s lock
    - >= 5 consecutive failed attempts: 300s (5m) lock
    - Reset to 0 upon successful login.
    """
    def __init__(self):
        self._attempts: Dict[str, Dict[str, Any]] = {}

    def _get_key(self, ip: str, email: str) -> str:
        norm_ip = (ip or "127.0.0.1").strip()
        norm_email = (email or "").strip().lower()
        return f"{norm_ip}:{norm_email}"

    def check(self, ip: str, email: str) -> Tuple[bool, int]:
        """
        Check if the request is permitted.
        Returns: (is_allowed, remaining_lock_seconds)
        """
        key = self._get_key(ip, email)
        entry = self._attempts.get(key)
        if not entry:
            return True, 0

        now = time.time()
        locked_until = entry.get("locked_until", 0)
        if now < locked_until:
            remaining = int(locked_until - now) + 1
            return False, remaining

        return True, 0

    def record_failure(self, ip: str, email: str) -> Tuple[int, int]:
        """
        Record a failed attempt.
        Returns: (consecutive_failures, lock_seconds_applied)
        """
        key = self._get_key(ip, email)
        now = time.time()
        entry = self._attempts.get(key)

        if not entry:
            entry = {"failures": 1, "locked_until": 0, "last_attempt": now}
            self._attempts[key] = entry
            return 1, 0

        # If previous lock expired, increment count
        entry["failures"] += 1
        entry["last_attempt"] = now
        failures = entry["failures"]

        lock_seconds = 0
        if failures >= 5:
            lock_seconds = 300  # 5 minutes
            entry["locked_until"] = now + lock_seconds
        elif failures >= 3:
            lock_seconds = 30   # 30 seconds
            entry["locked_until"] = now + lock_seconds

        return failures, lock_seconds

    def record_success(self, ip: str, email: str):
        """Reset failed attempts after a successful login."""
        key = self._get_key(ip, email)
        if key in self._attempts:
            del self._attempts[key]

# Global singleton limiter
login_limiter = LoginRateLimiter()

def get_client_ip(request: Request) -> str:
    """Extract real client IP considering reverse proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"
