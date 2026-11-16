# 01. MÔ HÌNH DỮ LIỆU KHÁI NIỆM (CONCEPTUAL DATA MODEL)
**Dự án:** Nền tảng Hỗ trợ Học tập Thông minh OffByOne  
**Vai trò:** Database Architect & System Analyst  
**Tài liệu:** `docs/data-model/01_CONCEPTUAL_DATA_MODEL.md`  
**Giai đoạn:** Thiết kế mô hình dữ liệu (Design Phase - Pre-Implementation)

---

## 1. BỐI CẢNH NGHIỆP VỤ VÀ MỤC TIÊU THIẾT KẾ

### 1.1. Bối cảnh nghiệp vụ
**OffByOne** là một nền tảng hỗ trợ học tập thông minh định hướng đa môn học (Subject-Agnostic Learning Platform), giúp sinh viên:
1. Chuyển đổi đề cương khóa học (Syllabus) và tài liệu bài giảng thành **Lộ trình học tập tương tác (Learning Roadmap / DAG Skill Tree)**.
2. Tiếp thu kiến thức qua 3 hình thức học tập gắn liền với từng chủ đề:
   - **Lý thuyết tương tác (Theory Task)**.
   - **Kiểm tra trắc nghiệm củng cố (Quiz Task)**.
   - **Thực hành lập trình (Coding Task)** hỗ trợ từ bài toán đơn file đến dự án lập trình hướng đối tượng (OOP) nhiều file (`.hpp`, `.cpp`, `.h`).
3. Theo dõi tiến độ học tập cá nhân hóa, tự động mở khóa các chủ đề tiếp theo dựa trên quan hệ điều kiện tiên quyết (Prerequisites).
4. Nhận sự hướng dẫn tư duy từng bước từ **Trợ giảng Socratic AI** dựa trên ngữ cảnh bài giảng thực tế (RAG-Grounded Guidance), không cung cấp sẵn đáp án mà đặt câu hỏi gợi mở để người học tự tìm ra lỗi logic.

### 1.2. Mục tiêu của Mô hình Khái niệm
- **Tách biệt tuyệt đối dữ liệu nội dung dùng chung (Shared Courseware)** và **dữ liệu tiến độ của từng người dùng (Personal Learning State)**.
- **Mở rộng đa môn học**: Bỏ việc hardcode dữ liệu vào riêng môn Cấu trúc dữ liệu & Giải thuật (DSA); thiết kế thực thể khóa học (`Course` / `LearningSpace`) làm không gian bao bọc tài liệu và lộ trình.
- **Hỗ trợ toàn diện Multi-file Coding Workspace**: Thiết kế cấu trúc lưu trữ cây thư mục file cho cả mã nguồn khởi tạo (Starter Files), bản nháp đang viết dở (Code Draft Files) và ảnh chụp bài nộp chấm điểm (Submission Snapshot Files).
- **Làm cầu nối chuẩn hóa**: Thiết lập ngôn ngữ chung giữa Frontend Engineer và Backend Engineer trước khi triển khai bảng cơ sở dữ liệu thật trên PostgreSQL.

---

## 2. PHÂN TÁCH CÁC VÙNG NGHIỆP VỤ (BUSINESS DOMAINS)

Hệ thống được chia thành 6 phân vùng nghiệp vụ trực thuộc:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       OFFBYONE CONCEPTUAL DOMAINS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [1. IDENTITY DOMAIN]          [2. COURSE & KNOWLEDGE DOMAIN]              │
│   - Người dùng, Vai trò,        - Khóa học, Ghi danh,                       │
│     Phiên làm việc                Tài liệu PDF đề cương, Vector chunks      │
│            │                                     │                          │
│            ▼                                     ▼                          │
│   [5. STUDENT PROGRESS DOMAIN]  [3. ROADMAP DAG DOMAIN]                     │
│   - Tiến độ Node, Tiến độ Task, - Cây lộ trình kỹ năng,                    │
│     Bài nộp Quiz, Bản nháp Code,  Chủ đề kiến thức, Điều kiện tiên quyết   │
│     Lịch sử chấm bài nộp                         │                          │
│            ▲                                     ▼                          │
│            │                    [4. TASK CONTENT DOMAIN]                    │
│            │                    - Bài học lý thuyết & Knowledge cards       │
│            │                    - Câu hỏi trắc nghiệm & Lựa chọn            │
│            │                    - Bài toán code & Multi-file starter files  │
│            │                    - Test cases & Ràng buộc biên               │
│            │                                     │                          │
│            └─────────────────────────────────────┘                          │
│                                    │                                        │
│                                    ▼                                        │
│                         [6. AI TUTOR DOMAIN]                                │
│                         - Hồ sơ Socratic AI, Gợi ý 3 tầng,                  │
│                           Trích dẫn Slide, Bảng Dry-run                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DANH SÁCH THỰC THỂ KHÁI NIỆM (CONCEPTUAL ENTITIES)

