from typing import Any, Optional
from fastapi.responses import JSONResponse

def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> JSONResponse:
    content = {
        "success": True,
        "message": message,
    }
    if data is not None:
        if isinstance(data, dict):
            content.update(data)
        else:
            content["data"] = data
    return JSONResponse(status_code=status_code, content=content)

def error_response(message: str = "Error occurred", status_code: int = 400, details: Optional[Any] = None) -> JSONResponse:
    content = {
        "success": False,
        "message": message,
    }
    if details:
        content["details"] = details
    return JSONResponse(status_code=status_code, content=content)
