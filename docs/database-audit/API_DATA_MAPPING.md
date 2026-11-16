# OffByOne API Data Mapping & Flow Architecture

Tài liệu này ánh xạ chi tiết các API endpoints, cấu trúc Request/Response, các thực thể liên quan và luồng trao đổi dữ liệu từ giao diện Frontend đến Backend của hệ thống **OffByOne**.

---

## 1. Tổng Quan Kiến Trúc API Hiện Tại

Dự án hiện có 2 thành phần liên quan đến API:
1. **Backend FastAPI (`api/main.py`)**: Đang ở mức PoC sơ khởi (Skeleton API), chạy trên Python 3.14/FastAPI với 2 endpoint mẫu.
2. **Frontend Service Layer (`web/services/`)**: Được thiết kế sẵn theo mô hình **Pluggable Architecture (Fetch API ready)**. Nếu có biến môi trường `NEXT_PUBLIC_API_URL`, các service sẽ tự động chuyển từ Mock Data sang gọi HTTP REST API tương ứng.

---

## 2. Bảng Thống Kê Chi Tiết Các API Endpoints

| API Endpoint | HTTP Method | Request Body / Query Params | Response Fields & Format | Entity Liên Quan | Trạng Thái Triển Khai | Mục Đích |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `GET /` | `GET` | Không có | `{"status": "success", "message": string}` | System Health | **Đã có trong Backend** (`api/main.py#L22`) | Kiểm tra sức khỏe của API service |
| `POST /api/evaluate` | `POST` | `{"code": string, "node_id": string}` | `{"status": string, "complexity": string, "socratic_hint": string}` | `CodeSubmission`, `ExecutionResult` | **Đã có trong Backend** (`api/main.py#L27`) | Endpoint mẫu thử nghiệm LangChain/Gemini |
| `GET /api/roadmap` | `GET` | Không có | `{courseTitle: string, completionPercent: number, unlockedCount: number, totalCount: number, knowledgeBase: object, nodes: array}` | `LearningRoadmap`, `RoadmapNode`, `RoadmapTask` | **Client Ready / Mock Fallback** (`web/services/roadmapService.js#L69`) | Truy xuất toàn bộ DAG đồ thị Skill Tree |
| `PUT /api/progress/:userId` | `PUT` | `UserProgressData` (toàn bộ tiến độ người dùng) | `{status: "ok"}` hoặc Updated `UserProgressData` | `USER_PROGRESS`, `TASK_COMPLETION` | **Client Ready / Local Fallback** (`web/services/progressService.js#L133`) | Đồng bộ tiến độ học tập đa thiết bị lên server |
| `POST /api/auth/login` | `POST` | `{"email": string, "password": string}` | `{"token": string, "user": PublicUser}` | `USER`, `AuthSession` | **Chưa triển khai Backend** (Đang dùng Client Mock Auth) | Đăng nhập tài khoản sinh viên |
| `POST /api/auth/register` | `POST` | `{"fullName": string, "email": string, "password": string}` | `{"token": string, "user": PublicUser}` | `USER`, `AuthSession` | **Chưa triển khai Backend** (Đang dùng Client Mock Auth) | Đăng ký tài khoản sinh viên mới |
| `POST /api/syllabus/upload` | `POST` | `multipart/form-data` (file PDF) | `{"documentId": string, "name": string, "size": string, "chunks": number}` | `KNOWLEDGE_BASE_DOC` | **Chưa triển khai Backend** (Mô phỏng tại Frontend) | Tải lên đề cương môn học và băm vector chunks |
| `POST /api/roadmap/generate` | `POST` | `{"documentId": string}` | `{roadmap: LearningRoadmap}` | `LearningRoadmap` | **Chưa triển khai Backend** (Mô phỏng tại Frontend) | AI RAG trích xuất cấu trúc môn học thành Skill Tree |
| `POST /api/workspace/run` | `POST` | `{"taskId": string, "code": string, "language": string}` | `ExecutionResult` (stdout, testCases, metrics, complexity) | `CODING_TASK`, `ExecutionResult` | **Chưa triển khai Backend** (Chạy qua `executionService.ts`) | Biên dịch và chạy nhanh test cases trong sandbox |
| `POST /api/workspace/submit` | `POST` | `{"taskId": string, "code": string, "language": string}` | `ExecutionResult` (verdict, passedCount, testCases, complexity) | `CODING_TASK`, `CodeSubmission` | **Chưa triển khai Backend** (Chạy qua `executionService.ts`) | Đánh giá toàn diện với bộ test ẩn |
| `POST /api/tutor/hint` | `POST` | `{"taskId": string, "tier": number, "code": string, "error": string}` | `{"hint": string, "citation": object, "dryRun": object}` | `SOCRATIC_PROFILE`, `AI_Hint` | **Chưa triển khai Backend** (Chạy qua `socraticTutorData.js`) | Yêu cầu gợi ý Socratic theo ngữ cảnh |

