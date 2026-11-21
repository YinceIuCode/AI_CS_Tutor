# TÀI LIỆU BÀN GIAO KHUNG BACKEND (BACKEND SKELETON TEMPLATE)

Dự án: **OffByOne - AI CS Tutor**  
Phiên bản: 2.0.0  
Môi trường Backend: Python 3.10+ / FastAPI / Supabase PostgreSQL / Gemini AI  

Tài liệu này đóng vai trò hướng dẫn chi tiết cho đội ngũ kỹ sư Backend tiếp nhận và triển khai phần ruột logic (business logic) cho toàn bộ hệ thống API của dự án. Khung mã nguồn đã được chuẩn hóa 100% về mặt cấu trúc thư mục, chữ ký hàm, Pydantic Schemas, HTTP Status Codes và liên kết Router.

---

## 1. TỔNG QUAN KIẾN TRÚC THƯ MỤC `api/`

Thư mục `api/` được tổ chức theo mô hình Modular Monolith tinh gọn, phân tách rõ ràng giữa tầng định tuyến (Routers), tầng xác thực & an ninh (Security), tầng định nghĩa schema (Common DTOs), và tầng dịch vụ nghiệp vụ (Services).

```text
api/
|-- main.py                             # Entrypoint khởi tạo FastAPI, cấu hình CORS, mount routers
|-- requirements.txt                    # Danh sách thư viện phụ thuộc Python
|-- .env.example                        # Mẫu cấu hình biến môi trường
|-- modules/
|   |-- common/
|   |   |-- config.py                   # Đọc biến môi trường và thiết lập CORS origins
|   |   |-- request.py                  # Toàn bộ Pydantic Request Models
|   |   |-- response.py                 # Chuẩn hóa Response Envelope (success_response, error_response)
|   |   `-- error.py                    # Định nghĩa mã lỗi và exception handlers
|   |-- authenticate/
|   |   |-- security.py                 # Mã hóa Bcrypt, ký JWT (Access/Refresh), Rate Limiting
|   |   |-- dependencies.py             # FastAPI Dependencies: get_current_user, require_role
|   |   |-- login.py                    # Endpoints: /login, /refresh, /me, /guest
|   |   |-- signup.py                   # Endpoints: /register, /signup
|   |   `-- logout.py                   # Endpoint: /logout
|   |-- judge/
|   |   `-- evaluate.py                 # Endpoints: /code/run, /code/submit & Docker Sandbox engine
|   |-- lecture/
|   |   |-- roadmap.py                  # Endpoints: /roadmap, /tasks/{id}, /quiz/evaluate, /progress/{id}
|   |   `-- ocr.py                      # Endpoint: /documents/upload (PDF parsing & syllabus extraction)
|   `-- tutor.py                        # Endpoints: /tutor/chat (Socratic AI) & /progress/draft
|-- services/
|   |-- database/
|   |   `-- database.py                 # Wrapper thao tác với Supabase PostgreSQL qua supabase-py
|   `-- ai/
|       `-- ai.py                       # Tích hợp Google Gemini API cho Socratic Guidance
`-- scripts/                            # Scripts shell hỗ trợ môi trường sandbox
```

---

## 2. HƯỚNG DẪN CÀI ĐẶT MÔI TRƯỜNG & KHỞI CHẠY

### 2.1. Khởi tạo môi trường ảo Python
Từ thư mục gốc dự án hoặc thư mục `api/`:

```bash
# Di chuyển vào thư mục api
cd api

# Tạo virtual environment
python -m venv .venv

# Kích hoạt trên Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Hoặc trên Linux / macOS:
source .venv/bin/activate
```

### 2.2. Cài đặt các thư viện phụ thuộc
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Danh sách thư viện cốt lõi trong [requirements.txt](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/api/requirements.txt):
- `fastapi` & `uvicorn[standard]`
- `pydantic`
- `supabase` (Supabase Python Client)
- `python-jose[cryptography]` & `passlib[bcrypt]` (hoặc `bcrypt`)
- `google-generativeai` (Gemini API)
- `python-multipart`

### 2.3. Cấu hình biến môi trường `.env`
Sao chép file mẫu và điền thông tin kết nối Supabase và Gemini:

```bash
cp .env.example .env
```

Nội dung `.env`:
```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

