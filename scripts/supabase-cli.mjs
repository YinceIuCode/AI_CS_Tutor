#!/usr/bin/env node
/**
 * ============================================================================
 * OFFBYONE SUPABASE CLI UTILITY
 * Công cụ dòng lệnh quản lý, kiểm tra, nạp seed và sao lưu dữ liệu Supabase.
 *
 * Cách sử dụng:
 *   node scripts/supabase-cli.mjs --help
 *   node scripts/supabase-cli.mjs --status
 *   node scripts/supabase-cli.mjs --query tasks --limit 10
 *   node scripts/supabase-cli.mjs --seed
 *   node scripts/supabase-cli.mjs --export all
 *   node scripts/supabase-cli.mjs --clean --table code_submissions --confirm
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper import dynamically by absolute file path in Windows ESM
async function dynamicImport(relativePath) {
  const absPath = path.resolve(ROOT_DIR, relativePath);
  return import(pathToFileURL(absPath).href);
}

// 1. Tự động nạp biến môi trường từ web/.env.local hoặc web/.env
function loadEnv() {
  const envPaths = [
    path.join(ROOT_DIR, 'web', '.env.local'),
    path.join(ROOT_DIR, 'web', '.env'),
    path.join(ROOT_DIR, '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      return envPath;
    }
  }
  return null;
}

const loadedEnvFile = loadEnv();

// 2. Dynamic Import Supabase Client từ web/node_modules
let createClient;
try {
  const supabaseModule = await dynamicImport('web/node_modules/@supabase/supabase-js/dist/index.mjs');
  createClient = supabaseModule.createClient;
} catch (err) {
  console.error('\x1b[31m[LỖI] Không thể nạp thư viện @supabase/supabase-js:\x1b[0m', err.message);
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\x1b[31m[LỖI] Thiếu cấu hình Supabase URL hoặc API Key trong file .env.local!\x1b[0m');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const LEAN_TABLES = [
  'users',
  'knowledge_documents',
  'roadmap_nodes',
  'tasks',
  'user_progress',
  'code_submissions'
];

// 3. Phân tích tham số dòng lệnh (Arg Parsing)
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    command: null,
    table: null,
    limit: 5,
    select: '*',
    confirm: false,
    json: false,
    data: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h' || arg === 'help') {
      parsed.command = 'help';
    } else if (arg === '--status' || arg === '-s' || arg === 'status') {
      parsed.command = 'status';
    } else if (arg === '--seed' || arg === 'seed') {
      parsed.command = 'seed';
    } else if (arg === '--clean' || arg === '--truncate' || arg === 'clean') {
      parsed.command = 'clean';
    } else if (arg === '--export' || arg === '-e' || arg === 'export') {
      parsed.command = 'export';
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        parsed.table = args[++i];
      }
    } else if (arg === '--query' || arg === '-q' || arg === 'query') {
      parsed.command = 'query';
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        parsed.table = args[++i];
      }
    } else if (arg === '--table' || arg === '-t') {
      parsed.table = args[++i];
    } else if (arg === '--limit' || arg === '-l') {
      parsed.limit = parseInt(args[++i], 10) || 5;
    } else if (arg === '--select') {
      parsed.select = args[++i];
    } else if (arg === '--confirm') {
      parsed.confirm = true;
    } else if (arg === '--json') {
      parsed.json = true;
    }
  }

  // Mặc định hiển thị help nếu không có lệnh
  if (!parsed.command) {
    parsed.command = 'help';
  }

  return parsed;
}

// 4. HÀM XỬ LÝ LỆNH: HELP
function printHelp() {
  console.log(`
\x1b[1m\x1b[36m==============================================================================
   OFFBYONE SUPABASE CLI TOOL - QUẢN LÝ DATABASE 6 BẢNG LEAN
==============================================================================\x1b[0m
\x1b[33mCấu hình hiện tại:\x1b[0m
  • URL: \x1b[32m${SUPABASE_URL}\x1b[0m
  • Env File: ${loadedEnvFile || 'N/A'}

\x1b[1mCÁC LỆNH VÀ KHÓA ARGUMENT HỖ TRỢ:\x1b[0m

  \x1b[32m1. Kiểm tra trạng thái kết nối & số dòng của 6 bảng:\x1b[0m
     node scripts/supabase-cli.mjs --status
     node scripts/supabase-cli.mjs -s

  \x1b[32m2. Truy vấn dữ liệu trong bảng bất kỳ:\x1b[0m
     node scripts/supabase-cli.mjs --query <table_name> [--limit <n>] [--json]
     \x1b[90mVí dụ:\x1b[0m
     node scripts/supabase-cli.mjs --query tasks --limit 3
     node scripts/supabase-cli.mjs -q roadmap_nodes
     node scripts/supabase-cli.mjs -q users --json

  \x1b[32m3. Nạp dữ liệu mẫu đầy đủ (Seed baseline data: 3 users, 10 nodes, 30 tasks):\x1b[0m
     node scripts/supabase-cli.mjs --seed

  \x1b[32m4. Xuất dữ liệu ra file JSON backup:\x1b[0m
     node scripts/supabase-cli.mjs --export all
     node scripts/supabase-cli.mjs --export tasks

  \x1b[32m5. Xóa/dọn dữ liệu trong bảng (Cần cờ --confirm để bảo vệ):\x1b[0m
     node scripts/supabase-cli.mjs --clean --table code_submissions --confirm
     node scripts/supabase-cli.mjs --clean --table user_progress --confirm

  \x1b[32m6. Hướng dẫn sử dụng:\x1b[0m
     node scripts/supabase-cli.mjs --help
\x1b[36m==============================================================================\x1b[0m
`);
}

// 5. HÀM XỬ LÝ LỆNH: STATUS
async function handleStatus() {
  console.log('\n\x1b[1m🔍 Đang kiểm tra trạng thái 6 bảng Lean trên Supabase...\x1b[0m');
  console.log(`📡 URL: \x1b[34m${SUPABASE_URL}\x1b[0m\n`);

  const results = [];

  for (const table of LEAN_TABLES) {
    const start = Date.now();
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      const latency = Date.now() - start;

      if (error) {
        results.push({
          'Bảng': table,
          'Trạng thái': '❌ Lỗi (Check RLS/Schema)',
          'Số dòng (Rows)': 0,
          'Độ trễ': `${latency} ms`,
          'Ghi chú': error.message
        });
      } else {
        results.push({
          'Bảng': table,
          'Trạng thái': '🟢 Sẵn sàng',
          'Số dòng (Rows)': count ?? 0,
          'Độ trễ': `${latency} ms`,
          'Ghi chú': count > 0 ? 'Đã có dữ liệu' : 'Bảng rỗng'
        });
      }
    } catch (e) {
      results.push({
        'Bảng': table,
        'Trạng thái': '❌ Kết nối thất bại',
        'Số dòng (Rows)': 0,
        'Độ trễ': 'N/A',
        'Ghi chú': e.message
      });
    }
  }

  console.table(results);
  console.log('\x1b[32m✔ Hoàn tất kiểm tra trạng thái hệ thống.\x1b[0m\n');
}

// 6. HÀM XỬ LÝ LỆNH: QUERY
async function handleQuery(table, limit, select, isJson) {
  if (!table) {
    console.error('\x1b[31m[LỖI] Vui lòng chỉ định tên bảng cần truy vấn. Ví dụ: --query tasks\x1b[0m');
    console.log(`Các bảng có sẵn: ${LEAN_TABLES.join(', ')}`);
    return;
  }

  console.log(`\n\x1b[1m🔎 Đang truy vấn bảng [${table}] (Giới hạn: ${limit} dòng)...\x1b[0m`);
  const { data, error, count } = await supabase
    .from(table)
    .select(select, { count: 'exact' })
    .limit(limit);

  if (error) {
    console.error(`\x1b[31m❌ Lỗi truy vấn bảng ${table}:\x1b[0m`, error.message);
    return;
  }

  console.log(`📊 Tổng số dòng hiện có trong database: \x1b[32m${count}\x1b[0m`);

  if (!data || data.length === 0) {
    console.log('\x1b[33m(Bảng hiện tại không có dữ liệu)\x1b[0m\n');
    return;
  }

  if (isJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Làm gọn các trường JSON dài để in ra console.table đẹp mắt
    const formatted = data.map(item => {
      const row = { ...item };
      for (const [key, val] of Object.entries(row)) {
        if (typeof val === 'object' && val !== null) {
          const str = JSON.stringify(val);
          row[key] = str.length > 35 ? str.substring(0, 32) + '...' : str;
        } else if (typeof val === 'string' && val.length > 50) {
          row[key] = val.substring(0, 47) + '...';
        }
      }
      return row;
    });
    console.table(formatted);
  }
  console.log('');
}

// 7. HÀM XỬ LÝ LỆNH: SEED
async function handleSeed() {
  console.log('\n\x1b[1m\x1b[33m🌱 Đang chuẩn bị nạp dữ liệu Seed mẫu vào 6 bảng Supabase...\x1b[0m');

  // Đọc dữ liệu từ mocks
  const { DEMO_USERS } = await dynamicImport('web/mocks/mockUsers.js');
  const { MOCK_ROADMAP_NODES, INITIAL_KNOWLEDGE_BASE_DOC } = await dynamicImport('web/mocks/roadmapData.js');
  const { WORKSPACE_TASK_DETAILS } = await dynamicImport('web/mocks/workspaceTasks.js');
  const { SOCRATIC_NODE_PROFILES } = await dynamicImport('web/mocks/socraticTutorData.js');

  // 1. Seed users
  console.log('1/5. Nạp bảng users...');
  const usersPayload = [
    {
      id: '00000001-0000-4000-8000-000000000001',
      email: 'student@offbyone.demo',
      password_hash: 'offbyone_demo_hash::student@offbyone.demo::Student@123',
      full_name: 'Demo Student',
      role: 'student',
      account_type: 'registered'
    },
    {
      id: '00000001-0000-4000-8000-000000000002',
      email: 'student@example.com',
      password_hash: 'offbyone_demo_hash::student@example.com::Student@123',
      full_name: 'Nguyen Van A',
      role: 'student',
      account_type: 'registered'
    },
    {
      id: '00000001-0000-4000-8000-000000000003',
      email: 'educator@offbyone.demo',
      password_hash: 'offbyone_demo_hash::educator@offbyone.demo::Tutor@123',
      full_name: 'TS. Tran Minh Triet',
      role: 'tutor',
      account_type: 'registered'
    }
  ];
  const { error: userErr } = await supabase.from('users').upsert(usersPayload, { onConflict: 'id' });
  if (userErr) console.warn('  ⚠ Users upsert warning:', userErr.message);
  else console.log('  ✔ Đã nạp 3 tài khoản users.');

  // 2. Seed knowledge_documents
  console.log('2/5. Nạp bảng knowledge_documents...');
  const docPayload = [
    {
      id: 'doc-dsa-syllabus',
      name: 'CS101_DSA_Syllabus_HCMUS.pdf',
      file_type: 'pdf',
      file_size_text: '2.4 MB',
      storage_path: '/storage/v1/object/public/syllabi/cs101_dsa.pdf',
      status: 'indexed',
      extracted_topics: [
        'Arrays and Strings', 'Linked Lists', 'Stacks & Queues',
        'Recursion & Backtracking', 'Binary Trees', 'Binary Search Trees',
        'Priority Queues & Heap', 'AVL Trees', 'Graph Traversal', 'Dynamic Programming'
      ],
      metadata: { institution: 'HCMUS', courseCode: 'CS101', academicYear: '2026-2027' }
    }
  ];
  const { error: docErr } = await supabase.from('knowledge_documents').upsert(docPayload, { onConflict: 'id' });
  if (docErr) console.warn('  ⚠ Doc upsert warning:', docErr.message);
  else console.log('  ✔ Đã nạp 1 tài liệu giáo trình chuẩn.');

  // 3. Seed roadmap_nodes
  console.log('3/5. Nạp bảng roadmap_nodes (10 chủ đề DSA)...');
  const nodesPayload = MOCK_ROADMAP_NODES.map((node, idx) => ({
    id: node.id,
    document_id: 'doc-dsa-syllabus',
    short_code: (idx + 1).toString().padStart(2, '0'),
    label: node.label,
    description: node.description || '',
    complexity: node.complexity || 'O(N)',
    sequence_order: idx + 1,
    prerequisites: node.prerequisites || [],
    socratic_profile: SOCRATIC_NODE_PROFILES[node.id] || {
      keyInvariants: [`Core invariants of ${node.label}`],
      commonMisconceptions: ['Boundary edge cases']
    }
  }));
  const { error: nodeErr } = await supabase.from('roadmap_nodes').upsert(nodesPayload, { onConflict: 'id' });
  if (nodeErr) console.warn('  ⚠ Nodes upsert warning:', nodeErr.message);
  else console.log(`  ✔ Đã nạp ${nodesPayload.length} nodes DSA.`);

  // 4. Seed tasks
  console.log('4/5. Nạp bảng tasks (30 bài học)...');
  const tasksPayload = [];
  for (const node of MOCK_ROADMAP_NODES) {
    if (!node.tasks) continue;
    for (let tIdx = 0; tIdx < node.tasks.length; tIdx++) {
      const task = node.tasks[tIdx];
      let taskType = 'theory';
      if (tIdx === 1) taskType = 'quiz';
      else if (tIdx === 2) taskType = 'coding';

      const taskDetail = WORKSPACE_TASK_DETAILS[task.id] || {};
      const content = {
        title: task.title,
        taskType: taskType,
        ...taskDetail
      };

      tasksPayload.push({
        id: task.id,
        node_id: node.id,
        task_type: taskType,
        sequence_order: tIdx + 1,
        title: task.title,
        description: task.description || `${taskType.toUpperCase()} module for ${node.label}`,
        content: content
      });
    }
  }
  const { error: taskErr } = await supabase.from('tasks').upsert(tasksPayload, { onConflict: 'id' });
  if (taskErr) console.warn('  ⚠ Tasks upsert warning:', taskErr.message);
  else console.log(`  ✔ Đã nạp ${tasksPayload.length} tasks.`);

  // 5. Seed user_progress mẫu
  console.log('5/5. Khởi tạo tiến độ mặc định (user_progress)...');
  const progressPayload = [
    {
      user_id: '00000001-0000-4000-8000-000000000001',
      last_active_node_id: 'avl-tree',
      completed_tasks: {
        'avl-tree-task-1': true,
        'avl-tree-task-2': true
      },
      quiz_answers: {
        'avl-tree-task-2': 'A'
      },
      code_drafts: {},
      hints_remaining: 3
    }
  ];
  const { error: progErr } = await supabase.from('user_progress').upsert(progressPayload, { onConflict: 'user_id' });
  if (progErr) console.warn('  ⚠ Progress upsert warning:', progErr.message);
  else console.log('  ✔ Đã nạp tiến độ ban đầu cho học viên demo.');

  console.log('\n\x1b[32m✨ HOÀN TẤT NẠP TOÀN BỘ SEED DATA THÀNH CÔNG!\x1b[0m\n');
}

// 8. HÀM XỬ LÝ LỆNH: EXPORT
async function handleExport(target) {
  const exportDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const tablesToExport = (!target || target === 'all') ? LEAN_TABLES : [target];
  console.log(`\n\x1b[1m📦 Bắt đầu xuất dữ liệu: [${tablesToExport.join(', ')}]...\x1b[0m`);

  const backupData = {};
  for (const table of tablesToExport) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`  ❌ Lỗi export ${table}:`, error.message);
    } else {
      backupData[table] = data;
      console.log(`  ✔ Đã xuất ${table}: ${data.length} bản ghi.`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = tablesToExport.length === 1 
    ? `${tablesToExport[0]}_${timestamp}.json`
    : `supabase_backup_all_${timestamp}.json`;
  
  const filePath = path.join(exportDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`\n\x1b[32m✔ Đã lưu file backup tại:\x1b[0m ${filePath}\n`);
}

// 9. HÀM XỬ LÝ LỆNH: CLEAN
async function handleClean(table, confirm) {
  if (!table) {
    console.error('\x1b[31m[LỖI] Vui lòng chỉ định bảng cần xóa với cờ --table <tên_bảng>\x1b[0m');
    console.log('Ví dụ: node scripts/supabase-cli.mjs --clean --table code_submissions --confirm');
    return;
  }

  if (!confirm) {
    console.warn(`\n\x1b[33m⚠ CẢNH BÁO: Bạn đang yêu cầu xóa toàn bộ dữ liệu trong bảng [${table}].\x1b[0m`);
    console.log('Để xác nhận hành động này, vui lòng thêm cờ \x1b[31m--confirm\x1b[0m');
    console.log(`Lệnh chạy: node scripts/supabase-cli.mjs --clean --table ${table} --confirm\n`);
    return;
  }

  console.log(`\n\x1b[31m🗑 Đang xóa dữ liệu trong bảng [${table}]...\x1b[0m`);
  // Supabase REST requires a where clause to delete, use neq or gt
  const { error } = await supabase
    .from(table)
    .delete()
    .neq('created_at', '1970-01-01');

  if (error) {
    console.error(`❌ Lỗi khi xóa dữ liệu bảng ${table}:`, error.message);
  } else {
    console.log(`\x1b[32m✔ Đã dọn dẹp sạch dữ liệu trong bảng [${table}].\x1b[0m\n`);
  }
}

// 10. CHƯƠNG TRÌNH CHÍNH (MAIN DISPATCHER)
async function main() {
  const args = parseArgs();

  switch (args.command) {
    case 'status':
      await handleStatus();
      break;
    case 'query':
      await handleQuery(args.table, args.limit, args.select, args.json);
      break;
    case 'seed':
      await handleSeed();
      break;
    case 'export':
      await handleExport(args.table);
      break;
    case 'clean':
      await handleClean(args.table, args.confirm);
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

main().catch(err => {
  console.error('\n\x1b[31m[FATAL ERROR]\x1b[0m', err);
  process.exit(1);
});
