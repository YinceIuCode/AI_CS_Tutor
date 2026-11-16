# 03. THIẾT KẾ QUAN HỆ VÀ CARDINALITY (ENTITY RELATIONSHIPS & CARDINALITIES)
**Dự án:** Nền tảng Hỗ trợ Học tập Thông minh OffByOne  
**Vai trò:** Database Architect & System Analyst  
**Tài liệu:** `docs/data-model/03_ENTITY_RELATIONSHIPS.md`  
**Chuẩn quy ước:** PostgreSQL Foreign Keys, Strict Referential Integrity, Explicit On-Delete Behaviors

---

## 1. TỔNG QUAN HỆ THỐNG QUAN HỆ (RELATIONSHIP MATRIX)

Mô hình dữ liệu của OffByOne được xây dựng dựa trên nguyên lý **phân tách tuyệt đối** giữa:
1. **Nội dung học tập dùng chung (Shared Courseware / Catalog):** Các thực thể `courses`, `roadmaps`, `roadmap_nodes`, `tasks`, `theory_contents`, `quiz_questions`, `coding_tasks`, `coding_task_starter_files`, `coding_test_cases`.
2. **Dữ liệu định danh & phân quyền (Identity & Access):** `users`, `auth_sessions`, `course_enrollments`.
3. **Tiến trình & Dữ liệu tương tác cá nhân của học viên (Student Progress & State):** `user_node_progress`, `user_task_progress`, `quiz_attempts`, `code_drafts`, `code_draft_files`, `code_submissions`, `code_submission_files`, `submission_test_case_results`.
4. **Hệ thống trợ giảng Socratic AI & RAG Context:** `socratic_tutor_profiles`, `socratic_hint_tiers`.

---

## 2. BẢNG DANH MỤC QUAN HỆ TOÀN DIỆN (COMPREHENSIVE RELATIONSHIP TABLE)