JWT_SECRET_KEY=offbyone-production-jwt-secret-key-32bytes-minimum
JWT_ALGORITHM=HS256

GEMINI_API_KEY=<your-gemini-api-key>

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 2.4. Khởi chạy Server ở chế độ Development
```bash
# Chạy từ thư mục api:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Server sẽ chạy tại `http://localhost:8000`.  
Kiểm tra endpoint sức khỏe: `curl http://localhost:8000/health` -> `{"status": "healthy"}`.  
Xem tài liệu trực quan: `http://localhost:8000/docs` hoặc `http://localhost:8000/redoc`.

---

## 3. BẢNG ÁNH XẠ 6 BẢNG SUPABASE DATABASE THỰC TẾ

Backend tương tác trực tiếp với cơ sở dữ liệu PostgreSQL trên Supabase. Dưới đây là lược đồ chi tiết của 6 bảng:

### 3.1. Bảng `public.users`
Lưu trữ thông tin tài khoản người dùng và thông tin xác thực.

| Tên Cột | Kiểu Dữ Liệu | Khóa / Thuộc Tính | Mô Tả & Lưu Ý |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, DEFAULT gen_random_uuid() | Định danh duy nhất người dùng. |
| `email` | `text` | Unique, NOT NULL | Email đăng nhập (luôn chuẩn hóa lowercase). |
| `password_hash` | `text` | NOT NULL | Mật khẩu băm Bcrypt (`$2b$12$...`). |
| `role` | `text` | NOT NULL, DEFAULT 'student' | Vai trò: `'student'`, `'tutor'`, `'admin'`. |
| `account_type` | `text` | NOT NULL, DEFAULT 'registered' | Loại tài khoản: `'registered'`, `'guest'`. |
| `full_name` | `text` | Nullable | Họ và tên hiển thị của người dùng. |
| `avatar_url` | `text` | Nullable | Đường dẫn ảnh đại diện. |
| `created_at` | `timestamptz` | DEFAULT now() | Thời gian tạo tài khoản. |

### 3.2. Bảng `public.knowledge_documents`
Lưu trữ giáo trình và tài liệu học tập được tải lên hệ thống.

| Tên Cột | Kiểu Dữ Liệu | Khóa / Thuộc Tính | Mô Tả & Lưu Ý |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, DEFAULT gen_random_uuid() | ID tài liệu. |
| `name` | `text` | NOT NULL | Tên file giáo trình (VD: `CS101_DSA_Syllabus_HCMUS.pdf`). |
| `file_size` | `text` | NOT NULL | Dung lượng file (VD: `'2.4 MB'`). |
| `status` | `text` | NOT NULL, DEFAULT 'indexed' | Trạng thái: `'indexed'`, `'processing'`, `'error'`. |
| `chunk_count` | `integer` | DEFAULT 0 | Số đoạn text chunks được bóc tách phục vụ RAG. |
| `created_at` | `timestamptz` | DEFAULT now() | Thời gian upload. |

### 3.3. Bảng `public.roadmap_nodes`
Các nút kỹ năng trên cây lộ trình học tập thuộc về một giáo trình.

