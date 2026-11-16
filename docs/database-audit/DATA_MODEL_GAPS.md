# OffByOne Data Model Gaps & Multi-File / Multi-Subject Expansion Analysis

Tài liệu này đánh giá khoảng cách giữa kiến trúc dữ liệu hiện tại của **OffByOne** với các yêu cầu mở rộng trong tương lai, đặc biệt là:
1. Hỗ trợ bài tập lập trình hướng đối tượng (OOP) nhiều file (`.cpp`, `.hpp`).
2. Mở rộng từ nền tảng chuyên biệt DSA sang nền tảng học tập đa môn học (Subject-Agnostic Learning Platform).
3. Triển khai cơ sở dữ liệu quan hệ (RDBMS) thực tế và môi trường thực thi code sandbox an toàn.

---

## 1. Phân Tích Hiện Trạng Coding Task: Single-File vs. Multi-File

### 1.1. Hiện Trạng Hệ Thống: Strictly Single-File
Qua khảo sát toàn bộ mã nguồn tại:
- [`web/mocks/workspaceTasks.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L96-L105)
- [`web/services/progressService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L8-L12)
- [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx#L205-L215)

Cấu trúc hiện tại được xây dựng hoàn toàn xoay quanh mô hình **Single-file**:

```ts
// Cấu trúc Coding Task hiện tại trong workspaceTasks.js
interface CurrentCodingTask {
  fileName: string        // Ví dụ: "solution.cpp", "bst_insert.cpp"
  language: string        // "C++"
  initialCode: string     // Chuỗi code duy nhất
}

// Cấu trúc bản nháp trong progressService.js
interface CurrentCodeDraft {
  code: string            // Chuỗi mã nguồn đơn lẻ
  language?: string
  isSubmitted?: boolean
}
```

Trên giao diện [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx):
- Monaco Editor chỉ gắn với một biến state `code` duy nhất: `const [code, setCode] = React.useState<string>("")`.
- Thanh Tab Editor chỉ hiển thị một badge cố định: `{taskDetail?.fileName || "solution.cpp"}`.
- Không có cơ chế quản lý thư mục ảo, chuyển tab giữa file header (`.hpp`) và file thực thi (`.cpp`), hoặc file kiểm thử (`main.cpp`).

### 1.2. Các Thành Phần Còn Thiếu Để Hỗ Trợ Bài Tập OOP Nhiều File

Để hỗ trợ các bài tập Lập trình hướng đối tượng (OOP) như thiết kế lớp `BankAccount`, `Polynomial`, `Matrix`... với cấu trúc gồm:
- Header file: `include/BankAccount.hpp`
- Implementation file: `src/BankAccount.cpp`
- Test driver / Entrypoint: `src/main.cpp`

Hệ thống **hoàn toàn chưa có** các trường dữ liệu và cơ chế sau:

| Thành Phần Cần Thiết | Tình Trạng Hiện Tại | Mục Đích Sử Dụng |
| :--- | :---: | :--- |
| `files: WorkspaceFile[]` | ❌ Chưa có | Mảng danh sách các file trong project |
| `file.path` | ❌ Chưa có | Đường dẫn tương đối (vd: `include/BankAccount.hpp`) |
| `file.isReadOnly` | ❌ Chưa có | Đánh dấu file đề bài sinh viên không được sửa (vd: `main.cpp`) |
| `file.isEntryPoint` | ❌ Chưa có | File chứa hàm `main()` để compiler biên dịch |
| `activeFileId` | ❌ Chưa có | Quản lý file đang được mở trong tab Monaco Editor |
| `includeDirectories: string[]` | ❌ Chưa có | Tham số cờ biên dịch `-I include/` |
| `projectType` | ❌ Chưa có | Phân biệt `"single-file"` vs `"multi-file-cpp"` |
| `compileCommand` / `buildSystem` | ❌ Chưa có | Lệnh build dự án (`g++ -std=c++17 src/*.cpp -I include/ -o solution`) |

### 1.3. Đề Xuất Cấu Trúc Dữ Liệu Cho Multi-File OOP Task

Để sẵn sàng mở rộng mà không phá vỡ cấu trúc cũ, đề xuất mở rộng schema của `CodingTask`:

```ts
// Đề xuất cấu trúc Multi-File Coding Task
export interface MultiFileWorkspaceFile {
  id: string                      // e.g. "file-header-1"
  path: string                    // e.g. "include/BankAccount.hpp"
  name: string                    // e.g. "BankAccount.hpp"
  language: "cpp" | "c" | "header"
  content: string                 // Nội dung file
  initialContent: string          // Nội dung mẫu ban đầu
  isReadOnly?: boolean            // true đối với file test driver không cho sửa
  isEntryPoint?: boolean          // true đối với main.cpp
}

export interface MultiFileCodingTaskDetail {
  nodeId: string
  taskId: string
  type: "coding"
  projectType: "single" | "multi-file"
  entryPointFileId: string
  includePaths: string[]          // ["include/"]
  files: MultiFileWorkspaceFile[]
  problem: ProblemDetail
  analysis: TaskAnalysis
}

// Cấu trúc bản nháp tiến độ nhiều file lưu vào LocalStorage
export interface MultiFileCodeDraft {
  taskId: string
  projectType: "multi-file"
  activeFileId: string
  files: Record<string, string>   // [fileId]: userEditedContent
  isSubmitted?: boolean
}
```

---

## 2. Khoảng Cách Khi Mở Rộng Sang Nền Tảng Đa Môn Học (Multi-Subject)

### 2.1. Các Ràng Buộc Đang Bị Hardcode Vào DSA
Hiện tại mã nguồn đang chứa nhiều giả định cố định gắn với môn Data Structures & Algorithms:
1. **Tiêu đề khóa học cố định**: `courseTitle: "Data Structures & Algorithms"` được hardcode trực tiếp trong [`web/services/roadmapService.js:29`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js#L29).
2. **File đề cương cố định**: `CS101_DSA_Syllabus_HCMUS.pdf` được gán mặc định tại [`web/services/progressService.js:45`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L45) và [`web/mocks/roadmapData.js:8`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js#L8).
3. **Đồ thị môn học tĩnh**: Toàn bộ 10 node trong `MOCK_ROADMAP_NODES` đều là các chủ đề DSA (`avl-tree`, `linked-list`, `bst`...). Chưa có thực thể `Subject` hay `Course` để quản lý nhiều môn học (ví dụ: OOP, Cơ sở dữ liệu, Mạng máy tính, Hệ điều hành...).
4. **Loại bài tập hạn chế**: Hệ thống chỉ định nghĩa 3 dạng bài (`theory`, `quiz`, `coding`). Khi mở rộng sang các môn khác (ví dụ: Hệ quản trị CSDL, Toán rời rạc), sẽ cần thêm các dạng:
   - `sql_query` (chạy query SQL trên SQLite/PostgreSQL).
   - `written_assignment` (câu hỏi tự luận ngắn có AI chấm thang điểm rubric).
   - `circuit_design` / `math_proof`.

### 2.2. Đề Xuất Thực Thể Môn Học (Course / Subject Entity)

```ts
export interface Course {
  id: string                      // e.g. "cs102-oop", "cs201-dsa"
  code: string                    // "CS102"
  title: string                   // "Object-Oriented Programming"
  department: string              // "Computer Science - HCMUS"
  description: string
  icon: string                    // "Boxes", "Binary", "Database"
  syllabusDocId?: string
  totalModules: number
  totalTasks: number
}
```

---

## 3. Khoảng Cách Về Cơ Sở Dữ Liệu & Backend Persistence

### 3.1. Hiện Trạng: Chưa Có RDBMS (0 Bảng, 0 Migration)
- Thư mục [`api/`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/api/) chỉ có file [`main.py`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/api/main.py) dài 34 dòng, chứa duy nhất một endpoint mẫu `POST /api/evaluate` và model Pydantic đơn giản `CodeSubmission(code: str, node_id: str)`.
- Không có SQLAlchemy, Prisma, Drizzle, Tortoise-ORM, Alembic migration hay bất kỳ cấu hình kết nối database nào (PostgreSQL, MySQL, SQLite, MongoDB).
- Toàn bộ dữ liệu của người dùng hiện nay phụ thuộc 100% vào trình duyệt của máy khách (`localStorage` và `sessionStorage`).

### 3.2. Những Rủi Ro Cần Giải Quyết Khi Xây Dựng Database
1. **Mất dữ liệu khi đổi thiết bị**: Sinh viên đăng nhập ở máy khác hoặc chuyển từ máy bàn sang điện thoại sẽ không thấy lộ trình và bài làm dở của mình.
2. **Bảo mật mật khẩu**: Mật khẩu hiện tại chỉ được băm bằng thuật toán DJB2 client-side và lưu trong `localStorage`. Khi có backend thực tế, bắt buộc phải sử dụng **Argon2id** hoặc **bcrypt** trên server và cấp phát JWT / HttpOnly Cookie.
3. **Lịch sử nộp bài (Submission History)**: Hiện tại hệ thống chỉ lưu duy nhất 1 bản nháp `codeDrafts[taskId]`. Cần tạo bảng `SUBMISSION_LOGS` để lưu lại từng lần nộp, mã nguồn lúc nộp, kết quả test, thời gian chạy và số điểm để phục vụ chấm điểm và phân tích năng lực học tập.

---

## 4. Lộ Trình Kiến Trúc Đề Xuất (Architectural Roadmap)

```mermaid
graph TD
    subgraph Phase 1: Client Simulation [Giai Đoạn Hiện Tại (PoC Complete)]
        A[Next.js Frontend] -->|Browser Storage| B[LocalStorage & SessionStorage]
        A -->|Mock Services| C[workspaceTasks.js & executionService.ts]
    end

    subgraph Phase 2: Multi-File & Multi-Course Extension [Giai Đoạn Mở Rộng Model]
        D[Multi-File Workspace File Tree]
        E[Subject/Course Model]
        F[Dynamic DAG Generator]
    end

    subgraph Phase 3: Production Backend & Real Persistence [Giai Đoạn Database Production]
        G[FastAPI / NestJS Backend]
        H[(PostgreSQL Database)]
        I[Dockerized Remote Code Runner - Judge0/Piston]
        J[S3 / MinIO Syllabus Object Storage]
    end

    Phase 1 -.-> Phase 2
    Phase 2 -.-> Phase 3
```