---

## 3. Sơ Đồ Luồng Trao Đổi Dữ Liệu Chi Tiết (Flow Breakdown)

### 3.1. Luồng Xác Thực (Authentication Flow)
- **Đăng nhập thường (Login)**:
  `LoginForm.tsx` $\longrightarrow$ `useAuth()` $\longrightarrow$ `AuthContext.jsx` $\longrightarrow$ `authService.login(email, password)` $\longrightarrow$ Tìm kiếm trong `DEMO_USERS` + `localStorage("algopath_registered_users")` $\longrightarrow$ Lưu phiên vào `sessionStorage("algopath_auth_session")`.
- **Đăng ký (Register)**:
  `LoginForm.tsx` $\longrightarrow$ `authService.register(userData)` $\longrightarrow$ Mã hóa digest DJB2 $\longrightarrow$ Lưu vào `localStorage("algopath_registered_users")` $\longrightarrow$ Tự động đăng nhập vào `sessionStorage`.
- **Đăng nhập Khách (Guest Login)**:
  `LoginForm.tsx` $\longrightarrow$ `authService.loginAsGuest()` $\longrightarrow$ Sinh `guest-<timestamp>` $\longrightarrow$ Lưu phiên tạm vào `sessionStorage`. Khi đăng xuất (`logout()`), tự động dọn dẹp tiến độ của khách qua `clearGuestProgress()`.

### 3.2. Luồng Xử Lý Syllabus & Khởi Tạo Roadmap (Roadmap Generation Flow)
- **Kéo thả / Chọn file PDF**:
  `web/app/roadmap/page.tsx` $\longrightarrow$ Kích hoạt `handleStartGeneration()` $\longrightarrow$ Chuyển `flowState` từ `"empty"` sang `"loading"`.
- **Mô phỏng RAG Pipeline**:
  Giao diện chạy tiến trình mô phỏng 3 bước:
  1. *Extracting topics & syllabus prerequisites*
  2. *Chunking vector knowledge base*
  3. *Synthesizing interactive DAG tree*
- **Tải đồ thị kỹ năng**:
  Kích hoạt `saveRoadmapFlowState(currentUser, { roadmapFlowState: "ready", fileName, fileSize })` $\longrightarrow$ Lưu vào `localStorage` $\longrightarrow$ Hook `useRoadmap(fileName)` gọi `roadmapService.fetchRoadmapData()`.
- **Fallback / API switch**:
  - Nếu có `NEXT_PUBLIC_API_URL`: Gửi `GET /api/roadmap`.
  - Nếu không có URL API: Trả về `MOCK_ROADMAP_NODES` kết hợp với thuật toán Dagre (`graphLayout.js`) để phân tầng đồ thị tự động.

### 3.3. Luồng Đồng Bộ Tiến Độ Học Tập (Progress Synchronization Flow)
- **Cập nhật tiến độ**:
  Bất kỳ hành động nào của người dùng (`markTaskAsCompleted`, `saveQuizProgress`, `saveCodeProgress`, `saveHintsProgress`) đều đi qua:
  `updateUserProgress(user, updater)` $\longrightarrow$ Ghi vào `localStorage` (nếu Registered) hoặc `sessionStorage` (nếu Guest).
