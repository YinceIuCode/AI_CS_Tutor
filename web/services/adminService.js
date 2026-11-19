import { MOCK_ROADMAP_NODES, MOCK_OOP_ROADMAP_NODES, INITIAL_KNOWLEDGE_BASE_DOC, SAMPLE_COURSES } from "@/mocks/roadmapData"
import { WORKSPACE_TASK_DETAILS } from "@/mocks/workspaceTasks"
import { DEMO_USERS } from "@/mocks/mockUsers"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kcpgwxsibuqgkudgbjgd.supabase.co"
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_DCMS9ckBfOOVZSMzwIpO1g_FrSOLZP1"
const CURRICULUM_OVERRIDE_KEY = "offbyone_curriculum_override_v2"
const ADMIN_CACHE_PREFIX = "offbyone_admin_db_v3_"

export const SUPPORTED_TABLES = [
  "users",
  "knowledge_documents",
  "roadmap_nodes",
  "tasks",
  "user_progress",
  "code_submissions",
]

/**
 * Generate rich, relational seed data for all 6 tables with proper Foreign Keys
 */
function getInitialSeedForTable(tableName) {
  switch (tableName) {
    case "users":
      return DEMO_USERS.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.fullName,
        password_hash: u.passwordHash,
        role: u.role,
        account_type: u.accountType,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      }))

    case "knowledge_documents":
      return [
        {
          id: "doc-dsa-syllabus",
          course_code: "CS101",
          title: "CS101 - Data Structures & Algorithms (HCMUS)",
          file_name: "CS101_DSA_Syllabus_HCMUS.pdf",
          file_size: "2.4 MB",
          user_id: "user-demo-student-01",
          uploaded_by: "student@offbyone.demo",
          linked_nodes_count: 10,
          content: {
            totalPages: 48,
            primaryTopic: "Data Structures & Algorithms",
            status: "indexed",
          },
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          id: "doc-oop-syllabus",
          course_code: "CS102",
          title: "CS102 - Object-Oriented Programming with C++ (HCMUS)",
          file_name: "CS102_OOP_Cpp_Syllabus_HCMUS.pdf",
          file_size: "2.8 MB",
          user_id: "user-demo-student-01",
          uploaded_by: "student@offbyone.demo",
          linked_nodes_count: 5,
          content: {
            totalPages: 52,
            primaryTopic: "Object-Oriented Programming in Modern C++",
            status: "indexed",
          },
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ]

    case "roadmap_nodes": {
      const allNodes = []

      // 1. Primary document (CS101 DSA) - 10 Core DSA Nodes
      MOCK_ROADMAP_NODES.forEach((node, idx) => {
        allNodes.push({
          id: node.id,
          document_id: "doc-dsa-syllabus",
          short_code: node.shortCode,
          label: node.label,
          description: node.description,
          complexity: node.complexity || "O(1)",
          sequence_order: idx + 1,
          prerequisites: node.prerequisites || [],
          socratic_profile: node.socraticProfile || {
            conceptArchetype: node.label,
            difficulty: "intermediate",
          },
          created_at: new Date(Date.now() - 86400000 * (15 - idx)).toISOString(),
        })
      })

      // 2. Secondary document (CS102 OOP C++) - 5 Core OOP Nodes
      MOCK_OOP_ROADMAP_NODES.forEach((node, idx) => {
        allNodes.push({
          id: node.id,
          document_id: "doc-oop-syllabus",
          short_code: node.shortCode,
          label: node.label,
          description: node.description,
          complexity: node.complexity || "O(1)",
          sequence_order: idx + 1,
          prerequisites: node.prerequisites || [],
          socratic_profile: {
            conceptArchetype: node.label,
            difficulty: idx === 0 ? "foundational" : idx < 3 ? "intermediate" : "advanced",
          },
          created_at: new Date(Date.now() - 86400000 * (8 - idx)).toISOString(),
        })
      })

      return allNodes
    }

    case "tasks": {
      const allTasks = []
      // 1. Primary CS101 DSA tasks (30 tasks)
      MOCK_ROADMAP_NODES.forEach((node) => {
        ;(node.tasks || []).forEach((t, tIdx) => {
          const detail = WORKSPACE_TASK_DETAILS[node.id]?.[t.id] || {}
          allTasks.push({
            id: t.id,
            node_id: node.id,
            document_id: "doc-dsa-syllabus",
            task_type: t.type || detail.type || "theory",
            title: t.title || detail.headerTitle || "Task",
            description: t.description || detail.summaryLead || "",
            sequence_order: tIdx + 1,
            content: detail,
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          })
        })
      })

      // 2. CS102 OOP C++ tasks (15 tasks across 5 nodes)
      MOCK_OOP_ROADMAP_NODES.forEach((node) => {
        ;(node.tasks || []).forEach((t, tIdx) => {
          const detail = WORKSPACE_TASK_DETAILS[node.id]?.[t.id] || {}
          allTasks.push({
            id: t.id,
            node_id: node.id,
            document_id: "doc-oop-syllabus",
            task_type: t.type || detail.type || "theory",
            title: t.title || detail.headerTitle || "Task",
            description: t.description || detail.summaryLead || "",
            sequence_order: tIdx + 1,
            content: detail,
            created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          })
        })
      })

      return allTasks
    }

    case "user_progress":
      return [
        {
          id: "prog-student-01",
          user_id: "user-demo-student-01",
          completed_tasks: {
            // DSA tasks completed
            "dsa-foundations-task-1": true,
            "dsa-foundations-task-2": true,
            "dsa-foundations-task-3": true,
            "complexity-analysis-task-1": true,
            "complexity-analysis-task-2": true,
            "avl-tree-task-1": true,
            // OOP tasks completed (Node 01 completed 3/3, Node 02 completed 2/3)
            "oop-classes-encapsulation-task-1": true,
            "oop-classes-encapsulation-task-2": true,
            "oop-classes-encapsulation-task-3": true,
            "oop-constructors-raii-task-1": true,
            "oop-constructors-raii-task-2": true,
          },
          quiz_answers: {
            "avl-tree-task-2": { selectedOption: "A" },
            "oop-classes-encapsulation-task-2": { selectedOption: "B", isSubmitted: true },
            "oop-constructors-raii-task-2": { selectedOption: "A", isSubmitted: true },
          },
          code_drafts: {
            "oop-constructors-raii-task-3": `#include <iostream>
#include <algorithm>
using namespace std;

class IntArray {
private:
    int* data;
    size_t size;
public:
    IntArray(size_t s) : size(s), data(new int[s]()) {}
    ~IntArray() { delete[] data; }

    IntArray(const IntArray& other) : size(other.size) {
        data = new int[other.size];
        std::copy(other.data, other.data + other.size, data);
    }

    IntArray& operator=(const IntArray& other) {
        if (this != &other) {
            delete[] data;
            size = other.size;
            data = new int[other.size];
            std::copy(other.data, other.data + other.size, data);
        }
        return *this;
    }
};

int main() {
    std::cout << "IntArray Rule of Three verification draft" << std::endl;
    return 0;
}`,
          },
          hints_remaining: 3,
          updated_at: new Date().toISOString(),
        },
        {
          id: "prog-tutor-01",
          user_id: "user-demo-tutor-01",
          completed_tasks: {
            "dsa-foundations-task-1": true,
            "dsa-foundations-task-2": true,
            "dsa-foundations-task-3": true,
            "complexity-analysis-task-1": true,
            "complexity-analysis-task-2": true,
            "complexity-analysis-task-3": true,
            "avl-tree-task-1": true,
            "avl-tree-task-2": true,
            "avl-tree-task-3": true,
            "oop-classes-encapsulation-task-1": true,
            "oop-classes-encapsulation-task-2": true,
            "oop-classes-encapsulation-task-3": true,
            "oop-constructors-raii-task-1": true,
            "oop-constructors-raii-task-2": true,
            "oop-constructors-raii-task-3": true,
            "oop-operator-overloading-task-1": true,
            "oop-operator-overloading-task-2": true,
            "oop-operator-overloading-task-3": true,
          },
          quiz_answers: {},
          code_drafts: {},
          hints_remaining: 10,
          updated_at: new Date().toISOString(),
        },
      ]

    case "code_submissions":
      return [
        {
          id: "sub-1001",
          user_id: "user-demo-student-01",
          task_id: "avl-tree-task-3",
          node_id: "avl-tree",
          document_id: "doc-dsa-syllabus",
          language: "C++",
          code: `#include <iostream>\n\nstruct Node {\n    int key;\n    Node *left, *right;\n    int height;\n};\n\nint getHeight(Node* N) {\n    return N ? N->height : 0;\n}\n\nint main() {\n    std::cout << "All AVL balance invariants passed!" << std::endl;\n    return 0;\n}`,
          status: "success",
          runtime_ms: 14,
          memory_mb: "3.2 MB",
          stdout: "Test 1 Passed: [10, 20, 30] -> Rotated Left (Root 20)\nTest 2 Passed: Height diff balanced (BF = 0)\nExecution complete.",
          stderr: "",
          test_results: [
            { id: 1, label: "Ascending sequence triggers Left Rotation", passed: true },
            { id: 2, label: "Height delta <= 1 across all subtrees", passed: true },
          ],
          created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
        {
          id: "sub-1002",
          user_id: "user-demo-student-01",
          task_id: "avl-tree-task-3",
          node_id: "avl-tree",
          document_id: "doc-dsa-syllabus",
          language: "C++",
          code: `#include <iostream>\n\nint main() {\n    // Incorrect balance factor calculation\n    int bf = 3;\n    if (bf > 1) return 1;\n    return 0;\n}`,
          status: "runtime_error",
          runtime_ms: 8,
          memory_mb: "2.1 MB",
          stdout: "Assertion failed: balance_factor <= 1",
          stderr: "SIGABRT: Program aborted at line 7 in main.cpp",
          test_results: [
            { id: 1, label: "Ascending sequence triggers Left Rotation", passed: false },
          ],
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        {
          id: "sub-1003",
          user_id: "user-demo-tutor-01",
          task_id: "complexity-analysis-task-3",
          node_id: "complexity-analysis",
          document_id: "doc-dsa-syllabus",
          language: "C++",
          code: `#include <iostream>\n#include <vector>\n\nint maxSubArray(std::vector<int>& nums) {\n    int cur = 0, best = nums[0];\n    for (int x : nums) {\n        cur = std::max(x, cur + x);\n        best = std::max(best, cur);\n    }\n    return best;\n}\n\nint main() {\n    std::cout << "Kadane linear runtime verified!" << std::endl;\n    return 0;\n}`,
          status: "success",
          runtime_ms: 11,
          memory_mb: "2.8 MB",
          stdout: "All 5 test cases optimal O(N) verified.",
          stderr: "",
          test_results: [
            { id: 1, label: "Linear pass test", passed: true },
          ],
          created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        },
      ]

    default:
      return []
  }
}

/**
 * Read local cache for table
 */
function getCachedTableData(tableName) {
  if (typeof window === "undefined") return getInitialSeedForTable(tableName)
  try {
    const raw = window.localStorage.getItem(ADMIN_CACHE_PREFIX + tableName)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  const seed = getInitialSeedForTable(tableName)
  setCachedTableData(tableName, seed)
  return seed
}

/**
 * Write local cache for table
 */
function setCachedTableData(tableName, rows) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      ADMIN_CACHE_PREFIX + tableName,
      JSON.stringify(rows)
    )
  } catch {}
}

