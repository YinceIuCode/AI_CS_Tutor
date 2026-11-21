# Tài Liệu Bảng Điều Khiển Quản Trị Hệ Thống (`admin.md`)

Tài liệu này mô tả chi tiết chức năng, cấu trúc giao diện, quyền truy cập và các cơ chế tương tác dữ liệu trong trang **Admin Console (`/admin`)** của dự án OffByOne.

---

## 1. Vị Trí File & Đường Dẫn Truy Cập

- **File mã nguồn chính:** [`web/app/admin/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/admin/page.tsx)
- **URL truy cập:** `http://localhost:3000/admin`
- **Dịch vụ tương tác Supabase:** [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js)
- **Tài khoản mặc định:** `admin@offbyone.demo` / `Admin1234` (Role: `admin`)

---

## 2. Phân Quyền & Điều Hướng Theo Vai Trò (Strict Role-Based Routing)

1. **Quyền truy cập (`role === 'admin' || role === 'tutor'`):**
   - Chỉ tài khoản có `role` là `admin` hoặc `tutor` mới được phép xem nội dung trang `/admin`.
   - Nếu chưa đăng nhập hoặc không đủ quyền, hiển thị màn hình **403 Access Denied** kèm nút quay về `/roadmap` hoặc đổi tài khoản sang `/auth`.
2. **Quy tắc điều hướng độc quyền cho Admin:**
   - Khi đăng nhập bằng `admin@offbyone.demo`, hệ thống bắt buộc chuyển hướng thẳng tới `/admin` (không vào `/roadmap`).
   - Nếu Admin cố tình truy cập vào `/roadmap` hoặc `/workspace`, giao diện tự động redirect ngược về `/admin`.
   - Trên Sidebar bên trái của `/admin`: Ẩn nút `Back to Roadmap`, thay vào đó là nút **`Switch to Student Demo`** (cho phép chuyển nhanh phiên sang `student@offbyone.demo` để kiểm tra kết quả) và nút **`Log Out`**.
   - Admin không lưu tiến độ học tập riêng trong `user_progress`.

---

## 3. Cấu Trúc 4 Tab Chức Năng Chính Trên `/admin`

### Tab 1: Database Explorer (Khám phá & Chỉnh sửa Dữ liệu Thô)
- Hỗ trợ xem và thao tác trực tiếp trên 6 bảng cơ sở dữ liệu:
  1. `users`
  2. `knowledge_documents`
  3. `roadmap_nodes`
  4. `tasks`
  5. `user_progress`
  6. `code_submissions`
- **Thanh tìm kiếm & Bộ lọc phân cấp liên kết:** Lọc theo User, Document, Node.
- **Drawer Chỉnh sửa Bản ghi (Visual & JSON Form):**
  - Tab Visual Form: Tự động render các trường cơ bản theo schema.
  - Tab JSON Editor: Chỉnh sửa thô với bộ kiểm tra lỗi JSON syntax thời gian thực (`jsonErrors`).
- **Nút "Inspect Supabase":** Mở modal kiểm toán dữ liệu trực tiếp, hiển thị tổng số bản ghi từng bảng, phát hiện trùng lặp ID, khóa ngoại mồ côi (orphaned nodes/tasks).
- **Nút "Download Snapshot":** Tải toàn bộ snapshot dữ liệu 6 bảng về máy định dạng `.json`.

### Tab 2: Course & Lesson Studio (Biên Soạn Nội Dung Chuẩn Tokyo Night)
Bố cục 2 cột toàn chiều rộng (`grid-cols-1 xl:grid-cols-12 gap-5 w-full`), kết nối trực tiếp với 2 bảng `public.roadmap_nodes` và `public.tasks`:

1. **Thanh điều khiển đầu trang (1 hàng ngang):**
   - Dropdown 1: `Syllabus / Document` (lọc theo `CS101_DSA_Syllabus_HCMUS.pdf` hoặc `CS102_OOP_Cpp_Syllabus_HCMUS.pdf`).
   - Dropdown 2: `Select Node` (chỉ liệt kê các Node thuộc tài liệu đang chọn).
   - Nút `+ New Node`: Mở modal tạo nhanh Node mới.
   - Badge `● Unsaved Changes`: Cảnh báo khi có thay đổi chưa lưu.
   - Nút `Save to Database`: Lưu đồng thời Node và 3 Tasks lên Supabase.
2. **Khối Node Metadata & Visual DAG Prerequisites Editor:**
   - 4 ô nhập liệu: `Node Label`, `Short Code`, `Target Complexity`, `Slide PDF Reference`.
   - Danh sách nút đa chọn `DAG Prerequisites` liên kết các node cha trong cùng tài liệu.
   - **Phát hiện chu trình DFS (`detectDagCycle`):** Hiển thị banner cảnh báo đỏ khi phát hiện phụ thuộc vòng và vô hiệu hóa nút Lưu.
3. **4 Tab bài học:**
   - **Task 1: Core Theory (6/6 cols):**
     - Trái: Header Title, Summary Lead, Complexity Strip 4 chỉ số (Best, Average, Worst, Space), Dynamic Invariants List (thêm/xóa thẻ).
     - Phải: C++ Reference Snippet Editor có số dòng `TokyoNightCodeEditor`, Socratic Check Question, công tắc `Live Student Preview`.
   - **Task 2: Socratic Quiz (7/5 cols):**
     - Trái: Tab chuyển câu hỏi (`Q1`, `Q2`, `Q3`...), nút thêm/xóa câu, đề bài, 4 đáp án A-D có radio chọn đáp án đúng (tự động highlight viền xanh `Correct Answer`), ô giải thích chi tiết.
     - Phải: Socratic Hint theo câu + Thẻ mô phỏng trắc nghiệm thời gian thực (`Live Quiz Card Preview`).
   - **Task 3: C++ Coding Task (5/7 cols):**
     - Trái: Tiêu đề bài toán, độ khó (`Easy`, `Medium`, `Hard`), đề bài, định dạng Input/Output, Dynamic Test Suite Builder (thêm/xóa test case, gắn cờ `Public Sample` vs `Hidden Judge`).
     - Phải: Trình soạn thảo mã nguồn Tokyo Night có số dòng với 2 tab tách biệt (`Starter Code (C++)` vs `Reference Solution (C++)`) cùng nút Copy và Reset.
   - **Task 4: Socratic AI Guardrails (6/6 cols):**
     - Trái: Danh sách Invariants cốt lõi cần ép buộc + Danh sách hiểu lầm thường gặp của sinh viên (thêm/xóa chip).
     - Phải: Thang gợi ý 3 tầng Socratic (Tier 1 Conceptual Probe, Tier 2 Targeted Structural Hint, Tier 3 Boundary Nudge) cùng công tắc `Strict Zero-Spoiler Mode (ON/OFF)`.

### Tab 3: Users & Progress Control (Điều Khiển Tiến Độ Sinh Viên)
- **1-Click Demo Scenario Switcher (Áp dụng trực tiếp vào `student@offbyone.demo`):**
  - **Preset 1 (0% Empty State):** Xóa trắng toàn bộ tiến độ, đưa về trạng thái chờ upload tài liệu đề cương.
  - **Preset 2 (67% Mid-Course Demo):** Mở khóa tới bài AVL Tree, kích hoạt lỗi `nullptr` phục vụ kịch bản demo Socratic AI.
  - **Preset 3 (100% Completed / Mastered):** Hoàn thành 100% tất cả các bài học và bài tập code.
- **Nút "Restore CS101 Seed":** Khôi phục dữ liệu gốc chuẩn của khóa học DSA nếu cơ sở dữ liệu bị sai lệch.

### Tab 4: Submissions Inspector (Kiểm Tra Bài Nộp C++)
- Xem danh sách bài nộp code từ bảng `code_submissions`.
- Drawer xem chi tiết: Mã nguồn C++, ngôn ngữ, thời gian thực thi (`runtimeMs`), bộ nhớ (`memoryMb`), `stdout`, `stderr`, và trạng thái từng test case (`passed` / `failed`).