### 3.1. Phân vùng 1: Người dùng và Xác thực (Identity & Authentication)

#### 1. `User` (Bảng đề xuất: `users`)
- **Mục đích nghiệp vụ:** Quản lý tài khoản người dùng duy nhất của hệ thống (sinh viên, giảng viên, quản trị viên, hoặc tài khoản khách dùng thử).
- **Thuộc tính chính:** `id`, `email`, `password_hash`, `full_name`, `role`, `account_type`, `created_at`, `updated_at`.
- **Quan hệ:** 
  - $1 : N$ với `course_enrollments` (Tham gia nhiều khóa học).
  - $1 : N$ với `user_node_progress` (Sở hữu tiến độ các chủ đề).
  - $1 : N$ với `user_task_progress` (Sở hữu trạng thái hoàn thành bài tập).
  - $1 : N$ với `code_drafts` (Lưu các bản nháp code).
  - $1 : N$ với `code_submissions` (Lịch sử nộp bài code).
  - $1 : N$ với `quiz_attempts` (Lịch sử làm bài trắc nghiệm).
  - $1 : N$ với `auth_sessions` (Các phiên đăng nhập trên thiết bị).

#### 2. `AuthSession` (Bảng đề xuất: `auth_sessions`)
- **Mục đích nghiệp vụ:** Quản lý phiên đăng nhập và Refresh Token của người dùng, hỗ trợ đăng nhập trên nhiều thiết bị và thu hồi phiên từ xa.
- **Thuộc tính chính:** `id`, `user_id`, `refresh_token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`.
- **Quan hệ:** $N : 1$ với `users`.

---

### 3.2. Phân vùng 2: Không gian Học tập & Tài liệu Đề cương (Course & Knowledge Base)

#### 3. `Course` (Bảng đề xuất: `courses`)
- **Mục đích nghiệp vụ:** Đại diện cho một môn học hoặc khóa học độc lập (vd: *Data Structures & Algorithms*, *Object-Oriented Programming*, *Database Systems*). Xóa bỏ sự phụ thuộc hardcode vào DSA.
- **Thuộc tính chính:** `id`, `code`, `title`, `description`, `department`, `icon`, `is_published`, `created_by`, `created_at`, `updated_at`.
- **Quan hệ:**
  - $1 : N$ với `course_enrollments` (Danh sách sinh viên ghi danh).
  - $1 : N$ với `knowledge_base_documents` (Các file giáo trình, đề cương của môn học).
  - $1 : 1$ với `roadmaps` (Mỗi khóa học có một cây lộ trình kỹ năng chính).

#### 4. `CourseEnrollment` (Bảng đề xuất: `course_enrollments`)
- **Mục đích nghiệp vụ:** Bảng nối quản lý việc sinh viên tham gia vào khóa học, ngày bắt đầu học và vai trò trong lớp.
- **Thuộc tính chính:** `id`, `user_id`, `course_id`, `role_in_course`, `enrolled_at`, `last_accessed_at`.
- **Quan hệ:** $N : 1$ với `users`, $N : 1$ với `courses`.

#### 5. `KnowledgeBaseDocument` (Bảng đề xuất: `knowledge_base_documents`)
- **Mục đích nghiệp vụ:** Quản lý metadata và file nhị phân (PDF) của đề cương môn học (Syllabus) hoặc slide bài giảng được tải lên để RAG trích xuất tri thức.
- **Thuộc tính chính:** `id`, `course_id`, `uploaded_by`, `file_name`, `file_size_bytes`, `storage_path`, `mime_type`, `status`, `indexed_chunks_count`, `indexed_at`, `created_at`.
- **Quan hệ:** $N : 1$ với `courses`, $1 : N$ với `document_chunks`.