| Entity A (Parent / Source) | Entity B (Child / Target) | Quan hệ | Cardinality A:B | Foreign Key (Bảng giữ FK) | Hành vi Xóa (On Delete) | Mục đích & Nghiệp vụ |
|---|---|---|---|---|---|---|
| `users` | `auth_sessions` | 1 to Many | `1 : 0..N` | `auth_sessions.user_id` | `CASCADE` | Một user có thể đăng nhập trên nhiều thiết bị / phiên làm việc. Xóa user xóa hết session. |
| `users` | `courses` (created_by) | 1 to Many | `1 : 0..N` | `courses.created_by` | `SET NULL` / `RESTRICT` | Giảng viên / Admin tạo khóa học. Khi xóa user, khóa học vẫn giữ lại và chuyển người quản lý. |
| `users` | `course_enrollments` | 1 to Many | `1 : 0..N` | `course_enrollments.user_id` | `CASCADE` | Học viên đăng ký vào các khóa học. |
| `courses` | `course_enrollments` | 1 to Many | `1 : 0..N` | `course_enrollments.course_id` | `CASCADE` | Khóa học có nhiều học viên ghi danh. Hợp với `user_id` thành quan hệ N:N `users` <-> `courses`. |
| `courses` | `knowledge_base_documents`| 1 to Many | `1 : 0..N` | `knowledge_base_documents.course_id` | `CASCADE` | Một không gian môn học lưu trữ nhiều tài liệu giáo trình, slide, đề cương để AI tham chiếu (RAG). |
| `courses` | `roadmaps` | 1 to One | `1 : 0..1` | `roadmaps.course_id` (UNIQUE) | `CASCADE` | Mỗi môn học có đúng 1 lộ trình học tập tổng thể chuẩn (Skill Tree / DAG). |
| `roadmaps` | `roadmap_nodes` | 1 to Many | `1 : 1..N` | `roadmap_nodes.roadmap_id` | `CASCADE` | Một lộ trình gồm nhiều chủ đề / node kiến thức có thứ tự hiển thị và tọa độ biểu diễn. |
| `roadmap_nodes` | `node_prerequisites` (Source) | 1 to Many | `1 : 0..N` | `node_prerequisites.node_id` | `CASCADE` | Node này phụ thuộc vào các node tiên quyết khác trong đồ thị có hướng (DAG). |
| `roadmap_nodes` | `node_prerequisites` (Target) | 1 to Many | `1 : 0..N` | `node_prerequisites.prerequisite_node_id` | `RESTRICT` | Node được coi là điều kiện tiên quyết cho các node phía sau. |
| `roadmap_nodes` | `tasks` | 1 to Many | `1 : 0..N` | `tasks.node_id` | `CASCADE` | Mỗi node kiến thức chứa một danh sách các bài tập / nhiệm vụ (Theory, Quiz, Coding). |
| `tasks` | `theory_contents` | 1 to One | `1 : 0..1` | `theory_contents.task_id` (UNIQUE) | `CASCADE` | Nếu task là `THEORY`, lưu nội dung lý thuyết, markdown, callout, audio podcast. |
| `tasks` | `quiz_questions` | 1 to Many | `1 : 0..N` | `quiz_questions.task_id` | `CASCADE` | Nếu task là `QUIZ`, chứa 1 hoặc nhiều câu hỏi trắc nghiệm kiểm tra hiểu bài. |
| `quiz_questions` | `quiz_options` | 1 to Many | `1 : 2..N` | `quiz_options.question_id` | `CASCADE` | Mỗi câu hỏi trắc nghiệm có tối thiểu 2 lựa chọn (A, B, C, D...). |
| `tasks` | `coding_tasks` | 1 to One | `1 : 0..1` | `coding_tasks.task_id` (UNIQUE) | `CASCADE` | Nếu task là `CODING`, lưu đặc tả đề bài, ngôn ngữ hỗ trợ, driver code, giới hạn tài nguyên. |
| `coding_tasks` | `coding_task_starter_files`| 1 to Many | `1 : 1..N` | `coding_task_starter_files.coding_task_id` | `CASCADE` | Mã nguồn khởi tạo cho bài tập (Single-file hoặc Multi-file: `.hpp`, `.cpp`, `.h`). |
| `coding_tasks` | `coding_test_cases` | 1 to Many | `1 : 1..N` | `coding_test_cases.coding_task_id` | `CASCADE` | Bộ test case dùng để chấm bài và dry-run (Public sample + Hidden test). |
| `users` | `user_node_progress` | 1 to Many | `1 : 0..N` | `user_node_progress.user_id` | `CASCADE` | Trạng thái mở khóa (LOCKED, AVAILABLE, COMPLETED) của từng học viên trên từng node. |
| `roadmap_nodes` | `user_node_progress` | 1 to Many | `1 : 0..N` | `user_node_progress.node_id` | `CASCADE` | Lưu vết tiến độ của tất cả học viên đang học node này. |
| `users` | `user_task_progress` | 1 to Many | `1 : 0..N` | `user_task_progress.user_id` | `CASCADE` | Trạng thái hoàn thành bài học, điểm số, số gợi ý AI đã dùng của học viên. |
| `tasks` | `user_task_progress` | 1 to Many | `1 : 0..N` | `user_task_progress.task_id` | `CASCADE` | Theo dõi tiến độ của học viên trên từng bài học cụ thể. |
| `users` | `quiz_attempts` | 1 to Many | `1 : 0..N` | `quiz_attempts.user_id` | `CASCADE` | Lịch sử nộp bài trắc nghiệm của học viên. |
| `tasks` | `quiz_attempts` | 1 to Many | `1 : 0..N` | `quiz_attempts.task_id` | `CASCADE` | Các lượt nộp của học viên cho bài trắc nghiệm này. |
| `users` | `code_drafts` | 1 to Many | `1 : 0..N` | `code_drafts.user_id` | `CASCADE` | Bản nháp code đang làm dở của học viên trong Coding Workspace. |
| `coding_tasks` | `code_drafts` | 1 to Many | `1 : 0..N` | `code_drafts.coding_task_id` | `CASCADE` | Bản nháp của các học viên cho bài coding này. Hợp `(user_id, coding_task_id)` là UNIQUE. |
| `code_drafts` | `code_draft_files` | 1 to Many | `1 : 1..N` | `code_draft_files.draft_id` | `CASCADE` | Từng file trong dự án đa file mà học viên đang sửa (`BankAccount.cpp`, `main.cpp`). |
| `users` | `code_submissions` | 1 to Many | `1 : 0..N` | `code_submissions.user_id` | `CASCADE` | Lịch sử các lần bấm nút Submit code chính thức của học viên. |
| `coding_tasks` | `code_submissions` | 1 to Many | `1 : 0..N` | `code_submissions.coding_task_id` | `CASCADE` | Tất cả bài nộp chấm điểm của bài coding này. |
| `code_submissions` | `code_submission_files` | 1 to Many | `1 : 1..N` | `code_submission_files.submission_id`| `CASCADE` | Snapshot bất biến của toàn bộ cây thư mục code tại thời điểm bấm Submit. |
| `code_submissions` | `submission_test_case_results`| 1 to Many | `1 : 1..N` | `submission_test_case_results.submission_id`| `CASCADE` | Kết quả chi tiết từng test case (Pass/Fail/TLE/MLE, stdout, stderr, execution time). |
| `coding_test_cases`| `submission_test_case_results`| 1 to Many | `1 : 0..N` | `submission_test_case_results.test_case_id`| `SET NULL` | Liên kết kết quả chạy với test case mẫu (giữ kết quả cũ nếu sửa test case). |
| `tasks` | `socratic_tutor_profiles` | 1 to One | `1 : 0..1` | `socratic_tutor_profiles.task_id` (UNIQUE)| `CASCADE` | Cấu hình quy tắc sư phạm Socratic đặc thù cho từng bài học. |
| `socratic_tutor_profiles`| `socratic_hint_tiers` | 1 to Many | `1 : 1..N` | `socratic_hint_tiers.tutor_profile_id` | `CASCADE` | Các tầng gợi ý theo nấc thang tư duy (Tier 1: Định hướng -> Tier 2: Thuật toán -> Tier 3: Edge Case). |

