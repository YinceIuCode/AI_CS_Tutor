from fastapi import HTTPException, status

class AppException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Invalid credentials or session expired"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)

class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)
