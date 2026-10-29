# Tài Liệu Màn Hình DSA Roadmap Tree & Pop-up Screen (`roadmap.md`)

Tài liệu này mô tả chi tiết cấu trúc giao diện, thuật toán nối tâm đường tròn, hộp thoại **Pop-up Screen** giới thiệu các Task của từng Node, luồng mô phỏng dành cho Developer (Developer Flow Simulation) và các vị trí gán `href` trong màn hình **Data Structures & Algorithms Roadmap**.

---

## 1. Vị Trí File & Đường Dẫn Truy Cập

- **File mã nguồn chính:** [`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx)
- **URL truy cập:** `http://localhost:3000/roadmap` (hoặc `http://localhost:3000/skill-tree`)

---

## 2. Luồng Chạy Mô Phỏng Dành Cho Developer (3 Trạng Thái)

Màn hình được thiết kế sẵn cơ chế chuyển đổi trạng thái tự động (`empty` → `loading` → `ready`) để kiểm thử trọn vẹn trải nghiệm người dùng trước khi nối API Backend thực tế:

### Trạng thái 1: Chưa tải file PDF (`flowState = "empty"`)
- **Khung trái (Roadmap Tree):**
  - Thanh tiêu đề hiển thị tiến độ `0%` và `Unlocked: 0 / 0 Nodes`.
  - 6 vòng tròn nét đứt (`Topic 1` → `Topic 6`) nối với nhau bằng đường thẳng nối tâm vuông góc $90^\circ$ với tiếp tuyến của từng đường tròn.
  - Ở chính giữa hiển thị hộp thông báo nét đứt: **`No Skill Tree Generated Yet`** (*"Upload your course syllabus or lecture slides on the right panel to extract topics and build your learning path."*).
- **Khung phải (Upload & Knowledge Base):**
  - Hộp tải file PDF với nút **`Choose File`**.
  - Khung **Active Knowledge Base (RAG)** hiển thị `0 Documents Indexed`.

### Trạng thái 2: Đang xử lý ở Backend (`flowState = "loading"`)
- **Cách kích hoạt:** Bấm trực tiếp vào nút **`Choose File`** ở cột bên phải.
- **Khung trái (Roadmap Tree):**
  - Hộp trung tâm chuyển sang thanh tiến trình **Loading Bar (`0% → 100%`)** chạy mượt trong ~2.2 giây.
  - Hiển thị lần lượt 3 bước xử lý của Backend RAG Pipeline:
    1. `Parsing PDF layout & course syllabus sections...`
    2. `Extracting DSA topics & prerequisite dependencies...`
    3. `Indexing 48 vector chunks into Active Knowledge Base (RAG)...`
- **Khung phải (Active Knowledge Base):**
  - Hiển thị trạng thái đang băm nhỏ văn bản và tạo vector (`Chunking & embedding PDF...`).

### Trạng thái 3: Hoàn tất tạo Skill Tree & Mở Pop-up Screen (`flowState = "ready"`)
- **Khung trái (Roadmap Tree):**
  - Thanh tiêu đề trên cùng tự động cập nhật thành **`33%`** và **`Unlocked: 3 / 6 Nodes`** kèm tên file vừa tải lên.
  - 6 vòng tròn tự động sắp xếp thành **Cây lộ trình 3 tầng** theo đúng màu chú thích (Legend) ở góc dưới trái:
    - **Completed (`#9ECE6A` - Xanh lá):** `Arrays & Big-O`, `Linked Lists` (có dấu tích `✓`).
    - **Current (`#3DB5E6` / `#7DCFFF` - Xanh lam):** `Binary Search Tree` (Node `03` đang học).
    - **Locked (`#414868` - Xám tím):** `Hash Tables`, `AVL Tree`, `Graphs & DP` (có biểu tượng ổ khóa).
  - Mọi vạch nối giữa 2 Node tròn đều được tính bằng hàm [`getCircleEdge`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx#L49-L68) để luôn là đường thẳng đi qua 2 tâm và vuông góc $90^\circ$ với tiếp tuyến của cả 2 đường tròn.
- **Khung phải (Active Knowledge Base):**
  - Tự động cập nhật tên file **`CS101_DSA_Syllabus_HCMUS.pdf`**, dung lượng **`2.4 MB`**, số lượng **`48 chunks`**, nhãn **`Indexed`** màu xanh lá và nút thùng rác (`Trash2`) để xóa file / reset luồng.

---

## 3. Tính Năng Pop-up Screen Khi Ấn Vào Node

Khi ở trạng thái `ready`, bấm vào **bất kỳ Node nào trên cây** (đang học hoặc chưa học, ví dụ bấm vào Node **`AVL Tree`** hoặc nút nhanh **`Preview "AVL Tree" Pop-up`** ở góc dưới) sẽ hiển thị **Pop-up Screen** nổi lên chính giữa theo đúng thiết kế:

- **Khung Pop-up:** Nền tối `#1A1B26`, viền xanh `#7AA2F7` (`border-[#7AA2F7]/65`), bo góc `rounded-2xl`.
- **Thanh tiêu đề Pop-up:**
  - Bên trái: Tên chủ đề của Node (ví dụ: **`AVL Tree`**).
  - Bên phải: Nút đóng **`X`** (hoặc bấm ra vùng nền mờ bên ngoài để đóng Pop-up).
- **Danh sách 3 Task bên trong Node:**
  - Mỗi dòng gồm huy hiệu tròn xanh `#7AA2F7` đánh số thứ tự **`1`**, **`2`**, **`3`** và nội dung công việc.
  - Ví dụ với Node **`AVL Tree`**:
    1. `Core Theory & Big-O Complexity`
    2. `Quiz: Balance Factor Check`
    3. `Code: Left & Right Rotations`
- **Nút hành động chính:**
  - Nút rộng toàn khung **`→ Enter Workspace`** nền `#7AA2F7`, chữ đậm `#15161E`, tự động gắn tham số chủ đề (`?topic=AVL%20Tree`) để chuyển sang trang làm bài Workspace.

---

## 4. Hướng Dẫn Gán `href` Điều Hướng (`ROADMAP_LINKS`)

Tất cả các đường dẫn điều hướng sang trang khác được tập trung tại hằng số [`ROADMAP_LINKS`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx#L25-L31) ở đầu file [`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx):

| Thành phần / Nút bấm | Khóa trong `ROADMAP_LINKS` | Giá trị mặc định | Mô tả điều hướng |
| :--- | :--- | :---: | :--- |
| **Logo `AlgoPath` (góc trái Header)** | `ROADMAP_LINKS.brand` | `"/landing"` | Quay về trang giới thiệu Landing |
| **Avatar `Duc Vinh Hoang` (góc phải Header)** | `ROADMAP_LINKS.profile` | `"/auth"` | Chuyển tới trang tài khoản / đăng nhập |
| **Nút `→ Enter Workspace` (trong Pop-up Screen)** | `ROADMAP_LINKS.workspace` | `"/workspace"` | Chuyển vào không gian học tập (Lý thuyết + Quiz + Code) của Node vừa chọn |
| **Đường dẫn Code Sandbox** | `ROADMAP_LINKS.codeSandbox` | `"/sandbox"` | Đường dẫn dự phòng tới trang Code Editor |
| **Đường dẫn Theory Quiz** | `ROADMAP_LINKS.theoryQuiz` | `"/quiz"` | Đường dẫn dự phòng tới trang Quiz trắc nghiệm |