---

## 3. PHÂN TÍCH CHI TIẾT CÁC CẶP QUAN HỆ TRỌNG YẾU

### 3.1. Quan hệ Người dùng & Không gian học tập (Users & Learning Spaces)
- **Cặp thực thể:** `users` và `courses`.
- **Bản chất nghiệp vụ:**
  - Một học viên có thể ghi danh vào nhiều khóa học (DSA, OOP, Cơ sở dữ liệu, Mạng máy tính).
  - Một khóa học có nhiều học sinh đăng ký học.
  - Đây là quan hệ **Many-to-Many (N:N)**.
- **Giải pháp triển khai:**
  - Sử dụng **Junction Table: `course_enrollments`**.
  - Khóa chính tổng hợp hoặc khóa đại diện với Unique Constraint: `UNIQUE(user_id, course_id)`.
  - Lưu thêm các thuộc tính nghiệp vụ của lần ghi danh: `role` (STUDENT, TEACHER_ASSISTANT, INSTRUCTOR), `enrolled_at`, `status` (ACTIVE, COMPLETED, DROPPED), `overall_progress_percent`.
- **Cardinality:**
  - `users` : `course_enrollments` = `1 : 0..N` (Một người có thể chưa đăng ký môn nào hoặc đã đăng ký nhiều môn).
  - `courses` : `course_enrollments` = `1 : 0..N` (Khóa học mới tạo chưa có học viên nào hoặc có hàng nghìn học viên).

### 3.2. Không gian học tập & Tài liệu tham khảo (Course & Learning Materials / RAG Context)
- **Cặp thực thể:** `courses` và `knowledge_base_documents`.
- **Bản chất nghiệp vụ:**
  - Một không gian môn học lưu trữ nhiều tài liệu học tập (file syllabus PDF, slide bài giảng, đề thi mẫu, textbook, tài liệu hướng dẫn thí nghiệm).
  - Mỗi tài liệu bắt buộc phải thuộc về đúng 1 khóa học xác định.