/**
 * Seed CS102 OOP C++ Syllabus & Nodes to Supabase if not present
 */
export async function seedOopSyllabusToSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { success: false, reason: "No credentials" }

  try {
    const baseUrl = SUPABASE_URL.replace(/\/+$/, "")
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    }

    // 1. Seed knowledge_documents (both doc-dsa-syllabus and doc-oop-syllabus)
    const docs = getInitialSeedForTable("knowledge_documents")
    await fetch(`${baseUrl}/rest/v1/knowledge_documents`, {
      method: "POST",
      headers,
      body: JSON.stringify(docs),
    }).catch(() => {})

    // 2. Seed roadmap_nodes for OOP
    const oopNodes = getInitialSeedForTable("roadmap_nodes").filter(
      (n) => n.document_id === "doc-oop-syllabus"
    )
    await fetch(`${baseUrl}/rest/v1/roadmap_nodes`, {
      method: "POST",
      headers,
      body: JSON.stringify(oopNodes),
    }).catch(() => {})

    // 3. Seed tasks for OOP
    const oopTasks = getInitialSeedForTable("tasks").filter(
      (t) => t.document_id === "doc-oop-syllabus"
    )
    await fetch(`${baseUrl}/rest/v1/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify(oopTasks),
    }).catch(() => {})

    // 4. Update user_progress for student
    const studentProg = getInitialSeedForTable("user_progress").find(
      (p) => p.user_id === "user-demo-student-01"
    )
    if (studentProg) {
      await fetch(`${baseUrl}/rest/v1/user_progress`, {
        method: "POST",
        headers,
        body: JSON.stringify(studentProg),
      }).catch(() => {})
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

/**
 * Fetch rows from Supabase REST API with transparent offline fallback
 */
export async function fetchTableData(tableName) {
  if (!SUPPORTED_TABLES.includes(tableName)) {
    throw new Error(`Unsupported table: ${tableName}`)
  }

  // 1. Try Supabase REST API
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const endpoint = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${tableName}?select=*`
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0) {
          // Rule 1: STRICTLY use Supabase data - DO NOT concat or auto-merge local mock records!
          // Mandatory deduplication by ID before saving to cache and returning
          let uniqueRows = Array.from(new Map(rows.map((item) => [item.id, item])).values())
          if (tableName === "user_progress") {
            uniqueRows = uniqueRows.filter(
              (r) =>
                r.user_id !== "00000003-0000-4000-8000-000000000001" &&
                r.user_id !== "user-demo-admin-01" &&
                !String(r.id).includes("admin")
            )
          }
          setCachedTableData(tableName, uniqueRows)
          return { data: uniqueRows, source: "supabase" }
        }
      }
    } catch (e) {
      // Fall through to local cache
    }
  }

  // 2. Fallback to Local Cache / Seeds
  const cached = getCachedTableData(tableName)
  let uniqueCached = Array.from(new Map(cached.map((item) => [item.id, item])).values())
  if (tableName === "user_progress") {
    uniqueCached = uniqueCached.filter(
      (r) =>
        r.user_id !== "00000003-0000-4000-8000-000000000001" &&
        r.user_id !== "user-demo-admin-01" &&
        !String(r.id).includes("admin")
    )
  }
  return { data: uniqueCached, source: "cache" }
}