- **Đồng bộ thời gian thực đa tab**:
  Sử dụng `BroadcastChannel("algopath_progress_sync")` để phát thông báo `postMessage`. Các tab khác đang mở cùng trình duyệt sẽ tự động cập nhật ngay lập tức mà không cần F5.
- **Dự phòng Backend Sync**:
  Nếu `API_BASE_URL` tồn tại, gửi ngầm `PUT /api/progress/:userId` lên server.

### 3.4. Luồng Chạy Thử Code (Run Code Flow)
- **Kích hoạt**: Người dùng bấm nút **`Run Code`** trên thanh công cụ Monaco Editor.
- **Điều phối**:
  `web/app/workspace/page.tsx` $\longrightarrow$ `handleRunCode()` $\longrightarrow$ Đặt `executionStatus = "running"`, khóa nút bấm tránh spam $\longrightarrow$ Gọi `executionService.runCode(activeTask.id, code, language, taskDetail)`.
- **Xử lý Sandbox**:
  `executionService.ts` mô phỏng độ trễ 500–750ms $\longrightarrow$ Kiểm tra cú pháp cơ bản $\longrightarrow$ So khớp các trường hợp biên của bài toán $\longrightarrow$ Trả về `ExecutionResult` (kết quả `success` hoặc `failed`, thời gian chạy, bộ nhớ, danh sách test case).
- **Cập nhật giao diện**:
  Giao diện `CodeAnalysisPanel.tsx` chuyển trạng thái và hiển thị chi tiết kết quả. Nếu phát hiện lỗi (ví dụ SIGSEGV trên Test Case #5 của AVL), dòng lỗi sẽ được đánh dấu viền sáng trong Monaco Editor và hiển thị nút **`Point to Line X`**.

### 3.5. Luồng Chấm Bài Nộp (Submit Code Flow)
- **Kích hoạt**: Người dùng bấm nút **`Submit`**.
- **Điều phối**:
  `web/app/workspace/page.tsx` $\longrightarrow$ `handleSubmitCode()` $\longrightarrow$ Đặt `executionStatus = "running"`, `activeAction = "submit"` $\longrightarrow$ Gọi `executionService.submitCode(...)`.
- **Chấm điểm**:
  `executionService.ts` chạy toàn bộ 8 test case ẩn $\longrightarrow$ Nếu tất cả vượt qua, trả về `status: "success"`, nhãn `Accepted`.
- **Lưu trữ kết quả**:
  - Đánh dấu bài tập hoàn thành: `completeTask(activeTask.id)`.
  - Lưu trạng thái bài nộp: `saveCodeDraft(activeTask.id, { isSubmitted: true })`.
  - Cập nhật tỷ lệ hoàn thành trên đồ thị Roadmap.
  - Ngược lại nếu thất bại: Giữ nguyên bài tập chưa hoàn thành, mở khóa các gợi ý Socratic AI để hỗ trợ sửa lỗi.

### 3.6. Luồng Trợ Giảng Socratic AI (Socratic Tutor Flow)
- **Mở trợ giảng**: Người dùng bấm vào nút Socratic AI trên thanh Task Sidebar hoặc mở từ drawer.
- **Truy xuất ngữ cảnh RAG**:
  `SocraticTutorPanel.tsx` $\longrightarrow$ `getSocraticTutorProfile(nodeId, nodeLabel, nodeComplexity)` trong `socraticTutorData.js`.
- **Cung cấp gợi ý theo tầng (Scaffolded Tiers)**:
  - Tầng 1: Câu hỏi gợi mở khái niệm (`Conceptual Probe`).
  - Tầng 2: Truy vết con trỏ / Bảng Dry-Run (`Pointer / Dry-Run Trace`).
  - Tầng 3: Điều kiện bảo vệ biên (`Defensive Guard Clause`).
- **Trích dẫn tài liệu (Citations)**:
  Hiển thị trích dẫn trực tiếp từ Slide bài giảng (`Slide 14: AVL Tree Right Rotation`, `Week 7 Lecture Notes`) để người học tự suy nghĩ thay vì đưa đáp án hoàn chỉnh.
