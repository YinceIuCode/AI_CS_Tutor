# Tài Liệu Giao Diện Workspace (`workspace.md`)

Tài liệu này mô tả chi tiết cấu trúc giao diện, bảng mã màu, cơ chế chuyển đổi **3 chế độ học tập (Theory / Quiz / Coding)**, tích hợp trình soạn thảo **Monaco Editor**, kết nối API chấm bài Backend và hệ thống trợ giảng **Socratic AI Tutor** trong màn hình **Workspace**.

---

## 1. Vị Trí File & Đường Dẫn Truy Cập

- **File mã nguồn chính:** [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx)
- **URL truy cập:** `http://localhost:3000/workspace` (hoặc `http://localhost:3000/workspace?node=avl-tree&task=avl-tree-task-1`)
- **Dịch vụ Thực thi & Chấm bài:** [`web/services/executionService.ts`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts) (`runCode`, `submitCode`)
- **Dịch vụ Lộ trình & Task động:** [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js) (`resolveWorkspaceSessionAsync`, `evaluateQuizAnswer`)
- **Dịch vụ Lưu Tiến độ:** [`web/services/progressService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js) (`updateUserProgress`, `saveTaskCompletion`)
- **Component Trợ giảng Socratic AI:** [`web/components/workspace/SocraticTutorPanel.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/workspace/SocraticTutorPanel.tsx)
- **Component Phân tích Kết quả:** [`web/components/workspace/CodeAnalysisPanel.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/workspace/CodeAnalysisPanel.tsx)

---

## 2. Bảng Mã Màu Tokyo Night Đã Áp Dụng

| Mã màu | Độ trong suốt | Vai trò hiển thị trên giao diện Workspace |
| :--- | :---: | :--- |
| `#15161E` | `100%` | Nền chính toàn trang, nền vùng soạn thảo Monaco Editor và nền các thẻ con |
| `#16161E` | `100%` | Nền chính của 3 cột khung lớn (Left Sidebar, Center Workspace, Right Socratic Panel) |
| `#1A1B26` | `100%` | Nền thanh Navbar, thanh Tab Editor, hộp Socratic Hint và các nút điều hướng phụ |
| `#292E42` | `100%` | Viền tiêu chuẩn của các khung, đường kẻ phân cách và viền các đáp án chưa chọn |
| `#283457` | `35% - 100%` | Nền của thẻ Task đang chọn (`In Progress`), vùng bôi đen con trỏ chuột trong Editor |
| `#7AA2F7` | `100%` | Màu xanh chủ đạo: Nút `Submit`, viền thẻ Task đang học, chữ trên các nút Socratic |
| `#7DCFFF` | `100%` | Màu xanh Cyan: Tiêu đề câu hỏi, nhãn Socratic Check, icon `Socratic AI Tutor` |
| `#9ECE6A` | `100%` | Màu xanh lá: Trạng thái `Completed` của Task, nhãn `Optimal`, độ phức tạp `O(1)` |
| `#DB4B4B` | `100%` | Màu đỏ cảnh báo: Viền đáp án sai, nhãn `× Incorrect Selection`, cảnh báo lỗi biên dịch/runtime |
| `#FF9E64` | `100%` | Màu cam: Nhãn chỉ số dòng lỗi cần chú ý (`Point to Line X`) |
| `#BB9AF7` | `100%` | Màu tím: Từ khóa C++ trong Editor, nhãn huy hiệu Socratic Hint |
| `#C0CAF5` | `100%` | Chữ tiêu đề chính và nội dung code |

---

## 3. Cấu Trúc 3 Cột & 3 Chế Độ Bài Học (`activeMode`)

### Cột Trái: Sidebar Điều Hướng Bài Học (Task Navigator)
- Nút **`← Back to Roadmap`** để quay lại sơ đồ cây kỹ năng.
- Thông tin Node đang học: Tên chủ đề (ví dụ `AVL Tree`), độ phức tạp mục tiêu (`O(log N)`), tiến độ hoàn thành các task (`1/3` hoặc `3/3 Tasks`).
- Danh sách 3 Tasks học tập tuần tự:
  - **Task 1: Core Theory & Invariants** (Học lý thuyết và đặc tính cấu trúc).
  - **Task 2: Socratic Quiz** (Kiểm tra tư duy trắc nghiệm nhiều câu hỏi).
  - **Task 3: C++ Coding Task** (Lập trình cài đặt thuật toán).

---

### Cột Giữa: Không Gian Bài Học Trung Tâm

#### Chế độ 1: `activeMode = "theory"` (Task 1: Core Theory)
- **Khung tiêu đề:** Tiêu đề lý thuyết và đoạn tóm tắt tổng quan (`summaryLead`).
- **Dải độ phức tạp 4 chỉ số (Complexity Strip):** Best, Average, Worst, Space.
- **Danh sách thẻ đặc tính cấu trúc (Structural Invariants):** Trình bày các quy tắc bất biến của thuật toán (ví dụ: `Balance Factor ∈ {-1, 0, +1}`, `LL/RR Rotations`).
- **C++ Reference Snippet:** Khung code mẫu tham khảo trực quan có đánh số dòng.
- Nút chuyển tiếp: **`Next: Take Quiz →`**.

#### Chế độ 2: `activeMode = "quiz"` (Task 2: Socratic Quiz)
- Hỗ trợ chuỗi nhiều câu hỏi trắc nghiệm (**Q1, Q2, Q3**).
- Thanh tiến trình câu hỏi: Các viên thuốc `Q1`, `Q2`, `Q3` hiển thị trạng thái làm bài (xanh lá nếu đúng, đỏ nếu sai, viền xanh dương cho câu đang chọn).
- Mỗi câu hỏi gồm:
  - Đề bài chi tiết với từ khóa được tô màu ngữ nghĩa.
  - 4 lựa chọn A, B, C, D: Bấm chọn đáp án sẽ hiển thị phản hồi ngay lập tức (highlight viền xanh lá `✓ Correct Answer` hoặc viền đỏ `× Incorrect Selection`).
  - Lời giải thích cặn kẽ vì sao đáp án được chọn là đúng hoặc sai.
- Nút điều hướng thông minh: Khi trả lời đúng, tự động hiển thị nút **`Go to Unanswered Question (Qx) →`** hoặc nút **`Next: C++ Coding Task →`** khi đã hoàn thành toàn bộ câu hỏi.

#### Chế độ 3: `activeMode = "coding"` (Task 3: C++ Coding Task)
Khóa chiều cao màn hình (`lg:h-svh lg:overflow-hidden`) để hiển thị đồng thời cả trình soạn thảo lẫn bảng kết quả:
1. **Khung trên — Monaco Editor thực tế (`@monaco-editor/react`):**
   - Theme tùy chỉnh `tokyo-night` tô màu chuẩn xác cú pháp C++.
   - Hỗ trợ phím `Tab` thụt lề 4 khoảng trắng, tự động cuộn đồng bộ.
   - Thanh trạng thái đáy: Vị trí con trỏ `Ln X, Col Y`, ngôn ngữ `C++`, chuẩn mã hóa `UTF-8`, trạng thái lưu nháp tự động (`Draft Saved`).
   - Hai nút thao tác thực thi:
     - **`Run Sample Tests`**: Chạy nhanh trên các ca kiểm thử công khai (Public Samples) qua endpoint `POST /api/code/run`.
     - **`Submit for Grading`**: Nộp bài chấm điểm toàn diện với bộ test ẩn (Hidden Judge) qua endpoint `POST /api/code/submit`.
2. **Khung dưới — `Code Analysis & Test Results`:**
   - **Đánh giá độ phức tạp (Complexity Estimation):** Hiển thị `Time Complexity O(...)`, `Space Complexity O(...)`, nhãn `Optimal` hoặc `Sub-optimal`.
   - **Kết quả kiểm thử (Test Cases Results):** Danh sách chi tiết từng ca kiểm thử kèm trạng thái `Passed` hoặc `Failed`, mã lỗi (`SIGSEGV`, `NullPointer`, `AssertionError`) và hướng dẫn sửa lỗi logic.

---

### Cột Phải: Socratic AI Tutor & Trợ Giảng Cá Nhân

Component [`SocraticTutorPanel.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/workspace/SocraticTutorPanel.tsx) đồng hành cùng học viên:
1. **Chế độ Theory:** Đặt câu hỏi phản tư Socratic (`Socratic Concept Check`) buộc người học suy nghĩ về bản chất bất biến thay vì học vẹt.
2. **Chế độ Quiz:** Kích hoạt gợi ý Socratic riêng biệt tương ứng với phương án người học vừa chọn, giải thích vì sao nhận định đó có sơ hở logic.
3. **Chế độ Coding:**
   - **Chỉ điểm dòng lỗi (Point to Line X):** Tự động phát hiện vị trí con trỏ rủi ro (ví dụ `y->left` khi `y == nullptr`) và cung cấp nút bấm để cuộn trình soạn thảo trỏ thẳng vào dòng code đó.
   - **Thang gợi ý bậc thang (Progressive Hint Ladder):** Cung cấp 3 tầng gợi ý từ gợi mở khái niệm tổng quát đến gợi ý cấu trúc cụ thể, tuân thủ nguyên tắc **Strict Zero-Spoiler Policy** (không đưa ra toàn bộ lời giải sẵn).

---

## 4. Hướng Dẫn Gán `href` Điều Hướng (`WORKSPACE_LINKS`)

| Thành phần / Nút bấm | Khóa trong `WORKSPACE_LINKS` | Giá trị mặc định | Mô tả điều hướng |
| :--- | :--- | :---: | :--- |
| **Logo `OffByOne` (góc trái Header)** | `WORKSPACE_LINKS.brand` | `"/"` | Quay về trang chủ Landing (`/`) |
| **Nút `← Back to Roadmap` (cột trái)** | `WORKSPACE_LINKS.backToSkillTree` | `"/roadmap"` | Quay lại màn hình cây kỹ năng |
| **User Profile Menu (góc phải Header)** | `WORKSPACE_LINKS.profile` | `"/auth"` | Menu tài khoản và đăng xuất |
