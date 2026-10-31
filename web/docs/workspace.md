# Tài Liệu Giao Diện Workspace (`workspace.md`)

Tài liệu này mô tả chi tiết cấu trúc giao diện, bảng mã màu, cơ chế chuyển đổi **3 trạng thái (Theory / Quiz / Code)** thông qua thanh điều hướng bên trái, vùng soạn thảo **Monaco Editor** thực tế và các vị trí gán `href` trong màn hình **Workspace (`AVL Tree Mastery`)**.

---

## 1. Vị Trí File & Đường Dẫn Truy Cập

- **File mã nguồn chính:** [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx)
- **URL truy cập:** `http://localhost:3000/workspace`
- **Kết nối từ trang Roadmap:** Khi ấn vào một Node trên trang `/roadmap` và bấm nút **`→ Enter Workspace`** trong Pop-up Screen, trình duyệt sẽ điều hướng thẳng sang `/workspace?topic=...`.

---

## 2. Bảng Mã Màu Đã Áp Dụng (Theo Selection Colors Trên Figma)

| Mã màu | Độ trong suốt | Vai trò hiển thị trên giao diện Workspace |
| :--- | :---: | :--- |
| `#15161E` | `100%` | Nền chính toàn trang, nền vùng nhập code của Editor và nền các thẻ con |
| `#16161E` | `100%` | Nền chính của 3 cột khung lớn (Left Sidebar, Center Workspace, Right Socratic Panel) |
| `#1A1B26` | `100%` | Nền thanh Navbar, thanh Tab Editor, hộp Socratic Hint và các nút phụ |
| `#292E42` | `100%` | Viền tiêu chuẩn của các khung, đường kẻ phân cách và viền các đáp án chưa chọn |
| `#283457` | `35% - 100%` | Nền của thẻ Task đang chọn (`In Progress`), nhãn chữ cái `A, C, D` và nút `Request Another Socratic Hint` |
| `#7AA2F7` | `100%` | Màu xanh chủ đạo: Nút `Submit`, viền thẻ Task đang học, chữ trên các nút Socratic |
| `#7DCFFF` | `100%` | Màu xanh Cyan: Chữ `Question 2 of 3:`, `Question:`, icon `Socratic AI Tutor` |
| `#9ECE6A` | `100%` | Màu xanh lá: Viền & dấu tích `Completed` của Task, nhãn `RAG Grounded`, nhãn `Optimal`, độ phức tạp `O(1)` |
| `#DB4B4B` | `100%` | Màu đỏ cảnh báo: Viền đáp án sai (`Option B`), nhãn `× Incorrect Selection`, viền thẻ `Edge Case Warning`, nhãn `Failed (Test Case #5)` |
| `#73DACA` | `100%` | Màu xanh ngọc (Teal): Tô sáng cụm từ khóa `Balance Factor` và tên cấu trúc `Node` |
| `#FF9E64` | `100%` | Màu cam: Tô sáng các giá trị số (`3`, `1`, `+2 (3 - 1 = 2)`) và gợi ý kiểm tra con trỏ |
| `#C7A9FF` | `100%` | Màu tím nhạt: Tiêu đề `Socratic Hint (Triggered by Option B):` |
| `#C0CAF5` | `100%` | Chữ tiêu đề chính và nội dung code |
| `#A9B1D6` | `100%` | Chữ nội dung mô tả và câu hỏi |
| `#545C7E` | `100%` | Chữ phụ, chú thích nhỏ và cột đánh số dòng trong Code Editor |

---

## 3. Thanh Điều Hướng Bên Trái & 3 Trạng Thái Trung Tâm (`activeMode`)

Cột bên trái (`AVL Tree Mastery`) đóng vai trò là **thanh điều hướng 3 trạng thái** của màn hình. Mặc định khi mới vào trang sẽ mở **Task 1 (`"theory"`)** trước. Người dùng hoặc Developer có thể bấm vào **Task 1**, **Task 2**, hoặc **Task 3** để chuyển đổi tức thì:

### Trạng thái 1: `activeMode = "theory"` (`Task 1: Core Theory & Big-O` — Mở mặc định đầu tiên)
- Kế thừa bố cục rõ ràng của giao diện Quiz để trình bày lý thuyết cốt lõi trước khi làm bài.
- **Khung giữa:** Hiển thị `CORE THEORY: AVL TREE & BIG-O COMPLEXITY` cùng 4 thẻ kiến thức (`01. AVL Balance Factor Invariant`, `02. Left-Heavy Imbalance`, `03. Right-Heavy Imbalance`, `04. Guaranteed O(log N) Complexity`) và nút **`Next: Take Quiz →`**.
- **Khung phải (`Socratic AI Tutor`):** Hiển thị câu hỏi gợi mở lý thuyết (`Socratic Concept Check`).

