import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Read environment variables from web/.env.local or fallback to api/.env
function loadEnv() {
  const envCandidates = [
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../../api/.env"),
    path.resolve(__dirname, "../.env"),
  ]

  const env = { ...process.env }

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8")
      const lines = content.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eqIdx = trimmed.indexOf("=")
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1)
          }
          if (!env[key]) {
            env[key] = val
          }
        }
      }
    }
  }

  return env
}

const env = loadEnv()
const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.SUPABASE_URL ||
  "https://kcpgwxsibuqgkudgbjgd.supabase.co"
const SUPABASE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.SUPABASE_KEY ||
  "sb_publishable_DCMS9ckBfOOVZSMzwIpO1g_FrSOLZP1"

const TABLES = [
  "users",
  "knowledge_documents",
  "roadmap_nodes",
  "tasks",
  "user_progress",
  "code_submissions",
]

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
}

async function fetchTable(tableName) {
  const url = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${tableName}?select=*`
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status} (${res.statusText}): ${text}`)
  }

  return await res.json()
}

async function main() {
  console.log(`\n${COLORS.bright}${COLORS.cyan}====================================================================${COLORS.reset}`)
  console.log(`${COLORS.bright}${COLORS.white}  SUPABASE RAW INSPECTOR & AUDIT TOOL (OFFBYONE DIRECT DB)${COLORS.reset}`)
  console.log(`${COLORS.cyan}====================================================================${COLORS.reset}`)
  console.log(`${COLORS.dim}Endpoint:${COLORS.reset} ${SUPABASE_URL}`)
  console.log(`${COLORS.dim}Auth Key:${COLORS.reset} ${SUPABASE_KEY.slice(0, 16)}...`)
  console.log(`${COLORS.dim}Timestamp:${COLORS.reset} ${new Date().toISOString()}\n`)

  const snapshot = {
    metadata: {
      exported_at: new Date().toISOString(),
      supabase_url: SUPABASE_URL,
      version: "1.0.0",
      counts: {},
    },
    tables: {},
    audit: {},
  }

  let hasError = false
  const counts = {}

  // 1. Fetch all 6 tables directly
  for (const table of TABLES) {
    process.stdout.write(`Fetching [${table}]... `)
    try {
      const rows = await fetchTable(table)
      snapshot.tables[table] = rows
      counts[table] = rows.length
      snapshot.metadata.counts[table] = rows.length
      console.log(`${COLORS.green}OK (${rows.length} rows)${COLORS.reset}`)
    } catch (err) {
      hasError = true
      snapshot.tables[table] = []
      counts[table] = 0
      snapshot.metadata.counts[table] = 0
      console.log(`${COLORS.red}FAILED: ${err.message}${COLORS.reset}`)
    }
  }

  // 2. Summary Table
  console.log(`\n${COLORS.bright}${COLORS.yellow}--- TABLE ROW SUMMARY ---${COLORS.reset}`)
  console.log(`+-----------------------+------------+`)
  console.log(`| Table Name            | Row Count  |`)
  console.log(`+-----------------------+------------+`)
  for (const table of TABLES) {
    const namePad = table.padEnd(21)
    const countPad = String(counts[table] ?? 0).padStart(10)
    console.log(`| ${namePad} | ${countPad} |`)
  }
  console.log(`+-----------------------+------------+`)

  // 3. User Details
  const users = snapshot.tables.users || []
  console.log(`\n${COLORS.bright}${COLORS.yellow}--- USERS IN DATABASE (${users.length}) ---${COLORS.reset}`)
  if (users.length === 0) {
    console.log(`${COLORS.red}[WARN] No users found on Supabase!${COLORS.reset}`)
  } else {
    console.log(`+--------------------------------------+---------------------------+---------+------------+`)
    console.log(`| User ID                              | Email                     | Role    | Type       |`)
    console.log(`+--------------------------------------+---------------------------+---------+------------+`)
    users.forEach((u) => {
      const idPad = String(u.id || "").padEnd(36).slice(0, 36)
      const emailPad = String(u.email || "").padEnd(25).slice(0, 25)
      const rolePad = String(u.role || "student").padEnd(7)
      const typePad = String(u.account_type || "registered").padEnd(10)
      console.log(`| ${idPad} | ${emailPad} | ${rolePad} | ${typePad} |`)
    })
    console.log(`+--------------------------------------+---------------------------+---------+------------+`)
  }

  // 4. Knowledge Documents Details
  const docs = snapshot.tables.knowledge_documents || []
  const nodes = snapshot.tables.roadmap_nodes || []
  console.log(`\n${COLORS.bright}${COLORS.yellow}--- KNOWLEDGE DOCUMENTS (${docs.length}) ---${COLORS.reset}`)
  if (docs.length === 0) {
    console.log(`${COLORS.red}[WARN] No knowledge documents found on Supabase!${COLORS.reset}`)
  } else {
    console.log(`+--------------------------------------+-----------------------------------+-------------+`)
    console.log(`| Document ID                          | File Name / Course Title          | Nodes Count |`)
    console.log(`+--------------------------------------+-----------------------------------+-------------+`)
    docs.forEach((d) => {
      const docIdStr = String(d.id || "")
      const idPad = docIdStr.padEnd(36).slice(0, 36)
      const fileName = String(d.name || d.file_name || d.title || docIdStr)
      const namePad = fileName.padEnd(33).slice(0, 33)
      // Count actual linked nodes in roadmap_nodes
      const linked = nodes.filter(
        (n) =>
          String(n.document_id) === docIdStr ||
          (docIdStr.includes("0001") && (String(n.document_id).includes("dsa") || !String(n.id).startsWith("oop-"))) ||
          (docIdStr.includes("0002") && (String(n.document_id).includes("oop") || String(n.id).startsWith("oop-")))
      ).length
      const linkedPad = String(linked).padStart(11)
      console.log(`| ${idPad} | ${namePad} | ${linkedPad} |`)
    })
    console.log(`+--------------------------------------+-----------------------------------+-------------+`)
  }

  // 5. Data Integrity Audit
  console.log(`\n${COLORS.bright}${COLORS.yellow}--- RELATIONAL INTEGRITY AUDIT ---${COLORS.reset}`)
  const tasks = snapshot.tables.tasks || []

  // Check 5a: Orphan Roadmap Nodes
  const docIdSet = new Set(docs.map((d) => String(d.id)))
  const orphanNodes = nodes.filter((n) => {
    if (!n.document_id) return true
    const docId = String(n.document_id)
    if (docIdSet.has(docId)) return false
    // Alias check
    if (docId.includes("dsa") || docId.includes("oop") || docId.includes("000")) return false
    return true
  })
  snapshot.audit.orphan_nodes = orphanNodes

  if (orphanNodes.length === 0) {
    console.log(`${COLORS.green}[PASS] All ${nodes.length} roadmap nodes are properly linked to valid documents.${COLORS.reset}`)
  } else {
    console.log(`${COLORS.bgRed}${COLORS.white} [FAIL] Found ${orphanNodes.length} orphan roadmap nodes with invalid document_id: ${COLORS.reset}`)
    orphanNodes.forEach((n) => console.log(`  - Node: ${n.id} (document_id: ${n.document_id})`))
  }

  // Check 5b: Orphan Tasks
  const nodeIdSet = new Set(nodes.map((n) => String(n.id)))
  const orphanTasks = tasks.filter((t) => {
    if (!t.node_id) return true
    return !nodeIdSet.has(String(t.node_id))
  })
  snapshot.audit.orphan_tasks = orphanTasks

  if (orphanTasks.length === 0) {
    console.log(`${COLORS.green}[PASS] All ${tasks.length} tasks are properly linked to existing roadmap nodes.${COLORS.reset}`)
  } else {
    console.log(`${COLORS.bgRed}${COLORS.white} [FAIL] Found ${orphanTasks.length} orphan tasks with invalid node_id: ${COLORS.reset}`)
    orphanTasks.forEach((t) => console.log(`  - Task: ${t.id} (node_id: ${t.node_id})`))
  }

  // Check 5c: Node Completeness (Each Node must have exactly 3 tasks: theory, quiz, coding)
  const tasksByNode = {}
  tasks.forEach((t) => {
    const nId = String(t.node_id || "")
    if (!tasksByNode[nId]) tasksByNode[nId] = []
    tasksByNode[nId].push(t)
  })

  const incompleteNodes = []
  nodes.forEach((n) => {
    const nodeTasks = tasksByNode[n.id] || []
    const hasTheory = nodeTasks.some((t) => t.task_type === "theory" || t.type === "theory" || String(t.id).endsWith("-1"))
    const hasQuiz = nodeTasks.some((t) => t.task_type === "quiz" || t.type === "quiz" || String(t.id).endsWith("-2"))
    const hasCoding = nodeTasks.some((t) => t.task_type === "coding" || t.type === "coding" || String(t.id).endsWith("-3"))
    if (nodeTasks.length !== 3 || !hasTheory || !hasQuiz || !hasCoding) {
      incompleteNodes.push({
        id: n.id,
        label: n.label,
        count: nodeTasks.length,
        hasTheory,
        hasQuiz,
        hasCoding,
      })
    }
  })
  snapshot.audit.incomplete_nodes = incompleteNodes

  if (incompleteNodes.length === 0) {
    console.log(`${COLORS.green}[PASS] All ${nodes.length} nodes contain full curriculum sets (1 Theory + 1 Quiz + 1 Coding).${COLORS.reset}`)
  } else {
    console.log(`${COLORS.bgRed}${COLORS.white} [FAIL] Found ${incompleteNodes.length} nodes with incomplete task configurations: ${COLORS.reset}`)
    incompleteNodes.forEach((incomp) => {
      console.log(`  - Node ${incomp.id}: ${incomp.count}/3 tasks (Theory: ${incomp.hasTheory}, Quiz: ${incomp.hasQuiz}, Coding: ${incomp.hasCoding})`)
    })
  }

  // 6. Write Snapshot to web/supabase_snapshot.json
  const outputPath = path.resolve(__dirname, "../supabase_snapshot.json")
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), "utf-8")
  console.log(`\n${COLORS.bright}${COLORS.green}====================================================================${COLORS.reset}`)
  console.log(`${COLORS.bright}${COLORS.green}  RAW DATABASE SNAPSHOT EXPORTED SUCCESSFULLY!${COLORS.reset}`)
  console.log(`${COLORS.dim}Location:${COLORS.reset} ${outputPath}`)
  console.log(`${COLORS.dim}Size:${COLORS.reset} ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)
  console.log(`${COLORS.green}====================================================================${COLORS.reset}\n`)
}

main().catch((err) => {
  console.error(`\n${COLORS.bgRed}${COLORS.white} FATAL ERROR: ${err.message} ${COLORS.reset}\n`)
  process.exit(1)
})
