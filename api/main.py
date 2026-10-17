from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# BẮT BUỘC CÓ: Cho phép Next.js (cổng 3000) gọi dữ liệu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khai báo cấu trúc dữ liệu nhận từ Frontend
class CodeSubmission(BaseModel):
    code: str
    node_id: str

# API test hệ thống
@app.get("/")
def read_root():
    return {"status": "success", "message": "AI CS Tutor API đang chạy mượt mà!"}

# API giả lập chấm code và trả về Socratic Hint
@app.post("/api/evaluate")
def evaluate_code(submission: CodeSubmission):
    # Sau này nhóm bạn sẽ nhúng code LangChain / Gemini vào đây
    return {
        "status": "failed",
        "complexity": "O(N^2)",
        "socratic_hint": "Gợi ý: Bạn có nhận ra lỗi ở điều kiện vòng lặp for không?"
    }