from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from modules.common.request import TutorChatRequest, SaveDraftRequest
from modules.common.response import success_response, error_response
from services.ai.ai import AIService
from services.database.database import DatabaseService

router = APIRouter(prefix="/api", tags=["Socratic AI Tutor & Progress"])


@router.post("/tutor/chat")
def tutor_chat(request: TutorChatRequest):
    """
    TODO:
    1. Nhiệm vụ:
       - Trợ giảng AI đồng hành giảng dạy theo phương pháp Socratic (dẫn dắt tư duy qua câu hỏi gợi mở, tuyệt đối không viết hộ code hay đưa đáp án sẵn).
       - Tiếp nhận câu hỏi của sinh viên kèm theo ngữ cảnh: bài tập đang làm (`taskId`), mã nguồn C++ đang viết dở (`studentCode`), thông báo lỗi trình biên dịch (`errorLog`), và hồ sơ định hướng Socratic (`socratic_profile` từ node).
       - Gọi AIService.generate_socratic_guidance(...) để nhận phản hồi sư phạm phù hợp.
       - Cập nhật và kiểm soát số lượt gợi ý còn lại trong `public.user_progress`.
    2. Input / Output:
       - Input: TutorChatRequest {taskId: str, studentMessage: str, studentCode: Optional[str], errorLog: Optional[str], hintLevel: Optional[int], nodeId: Optional[str]}
       - Output: JSON success_response chứa:
         {
             "reply": str (lời giải thích, câu hỏi gợi mở của AI Tutor bằng tiếng Việt),
             "hintsRemaining": int | dict,
             "suggestedQuestions": list[str]
         }
    3. Bảng Supabase liên quan:
       - public.tasks:
         + id: text hoặc uuid
         + node_id: text hoặc uuid
         + title: text
       - public.roadmap_nodes:
         + id: text hoặc uuid
         + label: text
         + socratic_profile: jsonb (chứa common_pitfalls, guiding_questions)
       - public.user_progress:
         + user_id: uuid
         + hints_remaining: jsonb hoặc integer
    4. Các bước gợi ý:
       - Step 1: Lấy thông tin task qua DatabaseService.get_task_by_id(request.taskId) để xác định node_id.
       - Step 2: Lấy socratic_profile từ node tương ứng trong bảng roadmap_nodes.
       - Step 3: Gọi AIService.generate_socratic_guidance(topic_label, task_title, student_code, student_question, error_log, socratic_profile).
       - Step 4: Khấu trừ số lượt hint còn lại của sinh viên trong user_progress.
       - Step 5: Trả về success_response chứa lời thoại gợi mở của trợ giảng AI.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/tutor/chat")


@router.post("/progress/draft")
def save_draft(request: SaveDraftRequest):
    """
    TODO:
    1. Nhiệm vụ:
       - Tự động lưu bản nháp mã nguồn C++ (Auto-Save Draft) vào cơ sở dữ liệu khi sinh viên đang code.
       - Đảm bảo sinh viên không bị mất dữ liệu khi reload trang hoặc chuyển tab bài học.
    2. Input / Output:
       - Input: SaveDraftRequest {taskId: str, code: str, userId: Optional[str]}
       - Output: JSON success_response chứa {"taskId": str, "saved": bool}, message="Bản nháp đã lưu an toàn."
    3. Bảng Supabase liên quan:
       - public.user_progress:
         + user_id: uuid (foreign key users.id)
         + code_drafts: jsonb (dictionary dạng { [task_id]: student_code })
         + updated_at: timestamptz
    4. Các bước gợi ý:
       - Step 1: Xác định user_id (từ request hoặc JWT token).
       - Step 2: Lấy bản ghi user_progress hiện tại qua DatabaseService.get_user_progress(user_id).
       - Step 3: Cập nhật code_drafts[request.taskId] = request.code.
       - Step 4: Ghi lại vào Supabase qua DatabaseService.upsert_user_progress(...).
       - Step 5: Trả về success_response xác nhận bản nháp đã được lưu.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/progress/draft")