| Tên Cột | Kiểu Dữ Liệu | Khóa / Thuộc Tính | Mô Tả & Lưu Ý |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Mã định danh node (VD: `'08'`, `'oop-01'`). |
| `document_id` | `uuid` | Foreign Key -> `knowledge_documents.id` | Nút thuộc giáo trình nào. |
| `label` | `text` | NOT NULL | Tên nút hiển thị (VD: `'AVL Tree'`). |
| `short_code` | `text` | Nullable | Ký hiệu viết tắt (VD: `'AVL'`). |
| `description` | `text` | Nullable | Tóm tắt kiến thức của nút. |
| `target_complexity` | `text` | Nullable | Độ phức tạp mục tiêu (VD: `'O(log N)'`). Không dùng tên cột `complexity`. |
| `prerequisites` | `jsonb` / `text[]` | DEFAULT '[]' | Mảng chứa danh sách `id` các node tiên quyết (VD: `["05", "07"]`). |
| `socratic_profile` | `jsonb` | DEFAULT '{}' | Dữ liệu định hướng Socratic (common_pitfalls, guiding_questions). |
| `created_at` | `timestamptz` | DEFAULT now() | Thời gian tạo. |

### 3.4. Bảng `public.tasks`
Các bài học cụ thể nằm bên trong từng nút kỹ năng (mỗi Node thường có 3 tasks: Theory, Quiz, Coding).

| Tên Cột | Kiểu Dữ Liệu | Khóa / Thuộc Tính | Mô Tả & Lưu Ý |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | ID bài học (VD: `'08-theory'`, `'08-quiz'`, `'08-code'`). |
| `node_id` | `text` | Foreign Key -> `roadmap_nodes.id` | Thuộc node kỹ năng nào. |
| `title` | `text` | NOT NULL | Tiêu đề bài học. |
| `description` | `text` | Nullable | Mô tả ngắn bài học. |
| `task_type` | `text` | NOT NULL | Loại bài: `'theory'`, `'quiz'`, `'coding'`. Không có cột `document_id`. |
| `order_index` | `integer` | DEFAULT 1 | Thứ tự hiển thị trong node. |
| `content` | `jsonb` | NOT NULL, DEFAULT '{}' | Chứa toàn bộ nội dung chi tiết bài học (Markdown lý thuyết, câu hỏi options quiz, test cases coding...). |
| `created_at` | `timestamptz` | DEFAULT now() | Thời gian tạo. |

### 3.5. Bảng `public.user_progress`
Tiến độ học tập của người dùng theo thời gian thực.

| Tên Cột | Kiểu Dữ Liệu | Khóa / Thuộc Tính | Mô Tả & Lưu Ý |
| :--- | :--- | :--- | :--- |
| `user_id` | `uuid` | Primary Key, Foreign Key -> `users.id` | Tiến độ của người dùng nào. |
| `completed_tasks` | `jsonb` | DEFAULT '{}' | Danh sách bài học đã hoàn thành: `{"08-theory": true, "08-quiz": true}`. |
| `quiz_answers` | `jsonb` | DEFAULT '{}' | Câu trả lời quiz đã chọn: `{"08-quiz": "opt-b"}`. |
| `code_drafts` | `jsonb` | DEFAULT '{}' | Bản nháp code: `{"08-code": "class AVLTree { ... }"}`. |
| `hints_remaining` | `jsonb` / `int` | DEFAULT 3 | Số lượt gợi ý AI còn lại hoặc object hạn mức. |
| `roadmap_flow_state` | `jsonb` | Nullable | Vị trí pan/zoom hoặc trạng thái view của roadmap. |
| `updated_at` | `timestamptz` | DEFAULT now() | Cập nhật tự động mỗi khi có thay đổi tiến độ. |

### 3.6. Bảng `public.submissions`
Lịch sử các lần nộp bài tập code C++ của học viên.

