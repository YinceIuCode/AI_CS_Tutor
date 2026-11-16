# 05. QUYẾT ĐỊNH THIẾT KẾ VÀ ĐỐI CHIẾU KIẾN TRÚC (ARCHITECTURAL DESIGN DECISIONS)
**Dự án:** Nền tảng Hỗ trợ Học tập Thông minh OffByOne  
**Vai trò:** Database Architect & System Analyst  
**Tài liệu:** `docs/data-model/05_DESIGN_DECISIONS.md`  
**Mục tiêu:** Cung cấp cơ sở lý luận kiến trúc, giải trình thiết kế chuẩn hóa và danh mục các điểm cần chốt với Backend Developer trước khi viết mã nguồn ORM / Migration.

---

## 1. TẠI SAO CẦN TỪNG ENTITY VÀ NGUYÊN TẮC XÁC ĐỊNH ENTITY

Một lỗi phổ biến trong thiết kế cơ sở dữ liệu cho các ứng dụng web là **Data Over-normalization** (tạo bảng riêng cho mọi mẩu dữ liệu nhỏ) hoặc ngược lại là **Data Under-normalization** (nhồi nhét toàn bộ vào một vài bảng Document JSON khổng lồ khiến việc query, indexing và kiểm soát toàn vẹn trở nên bất khả thi).

Tại OffByOne, một thực thể được công nhận là một **Entity độc lập (Independent Table)** khi và chỉ khi thỏa mãn ít nhất một trong các tiêu chí sau:
1. **Có vòng đời (Lifecycle) và định danh riêng:** Dữ liệu có thể được tạo, sửa, xóa hoặc truy vấn độc lập mà không nhất thiết phải tải toàn bộ đối tượng cha.
2. **Tham gia vào các quan hệ liên kết (Foreign Key References):** Được nhiều thực thể khác tham chiếu tới.
3. **Cần phân quyền, kiểm soát truy cập hoặc đánh chỉ mục độc lập:** Ví dụ `users`, `course_enrollments`, `code_submissions`.
4. **Cần bảo toàn tính bất biến (Immutability & Auditability):** Ví dụ các bài nộp code `code_submissions` và kết quả test case `submission_test_case_results`.

### Giải trình cho 25 thực thể được lựa chọn:

| STT | Tên Bảng (Table Name) | Lý do kiến trúc & Nghiệp vụ bắt buộc |
|---|---|---|
| 1 | `users` | Quản lý người dùng, định danh, phân quyền (ADMIN, INSTRUCTOR, STUDENT). |
| 2 | `auth_sessions` | Quản lý phiên làm việc đa thiết bị, cho phép thu hồi token (Token Revocation/Logout) bảo mật hơn JWT Stateless thuần túy. |
| 3 | `courses` | Không gian gốc định vị môn học, cho phép OffByOne mở rộng từ DSA sang OOP, Database, Computer Network. |
| 4 | `course_enrollments` | Bảng trung gian giải quyết N:N giữa người dùng và môn học, lưu tiến độ tổng thể của sinh viên trong khóa học. |
| 5 | `knowledge_base_documents` | Quản lý tài liệu đề cương (Syllabus PDF, Slide, Lecture Notes) làm nguồn dữ liệu RAG Grounding cho Socratic AI. |
| 6 | `roadmaps` | Đại diện cho cây kỹ năng chuẩn của từng môn học (Skill Tree / DAG Root). |
| 7 | `roadmap_nodes` | Các chủ đề kiến thức con có tọa độ hiển thị trực quan và thứ tự học. |
| 8 | `node_prerequisites` | Quản lý cấu trúc đồ thị có hướng không chu trình (DAG) cho phép node phụ thuộc nhiều node tiên quyết. |
| 9 | `tasks` | Container bài học đa hình (Polymorphic Task Container), chuẩn hóa thứ tự, thời lượng và điểm thưởng. |
| 10 | `theory_contents` | Tách riêng nội dung lý thuyết, markdown, audio podcast để không làm nặng bảng `tasks` khi chỉ query danh sách. |
| 11 | `quiz_questions` | Quản lý ngân hàng câu hỏi trắc nghiệm kiểm tra tư duy. |
| 12 | `quiz_options` | Các lựa chọn của câu hỏi, hỗ trợ giải thích sư phạm (`feedback_rationale`) cho từng phương án. |
| 13 | `coding_tasks` | Quản lý đặc tả kỹ thuật, giới hạn bộ nhớ/thời gian, độ phức tạp kỳ vọng cho bài tập lập trình. |
| 14 | `coding_task_starter_files` | Quản lý cấu trúc file mẫu khởi tạo của bài tập (hỗ trợ cả Single-file và Multi-file C++). |
| 15 | `coding_test_cases` | Ngân hàng test case chấm điểm (chia tách Public Sample và Hidden Test). |
| 16 | `user_node_progress` | Tách biệt trạng thái học của từng sinh viên khỏi cấu trúc Roadmap dùng chung. |
| 17 | `user_task_progress` | Lưu vết hoàn thành từng bài tập, số lượt dùng gợi ý AI Socratic, điểm số cá nhân. |
| 18 | `quiz_attempts` | Lịch sử nộp bài trắc nghiệm phục vụ thống kê sư phạm và chấm điểm. |
| 19 | `code_drafts` | Quản lý bản nháp code đang làm dở của sinh viên trên từng bài coding. |
| 20 | `code_draft_files` | Quản lý từng file mã nguồn trong bản nháp đa file (tự động lưu khi sinh viên gõ). |
| 21 | `code_submissions` | Ghi nhận một lần bấm Submit nộp bài chính thức, trạng thái chấm (AC, WA, TLE, CE). |
| 22 | `code_submission_files` | Snapshot đóng băng bất biến toàn bộ code tại thời điểm nộp bài, bảo đảm bằng chứng chấm thi. |
| 23 | `submission_test_case_results`| Kết quả chi tiết từng test case phục vụ giao diện Test Results tab của Coding Workspace. |
| 24 | `socratic_tutor_profiles` | Cấu hình quy tắc sư phạm Socratic AI riêng biệt cho từng bài học. |
| 25 | `socratic_hint_tiers` | Định nghĩa các nấc thang gợi ý tư duy (Hint 1: Định hướng -> Hint 2: Thuật toán -> Hint 3: Edge Case). |