- **Cardinality:**
  - `courses` : `knowledge_base_documents` = `1 : 0..N` (One-to-Many).
  - `Foreign Key`: `knowledge_base_documents.course_id REFERENCES courses(id) ON DELETE CASCADE`.
- **Ràng buộc:** Khi một môn học bị xóa, toàn bộ kho tài liệu RAG tương ứng của môn học đó được giải phóng khỏi cơ sở dữ liệu.

### 3.3. Không gian học tập & Lộ trình (Course & Learning Roadmap)
- **Cặp thực thể:** `courses` và `roadmaps`.
- **Bản chất nghiệp vụ:**
  - Mỗi khóa học có duy nhất **một** cây lộ trình chuẩn (Skill Tree / Roadmap DAG) phục vụ quá trình học tập của môn học đó.
  - Khi người dùng chọn môn học (ví dụ: chuyển từ DSA sang OOP), frontend load cây lộ trình tương ứng.
- **Cardinality:**
  - `courses` : `roadmaps` = `1 : 1` (Strict One-to-One).
  - `Foreign Key`: `roadmaps.course_id REFERENCES courses(id) ON DELETE CASCADE UNIQUE`.
- **Ràng buộc:** Cột `course_id` trong `roadmaps` có chỉ mục `UNIQUE` để đảm bảo mỗi khóa học không bị tạo trùng lặp nhiều roadmap.

### 3.4. Lộ trình & Các node kiến thức (Roadmap & Roadmap Nodes)
- **Cặp thực thể:** `roadmaps` và `roadmap_nodes`.
- **Bản chất nghiệp vụ:**
  - Một Roadmap bao gồm tập hợp các node kiến thức đại diện cho các kỹ năng / chủ đề con (ví dụ: `Arrays`, `Linked Lists`, `Binary Search Tree`, `Graph DFS/BFS`).
  - Mỗi node lưu vị trí hiển thị đồ họa (`coordinate_x`, `coordinate_y`), thứ tự sắp xếp (`sequence_order`), icon, thời lượng ước tính (`estimated_minutes`).
- **Cardinality:**
  - `roadmaps` : `roadmap_nodes` = `1 : 1..N` (One-to-Many).
  - `Foreign Key`: `roadmap_nodes.roadmap_id REFERENCES roadmaps(id) ON DELETE CASCADE`.

### 3.5. Đồ thị điều kiện tiên quyết giữa các Node (Directed Acyclic Graph - Prerequisites)
- **Cặp thực thể:** `roadmap_nodes` (Node hiện tại) và `roadmap_nodes` (Node tiên quyết).
- **Bản chất nghiệp vụ:**
  - Để học một chủ đề nâng cao (ví dụ: `Binary Search Tree`), học viên cần mở khóa và hoàn thành các chủ đề nền tảng (ví dụ: `Arrays & Big-O` và `Linked Lists`).
  - Một node có thể phụ thuộc vào **nhiều** node trước đó.
  - Một node có thể là điều kiện tiên quyết cho **nhiều** node phía sau.
  - Đây là cấu trúc đồ thị có hướng không chu trình (DAG) quan hệ **Many-to-Many đệ quy (Self-referencing N:N)**.
- **Giải pháp triển khai:**
  - Sử dụng **Junction Table: `node_prerequisites`**.
  - `node_id REFERENCES roadmap_nodes(id) ON DELETE CASCADE` (Node cần mở khóa).
  - `prerequisite_node_id REFERENCES roadmap_nodes(id) ON DELETE RESTRICT` (Node điều kiện).
  - `Ràng buộc toàn vẹn`: `CHECK (node_id <> prerequisite_node_id)` (Không được tự làm điều kiện tiên quyết của chính mình).
  - `Ràng buộc duy nhất`: `UNIQUE(node_id, prerequisite_node_id)`.
- **Cardinality:**
  - `roadmap_nodes` : `node_prerequisites` = `1 : 0..N` (Node gốc không có prerequisite nào, node lá có nhiều prerequisite).

