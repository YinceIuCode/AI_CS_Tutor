# Tài Liệu Màn Hình DSA Roadmap Tree & Pop-up Screen (`roadmap.md`)

Tài liệu này mô tả chi tiết cấu trúc giao diện, kiến trúc tích hợp **React Flow (`@xyflow/react`)**, **Dagre (`@dagrejs/dagre`)**, **TanStack Query (`@tanstack/react-query`)**, **Mock Data & Service**, cơ chế lọc đa môn học độc lập (DSA vs OOP) và luồng đồng bộ trạng thái trong màn hình **Data Structures & Algorithms Roadmap**.

---

## 1. Vị Trí File & Kiến Trúc Mã Nguồn

- **Trang Roadmap chính:** [`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx) (`http://localhost:3000/roadmap`)
- **Dữ liệu mẫu 2 Khóa học chính:** [`web/mocks/roadmapData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js)
  - Khóa DSA (10 nodes): `CS101_DSA_Syllabus_HCMUS.pdf` (UUID: `00000005-0000-4000-8000-000000000001`)
  - Khóa OOP C++ (5 nodes): `CS102_OOP_Cpp_Syllabus_HCMUS.pdf` (UUID: `00000005-0000-4000-8000-000000000002`)
- **Roadmap Service:** [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js)
- **Admin Service (Đồng bộ tài liệu Supabase):** [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js)
- **Custom Hook (TanStack Query):** [`web/hooks/useRoadmap.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/hooks/useRoadmap.js)
- **Bố cục DAG tự động (Dagre):** [`web/utils/graphLayout.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/utils/graphLayout.js)
- **Custom Circular Node (React Flow):** [`web/components/roadmap/CustomRoadmapNode.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/roadmap/CustomRoadmapNode.jsx)
- **Interactive Roadmap Canvas (React Flow):** [`web/components/roadmap/RoadmapCanvas.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/roadmap/RoadmapCanvas.jsx)

---

## 2. Quy Tắc Lọc Đa Môn Học Độc Lập (Document Scoping)

Để tránh nhầm lẫn giữa các môn học khác nhau, hệ thống áp dụng nguyên tắc **phân tách 100% dữ liệu theo tài liệu đang chọn (`activeDocumentId`)**:

1. **Khi chọn `CS101_DSA_Syllabus_HCMUS.pdf` (`id = '...0001'`):**
   - Chỉ lấy và vẽ đúng **10 Nodes của môn DSA** (`!node.id.startsWith('oop-')`).
   - Tổng số node hiển thị trên thanh Header và cột Sidebar là **`/10`** (ví dụ: `8/10 Nodes Unlocked`), tuyệt đối không vẽ lẫn các node OOP.
2. **Khi chọn `CS102_OOP_Cpp_Syllabus_HCMUS.pdf` (`id = '...0002'`):**
   - Chỉ lấy và vẽ đúng **5 Nodes của môn OOP** (`node.id.startsWith('oop-')`).
   - Tổng số node trên Header và Sidebar là **`/5`** (ví dụ: `1/5 Nodes Unlocked`).
3. **Tuyệt đối không ghép chồng Mock Data:**
   - Khi Supabase đã trả về dữ liệu chuẩn, hệ thống chỉ dùng duy nhất dữ liệu từ Database, không nối thêm mảng mock ở local để tránh lỗi React trùng `key`.

---

## 3. Tinh Chỉnh Giao Diện Chuẩn Tối Giản (Clean Header & Canvas)

1. **Thanh Header:**
   - Giữ nguyên biểu tượng logo `OffByOne` và chữ `LEARNING ROADMAP`.
   - **Đã loại bỏ thẻ tag `OOP Tree`** cạnh chữ Learning Roadmap để tiết kiệm không gian.
   - Hiển thị tiến độ vòng tròn `%` và số lượng node mở khóa (`unlockedCount/totalCount`).
   - Nếu tài khoản là `admin` hoặc `tutor`, hiển thị thêm nút pill tím **`Admin Console`** để truy cập nhanh `/admin`.
   - Nút tải web thành app (PWA) đã được gỡ bỏ khỏi `/roadmap` (chỉ duy trì duy nhất trên Landing Page `/`).
2. **Thanh Thao Tác Dưới Đáy Canvas (Bottom Bar):**
   - **Đã loại bỏ nút Preview "AVL Tree"** (hoặc Preview "Classes & Encapsulation").
   - Chỉ giữ lại chú thích trạng thái (`Completed • Current • Locked`) và nút **`Reset`** tiến độ.

---

## 4. Luồng Xử Lý & Tải Dữ Liệu Qua TanStack Query

Màn hình duy trì 3 trạng thái hoạt động:

### Trạng thái 1: Chưa tải file PDF (`flowState = "empty"`)
- Thanh tiêu đề hiển thị `0%` và `Unlocked: 0 / 0 Nodes`.
- Khung chờ hiển thị thông báo trung tâm **`No Skill Tree Generated Yet`**.
- Cột bên phải mở tab **RAG Sources** cho phép kéo thả file PDF hoặc bấm `+ Add Sample`.

### Trạng thái 2: Đang xử lý PDF (`flowState = "loading"`)
- Hiển thị thanh tiến trình **Loading Bar (`0% → 100%`)** mô phỏng 4 bước phân tích giáo trình:
  1. Parsing PDF layout & course syllabus sections...
  2. Extracting learning topics & prerequisite dependencies...
  3. Indexing vector chunks into Active Knowledge Base (RAG)...
  4. Synthesizing prerequisite Skill Tree with AI Tutor...

### Trạng thái 3: Hiển thị Cây Kỹ Năng React Flow (`flowState = "ready"`)
- Sơ đồ DAG được bố cục tự động bằng Dagre (`rankdir: "LR"`).
- Hỗ trợ cuộn chuột để Zoom, kéo thả tự do bản đồ (Pan), và nút căn giữa (`Fit View`).
- Danh sách 10 Nodes DSA:
  1. `DSA Foundations`
  2. `Complexity Analysis`
  3. `Arrays & Strings`
  4. `Linked List`
  5. `Stack & Queue`
  6. `Trees`
  7. `Binary Search Tree`
  8. `AVL Tree`
  9. `Sorting Algorithms`
  10. `Graph Algorithms`

---

## 5. Tính Năng Node Detail Pop-up & Điều Hướng

Khi bấm vào một Node trên React Flow Canvas:
- Mở **Node Detail Pop-up** hiển thị tên chủ đề, huy hiệu trạng thái, độ phức tạp Big-O, mô tả ngắn, danh sách môn tiên quyết (`Prerequisites`) và tiến độ hoàn thành các task.
- Nút hành động chính: **`→ Enter Workspace`** (tự động điều hướng vào Task đang học hoặc Task đầu tiên chưa khóa của Node đó qua route `/workspace?node=...`).

---

## 6. Hướng Dẫn Gán `href` Điều Hướng (`ROADMAP_LINKS`)

| Thành phần / Nút bấm | Khóa trong `ROADMAP_LINKS` | Giá trị mặc định | Mô tả điều hướng |
| :--- | :--- | :---: | :--- |
| **Logo `OffByOne` (góc trái Header)** | `ROADMAP_LINKS.brand` | `"/"` | Quay về trang chủ Landing (`/`) |
| **Nút `Admin Console` (cho Admin/Tutor)** | Direct link | `"/admin"` | Chuyển tới Bảng điều khiển Quản trị |
| **User Profile Menu (góc phải Header)** | `ROADMAP_LINKS.profile` | `"/auth"` | Menu tài khoản và đăng xuất |
| **Nút `→ Enter Workspace` (trong Pop-up)** | `ROADMAP_LINKS.workspace` | `"/workspace"` | Chuyển vào không gian học tập của Node vừa chọn |
