from fastapi import APIRouter, UploadFile, File, HTTPException, status
from modules.common.response import success_response, error_response
from services.database.client import DatabaseService

router = APIRouter(prefix="/api/documents", tags=["Lecture & Syllabus OCR"])


@router.post("/upload")
async def upload_syllabus_document(file: UploadFile = File(...)):
    """
    TODO:
    1. Nhiệm vụ:
       - Tiếp nhận file giáo trình hoặc đề cương môn học định dạng PDF do Admin/Teacher tải lên.
       - Kiểm tra định dạng (.pdf) và giới hạn kích thước tập tin (tối đa 10MB - 25MB).
       - Trích xuất nội dung văn bản (PDF Text Parsing / OCR) qua PyPDF, pdfplumber hoặc Gemini Multimodal / Document AI.
       - Phân tích cấu trúc mục lục để bóc tách danh sách các chủ đề (Topics/Nodes), cây quan hệ tiên quyết (Prerequisites), và tạo các bài học (Tasks).
       - Lưu bản ghi tài liệu vào `public.knowledge_documents` và khởi tạo các Node vào `public.roadmap_nodes`.
    2. Input / Output:
       - Input: file: UploadFile = File(...) (multipart/form-data).
       - Output: JSON success_response chứa:
         {
             "fileName": str,
             "fileSize": str,
             "status": "ready" | "processing",
             "extractedTopicsCount": int,
             "courseTitle": str,
             "message": str
         }
       - Lỗi: 400 Bad Request nếu không phải file PDF hoặc file hỏng.
    3. Bảng Supabase liên quan:
       - public.knowledge_documents:
         + id: uuid (UUIDv4)
         + name: text (tên file gốc)
         + file_size: text (ví dụ: "2.4 MB")
         + status: text ("indexed" | "processing")
         + chunk_count: integer
       - public.roadmap_nodes:
         + id: text hoặc uuid
         + document_id: uuid (foreign key knowledge_documents.id)
         + label: text
         + short_code: text
         + target_complexity: text
    4. Các bước gợi ý:
       - Step 1: Kiểm tra đuôi file filename.lower().endswith(".pdf"). Nếu sai, trả về lỗi 400.
       - Step 2: Đọc file async `contents = await file.read()` và tính file_size_mb.
       - Step 3: Tạo bản ghi document trong `public.knowledge_documents` với status="processing".
       - Step 4: Đẩy nội dung vào dịch vụ phân tích AI (Gemini / OCR Service) để sinh cây kỹ năng và cấu trúc bài học.
       - Step 5: Lưu các node được bóc tách vào `public.roadmap_nodes`.
       - Step 6: Cập nhật status="indexed" cho document và trả về success_response.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement PDF OCR & Syllabus Extraction")
