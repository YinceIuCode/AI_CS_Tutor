# Tài Liệu Công Nghệ & Thư Viện Giao Diện (`ui-tech-stack.md`)

Tài liệu này tổng hợp toàn bộ **ngăn xếp công nghệ (Tech Stack)**, **thư viện chuyên dụng** và **kỹ thuật dựng giao diện (UI Engineering)** được sử dụng trong phân hệ Frontend (`web/`) của dự án **OffByOne — AI-Powered DSA Learning Platform**.

---

## 1. Bảng Tổng Hợp Công Nghệ Cốt Lõi (Core Frontend Stack)

| Nhóm công nghệ | Thư viện / Công cụ | Phiên bản | Vai trò trong dự án OffByOne |
| :--- | :--- | :---: | :--- |
| **Framework & Routing** | **Next.js (App Router)** | `16.4.0` | Định tuyến trang (`/`, `/auth`, `/roadmap`, `/workspace/:nodeId/:taskId`), tối ưu tải trang và tách biệt Client/Server Components. |
| **UI Runtime** | **React & React DOM** | `19.3.0` | Quản lý trạng thái giao diện tương tác, Custom Hooks và Context API. |
| **Ngôn ngữ** | **TypeScript + JSDoc** | `^5.x` | Kiểm tra kiểu dữ liệu tĩnh (`tsc --noEmit`) kết hợp JSDoc cho các tầng dịch vụ và mock data. |
| **Styling & Design System** | **Tailwind CSS v4** | `^4.x` | Xây dựng toàn bộ hệ màu **Tokyo Night**, bố cục lưới (`CSS Grid` / `Flexbox`) và giao diện chuẩn kích thước màn hình (`100svh`). |
| **UI Component Primitives** | **shadcn/ui + Base UI (`@base-ui/react`)** | `^4.22.0` / `^1.9.0` | Cung cấp các thành phần UI nền tảng (`Button`, `Input`, `Field`, `Card`) kết hợp `class-variance-authority` (`cva`). |
| **Trình soạn thảo Code (IDE)** | **Monaco Editor (`@monaco-editor/react`)** | `^4.7.0` | Trình soạn thảo code trực tiếp trên trình duyệt (nhân của **Visual Studio Code**), hỗ trợ gõ code C++, tô màu cú pháp, đánh số dòng và theo dõi vị trí con trỏ. |
| **Sơ đồ cây kỹ năng (Skill Tree)** | **React Flow (`@xyflow/react`)** | `^12.12.0` | Vẽ sơ đồ cây kỹ năng tương tác dạng **Horizontal Tree**, hỗ trợ kéo bản đồ (Left/Right Click Pan), phóng to/thu nhỏ (Zoom), lưới điểm (`BackgroundVariant.Dots`) và đường cong Bezier động. |
| **Thuật toán bố cục đồ thị** | **Dagre (`@dagrejs/dagre`)** | `^3.1.3` | Tự động tính toán tọa độ `(x, y)` cho các Node và cạnh nối phụ thuộc (Prerequisites) theo hướng từ Trái sang Phải (`rankdir: "LR"`). |
| **Quản lý Server State & API** | **TanStack Query (`@tanstack/react-query`)** | `^5.105.0` | Quản lý vòng đời truy vấn dữ liệu Roadmap (`isLoading`, `isError`, `isSuccess`, caching và `refetch`) kết hợp `Fetch API` chuẩn của trình duyệt. |
| **Hệ thống Biểu tượng (Icons)** | **Lucide React (`lucide-react`)** | `^1.58.0` | Cung cấp bộ icon vector đồng nhất cho toàn bộ giao diện (Code, Thuật toán, RAG, Socratic AI, Lock/Unlock, v.v.). |
| **Đồ họa Minh họa Thuật toán** | **Custom Geometric SVG** | Native SVG | Vẽ trực tiếp cây nhị phân (`Binary Search Tree` & `AVL Tree Right Rotation`) với công thức lượng giác nối tâm vuông góc $90^\circ$ với tiếp tuyến đường tròn. |

---

## 2. Chi Tiết Công Nghệ Sử Dụng Ở Từng Màn Hình

