import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read web/.env.local directly
const envPath = path.resolve(".env.local");
let supabaseUrl = "";
let supabaseKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    }
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=") || trimmed.startsWith("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=")) {
      if (!supabaseKey) supabaseKey = trimmed.split("=")[1].trim();
    }
  });
}

console.log("=========================================================================");
console.log("🔍 OFFBYONE - SUPABASE LIVE CONNECTION & SCHEMA TESTER");
console.log("=========================================================================");
console.log(`URL: ${supabaseUrl || "NOT FOUND"}`);
console.log(`KEY: ${supabaseKey ? supabaseKey.substring(0, 15) + "..." : "NOT FOUND"}`);
console.log("-------------------------------------------------------------------------");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc KEY trong web/.env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  const tables = [
    { name: "users", check: (data) => `Tìm thấy ${data.length} người dùng (Email mẫu: ${data[0]?.email})` },
    { name: "knowledge_documents", check: (data) => `Tìm thấy ${data.length} tài liệu (Tên: ${data[0]?.name})` },
    { name: "roadmap_nodes", check: (data) => `Tìm thấy ${data.length} chủ đề kiến thức DSA (Ví dụ: ${data[0]?.label})` },
    { name: "tasks", check: (data) => `Tìm thấy ${data.length} bài tập (Có content JSONB: ${Boolean(data[0]?.content)})` },
    { name: "user_progress", check: (data) => `Tìm thấy ${data.length} bản ghi tiến độ` },
    { name: "code_submissions", check: (data) => `Tìm thấy ${data.length} bài nộp code` },
  ];

  let passedCount = 0;

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t.name).select("*").limit(5);
      if (error) {
        console.log(`❌ BẢNG [${t.name}]: LỖI -> ${error.message} (Code: ${error.code})`);
      } else if (!data || data.length === 0) {
        console.log(`⚠️ BẢNG [${t.name}]: ĐÃ TẠO NHƯNG CHƯA CÓ DỮ LIỆU (Cần chạy file LEAN_SEED_DATA.txt)`);
        passedCount++;
      } else {
        console.log(`✅ BẢNG [${t.name}]: KẾT NỐI THÀNH CÔNG! -> ${t.check(data)}`);
        passedCount++;
      }
    } catch (err) {
      console.log(`❌ BẢNG [${t.name}]: NGOẠI LỆ -> ${err.message}`);
    }
  }

  console.log("-------------------------------------------------------------------------");
  console.log(`📊 Kết quả kiểm tra: ${passedCount}/${tables.length} bảng hoạt động bình thường.`);
  if (passedCount === tables.length) {
    console.log("🎉 XUẤT SẮC! Toàn bộ 6 bảng Supabase đã sẵn sàng phục vụ Frontend.");
  } else {
    console.log("💡 Hướng dẫn: Mở Supabase SQL Editor, dán LEAN_SCHEMA_6_TABLES.sql rồi dán LEAN_SEED_DATA.txt để khởi tạo.");
  }
  console.log("=========================================================================");
}

runTests();