---

## 2. NHỮNG ĐỐI TƯỢNG ĐƯỢC NHÚNG (EMBEDDED JSONB) THAY VÌ TẠO BẢNG RIÊNG

Hệ thống sử dụng kiểu dữ liệu `JSONB` của PostgreSQL để nhúng một số cấu trúc dữ liệu con. Việc này giúp:
- Tránh việc phải `JOIN` qua 5-7 bảng chỉ để render một màn hình bài tập.
- Giữ nguyên cấu trúc phân cấp tự nhiên của dữ liệu con gắn liền với đối tượng cha.
- Tận dụng khả năng đánh chỉ mục GIN của PostgreSQL để truy vấn nhanh khi cần.

### Danh mục dữ liệu nhúng và lý do:

1. **`coding_tasks.examples` (JSONB):**
   - *Cấu trúc:* Mảng các object `[{ input: "...", output: "...", explanation: "..." }]`.
   - *Lý do không tách bảng:* Các ví dụ minh họa này luôn luôn được tải cùng lúc với đề bài để render Problem Description Panel. Số lượng ví dụ thường chỉ từ 1 đến 3 mẫu, không bao giờ được truy vấn độc lập hay liên kết với bảng khác.
2. **`coding_tasks.constraints` (JSONB):**
   - *Cấu trúc:* Mảng chuỗi `["1 <= N <= 10^5", "Node values are unique"]`.
   - *Lý do không tách bảng:* Đây là các quy ước điều kiện biên đơn giản, thuần túy hiển thị cho người học đọc.
3. **`theory_contents.key_takeaways` (JSONB):**
   - *Cấu trúc:* Mảng các đề mục tóm tắt kiến thức cốt lõi.
   - *Lý do không tách bảng:* Luôn đi liền với nội dung lý thuyết `content_markdown`.
4. **`theory_contents.dry_run_table_data` (JSONB):**
   - *Cấu trúc:* Dữ liệu bảng mô phỏng từng bước thuật toán (Execution Step Table).
   - *Lý do không tách bảng:* Gắn chặt với bài giảng lý thuyết cụ thể, không tái sử dụng ở nơi khác.
5. **`quiz_attempts.student_answers` (JSONB):**
   - *Cấu trúc:* Object map `{ question_id: selected_option_id }`.
   - *Lý do không tách bảng:* Một bài trắc nghiệm nhanh thường có 3-5 câu. Lưu cả bộ câu trả lời của một lần nộp dưới dạng JSONB giúp việc đọc lại kết quả làm bài của học viên chỉ tốn 1 câu truy vấn đơn giản, không cần JOIN qua bảng con `quiz_attempt_answers`.