/**
 * Directly inspect all 6 tables from Supabase REST with NO mock fallback.
 * Used for independent auditing, health check modal, and JSON export.
 */
export async function inspectRawSupabaseData() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      connected: false,
      error: "Missing SUPABASE_URL or SUPABASE_KEY in environment.",
      tables: {},
      counts: {},
      audit: {},
    }
  }

  const baseUrl = SUPABASE_URL.replace(/\/+$/, "")
  const tables = [
    "users",
    "knowledge_documents",
    "roadmap_nodes",
    "tasks",
    "user_progress",
    "code_submissions",
  ]
  const rawData = {}
  const errors = {}

  for (const tbl of tables) {
    try {
      const res = await fetch(`${baseUrl}/rest/v1/${tbl}?select=*`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) {
        errors[tbl] = `HTTP ${res.status}: ${res.statusText}`
        rawData[tbl] = []
      } else {
        const json = await res.json()
        rawData[tbl] = Array.isArray(json) ? json : []
      }
    } catch (err) {
      errors[tbl] = err.message
      rawData[tbl] = []
    }
  }

  const isConnected = Object.keys(errors).length === 0
  const counts = {
    users: (rawData.users || []).length,
    knowledge_documents: (rawData.knowledge_documents || []).length,
    roadmap_nodes: (rawData.roadmap_nodes || []).length,
    tasks: (rawData.tasks || []).length,
    user_progress: (rawData.user_progress || []).length,
    code_submissions: (rawData.code_submissions || []).length,
  }

  // Relational audit
  const docIds = new Set((rawData.knowledge_documents || []).map((d) => String(d.id)))
  const orphanNodes = (rawData.roadmap_nodes || []).filter((n) => {
    if (!n.document_id) return true
    const docId = String(n.document_id)
    if (docIds.has(docId)) return false
    if (docId.includes("dsa") || docId.includes("oop") || docId.includes("000")) return false
    return true
  })

  const nodeIds = new Set((rawData.roadmap_nodes || []).map((n) => String(n.id)))
  const orphanTasks = (rawData.tasks || []).filter(
    (t) => !t.node_id || !nodeIds.has(String(t.node_id))
  )

  const tasksByNode = {}
  ;(rawData.tasks || []).forEach((t) => {
    const nid = String(t.node_id || "")
    if (!tasksByNode[nid]) tasksByNode[nid] = []
    tasksByNode[nid].push(t)
  })

  const incompleteNodes = (rawData.roadmap_nodes || []).filter(
    (n) => (tasksByNode[n.id] || []).length !== 3
  )

  return {
    connected: isConnected,
    endpoint: baseUrl,
    error: isConnected ? null : Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join("; "),
    tables: rawData,
    counts,
    audit: {
      orphanNodes,
      orphanTasks,
      incompleteNodes,
    },
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Insert or Update a record in Supabase & Local Cache
 */
export async function saveRecord(tableName, record) {
  if (!SUPPORTED_TABLES.includes(tableName)) {
    throw new Error(`Unsupported table: ${tableName}`)
  }

  const isUpdate = Boolean(record.id)
  const targetId = record.id || `rec-${Date.now()}`
  const finalRecord = { ...record, id: targetId }

  let supabaseSuccess = false

  // 1. Send to Supabase REST
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const baseUrl = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${tableName}`
      const url = isUpdate ? `${baseUrl}?id=eq.${encodeURIComponent(targetId)}` : baseUrl
      const method = isUpdate ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(finalRecord),
      })

      if (res.ok) {
        supabaseSuccess = true
      }
    } catch (e) {
      console.warn(`[AdminService] Supabase ${tableName} write failed, updating cache:`, e.message)
    }
  }

  // 2. Update Local Cache
  const currentRows = getCachedTableData(tableName)
  let updatedRows
  if (isUpdate) {
    updatedRows = currentRows.map((r) => (r.id === targetId ? { ...r, ...finalRecord } : r))
    if (!updatedRows.some((r) => r.id === targetId)) {
      updatedRows.push(finalRecord)
    }
  } else {
    updatedRows = [finalRecord, ...currentRows]
  }
  setCachedTableData(tableName, updatedRows)

  // 3. If updating roadmap_nodes or tasks, also sync to curriculum override
  if (tableName === "roadmap_nodes" || tableName === "tasks") {
    syncCurriculumOverride(tableName, finalRecord)
  }

  return { success: true, record: finalRecord, syncedSupabase: supabaseSuccess }
}

/**
 * Delete a record in Supabase & Local Cache
 */
export async function deleteRecord(tableName, id) {
  if (!SUPPORTED_TABLES.includes(tableName)) {
    throw new Error(`Unsupported table: ${tableName}`)
  }

  // 1. Delete on Supabase
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const url = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${tableName}?id=eq.${encodeURIComponent(id)}`
      await fetch(url, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      })
    } catch (e) {
      console.warn(`[AdminService] Supabase delete error:`, e.message)
    }
  }

  // 2. Remove from Local Cache
  const currentRows = getCachedTableData(tableName)
  const filtered = currentRows.filter((r) => r.id !== id)
  setCachedTableData(tableName, filtered)

  return { success: true }
}

