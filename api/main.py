import os
from pathlib import Path
from dotenv import load_dotenv # type: ignore
from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel # type: ignore
from supabase import create_client, Client # type: ignore

# Đọc file .env (tìm trong thư mục api/ hoặc thư mục hiện tại)
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

app = FastAPI()

# Bật CORS cho phép Next.js (port 3000) hoặc React (port 5173) truy cập
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kết nối Supabase bằng Service Role Key
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Schema nhận dữ liệu nộp bài
class SubmitRequest(BaseModel):
    problem_id: str
    code: str

@app.get("/")
def read_root():
    return {"status": "success", "message": "AI CS Tutor API đang chạy mượt mà!"}

# 1. API lấy danh sách tất cả bài tập từ DB
@app.get("/api/problems")
def get_all_problems():
    try:
        res = supabase.table("problems").select("*").execute()
        return res.data
    except Exception as e:
        return {"error": str(e)}

# 2. API lấy chi tiết 1 bài tập theo problem_id
@app.get("/api/problems/{problem_id}")
def get_problem(problem_id: str):
    # Thử tìm theo problem_id trước, nếu không có thì thử theo id
    res = supabase.table("problems").select("*").eq("problem_id", problem_id).execute()
    if not res.data:
        try:
            res = supabase.table("problems").select("*").eq("id", problem_id).execute()
        except Exception:
            pass
    return res.data[0] if res.data else {"error": "Problem not found"}

# 3. API Chấm bài thực tế theo Test cases
@app.post("/api/submit")
def submit_code(req: SubmitRequest):
    # Lấy test_cases của bài tập từ Supabase (hỗ trợ cả cột problem_id hoặc id)
    res = supabase.table("problems").select("test_cases").eq("problem_id", req.problem_id).execute()
    if not res.data:
        try:
            res = supabase.table("problems").select("test_cases").eq("id", req.problem_id).execute()
        except Exception:
            pass

    if not res.data:
        return {"status": "ERROR", "message": "Problem not found"}
    
    test_cases = res.data[0].get("test_cases") or []
    
    # Chạy thử code của sinh viên
    try:
        local_scope = {}
        exec(req.code, {}, local_scope)
        # Hỗ trợ hàm solve hoặc hàm sum hoặc hàm bất kỳ do người dùng viết
        solve_fn = local_scope.get("solve") or local_scope.get("sum")
        if not solve_fn:
            for k, v in local_scope.items():
                if callable(v):
                    solve_fn = v
                    break

        if not solve_fn:
            return {"status": "WRONG_ANSWER", "message": "Không tìm thấy hàm xử lý (ví dụ: def solve(a, b) hoặc def sum(a, b))"}

        # Kiểm tra qua từng testcase trong DB
        results = []
        for idx, tc in enumerate(test_cases, start=1):
            inputs = tc["input"]
            expected = tc["output"]
            try:
                result = solve_fn(*inputs) if isinstance(inputs, list) else solve_fn(inputs)
            except Exception as run_err:
                return {
                    "status": "RUNTIME_ERROR",
                    "message": f"Lỗi lúc chạy ở testcase #{idx} (input {inputs}): {str(run_err)}",
                    "passed_count": idx - 1,
                    "total_count": len(test_cases)
                }

            if result != expected:
                return {
                    "status": "WRONG_ANSWER", 
                    "message": f"Sai ở testcase #{idx} (input {inputs}). Kết quả: {result}, Kỳ vọng: {expected}",
                    "passed_count": idx - 1,
                    "total_count": len(test_cases)
                }
            results.append({"testcase": idx, "status": "PASSED"})
                
        return {
            "status": "PASSED",
            "message": f"Chúc mừng! Bạn đã vượt qua tất cả {len(test_cases)}/{len(test_cases)} test cases!",
            "passed_count": len(test_cases),
            "total_count": len(test_cases),
            "details": results
        }

    except Exception as e:
        return {"status": "ERROR", "message": f"Lỗi cú pháp / thực thi: {str(e)}"}
