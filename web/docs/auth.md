# Tài Liệu Giao Diện Đăng Nhập & Đăng Ký (`auth.md`)

Tài liệu này mô tả chi tiết cấu trúc giao diện, sơ đồ cây nhị phân minh họa và các vị trí gán `href` trong màn hình **Login & Sign Up (`AlgoPath Auth`)**.

---

## 1. Vị Trí File & Đường Dẫn Truy Cập

- **File route chính:** [`web/app/auth/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/auth/page.tsx) → URL: `http://localhost:3000/auth`
- **Hỗ trợ mở trực tiếp tab Đăng Ký:** `http://localhost:3000/auth?tab=signup`
- **File route tương thích đường dẫn cũ:** [`web/app/login/page.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/app/login/page.tsx) → URL: `http://localhost:3000/login`
- **Component giao diện chính:** [`web/components/login-form.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx)

---

## 2. Cấu Trúc Giao Diện

1. **Thanh Header nổi (`max-w-[1400px]`):**
   - Bên trái: Logo tròn xanh `#7AA2F7` + tên thương hiệu **`AlgoPath`**.
   - Bên phải: Nút **`Back to Home`** kèm biểu tượng ngôi nhà dẫn về trang `/landing`.
2. **Khung thẻ đôi 2 cột (`max-w-[1180px]`):**
   - **Cột trái (Thông điệp & Sơ đồ cây BST):**
     - Tiêu đề: **`Learn DSA by thinking, not copying.`** (`thinking,` màu `#7DCFFF`, `not copying.` màu `#7AA2F7`).
     - Mô tả: *"Build algorithmic confidence with guided practice and Socratic AI hints."*
     - Sơ đồ cây nhị phân (`8` → `4`, `12` → `2`, `6`, `10`, `14`) với các đoạn thẳng nối tâm vuông góc $90^\circ$ với tiếp tuyến đường tròn.
     - Dòng 3 tính năng dưới đáy: `Socratic AI • Skill Tree • Code Sandbox`.
   - **Cột phải (Biểu mẫu chuyển đổi `Log In` | `Sign Up`):**
     - Thanh chuyển tab **`Log In`** và **`Sign Up`**.
     - Các trường nhập liệu: `Full Name` (khi ở tab Sign Up), `Email`, `Password` (kèm nút ẩn/hiện mật khẩu), liên kết `Forgot password?`.
     - Nút hành động chính: **`Log In`** / **`Sign Up`**.
     - Nút OAuth: **`Continue with Google`**.
     - Nút khách: **`Continue as Guest`** (trải nghiệm nhanh chuyển thẳng vào trang `/roadmap`).

---

## 3. Hướng Dẫn Gán `href` Điều Hướng (`AUTH_LINKS`)

Tất cả các đường dẫn điều hướng được quản lý tại hằng số [`AUTH_LINKS`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx#L21-L27) trong file [`web/components/login-form.tsx`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/components/login-form.tsx):

| Thành phần / Nút bấm | Khóa trong `AUTH_LINKS` | Giá trị mặc định | Mô tả điều hướng |
| :--- | :--- | :---: | :--- |
| **Logo `AlgoPath` & Nút `Back to Home`** | `AUTH_LINKS.backToHome` | `"/landing"` | Quay về màn hình giới thiệu Landing |
| **Liên kết `Forgot password?`** | `AUTH_LINKS.forgotPassword` | `"/auth/forgot-password"` | Trang khôi phục mật khẩu |
| **Trang đích sau khi Đăng nhập** | `AUTH_LINKS.afterLoginRedirect` | `"/roadmap"` | Chuyển vào trang Roadmap sau khi đăng nhập |
| **Trang đích sau khi Đăng ký** | `AUTH_LINKS.afterSignupRedirect` | `"/roadmap"` | Chuyển vào trang Roadmap sau khi tạo tài khoản |
| **Nút `Continue as Guest`** | `AUTH_LINKS.continueAsGuest` | `"/roadmap"` | Vào thẳng trang Roadmap với tư cách khách |