#### 6. `DocumentChunk` (Bảng đề xuất: `document_chunks`)
- **Mục đích nghiệp vụ:** Lưu trữ các đoạn văn bản (text chunks) và vector embeddings sau khi băm nhỏ tài liệu PDF để phục vụ truy vấn tìm kiếm ngữ cảnh RAG cho Socratic AI.
- **Thuộc tính chính:** `id`, `document_id`, `chunk_index`, `page_number`, `content`, `embedding_vector` (vector column), `created_at`.
- **Quan hệ:** $N : 1$ với `knowledge_base_documents`.

---

### 3.3. Phân vùng 3: Lộ trình Kỹ năng & Đồ thị DAG (Learning Roadmap)

#### 7. `Roadmap` (Bảng đề xuất: `roadmaps`)
- **Mục đích nghiệp vụ:** Đại diện cho một cấu trúc lộ trình học tập hoàn chỉnh của môn học.
- **Thuộc tính chính:** `id`, `course_id`, `title`, `description`, `version`, `is_active`, `total_nodes`, `created_at`, `updated_at`.
- **Quan hệ:** $1 : 1$ với `courses`, $1 : N$ với `roadmap_nodes`.

#### 8. `RoadmapNode` (Bảng đề xuất: `roadmap_nodes`)
- **Mục đích nghiệp vụ:** Một chủ đề kiến thức trên cây kỹ năng (vd: `Arrays & Strings`, `Binary Search Tree`, `AVL Tree`).
- **Lưu ý cốt lõi:** **Thực thể này hoàn toàn không chứa trường `status`, `progress`, hay `completed_tasks`** vì đó là dữ liệu của từng người học. Bảng này thuần túy chứa cấu trúc nội dung dùng chung.
- **Thuộc tính chính:** `id`, `roadmap_id`, `node_key`, `short_code`, `label`, `description`, `target_complexity`, `sequence_order`, `total_tasks_count`, `created_at`, `updated_at`.
- **Quan hệ:**
  - $N : 1$ với `roadmaps`.
  - $1 : N$ với `roadmap_tasks`.
  - $1 : N$ với `node_prerequisites` (Vừa là node mục tiêu, vừa là node điều kiện).
  - $1 : 1$ với `socratic_tutor_profiles`.
  - $1 : N$ với `user_node_progress`.

#### 9. `NodePrerequisite` (Bảng đề xuất: `node_prerequisites`)
- **Mục đích nghiệp vụ:** Quản lý các cạnh có hướng (Directed Edges) của đồ thị DAG, xác định node nào là điều kiện tiên quyết bắt buộc của node nào.
- **Thuộc tính chính:** `id`, `node_id`, `prerequisite_node_id`, `dependency_type` (`"strict"` / `"recommended"`), `created_at`.
- **Quan hệ:** $N : 1$ với `roadmap_nodes` (Node hiện tại), $N : 1$ với `roadmap_nodes` (Node tiên quyết).

---

### 3.4. Phân vùng 4: Bài tập Học tập Dùng chung (Shared Learning Tasks)

#### 10. `Task` (Bảng đề xuất: `tasks`)
- **Mục đích nghiệp vụ:** Thực thể cơ sở cho tất cả bài tập học tập thuộc một Node. Định nghĩa bài tập đó là lý thuyết, trắc nghiệm hay lập trình.
- **Thuộc tính chính:** `id`, `node_id`, `task_key`, `title`, `description`, `type` (`"theory"` / `"quiz"` / `"coding"`), `sequence_order`, `is_required`, `created_at`, `updated_at`.
- **Quan hệ:**
  - $N : 1$ với `roadmap_nodes`.
  - $1 : 1$ với `theory_contents` (Nếu `type == "theory"`).
  - $1 : 1$ với `quiz_questions` (Nếu `type == "quiz"`).
  - $1 : 1$ với `coding_tasks` (Nếu `type == "coding"`).
  - $1 : N$ với `user_task_progress`.