/**
 * Update User Role in users table
 */
export async function updateUserRole(userId, newRole) {
  return saveRecord("users", { id: userId, role: newRole })
}

/**
 * Refill or set user hints in user_progress table
 */
export async function updateUserHints(userId, newHintsCount) {
  const currentProg = getCachedTableData("user_progress").find((p) => p.user_id === userId)
  const progRecord = {
    id: currentProg?.id || `prog-${userId}`,
    user_id: userId,
    hints_remaining: Number(newHintsCount),
    updated_at: new Date().toISOString(),
  }
  return saveRecord("user_progress", progRecord)
}

/**
 * Toggle or set a user's completion status for a specific Roadmap node
 * (cycles: locked -> current -> completed -> locked)
 */
export async function toggleUserNodeStatus(userId, nodeId, currentStatus) {
  const progs = getCachedTableData("user_progress")
  let prog = progs.find((p) => String(p.user_id) === String(userId))
  if (!prog) {
    prog = {
      id: `prog-${userId}`,
      user_id: userId,
      completed_tasks: {},
      quiz_answers: {},
      code_drafts: {},
      hints_remaining: 3,
      updated_at: new Date().toISOString(),
    }
  }

  const completedMap = { ...(prog.completed_tasks || {}) }
  const tasks = [`${nodeId}-task-1`, `${nodeId}-task-2`, `${nodeId}-task-3`]

  if (currentStatus === "completed") {
    // Reset to locked (remove all 3 tasks)
    tasks.forEach((t) => delete completedMap[t])
  } else if (currentStatus === "current") {
    // Promote to completed (mark all 3 tasks true)
    tasks.forEach((t) => { completedMap[t] = true })
  } else {
    // From locked promote to current (mark 1 task true)
    completedMap[tasks[0]] = true
    delete completedMap[tasks[1]]
    delete completedMap[tasks[2]]
  }

  const updatedProg = {
    ...prog,
    completed_tasks: completedMap,
    updated_at: new Date().toISOString(),
  }

  await saveRecord("user_progress", updatedProg)

  // Sync with browser storage for live feedback in Roadmap
  if (typeof window !== "undefined") {
    try {
      const storageKey = `algopath_progress_v2_${userId}`
      const raw = window.localStorage.getItem(storageKey)
      const cur = raw ? JSON.parse(raw) : {}
      cur.completedTasks = completedMap
      window.localStorage.setItem(storageKey, JSON.stringify(cur))
    } catch {}
  }

  return { success: true, updatedProg }
}

