# 02. MÔ HÌNH DỮ LIỆU LOGIC (LOGICAL DATA MODEL & DATA DICTIONARY)
**Dự án:** Nền tảng Hỗ trợ Học tập Thông minh OffByOne  
**Vai trò:** Database Architect & System Analyst  
**Tài liệu:** `docs/data-model/02_LOGICAL_DATA_MODEL.md`  
**Chuẩn quy ước:** PostgreSQL Standard (snake_case, UUID v4 Primary Keys, Timestamptz with Timezone)

---

## 1. QUY ƯỚC ĐẶT TÊN VÀ KIỂU DỮ LIỆU (CONVENTIONS)

1. **Bảng và Cột:** Đặt tên dạng số nhiều cho bảng (`users`, `tasks`, `code_drafts`), sử dụng kiểu chữ thường nối dấu gạch dưới (`snake_case`).
2. **Khóa chính (Primary Key):** Luôn là `id` kiểu `UUID` sinh bằng hàm `gen_random_uuid()` (hoặc `UUID v4`) nhằm tránh trùng lặp dữ liệu phân tán giữa các microservices và client.
3. **Khóa ngoại (Foreign Key):** Đặt tên theo công thức `<tên_bảng_số_ít>_id` (vd: `user_id`, `task_id`, `course_id`), có chỉ mục (Index) tự động để tăng tốc phép nối JOIN.
4. **Thời gian:** Sử dụng kiểu `TIMESTAMPTZ` (Timestamp with time zone) lưu chuẩn UTC; luôn có hai trường kiểm toán `created_at` (mặc định `CURRENT_TIMESTAMP`) và `updated_at`.
5. **Dữ liệu cấu trúc linh hoạt:** Sử dụng kiểu `JSONB` cho các cấu trúc mảng hoặc metadata có thể mở rộng (vd: `constraints`, `examples`, `highlight_terms`) nhằm tối ưu hiệu năng truy vấn chỉ mục GIN trên PostgreSQL.

---

## 2. TỪ ĐIỂN DỮ LIỆU CHI TIẾT (LOGICAL DATA DICTIONARY)

---