### 3.6. Node kiến thức & Danh sách bài tập (Roadmap Node & Tasks)
- **Cặp thực thể:** `roadmap_nodes` và `tasks`.
- **Bản chất nghiệp vụ:**
  - Khi học viên click vào một node trên Skill Tree, hệ thống mở màn hình học tập hiển thị danh sách các bài học / bài tập cần hoàn thành thuộc node đó (Task Sidebar).
  - Bảng `tasks` đóng vai trò là **Abstract Task Container** định nghĩa thứ tự (`sequence_order`), tiêu đề (`title`), thời lượng (`duration_text`), loại bài (`task_type`: THEORY, QUIZ, CODING), và điểm kinh nghiệm (`exp_reward`).
- **Cardinality:**
  - `roadmap_nodes` : `tasks` = `1 : 0..N` (One-to-Many).
  - `Foreign Key`: `tasks.node_id REFERENCES roadmap_nodes(id) ON DELETE CASCADE`.

### 3.7. Task và các bảng nội dung chuyên biệt (Task Polymorphic Subtypes)
Để tối ưu hóa hiệu năng và tuân thủ chuẩn hóa cơ sở dữ liệu (Normalized Design), hệ thống không gộp chung toàn bộ dữ liệu khác biệt vào một bảng `tasks` khổng lồ mà sử dụng mô hình **Class Table Inheritance (Một bảng cha - nhiều bảng con 1:1 hoặc 1:N)**:

```
                      +-------------------+
                      |       tasks       |
                      +-------------------+
                                |
        +-----------------------+-----------------------+
        | (1 : 0..1)            | (1 : 0..N)            | (1 : 0..1)
+-------------------+   +-------------------+   +-------------------+
|  theory_contents  |   |  quiz_questions   |   |   coding_tasks    |
+-------------------+   +-------------------+   +-------------------+
                                | (1 : 2..N)            | (1 : 1..N)
                        +-------------------+   +----------------------------+
                        |   quiz_options    |   | coding_task_starter_files  |
                        +-------------------+   +----------------------------+
                                                        | (1 : 1..N)
                                                +----------------------------+
                                                |    coding_test_cases       |
                                                +----------------------------+
```

1. **Task & Theory Content:**
   - Quan hệ: **1 : 0..1** (One-to-One).
   - `Foreign Key`: `theory_contents.task_id REFERENCES tasks(id) ON DELETE CASCADE UNIQUE`.
   - Một bài học chỉ có nội dung lý thuyết khi `tasks.task_type = 'THEORY'`.
2. **Task & Quiz Questions / Quiz Options:**
   - Quan hệ: **1 : 0..N** (One-to-Many).
   - `Foreign Key`: `quiz_questions.task_id REFERENCES tasks(id) ON DELETE CASCADE`.
   - Mỗi câu hỏi trắc nghiệm lại có quan hệ **1 : 2..N** với `quiz_options` (`quiz_options.question_id REFERENCES quiz_questions(id) ON DELETE CASCADE`).
3. **Task & Coding Task:**
   - Quan hệ: **1 : 0..1** (One-to-One).
   - `Foreign Key`: `coding_tasks.task_id REFERENCES tasks(id) ON DELETE CASCADE UNIQUE`.
   - Một bài học chỉ có cấu hình coding khi `tasks.task_type = 'CODING'`.

---

## 4. CHI TIẾT QUAN HỆ MULTI-FILE CODING WORKSPACE

Một bài tập lập trình trong môi trường đại học và thực tế không chỉ dừng lại ở một hàm đơn lẻ mà có cấu trúc dự án đa file (Header, Implementation, Driver / Test Runner). Mô hình quan hệ giải quyết triệt để 3 giai đoạn: **Đề bài chuẩn**, **Bản nháp làm bài của sinh viên**, và **Bản chụp snapshot khi nộp bài chấm**.