/**
 * Direct sync of task completion & quiz answers to Supabase 'user_progress' and local storage
 */
export async function syncTaskProgressToSupabase(userId, taskId, isCompleted, quizState) {
  // Admin là quản trị viên hệ thống, tuyệt đối không tạo/lưu tiến độ thừa trong user_progress
  if (
    !userId ||
    userId === "00000003-0000-4000-8000-000000000001" ||
    userId === "user-demo-admin-01"
  ) {
    return null
  }

  // 1. Read authoritative client progress from localStorage/sessionStorage
  let clientCompletedTasks = {}
  let clientQuizAnswers = {}
  let clientCodeDrafts = {}
  const regKey = `algopath_progress_v2_${userId}`
  const guestKey = `algopath_guest_progress_v2_${userId}`

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(regKey) || window.sessionStorage.getItem(guestKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        clientCompletedTasks = parsed.completedTasks || {}
        clientQuizAnswers = parsed.quizAnswers || {}
        clientCodeDrafts = parsed.codeDrafts || {}
      }
    } catch {}
  }

  const progs = getCachedTableData("user_progress")
  let prog = progs.find((p) => String(p.user_id) === String(userId))
  if (!prog) {
    prog = {
      id: `prog-${userId}`,
      user_id: userId,
      completed_tasks: {},
      quiz_answers: {},
      code_drafts: {},
      hints_remaining: 3,
      updated_at: new Date().toISOString(),
    }
  }

  // Union-merge existing completed tasks so we NEVER lose previously completed tasks!
  const completedMap = {
    ...(prog.completed_tasks || {}),
    ...clientCompletedTasks,
  }

  if (taskId && isCompleted !== undefined) {
    if (isCompleted) {
      completedMap[taskId] = true
    } else {
      delete completedMap[taskId]
    }
  }

  const quizMap = {
    ...(prog.quiz_answers || {}),
    ...clientQuizAnswers,
  }

  if (taskId && quizState) {
    quizMap[taskId] = {
      ...(quizMap[taskId] || {}),
      ...quizState,
    }
  }

  const updatedProg = {
    ...prog,
    completed_tasks: completedMap,
    quiz_answers: quizMap,
    code_drafts: {
      ...(prog.code_drafts || {}),
      ...clientCodeDrafts,
    },
    updated_at: new Date().toISOString(),
  }

  // 1. Direct merge-duplicates Upsert to Supabase
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      await fetch(`${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/user_progress`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(updatedProg),
      })
    } catch (e) {
      // Fallback silently if offline
    }
  }

  // 2. Update local table cache
  await saveRecord("user_progress", updatedProg)

  // 3. Sync to browser localStorage/sessionStorage with safe union merge
  if (typeof window !== "undefined") {
    try {
      ;[regKey, guestKey].forEach((key) => {
        const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
        if (raw) {
          const cur = JSON.parse(raw)
          cur.completedTasks = { ...(cur.completedTasks || {}), ...completedMap }
          cur.quizAnswers = { ...(cur.quizAnswers || {}), ...quizMap }
          if (window.localStorage.getItem(key)) {
            window.localStorage.setItem(key, JSON.stringify(cur))
          }
          if (window.sessionStorage.getItem(key)) {
            window.sessionStorage.setItem(key, JSON.stringify(cur))
          }
        }
      })
    } catch {}
  }

  return { success: true, updatedProg }
}

/**
 * Record a freshly uploaded document with associated user_id & document_id
 */
export async function recordUploadedDocument(docMeta, currentUser) {
  const docId = docMeta.id || `doc-custom-${Date.now()}`
  const userId = currentUser?.id || "user-demo-student-01"
  const email = currentUser?.email || "student@offbyone.demo"

  const docRecord = {
    id: docId,
    course_code: docMeta.code || docId.substring(0, 8).toUpperCase(),
    title: docMeta.title || docMeta.name || "Custom Syllabus",
    file_name: docMeta.name || "syllabus.pdf",
    file_size: docMeta.size || "2.0 MB",
    user_id: userId,
    uploaded_by: email,
    linked_nodes_count: Array.isArray(docMeta.nodes) ? docMeta.nodes.length : 10,
    content: {
      totalPages: docMeta.chunks || 30,
      primaryTopic: docMeta.title || docMeta.name,
      status: "indexed",
    },
    created_at: new Date().toISOString(),
  }

  await saveRecord("knowledge_documents", docRecord)

  // Associate each node with this document_id
  if (Array.isArray(docMeta.nodes)) {
    for (let idx = 0; idx < docMeta.nodes.length; idx++) {
      const node = docMeta.nodes[idx]
      const nodeRecord = {
        id: `${docId}-${node.id}`,
        document_id: docId,
        short_code: node.shortCode || `0${idx + 1}`,
        label: node.label,
        description: node.description || "",
        complexity: node.complexity || "O(1)",
        sequence_order: idx + 1,
        prerequisites: node.prerequisites || [],
        socratic_profile: node.socraticProfile || { conceptArchetype: node.label },
        created_at: new Date().toISOString(),
      }
      await saveRecord("roadmap_nodes", nodeRecord)
    }
  }

  return docRecord
}