#### 11. `TheoryContent` (Bảng đề xuất: `theory_contents`)
- **Mục đích nghiệp vụ:** Lưu trữ nội dung chi tiết của bài học lý thuyết tương tác.
- **Thuộc tính chính:** `id`, `task_id`, `header_title`, `module_label`, `summary_lead`, `highlight_terms` (JSONB), `knowledge_cards` (JSONB), `slide_label`, `created_at`.
- **Quan hệ:** $1 : 1$ với `tasks`.

#### 12. `QuizQuestion` (Bảng đề xuất: `quiz_questions`)
- **Mục đích nghiệp vụ:** Chứa câu hỏi kiểm tra khái niệm (Concept Quiz).
- **Thuộc tính chính:** `id`, `task_id`, `question_text`, `slide_label`, `hint_awaiting`, `hint_correct`, `hint_incorrect`, `created_at`.
- **Quan hệ:** $1 : 1$ với `tasks`, $1 : N$ với `quiz_options`.

#### 13. `QuizOption` (Bảng đề xuất: `quiz_options`)
- **Mục đích nghiệp vụ:** Các lựa chọn trả lời (vd: A, B, C, D) của câu hỏi trắc nghiệm.
- **Thuộc tính chính:** `id`, `question_id`, `option_key` (`"A"` / `"B"` / `"C"` / `"D"`), `option_text`, `is_correct`, `sequence_order`.
- **Quan hệ:** $N : 1$ với `quiz_questions`.

#### 14. `CodingTask` (Bảng đề xuất: `coding_tasks`)
- **Mục đích nghiệp vụ:** Định nghĩa bài toán lập trình và cấu hình môi trường thực thi. Hỗ trợ cả chế độ Single-file và Multi-file.
- **Thuộc tính chính:** `id`, `task_id`, `project_type` (`"single-file"` / `"multi-file"`), `primary_language` (`"cpp"` / `"python"`), `title`, `difficulty` (`"Easy"` / `"Medium"` / `"Hard"`), `description`, `input_format`, `output_format`, `constraints` (JSONB Array), `notes`, `examples` (JSONB Array), `time_limit_ms`, `memory_limit_mb`, `analysis_spec` (JSONB), `created_at`, `updated_at`.
- **Quan hệ:**
  - $1 : 1$ với `tasks`.
  - $1 : N$ với `coding_task_starter_files` (Các file mã nguồn ban đầu của đề bài).
  - $1 : N$ với `coding_test_cases` (Bộ test case mẫu và ẩn).

#### 15. `CodingTaskStarterFile` (Bảng đề xuất: `coding_task_starter_files`)
- **Mục đích nghiệp vụ:** **Giải quyết yêu cầu Multi-file**. Quản lý danh sách các file mã nguồn và file tiêu đề có sẵn khi sinh viên mở bài tập (vd: `include/BankAccount.hpp`, `src/BankAccount.cpp`, `src/main.cpp`).
- **Thuộc tính chính:** `id`, `coding_task_id`, `file_path`, `file_name`, `language`, `initial_content`, `is_read_only` (không cho sửa file driver), `is_entry_point` (chứa hàm `main`), `sequence_order`.
- **Quan hệ:** $N : 1$ với `coding_tasks`.

#### 16. `CodingTestCase` (Bảng đề xuất: `coding_test_cases`)
- **Mục đích nghiệp vụ:** Quản lý các trường hợp kiểm thử để chấm code. Phân định rõ test case cho thao tác `Run Code` và test case toàn diện cho `Submit`.
- **Thuộc tính chính:** `id`, `coding_task_id`, `label`, `input_data`, `expected_output`, `is_sample` (true: test công khai khi bấm Run; false: test ẩn khi Submit), `is_boundary_edge_case`, `sequence_order`.
- **Quan hệ:** $N : 1$ với `coding_tasks`.

---

### 3.5. Phân vùng 5: Tiến độ & Bài nộp Cá nhân (Student Learning State)

