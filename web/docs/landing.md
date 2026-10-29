# Tài Liệu Giao Diện Landing Screen (`landing.md`)

Tài liệu này trình bày chi tiết thiết kế trang **Landing Screen (AlgoPath)** từ bản thiết kế Figma, bao gồm bảng mã màu, bố cục thành phần và hướng dẫn gán đường dẫn (`href`) cho từng nút bấm / thẻ điều hướng.

---

## 1. Vị Trí File & Đường Dẫn Truy Cập

- **File mã nguồn Landing Screen:** [`web/app/landing/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/landing/page.tsx)
- **URL khi chạy server (`npm run dev`):** `http://localhost:3000/landing`

---

## 2. Bảng Mã Màu Đã Áp Dụng (Theo Selection Colors Trên Figma)

Giao diện sử dụng đúng hệ màu **Tokyo Night Dark** từ bảng màu thiết kế:

| Mã màu | Độ trong suốt | Vai trò hiển thị trên giao diện |
| :--- | :---: | :--- |
| `#15161E` | `100%` | Nền chính toàn trang (Background) và màu chữ trên các nút xanh chính |
| `#1A1B26` | `100%` | Nền của thanh Navbar, Pill Badge, nút `Log In`, và 3 thẻ tính năng (Feature Cards) |
| `#292E42` | `100%` | Viền (Border) của thanh Navbar, 3 thẻ tính năng và thanh ngăn cách dọc dưới nút CTA |
| `#414868` | `100%` | Viền nút `Log In`, viền thẻ khi rê chuột (hover) và dấu chấm tròn ở thanh chân trang |
| `#3B4261` | `100%` | Vạch ngăn cách dọc cạnh logo `AlgoPath` trên Navbar và dấu gạch ngang ở Footer |
| `#283457` | `100%` | Đường kẻ ngang hai bên dòng chữ chân trang (`AlgoPath — Build Better Algorithmic Thinkers`) |
| `#C0CAF5` | `100%` | Chữ tiêu đề nổi bật: Tên thương hiệu `AlgoPath`, chữ nút `Log In`, tiêu đề 3 thẻ tính năng |
| `#A9B1D6` | `100%` | Chữ văn bản chính: Slogan trên Navbar, liên kết điều hướng, đoạn mô tả Hero, chữ trong Pill Badge |
| `#565F89` | `100%` | Chữ mô tả phụ: Nội dung chi tiết bên trong 3 thẻ tính năng và phần chữ phụ ở Footer |
| `#7AA2F7` | `100%` | Màu xanh chủ đạo: Logo tròn, chữ `Data` & `Computational`, nền nút `Get Started`, nút `Explore Skill Tree →`, các icon chính |
| `#7AA2F7` | `40%` | Viền của nhãn `</> AI-Powered • DSA Learning Platform` và viền hộp chứa icon trong 3 thẻ tính năng |
| `#7AA2F7` | `16%` | Nền của hộp chứa icon trong 3 thẻ tính năng và hiệu ứng quầng sáng (Radial Glow) phía bên phải màn hình |
| `#7DCFFF` | `100%` | Màu xanh Cyan cho chữ `Master` và `Through` trong tiêu đề lớn |
| `#FF9E64` | `100%` | Màu cam cho chữ `Structures` và `Thinking` trong tiêu đề lớn |
| `#8DB0FF` | `100%` | Màu xanh sáng cho icon con mắt (`Code Sandbox & Theory Quiz`) và trạng thái hover của nút chính |
| `#C7A9FF` | `100%` | Màu tím nhạt cho icon người dùng (`Socratic AI Feedback`) |

---

## 3. Các Thành Phần Giao Diện Đã Xây Dựng

1. **Thanh điều hướng (Navbar):**
   - Cụm thương hiệu bên trái: Biểu tượng hình tròn xanh `#7AA2F7`, chữ **AlgoPath**, vạch ngăn cách dọc và câu khẩu hiệu *"Smarter DSA mastery, one node at a time"*.
   - Cụm liên kết giữa: `Features` và `How It Works`.
   - Cụm nút bên phải: Nút viền tối `Log In` và nút nền xanh `Get Started`.
2. **Khu vực Hero (Hero Section):**
   - **Cột trái:**
     - Nhãn Pill Badge bo tròn: `</> AI-Powered • DSA Learning Platform`.
     - Tiêu đề chính 2 dòng cố định (`whitespace-nowrap`) phối 3 sắc độ (`#7DCFFF`, `#7AA2F7`, `#FF9E64`):
       - Dòng 1: `Master Data Structures`
       - Dòng 2: `Through Computational Thinking` (chữ `Thinking` luôn nằm cùng hàng 2).
     - Đoạn văn giới thiệu về tự động chuyển đổi đề cương (Syllabus) thành Skill Tree và gợi ý Socratic AI.
     - Nút hành động chính (Primary CTA): `Explore Skill Tree →` kèm hiệu ứng đổ bóng phát sáng nhẹ.
     - Cụm 3 điểm nhấn nhỏ bên dưới nút: `Syllabus-Driven Roadmap`, `Zero-Hallucination RAG`, và `Mastery Tracking`.
   - **Cột phải (Product Preview — Trưng bày 3 tính năng cốt lõi chuẩn Tokyo Night):**
     - **Sơ đồ cây Skill Tree:** Các node tròn nối tâm vuông góc $90^\circ$ với tiếp tuyến (`Arrays & Big-O ✓`, `Linked Lists ✓`, `Trees & Recursion`, `Binary Search Tree` viền cam `#FF9E64`, `Hash Tables`, `Heaps & PQ`).
     - **Khung dưới bên trái (`bst_search.cpp` + `O(log N)`):** Mô phỏng Code Sandbox đánh dấu dòng code đang gặp lỗi logic (`if (r->val == k)`).
     - **Khung dưới bên phải (`Socratic Hint • RAG`):** Mô phỏng hộp thoại trợ giảng AI đặt câu hỏi gợi mở về kiểm tra `nullptr` trước khi truy cập `r->val`.
3. **Lưới 3 Thẻ Tính Năng (Feature Cards Grid):**
   - **Automated Skill Tree** (kèm icon nhánh cây kỹ năng).
   - **Code Sandbox & Theory Quiz** (kèm icon quan sát / trực quan).
   - **Socratic AI Feedback** (kèm icon trợ giảng cá nhân).
4. **Chân trang (Footer):**
   - Thanh kẻ ngang đối xứng hai bên kèm chấm tròn ở đầu mút và dòng chữ `AlgoPath — Build Better Algorithmic Thinkers`.

---

## 4. Hướng Dẫn Gán `href` Điều Hướng Sang Trang Khác (`LANDING_LINKS`)

Tất cả các nút bấm và thẻ có thể điều hướng đều được quản lý tập trung tại hằng số [`LANDING_LINKS`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/landing/page.tsx#L15-L27) ở đầu file [`web/app/landing/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/landing/page.tsx):

| Tên nút / Thành phần | Vị trí trên màn hình | Khóa trong `LANDING_LINKS` | Giá trị `href` mặc định | Mô tả trang đích |
| :--- | :--- | :--- | :--- | :--- |
| **Logo + Chữ `AlgoPath`** | Góc trái trên Navbar | `LANDING_LINKS.brand` | `"/landing"` | Trang giới thiệu Landing |
| **Liên kết `Features`** | Giữa Navbar | `LANDING_LINKS.features` | `"#features"` | Cuộn xuống khu vực thẻ tính năng |
| **Liên kết `How It Works`** | Giữa Navbar | `LANDING_LINKS.howItWorks` | `"#how-it-works"` | Cuộn tới phần hướng dẫn |
| **Nút `Log In`** | Góc phải trên Navbar | `LANDING_LINKS.login` | `"/auth"` | Trang đăng nhập (mở tab Log In) |
| **Nút `Get Started`** | Góc phải trên Navbar | `LANDING_LINKS.getStarted` | `"/auth?tab=signup"` | Trang đăng ký (mở sẵn tab Sign Up) |
| **Nút lớn `Explore Skill Tree →`** | Giữa màn hình (Hero CTA) | `LANDING_LINKS.exploreSkillTree` | `"/roadmap"` | Trang cây kỹ năng chính (`/roadmap`) |
| **Thẻ `Automated Skill Tree`** | Hàng thẻ dưới (Cột 1) | `LANDING_LINKS.cards.skillTree` | `"/roadmap"` | Trang tạo / xem cây kỹ năng từ PDF Syllabus |
| **Thẻ `Code Sandbox & Theory Quiz`** | Hàng thẻ dưới (Cột 2) | `LANDING_LINKS.cards.sandbox` | `"/workspace"` | Trang Workspace làm bài tập code & trắc nghiệm |
| **Thẻ `Socratic AI Feedback`** | Hàng thẻ dưới (Cột 3) | `LANDING_LINKS.cards.socraticAi` | `"/workspace"` | Trang tương tác với trợ giảng Socratic AI |