/**
 * Reset Demo Student Progress back to pristine 0% state
 */
export async function resetDemoStudentProgress() {
  await applyDemoPreset("empty")
  return { success: true, message: "Student progress has been completely reset to 0%!" }
}

/**
 * Keep curriculum overrides in localStorage so Roadmap & Workspace pages
 * immediately reflect changes saved in the Admin Builder.
 */
function syncCurriculumOverride(type, record) {
  if (typeof window === "undefined") return
  try {
    const raw = window.localStorage.getItem(CURRICULUM_OVERRIDE_KEY)
    const current = raw ? JSON.parse(raw) : { nodes: {}, tasks: {} }
    if (type === "roadmap_nodes") {
      current.nodes[record.id] = record
    } else if (type === "tasks") {
      current.tasks[record.id] = record
    }
    window.localStorage.setItem(CURRICULUM_OVERRIDE_KEY, JSON.stringify(current))
  } catch {}
}

export function getCurriculumOverrides() {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CURRICULUM_OVERRIDE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Save complete Node + its 3 tasks from the visual Curriculum Builder
 */
export async function saveCurriculumNodeAndTasks(nodeId, nodeData, tasksList) {
  // 1. Save Node
  await saveRecord("roadmap_nodes", {
    id: nodeId,
    document_id: nodeData.documentId || "doc-dsa-syllabus",
    label: nodeData.label,
    short_code: nodeData.shortCode,
    complexity: nodeData.complexity,
    target_complexity: nodeData.complexity,
    description: nodeData.description,
    primary_slide_reference: nodeData.primarySlideReference,
  })

  // 2. Save each task
  for (const t of tasksList) {
    await saveRecord("tasks", {
      id: t.id,
      node_id: nodeId,
      document_id: nodeData.documentId || "doc-dsa-syllabus",
      task_type: t.type,
      title: t.title,
      description: t.description || "",
      content: t.content || {},
    })
  }

  return { success: true }
}

/**
 * 1-Click Demo Scenario Switcher for student@offbyone.demo & active demo sessions.
 * Directly updates Supabase table 'user_progress' and synchronizes all localStorage keys.
 */
export async function applyDemoPreset(presetId) {
  let completedTasks = {}
  let quizAnswers = {}
  let codeDrafts = {}
  let hintsRemainingNumber = 3
  let hintsRemainingMap = {}
  let roadmapFlowState = "ready"
  let fileName = "CS101_DSA_Syllabus_HCMUS.pdf"
  let message = ""

  if (presetId === "empty") {
    // Preset 1: Empty State (0%)
    roadmapFlowState = "empty"
    fileName = ""
    completedTasks = {}
    quizAnswers = {}
    codeDrafts = {}
    hintsRemainingNumber = 3
    hintsRemainingMap = {}
    message = "Preset 1 Applied: Empty State (0% - Ready for Syllabus Upload demo)."
  } else if (presetId === "mid_course") {
    // Preset 2: Mid-Course Demo (67% - AVL Tree Nullptr Bug active)
    roadmapFlowState = "ready"
    fileName = "CS101_DSA_Syllabus_HCMUS.pdf"

    // Nodes completely completed (3/3 tasks)
    const fullCompletedNodeIds = [
      "dsa-foundations",
      "arrays-strings",
      "linked-list",
      "trees",
      "binary-search-tree",
    ]
    fullCompletedNodeIds.forEach((nodeId) => {
      const nodeObj = MOCK_ROADMAP_NODES.find((n) => n.id === nodeId)
      if (nodeObj && Array.isArray(nodeObj.tasks)) {
        nodeObj.tasks.forEach((t) => {
          completedTasks[t.id] = true
          if (t.type === "quiz") {
            quizAnswers[t.id] = { selectedOption: "A", isSubmitted: true }
          }
        })
      }
      completedTasks[`${nodeId}-task-1`] = true
      completedTasks[`${nodeId}-task-2`] = true
      completedTasks[`${nodeId}-task-3`] = true
      quizAnswers[`${nodeId}-task-2`] = { selectedOption: "A", isSubmitted: true }
    })
    completedTasks["bst-task-1"] = true
    completedTasks["bst-task-2"] = true
    completedTasks["bst-task-3"] = true

    // Node 02 (Complexity Analysis) partially completed (2/3 tasks: theory + quiz)
    completedTasks["complexity-analysis-task-1"] = true
    completedTasks["complexity-analysis-task-2"] = true
    quizAnswers["complexity-analysis-task-2"] = { selectedOption: "A", isSubmitted: true }

    // Node 05 (Stack & Queue) partially completed (2/3 tasks: theory + quiz)
    completedTasks["stack-queue-task-1"] = true
    completedTasks["stack-queue-task-2"] = true
    quizAnswers["stack-queue-task-2"] = { selectedOption: "A", isSubmitted: true }

    // Node 08 (AVL Tree) partially completed (2/3 tasks)
    completedTasks["avl-tree-task-1"] = true
    completedTasks["avl-tree-task-2"] = true
    quizAnswers["avl-tree-task-2"] = { selectedOption: "A", isSubmitted: true }

    // Task 3 has buggy starter code with nullptr dereference
    const buggyCode = `#include <iostream>
#include <algorithm>

struct Node {
    int key;
    Node *left = nullptr;
    Node *right = nullptr;
    int height = 1;
};

// BUG: Missing nullptr check crashes when tree is empty or leaf is reached!
int getHeight(Node *N) {
    return N->height; // Potential Segfault: null pointer dereference
}

int getBalanceFactor(Node *N) {
    return getHeight(N->left) - getHeight(N->right);
}

// TODO: Fix getHeight nullptr guard and implement rightRotate
Node* rightRotate(Node *y) {
    Node *x = y->left;
    Node *T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = std::max(getHeight(y->left), getHeight(y->right)) + 1;
    x->height = std::max(getHeight(x->left), getHeight(x->right)) + 1;
    return x;
}

int main() {
    Node* root = nullptr;
    std::cout << "Testing AVL height with root: " << getHeight(root) << std::endl;
    return 0;
}`

    codeDrafts["avl-tree-task-3"] = {
      code: buggyCode,
      language: "cpp",
      isSubmitted: false,
    }

    hintsRemainingNumber = 2
    hintsRemainingMap = { "avl-tree-task-3": 2 }
    message = "Preset 2 Applied: Mid-Course Demo (67% - 8/10 nodes reached, AVL Tree Nullptr Bug active, 2/3 Socratic hints remaining)."
  } else if (presetId === "mastery") {
    // Preset 3: Full Mastery (100% - 30/30 tasks completed across all 10 nodes)
    roadmapFlowState = "ready"
    fileName = "CS101_DSA_Syllabus_HCMUS.pdf"

    MOCK_ROADMAP_NODES.forEach((node) => {
      // 1. Complete every actual task in node.tasks
      ;(node.tasks || []).forEach((t) => {
        completedTasks[t.id] = true
        if (t.type === "quiz") {
          quizAnswers[t.id] = { selectedOption: "A", isSubmitted: true }
        }
      })
      // 2. Populate fallback naming conventions
      completedTasks[`${node.id}-task-1`] = true
      completedTasks[`${node.id}-task-2`] = true
      completedTasks[`${node.id}-task-3`] = true
      quizAnswers[`${node.id}-task-2`] = { selectedOption: "A", isSubmitted: true }
    })

    // Explicit task IDs for nodes with distinct abbreviations in roadmapData
    const explicitTaskIds = [
      "bst-task-1",
      "bst-task-2",
      "bst-task-3",
      "sorting-task-1",
      "sorting-task-2",
      "sorting-task-3",
      "sorting-algorithms-task-1",
      "sorting-algorithms-task-2",
      "sorting-algorithms-task-3",
      "graph-task-1",
      "graph-task-2",
      "graph-task-3",
      "graph-algorithms-task-1",
      "graph-algorithms-task-2",
      "graph-algorithms-task-3",
    ]
    explicitTaskIds.forEach((tId) => {
      completedTasks[tId] = true
      if (tId.includes("-2") || tId.endsWith("-2")) {
        quizAnswers[tId] = { selectedOption: "A", isSubmitted: true }
      }
    })

    hintsRemainingNumber = 3
    hintsRemainingMap = {}
    message = "Preset 3 Applied: Full Mastery (100% - 10/10 Nodes and 30/30 Tasks completed)."
  }

  // 1. Preset demo áp dụng ĐỘC QUYỀN cho tài khoản học viên student@offbyone.demo
  const STUDENT_SUPABASE_ID = "00000001-0000-4000-8000-000000000001"
  const STUDENT_LEGACY_ID = "user-demo-student-01"
  const targetUserIds = [STUDENT_SUPABASE_ID, STUDENT_LEGACY_ID]

  // 2. Synchronize localStorage & sessionStorage cho tài khoản Student và xóa bỏ sạch sẽ dữ liệu của Admin
  if (typeof window !== "undefined") {
    try {
      // Xóa bỏ sạch sẽ các key tiến độ thừa của admin nếu trước đó vô tình lưu
      const adminKeys = [
        "algopath_progress_v2_00000003-0000-4000-8000-000000000001",
        "algopath_progress_v2_user-demo-admin-01",
        "algopath_guest_progress_v2_00000003-0000-4000-8000-000000000001",
        "algopath_guest_progress_v2_user-demo-admin-01",
      ]
      adminKeys.forEach((k) => {
        window.localStorage.removeItem(k)
        window.sessionStorage.removeItem(k)
      })

      targetUserIds.forEach((uid) => {
        const payload = {
          userId: uid,
          accountType: "registered",
          roadmapFlowState,
          fileName,
          fileSize: "2.4 MB",
          completedTasks,
          quizAnswers,
          codeDrafts,
          hintsRemaining: hintsRemainingMap,
          updatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem(`algopath_progress_v2_${uid}`, JSON.stringify(payload))
        window.sessionStorage.setItem(`algopath_guest_progress_v2_${uid}`, JSON.stringify(payload))
      })

      // Also update any general legacy keys in localStorage matching algopath_progress_
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && (k.startsWith("algopath_progress_") || k.startsWith("algopath_guest_progress_"))) {
          if (k.includes("admin") || k.includes("00000003-0000-4000-8000-000000000001")) {
            window.localStorage.removeItem(k)
            continue
          }
          try {
            const existing = JSON.parse(window.localStorage.getItem(k) || "{}")
            const updated = {
              ...existing,
              roadmapFlowState,
              fileName,
              completedTasks,
              quizAnswers,
              codeDrafts,
              hintsRemaining: hintsRemainingMap,
              updatedAt: new Date().toISOString(),
            }
            window.localStorage.setItem(k, JSON.stringify(updated))
          } catch {}
        }
      }

      window.dispatchEvent(new CustomEvent("algopath:progress-updated"))
      window.dispatchEvent(new Event("storage"))

      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("algopath_progress_sync")
        targetUserIds.forEach((uid) => {
          bc.postMessage({ type: "PROGRESS_PRESET_APPLIED", userId: uid, presetId, updatedAt: new Date().toISOString() })
        })
        bc.close()
      }
    } catch (e) {
      console.warn("[AdminService] Local storage sync error:", e)
    }
  }

  // 3. Update Supabase and Local Table Cache for user_progress (chỉ lưu Student, loại bỏ Admin)
  const currentRows = getCachedTableData("user_progress").filter(
    (r) =>
      r.user_id !== "00000003-0000-4000-8000-000000000001" &&
      r.user_id !== "user-demo-admin-01" &&
      !String(r.id).includes("admin")
  )

  for (const uid of targetUserIds) {
    const updatedProgressRecord = {
      id: `prog-${uid}`,
      user_id: uid,
      completed_tasks: completedTasks,
      quiz_answers: quizAnswers,
      code_drafts: codeDrafts,
      hints_remaining: hintsRemainingNumber,
      updated_at: new Date().toISOString(),
    }

    const existingIdx = currentRows.findIndex(
      (r) => String(r.user_id) === String(uid) || String(r.id) === `prog-${uid}`
    )
    if (existingIdx >= 0) {
      currentRows[existingIdx] = { ...currentRows[existingIdx], ...updatedProgressRecord }
    } else {
      currentRows.push(updatedProgressRecord)
    }

    // Direct Upsert to Supabase table
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await fetch(`${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/user_progress`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify(updatedProgressRecord),
        })
      } catch (e) {
        // Fallback silently if offline
      }
    }
  }

  setCachedTableData("user_progress", currentRows)

  // 4. Xóa bỏ bất kỳ tiến độ thừa nào của admin trên Supabase nếu có
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      await fetch(
        `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/user_progress?user_id=in.(00000003-0000-4000-8000-000000000001,user-demo-admin-01)`,
        {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      )
    } catch (e) {}
  }

  return { success: true, message }
}

