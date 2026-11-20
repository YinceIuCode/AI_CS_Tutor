# TÀI LIỆU ĐẶC TẢ API & PHÂN CÔNG NHIỆM VỤ BACKEND (FASTAPI + SUPABASE)
**Dự án:** Nền tảng Hỗ trợ Học tập Thông minh OffByOne  
**Người lập:** Team Lead & Frontend Lead  
**Đối tượng bàn giao:** Backend Lead & Nhóm phát triển Backend API  
**Cơ sở dữ liệu:** 6 Bảng Lean Supabase (`users`, `knowledge_documents`, `roadmap_nodes`, `tasks`, `user_progress`, `code_submissions`)

---

## 1. TỔNG QUAN KIẾN TRÚC & QUY ƯỚC CHUNG

1. **Giao thức & Định dạng:** Toàn bộ API sử dụng chuẩn **RESTful JSON**, giao tiếp qua giao thức HTTP/HTTPS.
2. **Cổng chạy (Port):** Backend FastAPI chạy mặc định tại cổng `http://localhost:8000`.
3. **CORS:** Bắt buộc cấu hình middleware cho phép Frontend Next.js (`http://localhost:3000`) gọi dữ liệu kèm Cookie:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
4. **Mã trạng thái HTTP chuẩn:**
   - `200 OK`: Truy vấn hoặc xử lý thành công.
   - `201 Created`: Tạo mới bản ghi thành công (đăng ký, nộp bài).
   - `400 Bad Request`: Dữ liệu đầu vào sai định dạng hoặc thiếu trường bắt buộc.
   - `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn / không hợp lệ.
   - `404 Not Found`: Không tìm thấy tài nguyên (User, Node, Task).
   - `500 Internal Server Error`: Lỗi logic máy chủ (kèm log chi tiết ở terminal).

---

## 2. PHÂN CHIA MODULE & ĐẶC TẢ CHI TIẾT TỪNG API

---

### MODULE 1: AUTHENTICATION & TÀI KHOẢN (Gợi ý: Dev 1)
> **Mục tiêu:** Xóa bỏ hoàn toàn việc so khớp mật khẩu ở Frontend, chuyển việc băm mật khẩu và cấp Token an toàn về Backend.

#### API 1.1: Đăng nhập tài khoản (`POST /api/auth/login`)
- **Phục vụ màn hình:** Trang đăng nhập [`/auth`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/auth/page.tsx).
- **Bảng Database:** `users`.
- **Request Body (JSON):**
  ```json
  {
    "email": "student@offbyone.demo",
    "password": "Demo1234"
  }
  ```
- **Xử lý nghiệp vụ bên trong (Logic):**
  1. Validate email và password không được để trống.
  2. Query Supabase: `SELECT * FROM users WHERE email = :email`. Nếu không tìm thấy $\to$ trả về lỗi `401` ("Email hoặc mật khẩu không chính xác").
  3. So khớp mật khẩu: Sử dụng `passlib.context` hoặc `bcrypt` để đối chiếu `password` gửi lên với `password_hash` trong database. (Hỗ trợ định dạng demo `offbyone_demo_hash::...` nếu có).
  4. Nếu khớp: Sinh mã JWT `access_token` có hạn dùng (ví dụ: 7 ngày).
  5. Đóng gói JWT vào **HttpOnly Cookie** (`Set-Cookie: access_token=...; HttpOnly; SameSite=Lax; Path=/`).
- **Response Thành công (`200 OK`):**
  ```json
  {
    "success": true,
    "user": {
      "id": "00000001-0000-4000-8000-000000000001",
      "email": "student@offbyone.demo",
      "fullName": "Demo Student",
      "role": "student",
      "accountType": "registered"
    }
  }
  ```

#### API 1.2: Đăng ký tài khoản (`POST /api/auth/register`)
- **Phục vụ màn hình:** Tab Đăng ký tại [`/auth`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/auth/page.tsx).
- **Bảng Database:** `users`, `user_progress`.
- **Request Body (JSON):**
  ```json
  {
    "fullName": "Nguyen Van B",
    "email": "student_b@offbyone.demo",
    "password": "MyPassword123"
  }
  ```
- **Xử lý nghiệp vụ bên trong (Logic):**
  1. Kiểm tra email đã tồn tại trong bảng `users` chưa. Nếu có $\to$ trả về `400` ("Email đã được đăng ký").
  2. Băm mật khẩu bằng bcrypt: `password_hash = bcrypt.hash(password)`.
  3. Chèn dòng mới vào bảng `users`.
  4. Khởi tạo ngay 1 dòng tiến độ mặc định trong bảng `user_progress` với `user_id` mới tạo (`completed_tasks = {}`, `code_drafts = {}`).
  5. Sinh token và tự động đăng nhập (Set-Cookie).
- **Response Thành công (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "user": {
      "id": "generated-uuid",
      "email": "student_b@offbyone.demo",
      "fullName": "Nguyen Van B",
      "role": "student"
    }
  }
  ```