| Tên Cột | Kiểu Dữ Liệu | Khóa / Thuộc Tính | Mô Tả & Lưu Ý |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, DEFAULT gen_random_uuid() | ID lần nộp. |
| `user_id` | `uuid` | Foreign Key -> `users.id` | Học viên nộp bài. |
| `task_id` | `text` | Foreign Key -> `tasks.id` | Bài tập coding được nộp. |
| `code` | `text` | NOT NULL | Toàn bộ mã nguồn C++ được nộp. |
| `language` | `text` | DEFAULT 'cpp' | Ngôn ngữ lập trình. |
| `status` | `text` | NOT NULL | Kết quả: `'success'`, `'failed'`, `'compilation_error'`, `'timeout'`. |
| `passed_count` | `integer` | DEFAULT 0 | Số lượng test cases vượt qua. |
| `total_count` | `integer` | DEFAULT 0 | Tổng số lượng test cases. |
| `execution_metrics` | `jsonb` | DEFAULT '{}' | Chỉ số chạy: `{"runtimeMs": 14, "memoryMb": "4.2 MB"}`. |
| `test_results` | `jsonb` | DEFAULT '[]' | Kết quả chi tiết từng test case. |
| `created_at` | `timestamptz` | DEFAULT now() | Thời gian nộp bài. |

---

## 4. BẢNG CHECKLIST CÁC HÀM CẦN TRIỂN KHAI

Tất cả các hàm dưới đây đã được dựng sẵn chữ ký, kiểu dữ liệu trả về và khối hướng dẫn 4 phần `TODO`. Đội ngũ Backend triển khai theo checklist sau:

### 4.1. Tầng Cơ Sở Dữ Liệu (`services/database/database.py`)
- [ ] `DatabaseService.get_user_by_email(email: str)`: Truy vấn người dùng theo email.
- [ ] `DatabaseService.get_user_by_id(user_id: str)`: Truy vấn người dùng theo ID.
- [ ] `DatabaseService.create_user(user_data: dict)`: Tạo mới tài khoản trong `public.users`.
- [ ] `DatabaseService.update_user_password(user_id: str, new_hash: str)`: Cập nhật mật khẩu băm.
- [ ] `DatabaseService.get_documents()`: Lấy danh sách tài liệu từ `public.knowledge_documents`.
- [ ] `DatabaseService.create_document(doc_data: dict)`: Thêm tài liệu mới.
- [ ] `DatabaseService.get_roadmap_nodes(document_id: Optional[str])`: Lấy danh sách nodes theo document.
- [ ] `DatabaseService.get_tasks_for_roadmap()`: Lấy toàn bộ bài học thuộc roadmap.
- [ ] `DatabaseService.get_task_by_id(task_id: str)`: Lấy chi tiết nội dung 1 task.
- [ ] `DatabaseService.get_user_progress(user_id: str)`: Lấy bản ghi tiến độ từ `public.user_progress`.
- [ ] `DatabaseService.upsert_user_progress(progress_data: dict)`: Cập nhật hoặc chèn tiến độ.
- [ ] `DatabaseService.record_submission(submission_data: dict)`: Ghi nhận kết quả nộp bài vào `public.submissions`.

### 4.2. Tầng Bảo Mật & Xác Thực (`modules/authenticate/`)
- [ ] `security.py: hash_password(password: str) -> str`: Băm mật khẩu bằng Bcrypt.
- [ ] `security.py: verify_password(plain_password: str, hashed_password: str) -> bool`: Kiểm tra mật khẩu.
- [ ] `security.py: verify_password_with_timing_mitigation(...) -> bool`: Kiểm tra mật khẩu chống timing attack.
- [ ] `security.py: create_access_token(user_id, email, role, account_type) -> str`: Tạo JWT Access Token (15 phút).
- [ ] `security.py: create_refresh_token(user_id) -> str`: Tạo JWT Refresh Token (7 ngày).
- [ ] `security.py: decode_token(token: str) -> dict`: Giải mã và thẩm định JWT.
- [ ] `dependencies.py: get_current_user(...) -> dict`: FastAPI Dependency trích xuất user từ Cookie/Bearer token.
- [ ] `dependencies.py: require_role(allowed_roles: list)`: Middleware kiểm tra quyền truy cập (Admin, Tutor, Student).
- [ ] `login.py: /api/auth/login`: Xác thực đăng nhập, kiểm tra rate limit, cấp cặp token.
- [ ] `login.py: /api/auth/refresh`: Cấp mới Access Token từ Refresh Token hợp lệ.
- [ ] `login.py: /api/auth/me`: Trả về thông tin phiên người dùng hiện tại.
- [ ] `login.py: /api/auth/guest`: Tạo tài khoản khách vãng lai dùng thử nhanh.
- [ ] `signup.py: /api/auth/register & /api/auth/signup`: Đăng ký tài khoản mới, khởi tạo tiến độ.
- [ ] `logout.py: /api/auth/logout`: Xóa HttpOnly Cookies, kết thúc phiên làm việc.

