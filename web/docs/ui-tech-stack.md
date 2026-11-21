# Tài Liệu Công Nghệ & Thư Viện Giao Diện (`ui-tech-stack.md`)

Tài liệu này tổng hợp toàn bộ **ngăn xếp công nghệ (Tech Stack)**, **thư viện chuyên dụng**, **kiến trúc kết nối dữ liệu** và **kỹ thuật dựng giao diện (UI Engineering)** được sử dụng trong phân hệ Frontend (`web/`) của dự án **OffByOne — AI-Powered DSA Learning Platform**.

---

## 1. Bảng Tổng Hợp Công Nghệ Cốt Lõi (Core Frontend Stack)

| Nhóm công nghệ | Thư viện / Công cụ | Phiên bản | Vai trò trong dự án OffByOne |
| :--- | :--- | :---: | :--- |
| **Framework & Routing** | **Next.js (App Router)** | `16.4.6` | Định tuyến trang (`/`, `/auth`, `/roadmap`, `/workspace`, `/admin`), tối ưu hóa render và tách biệt Client/Server Components. |
| **UI Runtime** | **React & React DOM** | `19.3.0` | Quản lý trạng thái giao diện tương tác, Custom Hooks và React Context API. |
| **Ngôn ngữ** | **TypeScript + JSDoc** | `^5.x` | Kiểm tra kiểu dữ liệu tĩnh nghiêm ngặt (`npm run typecheck` / `tsc --noEmit`). |
| **Styling & Design System** | **Tailwind CSS v4** | `^4.x` | Xây dựng toàn bộ hệ màu **Tokyo Night**, bố cục lưới CSS Grid (`xl:grid-cols-12`) và kích thước màn hình chuẩn (`100svh`). |
| **UI Component Primitives** | **shadcn/ui + Base UI (`@base-ui/react`)** | `^4.22.0` / `^1.9.0` | Cung cấp các thành phần UI nền tảng (`Button`, `Input`, `Field`, `Card`) kết hợp `class-variance-authority` (`cva`). |
| **Trình soạn thảo Code (IDE)** | **Monaco Editor (`@monaco-editor/react`)** | `^4.7.0` | Trình soạn thảo code trên Workspace (nhân của **VS Code**), hỗ trợ gõ code C++, tô màu cú pháp theo theme Tokyo Night, đánh số dòng và theo dõi con trỏ. |
| **Code Editor Nhẹ Đánh Số Dòng** | **TokyoNightCodeEditor (Custom)** | Built-in | Trình soạn thảo C++ nhẹ có gutter đánh số dòng và hỗ trợ thụt lề phím Tab dùng trong Studio của trang `/admin`. |
| **Sơ đồ cây kỹ năng (Skill Tree)** | **React Flow (`@xyflow/react`)** | `^12.12.0` | Vẽ sơ đồ cây kỹ năng tương tác dạng **Horizontal DAG**, hỗ trợ Pan, Zoom, lưới điểm (`Dots`) và đường cong Bezier. |
| **Thuật toán bố cục đồ thị** | **Dagre (`@dagrejs/dagre`)** | `^3.1.3` | Tự động tính toán tọa độ `(x, y)` cho các Node và cạnh nối phụ thuộc (Prerequisites) theo chiều ngang (`rankdir: "LR"`). |
| **Quản lý Server State & API** | **TanStack Query (`@tanstack/react-query`)** | `^5.105.0` | Quản lý vòng đời truy vấn dữ liệu Roadmap (`isLoading`, `isError`, `isSuccess`, caching và `refetch`). |
| **Hệ thống Biểu tượng (Icons)** | **Lucide React (`lucide-react`)** | `^1.58.0` | Cung cấp bộ icon vector đồng nhất (Code, Layers, ShieldCheck, Socratic Sparkles, Terminal, v.v.). |
| **Bộ Script Khởi Chạy Nhanh** | **Cross-platform Runner Scripts** | Đa nền tảng | Bộ công cụ trong thư mục `scripts/` (`run.bat`, `run.ps1`, `run`, `run.py`) và lệnh `npm run web`, `npm run api`. |

---

## 2. Chi Tiết Kiến Trúc Từng Phân Hệ Giao Diện