#### API 1.3: Lấy thông tin phiên hiện tại (`GET /api/auth/me`)
- **Phục vụ:** Tự động giữ trạng thái đăng nhập khi người dùng F5 tải lại trang.
- **Logic:** Đọc `access_token` từ Cookie, giải mã lấy `user_id`. Truy vấn thông tin cơ bản từ `users` và trả về `user` object.

---

### MODULE 2: ROADMAP & NỘI DUNG BÀI HỌC (Gợi ý: Dev 2)
> **Mục tiêu:** Cung cấp dữ liệu cây kỹ năng 10 node DSA và nội dung 30 bài học; bảo vệ đáp án trắc nghiệm không bị lộ ra Frontend.

#### API 2.1: Lấy Cây kỹ năng DSA (`GET /api/roadmap`)
- **Phục vụ màn hình:** Trang Cây kỹ năng [`/roadmap`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx).
- **Bảng Database:** `roadmap_nodes`, `tasks`, `knowledge_documents`.
- **Logic:**
  1. Query toàn bộ 10 dòng trong bảng `roadmap_nodes`, sắp xếp theo `sequence_order ASC`.
  2. Query toàn bộ các bài học trong bảng `tasks` (chỉ lấy các trường hiển thị: `id`, `node_id`, `task_type`, `title`, `description`).
  3. Ghép các task vào đúng `node` tương ứng.
- **Response Thành công (`200 OK`):**
  ```json
  {
    "courseTitle": "Data Structures & Algorithms",
    "nodes": [
      {
        "id": "avl-tree",
        "shortCode": "08",
        "label": "AVL Tree",
        "description": "Self-balancing binary search trees...",
        "complexity": "O(log N)",
        "prerequisites": ["binary-search-tree"],
        "totalTasks": 3,
        "tasks": [
          { "id": "avl-tree-task-1", "title": "Core Theory & Big-O", "type": "theory" },
          { "id": "avl-tree-task-2", "title": "Quiz: Balance Factor", "type": "quiz" },
          { "id": "avl-tree-task-3", "title": "Code: Right Rotation", "type": "coding" }
        ]
      }
    ],
    "documentMeta": {
      "name": "CS101_DSA_Syllabus_HCMUS.pdf",
      "size": "2.4 MB",
      "status": "indexed"
    }
  }
  ```

#### API 2.2: Lấy chi tiết nội dung bài học (`GET /api/tasks/{task_id}`)
- **Phục vụ màn hình:** Màn hình học tập [`/workspace`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx).
- **Bảng Database:** `tasks`.
- **ĐIỀU KIỆN BẢO MẬT BẮT BUỘC:**
  - Nếu `task_type == "quiz"`: Backend đọc cột `content` JSONB, **PHẢI XÓA BỎ TRƯỜNG `isCorrect`** trong danh sách options trước khi trả về!
  - Nếu `task_type == "coding"`: Chỉ trả về các **Sample Test Cases công khai** (`isPublic: true`), **giấu toàn bộ các Hidden Test Cases**!
- **Response Thành công (`200 OK`):**
  Trả về toàn bộ object trong cột `content: JSONB` đã được lọc an toàn.

#### API 2.3: Chấm điểm bài trắc nghiệm (`POST /api/quiz/evaluate`)
- **Phục vụ:** Bắt sự kiện khi sinh viên bấm chọn đáp án A, B, C, D trên Quiz Panel.
- **Request Body (JSON):**
  ```json
  {
    "taskId": "avl-tree-task-2",
    "selectedOption": "A"
  }
  ```
- **Logic:**
  1. Backend đọc đáp án chuẩn được lưu trong `tasks.content.options`.
  2. So sánh `selectedOption == correctOption`.
  3. Nếu đúng: Trả về `{ "isCorrect": true, "explanation": "Chính xác! Balance factor = +2..." }`.
  4. Nếu sai: Trả về `{ "isCorrect": false, "socraticGuidance": "Gợi ý: Cây con bên trái đang cao hơn bên phải..." }`.

---

### MODULE 3: CHẤM BÀI LẬP TRÌNH & RUN SANDBOX (Gợi ý: Dev 3 - Kỹ thuật cao)
> **Mục tiêu:** Thay thế engine giả lập ở Frontend bằng việc biên dịch và chạy code C++ thật trên server.

#### API 3.1: Chạy thử code nhanh (`POST /api/code/run`)
- **Phục vụ:** Nút **"Run Code"** ở Coding Workspace (chạy với 2-3 sample test case công khai).
- **Request Body (JSON):**
  ```json
  {
    "taskId": "avl-tree-task-3",
    "code": "#include <iostream>...",
    "language": "C++"
  }
  ```
- **Xử lý bên trong:**
  1. Lưu code của sinh viên vào file tạm `/tmp/submission_{uuid}.cpp`.
  2. Chạy lệnh biên dịch: `g++ -O2 -std=c++17 /tmp/submission_{uuid}.cpp -o /tmp/solution_{uuid}` với giới hạn thời gian (Timeout 3s).
  3. Nếu lỗi biên dịch: Bắt `stderr` trả về `errorType: "Compilation Error"`.
  4. Nếu biên dịch thành công: Chạy chương trình với từng `input` của sample test cases, so sánh `stdout` thực tế với `expected_output`. Đo thời gian chạy (ms).
