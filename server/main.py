from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeSubmission(BaseModel):
    code: str
    node_id: str

@app.get("/")
def read_root():
    return {"status": "success", "message": "AI CS Tutor API đang chạy mượt mà!"}

@app.post("/api/evaluate")
def evaluate_code(submission: CodeSubmission):
    return {
        "status": "failed",
        "complexity": "O(N^2)",
        "socratic_hint": "Gợi ý: Bạn có nhận ra lỗi ở điều kiện vòng lặp for không?"
    }
