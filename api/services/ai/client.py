from typing import Optional, Dict, Any
from modules.common.config import GEMINI_API_KEY


class AIService:
    """
    Service giao tiếp với mô hình AI (Google Gemini 1.5 Flash / Pro).
    Đảm nhiệm vai trò Trợ giảng Socratic AI (Socratic Tutor):
    - Đặt câu hỏi phản tư gợi mở dựa trên Invariants của cấu trúc dữ liệu.
    - Tuyệt đối tuân thủ quy tắc 'Strict Zero-Spoiler Policy': Không bao giờ cung cấp trực tiếp code lời giải.
    """

    @staticmethod
    def generate_socratic_guidance(
        topic_label: str,
        task_title: str,
        student_code: str,
        student_question: str,
        error_log: Optional[str] = None,
        socratic_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        TODO:
        1. Nhiệm vụ:
           - Tiếp nhận câu hỏi và code của sinh viên, phân tích lỗi logic hoặc hiểu lầm (misconceptions).
           - Gọi Google Gemini API để sinh câu hỏi gợi mở Socratic theo nguyên tắc 3 bậc thang (Conceptual -> Structural -> Boundary).
           - Tuyệt đối không sinh đoạn code giải quyết trọn vẹn bài toán.
        2. Input / Output:
           - Input:
             + topic_label: str (Tên chủ đề, ví dụ 'AVL Tree')
             + task_title: str (Tên bài tập, ví dụ 'Implement Right Rotation')
             + student_code: str (Mã nguồn C++ hiện tại trong trình soạn thảo)
             + student_question: str (Câu hỏi của học viên)
             + error_log: Optional[str] (Thông báo lỗi compiler hoặc SIGSEGV từ Judge)
             + socratic_profile: Optional[Dict] (Chứa keyInvariants, misconceptions, progressiveHints từ bảng roadmap_nodes)
           - Output:
             + Dict dạng: {"reply": str, "source": "gemini" | "socratic_engine"}
        3. Bảng Supabase liên quan:
           - Bảng: public.roadmap_nodes
           - Cột: socratic_profile (jsonb: chứa primarySlideReference, keyInvariants, misconceptions, progressiveHints).
        4. Các bước gợi ý:
           - Step 1: Chuẩn bị System Prompt ép buộc Gemini đóng vai Socratic Tutor, cấm đưa code đáp án trực tiếp.
           - Step 2: Định dạng User Content kết hợp topic, invariant rules từ socratic_profile, student_code và câu hỏi.
           - Step 3: Gọi API Gemini (dùng google-generativeai SDK hoặc REST endpoint https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent).
           - Step 4: Trích xuất nội dung phản hồi text từ candidates[0].content.parts[0].text và trả về kết quả.
           - Step 5: Bắt ngoại lệ Timeout / QuotaExceeded và fallback về gợi ý dựa trên socratic_profile['progressiveHints'].
        """
        raise NotImplementedError("TODO: Implement AIService.generate_socratic_guidance using Gemini API")