#### 17. `UserNodeProgress` (Bảng đề xuất: `user_node_progress`)
- **Mục đích nghiệp vụ:** Ghi nhận trạng thái hoàn thành và mở khóa của một sinh viên cụ thể đối với từng chủ đề trên đồ thị kỹ năng.
- **Thuộc tính chính:** `id`, `user_id`, `node_id`, `status` (`"completed"` / `"current"` / `"locked"`), `completed_tasks_count`, `progress_percent`, `unlocked_at`, `completed_at`, `updated_at`.
- **Quan hệ:** $N : 1$ với `users`, $N : 1$ với `roadmap_nodes`. Khóa tự nhiên duy nhất: `(user_id, node_id)`.

#### 18. `UserTaskProgress` (Bảng đề xuất: `user_task_progress`)
- **Mục đích nghiệp vụ:** Theo dõi việc sinh viên đã làm xong bài tập cụ thể hay chưa, và lưu số lượt trợ giúp Socratic AI còn lại.
- **Thuộc tính chính:** `id`, `user_id`, `task_id`, `status` (`"completed"` / `"current"` / `"locked"`), `hints_remaining_count`, `completed_at`, `updated_at`.
- **Quan hệ:** $N : 1$ với `users`, $N : 1$ với `tasks`. Khóa tự nhiên duy nhất: `(user_id, task_id)`.

#### 19. `QuizAttempt` (Bảng đề xuất: `quiz_attempts`)
- **Mục đích nghiệp vụ:** Lưu trữ câu trả lời trắc nghiệm của sinh viên và kết quả đúng/sai.
- **Thuộc tính chính:** `id`, `user_id`, `task_id`, `selected_option_id`, `is_submitted`, `is_correct`, `attempt_count`, `submitted_at`.
- **Quan hệ:** $N : 1$ với `users`, $N : 1$ với `tasks`, $N : 1$ với `quiz_options`.

#### 20. `CodeDraft` (Bảng đề xuất: `code_drafts`)
- **Mục đích nghiệp vụ:** Quản lý không gian làm việc đang lưu dở của sinh viên cho bài tập code.
- **Thuộc tính chính:** `id`, `user_id`, `task_id`, `active_file_id`, `is_outdated` (true khi sinh viên sửa code sau lần chạy trước), `last_run_at`, `updated_at`.
- **Quan hệ:** $N : 1$ với `users`, $N : 1$ với `tasks`, $1 : N$ với `code_draft_files`. Khóa tự nhiên duy nhất: `(user_id, task_id)`.

#### 21. `CodeDraftFile` (Bảng đề xuất: `code_draft_files`)
- **Mục đích nghiệp vụ:** **Hỗ trợ Multi-file trong Draft**. Lưu nội dung chỉnh sửa mới nhất của từng file trong project code của sinh viên.
- **Thuộc tính chính:** `id`, `code_draft_id`, `starter_file_id`, `file_path`, `file_name`, `current_content`, `updated_at`.
- **Quan hệ:** $N : 1$ với `code_drafts`, $N : 1$ với `coding_task_starter_files`.

#### 22. `CodeSubmission` (Bảng đề xuất: `code_submissions`)
- **Mục đích nghiệp vụ:** Lưu lại lịch sử mỗi lần sinh viên nhấn `Run Code` hoặc `Submit` để phục vụ chấm bài, thống kê và xem lại lịch sử.
- **Thuộc tính chính:** `id`, `user_id`, `task_id`, `action_type` (`"run"` / `"submit"`), `verdict` (`"accepted"` / `"runtime_error"` / `"wrong_answer"` / `"compilation_error"` / `"time_limit_exceeded"`), `error_title`, `error_message`, `error_line_number`, `runtime_ms`, `memory_mb`, `passed_test_count`, `total_test_count`, `stdout`, `created_at`.
- **Quan hệ:**
  - $N : 1$ với `users`, $N : 1$ với `tasks`.
  - $1 : N$ với `code_submission_files` (Snapshot các file lúc nộp).
  - $1 : N$ với `submission_test_case_results` (Chi tiết từng test).

#### 23. `CodeSubmissionFile` (Bảng đề xuất: `code_submission_files`)
- **Mục đích nghiệp vụ:** **Bảo toàn Snapshot Multi-file lúc nộp**. Đảm bảo bài nộp lưu trữ đúng toàn bộ code của mọi file tại thời điểm submit, không bị thay đổi nếu sau đó sinh viên tiếp tục sửa draft.
- **Thuộc tính chính:** `id`, `submission_id`, `file_path`, `file_name`, `content_snapshot`.
- **Quan hệ:** $N : 1$ với `code_submissions`.

