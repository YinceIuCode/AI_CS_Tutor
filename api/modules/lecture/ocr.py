from fastapi import APIRouter, UploadFile, File, status
from modules.common.response import success_response, error_response

router = APIRouter(prefix="/api/documents", tags=["Lecture & Syllabus OCR"])

@router.post("/upload")
async def upload_syllabus_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        return error_response("Vui lòng tải lên file định dạng PDF (.pdf).", status_code=status.HTTP_400_BAD_REQUEST)

    contents = await file.read()
    file_size_mb = round(len(contents) / (1024 * 1024), 2)

    # In production: OCR / PyPDF2 / Gemini RAG Extraction
    extracted_summary = {
        "fileName": file.filename,
        "fileSize": f"{file_size_mb} MB",
        "status": "ready",
        "extractedTopicsCount": 10,
        "courseTitle": "Data Structures & Algorithms",
        "message": "Giáo trình đã được AI phân tích và tạo cây lộ trình 10 kỹ năng thành công!"
    }

    return success_response(extracted_summary)
