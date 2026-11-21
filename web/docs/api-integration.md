# Tài Liệu Tích Hợp API Frontend - Backend & Supabase (`api-integration.md`)

Tài liệu này tổng hợp toàn bộ cấu hình kết nối, danh mục endpoints, cơ chế Fallback và bảng ánh xạ gọi dữ liệu giữa phân hệ Frontend (`web/`), Backend FastAPI (`api/`) và cơ sở dữ liệu Supabase.

---

## 1. Cấu Hình Kết Nối & Biến Môi Trường

### 1.1. Các biến môi trường trong `web/.env.local`
Frontend quản lý cấu hình kết nối thông qua file [`web/.env.local`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/.env.local):

| Tên biến môi trường | Giá trị hiện tại | Mục đích |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Địa chỉ API Gateway của Backend FastAPI |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | Cờ cấu hình: `false` = Ưu tiên gọi API Backend/Database thật |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kcpgwxsibuqgkudgbjgd.supabase.co` | Endpoint REST API của Supabase Project |
| `NEXT_PUBLIC_SUPABASE_KEY` | `sb_publishable_DCMS9ckBfOOVZSMzwIpO1g_...` | Supabase Anon/Publishable Key dùng cho client-side |

### 1.2. Các file khởi tạo Base URL trong `web/`
- [`web/services/authService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js): Đọc `API_BASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`.
- [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js): Đọc trực tiếp `SUPABASE_URL` và `SUPABASE_KEY`.
- [`web/services/executionService.ts`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts): Đọc `API_BASE_URL` (`process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"`).
- [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js): Đọc `API_BASE_URL`.
- [`web/services/progressService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js): Đọc `API_BASE_URL`.
- [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx): Đọc `process.env.NEXT_PUBLIC_API_URL` khi fetch dynamic task detail.

### 1.3. Mức độ ưu tiên kết nối và cơ chế Fallback
1. **Xác thực & Chấm bài code (Auth & Judge Execution)**:
   - **Ưu tiên 1**: Gọi trực tiếp sang FastAPI (`http://localhost:8000`).
   - **Ưu tiên 2 (Offline Fallback)**: Khi FastAPI offline (`Failed to fetch`, `NetworkError`):
     - Trong `authService.js`: Tự động fallback gọi trực tiếp REST API của Supabase (`/rest/v1/users?email=eq...`) để đối chiếu mật khẩu/hash. Nếu Supabase cũng không có mạng, fallback về danh sách tài khoản demo trong [`web/mocks/mockUsers.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/mockUsers.js).
     - Trong `executionService.ts`: Tự động fallback về trình mô phỏng Sandbox RegExp offline (trả về kết quả pass/fail kiểm thử C++ theo mẫu).
2. **Dữ liệu Cây Roadmap & Bài tập**:
   - `fetchRoadmapData`: Ưu tiên gọi FastAPI `GET /api/roadmap?document_id=...`. Nếu lỗi, fallback về Mock Data [`web/mocks/roadmapData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js).
   - Danh sách tài liệu trên Roadmap Canvas ([`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx)): Gọi thẳng Supabase qua `adminService.fetchTableData('knowledge_documents')`.
3. **Bảng Quản trị Admin (`/admin`)**:
   - **Gọi thẳng 100% vào Supabase REST API qua PostgREST** ([`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js)). Hiện tại không đi qua FastAPI backend.
   - Nếu mất mạng, fallback về `localStorage` (`OFFBYONE_ADMIN_MOCK_TABLES_V1`).

---

## 2. Bảng Ánh Xạ Toàn Bộ API Calls Từ Frontend (`web/`)

| File & Tên hàm trong `web/` | Trang UI sử dụng | Gọi đi đâu? | Method & Endpoint / Table Supabase | Dữ liệu gửi lên (Request) | Dữ liệu nhận về (Response) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`authService.js`**<br>`login(email, password)` | `/auth`<br>[web/components/login-form.tsx](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx) | **FastAPI**<br>*(Fallback: Supabase REST)* | `POST /api/auth/login`<br>*(Fallback: `GET /rest/v1/users`)* | `{ email, password }` | `{ accessToken, user: { id, email, fullName, role, accountType } }` |
| **`authService.js`**<br>`register(payload)` | `/auth`<br>[web/components/login-form.tsx](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx) | **FastAPI** | `POST /api/auth/register` | `{ email, password, fullName }` | `{ accessToken, user: { id, email, fullName, role } }` |
| **`authService.js`**<br>`loginAsGuest()` | `/auth`<br>[web/components/login-form.tsx](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx) | **FastAPI** | `POST /api/auth/guest` | `{}` | `{ accessToken, user: { id, role: "student", accountType: "guest" } }` |
| **`authService.js`**<br>`refreshAccessToken()` | Background session refresh | **FastAPI** | `POST /api/auth/refresh` | `credentials: "include"` (hoặc `{ refreshToken }`) | `{ accessToken, user }` |
| **`authService.js`**<br>`logout()` | User Menu / Admin Sidebar | **FastAPI** | `POST /api/auth/logout` | `credentials: "include"` | `{ message: "Logged out" }` |
| **`roadmapService.js`**<br>`fetchRoadmapData(options)` | `/roadmap`<br>[web/hooks/useRoadmap.js](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/hooks/useRoadmap.js) | **FastAPI**<br>*(Fallback: Mock)* | `GET /api/roadmap?document_id=...` | Query param: `document_id` | `{ id, title, nodes: [...], documentMeta: {...} }` |
| **`roadmapService.js`**<br>`resolveWorkspaceSessionAsync(...)` | `/workspace/[nodeId]` | **FastAPI** | `GET /api/tasks/{task_id}` | URL Path: `task_id` | `{ id, nodeId, title, content: { headerTitle, cards, snippet, ... } }` |
| **`roadmapService.js`**<br>`evaluateQuizAnswer(...)` | Đã khai báo service | **FastAPI** | `POST /api/quiz/evaluate` | `{ taskId, selectedOption }` | `{ isCorrect: boolean, explanation: string, socraticHint: string }` |
| **`workspace/page.tsx`**<br>`React.useEffect (line 226)` | `/workspace/[nodeId]` | **FastAPI** | `GET /api/tasks/{task_id}` | URL Path: `task_id` | Object chi tiết task động từ Database |
| **`executionService.ts`**<br>`runCode(taskId, code, lang)` | `/workspace`<br>(Nút `Run Sample Tests`) | **FastAPI**<br>*(Fallback: Local Sandbox)* | `POST /api/code/run` | `{ taskId, code, language: "C++" }` | `{ status, metrics: { runtimeMs, memoryMb }, passedCount, totalCount, testCases: [...], stdout, errorMessage }` |
| **`executionService.ts`**<br>`submitCode(taskId, code, lang)` | `/workspace`<br>(Nút `Submit for Grading`) | **FastAPI**<br>*(Fallback: Local Sandbox)* | `POST /api/code/submit` | `{ taskId, code, language: "C++" }` | `{ status: "success", metrics, passedCount, totalCount, testCases: [...], complexity: { timeComplexity, spaceComplexity } }` |
| **`progressService.js`**<br>`updateUserProgress(user, updater)` | `/workspace`, `/roadmap` | **FastAPI** (gọi ngầm)<br>*(Chính: localStorage)* | `PUT /api/progress/{user_id}` | `{ completedTasks, quizAnswers, codeDrafts, hintsRemaining, ... }` | `{ success: true }` |
| **`adminService.js`**<br>`fetchTableData(tableName)` | `/admin` (Database Explorer),<br>`/roadmap` (sync tài liệu) | **Direct Supabase** | `GET /rest/v1/{tableName}?select=*`<br>(Bảng: `users`, `knowledge_documents`, `roadmap_nodes`, `tasks`, `user_progress`, `code_submissions`) | Headers: `apikey`, `Authorization` | Danh sách mảng các bản ghi (`Array<Row>`) |
| **`adminService.js`**<br>`saveRecord(tableName, record)` | `/admin` (Drawer form) | **Direct Supabase** | `POST /rest/v1/{tableName}`<br>(Header: `Prefer: resolution=merge-duplicates`) | JSON object của bản ghi (có `id`) | `{ id: ... }` |
| **`adminService.js`**<br>`deleteRecord(tableName, id)` | `/admin` (Nút thùng rác) | **Direct Supabase** | `DELETE /rest/v1/{tableName}?id=eq.{id}` | Headers: `apikey`, `Authorization` | `204 No Content` |
| **`adminService.js`**<br>`saveCurriculumNodeAndTasks(...)` | `/admin` (Course Studio - Nút `Save to Database`) | **Direct Supabase** | `POST /rest/v1/roadmap_nodes`<br>`POST /rest/v1/tasks` | Schema sạch của Node và 3 Tasks (loại bỏ trường thừa) | `{ success: true }` |
| **`adminService.js`**<br>`applyDemoPreset(presetId)` | `/admin` (Menu Demo Presets: 0%, 67%, 100%) | **Direct Supabase** | `POST /rest/v1/user_progress` | Ghi đè tiến độ học viên `student@offbyone.demo` | `{ success: true }` |
| **`adminService.js`**<br>`recordUploadedDocument(...)` | `/roadmap` (Kéo thả PDF / Add Sample) | **Direct Supabase** | `POST /rest/v1/knowledge_documents`<br>`POST /rest/v1/roadmap_nodes` | Metadata tài liệu (`id`, `file_name`, `linked_nodes_count`, `content`) | Bản ghi tài liệu đã lưu |
| **`adminService.js`**<br>`inspectRawSupabaseData()` | `/admin` (Nút `Inspect Supabase`) | **Direct Supabase** | Kéo đồng loạt 6 bảng Supabase | Không | Audit report: counts, duplicates, orphaned foreign keys |

---

## 3. Phân Nhóm Theo 4 Luồng Chức Năng Chính

### 1. Luồng Xác thực (Auth: Login / Register / Guest / Session)
- **Luồng dữ liệu**:
  1. Người dùng bấm "Sign In" trên [`web/components/login-form.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx).
  2. Form gọi hàm `login()` trong [`web/services/authService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js).
  3. `authService` gửi HTTP POST sang Backend FastAPI tại endpoint `/api/auth/login` kèm email và password.
  4. Nếu Backend phản hồi thành công (HTTP 200), nhận về `accessToken` và lưu thông tin `user` vào `sessionStorage` (`algopath_auth_session`).
  5. Nếu Backend FastAPI offline: `authService` tự động chuyển sang gọi trực tiếp Supabase REST endpoint `/rest/v1/users?email=eq...` để tra cứu tài khoản.
  6. **Phân quyền Strict Role-Based Routing**:
     - Nếu `user.role === 'admin'`: Chuyển hướng ngay lập tức vào `/admin`.
     - Nếu `user.role !== 'admin'`: Chuyển hướng vào `/roadmap`.

### 2. Luồng Sơ đồ & Quản lý Tài liệu (Roadmap & Documents)
- **Luồng dữ liệu**:
  1. Khi người dùng vào trang `/roadmap` ([`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx)), hook `useRoadmap` kích hoạt hàm `fetchRoadmapData()` trong [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js).
  2. `roadmapService` gọi sang FastAPI: `GET /api/roadmap?document_id={activeDocId}`.
  3. Đồng thời, danh sách tài liệu đa khóa học (DSA vs OOP) được gọi trực tiếp từ Supabase qua `fetchTableData('knowledge_documents')` trong [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js).
  4. Khi upload hoặc chọn Add Sample PDF: Trang gọi `recordUploadedDocument()`, ghi trực tiếp metadata tài liệu và các nodes liên kết lên bảng `knowledge_documents` và `roadmap_nodes` của Supabase.
  5. Khi chuyển đổi giữa `CS101_DSA_Syllabus_HCMUS.pdf` (10 nodes) và `CS102_OOP_Cpp_Syllabus_HCMUS.pdf` (5 nodes), hệ thống lọc nghiêm ngặt theo `activeDocumentId`, tuyệt đối không ghép chồng dữ liệu của 2 môn học.

### 3. Luồng Không gian Học tập (Workspace: Tasks, Code Execution, Socratic Hints)
- **Luồng dữ liệu**:
  1. Khi mở `/workspace/[nodeId]`: [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx) gửi `GET /api/tasks/{task_id}` tới FastAPI để lấy nội dung chi tiết bài tập (lý thuyết, đề bài code, bộ test case).
  2. **Bấm "Run Code"**: Gọi `runCode()` trong [`web/services/executionService.ts`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts) -> gửi `POST /api/code/run` sang FastAPI. Backend chạy mã nguồn trong Docker sandbox/isolate và trả về kết quả `stdout`, `runtimeMs`, `testCases`.
  3. **Bấm "Submit for Grading"**: Gọi `submitCode()` -> gửi `POST /api/code/submit` sang FastAPI. Nếu kết quả thành công, tiến độ hoàn thành task được lưu đồng thời vào `localStorage` và đồng bộ ngầm qua `PUT /api/progress/{user_id}` ([`web/services/progressService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js)).
  4. **Gợi ý Socratic AI (Socratic Tutor)**: Component [`web/components/workspace/SocraticTutorPanel.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/workspace/SocraticTutorPanel.tsx) hiện đang lấy gợi ý bậc thang (Tier 1-3) từ mock dữ liệu [`web/mocks/socraticTutorData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/socraticTutorData.js) và các thông số guardrails đã cấu hình trên Node.

### 4. Luồng Quản trị Hệ thống (Admin Console: Database & Studio)
- **Luồng dữ liệu**:
  1. Admin truy cập `/admin` ([`web/app/admin/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/admin/page.tsx)).
  2. Toàn bộ thao tác đọc dữ liệu 6 bảng (Users, Documents, Nodes, Tasks, Progress, Submissions) đi qua `fetchTableData()` trong [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js) gọi thẳng Supabase PostgREST: `GET /rest/v1/{table}?select=*`.
  3. Chức năng **Course & Lesson Studio**: Khi bấm "Save to Database", hàm `saveCurriculumNodeAndTasks()` gửi HTTP POST (với header `Prefer: resolution=merge-duplicates`) cập nhật trực tiếp 2 bảng `roadmap_nodes` và `tasks` trên Supabase.
  4. Chức năng **Demo Presets (0%, 67%, 100%)**: Gọi `applyDemoPreset()`, cập nhật trực tiếp bảng `user_progress` trên Supabase cho học viên `student@offbyone.demo`.

---

## 4. Các Điểm Cần Lưu Ý Khi Bàn Giao Cho Team Backend

Dưới đây là các vị trí Frontend hiện đang **gọi trực tiếp Supabase** hoặc **dùng Mock** mà Backend cần xây dựng API bọc ngoài để chuẩn hóa kiến trúc sản phẩm:

### 4.1. Kích hoạt tính năng Socratic AI Chat qua FastAPI
- **Hiện trạng**: Backend đã có sẵn endpoint `@router.post("/tutor/chat")` trong [`api/modules/tutor.py`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/api/modules/tutor.py), nhận `{ taskId, nodeId, message, studentCode }`. Tuy nhiên component [`web/components/workspace/SocraticTutorPanel.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/workspace/SocraticTutorPanel.tsx) vẫn đang đọc dữ liệu tĩnh từ [`web/mocks/socraticTutorData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/socraticTutorData.js).
- **Yêu cầu bàn giao**: Chuyển nút bấm "Ask Socratic Tutor" và "Request Next Hint" sang gọi `fetch('/api/tutor/chat')` để LLM Gemini/RAG trực tiếp sinh câu hỏi gợi mở cho học viên dựa theo mã lỗi thực tế.

### 4.2. Tải lên và xử lý PDF Syllabus (RAG Indexing)
- **Hiện trạng**: Backend đã có endpoint `@router.post("/upload")` trong [`api/modules/lecture/ocr.py`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/api/modules/lecture/ocr.py). Nhưng ở Frontend, hàm `recordUploadedDocument` trong [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js) đang ghi thẳng metadata giả lập lên Supabase.
- **Yêu cầu bàn giao**: Khi người dùng thả file PDF vào giao diện Roadmap, Frontend cần gửi file nhị phân qua `multipart/form-data` đến `POST /api/documents/upload` để Backend chạy OCR, phân tách vector chunks và tự động tổng hợp cây kỹ năng (DAG Skill Tree).

### 4.3. Đưa toàn bộ nghiệp vụ Quản trị (/admin) qua Backend API Gateway
- **Hiện trạng**: [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js) đang gửi trực tiếp `NEXT_PUBLIC_SUPABASE_KEY` lên Supabase PostgREST cho các thao tác nhạy cảm (sửa khóa học, đổi role user, reset tiến độ, xóa bản ghi).
- **Yêu cầu bàn giao**: Backend cần bổ sung router `/api/admin` (ví dụ: `GET /api/admin/tables/{table}`, `POST /api/admin/curriculum/save`, `POST /api/admin/presets/apply`) có middleware kiểm tra quyền Admin (`role === 'admin'`) dựa trên Session Cookie/JWT, sau đó backend dùng Service Role Key để thao tác với Supabase, ngăn chặn rò rỉ quyền sửa dữ liệu từ phía trình duyệt.

### 4.4. Chấm điểm trắc nghiệm an toàn trên Server (Quiz Grading)
- **Hiện trạng**: Backend đã có endpoint `@router.post("/quiz/evaluate")` trong [`api/modules/lecture/roadmap.py`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/api/modules/lecture/roadmap.py) và Frontend đã có hàm `evaluateQuizAnswer()` trong [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js). Tuy nhiên, trang [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx) đang so sánh đáp án đúng trực tiếp trên giao diện (`option.isCorrect`).
- **Yêu cầu bàn giao**: Loại bỏ cờ `isCorrect` trong payload trả về của bài trắc nghiệm gửi xuống trình duyệt, và bắt buộc gọi `POST /api/quiz/evaluate` để server chấm điểm và trả về lời giải thích Socratic.
