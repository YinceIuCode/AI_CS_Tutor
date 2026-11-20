from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.common.config import ALLOWED_ORIGINS
from modules.authenticate.login import router as login_router
from modules.authenticate.signup import router as signup_router
from modules.authenticate.logout import router as logout_router
from modules.judge.evaluate import router as judge_router
from modules.lecture.roadmap import router as roadmap_router
from modules.lecture.ocr import router as ocr_router
from modules.tutor import router as tutor_router

app = FastAPI(
    title="OffByOne AI CS Tutor API",
    description="Backend API Service & Security Gateway kết nối Supabase và Socratic AI",
    version="2.0.0"
)

# Cấu hình CORS cho phép Frontend Next.js gọi kèm Cookie
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các Router tính năng
app.include_router(login_router)
app.include_router(signup_router)
app.include_router(logout_router)
app.include_router(roadmap_router)
app.include_router(judge_router)
app.include_router(ocr_router)
app.include_router(tutor_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "OffByOne AI CS Tutor Backend",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
