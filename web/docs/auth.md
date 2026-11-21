# Tài Liệu Giao Diện Đăng Nhập & Đăng Ký (`auth.md`)

Tài liệu này mô tả chi tiết cấu trúc giao diện, sơ đồ cây nhị phân minh họa, luồng xác thực an toàn và phân quyền điều hướng theo vai trò (Strict Role-Based Routing) trong màn hình **Login & Sign Up (`OffByOne Auth`)**.

---

## 1. Vị Trí File & Đường Dẫn Truy Cập

- **File route chính:** [`web/app/auth/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/auth/page.tsx) → URL: `http://localhost:3000/auth`
- **Hỗ trợ mở trực tiếp tab Đăng Ký:** `http://localhost:3000/auth?tab=signup`
- **File route tương thích đường dẫn cũ:** [`web/app/login/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/login/page.tsx) → URL: `http://localhost:3000/login`
- **Component giao diện chính:** [`web/components/login-form.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx)
- **Tài khoản Demo Chuẩn:** [`web/mocks/mockUsers.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/mockUsers.js)
  - Sinh viên: `student@offbyone.demo` / `Demo1234` (Role: `student`)
  - Giảng viên: `tutor@offbyone.demo` / `Tutor1234` (Role: `tutor`)
  - Quản trị viên: `admin@offbyone.demo` / `Admin1234` (Role: `admin`)
- **Auth Service:** [`web/services/authService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js) (`login`, `register`, `loginAsGuest`, `refreshAccessToken`, `logout`, `getCurrentUser`)
- **Auth Context & Hook:** [`web/contexts/AuthContext.jsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/contexts/AuthContext.jsx) và [`web/hooks/useAuth.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/hooks/useAuth.js)
- **Header User Profile & Logout Menu:** [`web/components/user-profile-menu.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/user-profile-menu.tsx) (Hỗ trợ huy hiệu riêng biệt và Neon Cybernetic Avatar cho Admin)

---

## 2. Cấu Trúc Giao Diện & Tính Năng Bảo Mật

1. **Bố cục toàn màn hình căn giữa (`lg:h-svh lg:overflow-hidden`):**
   - Loại bỏ thanh Header bên ngoài để giao diện tập trung hoàn toàn vào khung thẻ đôi 2 cột (`max-w-[1100px]`) nằm chính giữa màn hình.
   - Chiều cao các trường nhập liệu (`h-10`) và khoảng cách được tối ưu linh hoạt để khi chuyển qua lại giữa **Log In** và **Sign Up** không xuất hiện thanh cuộn dọc.
2. **Khung thẻ đôi 2 cột (`max-w-[1100px]`):**
   - **Cột trái (Thương hiệu, Thông điệp & Sơ đồ cây BST):**
     - Thanh thương hiệu tích hợp ở góc trên: Logo tròn `#7AA2F7` + **`OffByOne`** (dẫn về trang chủ `/`) kèm nhãn `DSA Learning Platform`.
     - Tiêu đề: **`Learn DSA by thinking, not copying.`** (`thinking,` màu `#7DCFFF`, `not copying.` màu `#7AA2F7`).
     - Mô tả: *"Build algorithmic confidence with guided practice and Socratic AI hints."*
     - Sơ đồ cây nhị phân (`8` → `4`, `12` → `2`, `6`, `10`, `14`) với các đoạn thẳng nối tâm vuông góc $90^\circ$ với tiếp tuyến đường tròn.
     - Dòng 3 tính năng dưới đáy: `Socratic AI • Skill Tree • Code Sandbox`.
   - **Cột phải (Biểu mẫu chuyển đổi `Log In` | `Sign Up`):**
     - Nút **`← Back to Home`** tích hợp ngay phía trên tiêu đề `Welcome to OffByOne` để quay về trang chủ `/` nhanh chóng.
     - Thanh chuyển tab **`Log In`** và **`Sign Up`**.
     - Các trường nhập liệu: `Full Name` (khi ở tab Sign Up), `Email`, `Password` (kèm nút ẩn/hiện mật khẩu và liên kết `Forgot password?` nằm cùng hàng nhãn `Password`).
     - Nút hành động chính: **`Log In`** / **`Sign Up`**.
     - Nút OAuth: **`Continue with Google`**.
     - Nút khách: **`Continue as Guest`** (trải nghiệm nhanh, cấp quyền `student` với tài khoản `guest`).
3. **Cơ chế Chống Tấn Công Brute-Force (Rate Limiting):**
   - Phía Client: Khóa đăng nhập tạm thời sau 5 lần nhập sai liên tiếp trong 30 giây thông qua `sessionStorage` (`algopath_auth_rate_limit`).
   - Phía Server: Xử lý phản hồi mã lỗi `429 Too Many Requests` từ FastAPI, hiển thị thời gian đếm ngược (`retryAfter`).

---

## 3. Quy Tắc Phân Quyền & Điều Hướng (Strict Role-Based Routing)

Sau khi đăng nhập thành công, hệ thống phân luồng điều hướng nghiêm ngặt dựa theo vai trò (`user.role`):

| Vai trò người dùng (`role`) | Trang đích sau khi Đăng nhập | Quyền hạn & Giới hạn truy cập |
| :--- | :--- | :--- |
| **`admin`** | **`/admin`** | **Chỉ truy cập duy nhất `/admin`**. Nếu cố truy cập `/roadmap` hoặc `/workspace`, tự động redirect ngược về `/admin`. |
| **`tutor`** | **`/roadmap`** | Được phép truy cập `/roadmap`, `/workspace` và có nút tắt mở `/admin` trên thanh điều hướng. |
| **`student`** / **`guest`** | **`/roadmap`** | Học tập trên `/roadmap` và `/workspace`. Không có quyền truy cập `/admin` (chặn bằng màn hình 403). |

---

## 4. Hướng Dẫn Gán `href` Điều Hướng (`AUTH_LINKS`)

Tất cả các đường dẫn điều hướng được quản lý tại hằng số [`AUTH_LINKS`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx#L22-L28) trong file [`web/components/login-form.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx):

| Thành phần / Nút bấm | Khóa trong `AUTH_LINKS` | Giá trị mặc định | Mô tả điều hướng |
| :--- | :--- | :---: | :--- |
| **Logo `OffByOne` & Nút `← Back to Home`** | `AUTH_LINKS.backToHome` | `"/"` | Quay về màn hình trang chủ (Root Landing `/`) |
| **Liên kết `Forgot password?`** | `AUTH_LINKS.forgotPassword` | `"/auth/forgot-password"` | Trang khôi phục mật khẩu |
| **Trang đích sau khi Đăng nhập (Student/Tutor)** | `AUTH_LINKS.afterLoginRedirect` | `"/roadmap"` | Chuyển vào trang Roadmap |
| **Trang đích sau khi Đăng ký** | `AUTH_LINKS.afterSignupRedirect` | `"/roadmap"` | Chuyển vào trang Roadmap sau khi tạo tài khoản |
| **Nút `Continue as Guest`** | `AUTH_LINKS.continueAsGuest` | `"/roadmap"` | Vào thẳng trang Roadmap với tư cách khách |
| **Trang đích độc quyền của Admin** | Quản lý qua Auth guard | `"/admin"` | Chuyển thẳng vào Admin Console khi `role === 'admin'` |
