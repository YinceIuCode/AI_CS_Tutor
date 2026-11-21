import copy
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from modules.common.request import QuizEvaluateRequest
from modules.common.response import success_response, error_response
from services.database.database import DatabaseService

router = APIRouter(prefix="/api", tags=["Roadmap & Lectures"])


@router.get("/roadmap")
def get_roadmap(document_id: Optional[str] = None):
    """
    TODO:
    1. Nhiệm vụ:
       - Lấy toàn bộ cây kỹ năng học tập (Roadmap Nodes) kèm danh sách các bài học (Tasks) của từng Node.
       - Hỗ trợ lọc danh sách theo `document_id` (nếu truyền) hoặc mặc định tải tài liệu CS101 DSA (`00000005-0000-4000-8000-000000000001`).
       - Chuẩn hóa cấu trúc node và tasks theo đúng schema định dạng Frontend mong đợi (camelCase).
    2. Input / Output:
       - Input: document_id: Optional[str] = None (Query Parameter).
       - Output: JSON success_response chứa:
         {
             "courseTitle": str,
             "nodes": list[dict] (mỗi node gồm id, shortCode, label, description, complexity, prerequisites, totalTasks, completedTasks, progress, status, tasks, socraticProfile),
             "documentMeta": {"name": str, "size": str, "status": str}
         }
    3. Bảng Supabase liên quan:
       - public.knowledge_documents:
         + id: uuid (UUIDv4)
         + name: text
         + file_size: text
         + status: text
       - public.roadmap_nodes:
         + id: text hoặc uuid
         + document_id: uuid (foreign key knowledge_documents.id)
         + label: text
         + short_code: text
         + description: text
         + target_complexity: text (ví dụ: "O(1)", "O(log N)", "O(N)")
         + prerequisites: jsonb hoặc text[] (danh sách ID node tiên quyết)
         + socratic_profile: jsonb
       - public.tasks:
         + id: text hoặc uuid
         + node_id: text hoặc uuid
         + title: text
         + description: text
         + task_type: text ("theory" | "quiz" | "coding")
         + order_index: integer
    4. Các bước gợi ý:
       - Step 1: Lấy danh sách nodes từ DatabaseService.get_roadmap_nodes(document_id).
       - Step 2: Lấy danh sách tasks từ DatabaseService.get_tasks_for_roadmap().
       - Step 3: Nhóm tasks theo node_id và gắn danh sách tasks vào từng node.
       - Step 4: Map các trường sang định dạng camelCase (target_complexity -> complexity, short_code -> shortCode).
       - Step 5: Trả về success_response với courseTitle, nodes, và documentMeta.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/roadmap")


@router.get("/tasks/{task_id}")
def get_task_detail(task_id: str):
    """
    TODO:
    1. Nhiệm vụ:
       - Lấy chi tiết nội dung của 1 bài học (Task) cụ thể để hiển thị trên Workspace (Core Theory, Quiz, Coding Challenge).
       - BẢO MẬT DỮ LIỆU ĐỀ THI (CRITICAL SECURITY):
         + Nếu task_type == 'quiz': Lọc bỏ cờ `isCorrect` trong options và ẩn `explanation` để học viên không xem trước đáp án qua Inspect Element.
         + Nếu task_type == 'coding': Lọc bỏ các Test Cases bí mật (chỉ trả về các test case có isPublic: true).
    2. Input / Output:
       - Input: task_id: str (Path Parameter).
       - Output: JSON success_response chứa {id, nodeId, title, type, ...content đã làm sạch}.
       - Lỗi: 404 Not Found nếu task không tồn tại.
    3. Bảng Supabase liên quan:
       - public.tasks:
         + id: text hoặc uuid
         + node_id: text hoặc uuid
         + title: text
         + task_type: text ("theory" | "quiz" | "coding")
         + content: jsonb (chứa toàn bộ nội dung lý thuyết, câu hỏi quiz, code starter và test cases)
    4. Các bước gợi ý:
       - Step 1: Lấy dữ liệu task qua DatabaseService.get_task_by_id(task_id). Nếu không tìm thấy, trả về 404.
       - Step 2: Tạo deep copy nội dung content.
       - Step 3: Nếu task_type là "quiz": duyệt qua options xóa trường `isCorrect`, xóa trường `explanation`.
       - Step 4: Nếu task_type là "coding": lọc `testCases = [tc for tc in testCases if tc.get('isPublic', True)]`.
       - Step 5: Trả về success_response chứa thông tin task và content an toàn.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/tasks/{task_id}")