### 2.1. Phân Hệ Quản Trị Hệ Thống (`/admin`)
- **File chính:** [`web/app/admin/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/admin/page.tsx)
- **Tầng dịch vụ:** [`web/services/adminService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/adminService.js)
- **Kiến trúc tính năng:**
  1. **Strict Role-Based Guard (403 Access Denied):** Chỉ cho phép `role === 'admin'` hoặc `'tutor'`. Admin đăng nhập được chuyển hướng độc quyền vào `/admin`.
  2. **Database Explorer:** Đọc/ghi 6 bảng dữ liệu Supabase, hỗ trợ Drawer biểu mẫu Visual, Trình biên tập JSON có kiểm tra cú pháp, Công cụ kiểm toán Supabase Raw Inspector và Snapshot Dumper.
  3. **Full-Featured Course & Lesson Studio:** Bố cục 2 cột toàn chiều rộng (`xl:grid-cols-12`), thanh điều khiển đầu trang (Dropdown tài liệu, Dropdown node, nút New Node, huy hiệu Unsaved Changes, nút Save to Database), bộ biên tập Node Metadata & DAG Prerequisites tích hợp thuật toán phát hiện chu trình DFS (`detectDagCycle`), cùng 4 tab bài học chuyên sâu (Theory, Quiz, Coding, Socratic AI Guardrails).
  4. **Demo Scenario Switcher:** Áp dụng nhanh các kịch bản Demo (Preset 1: 0%, Preset 2: 67%, Preset 3: 100%) trực tiếp lên tài khoản học viên `student@offbyone.demo`.

### 2.2. Phân Hệ Không Gian Học Tập (`/workspace`)
- **File chính:** [`web/app/workspace/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/workspace/page.tsx)
- **Tầng dịch vụ:** [`web/services/executionService.ts`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts), [`web/services/progressService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js)
- **Kiến trúc tính năng:**
  1. Tải task động từ Backend FastAPI `GET /api/tasks/{task_id}` kết hợp fallback mock.
  2. Monaco Editor với theme `tokyo-night`, hỗ trợ phím Tab thụt lề và tự động lưu bản nháp (`Auto-save Draft`).
  3. Hai chế độ thực thi code: `Run Sample Tests` (kiểm tra nhanh) và `Submit for Grading` (chấm điểm toàn diện qua Docker Judge Backend).
  4. Trợ giảng Socratic AI (`SocraticTutorPanel.tsx`) với cơ chế chỉ điểm vị trí dòng rủi ro (`Point to Line X`) và thang gợi ý 3 tầng không làm lộ đáp án (`Strict Zero-Spoiler`).

### 2.3. Phân Hệ Sơ Đồ Lộ Trình Kỹ Năng (`/roadmap`)
- **File chính:** [`web/app/roadmap/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/roadmap/page.tsx)
- **Tầng dịch vụ:** [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js)
- **Kiến trúc tính năng:**
  1. Chuẩn hóa 2 khóa học độc lập: `CS101_DSA_Syllabus_HCMUS.pdf` (10 nodes DSA) và `CS102_OOP_Cpp_Syllabus_HCMUS.pdf` (5 nodes OOP), tự động lọc theo `activeDocumentId` và không ghép chồng mock data.
  2. Bố cục DAG tự động bằng Dagre và vẽ bằng React Flow với các custom node hình tròn.
  3. Giao diện Header tinh gọn, loại bỏ các tag và nút preview thừa, tích hợp nút truy cập nhanh Admin Console cho quản trị viên.

### 2.4. Phân Hệ Trang Chủ (`/`) & Xác Thực (`/auth`)
- **File chính:** [`web/app/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/page.tsx), [`web/components/login-form.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx)
- **Tầng dịch vụ:** [`web/services/authService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js)
- **Kiến trúc tính năng:**
  1. Landing Page là trang duy nhất tích hợp nút cài đặt App PWA (`PwaInstallButton`).
  2. Giao diện đăng nhập/đăng ký căn giữa toàn màn hình (`lg:h-svh lg:overflow-hidden`).
  3. Cơ chế xác thực đa tầng: Gọi FastAPI `/api/auth/login` $\rightarrow$ Fallback Supabase REST $\rightarrow$ Fallback Mock Users.
  4. Bộ giới hạn tần suất đăng nhập (Rate Limiter) chống Brute-Force trên cả Client lẫn Server (HTTP 429).

---

## 3. Hệ Thống Thiết Kế & Bảng Màu (`Tokyo Night Theme`)

- **Typography:**
  - **Sans-serif (`Geist` / `Inter`):** Sử dụng cho văn bản chung, tiêu đề bài học, câu hỏi Quiz và điều hướng.
  - **Monospace (`Geist Mono` / `JetBrains Mono`):** Sử dụng cho Monaco Editor, TokyoNightCodeEditor, mã nguồn C++, độ phức tạp thuật toán và phím tắt.
- **Bảng màu chủ đạo:**
  - Nền chính (`Background Canvas`): `#15161E` & `#16161E`
  - Nền thẻ / Panel (`Surface Card`): `#1A1B26`
  - Viền khung (`Border`): `#24283B` & `#292E42`
  - Điểm nhấn chính (`Primary Accent`): `#7AA2F7` (Tokyo Blue) & `#7DCFFF` (Cyan)
  - Trạng thái Hoàn thành (`Completed / Mastered`): `#9ECE6A` (Emerald Green)
  - Cảnh báo / Tiêu điểm (`Warning / Highlight`): `#FF9E64` (Orange) & `#F7768E` / `#DB4B4B` (Red)
  - Quản trị / Socratic AI (`Admin & Tutor Accent`): `#BB9AF7` (Neon Purple) & `#D946EF` (Pink Accent)