6. **`knowledge_base_documents.metadata` (JSONB):**
   - *Cấu trúc:* Các thông số kỹ thuật ingest RAG như `{ chunk_size: 512, overlap: 50, author: "...", pages: 45 }`.
   - *Lý do không tách bảng:* Metadata tài liệu có tính chất linh hoạt tùy thuộc vào định dạng file (PDF, DOCX, Markdown).

---

## 3. THIẾT KẾ ĐỘC QUYỀN CHO MULTI-FILE C++ CODING WORKSPACE

### 3.1. Vấn đề thực tế
Trong hầu hết các nền tảng giải thuật kiểu cũ (LeetCode, HackerRank), cơ sở dữ liệu chỉ lưu một cột `source_code text`. Tuy nhiên, trong chương trình đào tạo Khoa học Máy tính đại học:
- Bài tập C++ Hướng đối tượng (OOP) yêu cầu tách biệt:
  - Header: `include/BankAccount.hpp` (Khai báo class, method).
  - Source: `src/BankAccount.cpp` (Cài đặt hàm).
  - Main/Driver: `src/main.cpp` (Hàm main khởi tạo đối tượng và kiểm thử).
- Giảng viên thường khóa quyền sửa file `include/*.hpp` và file test `main.cpp`, chỉ cho phép sinh viên sửa file cài đặt `src/*.cpp`.

### 3.2. Giải pháp kiến trúc của OffByOne
OffByOne giải quyết bài toán này bằng **3 tầng lưu trữ file chuyên biệt**:

1. **Tầng đề bài (`coding_task_starter_files`):**
   - Lưu cấu trúc cây thư mục mẫu do Giảng viên / Hệ thống soạn thảo.
   - Cờ `is_entry_point`: Đánh dấu file nào sẽ được mở mặc định khi sinh viên vừa click vào bài học.
   - Cờ `is_read_only`: Đánh dấu file nào sinh viên chỉ được đọc, không được sửa trong Monaco Editor (ví dụ file header hoặc driver test).
2. **Tầng bản nháp (`code_draft_files`):**
   - Thuộc về từng học viên (`code_drafts`).
   - Lưu trạng thái code đang gõ dở theo thời gian thực (Auto-save).
   - Khi học viên bấm nút "Reset to Starter Code", hệ thống chỉ cần sao chép đè lại nội dung từ `coding_task_starter_files` vào `code_draft_files`.
3. **Tầng nộp bài (`code_submission_files`):**
   - Đóng băng toàn bộ code của tất cả các file tại thời điểm sinh viên bấm "Submit".
   - Đây là snapshot độc lập, bất biến. Sinh viên có tiếp tục sửa code nháp thì bài nộp cũ vẫn giữ nguyên vẹn để phục vụ phúc khảo.

---

## 4. TÁCH BẠCH DỮ LIỆU DÙNG CHUNG VÀ TIẾN TRÌNH HỌC VIÊN

Một sai sót nghiêm trọng trong nhiều thiết kế cơ sở dữ liệu ban đầu là lưu trường `status: 'COMPLETED'` hoặc `is_unlocked: true` trực tiếp trên bảng `roadmap_nodes` hoặc `tasks`. Điều này chỉ chạy được trong ứng dụng Single-user cục bộ; khi có 2 học viên cùng vào học, tiến độ của học viên A sẽ ghi đè lên học viên B.

Mô hình OffByOne đã tách biệt triệt để:
- **`roadmap_nodes` & `tasks`:** Thuần túy là Content Catalog dùng chung cho toàn trường / toàn khóa học. Không chứa bất kỳ thông tin nào liên quan đến `user_id` hay trạng thái học cá nhân.
- **`user_node_progress` & `user_task_progress`:** Là các bảng trạng thái cá nhân hóa (Per-user State).
  - Nếu sinh viên chưa từng click vào node, bảng `user_node_progress` chưa có bản ghi (coi như trạng thái mặc định theo điều kiện tiên quyết).
  - Khi sinh viên học, hệ thống tạo bản ghi với `status` (`LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`), `score`, `hints_used_count`.

---

## 5. ĐỊNH HƯỚNG MỞ RỘNG ĐA MÔN HỌC (MULTI-SUBJECT SCALABILITY)

Trước đây, OffByOne được định vị là *DSA Learning Platform*, dẫn đến nguy cơ các bảng dữ liệu bị bó hẹp trong các thuật ngữ cây, đồ thị, mảng.