### BẢNG 1: `users`
- **Mục đích:** Quản lý thông tin tài khoản người dùng đăng nhập hệ thống.
- **Nguồn:** [`web/services/authService.js:87-94`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js#L87-L94) và [`web/mocks/mockUsers.js:6-25`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/mockUsers.js#L6-L25).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính định danh tài khoản người dùng |
| `email` | `VARCHAR(255)` | - | - | No | Yes | None | Địa chỉ email đăng nhập (chuẩn hóa chữ thường) |
| `password_hash`| `VARCHAR(255)` | - | - | Yes | No | None | Mật khẩu băm (Argon2id/bcrypt). Null nếu đăng nhập OAuth Google |
| `full_name` | `VARCHAR(150)` | - | - | No | No | None | Họ và tên hiển thị của người dùng |
| `role` | `VARCHAR(30)` | - | - | No | No | `'student'` | Vai trò: `'student'`, `'educator'`, `'admin'` |
| `account_type` | `VARCHAR(20)` | - | - | No | No | `'registered'` | Phân loại tài khoản: `'registered'` hoặc `'guest'` |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo tài khoản |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm cập nhật thông tin gần nhất |

---

### BẢNG 2: `auth_sessions`
- **Mục đích:** Quản lý phiên làm việc đa thiết bị và Refresh Token của người dùng.
- **Nguồn:** Đề xuất nâng cấp từ `sessionStorage("algopath_auth_session")`.

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính phiên đăng nhập |
| `user_id` | `UUID` | - | `users.id` | No | No | None | Người dùng sở hữu phiên |
| `refresh_token_hash` | `VARCHAR(255)` | - | - | No | Yes | None | Giá trị băm của Refresh Token |
| `ip_address` | `VARCHAR(45)` | - | - | Yes | No | None | Địa chỉ IP đăng nhập (IPv4 hoặc IPv6) |
| `user_agent` | `TEXT` | - | - | Yes | No | None | Chuỗi User-Agent của trình duyệt/thiết bị |
| `expires_at` | `TIMESTAMPTZ` | - | - | No | No | None | Thời điểm phiên hết hạn |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo phiên |

---

### BẢNG 3: `courses`
- **Mục đích:** Quản lý danh mục các môn học/khóa học (xóa bỏ ràng buộc cố định DSA).
- **Nguồn:** Đề xuất chuẩn hóa từ `courseTitle` tại [`web/services/roadmapService.js:29`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js#L29).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính định danh khóa học |
| `code` | `VARCHAR(50)` | - | - | No | Yes | None | Mã môn học (vd: `'CS101'`, `'CS201'`, `'OOP102'`) |
| `title` | `VARCHAR(200)` | - | - | No | No | None | Tiêu đề khóa học (vd: `'Data Structures & Algorithms'`) |
| `description` | `TEXT` | - | - | Yes | No | None | Mô tả tóm tắt nội dung và mục tiêu môn học |
| `department` | `VARCHAR(150)` | - | - | Yes | No | None | Khoa / Trường phụ trách (vd: `'FIT - HCMUS'`) |
| `icon` | `VARCHAR(50)` | - | - | Yes | No | `'BookOpen'` | Tên biểu tượng giao diện Lucide |
| `is_published` | `BOOLEAN` | - | - | No | No | `true` | Trạng thái công khai môn học |
| `created_by` | `UUID` | - | `users.id` | Yes | No | None | Giảng viên hoặc Quản trị viên khởi tạo |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm cập nhật |

---

### BẢNG 4: `course_enrollments`
- **Mục đích:** Bảng nối quản lý việc ghi danh của sinh viên vào từng khóa học.
- **Nguồn:** Đề xuất phục vụ quản lý đa môn học.

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính bản ghi ghi danh |
| `user_id` | `UUID` | - | `users.id` | No | No | None | Mã sinh viên tham gia |
| `course_id` | `UUID` | - | `courses.id`| No | No | None | Khóa học tham gia |
| `role_in_course` | `VARCHAR(30)` | - | - | No | No | `'student'` | Vai trò trong môn: `'student'`, `'ta'`, `'instructor'` |
| `enrolled_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm bắt đầu học |
| `last_accessed_at` | `TIMESTAMPTZ` | - | - | Yes | No | None | Thời điểm truy cập môn học gần nhất |

> **Ràng buộc:** `UNIQUE (user_id, course_id)` (Mỗi sinh viên chỉ ghi danh 1 lần vào một khóa học).

---

### BẢNG 5: `knowledge_base_documents`
- **Mục đích:** Lưu trữ metadata và file tài liệu đề cương (Syllabus) / slide giáo trình đã nạp vào RAG.
- **Nguồn:** [`web/mocks/roadmapData.js:6-13`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js#L6-L13).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính tài liệu |
| `course_id` | `UUID` | - | `courses.id`| No | No | None | Khóa học sở hữu tài liệu đề cương này |
| `uploaded_by` | `UUID` | - | `users.id` | Yes | No | None | Người tải file lên |
| `file_name` | `VARCHAR(255)` | - | - | No | No | None | Tên file gốc (vd: `'CS101_DSA_Syllabus_HCMUS.pdf'`) |
| `file_size_bytes` | `BIGINT` | - | - | No | No | `0` | Kích thước file tính theo bytes |
| `storage_path` | `VARCHAR(500)` | - | - | No | No | None | Đường dẫn lưu trữ file trên Object Storage (S3/MinIO) |
| `mime_type` | `VARCHAR(100)` | - | - | No | No | `'application/pdf'` | Định dạng file tải lên |
| `status` | `VARCHAR(30)` | - | - | No | No | `'indexed'` | Trạng thái băm RAG: `'uploaded'`, `'processing'`, `'indexed'`, `'error'` |
| `indexed_chunks_count` | `INT` | - | - | No | No | `0` | Số lượng đoạn text chunks đã sinh vector |
| `indexed_at` | `TIMESTAMPTZ` | - | - | Yes | No | None | Thời điểm hoàn tất phân tích RAG |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tải lên |

---

### BẢNG 6: `roadmaps`
- **Mục đích:** Lưu trữ cấu trúc lộ trình cây kỹ năng của môn học.
- **Nguồn:** [`web/services/roadmapService.js:14-40`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js#L14-L40).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính lộ trình |
| `course_id` | `UUID` | - | `courses.id`| No | Yes | None | Khóa học liên kết (Mỗi khóa học có 1 lộ trình chính) |
| `title` | `VARCHAR(200)` | - | - | No | No | None | Tiêu đề lộ trình (vd: `'DSA Interactive Skill Tree'`) |
| `description` | `TEXT` | - | - | Yes | No | None | Mô tả chi tiết lộ trình học tập |
| `version` | `INT` | - | - | No | No | `1` | Số phiên bản cập nhật của lộ trình |
| `is_active` | `BOOLEAN` | - | - | No | No | `true` | Đánh dấu lộ trình đang kích hoạt |
| `total_nodes` | `INT` | - | - | No | No | `0` | Tổng số lượng node trong cây |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm cập nhật |

---

### BẢNG 7: `roadmap_nodes`
- **Mục đích:** Các đỉnh (chủ đề kiến thức) trên cây kỹ năng. Chứa nội dung dùng chung, không chứa tiến độ cá nhân.
- **Nguồn:** [`web/mocks/roadmapData.js:20-58`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js#L20-L58).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính của node |
| `roadmap_id` | `UUID` | - | `roadmaps.id`| No | No | None | Lộ trình kỹ năng chứa node này |
| `node_key` | `VARCHAR(100)` | - | - | No | No | None | Khóa định danh slug (vd: `'avl-tree'`, `'linked-list'`) |
| `short_code` | `VARCHAR(10)` | - | - | No | No | None | Mã hiển thị ngắn (vd: `'01'`, `'08'`) |
| `label` | `VARCHAR(150)` | - | - | No | No | None | Tên hiển thị chủ đề (vd: `'AVL Tree'`) |
| `description` | `TEXT` | - | - | No | No | None | Tóm tắt lý thuyết cốt lõi của chủ đề |
| `target_complexity`| `VARCHAR(50)` | - | - | Yes | No | None | Độ phức tạp tiệm cận mục tiêu (vd: `'O(log N)'`) |
| `sequence_order` | `INT` | - | - | No | No | `1` | Thứ tự sắp xếp phân tầng ưu tiên |
| `total_tasks_count`| `INT` | - | - | No | No | `3` | Số lượng bài tập trực thuộc (mặc định 3) |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm cập nhật |

> **Ràng buộc:** `UNIQUE (roadmap_id, node_key)`.

---

### BẢNG 8: `node_prerequisites`
- **Mục đích:** Bảng nối quản lý quan hệ phụ thuộc tiên quyết (DAG Edges) giữa các `roadmap_nodes`.
- **Nguồn:** Thuộc tính `prerequisites: string[]` tại [`web/mocks/roadmapData.js:29`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js#L29).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính cạnh nối đồ thị |
| `node_id` | `UUID` | - | `roadmap_nodes.id` | No | No | None | Node mục tiêu (Node cần học) |
| `prerequisite_node_id` | `UUID` | - | `roadmap_nodes.id` | No | No | None | Node điều kiện bắt buộc phải hoàn thành trước |
| `dependency_type` | `VARCHAR(20)` | - | - | No | No | `'strict'` | Phân loại: `'strict'` (bắt buộc) hoặc `'recommended'` |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm thiết lập |

> **Ràng buộc:** `UNIQUE (node_id, prerequisite_node_id)`. Ràng buộc kiểm tra không nối một node với chính nó (`node_id != prerequisite_node_id`).

---

### BẢNG 9: `tasks`
- **Mục đích:** Quản lý danh sách bài tập dùng chung trong từng chủ đề (Theory, Quiz, Coding).
- **Nguồn:** Mảng `tasks` tại [`web/mocks/roadmapData.js:33-58`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js#L33-L58).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính bài tập |
| `node_id` | `UUID` | - | `roadmap_nodes.id` | No | No | None | Node chủ đề chứa bài tập này |
| `task_key` | `VARCHAR(100)` | - | - | No | No | None | Khóa slug duy nhất (vd: `'avl-tree-task-3'`) |
| `title` | `VARCHAR(200)` | - | - | No | No | None | Tiêu đề bài tập |
| `description` | `TEXT` | - | - | Yes | No | None | Tóm tắt mục tiêu bài tập |
| `type` | `VARCHAR(20)` | - | - | No | No | None | Loại bài tập: `'theory'`, `'quiz'`, `'coding'` |
| `sequence_order` | `INT` | - | - | No | No | `1` | Thứ tự hiển thị trong thanh Task Sidebar |
| `is_required` | `BOOLEAN` | - | - | No | No | `true` | Bắt buộc hoàn thành để vượt qua node |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm cập nhật |

> **Ràng buộc:** `UNIQUE (node_id, task_key)`.

---

### BẢNG 10: `theory_contents`
- **Mục đích:** Lưu trữ nội dung chi tiết bài học lý thuyết.
- **Nguồn:** [`web/mocks/workspaceTasks.js:7-50`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L7-L50).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính nội dung lý thuyết |
| `task_id` | `UUID` | - | `tasks.id` | No | Yes | None | Bài tập liên kết (Quan hệ 1:1) |
| `header_title` | `VARCHAR(255)` | - | - | No | No | None | Tiêu đề header (vd: `'CORE THEORY: AVL TREE'`) |
| `module_label` | `VARCHAR(100)` | - | - | Yes | No | None | Nhãn tiến độ (vd: `'Module 1 of 3:'`) |
| `summary_lead` | `TEXT` | - | - | No | No | None | Đoạn văn tóm lược khái niệm mở đầu |
| `highlight_terms`| `JSONB` | - | - | Yes | No | `'{}'` | Cụm từ khóa tô màu (vd: `{"concept": "Balance Factor"}`) |
| `knowledge_cards`| `JSONB` | - | - | No | No | `'[]'` | Danh sách thẻ kiến thức `[{badge, title, detail}]` |
| `slide_label` | `VARCHAR(100)` | - | - | Yes | No | None | Nhãn trích dẫn slide PDF (vd: `'Open Slide 14 (PDF)'`) |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |

---

### BẢNG 11: `quiz_questions`
- **Mục đích:** Quản lý câu hỏi trắc nghiệm kiểm tra khái niệm.
- **Nguồn:** [`web/mocks/workspaceTasks.js:52-95`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L52-L95).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính câu hỏi |
| `task_id` | `UUID` | - | `tasks.id` | No | Yes | None | Bài tập trắc nghiệm liên kết (Quan hệ 1:1) |
| `question_text` | `TEXT` | - | - | No | No | None | Nội dung câu hỏi trắc nghiệm |
| `slide_label` | `VARCHAR(100)` | - | - | Yes | No | None | Nhãn trích dẫn slide tham chiếu |
| `hint_awaiting` | `TEXT` | - | - | Yes | No | None | Gợi ý khi chưa chọn đáp án |
| `hint_correct` | `TEXT` | - | - | Yes | No | None | Giải thích khi chọn đáp án đúng |
| `hint_incorrect`| `TEXT` | - | - | Yes | No | None | Gợi ý sư phạm khi chọn đáp án sai |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |

---

### BẢNG 12: `quiz_options`
- **Mục đích:** Danh sách các lựa chọn A, B, C, D của câu hỏi trắc nghiệm.
- **Nguồn:** Mảng `options` tại [`web/mocks/workspaceTasks.js:56-83`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L56-L83).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính lựa chọn đáp án |
| `question_id` | `UUID` | - | `quiz_questions.id`| No | No | None | Thuộc về câu hỏi nào |
| `option_key` | `VARCHAR(10)` | - | - | No | No | None | Nhãn phím: `'A'`, `'B'`, `'C'`, `'D'` |
| `option_text` | `TEXT` | - | - | No | No | None | Nội dung hiển thị của lựa chọn |
| `is_correct` | `BOOLEAN` | - | - | No | No | `false` | Đánh dấu đáp án chính xác |
| `sequence_order` | `INT` | - | - | No | No | `1` | Thứ tự hiển thị |

> **Ràng buộc:** `UNIQUE (question_id, option_key)`.

---

### BẢNG 13: `coding_tasks`
- **Mục đích:** Quản lý đặc tả bài toán lập trình và cấu hình môi trường chấm. Hỗ trợ Single-file và Multi-file.
- **Nguồn:** [`web/mocks/workspaceTasks.js:96-155`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L96-L155) và [`web/components/workspace/ProblemDescriptionPanel.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/workspace/ProblemDescriptionPanel.tsx).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính bài tập code |
| `task_id` | `UUID` | - | `tasks.id` | No | Yes | None | Bài tập liên kết (Quan hệ 1:1) |
| `project_type` | `VARCHAR(30)` | - | - | No | No | `'single-file'` | Phân loại: `'single-file'` hoặc `'multi-file'` |
| `primary_language` | `VARCHAR(30)` | - | - | No | No | `'C++'` | Ngôn ngữ chủ đạo: `'C++'`, `'Python'`, `'Java'` |
| `title` | `VARCHAR(200)` | - | - | No | No | None | Tiêu đề đề bài (Problem Title) |
| `difficulty` | `VARCHAR(20)` | - | - | No | No | `'Medium'` | Độ khó: `'Easy'`, `'Medium'`, `'Hard'` |
| `description` | `TEXT` | - | - | No | No | None | Mô tả chi tiết đề bài |
| `input_format` | `TEXT` | - | - | No | No | None | Định dạng dữ liệu đầu vào |
| `output_format` | `TEXT` | - | - | No | No | None | Định dạng kết quả đầu ra |
| `constraints` | `JSONB` | - | - | No | No | `'[]'` | Mảng danh sách các điều kiện biên |
| `notes` | `TEXT` | - | - | Yes | No | None | Ghi chú thêm / Callout cảnh báo sư phạm |
| `examples` | `JSONB` | - | - | No | No | `'[]'` | Danh sách ví dụ mẫu `[{input, output, explanation}]` |
| `time_limit_ms` | `INT` | - | - | No | No | `1000` | Giới hạn thời gian thực thi (mili-giây) |
| `memory_limit_mb` | `INT` | - | - | No | No | `256` | Giới hạn dung lượng bộ nhớ RAM (Megabytes) |
| `analysis_spec` | `JSONB` | - | - | Yes | No | `'{}'` | Mục tiêu tiệm cận: `{timeComplexity, spaceComplexity, optimalNote}` |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm cập nhật |

---

### BẢNG 14: `coding_task_starter_files`
- **Mục đích:** **Giải quyết yêu cầu Multi-file**. Quản lý cây file mã nguồn khởi tạo của bài tập.
- **Nguồn:** Mở rộng từ trường `fileName` và `initialCode` tại [`web/mocks/workspaceTasks.js:100-130`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L100-L130).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính file mẫu |
| `coding_task_id` | `UUID` | - | `coding_tasks.id`| No | No | None | Bài tập code sở hữu file này |
| `file_path` | `VARCHAR(255)` | - | - | No | No | None | Đường dẫn tương đối (vd: `'include/BankAccount.hpp'`, `'solution.cpp'`) |
| `file_name` | `VARCHAR(100)` | - | - | No | No | None | Tên file hiển thị (vd: `'BankAccount.hpp'`, `'solution.cpp'`) |
| `language` | `VARCHAR(30)` | - | - | No | No | `'cpp'` | Ngôn ngữ cú pháp Monaco Editor |
| `initial_content`| `TEXT` | - | - | No | No | `''` | Nội dung code khởi tạo mẫu ban đầu |
| `is_read_only` | `BOOLEAN` | - | - | No | No | `false` | Khóa không cho sinh viên sửa file (vd: file `main.cpp` chấm điểm) |
| `is_entry_point` | `BOOLEAN` | - | - | No | No | `false` | Đánh dấu file chứa hàm `main()` |
| `sequence_order` | `INT` | - | - | No | No | `1` | Thứ tự hiển thị trên tab thanh công cụ |

> **Ràng buộc:** `UNIQUE (coding_task_id, file_path)`.

---

### BẢNG 15: `coding_test_cases`
- **Mục đích:** Quản lý các test cases phục vụ chấm điểm. Phân tách rõ test case mẫu (`is_sample = true` khi Run Code) và test case ẩn (`is_sample = false` khi Submit).
- **Nguồn:** [`web/services/executionService.ts:80-140`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts#L80-L140).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính test case |
| `coding_task_id` | `UUID` | - | `coding_tasks.id`| No | No | None | Bài tập code tương ứng |
| `label` | `VARCHAR(150)` | - | - | No | No | None | Nhãn mô tả (vd: `'Test Case #1: Left-Heavy Rotation'`) |
| `input_data` | `TEXT` | - | - | No | No | None | Dữ liệu đầu vào của test case |
| `expected_output`| `TEXT` | - | - | No | No | None | Kết quả kỳ vọng chuẩn xác |
| `is_sample` | `BOOLEAN` | - | - | No | No | `false` | `true`: Công khai khi bấm Run; `false`: Ẩn chỉ chạy khi Submit |
| `is_boundary_edge_case` | `BOOLEAN` | - | - | No | No | `false` | Đánh dấu test kiểm tra trường hợp biên (Null/Empty) |
| `sequence_order` | `INT` | - | - | No | No | `1` | Thứ tự thực thi test case |

---

### BẢNG 16: `user_node_progress`
- **Mục đích:** Lưu trữ tiến độ học tập của từng sinh viên trên từng chủ đề của cây kỹ năng. Tách rời hoàn toàn khỏi `roadmap_nodes`.
- **Nguồn:** [`web/services/progressService.js:289-380`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L289-L380).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính bản ghi tiến độ node |
| `user_id` | `UUID` | - | `users.id` | No | No | None | Sinh viên sở hữu tiến độ |
| `node_id` | `UUID` | - | `roadmap_nodes.id` | No | No | None | Node chủ đề |
| `status` | `VARCHAR(20)` | - | - | No | No | `'locked'` | Trạng thái của sinh viên: `'completed'`, `'current'`, `'locked'` |
| `completed_tasks_count`| `INT` | - | - | No | No | `0` | Số bài tập sinh viên đã giải xong trong node |
| `progress_percent`| `INT` | - | - | No | No | `0` | Phần trăm hoàn thành (0 đến 100) |
| `unlocked_at` | `TIMESTAMPTZ` | - | - | Yes | No | None | Thời điểm node được mở khóa |
| `completed_at` | `TIMESTAMPTZ` | - | - | Yes | No | None | Thời điểm node hoàn thành 100% |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Cập nhật gần nhất |

> **Ràng buộc:** `UNIQUE (user_id, node_id)`.

---

### BẢNG 17: `user_task_progress`
- **Mục đích:** Theo dõi chi tiết sinh viên đã hoàn thành bài tập cụ thể hay chưa và số lượt trợ giúp Socratic AI còn lại.
- **Nguồn:** [`web/services/progressService.js:237-252`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L237-L252).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính bản ghi tiến độ task |
| `user_id` | `UUID` | - | `users.id` | No | No | None | Sinh viên sở hữu |
| `task_id` | `UUID` | - | `tasks.id` | No | No | None | Bài tập tương ứng |
| `status` | `VARCHAR(20)` | - | - | No | No | `'locked'` | Trạng thái: `'completed'`, `'current'`, `'locked'` |
| `hints_remaining_count`| `INT` | - | - | No | No | `2` | Số lượt gợi ý AI còn lại (mặc định 2) |
| `completed_at` | `TIMESTAMPTZ` | - | - | Yes | No | None | Thời điểm hoàn thành bài tập |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Cập nhật gần nhất |

> **Ràng buộc:** `UNIQUE (user_id, task_id)`.

---

### BẢNG 18: `quiz_attempts`
- **Mục đích:** Lưu trữ câu trả lời trắc nghiệm của sinh viên và kết quả đúng/sai.
- **Nguồn:** [`web/services/progressService.js:178-196`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L178-L196).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính lần làm quiz |
| `user_id` | `UUID` | - | `users.id` | No | No | None | Sinh viên làm bài |
| `task_id` | `UUID` | - | `tasks.id` | No | No | None | Bài tập trắc nghiệm |
| `selected_option_id`| `UUID` | - | `quiz_options.id` | Yes | No | None | Lựa chọn đáp án sinh viên đã bấm chọn |
| `is_submitted` | `BOOLEAN` | - | - | No | No | `false` | Đã nộp bài hay mới chỉ chọn nháp |
| `is_correct` | `BOOLEAN` | - | - | No | No | `false` | Kết quả đúng hay sai |
| `attempt_count` | `INT` | - | - | No | No | `1` | Số lần thử lại |
| `submitted_at` | `TIMESTAMPTZ` | - | - | Yes | No | None | Thời điểm nộp bài trắc nghiệm |

> **Ràng buộc:** `UNIQUE (user_id, task_id)`.

---

### BẢNG 19: `code_drafts`
- **Mục đích:** Quản lý không gian làm việc mã nguồn đang viết dở của sinh viên.
- **Nguồn:** [`web/services/progressService.js:198-217`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L198-L217).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính bản nháp code |
| `user_id` | `UUID` | - | `users.id` | No | No | None | Sinh viên sở hữu |
| `task_id` | `UUID` | - | `tasks.id` | No | No | None | Bài tập code tương ứng |
| `active_file_id`| `UUID` | - | `coding_task_starter_files.id` | Yes | No | None | File đang được mở active trên tab Monaco Editor |
| `is_outdated` | `BOOLEAN` | - | - | No | No | `false` | `true` khi sinh viên sửa code sau lần chạy gần nhất |
| `last_run_at` | `TIMESTAMPTZ` | - | - | Yes | No | None | Thời điểm nhấn Run Code gần nhất |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Cập nhật gần nhất |

> **Ràng buộc:** `UNIQUE (user_id, task_id)`.

---

### BẢNG 20: `code_draft_files`
- **Mục đích:** **Giải quyết lưu trữ Multi-file trong Draft**. Lưu nội dung chỉnh sửa mới nhất của từng file trong project code của sinh viên.
- **Nguồn:** Mở rộng từ `CodeProgressItem` tại [`web/services/progressService.js:8-12`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L8-L12).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính file nháp |
| `code_draft_id` | `UUID` | - | `code_drafts.id` | No | No | None | Thuộc về bản nháp nào |
| `starter_file_id`| `UUID` | - | `coding_task_starter_files.id`| Yes | No | None | Tham chiếu tới file đề bài ban đầu |
| `file_path` | `VARCHAR(255)` | - | - | No | No | None | Đường dẫn file (vd: `'include/BankAccount.hpp'`) |
| `file_name` | `VARCHAR(100)` | - | - | No | No | None | Tên file (vd: `'BankAccount.hpp'`) |
| `current_content`| `TEXT` | - | - | No | No | `''` | Nội dung code sinh viên đang gõ dở trên Monaco |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm gõ phím/lưu nháp gần nhất |

> **Ràng buộc:** `UNIQUE (code_draft_id, file_path)`.

---

### BẢNG 21: `code_submissions`
- **Mục đích:** Lưu lịch sử các lần nộp bài hoặc chạy thử code để chấm điểm, thống kê thời gian chạy và lưu điểm số.
- **Nguồn:** [`web/services/executionService.ts:35-57`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts#L35-L57).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính bài nộp |
| `user_id` | `UUID` | - | `users.id` | No | No | None | Sinh viên nộp bài |
| `task_id` | `UUID` | - | `tasks.id` | No | No | None | Bài tập code được nộp |
| `action_type` | `VARCHAR(20)` | - | - | No | No | `'submit'` | Phân loại hành động: `'run'` hoặc `'submit'` |
| `verdict` | `VARCHAR(50)` | - | - | No | No | None | Kết quả: `'accepted'`, `'runtime_error'`, `'wrong_answer'`, `'compilation_error'`, `'time_limit_exceeded'` |
| `error_title` | `VARCHAR(255)` | - | - | Yes | No | None | Tiêu đề lỗi (vd: `'Segmentation fault (SIGSEGV)'`) |
| `error_message` | `TEXT` | - | - | Yes | No | None | Chi tiết chẩn đoán lỗi |
| `error_line_number`| `INT` | - | - | Yes | No | None | Vị trí dòng code gây lỗi (nếu phát hiện được) |
| `runtime_ms` | `INT` | - | - | No | No | `0` | Thời gian chạy thực tế (ms) |
| `memory_mb` | `NUMERIC(5,2)` | - | - | No | No | `0.0` | Dung lượng RAM sử dụng (MB) |
| `passed_test_count`| `INT` | - | - | No | No | `0` | Số test case thành công |
| `total_test_count` | `INT` | - | - | No | No | `0` | Tổng số test case đã chấm |
| `stdout` | `TEXT` | - | - | Yes | No | None | Log kết quả in ra màn hình console |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm nộp bài |

---

### BẢNG 22: `code_submission_files`
- **Mục đích:** **Bảo toàn Snapshot Multi-file lúc nộp**. Đảm bảo bài nộp lưu trữ đúng toàn bộ code của mọi file tại thời điểm submit.
- **Nguồn:** Đề xuất nhằm bảo toàn tính toàn vẹn dữ liệu bài nộp Multi-file.

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính snapshot file |
| `submission_id` | `UUID` | - | `code_submissions.id` | No | No | None | Bài nộp tương ứng |
| `file_path` | `VARCHAR(255)` | - | - | No | No | None | Đường dẫn file (vd: `'include/BankAccount.hpp'`) |
| `file_name` | `VARCHAR(100)` | - | - | No | No | None | Tên file |
| `content_snapshot`| `TEXT` | - | - | No | No | None | Toàn bộ nội dung file đóng băng tại thời điểm nộp |

> **Ràng buộc:** `UNIQUE (submission_id, file_path)`.

---

### BẢNG 23: `submission_test_case_results`
- **Mục đích:** Ghi nhận chi tiết kết quả chạy trên từng test case của bài nộp.
- **Nguồn:** [`web/services/executionService.ts:13-21`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts#L13-L21).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính kết quả test |
| `submission_id` | `UUID` | - | `code_submissions.id` | No | No | None | Thuộc về bài nộp nào |
| `test_case_id` | `UUID` | - | `coding_test_cases.id` | No | No | None | Test case kiểm thử tương ứng |
| `passed` | `BOOLEAN` | - | - | No | No | `false` | Test case đạt hay không đạt |
| `actual_output` | `TEXT` | - | - | Yes | No | None | Kết quả chương trình thực tế in ra |
| `error_message` | `TEXT` | - | - | Yes | No | None | Chi tiết lỗi nếu crash (SIGSEGV, timeout) |
| `execution_time_ms`| `INT` | - | - | Yes | No | None | Thời gian chạy của riêng test case này |

---

### BẢNG 24: `socratic_tutor_profiles`
- **Mục đích:** Cấu hình tri thức và ngữ cảnh RAG cho Trợ giảng Socratic AI của từng chủ đề.
- **Nguồn:** [`web/mocks/socraticTutorData.js:7-130`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/socraticTutorData.js#L7-L130).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính hồ sơ Socratic |
| `node_id` | `UUID` | - | `roadmap_nodes.id` | No | Yes | None | Chủ đề kiến thức liên kết (Quan hệ 1:1) |
| `topic_label` | `VARCHAR(150)` | - | - | No | No | None | Nhãn tiêu đề chủ đề (vd: `'AVL Tree'`) |
| `rag_source_badge`| `VARCHAR(255)` | - | - | No | No | None | Nhãn nguồn RAG (vd: `'RAG Citations Active • CS101'`) |
| `slide_citation_title` | `VARCHAR(255)` | - | - | Yes | No | None | Tiêu đề slide bài giảng trích dẫn |
| `slide_citation_excerpt`| `TEXT` | - | - | Yes | No | None | Đoạn trích dẫn định lý / bất biến trong bài giảng |
| `slide_key_invariant` | `TEXT` | - | - | Yes | No | None | Bất biến cấu trúc cốt lõi cần nhớ |
| `dry_run_table_data` | `JSONB` | - | - | Yes | No | `'{}'` | Cấu trúc bảng truy vết con trỏ `{columns, rows}` |
| `faulty_line_config` | `JSONB` | - | - | Yes | No | `'{}'` | Cấu hình chẩn đoán dòng lỗi Monaco Editor |
| `created_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | - | - | No | No | `CURRENT_TIMESTAMP` | Thời điểm cập nhật |

---

### BẢNG 25: `socratic_hint_tiers`
- **Mục đích:** Quản lý 3 tầng gợi ý sư phạm tiến dần cho Socratic AI.
- **Nguồn:** Mảng `tiers` tại [`web/mocks/socraticTutorData.js:40-85`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/socraticTutorData.js#L40-L85).

| Field Name | Data Type | PK | FK | Nullable | Unique | Default Value | Description |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `id` | `UUID` | PK | - | No | Yes | `gen_random_uuid()` | Khóa chính tầng gợi ý |
| `profile_id` | `UUID` | - | `socratic_tutor_profiles.id` | No | No | None | Thuộc hồ sơ Socratic nào |
| `task_type` | `VARCHAR(20)` | - | - | No | No | `'coding'` | Dành cho dạng bài: `'theory'`, `'quiz'`, `'coding'` |
| `tier_level` | `INT` | - | - | No | No | None | Bậc thang gợi ý: `1`, `2`, `3` |
| `badge_label` | `VARCHAR(100)` | - | - | No | No | None | Nhãn bậc gợi ý (vd: `'Conceptual Probe'`) |
| `color_token` | `VARCHAR(50)` | - | - | No | No | `'var(--color-cyan)'`| Token màu ngữ nghĩa hiển thị |
| `title` | `VARCHAR(255)` | - | - | No | No | None | Tiêu đề gợi ý |
| `content_prompt` | `TEXT` | - | - | No | No | None | Câu hỏi gợi mở sư phạm hướng dẫn sinh viên suy nghĩ |
| `sequence_order` | `INT` | - | - | No | No | `1` | Thứ tự mở khóa |

> **Ràng buộc:** `UNIQUE (profile_id, task_type, tier_level)`.