```
[ĐỀ BÀI DÙNG CHUNG]             [BẢN NHÁP CỦA SINH VIÊN]          [BÀI NỘP CHẤM ĐIỂM]
+-------------------+           +-------------------+             +-------------------+
|   coding_tasks    |           |    code_drafts    |             | code_submissions  |
+-------------------+           +-------------------+             +-------------------+
        | 1:N                           | 1:N                             | 1:N
        v                               v                                 v
+-------------------+           +-------------------+             +-------------------+
|coding_task_starter|           | code_draft_files  |             |code_submission_fil|
|      _files       |           +-------------------+             |       _es         |
+-------------------+                                             +-------------------+
        | 1:N                                                             | 1:N
        v                                                                 v
+-------------------+                                             +-------------------+
| coding_test_cases | <------------------------------------------ |submission_test_ca |
+-------------------+                    (FK SET NULL)            |   _se_results     |
                                                                  +-------------------+
```

### 4.1. Coding Task & Starter Files (`coding_tasks` -> `coding_task_starter_files`)
- **Quan hệ:** **1 to Many (1 : 1..N)**.
- **Foreign Key:** `coding_task_starter_files.coding_task_id REFERENCES coding_tasks(id) ON DELETE CASCADE`.
- **Ràng buộc:** `UNIQUE(coding_task_id, file_path)`.
- **Nghiệp vụ:**
  - Một bài Coding Task có 1 hoặc nhiều file mẫu khởi tạo.
  - Ví dụ với bài tập C++ OOP:
    - File 1: `include/BankAccount.hpp` (`is_read_only = TRUE` - sinh viên chỉ đọc interface).
    - File 2: `src/BankAccount.cpp` (`is_entry_point = TRUE`, `is_read_only = FALSE` - sinh viên code tại đây).
    - File 3: `src/main.cpp` (`is_read_only = TRUE` - driver test chạy thử).

### 4.2. Học viên & Bản nháp Code (`users` + `coding_tasks` -> `code_drafts` -> `code_draft_files`)
- **Quan hệ `code_drafts`:**
  - `users` : `code_drafts` = `1 : 0..N` (`code_drafts.user_id`).
  - `coding_tasks` : `code_drafts` = `1 : 0..N` (`code_drafts.coding_task_id`).
  - `UNIQUE(user_id, coding_task_id)`: Mỗi học viên chỉ có **duy nhất một bản nháp đang làm việc** tại một thời điểm cho một bài tập coding nhất định.
- **Quan hệ `code_draft_files`:**
  - `code_drafts` : `code_draft_files` = `1 : 1..N` (`code_draft_files.draft_id REFERENCES code_drafts(id) ON DELETE CASCADE`).
  - `UNIQUE(draft_id, file_path)`: Không được có hai file trùng đường dẫn trong cùng một bản nháp.
  - **Nghiệp vụ:** Khi sinh viên gõ code hoặc chuyển qua lại giữa các file trong Monaco Editor, nội dung file được lưu tự động (auto-save) vào bảng con này.