#### 24. `SubmissionTestCaseResult` (Bảng đề xuất: `submission_test_case_results`)
- **Mục đích nghiệp vụ:** Lưu chi tiết kết quả chạy trên từng test case của bài nộp (Input, Expected, Actual output, Exit status).
- **Thuộc tính chính:** `id`, `submission_id`, `test_case_id`, `passed`, `actual_output`, `error_message`, `execution_time_ms`.
- **Quan hệ:** $N : 1$ với `code_submissions`, $N : 1$ với `coding_test_cases`.

---

### 3.6. Phân vùng 6: Trợ giảng Socratic AI & RAG Context

#### 25. `SocraticTutorProfile` (Bảng đề xuất: `socratic_tutor_profiles`)
- **Mục đích nghiệp vụ:** Cấu hình tri thức và ngữ cảnh trợ giảng AI gắn liền với một chủ đề kiến thức.
- **Thuộc tính chính:** `id`, `node_id`, `topic_label`, `rag_source_badge`, `slide_citation_title`, `slide_citation_excerpt`, `slide_key_invariant`, `dry_run_table_data` (JSONB), `faulty_line_config` (JSONB), `created_at`, `updated_at`.
- **Quan hệ:** $1 : 1$ với `roadmap_nodes`, $1 : N$ với `socratic_hint_tiers`.

#### 26. `SocraticHintTier` (Bảng đề xuất: `socratic_hint_tiers`)
- **Mục đích nghiệp vụ:** Lưu 3 bậc thang gợi ý sư phạm (Tầng 1: Khái niệm; Tầng 2: Truy vết con trỏ; Tầng 3: Điều kiện bảo vệ biên).
- **Thuộc tính chính:** `id`, `profile_id`, `task_type` (`"theory"` / `"quiz"` / `"coding"`), `tier_level` (1, 2, 3), `badge_label`, `color_token`, `title`, `content_prompt`, `sequence_order`.
- **Quan hệ:** $N : 1$ với `socratic_tutor_profiles`.

#### 27. `SocraticInteractionLog` (Bảng đề xuất: `socratic_interaction_logs` - Extension Entity)
- **Mục đích nghiệp vụ:** Lưu lại lịch sử hội thoại gợi mở giữa sinh viên và AI Tutor để phân tích khó khăn trong tư duy của sinh viên.
- **Thuộc tính chính:** `id`, `user_id`, `task_id`, `tier_level`, `trigger_context`, `student_query`, `ai_hint_returned`, `created_at`.
- **Quan hệ:** $N : 1$ với `users`, $N : 1$ với `tasks`.

---

## 4. PHÂN LOẠI THỰC THỂ THEO MỨC ĐỘ ƯU TIÊN

| Nhóm | Số lượng | Danh sách Entity | Lý do phân loại |
| :--- | :---: | :--- | :--- |
| **Core Entities** *(Bắt buộc triển khai ngay cho PoC/MVP)* | **23 Entities** | `User`, `AuthSession`, `Course`, `CourseEnrollment`, `KnowledgeBaseDocument`, `Roadmap`, `RoadmapNode`, `NodePrerequisite`, `Task`, `TheoryContent`, `QuizQuestion`, `QuizOption`, `CodingTask`, `CodingTaskStarterFile`, `CodingTestCase`, `UserNodeProgress`, `UserTaskProgress`, `QuizAttempt`, `CodeDraft`, `CodeDraftFile`, `CodeSubmission`, `CodeSubmissionFile`, `SubmissionTestCaseResult` | Cần thiết để toàn bộ giao diện Landing, Auth, Roadmap DAG, Coding Workspace (hỗ trợ cả Single-file và Multi-file), và chấm bài hoạt động chuẩn xác với cơ sở dữ liệu thật. |
| **Extension Entities** *(Mở rộng giai đoạn tiếp theo)* | **4 Entities** | `DocumentChunk`, `SocraticTutorProfile`, `SocraticHintTier`, `SocraticInteractionLog` | Phục vụ kết nối trực tiếp với LLM/Vector Database thực tế (pgvector / Pinecone) và hệ thống phân tích học tập nâng cao (Learning Analytics). |