- **Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "metrics": { "runtimeMs": 14, "memoryMb": "4.2 MB" },
    "passedCount": 2,
    "totalCount": 2,
    "testCases": [
      { "id": 1, "label": "Test Case #1", "passed": true, "actual": "x = 20" },
      { "id": 2, "label": "Test Case #2", "passed": true, "actual": "x = 5" }
    ],
    "stdout": "All 2 sample test cases passed."
  }
  ```

#### API 3.2: Nộp bài chấm điểm chính thức (`POST /api/code/submit`)
- **Phục vụ:** Nút **"Submit"** ở Coding Workspace.
- **Bảng Database:** `code_submissions`, `user_progress`.
- **Logic:**
  1. Xác thực sinh viên từ Cookie JWT (`user_id`).
  2. Lấy toàn bộ bộ test case (gồm cả Sample và Hidden Test Cases) từ `tasks.content.testCases`.
  3. Chạy chấm toàn bộ bài làm.
  4. Tính điểm và trạng thái (`success` nếu pass 100%, hoặc `failed`).
  5. **Lưu lịch sử nộp bài vào bảng `code_submissions`** trên Supabase.
  6. Nếu đạt 100% điểm: Tự động cập nhật `completed_tasks[taskId] = true` vào bảng `user_progress` của học viên đó!
- **Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "passedCount": 8,
    "totalCount": 8,
    "metrics": { "runtimeMs": 16, "memoryMb": "4.3 MB" },
    "isCompleted": true,
    "message": "Chúc mừng! Bạn đã giải thành công bài tập này."
  }
  ```

---

### MODULE 4: SOCRATIC AI & ĐỒNG BỘ TIẾN ĐỘ (Gợi ý: Dev 4)
> **Mục tiêu:** Tích hợp LLM sinh gợi ý sư phạm không tiết lộ đáp án và quản lý lưu vết tiến độ.

#### API 4.1: Chat với Trợ giảng Socratic AI (`POST /api/tutor/chat`)
- **Phục vụ:** Cửa sổ nổi Socratic Tutor Panel khi sinh viên hỏi bài hoặc bị lỗi code.
- **Request Body (JSON):**
  ```json
  {
    "nodeId": "avl-tree",
    "taskId": "avl-tree-task-3",
    "studentCode": "#include <iostream>...",
    "studentMessage": "Sao code của em bị segmentation fault ở test case 5 vậy?",
    "errorLog": "Signal 11: Invalid memory access at address 0x0"
  }
  ```
- **Xử lý bên trong (AI Prompting):**
  1. Lấy ngữ cảnh bài học từ bảng `roadmap_nodes.socratic_profile` (Slide citation, bất biến cấu trúc).
  2. Gửi prompt đến **Google Gemini API**:
     *"Bạn là Trợ giảng Socratic AI cho môn DSA. Sinh viên đang gặp lỗi null pointer tại hàm rotateRight. Hãy hướng dẫn bằng 1 câu hỏi gợi mở, tuyệt đối KHÔNG đưa ra code sửa mẫu, hướng sinh viên kiểm tra con trỏ y trước khi truy cập y->left."*
  3. Nhận câu trả lời từ Gemini.
- **Response (`200 OK`):**
  ```json
  {
    "reply": "Quan sát kỹ con trỏ y trước dòng 19: nếu hàm nhận vào một cây rỗng (nullptr), điều gì sẽ xảy ra khi bạn truy cập y->left?",
    "suggestedLine": 19
  }
  ```

#### API 4.2: Lưu bản nháp code (Auto-save) (`POST /api/progress/draft`)
- **Phục vụ:** Tự động lưu code sinh viên đang gõ dở trong Monaco Editor.
- **Bảng Database:** `user_progress`.
- **Request Body:** `{ "taskId": "avl-tree-task-3", "code": "...", "language": "C++" }`.
- **Logic:** Cập nhật trường `code_drafts[taskId]` trong bảng `user_progress` của sinh viên.

#### API 4.3: Lấy tiến độ học viên (`GET /api/progress`)
- **Phục vụ:** Khi học viên vào lại trang web, khôi phục các node đã hoàn thành và code nháp.
- **Bảng Database:** `user_progress`.
- **Logic:** Đọc từ `user_progress` theo `user_id` và trả về toàn bộ `{ completedTasks, quizAnswers, codeDrafts, hintsRemaining }`.

---

## 3. CHECKLIST KIỂM TRA BÀN GIAO (DEFINITION OF DONE)

Một API được coi là hoàn tất khi:
1. [ ] Có schema Pydantic rõ ràng cho cả Request Body và Response Body.
2. [ ] Có try/catch xử lý ngoại lệ và trả về HTTP status code phù hợp (không trả 200 khi có lỗi).
3. [ ] Đã test thử trên giao diện Swagger UI tự động của FastAPI tại: `http://localhost:8000/docs`.
4. [ ] Dữ liệu đọc/ghi kiểm tra thấy xuất hiện chính xác trên **Supabase Table Editor**.
