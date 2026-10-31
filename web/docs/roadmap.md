# Tài Liệu Màn Hình DSA Roadmap Tree & Pop-up Screen (`roadmap.md`)

Tài liệu này mô tả chi tiết cấu trúc giao diện, kiến trúc tích hợp **React Flow (`@xyflow/react`)**, **Dagre (`@dagrejs/dagre`)**, **TanStack Query (`@tanstack/react-query`)**, **Mock Data & Service**, hộp thoại **Pop-up Screen** theo từng Node và luồng mô phỏng Upload/Processing trong màn hình **Data Structures & Algorithms Roadmap**.

---

## 1. Vị Trí File & Kiến Trúc Mã Nguồn

- **Trang Roadmap chính:** [`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx) (`http://localhost:3000/roadmap` hoặc `http://localhost:3000/skill-tree`)
- **Mock Data (10 chủ đề DSA & Tasks):** [`web/mocks/roadmapData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js)
- **Roadmap API / Mock Service (Fetch API ready):** [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js)
- **Custom Hook (TanStack Query):** [`web/hooks/useRoadmap.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/hooks/useRoadmap.js)
- **Thuật toán bố cục tự động (Dagre):** [`web/utils/graphLayout.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/utils/graphLayout.js)
- **Custom Circular Node (React Flow):** [`web/components/roadmap/CustomRoadmapNode.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/roadmap/CustomRoadmapNode.jsx)
- **Interactive Roadmap Canvas (React Flow):** [`web/components/roadmap/RoadmapCanvas.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/roadmap/RoadmapCanvas.jsx)

---

## 2. Luồng Chạy Mô Phỏng & Tải Dữ Liệu Qua TanStack Query

Màn hình duy trì trọn vẹn 3 trạng thái (`empty` → `loading` → `ready`) kết hợp với TanStack Query:

### Trạng thái 1: Chưa tải file PDF (`flowState = "empty"`)
- **Khung trái (Roadmap Tree):**
  - Thanh tiêu đề hiển thị tiến độ `0%` và `Unlocked: 0 / 0 Nodes`.
  - Hiển thị khung chờ 6 vòng tròn nét đứt (`Topic 1` → `Topic 6`) cùng hộp thông báo trung tâm **`No Skill Tree Generated Yet`**.
- **Khung phải (Upload & Knowledge Base):**
  - Hộp tải file PDF với nút **`Choose File`**.
  - Khung **Active Knowledge Base (RAG)** hiển thị `0 Documents Indexed`.

### Trạng thái 2: Đang xử lý PDF & Gọi Service (`flowState = "loading"` / `isQueryLoading`)
- **Cách kích hoạt:** Bấm vào nút **`Choose File`** ở cột bên phải.
- **Khung trái (Roadmap Tree):**
  - Hộp trung tâm hiển thị thanh tiến trình **Loading Bar (`0% → 100%`)** mô phỏng 3 bước xử lý của Backend RAG Pipeline.
  - Ngay khi hoàn tất bước Processing, hook [`useRoadmap`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/hooks/useRoadmap.js) kích hoạt truy vấn với `queryKey: ["roadmap", "skill-tree", fileName]` qua [`roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js).

### Trạng thái 3: Hiển thị Skill Tree Tương Tác Bằng React Flow & Dagre (`isGeneratedReady`)
- **Khung trái (React Flow + Dagre Skill Tree):**
  - Khi TanStack Query trả về `isSuccess`, [`RoadmapCanvas.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/roadmap/RoadmapCanvas.jsx) hiển thị 10 chủ đề DSA:
    1. `DSA Foundations` (`completed`)
    2. `Complexity Analysis` (`completed`)
    3. `Arrays & Strings` (`completed`)
    4. `Linked List` (`completed`)
    5. `Stack & Queue` (`current`)
    6. `Trees` (`current`)
    7. `Binary Search Tree` (`current`)
    8. `AVL Tree` (`locked`)
    9. `Sorting Algorithms` (`locked`)
    10. `Graph Algorithms` (`locked`)
  - **Tự động sắp xếp bằng Dagre (`graphLayout.js`):** Không hardcode tọa độ; các đỉnh và cạnh tiên quyết (`prerequisites`) được Dagre tính toán phân tầng tự động.
  - **Hỗ trợ Zoom, Pan & Fit View:** Có thể cuộn chuột để thu phóng, kéo giữ để di chuyển, hoặc dùng cụm nút điều khiển góc dưới phải (`+`, `-`, `Fit View`).
- **Khung phải (Active Knowledge Base):**
  - Cập nhật danh sách tài liệu từ `roadmapData.knowledgeBase.documents` (`CS101_DSA_Syllabus_HCMUS.pdf`, `2.4 MB`, `48 chunks`).

---

## 3. Tính Năng Node Detail Pop-up & Điều Hướng `/workspace/:nodeId/:taskId`

Khi click vào một Node trên React Flow Canvas:
- Hệ thống truy xuất dữ liệu Node theo ID qua hàm [`getRoadmapNodeById`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js) và mở **Node Detail Pop-up**.
- Pop-up hiển thị tinh gọn bằng tiếng Anh:
  - Tên chủ đề (`label`), huy hiệu trạng thái (`completed` / `current` / `locked`), độ phức tạp (`complexity`) và mô tả chi tiết (`description`).
  - Danh sách môn tiên quyết (`Prerequisites`), thanh tiến độ học tập (`Learning Progress: completedTasks / totalTasks Tasks`) và **danh sách 3 Task hiển thị dạng thông tin tĩnh** (không gắn link điều hướng trực tiếp trên từng dòng Task).
  - Chỉ cung cấp một nút hành động điều hướng chính duy nhất ở dưới cùng: **`→ Enter Workspace`** (hoặc khóa nếu Node ở trạng thái `locked`).
- Khi bấm **`→ Enter Workspace`**, hàm [`getInitialTaskForNode`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js) tự động tìm Task đang ở trạng thái `current` (hoặc Task đầu tiên có thể truy cập) và điều hướng sang URL chuẩn:
  `/workspace/:nodeId/:taskId` (ví dụ: `/workspace/avl-tree/avl-tree-task-2`).

---

## 4. Hướng Dẫn Gán `href` Điều Hướng (`ROADMAP_LINKS`)

| Thành phần / Nút bấm | Khóa trong `ROADMAP_LINKS` | Giá trị mặc định | Mô tả điều hướng |
| :--- | :--- | :---: | :--- |
| **Logo `AlgoPath` (góc trái Header)** | `ROADMAP_LINKS.brand` | `"/"` | Quay về trang chủ Landing (`/`) |
| **Avatar `Duc Vinh Hoang` (góc phải Header)** | `ROADMAP_LINKS.profile` | `"/auth"` | Chuyển tới trang tài khoản / đăng nhập |
| **Nút `→ Enter Workspace` (trong Pop-up Screen)** | `ROADMAP_LINKS.workspace` | `"/workspace"` | Chuyển vào không gian học tập của Node vừa chọn |
| **Đường dẫn Code Sandbox** | `ROADMAP_LINKS.codeSandbox` | `"/sandbox"` | Đường dẫn dự phòng tới trang Code Editor |
| **Đường dẫn Theory Quiz** | `ROADMAP_LINKS.theoryQuiz` | `"/quiz"` | Đường dẫn dự phòng tới trang Quiz trắc nghiệm |
