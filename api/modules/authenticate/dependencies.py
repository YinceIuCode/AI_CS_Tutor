from typing import Optional, Dict, Any, Callable
from fastapi import Request, HTTPException, status, Depends
from modules.authenticate.security import verify_token

def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Extracts Bearer token from Authorization header or HttpOnly cookie,
    validates the JWT, and returns the authenticated user payload.
    """
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    
    if not token:
        # Fallback to access_token cookie
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing token."
        )

    payload = verify_token(token, expected_type="access")
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token."
        )

    return {
        "id": payload["sub"],
        "email": payload.get("email", ""),
        "role": payload.get("role", "student"),
        "accountType": payload.get("accountType", "registered")
    }

def require_role(*allowed_roles: str) -> Callable:
    """
    RBAC dependency factory that validates the user's role.
    Raises 403 Forbidden if the user's role is not in allowed_roles.
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "student")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}."
            )
        return current_user

    return role_checker