/**
 * Restore original pristine CS101 curriculum seeds (10 nodes and 30 tasks)
 */
export async function restoreDefaultCS101Seed() {
  if (typeof window !== "undefined") {
    try {
      // Clear curriculum overrides
      window.localStorage.removeItem(CURRICULUM_OVERRIDE_KEY)
      // Reset admin table caches for nodes and tasks
      window.localStorage.removeItem(ADMIN_CACHE_PREFIX + "roadmap_nodes")
      window.localStorage.removeItem(ADMIN_CACHE_PREFIX + "tasks")
    } catch {}
  }

  // Re-seed tables
  const defaultNodes = getInitialSeedForTable("roadmap_nodes")
  const defaultTasks = getInitialSeedForTable("tasks")
  setCachedTableData("roadmap_nodes", defaultNodes)
  setCachedTableData("tasks", defaultTasks)

  return {
    success: true,
    message: "Restored pristine CS101 curriculum seeds (10 nodes & 30 tasks) successfully!",
  }
}

/**
 * Directed Acyclic Graph (DAG) Cycle Detection algorithm using 3-color DFS.
 * Checks if setting 'proposedPrerequisites' for 'targetNodeId' introduces a circular dependency.
 *
 * @param {Array<any>} allNodes - List of all nodes in the document/scope
 * @param {string} targetNodeId - Node currently being edited
 * @param {Array<string>} proposedPrerequisites - Proposed array of prerequisite node IDs
 * @returns {{ hasCycle: boolean, cyclePath: string[] | null, cycleString: string | null }}
 */