### 4.3. Học viên & Lịch sử Nộp bài Chấm (`users` + `coding_tasks` -> `code_submissions`)
- **Quan hệ `code_submissions`:**
  - `users` : `code_submissions` = `1 : 0..N` (`code_submissions.user_id`).
  - `coding_tasks` : `code_submissions` = `1 : 0..N` (`code_submissions.coding_task_id`).
  - **Nghiệp vụ:** Mỗi lần học viên nhấn nút **Submit Code**, một bản ghi nộp bài mới được tạo ra để lưu trạng thái chấm (`PENDING`, `RUNNING`, `ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `COMPILATION_ERROR`), điểm số, độ phức tạp thuật toán đo đạc được (`time_complexity_detected`).
- **Quan hệ `code_submission_files`:**
  - `code_submissions` : `code_submission_files` = `1 : 1..N` (`code_submission_files.submission_id REFERENCES code_submissions(id) ON DELETE CASCADE`).
  - **Nghiệp vụ:** Đóng băng toàn bộ code các file của sinh viên tại thời điểm nộp bài. Ngay cả khi sinh viên tiếp tục sửa code nháp ở `code_draft_files`, bản nộp cũ vẫn giữ nguyên vẹn để phục vụ phúc khảo và kiểm toán.
- **Quan hệ `submission_test_case_results`:**
  - `code_submissions` : `submission_test_case_results` = `1 : 1..N` (`submission_test_case_results.submission_id REFERENCES code_submissions(id) ON DELETE CASCADE`).
  - `coding_test_cases` : `submission_test_case_results` = `1 : 0..N` (`submission_test_case_results.test_case_id REFERENCES coding_test_cases(id) ON DELETE SET NULL`).
  - **Nghiệp vụ:** Lưu kết quả chi tiết từng ca kiểm thử của lần chạy đó (thời gian chạy `execution_time_ms`, bộ nhớ `memory_usage_kb`, kết quả thực tế `actual_output`, thông báo lỗi `error_message`).

---

## 5. BẢNG PHÂN TÍCH JUNCTION TABLES & RÀNG BUỘC TOÀN VẸN (CASCADE RULES)

| Tên Junction Table | Bảng Cha 1 (Parent A) | Bảng Cha 2 (Parent B) | Khóa ngoại & Hành vi On Delete | Ràng buộc duy nhất (Unique Constraint) | Mục đích nghiệp vụ |
|---|---|---|---|---|---|
| `course_enrollments` | `users(id)` | `courses(id)` | `user_id` CASCADE<br>`course_id` CASCADE | `UNIQUE(user_id, course_id)` | Giải quyết quan hệ N:N giữa học viên và các khóa học. Khi xóa user hoặc xóa khóa học, bản ghi ghi danh tương ứng tự động bị xóa. |
| `node_prerequisites` | `roadmap_nodes(id)` | `roadmap_nodes(id)` | `node_id` CASCADE<br>`prerequisite_node_id` RESTRICT | `UNIQUE(node_id, prerequisite_node_id)` | Đồ thị quan hệ phụ thuộc DAG giữa các node kiến thức. `RESTRICT` ngăn chặn việc vô tình xóa một node gốc khi các node con phía sau vẫn đang trỏ tới nó. |
| `user_node_progress` | `users(id)` | `roadmap_nodes(id)` | `user_id` CASCADE<br>`node_id` CASCADE | `UNIQUE(user_id, node_id)` | Quản lý trạng thái hoàn thành node của từng học viên. Không bị lẫn vào bảng `roadmap_nodes` dùng chung. |
| `user_task_progress` | `users(id)` | `tasks(id)` | `user_id` CASCADE<br>`task_id` CASCADE | `UNIQUE(user_id, task_id)` | Quản lý trạng thái hoàn thành từng task của học viên, bao gồm số gợi ý AI đã lấy và điểm thưởng. |

---

## 6. QUY TẮC TOÀN VẸN DỮ LIỆU & RÀNG BUỘC NGHIỆP VỤ (INTEGRITY RULES)

1. **Chống vòng lặp trong đồ thị (DAG Cycle Prevention):**
   - Ràng buộc trực tiếp: `CHECK (node_id <> prerequisite_node_id)`.
   - Ràng buộc logic gián tiếp: Backend Service sử dụng thuật toán Kahn hoặc DFS Cycle Detection khi tạo/sửa mối quan hệ trong `node_prerequisites` để bảo đảm đồ thị không bao giờ bị lặp vô tận ($A \to B \to C \to A$).
2. **Tính toàn vẹn của Task Type Polymorphism:**
   - Một `task_id` trong `tasks` chỉ được phép tồn tại bản ghi tương ứng trong đúng 1 trong 3 bảng nội dung: `theory_contents`, `quiz_questions`, hoặc `coding_tasks` tương ứng với giá trị trường `task_type`.
3. **Bảo toàn dữ liệu lịch sử nộp bài (Immutability of Submissions):**
   - Bản ghi trong `code_submissions`, `code_submission_files`, `submission_test_case_results`, và `quiz_attempts` là dữ liệu **bất biến (Append-Only / Immutable)**. Chỉ cho phép thao tác `INSERT` và `SELECT`, nghiêm cấm `UPDATE` nội dung code sau khi đã chấm xong.
4. **Đồng bộ hóa dữ liệu Draft & Starter Files:**
   - Khi một học viên lần đầu tiên mở Coding Workspace cho một bài tập mới, Backend Service sẽ sao chép toàn bộ danh sách file từ `coding_task_starter_files` sang `code_draft_files` của sinh viên đó, bảo toàn thuộc tính `is_read_only`.