### 2.1. Màn Hình Trình Soạn Thảo Code & Học Tập Đa Chế Độ (`Workspace`)
- **File chính:** [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx)
- **Định tuyến động:** [`web/app/workspace/[nodeId]/[taskId]/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/%5BnodeId%5D/%5BtaskId%5D/page.tsx)
- **Thư viện nhập Code (`@monaco-editor/react`):**
  - Sử dụng **`@monaco-editor/react`** — thư viện bọc chính thức của **Monaco Editor** (trình soạn thảo đứng sau **VS Code**).
  - **Tùy biến bảng màu `tokyo-night` riêng biệt** thông qua hook `beforeMount` (`monaco.editor.defineTheme("tokyo-night", ...)`), định nghĩa màu sắc chi tiết cho từng token C++:
    - Từ khóa (`keyword`, `#include`): Tím `#BB9AF7`
    - Kiểu dữ liệu (`type`, `Node*`, `int`): Xanh dương `#7AA2F7` / Xanh ngọc `#73DACA`
    - Chuỗi ký tự (`string`): Xanh lá `#9ECE6A`
    - Hằng số (`number`): Cam `#FF9E64`
    - Chú thích (`comment`): Xám xanh `#565F89` (in nghiêng)
  - **Theo dõi vị trí con trỏ thời gian thực (`onDidChangeCursorPosition`):** Bắt sự kiện di chuyển con trỏ trong Editor thông qua hook `onMount` để cập nhật thanh trạng thái kiểu VS Code ở đáy khung (`Ln 18, Col 1 • C++ • UTF-8 • Draft Saved`).
  - **Tự động lưu bản nháp (`Auto-save Code Draft`):** Mỗi khi sinh viên gõ code (`onChange`), nội dung code được lưu tức thời vào bộ nhớ phiên học tập của từng User thông qua [`useUserProgress.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/hooks/useUserProgress.js).
- **Minh họa cấu trúc dữ liệu (`SVG Algorithm Visualization`):**
  - Khung **Visualization** bên phải sử dụng đồ họa vector `<svg>` kết hợp hàm hình học `getCircleEdge(x1, y1, r1, x2, y2, r2)` để vẽ sơ đồ biến đổi cây **Before (Unbalanced)** $\rightarrow$ **After (`rightRotate(y)`)** sắc nét ở mọi độ phân giải.

---

### 2.2. Màn Hình Sơ Đồ Lộ Trình Học Tập (`Interactive DSA Roadmap`)
- **File chính:** [`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx)
- **Các module đồ thị:**
  - [`web/components/roadmap/RoadmapCanvas.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/roadmap/RoadmapCanvas.jsx)
  - [`web/components/roadmap/CustomRoadmapNode.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/roadmap/CustomRoadmapNode.jsx)
  - [`web/utils/graphLayout.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/utils/graphLayout.js)
- **Công nghệ hiển thị và tương tác đồ thị:**
  1. **`@xyflow/react` (React Flow v12):**
     - Dựng mặt phẳng bản đồ tương tác hỗ trợ kéo bản đồ bằng cả chuột trái và chuột phải (`panOnDrag={[0, 1, 2]}`), cuộn chuột để phóng to/thu nhỏ (`zoomOnScroll`), và nút căn giữa tự động (`fitView`).
     - Sử dụng `CustomRoadmapNode` để thiết kế mỗi chủ đề DSA thành một **Thẻ Kỹ Năng (Tokyo Night Skill Card)** hiển thị huy hiệu trạng thái (`MASTERED`, `ACTIVE`, `LOCKED`), độ phức tạp Big-O và thanh tiến độ 3 phân đoạn (`Theory` • `Quiz` • `Code`).
     - Gắn cổng kết nối (`<Handle type="target" position={Position.Left} />` và `<Handle type="source" position={Position.Right} />`) kết hợp đường cong Bezier (`type: "default"`) và hiệu ứng dòng chảy (`animated: true`) cho các nhánh đang học.
  2. **`@dagrejs/dagre` (Dagre Directed Graph Layout):**
     - Tự động tính toán vị trí hàng/cột theo đồ thị có hướng không chu trình (DAG) từ danh sách `prerequisites` của các môn học theo chiều ngang (`rankdir: "LR"`).
  3. **`@tanstack/react-query`:**
     - Quản lý trạng thái bất đồng bộ khi sinh cây kỹ năng từ file PDF Syllabus thông qua hook [`useRoadmap.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/hooks/useRoadmap.js) và dịch vụ [`roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js).

---

### 2.3. Màn Hình Trang Chủ (`Landing Screen`) & Xác Thực (`Authentication`)
- **File chính:**
  - Trang chủ: [`web/app/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/page.tsx)
  - Đăng nhập / Đăng ký: [`web/components/login-form.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx)
  - Menu hồ sơ Header: [`web/components/user-profile-menu.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/user-profile-menu.tsx)
- **Kỹ thuật giao diện & Quản lý trạng thái:**
  - **Viewport-Locked Responsive Layout (`lg:h-svh lg:overflow-hidden`):** Thiết kế khung nhìn vừa khít 100% chiều cao màn hình máy tính, loại bỏ hoàn toàn thanh cuộn dọc thừa ở cả trang Landing và trang Auth.
  - **React Context + Web Storage + BroadcastChannel:**
    - Quản lý phiên đăng nhập qua [`AuthContext.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/contexts/AuthContext.jsx) và [`authService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js) (mật khẩu được băm một chiều bằng thuật toán DJB2, không lưu plaintext).
    - Lưu trữ tiến độ học tập riêng biệt theo từng User qua [`progressService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js) và đồng bộ thời gian thực giữa nhiều tab trình duyệt bằng `BroadcastChannel("algopath_progress_sync")`.

---

## 3. Hệ Thống Thiết Kế & Bảng Màu (`Tokyo Night Theme`)

Toàn bộ các màn hình tuân thủ nghiêm ngặt bảng màu **Tokyo Night** và hệ thống Typography kép được cấu hình trong [`web/app/layout.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/layout.tsx):

- **Typography:**
  - **Sans-serif (`Geist` / `Inter`):** Dùng cho tiêu đề, nội dung lý thuyết, câu hỏi Quiz và điều hướng.
  - **Monospace (`Geist Mono` / `JetBrains Mono`):** Dùng cho trình soạn thảo Monaco Editor, độ phức tạp thuật toán (`O(log N)`, `O(1)`), tên file PDF và phím tắt.
- **Bảng màu chủ đạo:**
  - Nền chính (`Background Canvas`): `#15161E`
  - Nền thẻ / Panel (`Surface Card`): `#1A1B26` & `#16161E`
  - Viền khung (`Border`): `#292E42` & `#414868`
  - Điểm nhấn chính (`Primary Accent`): `#7AA2F7` (Tokyo Blue) & `#7DCFFF` (Cyan)
  - Trạng thái Hoàn thành (`Completed / Mastered`): `#9ECE6A` (Green)
  - Cảnh báo / Tiêu điểm (`Warning / Highlight`): `#FF9E64` (Orange) & `#DB4B4B` (Red)
  - Socratic AI (`Tutor Accent`): `#C7A9FF` / `#BB9AF7` (Purple)
