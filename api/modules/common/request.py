from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ====================================================================
# AUTHENTICATION REQUESTS & MODELS
# ====================================================================

class LoginRequest(BaseModel):
    email: str = Field(..., example="student@offbyone.demo", description="Email đăng nhập của người dùng")
    password: str = Field(..., example="Demo1234", description="Mật khẩu tài khoản (tối thiểu 8 ký tự)")


class SignupRequest(BaseModel):
    fullName: str = Field(..., example="Nguyen Van A", description="Họ và tên đầy đủ của học viên/giảng viên")
    email: str = Field(..., example="student@offbyone.demo", description="Email duy nhất trong hệ thống")
    password: str = Field(..., example="Demo1234", description="Mật khẩu tài khoản (tối thiểu 8 ký tự)")
    confirmPassword: Optional[str] = Field(None, example="Demo1234", description="Xác nhận lại mật khẩu")


class RefreshRequest(BaseModel):
    refreshToken: Optional[str] = Field(None, description="Refresh token dạng chuỗi (nếu không dùng cookie HttpOnly)")


# ====================================================================
# CODING & JUDGE REQUESTS
# ====================================================================

class CodeRunRequest(BaseModel):
    taskId: str = Field(..., example="avl-tree-task-3", description="ID của task coding cần chạy thử")
    code: str = Field(..., example="#include <iostream>\nint main() { return 0; }", description="Mã nguồn C++ do học viên soạn thảo")
    language: str = Field("C++", example="C++", description="Ngôn ngữ lập trình (mặc định C++)")


class CodeSubmitRequest(BaseModel):
    taskId: str = Field(..., example="avl-tree-task-3", description="ID của task coding cần chấm điểm chính thức")
    code: str = Field(..., example="#include <iostream>\nint main() { return 0; }", description="Mã nguồn C++ hoàn chỉnh nộp bài")
    language: str = Field("C++", example="C++", description="Ngôn ngữ lập trình")


# ====================================================================
# QUIZ REQUESTS
# ====================================================================

class QuizEvaluateRequest(BaseModel):
    taskId: str = Field(..., example="avl-tree-task-2", description="ID của bài tập trắc nghiệm Socratic Quiz")
    selectedOption: str = Field(..., example="A", description="Mã phương án học viên chọn (A, B, C, hoặc D)")


# ====================================================================
# SOCRATIC AI TUTOR REQUESTS
# ====================================================================

class TutorChatRequest(BaseModel):
    nodeId: Optional[str] = Field("avl-tree", example="avl-tree", description="ID của node kiến thức đang học")
    taskId: str = Field(..., example="avl-tree-task-3", description="ID của task hiện tại")
    studentCode: Optional[str] = Field("", description="Mã nguồn hiện tại trong Monaco Editor của học viên")
    studentMessage: str = Field(..., example="Tại sao đoạn code xoay cây của em bị lỗi Segmentation fault?", description="Câu hỏi hoặc thắc mắc của học viên")
    errorLog: Optional[str] = Field(None, description="Chi tiết thông báo lỗi compiler/runtime nếu có")


# ====================================================================
# USER PROGRESS & DRAFT REQUESTS
# ====================================================================

class SaveDraftRequest(BaseModel):
    taskId: str = Field(..., example="avl-tree-task-3", description="ID của task coding cần lưu nháp")
    code: str = Field(..., description="Nội dung mã nguồn nháp cần lưu trữ an toàn")
    language: str = Field("C++", example="C++", description="Ngôn ngữ lập trình")


class UpdateProgressRequest(BaseModel):
    completedTasks: Optional[Dict[str, bool]] = Field(default_factory=dict, description="Map task_id -> boolean đã hoàn thành")
    quizAnswers: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Lịch sử trả lời các câu hỏi Quiz")
    codeDrafts: Optional[Dict[str, str]] = Field(default_factory=dict, description="Bản nháp code tự động lưu của học viên")
    hintsRemaining: Optional[Dict[str, int]] = Field(default_factory=dict, description="Số lượt gợi ý Socratic còn lại theo từng task")
    roadmapFlowState: Optional[str] = Field("ready", example="ready", description="Trạng thái hiển thị roadmap ('empty' hoặc 'ready')")
    fileName: Optional[str] = Field(None, example="CS101_DSA_Syllabus_HCMUS.pdf", description="Tên file giáo trình đang active")
    fileSize: Optional[str] = Field(None, example="2.4 MB", description="Dung lượng file giáo trình")