Mô hình mới đã trừu tượng hóa:
- **`courses`** là Root Container. Cho phép cấu hình bất kỳ môn học nào:
  - `CS101`: Cấu trúc dữ liệu và Giải thuật (DSA)
  - `CS102`: Lập trình Hướng đối tượng C++ (OOP)
  - `CS201`: Cơ sở dữ liệu (Database Systems)
  - `CS202`: Hệ điều hành (Operating Systems)
- Mỗi môn học sở hữu một Lộ trình riêng (`roadmaps`), kho tài liệu RAG riêng (`knowledge_base_documents`), và danh sách bài tập riêng (`tasks`).
- Trợ giảng Socratic AI hoạt động dựa trên tài liệu được nạp của chính môn học đó thông qua RAG Grounding, bảo đảm không bị lạc đề hay nhầm lẫn kiến thức giữa các môn.

---

## 6. DANH MỤC CÁC ĐIỂM CẦN XÁC NHẬN VỚI BACKEND DEVELOPER TRƯỚC KHI IMPLEMENT

Tài liệu này là bản thiết kế luận lý (Logical Design). Trước khi bắt đầu viết mã nguồn ORM (Prisma/Drizzle/SQLAlchemy) và chạy script Migration, Backend Developer và Database Administrator (DBA) cần thống nhất các quyết định kỹ thuật sau:

### 1. Lựa chọn ORM / Database Toolkit
- **Hiện trạng:** Thư mục `api/` hiện là một microservice Python FastAPI tối giản phục vụ Gemini Mock Code. Frontend hiện đang dùng Next.js 14 với JavaScript/TypeScript.
- **Điểm cần chốt:** Backend chính sẽ được xây dựng bằng:
  - **Phương án A (TypeScript / Node.js):** Sử dụng **Prisma** hoặc **Drizzle ORM** tích hợp trực tiếp vào Next.js Server Actions / API Routes. Ưu điểm: Tái sử dụng Type với Frontend, tốc độ phát triển cao.
  - **Phương án B (Python / FastAPI):** Sử dụng **SQLAlchemy 2.0** + **Alembic** với PostgreSQL. Ưu điểm: Phù hợp hệ sinh thái AI/ML (LangChain, LlamaIndex, RAG pipelines).
  - *Khuyến nghị:* Thiết kế Logical trong tài liệu này hoàn toàn tương thích với cả hai phương án trên.

### 2. Kiểu dữ liệu Primary Key: UUID v4 vs. BIGINT / ULID
- **Hiện trạng:** Thiết kế đề xuất dùng `UUID` cho toàn bộ các bảng.
- **Cân nhắc:** UUID v4 ngẫu nhiên có thể gây phân mảnh chỉ mục B-Tree (Index Fragmentation) trên các bảng có tần suất ghi cực lớn (`code_submissions`).
- **Điểm cần chốt:** Có nên chuyển sang dùng **UUID v7** (UUID có sắp xếp theo thời gian) hoặc **BIGINT IDENTITY** cho các bảng log/lịch sử không?

### 3. Kiến trúc Sandbox thực thi mã nguồn (Code Execution Sandbox)
- **Hiện trạng:** Frontend đang mock kết quả chạy code qua `mockExecutionService.js`.
- **Cân nhắc:** Khi Backend nhận bài nộp C++ đa file (`.hpp`, `.cpp`), hệ thống cần:
  1. Ghi các file vào thư mục tạm trong container sandbox (Docker / gVisor / Judge0).
  2. Chạy lệnh biên dịch: `g++ -O2 -std=c++17 src/*.cpp -I include -o solution`.
  3. Đọc `coding_test_cases` để đưa vào `stdin` và đo thời gian, bộ nhớ.
- **Điểm cần chốt:** Backend sẽ tự dựng Worker Pool (Celery/BullMQ + Docker) hay tích hợp Judge0 API bên ngoài?

### 4. Lưu trữ Vector Embeddings cho RAG Documents
- **Hiện trạng:** `knowledge_base_documents` mới chỉ lưu metadata file.
- **Điểm cần chốt:** Lưu trữ Vector Chunks phục vụ Socratic AI RAG:
  - Tích hợp extension **`pgvector`** trực tiếp trong PostgreSQL (tạo thêm bảng `document_chunks` với cột `embedding vector(1536)`).
  - Hay sử dụng Vector Database chuyên biệt (Qdrant, ChromaDB, Pinecone)?
  - *Khuyến nghị:* Với quy mô vừa và nhỏ của dự án, sử dụng `pgvector` ngay trong PostgreSQL giúp giảm chi phí hạ tầng và đồng nhất sao lưu dữ liệu.
