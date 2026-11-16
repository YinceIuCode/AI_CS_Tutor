# SUPABASE CLI UTILITY (`scripts/supabase-cli.mjs`)

Công cụ dòng lệnh tổng hợp đa năng để điều khiển, kiểm tra, nạp dữ liệu và quản lý Supabase cho dự án OffByOne.

---

## 🚀 Cách sử dụng nhanh

### 1. Xem hướng dẫn sử dụng (Help)
```bash
node scripts/supabase-cli.mjs --help
```

### 2. Kiểm tra trạng thái & đếm số dòng trong 6 bảng Lean
```bash
node scripts/supabase-cli.mjs --status
# Viết tắt:
node scripts/supabase-cli.mjs -s
```

### 3. Truy vấn xem trước dữ liệu của 1 bảng
```bash
# Xem 3 dòng trong bảng tasks
node scripts/supabase-cli.mjs --query tasks --limit 3

# Xem dưới dạng JSON nguyên bản
node scripts/supabase-cli.mjs -q users --json
```

### 4. Tự động nạp toàn bộ Seed Data (10 nodes DSA, 30 tasks, 3 users)
```bash
node scripts/supabase-cli.mjs --seed
```

### 5. Xuất sao lưu (Backup) dữ liệu ra file JSON
```bash
# Xuất toàn bộ 6 bảng:
node scripts/supabase-cli.mjs --export all

# Xuất riêng 1 bảng:
node scripts/supabase-cli.mjs --export tasks
```

### 6. Xóa / Dọn dẹp dữ liệu bảng (Cần cờ `--confirm` để tránh xóa nhầm)
```bash
node scripts/supabase-cli.mjs --clean --table code_submissions --confirm
```