@router.post("/quiz/evaluate")
def evaluate_quiz(request: QuizEvaluateRequest):
    """
    TODO:
    1. Nhiệm vụ:
       - Chấm điểm câu hỏi trắc nghiệm khách quan tại server để chống gian lận.
       - So khớp phương án học viên chọn (selectedOption) với đáp án đúng lưu an toàn trong database.
       - Trả về kết quả đúng/sai cùng lời giải thích chi tiết.
    2. Input / Output:
       - Input: QuizEvaluateRequest {taskId: str, selectedOption: str}
       - Output: JSON success_response chứa {isCorrect: bool, selectedOption: str, correctOption: Optional[str], explanation: str}
       - Lỗi: 404 Not Found nếu task không tồn tại.
    3. Bảng Supabase liên quan:
       - public.tasks:
         + id: text hoặc uuid
         + task_type: text ("quiz")
         + content: jsonb (options: [{id, text, isCorrect}], explanation: text)
    4. Các bước gợi ý:
       - Step 1: Lấy task qua DatabaseService.get_task_by_id(request.taskId).
       - Step 2: Tìm option có isCorrect == True trong content.options.
       - Step 3: So sánh request.selectedOption với option đúng.
       - Step 4: Trả về success_response với kết quả thẩm định isCorrect và explanation.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/quiz/evaluate")


@router.get("/progress/{user_id}")
def get_user_progress(user_id: str):
    """
    TODO:
    1. Nhiệm vụ:
       - Lấy trạng thái tiến độ học tập hiện tại của người dùng theo `user_id`.
       - Bao gồm: bài học đã hoàn thành (`completedTasks`), câu trả lời quiz (`quizAnswers`), bản nháp code (`codeDrafts`), và số lượt gợi ý còn lại (`hintsRemaining`).
    2. Input / Output:
       - Input: user_id: str (Path Parameter).
       - Output: JSON success_response chứa:
         {
             "userId": str,
             "completedTasks": dict,
             "quizAnswers": dict,
             "codeDrafts": dict,
             "hintsRemaining": dict | int,
             "updatedAt": Optional[str]
         }
    3. Bảng Supabase liên quan:
       - public.user_progress:
         + user_id: uuid (foreign key users.id)
         + completed_tasks: jsonb
         + quiz_answers: jsonb
         + code_drafts: jsonb
         + hints_remaining: jsonb hoặc integer
         + roadmap_flow_state: jsonb
         + updated_at: timestamptz
    4. Các bước gợi ý:
       - Step 1: Lấy tiến độ qua DatabaseService.get_user_progress(user_id).
       - Step 2: Nếu chưa có bản ghi (học viên mới), trả về các trường mặc định là dict rỗng `{}`.
       - Step 3: Map các trường sang định dạng camelCase và trả về success_response.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement GET /api/progress/{user_id}")


@router.put("/progress/{user_id}")
def update_user_progress(user_id: str, payload: Dict[str, Any]):
    """
    TODO:
    1. Nhiệm vụ:
       - Đồng bộ và lưu đè tiến độ học tập của người dùng lên Supabase khi học viên hoàn thành bài tập, chọn quiz, hoặc lưu bản nháp.
    2. Input / Output:
       - Input: user_id: str (Path Parameter), payload: Dict[str, Any] (chứa completedTasks, quizAnswers, codeDrafts, hintsRemaining).
       - Output: JSON success_response chứa {"status": "synced", "userId": str}.
    3. Bảng Supabase liên quan:
       - public.user_progress:
         + user_id: uuid
         + completed_tasks: jsonb
         + quiz_answers: jsonb
         + code_drafts: jsonb
         + hints_remaining: jsonb hoặc integer
         + updated_at: timestamptz (tự động cập nhật now())
    4. Các bước gợi ý:
       - Step 1: Trích xuất các trường từ payload và chuẩn hóa sang format snake_case của Supabase.
       - Step 2: Gọi DatabaseService.upsert_user_progress(progress_data).
       - Step 3: Trả về success_response xác nhận đồng bộ hoàn tất.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement PUT /api/progress/{user_id}")