### 4.3. Tầng Đánh Giá & Chấm Điểm Mã Nguồn (`modules/judge/evaluate.py`)
- [ ] `evaluate_cpp_code(code: str, test_cases: list) -> dict`: Môi trường biên dịch `g++` an toàn (Sandbox/Docker), đo thời gian/RAM, so khớp stdout với expectedOutput.
- [ ] `/api/code/run`: Chạy thử mã nguồn với Public Test Cases.
- [ ] `/api/code/submit`: Chấm điểm chính thức toàn bộ Test Cases, ghi nhận vào `submissions` và cập nhật `user_progress`.

### 4.4. Tầng Lộ Trình & Bài Học (`modules/lecture/`)
- [ ] `roadmap.py: /api/roadmap`: Trả về toàn bộ cây kỹ năng kèm tasks theo `document_id`.
- [ ] `roadmap.py: /api/tasks/{task_id}`: Trả về chi tiết bài học (ĐẶC BIỆT: loại bỏ `isCorrect` của Quiz và ẩn Private Test Cases của Coding).
- [ ] `roadmap.py: /api/quiz/evaluate`: Chấm điểm câu hỏi trắc nghiệm ở phía Server.
- [ ] `roadmap.py: GET /api/progress/{user_id}`: Lấy tiến độ học tập của học viên.
- [ ] `roadmap.py: PUT /api/progress/{user_id}`: Lưu tiến độ học tập.
- [ ] `ocr.py: /api/documents/upload`: Nhận file PDF, bóc tách cấu trúc kiến thức và tạo cây lộ trình.

### 4.5. Tầng Trợ Giảng Socratic & Lưu Nháp (`modules/tutor.py` & `services/ai/ai.py`)
- [ ] `ai.py: generate_socratic_guidance(...)`: Tạo lời thoại hướng dẫn Socratic qua Gemini Flash API.
- [ ] `tutor.py: /api/tutor/chat`: Endpoint hội thoại với Trợ giảng AI.
- [ ] `tutor.py: /api/progress/draft`: Lưu tự động bản nháp code C++ vào database.

---

## 5. HƯỚNG DẪN KIỂM THỬ NHANH API

### 5.1. Kiểm tra trạng thái Server
```bash
curl http://localhost:8000/health
# Kết quả mong đợi: {"status": "healthy"}
```

### 5.2. Kiểm tra Swagger Documentation
Mở trình duyệt truy cập: `http://localhost:8000/docs`  
Giao diện Swagger UI hiển thị đầy đủ 19 endpoints với mô tả request body, response schema và các nút "Try it out".

### 5.3. Kiểm tra mã phản hồi Skeleton
Do toàn bộ ruột logic đã được thay bằng `raise HTTPException(status_code=501)` hoặc `raise NotImplementedError`, khi gọi thử bất kỳ endpoint nghiệp vụ nào (ví dụ `/api/roadmap` hoặc `/api/auth/login`):
```bash
curl -X GET http://localhost:8000/api/roadmap
# Kết quả mong đợi:
# HTTP/1.1 501 Not Implemented
# {"detail": "TODO: Implement /api/roadmap"}
```
Khi bạn hoàn thành việc viết ruột cho hàm nào, mã phản hồi 501 sẽ được thay bằng dữ liệu thực tế kèm HTTP 200/201.
