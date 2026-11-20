import time
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from modules.common.request import CodeRunRequest, CodeSubmitRequest
from modules.common.response import success_response, error_response
from services.database.database import DatabaseService

router = APIRouter(prefix="/api", tags=["Judge & Evaluation"])


def evaluate_cpp_code(code: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    TODO:
    1. Nhiệm vụ:
       - Biên dịch và thực thi mã nguồn C++ của học viên trong môi trường cô lập an toàn (Docker Sandbox hoặc subprocess có cgroups/timeout/RAM limit).
       - Phát hiện và phân loại lỗi: Lỗi biên dịch (Compilation Error), Lỗi thời gian chạy (Runtime Error / Segfault), Quá thời gian (Time Limit Exceeded - TLE), Quá bộ nhớ (Memory Limit Exceeded - MLE).
       - Nạp lần lượt input vào stdin của chương trình đã biên dịch, thu thập stdout và so khớp với expectedOutput.
    2. Input / Output:
       - Input:
         + code: str (chuỗi mã nguồn C++ do học viên viết).
         + test_cases: list[dict] (danh sách test cases; mỗi test case có {"id": int, "label": str, "input": str, "expectedOutput": str, "isPublic": bool}).
       - Output: dict chuẩn theo định dạng Frontend mong đợi:
         {
             "status": "success" | "failed" | "compilation_error" | "runtime_error" | "timeout",
             "passedCount": int,
             "totalCount": int,
             "metrics": {"runtimeMs": int, "memoryMb": str},
             "testCases": list[dict] (chứa {id, label, passed, actual, expected, isPublic}),
             "stdout": Optional[str],
             "errorMessage": Optional[str]
         }
    3. Bảng Supabase liên quan:
       - Hàm thuần xử lý logic biên dịch, không truy vấn database trực tiếp.
    4. Các bước gợi ý:
       - Step 1: Kiểm tra an toàn mã nguồn (chặn các lệnh nguy hiểm: <sys/socket.h>, fork, system, exec...).
       - Step 2: Lưu code vào file tạm `solution.cpp` và gọi `g++ -O2 -std=c++17 solution.cpp -o solution.exe`. Nếu có lỗi, parse stderr và trả về status="compilation_error".
       - Step 3: Với từng test case, truyền tc["input"] vào stdin và chạy solution với giới hạn thời gian (ví dụ 1000ms).
       - Step 4: So sánh stdout sau khi strip khoảng trắng thừa với expectedOutput. Ẩn actual của private test cases nếu học viên chưa giải đúng.
       - Step 5: Tính tổng số test passed, đo runtimeMs, định dạng memoryMb và trả về dict kết quả.
    """
    raise NotImplementedError("TODO: Implement Docker Sandbox C++ compilation and execution")


@router.post("/code/run")
@router.post("/evaluate")
def run_code(request: CodeRunRequest):
    """
    TODO:
    1. Nhiệm vụ:
       - Chạy thử mã nguồn C++ với các Test Cases công khai (isPublic = True).
       - Giúp học viên kiểm tra nhanh tính đúng đắn và debug trước khi nộp bài chính thức.
       - Không ghi nhận vào bảng `submissions` và không tính là hoàn thành bài học.
    2. Input / Output:
       - Input: CodeRunRequest {taskId: str, code: str, language: Optional[str] = "cpp"}
       - Output: JSON success_response chứa {status, passedCount, totalCount, metrics, testCases, stdout}
    3. Bảng Supabase liên quan:
       - public.tasks:
         + id: text hoặc uuid
         + content: jsonb (chứa content.testCases: danh sách test cases với cờ isPublic: bool).
    4. Các bước gợi ý:
       - Step 1: Lấy chi tiết task từ DatabaseService.get_task_by_id(request.taskId).
       - Step 2: Lọc danh sách test cases công khai: `[tc for tc in all_tests if tc.get("isPublic", True)]` (hoặc lấy 2 test cases đầu).
       - Step 3: Gọi hàm evaluate_cpp_code(request.code, public_tests).
       - Step 4: Trả về kết quả đánh giá qua success_response(eval_result, message="Run Code executed successfully.").
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/code/run")


@router.post("/code/submit")
def submit_code(request: CodeSubmitRequest):
    """
    TODO:
    1. Nhiệm vụ:
       - Chấm điểm mã nguồn C++ chính thức trên toàn bộ Test Cases (cả Public lẫn Hidden/Private Test Cases).
       - Ghi nhận lịch sử nộp bài vào bảng `public.submissions`.
       - Nếu vượt qua 100% test cases (status == "success"): cập nhật cờ hoàn thành task vào `public.user_progress`.
    2. Input / Output:
       - Input: CodeSubmitRequest {taskId: str, code: str, language: Optional[str] = "cpp", userId: Optional[str]}
       - Output: JSON success_response chứa verdict, metrics, testCases, isCompleted: bool, congratsMessage: str.
    3. Bảng Supabase liên quan:
       - public.tasks:
         + id: text hoặc uuid
         + task_type: text ("coding")
         + content: jsonb (chứa danh sách đầy đủ testCases)
       - public.submissions:
         + id: uuid (UUIDv4)
         + user_id: uuid (foreign key users.id)
         + task_id: text hoặc uuid (foreign key tasks.id)
         + code: text
         + language: text ("cpp")
         + status: text ("success" | "failed" | "compilation_error")
         + passed_count: integer
         + total_count: integer
         + execution_metrics: jsonb ({"runtimeMs": int, "memoryMb": str})
         + test_results: jsonb
       - public.user_progress:
         + completed_tasks: jsonb (ví dụ: { [task_id]: true })
    4. Các bước gợi ý:
       - Step 1: Lấy chi tiết task từ DatabaseService.get_task_by_id(request.taskId).
       - Step 2: Lấy toàn bộ test cases từ task content.
       - Step 3: Thực thi đánh giá qua evaluate_cpp_code(request.code, all_test_cases).
       - Step 4: Ghi bản ghi nộp bài vào bảng submissions qua DatabaseService.record_submission(...).
       - Step 5: Nếu passedCount == totalCount (status == "success"), cập nhật tiến độ user_progress.
       - Step 6: Trả về success_response kèm cờ isCompleted = True và thông báo hoàn thành.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: Implement /api/code/submit")