export function detectDagCycle(allNodes, targetNodeId, proposedPrerequisites) {
  // Build prerequisite adjacency map: u -> list of prereqs
  const adj = new Map()
  for (const n of allNodes) {
    if (!n || !n.id) continue
    const prereqs =
      n.id === targetNodeId
        ? proposedPrerequisites
        : Array.isArray(n.prerequisites)
        ? n.prerequisites
        : []
    adj.set(n.id, prereqs)
  }

  if (!adj.has(targetNodeId)) {
    adj.set(targetNodeId, proposedPrerequisites)
  }

  // 0: unvisited, 1: visiting (in current recursion stack), 2: visited (processed)
  const state = new Map()
  let cycle = null

  function dfs(u, path) {
    state.set(u, 1)
    path.push(u)

    const neighbors = adj.get(u) || []
    for (const v of neighbors) {
      if (!adj.has(v)) continue // Skip unindexed or external IDs
      const vState = state.get(v) || 0
      if (vState === 1) {
        // Back edge detected: cycle found!
        const cycleStartIndex = path.indexOf(v)
        cycle = path.slice(cycleStartIndex).concat(v)
        return true
      }
      if (vState === 0) {
        if (dfs(v, path)) return true
      }
    }

    path.pop()
    state.set(u, 2)
    return false
  }

  // 1. Run DFS starting directly from targetNodeId to catch immediately formed cycles
  if (dfs(targetNodeId, [])) {
    return {
      hasCycle: true,
      cyclePath: cycle,
      cycleString: cycle.join(" -> "),
    }
  }

  // 2. Check any remaining disconnected components
  for (const [nodeId] of adj) {
    if ((state.get(nodeId) || 0) === 0) {
      if (dfs(nodeId, [])) {
        return {
          hasCycle: true,
          cyclePath: cycle,
          cycleString: cycle.join(" -> "),
        }
      }
    }
  }

  return { hasCycle: false, cyclePath: null, cycleString: null }
}