### Trạng thái 2: `activeMode = "quiz"` (`Task 2: Quiz: Balance Factor` — Mặc định chưa chọn đáp án)
- **Khung giữa (`QUIZ: AVL TREE`):**
  - Ban đầu `selectedOption = null` (chưa có đáp án nào được chọn).
  - Câu hỏi `Question 2 of 3:` với các từ khóa tô màu chuẩn (`3`, `1` màu `#FF9E64`; `Balance Factor` màu `#73DACA`).
  - Khi người dùng bấm chọn **`B`** sẽ hiển thị viền đỏ `#DB4B4B` và nhãn **`× Incorrect Selection`**; nếu bấm chọn **`A`** sẽ hiển thị viền xanh lá `#9ECE6A` và nhãn **`✓ Correct Answer`**.
- **Khung phải (`Socratic AI Tutor`):**
  - Khi chưa chọn đáp án: Hiển thị hướng dẫn chọn `A, B, C, D`.
  - Khi chọn đáp án sai (ví dụ `Option B`): Tự động kích hoạt `Socratic Hint (Triggered by Option B):` giải thích vì sao `Balance Factor = +2` cần xoay phải thay vì xoay trái.

### Trạng thái 3: `activeMode = "code"` (`Task 3: Code: Right Rotation` — Hiển thị trọn vẹn trong 1 màn hình)
- Toàn bộ giao diện khóa chiều cao theo màn hình (`lg:h-svh lg:overflow-hidden`) để **hiển thị cùng lúc cả vùng Code Editor lẫn phần `Code Analysis & Test Results` bên dưới mà không cần phải cuộn trang**.
- **Cột giữa chia làm 2 phần trên – dưới:**
  1. **Khung trên — Monaco Editor thực tế (`@monaco-editor/react` - `solution.cpp`):**
     - Sử dụng trực tiếp component `<Editor />` từ gói `@monaco-editor/react` với theme tùy chỉnh **`tokyo-night`** ([`handleEditorBeforeMount`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx#L158-L188)):
       - Từ khóa (`#include`, `using`, `namespace`, `return`, `nullptr`): Tím `#BB9AF7`
       - Kiểu dữ liệu (`struct`, `int`): Xanh dương `#7AA2F7`
       - Tên cấu trúc/lớp (`Node`, `std`): Xanh ngọc `#73DACA`
       - Hằng số (`0`, `1`): Cam `#FF9E64`
       - Chuỗi / thư viện (`<iostream>`): Xanh lá `#9ECE6A`
       - Toán tử (`->`, `?`, `:`, `=`, `+`, `-`): Xanh băng `#89DDFF`
     - Đã tắt Minimap ở góc phải (`minimap: { enabled: false }`) và chỉ sử dụng **1 thanh cuộn duy nhất của Monaco Editor**, kèm thanh trạng thái dưới đáy (`Ln 19, Col 18 | C++ | UTF-8 | ● Ready`) tự động cập nhật tọa độ con trỏ theo thời gian thực.
  2. **Khung dưới — `Code Analysis & Test Results`:**
     - **Thẻ trái (`Complexity Estimation`):** Nhãn `Optimal`, `Time Complexity O(1)`, `Space Complexity O(1)`, và dòng `Meets optimal bounds for AVL operations.`.
     - **Thẻ phải (`Edge Case Warning`):** Nhãn `Failed (Test Case #5)`, cảnh báo `Segmentation fault (SIGSEGV) on Test Case #5` (`dereferencing a null pointer (y->left)`), kèm gợi ý `→ Check for null pointers before accessing y->left.`.
- **Cột phải chia làm 2 phần trên – dưới:**
  1. **Khung trên — `Visualization` (`AVL Tree`):**
     - Vẽ trực quan 2 sơ đồ cây nhị phân **`Before (Right Rotation)`** (`y` ở gốc, `x` lệch trái kèm các cây con `T1, T2, T3`) $\longrightarrow$ **`After`** (`x` lên làm gốc mới, `y` xoay xuống phải) với mọi cạnh nối đều dùng hàm `getCircleEdge` thẳng tắp và vuông góc $90^\circ$ với tiếp tuyến đường tròn.
  2. **Khung dưới — `Socratic AI Tutor`:**
     - Hiển thị gợi ý có biểu tượng bóng đèn tím `Socratic Hint` nhắc kiểm tra con trỏ `y` khác `nullptr` trước khi truy cập `y->left` ở đầu hàm `rotateRight`.

---

## 4. Hướng Dẫn Gán `href` Điều Hướng (`WORKSPACE_LINKS`)

Các đường dẫn điều hướng sang trang khác được cấu hình tập trung tại hằng số [`WORKSPACE_LINKS`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx#L31-L35):

| Thành phần / Nút bấm | Khóa trong `WORKSPACE_LINKS` | Giá trị mặc định | Mô tả điều hướng |
| :--- | :--- | :---: | :--- |
| **Logo `AlgoPath` (góc trái Header)** | `WORKSPACE_LINKS.brand` | `"/"` | Quay về trang chủ Landing (`/`) |
| **Nút `← Back to Skill Tree` (cột trái)** | `WORKSPACE_LINKS.backToSkillTree` | `"/roadmap"` | Quay lại màn hình sơ đồ cây Roadmap |
| **Avatar `Duc Vinh Hoang` (góc phải Header)** | `WORKSPACE_LINKS.profile` | `"/auth"` | Chuyển tới trang tài khoản / đăng nhập |
