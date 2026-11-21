"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Database,
  Download,
  Edit2,
  Eye,
  FileCode,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
  Zap,
  Play,
  BookMarked,
  Flame,
  Square,
  CheckSquare,
  Cpu,
  Tag,
  Sliders,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import {
  SUPPORTED_TABLES,
  fetchTableData,
  saveRecord,
  deleteRecord,
  updateUserRole,
  updateUserHints,
  resetDemoStudentProgress,
  saveCurriculumNodeAndTasks,
  toggleUserNodeStatus,
  applyDemoPreset,
  restoreDefaultCS101Seed,
  detectDagCycle,
  inspectRawSupabaseData,
} from "@/services/adminService"
import { MOCK_ROADMAP_NODES } from "@/mocks/roadmapData"
import { WORKSPACE_TASK_DETAILS } from "@/mocks/workspaceTasks"

type AdminTab = "database" | "curriculum" | "users" | "submissions"


/**
 * Tokyo Night Code Editor with Line Numbers Gutter and Indentation Support.
 */
function TokyoNightCodeEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = "320px",
  placeholder = "// Enter C++ code here...",
}: {
  value: string
  onChange?: (val: string) => void
  readOnly?: boolean
  minHeight?: string
  placeholder?: string
}) {
  const lineCount = React.useMemo(() => {
    return Math.max(1, (value || "").split("\n").length)
  }, [value])

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const gutterRef = React.useRef<HTMLDivElement>(null)

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      if (!onChange) return
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const nextVal = (value || "").substring(0, start) + "    " + (value || "").substring(end)
      onChange(nextVal)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4
        }
      }, 0)
    }
  }

  return (
    <div
      className="relative flex overflow-hidden rounded-xl border border-[#24283b] bg-[#13141c] font-mono text-xs shadow-inner"
      style={{ minHeight }}
    >
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        className="shrink-0 select-none overflow-hidden border-r border-[#24283b] bg-[#16161e] py-3 px-3 text-right text-[11px] font-medium text-[#414868]"
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i} className="leading-5">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Code Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 resize-none bg-transparent py-3 px-4 leading-5 text-[#c0caf5] outline-none placeholder:text-[#414868] selection:bg-[#283457]"
      />
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const { currentUser, isInitializing, isAuthenticated, logout, login } = useAuth()

  const [activeTab, setActiveTab] = React.useState<AdminTab>("database")
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // ==================== CASCADING CONTEXT FILTER STATE ====================
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [selectedDocumentId, setSelectedDocumentId] = React.useState<string>("")
  const [selectedNodeIdScope, setSelectedNodeIdScope] = React.useState<string>("")

  // Relational context lists
  const [usersList, setUsersList] = React.useState<any[]>([])
  const [documentsList, setDocumentsList] = React.useState<any[]>([])
  const [nodesList, setNodesList] = React.useState<any[]>([])
  const [tasksCount, setTasksCount] = React.useState<number>(45)
  const [progressList, setProgressList] = React.useState<any[]>([])
  const [isInspectorOpen, setIsInspectorOpen] = React.useState<boolean>(false)
  const [isInspecting, setIsInspecting] = React.useState<boolean>(false)
  const [inspectorResult, setInspectorResult] = React.useState<any>(null)

  // Tab 1 (Database Explorer) state
  const [selectedTable, setSelectedTable] = React.useState<string>("roadmap_nodes")
  const [tableRows, setTableRows] = React.useState<any[]>([])
  const [isLoadingTable, setIsLoadingTable] = React.useState<boolean>(false)
  const [tableSearch, setTableSearch] = React.useState<string>("")
  const [dataSource, setDataSource] = React.useState<string>("supabase")
  const [editingRecord, setEditingRecord] = React.useState<any | null>(null)
  const [isNewRecord, setIsNewRecord] = React.useState<boolean>(false)
  const [jsonErrors, setJsonErrors] = React.useState<Record<string, string>>({})
  const [drawerTab, setDrawerTab] = React.useState<"visual" | "json">("visual")
  const [isApplyingPreset, setIsApplyingPreset] = React.useState<boolean>(false)
  const [isSwitchingAccount, setIsSwitchingAccount] = React.useState<boolean>(false)
  const [demoMenuOpen, setDemoMenuOpen] = React.useState<boolean>(false)
  const demoMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demoMenuRef.current && !demoMenuRef.current.contains(event.target as Node)) {
        setDemoMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ==================== TAB 2: COURSE & LESSON STUDIO STATE ====================
  const [allTasksList, setAllTasksList] = React.useState<any[]>([])
  const [curriculumDocId, setCurriculumDocId] = React.useState<string>("00000005-0000-4000-8000-000000000001")
  const [curriculumNodeId, setCurriculumNodeId] = React.useState<string>("avl-tree")
  const [curriculumActiveTab, setCurriculumActiveTab] = React.useState<"theory" | "quiz" | "coding" | "guardrails">("theory")
  const [isCurriculumDirty, setIsCurriculumDirty] = React.useState<boolean>(false)
  const [isSavingCurriculum, setIsSavingCurriculum] = React.useState<boolean>(false)
  const [isNewNodeModalOpen, setIsNewNodeModalOpen] = React.useState<boolean>(false)
  const [newNodeData, setNewNodeData] = React.useState({
    label: "",
    shortCode: "",
    targetComplexity: "O(log N)",
    description: "",
  })

  // Node Metadata & DAG Prerequisites
  const [nodeMeta, setNodeMeta] = React.useState({
    label: "AVL Tree",
    shortCode: "08",
    targetComplexity: "O(log N)",
    slideReference: "Slide 14 (PDF)",
    description: "Self-balancing binary search tree bounding height variance <= 1.",
    prerequisites: ["binary-search-tree"] as string[],
  })

  // Theory Tab state
  const [theoryState, setTheoryState] = React.useState({
    headerTitle: "CORE THEORY: AVL TREE & BIG-O COMPLEXITY",
    summaryLead: "An AVL Tree is a self-balancing Binary Search Tree where the difference between heights of left and right subtrees (the Balance Factor) cannot exceed 1 for any node.",
    complexityStrip: {
      best: "O(log N)",
      average: "O(log N)",
      worst: "O(log N)",
      space: "O(N)",
    },
    invariantsList: [
      { id: "1", title: "AVL Balance Factor Invariant", tag: "Invariant", detail: "Balance Factor (BF) = Height(Left Subtree) - Height(Right Subtree). Every node must strictly satisfy BF in {-1, 0, +1}." },
      { id: "2", title: "Left-Heavy Imbalance (BF = +2)", tag: "LL Rotation", detail: "When inserting into left-left subtree causes BF = +2, single Right Rotation restores balance in O(1)." },
      { id: "3", title: "Right-Heavy Imbalance (BF = -2)", tag: "RR Rotation", detail: "When inserting into right-right subtree causes BF = -2, single Left Rotation restores balance in O(1)." },
      { id: "4", title: "Guaranteed O(log N) Bound", tag: "Big-O Guaranteed", detail: "By bounding tree height to ~1.44 log2(N), AVL trees prevent degenerate O(N) skewed chains on sorted inputs." },
    ],
    snippetTitle: "C++ AVL Rotation Invariant",
    snippetCode: "// Local O(1) rotation pointers\nNode* rightRotate(Node* y) {\n    Node* x = y->left;\n    Node* T2 = x->right;\n    x->right = y;\n    y->left = T2;\n    y->height = std::max(height(y->left), height(y->right)) + 1;\n    x->height = std::max(height(x->left), height(x->right)) + 1;\n    return x;\n}",
    socraticCheck: "Notice how the Balance Factor only depends on the height of direct child subtrees. Why do we only need O(1) local pointer updates during a rotation instead of rebuilding the entire tree?",
    showLivePreview: false,
  })

  // Quiz Tab state
  const [quizQuestions, setQuizQuestions] = React.useState<Array<{
    id: string
    prompt: string
    options: string[]
    correctIndex: number
    explanation: string
    socraticHint: string
  }>>([
    {
      id: "q1",
      prompt: "Given an AVL Tree node N with Left Subtree Height = 3 and Right Subtree Height = 1. What is the Balance Factor of node N, and does it require a rotation?",
      options: [
        "Balance Factor = +2 (Requires Right Rotation)",
        "Balance Factor = +2 (Requires Left Rotation)",
        "Balance Factor = -2 (Requires Right Rotation)",
        "Balance Factor = +1 (Tree is already balanced)",
      ],
      correctIndex: 0,
      explanation: "Balance Factor is Height(Left) - Height(Right) = 3 - 1 = +2. Since the left subtree is heavy, a Right Rotation restores balance in O(1).",
      socraticHint: "Focus on the definition: BF = Left Height - Right Height. Which side has excess weight?",
    },
    {
      id: "q2",
      prompt: "In an AVL tree with N nodes, what is the strict upper bound on its height h?",
      options: [
        "h <= 1.44 * log2(N + 2) - 0.328",
        "h = N (same as unbalanced BST)",
        "h <= log10(N)",
        "h is unbounded on random inserts",
      ],
      correctIndex: 0,
      explanation: "Fibonacci trees represent the minimally populated AVL tree, yielding worst-case height bounded strictly at ~1.44 log2(N).",
      socraticHint: "Consider the worst-case sparse tree where every node has BF = 1.",
    },
    {
      id: "q3",
      prompt: "What is the time complexity of recomputing heights along the ancestor path after an insertion and at most two rotations?",
      options: [
        "O(log N)",
        "O(N)",
        "O(N log N)",
        "O(1)",
      ],
      correctIndex: 0,
      explanation: "Since the tree height is bounded by O(log N), traversing from the inserted leaf back to the root inspects at most O(log N) nodes.",
      socraticHint: "How many ancestors can a node have in a tree whose height is bounded by O(log N)?",
    },
  ])
  const [activeQuizIndex, setActiveQuizIndex] = React.useState<number>(0)
  const [liveQuizSelectedOption, setLiveQuizSelectedOption] = React.useState<number | null>(null)
  const [liveQuizShowHint, setLiveQuizShowHint] = React.useState<boolean>(false)

  // Coding Tab state
  const [codingState, setCodingState] = React.useState({
    taskTitle: "Implement AVL Rotations & Insertion",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    problemStatement: "Implement rightRotate and leftRotate helper functions to maintain AVL balance factor <= 1 after inserting a sequence of integers.",
    inputFormat: "Sequence of integer keys to insert into the AVL tree.",
    outputFormat: "Pre-order traversal of the balanced AVL tree.",
    testCases: [
      { id: "tc-1", label: "Right-Right (RR) Left Rotation", input: "[10, 20, 30]", expected: "Rotated Left, Root is 20", isHidden: false },
      { id: "tc-2", label: "Left-Left (LL) Right Rotation", input: "[30, 20, 10]", expected: "Rotated Right, Root is 20", isHidden: false },
      { id: "tc-3", label: "Hidden Stress Test (Random Sequence)", input: "[15, 10, 20, 8, 12, 18, 25, 5]", expected: "Balanced AVL Height <= 4", isHidden: true },
    ],
    starterCode: "#include <iostream>\n#include <algorithm>\n\nstruct Node {\n    int key;\n    Node *left = nullptr;\n    Node *right = nullptr;\n    int height = 1;\n};\n\nint getHeight(Node *N) {\n    return N ? N->height : 0;\n}\n\nint getBalanceFactor(Node *N) {\n    return N ? getHeight(N->left) - getHeight(N->right) : 0;\n}\n\n// TODO: Implement Right Rotation (LL Rotation)\nNode* rightRotate(Node *y) {\n    Node *x = y->left;\n    Node *T2 = x->right;\n    x->right = y;\n    y->left = T2;\n    y->height = std::max(getHeight(y->left), getHeight(y->right)) + 1;\n    x->height = std::max(getHeight(x->left), getHeight(x->right)) + 1;\n    return x;\n}\n\nint main() {\n    std::cout << \"AVL Rotations Ready!\" << std::endl;\n    return 0;\n}",
    solutionCode: "#include <iostream>\n#include <algorithm>\n\nstruct Node {\n    int key;\n    Node *left = nullptr;\n    Node *right = nullptr;\n    int height = 1;\n};\n\nint getHeight(Node *N) {\n    return N ? N->height : 0;\n}\n\nint getBalanceFactor(Node *N) {\n    return N ? getHeight(N->left) - getHeight(N->right) : 0;\n}\n\nNode* rightRotate(Node *y) {\n    Node *x = y->left;\n    Node *T2 = x->right;\n    x->right = y;\n    y->left = T2;\n    y->height = std::max(getHeight(y->left), getHeight(y->right)) + 1;\n    x->height = std::max(getHeight(x->left), getHeight(x->right)) + 1;\n    return x;\n}\n\nNode* leftRotate(Node *x) {\n    Node *y = x->right;\n    Node *T2 = y->left;\n    y->left = x;\n    x->right = T2;\n    x->height = std::max(getHeight(x->left), getHeight(x->right)) + 1;\n    y->height = std::max(getHeight(y->left), getHeight(y->right)) + 1;\n    return y;\n}\n\nint main() {\n    std::cout << \"AVL Rotations Optimal O(log N) Verified!\" << std::endl;\n    return 0;\n}",
  })
  const [activeCodingEditorTab, setActiveCodingEditorTab] = React.useState<"starter" | "solution">("starter")
  const [editorCopied, setEditorCopied] = React.useState<boolean>(false)

  // Socratic Guardrails state
  const [guardrailsState, setGuardrailsState] = React.useState({
    keyInvariants: [
      "Every node height difference <= 1 (|Left Height - Right Height| <= 1)",
      "Standard BST order property holds: Left < Root < Right",
      "Rotations preserve in-order traversal ordering exactly",
    ],
    commonMisconceptions: [
      "Assuming height balance factor is simply subtree size difference instead of depth height",
      "Forgetting to update heights of modified nodes after rotation",
      "Attempting single rotation on zigzag (LR / RL) cases without double rotation",
    ],
    hintsLadder: {
      tier1: "Step back and observe which subtree grew taller. Does this form a straight line (LL/RR) or a zigzag (LR/RL)?",
      tier2: "Inspect the child of the unbalanced node. If the child is right-heavy while the parent is left-heavy, a single rotation cannot restore balance.",
      tier3: "Perform a pre-rotation on the child node first to straighten the zigzag into a straight line, then rotate the parent.",
    },
    zeroSpoilerMode: true,
  })
  const [newInvariantInput, setNewInvariantInput] = React.useState<string>("")
  const [newMisconceptionInput, setNewMisconceptionInput] = React.useState<string>("")

  // Tab 3 state (Users)
  const [isResettingProgress, setIsResettingProgress] = React.useState<boolean>(false)

  // Tab 4 state (Submissions)
  const [submissionsList, setSubmissionsList] = React.useState<any[]>([])
  const [inspectingSubmission, setInspectingSubmission] = React.useState<any | null>(null)
  const [codeCopied, setCodeCopied] = React.useState<boolean>(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Check Permissions: Tutor or Admin only
  const hasAccess =
    currentUser && (currentUser.role === "admin" || currentUser.role === "tutor")

  // Load all relational context lists (Users, Docs, Nodes, Progress, Submissions)
  const loadRelationalContext = React.useCallback(async () => {
    try {
      const [uRes, dRes, nRes, tRes, pRes, sRes] = await Promise.all([
        fetchTableData("users"),
        fetchTableData("knowledge_documents"),
        fetchTableData("roadmap_nodes"),
        fetchTableData("tasks"),
        fetchTableData("user_progress"),
        fetchTableData("code_submissions"),
      ])
      setUsersList(Array.from(new Map((uRes.data || []).map((u: any) => [u.id, u])).values()))
      setDocumentsList(Array.from(new Map((dRes.data || []).map((d: any) => [d.id, d])).values()))
      setNodesList(Array.from(new Map((nRes.data || []).map((n: any) => [n.id, n])).values()))
      setTasksCount((tRes.data || []).length || 45)
      setAllTasksList(Array.from(new Map((tRes.data || []).map((t: any) => [t.id, t])).values()))
      setProgressList(Array.from(new Map((pRes.data || []).map((p: any) => [p.id, p])).values()))
      setSubmissionsList(Array.from(new Map((sRes.data || []).map((s: any) => [s.id, s])).values()))
    } catch {}
  }, [])

  const handleOpenRawInspector = async () => {
    setIsInspectorOpen(true)
    setIsInspecting(true)
    try {
      const res = await inspectRawSupabaseData()
      setInspectorResult(res)
    } catch (err: any) {
      setInspectorResult({
        connected: false,
        error: err?.message || "Failed to inspect Supabase directly.",
        tables: {},
        counts: {},
        audit: {},
      })
    } finally {
      setIsInspecting(false)
    }
  }

  const handleDownloadSnapshot = () => {
    if (!inspectorResult?.tables) return
    const exportPayload = {
      metadata: {
        exported_at: inspectorResult.exportedAt || new Date().toISOString(),
        supabase_url: inspectorResult.endpoint || "https://kcpgwxsibuqgkudgbjgd.supabase.co",
        version: "1.0.0",
        counts: inspectorResult.counts,
      },
      tables: inspectorResult.tables,
      audit: inspectorResult.audit,
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "supabase_snapshot.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast("Downloaded supabase_snapshot.json successfully!")
  }

  // Load active table data
  const loadTableData = React.useCallback(async (tbl: string) => {
    setIsLoadingTable(true)
    try {
      const res = await fetchTableData(tbl)
      const unique = Array.from(new Map((res.data || []).map((r: any) => [r.id, r])).values())
      setTableRows(unique)
      setDataSource(res.source)
    } catch {
      setTableRows([])
    } finally {
      setIsLoadingTable(false)
    }
  }, [])

  // Load Tab 4 Submissions
  const loadSubmissions = React.useCallback(async () => {
    try {
      const res = await fetchTableData("code_submissions")
      const unique = Array.from(new Map((res.data || []).map((s: any) => [s.id, s])).values())
      setSubmissionsList(unique)
    } catch {}
  }, [])

  React.useEffect(() => {
    loadRelationalContext()
  }, [loadRelationalContext])

  React.useEffect(() => {
    if (activeTab === "database") {
      loadTableData(selectedTable)
    } else if (activeTab === "users") {
      loadRelationalContext()
    } else if (activeTab === "submissions") {
      loadSubmissions()
    }
  }, [activeTab, selectedTable, loadTableData, loadRelationalContext, loadSubmissions])

  // Obsolete sync effect superseded by Studio loader

  // Map tra cứu Document ID -> Friendly Document Name
  const docMap = React.useMemo(() => {
    const map: Record<string, string> = {
      "00000005-0000-4000-8000-000000000001": "CS101_DSA_Syllabus_HCMUS.pdf",
      "00000005-0000-4000-8000-000000000002": "CS102_OOP_Cpp_Syllabus_HCMUS.pdf",
      "doc-dsa-syllabus": "CS101_DSA_Syllabus_HCMUS.pdf",
      "doc-oop-syllabus": "CS102_OOP_Cpp_Syllabus_HCMUS.pdf",
      "doc-cs101-hcmus": "CS101_DSA_Syllabus_HCMUS.pdf",
    }
    documentsList.forEach((d) => {
      const name = d.name || d.file_name || d.title
      if (name && d.id) {
        map[String(d.id)] = name
      }
    })
    return map
  }, [documentsList])

  const getNodeDocName = React.useCallback(
    (row: any) => {
      if (!row) return "CS101_DSA_Syllabus_HCMUS.pdf"
      if (row.document_id && docMap[String(row.document_id)]) {
        return docMap[String(row.document_id)]
      }
      const docIdStr = String(row.document_id || "").toLowerCase()
      const rowIdStr = String(row.id || row.node_id || "").toLowerCase()
      if (
        docIdStr.includes("0002") ||
        docIdStr.includes("oop") ||
        rowIdStr.startsWith("oop-")
      ) {
        return "CS102_OOP_Cpp_Syllabus_HCMUS.pdf"
      }
      return "CS101_DSA_Syllabus_HCMUS.pdf"
    },
    [docMap]
  )

  // Helper function to match document IDs across aliases (e.g. doc-dsa-syllabus vs doc-cs101-hcmus)
  const matchDocId = React.useCallback((docA: any, docB: any, rowId?: any) => {
    if (!docB) return true
    if (!docA && rowId) {
      if (String(rowId).startsWith("oop-")) docA = "doc-oop-syllabus"
      else docA = "doc-dsa-syllabus"
    }
    if (!docA) return false
    const a = String(docA).toLowerCase()
    const b = String(docB).toLowerCase()
    if (a === b) return true
    const isDsaA =
      a.includes("dsa") ||
      a.includes("cs101") ||
      a.includes("00000005-0000-4000-8000-000000000001") ||
      a.endsWith("0001")
    const isDsaB =
      b.includes("dsa") ||
      b.includes("cs101") ||
      b.includes("00000005-0000-4000-8000-000000000001") ||
      b.endsWith("0001")
    if (isDsaA && isDsaB) return true
    const isOopA =
      a.includes("oop") ||
      a.includes("cs102") ||
      a.includes("00000005-0000-4000-8000-000000000002") ||
      a.endsWith("0002")
    const isOopB =
      b.includes("oop") ||
      b.includes("cs102") ||
      b.includes("00000005-0000-4000-8000-000000000002") ||
      b.endsWith("0002")
    if (isOopA && isOopB) return true
    return false
  }, [])

  // ==================== CASCADING DROPDOWN 3: AVAILABLE NODES ====================
  const availableNodesForDropdown = React.useMemo(() => {
    if (!selectedDocumentId) return nodesList
    return nodesList.filter((n) => matchDocId(n.document_id, selectedDocumentId, n.id))
  }, [nodesList, selectedDocumentId, matchDocId])

  // Reset node scope if it no longer belongs to newly selected document
  React.useEffect(() => {
    if (
      selectedNodeIdScope &&
      selectedDocumentId &&
      !availableNodesForDropdown.some((n) => String(n.id) === String(selectedNodeIdScope))
    ) {
      setSelectedNodeIdScope("")
    }
  }, [selectedDocumentId, selectedNodeIdScope, availableNodesForDropdown])

  // Context breadcrumb labels
  const selectedUser = usersList.find((u) => String(u.id) === String(selectedUserId))
  const selectedDoc = documentsList.find((d) => String(d.id) === String(selectedDocumentId))
  const selectedNodeObj = nodesList.find((n) => String(n.id) === String(selectedNodeIdScope))

  // Tự động chuyển hướng học viên về /roadmap nếu truy cập nhầm trang /admin
  React.useEffect(() => {
    if (!isInitializing && isAuthenticated && !hasAccess) {
      router.replace("/roadmap")
    }
  }, [isInitializing, isAuthenticated, hasAccess, router])

  // ==================== PEDAGOGICAL INSIGHTS METRICS ====================
  const pedagogicalMetrics = React.useMemo(() => {
    const totalUsers = usersList.length
    const activeStudents = progressList.filter((p) => {
      if (!p.completed_tasks) return false
      if (typeof p.completed_tasks === "object" && p.completed_tasks !== null) {
        return Object.keys(p.completed_tasks).length > 0
      }
      return false
    }).length
    const engagementRate = totalUsers > 0 ? Math.round((activeStudents / totalUsers) * 100) : 0

    const totalDocs = documentsList.length
    const totalNodes = nodesList.length
    const avgNodesPerDoc = totalDocs > 0 ? (totalNodes / totalDocs).toFixed(1) : "0"

    const totalSubs = submissionsList.length
    const passedSubs = submissionsList.filter((s) => s.status === "success").length
    const passRate = totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 100

    // Top Bottleneck Topic calculation: group failed submissions by node_id
    const failureMap: Record<string, { count: number; errorType: string; nodeId: string }> = {}
    submissionsList.forEach((s) => {
      if (s.status !== "success") {
        const nId = s.node_id || (s.task_id ? String(s.task_id).replace(/-task-\d+$/, "") : "unknown")
        if (!failureMap[nId]) {
          failureMap[nId] = {
            count: 0,
            errorType: s.stderr || s.stdout || s.status || "Runtime Error",
            nodeId: nId,
          }
        }
        failureMap[nId].count += 1
      }
    })

    let bottleneckNode: { label: string; failCount: number; errorType: string } | null = null
    const sortedFailures = Object.values(failureMap).sort((a, b) => b.count - a.count)
    if (sortedFailures.length > 0) {
      const top = sortedFailures[0]
      const matchingNode = nodesList.find((n) => n.id === top.nodeId)
      let shortErr = "Runtime Error"
      if (top.errorType.includes("balance_factor")) {
        shortErr = "AVL Balance Invariant Failure"
      } else if (top.errorType.includes("SIGABRT") || top.errorType.includes("Assertion")) {
        shortErr = "Null Pointer / Assertion Failure"
      } else if (top.errorType.includes("SIGSEGV")) {
        shortErr = "Segfault (Memory Access)"
      } else if (top.errorType.length > 28) {
        shortErr = top.errorType.slice(0, 28) + "..."
      } else {
        shortErr = top.errorType
      }

      bottleneckNode = {
        label: matchingNode ? `${matchingNode.short_code || ""} ${matchingNode.label}` : top.nodeId,
        failCount: top.count,
        errorType: shortErr,
      }
    }

    return {
      totalUsers,
      activeStudents,
      engagementRate,
      totalDocs,
      totalNodes,
      avgNodesPerDoc,
      totalSubs,
      passedSubs,
      passRate,
      bottleneckNode,
    }
  }, [usersList, progressList, documentsList, nodesList, submissionsList])

  // ==================== DAG CYCLE DETECTION MEMO ====================
  const dagCycleResult = React.useMemo(() => {
    if (!editingRecord || selectedTable !== "roadmap_nodes") {
      return { hasCycle: false, cyclePath: null, cycleString: null }
    }
    const prereqs = Array.isArray(editingRecord.prerequisites)
      ? editingRecord.prerequisites
      : typeof editingRecord.prerequisites === "string"
      ? (JSON.parse(editingRecord.prerequisites || "[]") as string[])
      : []
    return detectDagCycle(nodesList, editingRecord.id, prereqs)
  }, [editingRecord, selectedTable, nodesList])

  // ==================== 1-CLICK DEMO SCENARIO HANDLERS ====================
  const handleApplyDemoPresetAction = async (presetId: string) => {
    setIsApplyingPreset(true)
    try {
      const res = await applyDemoPreset(presetId)
      showToast(res.message)
      await loadTableData(selectedTable)
      await loadRelationalContext()
    } catch (err: any) {
      showToast(`Error applying preset: ${err?.message || "Failed"}`)
    } finally {
      setIsApplyingPreset(false)
    }
  }

  const handleSwitchToStudent = async () => {
    setIsSwitchingAccount(true)
    try {
      showToast("Switching session to student@offbyone.demo...")
      await login("student@offbyone.demo", "Demo1234")
      window.location.href = "/roadmap"
    } catch (err: any) {
      showToast(`Failed to switch: ${err?.message || "Error"}`)
      setIsSwitchingAccount(false)
    }
  }

  const handleRestoreSeedsAction = async () => {
    if (!window.confirm("Restore original CS101 10 nodes and 30 tasks seeds? This will overwrite local modifications.")) return
    setIsApplyingPreset(true)
    try {
      const res = await restoreDefaultCS101Seed()
      showToast(res.message)
      await loadTableData(selectedTable)
      await loadRelationalContext()
    } catch (err: any) {
      showToast(`Error restoring seeds: ${err?.message || "Failed"}`)
    } finally {
      setIsApplyingPreset(false)
    }
  }

  // Handle Save Record in Drawer
  const handleSaveDrawerRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord) return

    // 1. DAG Cycle Integrity Check
    if (selectedTable === "roadmap_nodes" && dagCycleResult.hasCycle) {
      showToast(`DAG Integrity Error: Circular dependency detected: ${dagCycleResult.cycleString}`)
      return
    }

    // 2. Validate JSON fields
    for (const [key, val] of Object.entries(editingRecord)) {
      if (typeof val === "string" && (val.trim().startsWith("{") || val.trim().startsWith("["))) {
        try {
          JSON.parse(val)
        } catch {
          setJsonErrors((prev) => ({ ...prev, [key]: "Invalid JSON format" }))
          return
        }
      }
    }

    const payload = { ...editingRecord }
    // Parse JSON strings back to objects where needed
    for (const [key, val] of Object.entries(payload)) {
      if (typeof val === "string" && (val.trim().startsWith("{") || val.trim().startsWith("["))) {
        try {
          payload[key] = JSON.parse(val)
        } catch {}
      }
    }

    await saveRecord(selectedTable, payload)
    showToast(`Updated record in Supabase [${selectedTable}] successfully!`)
    setEditingRecord(null)
    loadTableData(selectedTable)
    loadRelationalContext()
  }

  // Handle Delete Record
  const handleDeleteRow = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete record ${id}?`)) return
    await deleteRecord(selectedTable, id)
    showToast(`Deleted record ${id} from ${selectedTable}!`)
    loadTableData(selectedTable)
    loadRelationalContext()
  }

  // ==================== COURSE & LESSON STUDIO HOOKS & LOGIC ====================
  // Check DAG cycle in real-time for curriculum studio node
  const curriculumDagCycle = React.useMemo(() => {
    return detectDagCycle(nodesList, curriculumNodeId, nodeMeta.prerequisites)
  }, [nodesList, curriculumNodeId, nodeMeta.prerequisites])

  // Scoped nodes for active document in studio
  const studioDocNodes = React.useMemo(() => {
    return nodesList.filter((n) => matchDocId(n.document_id, curriculumDocId, n.id))
  }, [nodesList, curriculumDocId, matchDocId])

  // Keep curriculumNodeId valid when active document changes
  React.useEffect(() => {
    if (!studioDocNodes.length) return
    const exists = studioDocNodes.some((n) => n.id === curriculumNodeId)
    if (!exists) {
      setCurriculumNodeId(studioDocNodes[0].id)
    }
  }, [curriculumDocId, studioDocNodes, curriculumNodeId])

  // Populate Course & Lesson Studio when curriculumNodeId changes
  React.useEffect(() => {
    if (!curriculumNodeId || !nodesList.length) return
    const node = nodesList.find((n) => n.id === curriculumNodeId) || nodesList[0]
    if (!node) return

    const socraticProf = node.socratic_profile || {}
    const prereqs = Array.isArray(node.prerequisites) ? node.prerequisites : []

    setNodeMeta({
      label: node.label || "Untitled Node",
      shortCode: node.short_code || node.shortCode || "01",
      targetComplexity: node.target_complexity || node.complexity || "O(log N)",
      slideReference: socraticProf.primarySlideReference || socraticProf.slideReference || "Slide 14 (PDF)",
      description: node.description || "",
      prerequisites: prereqs,
    })

    const nodeTasks = allTasksList.filter((t) => t.node_id === node.id || t.nodeId === node.id)
    const theoryTask = nodeTasks.find((t) => t.task_type === "theory" || t.type === "theory") || nodeTasks[0]
    const quizTask = nodeTasks.find((t) => t.task_type === "quiz" || t.type === "quiz") || nodeTasks[1]
    const codingTask = nodeTasks.find((t) => t.task_type === "coding" || t.type === "coding") || nodeTasks[2]

    const fallbackMock: any = (WORKSPACE_TASK_DETAILS as any)[node.id] || {}
    const fbTheory = fallbackMock[`${node.id}-task-1`] || fallbackMock.task1 || {}
    const fbQuiz = fallbackMock[`${node.id}-task-2`] || fallbackMock.task2 || {}
    const fbCoding = fallbackMock[`${node.id}-task-3`] || fallbackMock.task3 || {}

    // Populate Theory
    const tContent = theoryTask?.content || {}
    setTheoryState({
      headerTitle: tContent.headerTitle || theoryTask?.title || fbTheory.headerTitle || `CORE THEORY: ${(node.label || "CONCEPT").toUpperCase()}`,
      summaryLead: tContent.summaryLead || theoryTask?.description || fbTheory.summaryLead || node.description || "",
      complexityStrip: tContent.complexityStrip || {
        best: node.target_complexity || "O(log N)",
        average: node.target_complexity || "O(log N)",
        worst: node.target_complexity || "O(log N)",
        space: "O(N)",
      },
      invariantsList: tContent.invariantsList || tContent.cards || fbTheory.cards || [
        { id: "1", title: `${node.label} Core Property`, tag: "Invariant", detail: `In-depth structural property of ${node.label} preserving balanced access times.` },
        { id: "2", title: "Time Complexity Bound", tag: "Big-O", detail: `Target complexity bounded to ${node.target_complexity || "O(log N)"}.` },
      ],
      snippetTitle: tContent.snippetTitle || tContent.snippet?.title || fbTheory.cards?.[0]?.title || "C++ Structural Reference",
      snippetCode: tContent.snippetCode || tContent.snippet?.code || fbCoding.initialCode || `// C++ Reference for ${node.label}\n#include <iostream>\n\nint main() {\n    return 0;\n}`,
      socraticCheck: tContent.socraticCheck || fbTheory.socraticCheck || "Notice how the structural invariant depends on local pointers. Why do local updates restore global balance?",
      showLivePreview: false,
    })

    // Populate Quiz
    const qContent = quizTask?.content || {}
    if (Array.isArray(qContent.questions) && qContent.questions.length > 0) {
      setQuizQuestions(qContent.questions)
    } else if (Array.isArray(fbQuiz.options)) {
      const correctIdx = Math.max(0, fbQuiz.options.findIndex((o: any) => o.isCorrect))
      setQuizQuestions([
        {
          id: "q1",
          prompt: qContent.questionPrompt || fbQuiz.questionPrompt || `What is the primary structural invariant of ${node.label}?`,
          options: fbQuiz.options.map((o: any) => o.text || String(o)),
          correctIndex: correctIdx,
          explanation: fbQuiz.hints?.correct || "Satisfies structural balance invariants in worst-case analysis.",
          socraticHint: fbQuiz.hints?.incorrect || "Review how height delta influences pointer traversal length.",
        },
        {
          id: "q2",
          prompt: `What is the worst-case time complexity of search operations in ${node.label}?`,
          options: [node.target_complexity || "O(log N)", "O(N)", "O(N^2)", "O(1)"],
          correctIndex: 0,
          explanation: `Because height variance is strictly bounded, worst-case lookup is ${node.target_complexity || "O(log N)"}.`,
          socraticHint: "Relate the maximum possible depth of the tree to the number of nodes N.",
        },
        {
          id: "q3",
          prompt: `Which operation is required when an insertion violates the invariant of ${node.label}?`,
          options: ["Local Pointer Restructuring / Rebalancing", "Complete tree rebuilding from scratch", "Reallocating entire memory buffer", "No operation needed"],
          correctIndex: 0,
          explanation: "Local tree rotations or pointer swaps restore the structural invariant in O(1) time.",
          socraticHint: "Can we restore height balance locally without traversing the entire tree?",
        },
      ])
    }

    // Populate Coding
    const cContent = codingTask?.content || {}
    setCodingState({
      taskTitle: cContent.taskTitle || codingTask?.title || fbCoding.headerTitle || `Implement ${node.label} Operations`,
      difficulty: cContent.difficulty || "Medium",
      problemStatement: cContent.problemStatement || codingTask?.description || "Implement core algorithm and verify all edge invariants under strict time constraints.",
      inputFormat: cContent.inputFormat || "Standard algorithmic inputs via STDIN.",
      outputFormat: cContent.outputFormat || "Formatted traversal or validation output to STDOUT.",
      testCases: cContent.testCases || [
        { id: "tc-1", label: "Sample Ascending Inputs", input: "[10, 20, 30]", expected: "Balanced Root: 20", isHidden: false },
        { id: "tc-2", label: "Sample Descending Inputs", input: "[30, 20, 10]", expected: "Balanced Root: 20", isHidden: false },
        { id: "tc-3", label: "Hidden Edge Stress Test", input: "[5, 1, 9, 3, 7, 2]", expected: "Invariants Verified", isHidden: true },
      ],
      starterCode: cContent.starterCode || cContent.initialCode || fbCoding.initialCode || `// Starter Code for ${node.label}\n#include <iostream>\n\nint main() {\n    std::cout << "${node.label} Ready!" << std::endl;\n    return 0;\n}`,
      solutionCode: cContent.solutionCode || fbCoding.initialCode || `// Reference Solution for ${node.label}\n#include <iostream>\n\nint main() {\n    std::cout << "${node.label} Solved!" << std::endl;\n    return 0;\n}`,
    })

    // Populate Guardrails
    setGuardrailsState({
      keyInvariants: socraticProf.keyInvariants || [
        `Height difference bounded by 1 for all subtrees`,
        `Preserves in-order traversal ordering`,
      ],
      commonMisconceptions: socraticProf.misconceptions || [
        `Confusing node height with subtree node count`,
        `Missing pointer updates on root replacement`,
      ],
      hintsLadder: socraticProf.progressiveHints || {
        tier1: "Step back and observe which subtree grew taller. Does this form a straight line or a zigzag?",
        tier2: "Inspect the child of the unbalanced node. If the child is right-heavy while the parent is left-heavy, a single rotation cannot restore balance.",
        tier3: "Perform a pre-rotation on the child node first to straighten the zigzag, then rotate the parent.",
      },
      zeroSpoilerMode: socraticProf.strictZeroSpoiler !== false,
    })

    setIsCurriculumDirty(false)
  }, [curriculumNodeId, nodesList, allTasksList, matchDocId])

  // Save Course & Lesson Studio to Supabase and sync Workspace
  const handleSaveCurriculumStudio = async () => {
    if (curriculumDagCycle.hasCycle) {
      showToast(`Cannot save: Circular dependency detected (${curriculumDagCycle.cycleString})!`)
      return
    }

    setIsSavingCurriculum(true)
    try {
      const nodeData = {
        id: curriculumNodeId,
        document_id: curriculumDocId,
        label: nodeMeta.label,
        short_code: nodeMeta.shortCode,
        target_complexity: nodeMeta.targetComplexity,
        description: nodeMeta.description,
        prerequisites: nodeMeta.prerequisites,
        socratic_profile: {
          primarySlideReference: nodeMeta.slideReference,
          keyInvariants: guardrailsState.keyInvariants,
          misconceptions: guardrailsState.commonMisconceptions,
          progressiveHints: guardrailsState.hintsLadder,
          strictZeroSpoiler: guardrailsState.zeroSpoilerMode,
        },
      }

      const tasksList = [
        {
          id: `${curriculumNodeId}-task-1`,
          node_id: curriculumNodeId,
          task_type: "theory",
          title: theoryState.headerTitle,
          description: theoryState.summaryLead,
          sequence_order: 1,
          content: {
            nodeId: curriculumNodeId,
            taskId: `${curriculumNodeId}-task-1`,
            task_type: "theory",
            headerTitle: theoryState.headerTitle,
            summaryLead: theoryState.summaryLead,
            complexityStrip: theoryState.complexityStrip,
            invariantsList: theoryState.invariantsList,
            cards: theoryState.invariantsList,
            snippetTitle: theoryState.snippetTitle,
            snippetCode: theoryState.snippetCode,
            snippet: {
              title: theoryState.snippetTitle,
              code: theoryState.snippetCode,
            },
            socraticCheck: theoryState.socraticCheck,
          },
        },
        {
          id: `${curriculumNodeId}-task-2`,
          node_id: curriculumNodeId,
          task_type: "quiz",
          title: `Quiz: ${nodeMeta.label}`,
          description: quizQuestions[0]?.prompt || "Evaluate comprehension of algorithmic invariants.",
          sequence_order: 2,
          content: {
            nodeId: curriculumNodeId,
            taskId: `${curriculumNodeId}-task-2`,
            task_type: "quiz",
            headerTitle: `Quiz: ${nodeMeta.label}`,
            questions: quizQuestions,
            questionPrompt: quizQuestions[0]?.prompt || "",
            options: (quizQuestions[0]?.options || []).map((txt, idx) => ({
              id: String.fromCharCode(65 + idx),
              text: txt,
              isCorrect: idx === quizQuestions[0]?.correctIndex,
            })),
            hints: {
              correct: quizQuestions[0]?.explanation || "",
              incorrect: quizQuestions[0]?.socraticHint || "",
            },
          },
        },
        {
          id: `${curriculumNodeId}-task-3`,
          node_id: curriculumNodeId,
          task_type: "coding",
          title: codingState.taskTitle,
          description: codingState.problemStatement,
          sequence_order: 3,
          content: {
            nodeId: curriculumNodeId,
            taskId: `${curriculumNodeId}-task-3`,
            task_type: "coding",
            taskTitle: codingState.taskTitle,
            difficulty: codingState.difficulty,
            problemStatement: codingState.problemStatement,
            inputFormat: codingState.inputFormat,
            outputFormat: codingState.outputFormat,
            testCases: codingState.testCases,
            starterCode: codingState.starterCode,
            initialCode: codingState.starterCode,
            solutionCode: codingState.solutionCode,
          },
        },
      ]

      await saveCurriculumNodeAndTasks(curriculumNodeId, nodeData, tasksList)
      setIsCurriculumDirty(false)
      showToast(`Studio saved! Changes for ${nodeMeta.label} are live in Supabase & Workspace.`)
      await loadRelationalContext()
    } catch (err: any) {
      showToast(`Error saving studio: ${err?.message || "Unknown error"}`)
    } finally {
      setIsSavingCurriculum(false)
    }
  }

  // Handle Quick Create New Node
  const handleCreateNewNode = async () => {
    if (!newNodeData.label.trim()) {
      showToast("Node label cannot be empty!")
      return
    }
    const cleanId = newNodeData.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `node-${Date.now()}`
    const newNodeRecord = {
      id: cleanId,
      document_id: curriculumDocId,
      label: newNodeData.label,
      short_code: newNodeData.shortCode || "09",
      target_complexity: newNodeData.targetComplexity || "O(log N)",
      description: newNodeData.description || "",
      prerequisites: [],
      socratic_profile: {
        primarySlideReference: "Slide 01 (PDF)",
      },
    }
    setNodesList((prev) => [...prev, newNodeRecord])
    setCurriculumNodeId(cleanId)
    setIsNewNodeModalOpen(false)
    setIsCurriculumDirty(true)
    showToast(`Created new node "${newNodeData.label}". Configure tasks and click "Save to Database"!`)
  }

  // Handle Demo Student Reset
  const handleResetStudent = async () => {
    setIsResettingProgress(true)
    try {
      await resetDemoStudentProgress()
      showToast("Student progress reset to initial clean state!")
      await loadRelationalContext()
    } finally {
      setIsResettingProgress(false)
    }
  }

  // Handle Quick Node Status Toggle
  const handleToggleNodeStatus = async (nodeId: string, currentStatus: string) => {
    if (!selectedUserId) {
      showToast("Please select a User in the Context Filter first!")
      return
    }
    await toggleUserNodeStatus(selectedUserId, nodeId, currentStatus)
    showToast(`Toggled progress for node ${nodeId}!`)
    loadRelationalContext()
  }

  // ==================== CASCADING HIERARCHICAL FILTER APPLICATION ====================
  const filteredRows = tableRows.filter((row) => {
    // 1. Text Search Filter
    if (tableSearch) {
      const searchLower = tableSearch.toLowerCase()
      const matchesSearch = Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }

    // 2. Cascading Relational Filter
    if (selectedTable === "knowledge_documents") {
      if (selectedUserId) {
        const matchesUser =
          String(row.user_id) === String(selectedUserId) ||
          String(row.uploaded_by || "").toLowerCase() === String(selectedUser?.email || "").toLowerCase() ||
          row.user_id === "shared"
        if (!matchesUser) return false
      }
      if (selectedDocumentId) {
        if (!matchDocId(row.id, selectedDocumentId)) return false
      }
    }

    if (selectedTable === "roadmap_nodes") {
      if (selectedDocumentId) {
        if (!matchDocId(row.document_id, selectedDocumentId, row.id)) return false
      }
      if (selectedNodeIdScope) {
        if (String(row.id) !== String(selectedNodeIdScope)) return false
      }
    }

    if (selectedTable === "tasks") {
      if (selectedDocumentId) {
        if (!matchDocId(row.document_id, selectedDocumentId, row.node_id || row.id)) return false
      }
      if (selectedNodeIdScope) {
        if (String(row.node_id) !== String(selectedNodeIdScope)) return false
      }
    }

    if (selectedTable === "user_progress") {
      if (selectedUserId) {
        if (String(row.user_id) !== String(selectedUserId)) return false
      }
    }

    if (selectedTable === "code_submissions") {
      if (selectedUserId) {
        if (String(row.user_id) !== String(selectedUserId)) return false
      }
      if (selectedDocumentId) {
        if (row.document_id && !matchDocId(row.document_id, selectedDocumentId)) return false
      }
      if (selectedNodeIdScope) {
        if (
          row.node_id &&
          String(row.node_id) !== String(selectedNodeIdScope) &&
          !String(row.task_id).startsWith(selectedNodeIdScope)
        ) {
          return false
        }
      }
    }

    return true
  })

  // Open New Record with auto-filled Foreign Keys
  const handleOpenNewRecord = () => {
    const initialRecord: Record<string, any> = { id: "" }
    if (selectedTable === "roadmap_nodes") {
      initialRecord.document_id = selectedDocumentId || "doc-cs101-hcmus"
      initialRecord.short_code = "11"
      initialRecord.label = "New Node"
      initialRecord.complexity = "O(N)"
      initialRecord.sequence_order = filteredRows.length + 1
      initialRecord.prerequisites = []
      initialRecord.socratic_profile = { conceptArchetype: "New Concept" }
    } else if (selectedTable === "tasks") {
      initialRecord.node_id = selectedNodeIdScope || "avl-tree"
      initialRecord.document_id = selectedDocumentId || "doc-cs101-hcmus"
      initialRecord.task_type = "theory"
      initialRecord.title = "New Task"
      initialRecord.sequence_order = 1
      initialRecord.content = {}
    } else if (selectedTable === "knowledge_documents") {
      initialRecord.course_code = "CS104"
      initialRecord.title = "New Syllabus Document"
      initialRecord.file_name = "CS104_New_Course.pdf"
      initialRecord.file_size = "2.1 MB"
      initialRecord.user_id = selectedUserId || "user-demo-student-01"
      initialRecord.uploaded_by = selectedUser?.email || "student@offbyone.demo"
      initialRecord.linked_nodes_count = 10
      initialRecord.content = { totalPages: 40, status: "indexed" }
    }
    setEditingRecord(initialRecord)
    setIsNewRecord(true)
    setJsonErrors({})
  }

  // ==================== 403 ACCESS DENIED GUARD (ĐẶT SAU TẤT CẢ CÁC HOOKS) ====================
  if (!isInitializing && (!isAuthenticated || !hasAccess)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#16161e] p-6 text-center text-[#c0caf5]">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 shadow-2xl">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
          403 Access Denied
        </h1>
        <p className="mt-2 text-sm text-[#7aa2f7] font-semibold">
          Admin or Tutor Privileges Required
        </p>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-[#565f89]">
          Your current session ({currentUser?.email || "anonymous"}) does not have
          administrative clearance. Only verified Tutors and Admins can access
          the Database & Content Console.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/roadmap"
            className="flex items-center gap-2 rounded-lg bg-[#7aa2f7] px-4 py-2 text-xs font-semibold text-[#16161e] transition-transform hover:scale-105"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Roadmap</span>
          </Link>
          <button
            onClick={() => {
              logout()
              router.push("/auth")
            }}
            className="rounded-lg border border-[#292e42] bg-[#1a1b26] px-4 py-2 text-xs font-semibold text-[#c0caf5] hover:bg-[#24283b]"
          >
            Switch Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#16161e] font-sans text-[#c0caf5] select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-[200] flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-2.5 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-[#24283b] bg-[#1a1b26]/90">
        {/* Brand Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#24283b] px-4">
          <BrandLogo size="sm" priority />
          <span className="flex items-center gap-1 rounded-full border border-[#bb9af7]/40 bg-[#bb9af7]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#bb9af7]">
            <Shield className="size-3" />
            CONSOLE
          </span>
        </div>

        {/* Top Action Button: Switch to Student Demo (Admin) or Back to Roadmap (Tutor) */}
        <div className="p-3">
          {currentUser?.role === "admin" ? (
            <button
              type="button"
              onClick={handleSwitchToStudent}
              disabled={isSwitchingAccount}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#7aa2f7]/50 bg-[#7aa2f7]/15 px-3 py-2 text-xs font-semibold text-[#7aa2f7] transition-all hover:border-[#7aa2f7] hover:bg-[#7aa2f7]/25 shadow-sm disabled:opacity-50"
              title="Switch session to student@offbyone.demo and open Roadmap"
            >
              {isSwitchingAccount ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserCheck className="size-3.5 text-[#7aa2f7]" />
              )}
              <span>Switch to Student Demo</span>
            </button>
          ) : (
            <Link
              href="/roadmap"
              className="flex w-full items-center gap-2 rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-2 text-xs font-semibold text-[#7aa2f7] transition-colors hover:border-[#7aa2f7]/50 hover:bg-[#7aa2f7]/10"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Roadmap</span>
            </Link>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-1 px-3">
          <button
            onClick={() => setActiveTab("database")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
              activeTab === "database"
                ? "border border-[#7aa2f7]/40 bg-[#7aa2f7]/15 text-[#7aa2f7] font-bold shadow-sm"
                : "text-[#565f89] hover:bg-[#24283b]/60 hover:text-[#c0caf5]"
            }`}
          >
            <Database className="size-4" />
            <span>Database Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab("curriculum")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
              activeTab === "curriculum"
                ? "border border-[#bb9af7]/40 bg-[#bb9af7]/15 text-[#bb9af7] font-bold shadow-sm"
                : "text-[#565f89] hover:bg-[#24283b]/60 hover:text-[#c0caf5]"
            }`}
          >
            <Layers className="size-4" />
            <span>Curriculum Builder</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
              activeTab === "users"
                ? "border border-[#7dcfff]/40 bg-[#7dcfff]/15 text-[#7dcfff] font-bold shadow-sm"
                : "text-[#565f89] hover:bg-[#24283b]/60 hover:text-[#c0caf5]"
            }`}
          >
            <Users className="size-4" />
            <span>User & Progress Control</span>
          </button>

          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
              activeTab === "submissions"
                ? "border border-[#9ece6a]/40 bg-[#9ece6a]/15 text-[#9ece6a] font-bold shadow-sm"
                : "text-[#565f89] hover:bg-[#24283b]/60 hover:text-[#c0caf5]"
            }`}
          >
            <Terminal className="size-4" />
            <span>Submissions Monitor</span>
          </button>
        </nav>

        {/* Footer Info & Logout */}
        <div className="border-t border-[#24283b] p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] ring-2 ring-purple-400/50">
                <ShieldCheck className="size-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-1.5 ring-[#1a1b26]" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-white">
                  {currentUser?.fullName || "System Admin"}
                </div>
                <div className="text-[10px] font-semibold text-[#bb9af7] uppercase tracking-wider flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentUser?.role || "admin"}
                </div>
              </div>
            </div>
            <ThemeToggleButton />
          </div>

          <button
            type="button"
            onClick={() => {
              logout()
              router.push("/auth")
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:border-rose-500/60 hover:bg-rose-500/20"
          >
            <LogOut className="size-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[#16161e]">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#24283b] bg-[#1a1b26] px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              {activeTab === "database" && "Direct Supabase Database Explorer"}
              {activeTab === "curriculum" && "Curriculum & Task Visual Builder"}
              {activeTab === "users" && "User Roles & Demo Progress Controller"}
              {activeTab === "submissions" && "Real-time Code Submissions & Judge Logs"}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                dataSource === "supabase"
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border border-sky-500/30 bg-sky-500/10 text-sky-400"
              }`}
            >
              {dataSource === "supabase" ? "Supabase Live" : "Local Seed Sync"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 1-Click Demo Presets Popover Dropdown */}
            <div ref={demoMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setDemoMenuOpen((prev) => !prev)}
                disabled={isApplyingPreset}
                className="flex items-center gap-1.5 rounded-lg border border-[#bb9af7]/40 bg-[#bb9af7]/15 px-3 py-1.5 text-xs font-bold text-[#bb9af7] hover:bg-[#bb9af7]/25 transition-all shadow-sm disabled:opacity-50"
              >
                <Sparkles className={`size-3.5 ${isApplyingPreset ? "animate-spin" : ""}`} />
                <span>Demo Presets</span>
                <ChevronDown className={`size-3 transition-transform ${demoMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-[100] w-64 rounded-xl border border-[#292e42] bg-[#1a1b26] p-1.5 shadow-2xl backdrop-blur-md">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-[#565f89] border-b border-[#292e42]/60">
                    Target: student@offbyone.demo
                  </div>
                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDemoMenuOpen(false)
                        handleApplyDemoPresetAction("empty")
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#7dcfff] hover:bg-[#7dcfff]/15 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5" />
                        <span>Preset 1: 0% Empty</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#565f89]">Upload</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDemoMenuOpen(false)
                        handleApplyDemoPresetAction("mid_course")
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#bb9af7] hover:bg-[#bb9af7]/15 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Terminal className="size-3.5" />
                        <span>Preset 2: 67% AVL Bug</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#565f89]">Debug</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDemoMenuOpen(false)
                        handleApplyDemoPresetAction("mastery")
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5" />
                        <span>Preset 3: 100% Mastered</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#565f89]">Done</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#292e42]/60">
                    <button
                      type="button"
                      onClick={() => {
                        setDemoMenuOpen(false)
                        handleRestoreSeedsAction()
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-amber-300 hover:bg-amber-500/15 transition-colors"
                    >
                      <RefreshCw className="size-3.5" />
                      <span>Restore CS101 Seed</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeTab === "database" && (
              <button
                onClick={handleOpenNewRecord}
                className="flex items-center gap-1.5 rounded-lg border border-[#7aa2f7]/50 bg-[#7aa2f7]/15 px-3 py-1.5 text-xs font-semibold text-[#7aa2f7] hover:bg-[#7aa2f7]/25 transition-colors"
              >
                <Plus className="size-3.5" />
                <span>New Record</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeTab === "database") {
                  loadTableData(selectedTable)
                  loadRelationalContext()
                } else if (activeTab === "users") {
                  loadRelationalContext()
                } else if (activeTab === "submissions") {
                  loadSubmissions()
                }
                showToast("Refreshed all relational tables from Supabase.")
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs font-semibold text-[#c0caf5] hover:border-[#7aa2f7]/50 transition-colors"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh</span>
            </button>

            {/* Supabase Raw Inspector & Snapshot Export Button */}
            <button
              onClick={() => handleOpenRawInspector()}
              className="flex items-center gap-1.5 rounded-lg border border-[#7aa2f7]/40 bg-[#7aa2f7]/15 px-3 py-1.5 text-xs font-semibold text-[#7aa2f7] hover:bg-[#7aa2f7]/25 transition-all shadow-sm"
              title="Audit real Supabase database and export JSON snapshot"
            >
              <Download className="size-3.5" />
              <span>Export Raw DB</span>
            </button>
          </div>
        </header>

        {/* ==================== TAB 1: DATABASE EXPLORER ==================== */}
        {activeTab === "database" && (
          <div className="flex flex-1 flex-col overflow-hidden p-5 space-y-3">
            {/* 1. COMPACT TELEMETRY RIBBON (HEIGHT ~40PX) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
              {/* KPI 1: Users & Active Students */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#292e42] bg-[#1a1b26] px-3.5 py-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="size-4 shrink-0 text-[#7dcfff]" />
                  <span className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider truncate">
                    Learners
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-white">{pedagogicalMetrics.totalUsers}</span>
                  <span className="rounded bg-[#7dcfff]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#7dcfff] border border-[#7dcfff]/30">
                    {pedagogicalMetrics.engagementRate}% Active
                  </span>
                </div>
              </div>

              {/* KPI 2: Indexed RAG Syllabi & Total Nodes */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#292e42] bg-[#1a1b26] px-3.5 py-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="size-4 shrink-0 text-[#bb9af7]" />
                  <span className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider truncate">
                    Syllabi & Nodes
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-white">{pedagogicalMetrics.totalDocs}</span>
                  <span className="text-xs text-[#565f89]">/</span>
                  <span className="font-mono text-xs font-bold text-[#bb9af7]">{pedagogicalMetrics.totalNodes}</span>
                </div>
              </div>

              {/* KPI 3: Code Submission Pass Rate */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#292e42] bg-[#1a1b26] px-3.5 py-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider truncate">
                    C++ Pass Rate
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-xs font-bold text-emerald-400">{pedagogicalMetrics.passRate}%</span>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                    {pedagogicalMetrics.passedSubs}/{pedagogicalMetrics.totalSubs}
                  </span>
                </div>
              </div>

              {/* KPI 4: Top Bottleneck Topic */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[#292e42] bg-[#1a1b26] px-3.5 py-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="size-4 shrink-0 text-red-400" />
                  <span className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider truncate">
                    Bottleneck
                  </span>
                </div>
                <span
                  className="font-mono text-xs font-bold text-red-300 truncate max-w-[130px]"
                  title={pedagogicalMetrics.bottleneckNode ? `${pedagogicalMetrics.bottleneckNode.label} (${pedagogicalMetrics.bottleneckNode.errorType})` : "All Passing"}
                >
                  {pedagogicalMetrics.bottleneckNode ? pedagogicalMetrics.bottleneckNode.label : "0 Errors"}
                </span>
              </div>
            </div>

            {/* 2. UNIFIED TABLE CONTAINER (TABLE TABS + COMPACT SCOPE FILTER + DATA GRID) */}
            <div className="rounded-xl border border-[#292e42] bg-[#1a1b26]/60 flex-1 flex flex-col min-h-0 overflow-hidden shadow-lg">
              {/* Tầng 1: Table Segmented Tabs & Search Bar */}
              <div className="border-b border-[#292e42] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#1a1b26] shrink-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {SUPPORTED_TABLES.map((tbl) => {
                    let count = 0
                    if (tbl === "users") count = usersList.length
                    else if (tbl === "knowledge_documents") count = documentsList.length
                    else if (tbl === "roadmap_nodes") count = nodesList.length
                    else if (tbl === "user_progress") count = progressList.length
                    else if (tbl === "code_submissions") count = submissionsList.length
                    else if (selectedTable === tbl) count = tableRows.length

                    return (
                      <button
                        key={tbl}
                        onClick={() => setSelectedTable(tbl)}
                        className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          selectedTable === tbl
                            ? "border border-[#7aa2f7] bg-[#7aa2f7] text-[#16161e] shadow-sm font-bold"
                            : "border border-[#292e42] bg-[#16161e] text-[#7aa2f7] hover:bg-[#24283b] hover:text-white"
                        }`}
                      >
                        <span>{tbl}</span>
                        {count > 0 && (
                          <span
                            className={`rounded px-1 text-[10px] ${
                              selectedTable === tbl ? "bg-[#16161e]/20 text-[#16161e]" : "bg-[#24283b] text-[#565f89]"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="relative w-56 shrink-0">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-[#565f89]" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search in table..."
                    className="w-full rounded-lg border border-[#292e42] bg-[#16161e] py-1.5 pr-3 pl-8 text-xs text-white placeholder:text-[#565f89] focus:border-[#7aa2f7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Tầng 2: Compact Scope Filter Bar (All on Single Row) */}
              <div className="border-b border-[#292e42] px-4 py-2 bg-[#16161e]/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Dropdown 1: User Scope */}
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 text-[#7dcfff]" />
                    <span className="text-[11px] font-semibold text-[#565f89]">User:</span>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="h-7 rounded-md border border-[#292e42] bg-[#16161e] px-2 text-xs font-semibold text-white focus:border-[#7dcfff] focus:outline-none max-w-[190px] truncate"
                    >
                      <option value="">All Users ({usersList.length})</option>
                      {usersList.map((u) => (
                        <option key={String(u.id)} value={String(u.id)}>
                          {String(u.full_name || u.fullName || u.email || "User")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="h-3.5 w-px bg-[#292e42]" />

                  {/* Dropdown 2: Document Scope */}
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3.5 text-[#bb9af7]" />
                    <span className="text-[11px] font-semibold text-[#565f89]">Doc:</span>
                    <select
                      value={selectedDocumentId}
                      onChange={(e) => {
                        setSelectedDocumentId(e.target.value)
                        setSelectedNodeIdScope("")
                      }}
                      className="h-7 rounded-md border border-[#292e42] bg-[#16161e] px-2 text-xs font-semibold text-white focus:border-[#bb9af7] focus:outline-none max-w-[210px] truncate"
                    >
                      <option value="">All Docs ({documentsList.length})</option>
                      {documentsList.map((d) => {
                        const docLabel =
                          d.name ||
                          d.file_name ||
                          d.title ||
                          docMap[String(d.id)] ||
                          (String(d.id).includes("0002") || String(d.id).includes("oop")
                            ? "CS102_OOP_Cpp_Syllabus_HCMUS.pdf"
                            : "CS101_DSA_Syllabus_HCMUS.pdf")
                        return (
                          <option key={String(d.id)} value={String(d.id)}>
                            {docLabel}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div className="h-3.5 w-px bg-[#292e42]" />

                  {/* Dropdown 3: Node Scope */}
                  <div className="flex items-center gap-1.5">
                    <Layers className="size-3.5 text-[#7aa2f7]" />
                    <span className="text-[11px] font-semibold text-[#565f89]">Node:</span>
                    <select
                      value={selectedNodeIdScope}
                      onChange={(e) => setSelectedNodeIdScope(e.target.value)}
                      className="h-7 rounded-md border border-[#292e42] bg-[#16161e] px-2 text-xs font-semibold text-white focus:border-[#7aa2f7] focus:outline-none max-w-[190px] truncate"
                    >
                      <option value="">All Nodes ({availableNodesForDropdown.length})</option>
                      {availableNodesForDropdown.map((n) => (
                        <option key={String(n.id)} value={String(n.id)}>
                          {String(n.short_code || n.shortCode || "")} - {String(n.label || n.id || "")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reset Filters button */}
                {(selectedUserId || selectedDocumentId || selectedNodeIdScope) && (
                  <button
                    onClick={() => {
                      setSelectedUserId("")
                      setSelectedDocumentId("")
                      setSelectedNodeIdScope("")
                      showToast("Context filters cleared.")
                    }}
                    className="flex items-center gap-1 rounded-md bg-[#24283b] h-7 px-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors border border-red-500/30 shrink-0"
                    title="Clear Active Filters"
                  >
                    <X className="size-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Tầng 3: Data Grid (Takes up maximum height) */}
              <div className="flex-1 overflow-auto">
              {isLoadingTable ? (
                <div className="flex h-64 items-center justify-center gap-2 text-xs text-[#565f89]">
                  <Loader2 className="size-4 animate-spin text-[#7aa2f7]" />
                  <span>Loading table rows from Supabase...</span>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-xs text-[#565f89]">
                  <Database className="size-8 text-[#292e42] mb-2" />
                  <span>No matching records in table `{selectedTable}` for current scope.</span>
                  {(selectedUserId || selectedDocumentId || selectedNodeIdScope) && (
                    <button
                      onClick={() => {
                        setSelectedUserId("")
                        setSelectedDocumentId("")
                        setSelectedNodeIdScope("")
                      }}
                      className="mt-3 text-xs text-[#7aa2f7] hover:underline"
                    >
                      Clear context filters to see all records
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 border-b border-[#292e42] bg-[#16161e] font-mono text-[11px] font-semibold text-[#7aa2f7] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">ID</th>

                      {/* Specialized Columns per Table */}
                      {selectedTable === "knowledge_documents" && (
                        <>
                          <th className="px-4 py-3">FILE_NAME</th>
                          <th className="px-4 py-3">OWNER / USER</th>
                          <th className="px-4 py-3">LINKED NODES</th>
                          <th className="px-4 py-3">FILE_SIZE</th>
                        </>
                      )}

                      {selectedTable === "roadmap_nodes" && (
                        <>
                          <th className="px-4 py-3">CODE</th>
                          <th className="px-4 py-3">LABEL</th>
                          <th className="px-4 py-3">DOCUMENT</th>
                          <th className="px-4 py-3">COMPLEXITY</th>
                          <th className="px-4 py-3">USER PROGRESS</th>
                        </>
                      )}

                      {selectedTable === "tasks" && (
                        <>
                          <th className="px-4 py-3">NODE</th>
                          <th className="px-4 py-3">DOCUMENT</th>
                          <th className="px-4 py-3">TYPE</th>
                          <th className="px-4 py-3">TITLE</th>
                        </>
                      )}

                      {/* Fallback general columns for other tables */}
                      {selectedTable !== "knowledge_documents" &&
                        selectedTable !== "roadmap_nodes" &&
                        selectedTable !== "tasks" &&
                        Object.keys(filteredRows[0] || {})
                          .filter((k) => k !== "id")
                          .slice(0, 4)
                          .map((col) => (
                            <th key={col} className="px-4 py-3">
                              {col}
                            </th>
                          ))}

                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#292e42]/50 font-sans">
                    {filteredRows.map((row) => {
                      // Resolve relational fields
                      const linkedDoc = documentsList.find((d) => String(d.id) === String(row.document_id))
                      const linkedNode = nodesList.find((n) => String(n.id) === String(row.node_id))
                      const userProg = progressList.find((p) => String(p.user_id) === String(selectedUserId))

                      // User progress calculations on Roadmap Node
                      let nodeStatus = "locked"
                      let nodeDoneCount = 0
                      if (userProg && userProg.completed_tasks) {
                        const tKeys = [`${row.id}-task-1`, `${row.id}-task-2`, `${row.id}-task-3`]
                        tKeys.forEach((k) => {
                          if (userProg.completed_tasks[k]) nodeDoneCount++
                        })
                        if (nodeDoneCount === 3) nodeStatus = "completed"
                        else if (nodeDoneCount > 0) nodeStatus = "current"
                      }

                      return (
                        <tr
                          key={String(row.id)}
                          className="transition-colors hover:bg-[#24283b]/40"
                        >
                          <td className="px-4 py-3 font-mono text-[11px] text-[#bb9af7] font-semibold whitespace-nowrap">
                            {String(row.id)}
                          </td>

                          {/* ==================== SPECIALIZED ROW: KNOWLEDGE DOCUMENTS ==================== */}
                          {selectedTable === "knowledge_documents" && (
                            <>
                              <td className="px-4 py-3 font-semibold text-white max-w-[220px] truncate">
                                {String(
                                  row.name ||
                                    row.file_name ||
                                    row.title ||
                                    docMap[String(row.id)] ||
                                    (String(row.id).includes("0002") || String(row.id).includes("oop")
                                      ? "CS102_OOP_Cpp_Syllabus_HCMUS.pdf"
                                      : "CS101_DSA_Syllabus_HCMUS.pdf")
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 rounded bg-[#7aa2f7]/15 px-2 py-0.5 font-mono text-[10px] text-[#7aa2f7] border border-[#7aa2f7]/30">
                                  <User className="size-2.5" />
                                  <span>{String(row.uploaded_by || row.user_id || "Shared Doc")}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 rounded bg-cyan/15 px-2 py-0.5 font-mono text-[10px] text-cyan border border-cyan/30">
                                  <Layers className="size-2.5" />
                                  <span>{typeof row.linked_nodes_count === "number" ? row.linked_nodes_count : (parseInt(String(row.linked_nodes_count)) || 10)} Nodes</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-[#565f89]">
                                {String(row.file_size || "2.4 MB")}
                              </td>
                            </>
                          )}

                          {/* ==================== SPECIALIZED ROW: ROADMAP NODES ==================== */}
                          {selectedTable === "roadmap_nodes" && (
                            <>
                              <td className="px-4 py-3 font-mono text-[11px] text-cyan">
                                {String(row.short_code || "01")}
                              </td>
                              <td className="px-4 py-3 font-semibold text-white max-w-[170px] truncate">
                                {String(row.label || "")}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="inline-flex items-center gap-1 rounded bg-[#bb9af7]/15 px-2 py-0.5 font-mono text-[10px] text-[#bb9af7] border border-[#bb9af7]/30 max-w-[170px] truncate"
                                  title={getNodeDocName(row)}
                                >
                                  <FileText className="size-2.5 shrink-0" />
                                  <span className="truncate">{getNodeDocName(row)}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-[#9ece6a]">
                                {String(row.target_complexity || row.complexity || "O(1)")}
                              </td>
                              <td className="px-4 py-3">
                                {selectedUserId ? (
                                  <button
                                    onClick={() => handleToggleNodeStatus(row.id, nodeStatus)}
                                    title="Click to cycle status: Locked -> Current -> Completed"
                                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase transition-all hover:scale-105 ${
                                      nodeStatus === "completed"
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        : nodeStatus === "current"
                                        ? "bg-cyan/15 text-cyan border border-cyan/30"
                                        : "bg-[#24283b] text-[#565f89] border border-[#292e42]"
                                    }`}
                                  >
                                    {nodeStatus === "completed" && <Check className="size-2.5" />}
                                    {nodeStatus === "locked" && <Lock className="size-2.5" />}
                                    <span>
                                      {nodeStatus === "completed"
                                        ? "Completed 3/3"
                                        : nodeStatus === "current"
                                        ? `Current ${nodeDoneCount}/3`
                                        : "Locked 0/3"}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="font-mono text-[10px] text-[#565f89]">
                                    (Select User above)
                                  </span>
                                )}
                              </td>
                            </>
                          )}

                          {/* ==================== SPECIALIZED ROW: TASKS ==================== */}
                          {selectedTable === "tasks" && (
                            <>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 rounded bg-[#7aa2f7]/15 px-2 py-0.5 font-mono text-[10px] text-[#7aa2f7] border border-[#7aa2f7]/30 max-w-[130px] truncate">
                                  <Layers className="size-2.5 shrink-0" />
                                  <span className="truncate">{String(linkedNode?.label || (typeof row.node_id === "string" ? row.node_id : ""))}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="inline-flex items-center gap-1 rounded bg-[#24283b] px-2 py-0.5 font-mono text-[10px] text-[#565f89] border border-[#292e42] max-w-[150px] truncate"
                                  title={getNodeDocName(row)}
                                >
                                  <span className="truncate">{getNodeDocName(row)}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                                    row.task_type === "coding"
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : row.task_type === "quiz"
                                      ? "bg-[#bb9af7]/15 text-[#bb9af7]"
                                      : "bg-cyan/15 text-cyan"
                                  }`}
                                >
                                  {String(row.task_type || "")}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#c0caf5] max-w-[180px] truncate font-medium">
                                {String(row.title || "")}
                              </td>
                            </>
                          )}

                          {/* General columns for users, user_progress, code_submissions */}
                          {selectedTable !== "knowledge_documents" &&
                            selectedTable !== "roadmap_nodes" &&
                            selectedTable !== "tasks" &&
                            Object.entries(row)
                              .filter(([k]) => k !== "id")
                              .slice(0, 4)
                              .map(([k, val]: any) => (
                                <td
                                  key={k}
                                  className="px-4 py-3 text-[#c0caf5] max-w-[200px] truncate"
                                >
                                  {typeof val === "object" && val !== null ? (
                                    <span className="rounded bg-[#16161e] px-1.5 py-0.5 font-mono text-[10px] text-cyan border border-[#292e42]">
                                      JSON [{Object.keys(val || {}).length} keys]
                                    </span>
                                  ) : (
                                    String(val ?? "")
                                  )}
                                </td>
                              ))}

                          {/* ==================== ACTIONS COLUMN WITH 1-CLICK DRILL-DOWN ==================== */}
                          <td className="px-4 py-2 text-right whitespace-nowrap space-x-1.5">
                            {/* 1-Click Drill-down from Users table */}
                            {selectedTable === "users" && (
                              <button
                                onClick={() => {
                                  setSelectedUserId(row.id)
                                  setSelectedTable("knowledge_documents")
                                  showToast(`Scoped to documents of user: ${row.email}`)
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-[#7dcfff]/10 h-7 px-2.5 text-xs font-medium text-[#7dcfff] hover:bg-[#7dcfff]/20 border border-[#7dcfff]/30 mr-1 transition-colors"
                              >
                                <span>Filter by User</span>
                                <ArrowRight className="size-3" />
                              </button>
                            )}

                            {/* 1-Click Drill-down from Knowledge Documents table */}
                            {selectedTable === "knowledge_documents" && (
                              <button
                                onClick={() => {
                                  setSelectedDocumentId(row.id)
                                  setSelectedTable("roadmap_nodes")
                                  showToast(`Scoped to roadmap of: ${row.file_name || row.title}`)
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-cyan/10 h-7 px-2.5 text-xs font-medium text-cyan hover:bg-cyan/20 border border-cyan/30 mr-1 transition-colors"
                              >
                                <span>View Roadmap ({typeof row.linked_nodes_count === "number" ? row.linked_nodes_count : (parseInt(String(row.linked_nodes_count)) || 10)})</span>
                                <ArrowRight className="size-3" />
                              </button>
                            )}

                            {/* 1-Click Drill-down from Roadmap Nodes table */}
                            {selectedTable === "roadmap_nodes" && (
                              <button
                                onClick={() => {
                                  setSelectedNodeIdScope(row.id)
                                  if (row.document_id) setSelectedDocumentId(row.document_id)
                                  setSelectedTable("tasks")
                                  showToast(`Scoped to tasks of: ${row.label}`)
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-[#bb9af7]/10 h-7 px-2.5 text-xs font-medium text-[#bb9af7] hover:bg-[#bb9af7]/20 border border-[#bb9af7]/30 mr-1 transition-colors"
                              >
                                <span>View Tasks (3)</span>
                                <ArrowRight className="size-3" />
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                const cloned: Record<string, any> = { ...row }
                                if (selectedTable === "roadmap_nodes") {
                                  cloned.prerequisites = Array.isArray(row.prerequisites)
                                    ? row.prerequisites
                                    : typeof row.prerequisites === "string"
                                    ? JSON.parse(row.prerequisites || "[]")
                                    : []
                                }
                                if (selectedTable === "tasks") {
                                  let parsedContent = row.content
                                  if (typeof parsedContent === "string") {
                                    try {
                                      parsedContent = JSON.parse(parsedContent)
                                    } catch {
                                      parsedContent = {}
                                    }
                                  }
                                  cloned.content =
                                    typeof parsedContent === "object" && parsedContent !== null
                                      ? parsedContent
                                      : {}
                                }
                                for (const [k, v] of Object.entries(cloned)) {
                                  if (
                                    k !== "content" &&
                                    k !== "prerequisites" &&
                                    typeof v === "object" &&
                                    v !== null
                                  ) {
                                    cloned[k] = JSON.stringify(v, null, 2)
                                  }
                                }
                                setEditingRecord(cloned)
                                setIsNewRecord(false)
                                setJsonErrors({})
                                setDrawerTab("visual")
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-[#7aa2f7]/10 h-7 px-2.5 text-xs font-medium text-[#7aa2f7] hover:bg-[#7aa2f7]/20 border border-[#7aa2f7]/30 transition-colors"
                            >
                              <Edit2 className="size-3" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-red-500/10 h-7 px-2.5 text-xs font-medium text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                            >
                              <Trash2 className="size-3" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

        {/* ==================== TAB 2: COURSE & LESSON STUDIO (TOKYO NIGHT UNSLOP) ==================== */}
        {activeTab === "curriculum" && (
          <div className="flex flex-1 flex-col overflow-y-auto p-5 space-y-5">
            {/* 1. TOP TOOLBAR: Document Scope + Node Selector + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                {/* Dropdown 1: Syllabus / Document */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#565f89]">Syllabus / Document:</span>
                  <select
                    value={curriculumDocId}
                    onChange={(e) => {
                      setCurriculumDocId(e.target.value)
                      setIsCurriculumDirty(true)
                    }}
                    className="rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs font-semibold text-[#7aa2f7] focus:border-[#7aa2f7] focus:outline-none"
                  >
                    {documentsList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name || doc.file_name || doc.title || (String(doc.id).includes("0002") ? "CS102_OOP_Cpp_Syllabus_HCMUS.pdf" : "CS101_DSA_Syllabus_HCMUS.pdf")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 2: Select Node (Scoped to active document) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#565f89]">Select Node:</span>
                  <select
                    value={curriculumNodeId}
                    onChange={(e) => setCurriculumNodeId(e.target.value)}
                    className="rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs font-semibold text-white focus:border-[#7aa2f7] focus:outline-none"
                  >
                    {studioDocNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.short_code || n.shortCode || "•"} - {n.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* + New Node Button */}
                <button
                  type="button"
                  onClick={() => setIsNewNodeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#7aa2f7]/40 bg-[#7aa2f7]/10 px-3 py-1.5 text-xs font-semibold text-[#7aa2f7] hover:bg-[#7aa2f7]/20 transition-colors"
                >
                  <Plus className="size-3.5" />
                  <span>New Node</span>
                </button>
              </div>

              {/* Status Badge & Save Button */}
              <div className="flex items-center gap-3">
                {isCurriculumDirty && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved Changes
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveCurriculumStudio}
                  disabled={isSavingCurriculum || curriculumDagCycle.hasCycle}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#bb9af7] px-4 py-1.5 text-xs font-bold text-[#16161e] shadow-md transition-all hover:bg-[#bb9af7]/90 disabled:opacity-50"
                >
                  {isSavingCurriculum ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  <span>Save to Database</span>
                </button>
              </div>
            </div>

            {/* 2. NODE METADATA & VISUAL DAG PREREQUISITES EDITOR */}
            <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#565f89]">Node Label</label>
                  <input
                    type="text"
                    value={nodeMeta.label}
                    onChange={(e) => {
                      setNodeMeta({ ...nodeMeta, label: e.target.value })
                      setIsCurriculumDirty(true)
                    }}
                    className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs text-white focus:border-[#7aa2f7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#565f89]">Short Code</label>
                  <input
                    type="text"
                    value={nodeMeta.shortCode}
                    onChange={(e) => {
                      setNodeMeta({ ...nodeMeta, shortCode: e.target.value })
                      setIsCurriculumDirty(true)
                    }}
                    className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs text-white focus:border-[#7aa2f7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#565f89]">Target Complexity</label>
                  <input
                    type="text"
                    value={nodeMeta.targetComplexity}
                    onChange={(e) => {
                      setNodeMeta({ ...nodeMeta, targetComplexity: e.target.value })
                      setIsCurriculumDirty(true)
                    }}
                    className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs font-mono text-[#7aa2f7] focus:border-[#7aa2f7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#565f89]">Slide PDF Reference</label>
                  <input
                    type="text"
                    value={nodeMeta.slideReference}
                    onChange={(e) => {
                      setNodeMeta({ ...nodeMeta, slideReference: e.target.value })
                      setIsCurriculumDirty(true)
                    }}
                    className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs text-[#c0caf5] focus:border-[#7aa2f7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: DAG Prerequisites Selection & Cycle Banner */}
              <div className="space-y-2 pt-1 border-t border-[#24283b]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider">
                    DAG Prerequisites (Parent Nodes in same document)
                  </span>
                  <span className="text-[10px] text-[#565f89]">
                    {nodeMeta.prerequisites.length} selected
                  </span>
                </div>

                {curriculumDagCycle.hasCycle && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs font-medium text-red-300">
                    <AlertTriangle className="size-4 shrink-0 text-red-400" />
                    <span>
                      DAG Integrity Error: Circular dependency detected in node prerequisites ({curriculumDagCycle.cycleString})! Saving is disabled until fixed.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {studioDocNodes
                    .filter((n) => n.id !== curriculumNodeId)
                    .map((parent) => {
                      const isPrereq = nodeMeta.prerequisites.includes(parent.id)
                      return (
                        <button
                          key={parent.id}
                          type="button"
                          onClick={() => {
                            const next = isPrereq
                              ? nodeMeta.prerequisites.filter((id) => id !== parent.id)
                              : [...nodeMeta.prerequisites, parent.id]
                            setNodeMeta({ ...nodeMeta, prerequisites: next })
                            setIsCurriculumDirty(true)
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                            isPrereq
                              ? "border-[#7aa2f7] bg-[#7aa2f7]/15 text-[#7aa2f7] shadow-sm"
                              : "border-[#292e42] bg-[#16161e] text-[#565f89] hover:border-[#7aa2f7]/40 hover:text-[#c0caf5]"
                          }`}
                        >
                          <span className="font-mono text-[10px] text-[#565f89]">
                            {parent.short_code || parent.shortCode || "•"}
                          </span>
                          <span>{parent.label}</span>
                          {isPrereq && <Check className="size-3 text-[#7aa2f7]" />}
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* 3. LESSON TABS NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-[#24283b] pb-2">
              <button
                type="button"
                onClick={() => setCurriculumActiveTab("theory")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  curriculumActiveTab === "theory"
                    ? "bg-[#7aa2f7] text-[#16161e] shadow-sm font-bold"
                    : "text-[#565f89] hover:bg-[#1a1b26] hover:text-[#c0caf5]"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>Task 1: Core Theory</span>
              </button>

              <button
                type="button"
                onClick={() => setCurriculumActiveTab("quiz")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  curriculumActiveTab === "quiz"
                    ? "bg-[#7aa2f7] text-[#16161e] shadow-sm font-bold"
                    : "text-[#565f89] hover:bg-[#1a1b26] hover:text-[#c0caf5]"
                }`}
              >
                <HelpCircle className="size-3.5" />
                <span>Task 2: Socratic Quiz ({quizQuestions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCurriculumActiveTab("coding")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  curriculumActiveTab === "coding"
                    ? "bg-[#7aa2f7] text-[#16161e] shadow-sm font-bold"
                    : "text-[#565f89] hover:bg-[#1a1b26] hover:text-[#c0caf5]"
                }`}
              >
                <Code2 className="size-3.5" />
                <span>Task 3: C++ Coding Task</span>
              </button>

              <button
                type="button"
                onClick={() => setCurriculumActiveTab("guardrails")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  curriculumActiveTab === "guardrails"
                    ? "bg-[#7aa2f7] text-[#16161e] shadow-sm font-bold"
                    : "text-[#565f89] hover:bg-[#1a1b26] hover:text-[#c0caf5]"
                }`}
              >
                <ShieldCheck className="size-3.5" />
                <span>Task 4: Socratic AI Guardrails</span>
              </button>
            </div>

            {/* 4. CONTENT PANELS (2-COLUMN FULL-WIDTH LAYOUT) */}

            {/* ==================== TAB 1: CORE THEORY (6/6 GRID) ==================== */}
            {curriculumActiveTab === "theory" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full">
                {/* Left Column (6): Theory Specs, Complexity Strip, Invariants */}
                <div className="xl:col-span-6 space-y-4">
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Theory Header Title</label>
                      <input
                        type="text"
                        value={theoryState.headerTitle}
                        onChange={(e) => {
                          setTheoryState({ ...theoryState, headerTitle: e.target.value })
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs font-bold text-white focus:border-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Summary Lead Paragraph</label>
                      <textarea
                        rows={3}
                        value={theoryState.summaryLead}
                        onChange={(e) => {
                          setTheoryState({ ...theoryState, summaryLead: e.target.value })
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-[#c0caf5] leading-relaxed focus:border-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    {/* 4-item Complexity Strip */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider">
                        Operational Complexity Strip
                      </label>
                      <div className="mt-1.5 grid grid-cols-4 gap-2">
                        <div className="rounded-lg border border-[#292e42] bg-[#16161e] p-2 text-center">
                          <span className="text-[10px] text-[#565f89]">Best</span>
                          <input
                            type="text"
                            value={theoryState.complexityStrip.best}
                            onChange={(e) => {
                              setTheoryState({
                                ...theoryState,
                                complexityStrip: { ...theoryState.complexityStrip, best: e.target.value },
                              })
                              setIsCurriculumDirty(true)
                            }}
                            className="mt-0.5 w-full bg-transparent text-center font-mono text-xs text-[#7aa2f7] focus:outline-none"
                          />
                        </div>
                        <div className="rounded-lg border border-[#292e42] bg-[#16161e] p-2 text-center">
                          <span className="text-[10px] text-[#565f89]">Average</span>
                          <input
                            type="text"
                            value={theoryState.complexityStrip.average}
                            onChange={(e) => {
                              setTheoryState({
                                ...theoryState,
                                complexityStrip: { ...theoryState.complexityStrip, average: e.target.value },
                              })
                              setIsCurriculumDirty(true)
                            }}
                            className="mt-0.5 w-full bg-transparent text-center font-mono text-xs text-[#7aa2f7] focus:outline-none"
                          />
                        </div>
                        <div className="rounded-lg border border-[#292e42] bg-[#16161e] p-2 text-center">
                          <span className="text-[10px] text-[#565f89]">Worst</span>
                          <input
                            type="text"
                            value={theoryState.complexityStrip.worst}
                            onChange={(e) => {
                              setTheoryState({
                                ...theoryState,
                                complexityStrip: { ...theoryState.complexityStrip, worst: e.target.value },
                              })
                              setIsCurriculumDirty(true)
                            }}
                            className="mt-0.5 w-full bg-transparent text-center font-mono text-xs text-[#7aa2f7] focus:outline-none"
                          />
                        </div>
                        <div className="rounded-lg border border-[#292e42] bg-[#16161e] p-2 text-center">
                          <span className="text-[10px] text-[#565f89]">Space</span>
                          <input
                            type="text"
                            value={theoryState.complexityStrip.space}
                            onChange={(e) => {
                              setTheoryState({
                                ...theoryState,
                                complexityStrip: { ...theoryState.complexityStrip, space: e.target.value },
                              })
                              setIsCurriculumDirty(true)
                            }}
                            className="mt-0.5 w-full bg-transparent text-center font-mono text-xs text-[#9ece6a] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Structural Invariants List */}
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="size-4 text-[#7aa2f7]" />
                        <h3 className="text-xs font-bold text-white">Structural Invariants & Properties</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextCards = [
                            ...theoryState.invariantsList,
                            {
                              id: String(Date.now()),
                              title: "New Invariant Property",
                              tag: "Invariant",
                              detail: "Describe structural guarantee or bounding property here.",
                            },
                          ]
                          setTheoryState({ ...theoryState, invariantsList: nextCards })
                          setIsCurriculumDirty(true)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7aa2f7] hover:underline"
                      >
                        <Plus className="size-3" />
                        <span>Add Property</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {theoryState.invariantsList.map((card, cIdx) => (
                        <div key={card.id || cIdx} className="rounded-lg border border-[#292e42] bg-[#16161e] p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) => {
                                const next = [...theoryState.invariantsList]
                                next[cIdx] = { ...card, title: e.target.value }
                                setTheoryState({ ...theoryState, invariantsList: next })
                                setIsCurriculumDirty(true)
                              }}
                              className="flex-1 bg-transparent text-xs font-bold text-white focus:outline-none"
                              placeholder="Property Title"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={card.tag}
                                onChange={(e) => {
                                  const next = [...theoryState.invariantsList]
                                  next[cIdx] = { ...card, tag: e.target.value }
                                  setTheoryState({ ...theoryState, invariantsList: next })
                                  setIsCurriculumDirty(true)
                                }}
                                className="w-24 rounded border border-[#292e42] bg-[#1a1b26] px-1.5 py-0.5 text-center text-[10px] font-mono text-[#bb9af7] focus:outline-none"
                                placeholder="Tag"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = theoryState.invariantsList.filter((_, i) => i !== cIdx)
                                  setTheoryState({ ...theoryState, invariantsList: next })
                                  setIsCurriculumDirty(true)
                                }}
                                className="text-[#565f89] hover:text-red-400"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={2}
                            value={card.detail}
                            onChange={(e) => {
                              const next = [...theoryState.invariantsList]
                              next[cIdx] = { ...card, detail: e.target.value }
                              setTheoryState({ ...theoryState, invariantsList: next })
                              setIsCurriculumDirty(true)
                            }}
                            className="w-full rounded border border-[#292e42] bg-[#1a1b26] p-2 text-[11px] text-[#c0caf5] focus:outline-none"
                            placeholder="Detail description..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (6): C++ Reference Snippet Editor, Socratic Check, Live Preview */}
                <div className="xl:col-span-6 space-y-4">
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-2">
                      <div className="flex items-center gap-2">
                        <Code2 className="size-4 text-[#7aa2f7]" />
                        <h3 className="text-xs font-bold text-white">C++ Structural Snippet Reference</h3>
                      </div>
                      <input
                        type="text"
                        value={theoryState.snippetTitle}
                        onChange={(e) => {
                          setTheoryState({ ...theoryState, snippetTitle: e.target.value })
                          setIsCurriculumDirty(true)
                        }}
                        className="rounded border border-[#292e42] bg-[#16161e] px-2 py-0.5 text-xs text-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    <TokyoNightCodeEditor
                      value={theoryState.snippetCode}
                      onChange={(val) => {
                        setTheoryState({ ...theoryState, snippetCode: val })
                        setIsCurriculumDirty(true)
                      }}
                      minHeight="260px"
                    />

                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Socratic Reflection Question</label>
                      <textarea
                        rows={2}
                        value={theoryState.socraticCheck}
                        onChange={(e) => {
                          setTheoryState({ ...theoryState, socraticCheck: e.target.value })
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2 text-xs text-[#7dcfff] focus:border-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#24283b]">
                      <span className="text-xs font-semibold text-[#565f89]">Student Workspace Preview</span>
                      <button
                        type="button"
                        onClick={() => setTheoryState({ ...theoryState, showLivePreview: !theoryState.showLivePreview })}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                          theoryState.showLivePreview ? "bg-[#7aa2f7] text-[#16161e]" : "border border-[#292e42] bg-[#16161e] text-[#c0caf5]"
                        }`}
                      >
                        <Eye className="size-3.5" />
                        <span>{theoryState.showLivePreview ? "Hide Preview" : "Show Live Preview"}</span>
                      </button>
                    </div>

                    {theoryState.showLivePreview && (
                      <div className="mt-3 rounded-xl border border-[#7aa2f7]/40 bg-[#16161e] p-4 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between border-b border-[#292e42] pb-2">
                          <span className="font-mono text-[10px] uppercase text-[#7aa2f7]">{theoryState.headerTitle}</span>
                          <span className="rounded bg-[#7aa2f7]/20 px-2 py-0.5 text-[10px] font-bold text-[#7aa2f7]">Live Theory Card</span>
                        </div>
                        <p className="text-xs text-[#c0caf5] leading-relaxed">{theoryState.summaryLead}</p>
                        <div className="rounded-lg border border-[#7dcfff]/30 bg-[#7dcfff]/5 p-3 text-xs text-[#7dcfff]">
                          <span className="font-bold">Socratic Check: </span>
                          <span>{theoryState.socraticCheck}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 2: SOCRATIC QUIZ (7/5 GRID) ==================== */}
            {curriculumActiveTab === "quiz" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full">
                {/* Left Column (7): Question Pills, Prompt, 4 Options A-D with Radio, Explanation */}
                <div className="xl:col-span-7 space-y-4">
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-4">
                    {/* Question Tabs Header */}
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-3">
                      <div className="flex items-center gap-2">
                        {quizQuestions.map((q, qIdx) => (
                          <button
                            key={q.id || qIdx}
                            type="button"
                            onClick={() => {
                              setActiveQuizIndex(qIdx)
                              setLiveQuizSelectedOption(null)
                              setLiveQuizShowHint(false)
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                              activeQuizIndex === qIdx
                                ? "bg-[#7aa2f7] text-[#16161e] shadow-sm"
                                : "border border-[#292e42] bg-[#16161e] text-[#565f89] hover:text-[#c0caf5]"
                            }`}
                          >
                            Q{qIdx + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newQ = {
                              id: `q${Date.now()}`,
                              prompt: "New quiz inquiry regarding structural algorithmic invariant:",
                              options: ["Option A (Correct)", "Option B", "Option C", "Option D"],
                              correctIndex: 0,
                              explanation: "Explanation on why this invariant holds under all test cases.",
                              socraticHint: "Consider the definition of structural height balance.",
                            }
                            setQuizQuestions([...quizQuestions, newQ])
                            setActiveQuizIndex(quizQuestions.length)
                            setIsCurriculumDirty(true)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#292e42] px-2.5 py-1 text-xs text-[#7aa2f7] hover:border-[#7aa2f7]"
                        >
                          <Plus className="size-3" />
                          <span>Add Question</span>
                        </button>
                      </div>

                      {quizQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = quizQuestions.filter((_, idx) => idx !== activeQuizIndex)
                            setQuizQuestions(next)
                            setActiveQuizIndex(Math.max(0, activeQuizIndex - 1))
                            setIsCurriculumDirty(true)
                          }}
                          className="text-xs text-[#565f89] hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    {/* Active Question Prompt */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">
                        Question {activeQuizIndex + 1} Prompt
                      </label>
                      <textarea
                        rows={3}
                        value={quizQuestions[activeQuizIndex]?.prompt || ""}
                        onChange={(e) => {
                          const next = [...quizQuestions]
                          next[activeQuizIndex] = { ...next[activeQuizIndex], prompt: e.target.value }
                          setQuizQuestions(next)
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-white leading-relaxed focus:border-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    {/* 4 Options A-D with Radio Buttons */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider">
                        Select Options (Click radio to mark Correct Answer)
                      </label>
                      {(quizQuestions[activeQuizIndex]?.options || ["A", "B", "C", "D"]).map((opt, optIdx) => {
                        const isCorrect = quizQuestions[activeQuizIndex]?.correctIndex === optIdx
                        const letter = String.fromCharCode(65 + optIdx)
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
                              isCorrect
                                ? "border-emerald-500/60 bg-emerald-500/10 shadow-sm"
                                : "border-[#292e42] bg-[#16161e]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-q-${activeQuizIndex}`}
                              checked={isCorrect}
                              onChange={() => {
                                const next = [...quizQuestions]
                                next[activeQuizIndex] = { ...next[activeQuizIndex], correctIndex: optIdx }
                                setQuizQuestions(next)
                                setIsCurriculumDirty(true)
                              }}
                              className="size-4 accent-emerald-500 cursor-pointer"
                            />
                            <span className="font-mono text-xs font-bold text-[#7aa2f7]">{letter}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const next = [...quizQuestions]
                                const nextOpts = [...next[activeQuizIndex].options]
                                nextOpts[optIdx] = e.target.value
                                next[activeQuizIndex] = { ...next[activeQuizIndex], options: nextOpts }
                                setQuizQuestions(next)
                                setIsCurriculumDirty(true)
                              }}
                              className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                            />
                            {isCorrect && (
                              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Answer Explanation */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Detailed Answer Explanation</label>
                      <textarea
                        rows={2}
                        value={quizQuestions[activeQuizIndex]?.explanation || ""}
                        onChange={(e) => {
                          const next = [...quizQuestions]
                          next[activeQuizIndex] = { ...next[activeQuizIndex], explanation: e.target.value }
                          setQuizQuestions(next)
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-emerald-300 leading-relaxed focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column (5): Socratic Hint & Live Quiz Card Preview */}
                <div className="xl:col-span-5 space-y-4">
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Question Socratic Hint</label>
                      <textarea
                        rows={3}
                        value={quizQuestions[activeQuizIndex]?.socraticHint || ""}
                        onChange={(e) => {
                          const next = [...quizQuestions]
                          next[activeQuizIndex] = { ...next[activeQuizIndex], socraticHint: e.target.value }
                          setQuizQuestions(next)
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-[#7dcfff] leading-relaxed focus:border-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    <div className="border-t border-[#24283b] pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white">Live Quiz Card Preview</span>
                        <span className="font-mono text-[10px] text-[#7aa2f7]">
                          Q{activeQuizIndex + 1} of {quizQuestions.length}
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#24283b] bg-[#16161e] p-4 space-y-3 shadow-inner">
                        <p className="text-xs font-medium text-white leading-relaxed">
                          {quizQuestions[activeQuizIndex]?.prompt}
                        </p>

                        <div className="space-y-2 pt-1">
                          {(quizQuestions[activeQuizIndex]?.options || []).map((opt, oIdx) => {
                            const isSelected = liveQuizSelectedOption === oIdx
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setLiveQuizSelectedOption(oIdx)}
                                className={`w-full text-left flex items-center gap-2.5 rounded-lg border p-2.5 text-xs transition-all ${
                                  isSelected
                                    ? "border-[#7aa2f7] bg-[#7aa2f7]/20 text-white font-semibold"
                                    : "border-[#292e42] bg-[#1a1b26] text-[#c0caf5] hover:border-[#7aa2f7]/50"
                                }`}
                              >
                                <span className="font-mono text-[11px] text-[#7aa2f7]">{String.fromCharCode(65 + oIdx)}.</span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            )
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setLiveQuizShowHint(!liveQuizShowHint)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7dcfff] hover:underline"
                          >
                            <Sparkles className="size-3" />
                            <span>{liveQuizShowHint ? "Hide Socratic Hint" : "Ask Socratic Tutor"}</span>
                          </button>

                          {liveQuizSelectedOption !== null && (
                            <span className={`text-xs font-bold ${
                              liveQuizSelectedOption === quizQuestions[activeQuizIndex]?.correctIndex
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}>
                              {liveQuizSelectedOption === quizQuestions[activeQuizIndex]?.correctIndex
                                ? "Correct Choice"
                                : "Incorrect Selection"}
                            </span>
                          )}
                        </div>

                        {liveQuizShowHint && (
                          <div className="rounded-lg border border-[#7dcfff]/30 bg-[#7dcfff]/10 p-2.5 text-xs text-[#7dcfff]">
                            <span className="font-bold">Tutor Guidance: </span>
                            <span>{quizQuestions[activeQuizIndex]?.socraticHint}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: C++ CODING TASK (5/7 GRID) ==================== */}
            {curriculumActiveTab === "coding" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full">
                {/* Left Column (5): Problem Specs, Difficulty, Test Suite Builder */}
                <div className="xl:col-span-5 space-y-4">
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-[#565f89]">Task Title</label>
                        <input
                          type="text"
                          value={codingState.taskTitle}
                          onChange={(e) => {
                            setCodingState({ ...codingState, taskTitle: e.target.value })
                            setIsCurriculumDirty(true)
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs font-bold text-white focus:border-[#7aa2f7] focus:outline-none"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-[11px] font-semibold text-[#565f89]">Difficulty</label>
                        <select
                          value={codingState.difficulty}
                          onChange={(e: any) => {
                            setCodingState({ ...codingState, difficulty: e.target.value })
                            setIsCurriculumDirty(true)
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs font-bold text-[#7aa2f7] focus:outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Problem Statement</label>
                      <textarea
                        rows={3}
                        value={codingState.problemStatement}
                        onChange={(e) => {
                          setCodingState({ ...codingState, problemStatement: e.target.value })
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-[#c0caf5] leading-relaxed focus:border-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Input Format</label>
                        <input
                          type="text"
                          value={codingState.inputFormat}
                          onChange={(e) => {
                            setCodingState({ ...codingState, inputFormat: e.target.value })
                            setIsCurriculumDirty(true)
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs text-[#c0caf5] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Output Format</label>
                        <input
                          type="text"
                          value={codingState.outputFormat}
                          onChange={(e) => {
                            setCodingState({ ...codingState, outputFormat: e.target.value })
                            setIsCurriculumDirty(true)
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs text-[#c0caf5] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Test Suite Builder */}
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="size-4 text-[#7aa2f7]" />
                        <h3 className="text-xs font-bold text-white">Test Suite Specifications ({codingState.testCases.length})</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextTc = [
                            ...codingState.testCases,
                            {
                              id: `tc-${Date.now()}`,
                              label: `Test Case ${codingState.testCases.length + 1}`,
                              input: "[1, 2, 3]",
                              expected: "Passed",
                              isHidden: false,
                            },
                          ]
                          setCodingState({ ...codingState, testCases: nextTc })
                          setIsCurriculumDirty(true)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7aa2f7] hover:underline"
                      >
                        <Plus className="size-3" />
                        <span>Add Test Case</span>
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {codingState.testCases.map((tc, tcIdx) => (
                        <div key={tc.id || tcIdx} className="rounded-lg border border-[#292e42] bg-[#16161e] p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={tc.label}
                              onChange={(e) => {
                                const next = [...codingState.testCases]
                                next[tcIdx] = { ...tc, label: e.target.value }
                                setCodingState({ ...codingState, testCases: next })
                                setIsCurriculumDirty(true)
                              }}
                              className="flex-1 bg-transparent text-xs font-bold text-white focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...codingState.testCases]
                                  next[tcIdx] = { ...tc, isHidden: !tc.isHidden }
                                  setCodingState({ ...codingState, testCases: next })
                                  setIsCurriculumDirty(true)
                                }}
                                className={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${
                                  tc.isHidden ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                }`}
                              >
                                {tc.isHidden ? "Hidden Judge" : "Public Sample"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = codingState.testCases.filter((_, i) => i !== tcIdx)
                                  setCodingState({ ...codingState, testCases: next })
                                  setIsCurriculumDirty(true)
                                }}
                                className="text-[#565f89] hover:text-red-400"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-[#565f89]">Input</span>
                              <input
                                type="text"
                                value={tc.input}
                                onChange={(e) => {
                                  const next = [...codingState.testCases]
                                  next[tcIdx] = { ...tc, input: e.target.value }
                                  setCodingState({ ...codingState, testCases: next })
                                  setIsCurriculumDirty(true)
                                }}
                                className="w-full rounded border border-[#292e42] bg-[#1a1b26] p-1.5 font-mono text-[11px] text-[#c0caf5] focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-[#565f89]">Expected Output</span>
                              <input
                                type="text"
                                value={tc.expected}
                                onChange={(e) => {
                                  const next = [...codingState.testCases]
                                  next[tcIdx] = { ...tc, expected: e.target.value }
                                  setCodingState({ ...codingState, testCases: next })
                                  setIsCurriculumDirty(true)
                                }}
                                className="w-full rounded border border-[#292e42] bg-[#1a1b26] p-1.5 font-mono text-[11px] text-[#9ece6a] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (7): Dual-Tab Tokyo Night Code Editor */}
                <div className="xl:col-span-7 space-y-4">
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveCodingEditorTab("starter")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            activeCodingEditorTab === "starter"
                              ? "bg-[#7aa2f7] text-[#16161e] shadow-sm"
                              : "border border-[#292e42] bg-[#16161e] text-[#565f89] hover:text-[#c0caf5]"
                          }`}
                        >
                          Starter Code (C++)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCodingEditorTab("solution")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            activeCodingEditorTab === "solution"
                              ? "bg-[#bb9af7] text-[#16161e] shadow-sm"
                              : "border border-[#292e42] bg-[#16161e] text-[#565f89] hover:text-[#c0caf5]"
                          }`}
                        >
                          Reference Solution (C++)
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const targetText = activeCodingEditorTab === "starter" ? codingState.starterCode : codingState.solutionCode
                            navigator.clipboard.writeText(targetText)
                            setEditorCopied(true)
                            setTimeout(() => setEditorCopied(false), 2000)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs font-semibold text-[#c0caf5] hover:bg-[#24283b]"
                        >
                          {editorCopied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          <span>{editorCopied ? "Copied!" : "Copy"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (activeCodingEditorTab === "starter") {
                              setCodingState({
                                ...codingState,
                                starterCode: "// Starter Code\n#include <iostream>\n\nint main() {\n    return 0;\n}",
                              })
                            } else {
                              setCodingState({
                                ...codingState,
                                solutionCode: "// Reference Solution\n#include <iostream>\n\nint main() {\n    return 0;\n}",
                              })
                            }
                            setIsCurriculumDirty(true)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs font-semibold text-[#565f89] hover:text-white"
                        >
                          <RotateCcw className="size-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    <TokyoNightCodeEditor
                      value={activeCodingEditorTab === "starter" ? codingState.starterCode : codingState.solutionCode}
                      onChange={(val) => {
                        if (activeCodingEditorTab === "starter") {
                          setCodingState({ ...codingState, starterCode: val })
                        } else {
                          setCodingState({ ...codingState, solutionCode: val })
                        }
                        setIsCurriculumDirty(true)
                      }}
                      minHeight="420px"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 4: SOCRATIC AI GUARDRAILS (6/6 GRID) ==================== */}
            {curriculumActiveTab === "guardrails" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full">
                {/* Left Column (6): Key Invariants & Misconceptions Chips */}
                <div className="xl:col-span-6 space-y-4">
                  {/* Key Invariants */}
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-[#7aa2f7]" />
                        <h3 className="text-xs font-bold text-white">Algorithmic Invariants to Enforce</h3>
                      </div>
                      <span className="text-[10px] text-[#565f89]">{guardrailsState.keyInvariants.length} active</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newInvariantInput}
                        onChange={(e) => setNewInvariantInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newInvariantInput.trim()) {
                            setGuardrailsState({
                              ...guardrailsState,
                              keyInvariants: [...guardrailsState.keyInvariants, newInvariantInput.trim()],
                            })
                            setNewInvariantInput("")
                            setIsCurriculumDirty(true)
                          }
                        }}
                        placeholder="Add new invariant to probe..."
                        className="flex-1 rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newInvariantInput.trim()) {
                            setGuardrailsState({
                              ...guardrailsState,
                              keyInvariants: [...guardrailsState.keyInvariants, newInvariantInput.trim()],
                            })
                            setNewInvariantInput("")
                            setIsCurriculumDirty(true)
                          }
                        }}
                        className="rounded-lg bg-[#7aa2f7] px-3 py-1.5 text-xs font-bold text-[#16161e]"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {guardrailsState.keyInvariants.map((inv, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-[#292e42] bg-[#16161e] p-2 text-xs text-[#c0caf5]">
                          <span>{inv}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = guardrailsState.keyInvariants.filter((_, i) => i !== idx)
                              setGuardrailsState({ ...guardrailsState, keyInvariants: next })
                              setIsCurriculumDirty(true)
                            }}
                            className="text-[#565f89] hover:text-red-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Misconceptions */}
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-white">Common Student Misconceptions</h3>
                      </div>
                      <span className="text-[10px] text-[#565f89]">{guardrailsState.commonMisconceptions.length} active</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMisconceptionInput}
                        onChange={(e) => setNewMisconceptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newMisconceptionInput.trim()) {
                            setGuardrailsState({
                              ...guardrailsState,
                              commonMisconceptions: [...guardrailsState.commonMisconceptions, newMisconceptionInput.trim()],
                            })
                            setNewMisconceptionInput("")
                            setIsCurriculumDirty(true)
                          }
                        }}
                        placeholder="Add common pitfall or incorrect mental model..."
                        className="flex-1 rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newMisconceptionInput.trim()) {
                            setGuardrailsState({
                              ...guardrailsState,
                              commonMisconceptions: [...guardrailsState.commonMisconceptions, newMisconceptionInput.trim()],
                            })
                            setNewMisconceptionInput("")
                            setIsCurriculumDirty(true)
                          }
                        }}
                        className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-[#16161e]"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {guardrailsState.commonMisconceptions.map((misc, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-[#292e42] bg-[#16161e] p-2 text-xs text-amber-200">
                          <span>{misc}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = guardrailsState.commonMisconceptions.filter((_, i) => i !== idx)
                              setGuardrailsState({ ...guardrailsState, commonMisconceptions: next })
                              setIsCurriculumDirty(true)
                            }}
                            className="text-[#565f89] hover:text-red-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (6): 3-Tier Progressive Hint Ladder & Zero-Spoiler Mode */}
                <div className="xl:col-span-6 space-y-4">
                  <div className="rounded-xl border border-[#24283b] bg-[#1a1b26] p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#24283b] pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-[#bb9af7]" />
                        <h3 className="text-xs font-bold text-white">3-Tier Progressive Hint Ladder</h3>
                      </div>
                      <span className="text-[10px] text-[#565f89]">Multi-turn Socratic Scaffolding</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#7aa2f7]">
                        Tier 1: Conceptual Probe (Minimal Nudge)
                      </label>
                      <textarea
                        rows={2}
                        value={guardrailsState.hintsLadder.tier1}
                        onChange={(e) => {
                          setGuardrailsState({
                            ...guardrailsState,
                            hintsLadder: { ...guardrailsState.hintsLadder, tier1: e.target.value },
                          })
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-[#c0caf5] leading-relaxed focus:border-[#7aa2f7] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#bb9af7]">
                        Tier 2: Targeted Structural Hint (Directed Focus)
                      </label>
                      <textarea
                        rows={2}
                        value={guardrailsState.hintsLadder.tier2}
                        onChange={(e) => {
                          setGuardrailsState({
                            ...guardrailsState,
                            hintsLadder: { ...guardrailsState.hintsLadder, tier2: e.target.value },
                          })
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-[#c0caf5] leading-relaxed focus:border-[#bb9af7] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#7dcfff]">
                        Tier 3: Boundary / Pseudo-logic Nudge (Specific Invariant)
                      </label>
                      <textarea
                        rows={2}
                        value={guardrailsState.hintsLadder.tier3}
                        onChange={(e) => {
                          setGuardrailsState({
                            ...guardrailsState,
                            hintsLadder: { ...guardrailsState.hintsLadder, tier3: e.target.value },
                          })
                          setIsCurriculumDirty(true)
                        }}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-[#c0caf5] leading-relaxed focus:border-[#7dcfff] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#24283b]">
                      <div>
                        <div className="text-xs font-bold text-white">Strict Zero-Spoiler Policy</div>
                        <div className="text-[11px] text-[#565f89]">AI Tutor will never output direct code solutions without proof of invariants.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGuardrailsState({
                            ...guardrailsState,
                            zeroSpoilerMode: !guardrailsState.zeroSpoilerMode,
                          })
                          setIsCurriculumDirty(true)
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                          guardrailsState.zeroSpoilerMode
                            ? "bg-emerald-500 text-[#16161e]"
                            : "border border-[#292e42] bg-[#16161e] text-[#565f89]"
                        }`}
                      >
                        {guardrailsState.zeroSpoilerMode ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. MODAL: CREATE NEW NODE */}
            {isNewNodeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-2xl border border-[#24283b] bg-[#1a1b26] p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#24283b] pb-3">
                    <h3 className="text-sm font-bold text-white">Create New Curriculum Node</h3>
                    <button
                      type="button"
                      onClick={() => setIsNewNodeModalOpen(false)}
                      className="text-[#565f89] hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Node Label</label>
                      <input
                        type="text"
                        value={newNodeData.label}
                        onChange={(e) => setNewNodeData({ ...newNodeData, label: e.target.value })}
                        placeholder="e.g. Red-Black Tree"
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Short Code</label>
                        <input
                          type="text"
                          value={newNodeData.shortCode}
                          onChange={(e) => setNewNodeData({ ...newNodeData, shortCode: e.target.value })}
                          placeholder="09"
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Target Complexity</label>
                        <input
                          type="text"
                          value={newNodeData.targetComplexity}
                          onChange={(e) => setNewNodeData({ ...newNodeData, targetComplexity: e.target.value })}
                          placeholder="O(log N)"
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs font-mono text-[#7aa2f7] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Description</label>
                      <textarea
                        rows={2}
                        value={newNodeData.description}
                        onChange={(e) => setNewNodeData({ ...newNodeData, description: e.target.value })}
                        placeholder="Brief summary of the data structure or topic..."
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2.5 text-xs text-[#c0caf5] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24283b]">
                    <button
                      type="button"
                      onClick={() => setIsNewNodeModalOpen(false)}
                      className="rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs font-medium text-[#c0caf5] hover:bg-[#24283b]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewNode}
                      className="rounded-lg bg-[#7aa2f7] px-4 py-1.5 text-xs font-bold text-[#16161e] hover:bg-[#7aa2f7]/90"
                    >
                      Create Node
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: USERS & PROGRESS CONTROL ==================== */}
        {activeTab === "users" && (
          <div className="flex flex-1 flex-col overflow-hidden p-6 space-y-4">
            {/* 1-Click Demo Scenario Switcher (Full Control Panel) */}
            <div className="rounded-xl border border-[#292e42] bg-[#1a1b26] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#292e42]/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-[#7aa2f7]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    1-Click Demo Scenario Switcher (Live Supabase & Storage Sync)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestoreSeedsAction}
                    disabled={isApplyingPreset}
                    className="flex items-center gap-1.5 rounded-lg border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs font-medium text-[#c0caf5] hover:border-[#7aa2f7]/50 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`size-3 text-[#565f89] ${isApplyingPreset ? "animate-spin" : ""}`} />
                    <span>Restore CS101 Seed</span>
                  </button>
                  <button
                    onClick={handleResetStudent}
                    disabled={isResettingProgress}
                    className="flex items-center gap-1.5 rounded-lg border border-[#bb9af7]/40 bg-[#bb9af7]/10 px-2.5 py-1 text-xs font-medium text-[#bb9af7] hover:bg-[#bb9af7]/20 transition-colors disabled:opacity-50"
                  >
                    {isResettingProgress ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                    <span>Reset to 0%</span>
                  </button>
                </div>
              </div>

              {/* 3 Preset Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Preset 1 */}
                <div
                  onClick={() => !isApplyingPreset && handleApplyDemoPresetAction("empty")}
                  className="rounded-lg border border-[#292e42] bg-[#16161e] p-3 hover:border-[#7dcfff]/60 hover:bg-[#24283b]/40 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#7dcfff]">Preset 1</span>
                      <span className="rounded bg-[#7dcfff]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#7dcfff] border border-[#7dcfff]/30">0% Empty</span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#7dcfff] transition-colors">Onboarding State</h4>
                    <p className="mt-1 text-[11px] text-[#565f89] leading-relaxed">
                      Clears uploaded syllabus and resets user progress to 0% for demoing the upload & AI roadmap generation workflow.
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#292e42]/40 flex items-center justify-between">
                    <span className="text-[10px] text-[#565f89] font-mono">0/10 Nodes</span>
                    <span className="text-[11px] text-[#7dcfff] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Activate <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>

                {/* Preset 2 */}
                <div
                  onClick={() => !isApplyingPreset && handleApplyDemoPresetAction("mid_course")}
                  className="rounded-lg border border-[#7aa2f7]/40 bg-[#7aa2f7]/5 p-3 hover:border-[#7aa2f7] hover:bg-[#7aa2f7]/10 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#7aa2f7]">Preset 2</span>
                      <span className="rounded bg-[#7aa2f7]/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#7aa2f7] border border-[#7aa2f7]/40">67% AVL Bug</span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#7aa2f7] transition-colors">Mid-Course Socratic Demo</h4>
                    <p className="mt-1 text-[11px] text-[#565f89] leading-relaxed">
                      Unlocks 8/10 nodes. Active at AVL Tree with draft code waiting for pointer rotation fix and 2/3 hints remaining.
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#7aa2f7]/20 flex items-center justify-between">
                    <span className="text-[10px] text-[#7aa2f7] font-mono">8/10 Nodes (21/30 Tasks)</span>
                    <span className="text-[11px] text-[#7aa2f7] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Activate <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>

                {/* Preset 3 */}
                <div
                  onClick={() => !isApplyingPreset && handleApplyDemoPresetAction("mastery")}
                  className="rounded-lg border border-[#292e42] bg-[#16161e] p-3 hover:border-emerald-500/60 hover:bg-[#24283b]/40 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-emerald-400">Preset 3</span>
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">100% Mastered</span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Full Mastery Completion</h4>
                    <p className="mt-1 text-[11px] text-[#565f89] leading-relaxed">
                      Marks all 10 nodes and 30 tasks as completed with full badges, certificates, and perfect scores.
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#292e42]/40 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-mono">10/10 Nodes (30/30 Tasks)</span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Activate <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="flex-1 overflow-auto rounded-xl border border-[#292e42] bg-[#1a1b26]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-[#292e42] bg-[#16161e] font-mono text-[11px] font-semibold text-[#7dcfff] uppercase">
                  <tr>
                    <th className="px-4 py-3">User Email</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Completed Tasks</th>
                    <th className="px-4 py-3">Hints Remaining</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292e42]/50">
                  {usersList.map((user, uIdx) => {
                    const prog = progressList.find(
                      (p) =>
                        String(p.user_id) === String(user.id) ||
                        String(p.user_id) === String(user.email)
                    )

                    // Safely calculate completed tasks count
                    let completedCount = 0
                    if (prog?.completed_tasks) {
                      if (typeof prog.completed_tasks === "object") {
                        completedCount = Object.keys(prog.completed_tasks).length
                      } else if (typeof prog.completed_tasks === "string") {
                        try {
                          const parsed = JSON.parse(prog.completed_tasks)
                          completedCount =
                            typeof parsed === "object" && parsed !== null
                              ? Object.keys(parsed).length
                              : 0
                        } catch {}
                      }
                    }

                    // Safely extract scalar number for hints_remaining
                    let hintsNumber = 3
                    if (
                      prog &&
                      prog.hints_remaining !== undefined &&
                      prog.hints_remaining !== null
                    ) {
                      const hr = prog.hints_remaining
                      if (typeof hr === "number") {
                        hintsNumber = hr
                      } else if (typeof hr === "string" && !isNaN(Number(hr))) {
                        hintsNumber = Number(hr)
                      } else if (typeof hr === "object") {
                        const vals = Object.values(hr)
                        const firstNum = vals.find((v) => typeof v === "number")
                        hintsNumber = typeof firstNum === "number" ? (firstNum as number) : 3
                      }
                    }

                    const userEmail =
                      typeof user?.email === "string" ? user.email : String(user?.email || "")
                    const userFullName =
                      typeof user?.full_name === "string"
                        ? user.full_name
                        : typeof user?.fullName === "string"
                        ? user.fullName
                        : "User"
                    const userRole =
                      typeof user?.role === "string" ? user.role : "student"

                    return (
                      <tr
                        key={String(user.id || userEmail || uIdx)}
                        className="hover:bg-[#24283b]/30"
                      >
                        <td className="px-4 py-3 font-mono text-[11px] text-white">
                          {userEmail}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#c0caf5]">
                          <div className="flex items-center gap-2">
                            {userRole === "admin" && (
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white shadow-sm ring-1 ring-purple-400/40">
                                <ShieldCheck className="size-3.5 text-white" />
                              </div>
                            )}
                            <span>{userFullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={userRole}
                            onChange={async (e) => {
                              await updateUserRole(user.id, e.target.value)
                              showToast(`Updated ${userEmail} role to ${e.target.value}!`)
                              loadRelationalContext()
                            }}
                            className="rounded border border-[#292e42] bg-[#16161e] px-2 py-1 text-xs font-semibold text-[#bb9af7]"
                          >
                            <option value="student">student</option>
                            <option value="tutor">tutor</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 font-mono text-cyan">
                          {userRole === "admin" ? (
                            <span className="text-[#565f89] text-[11px] italic">N/A (Admin)</span>
                          ) : (
                            `${completedCount} tasks`
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-amber-300">
                          {userRole === "admin" ? (
                            <span className="text-[#565f89] text-[11px] italic">—</span>
                          ) : (
                            `${hintsNumber} / 10`
                          )}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap space-x-1.5">
                          {userRole !== "admin" && (
                            <button
                              onClick={async () => {
                                await updateUserHints(user.id, 5)
                                showToast(`Refilled hints to 5 for ${userEmail}!`)
                                loadRelationalContext()
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-[#7dcfff]/40 bg-[#7dcfff]/10 h-7 px-2.5 text-xs font-medium text-[#7dcfff] hover:bg-[#7dcfff]/20 transition-colors"
                            >
                              <span>Refill 5 Hints</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedUserId(user.id)
                              setActiveTab("database")
                              setSelectedTable("knowledge_documents")
                              showToast(`Viewing documents of ${userEmail}`)
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-[#bb9af7]/40 bg-[#bb9af7]/10 h-7 px-2.5 text-xs font-medium text-[#bb9af7] hover:bg-[#bb9af7]/20 transition-colors"
                          >
                            <span>Scope User</span>
                            <ArrowRight className="size-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: SUBMISSIONS MONITOR ==================== */}
        {activeTab === "submissions" && (
          <div className="flex flex-1 flex-col overflow-hidden p-6 space-y-4">
            <div className="flex-1 overflow-auto rounded-xl border border-[#292e42] bg-[#1a1b26]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-[#292e42] bg-[#16161e] font-mono text-[11px] font-semibold text-[#9ece6a] uppercase">
                  <tr>
                    <th className="px-4 py-3">Submission ID</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Task ID</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Runtime</th>
                    <th className="px-4 py-3">Memory</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292e42]/50">
                  {submissionsList.map((sub) => (
                    <tr
                      key={sub.id}
                      onClick={() => setInspectingSubmission(sub)}
                      className="cursor-pointer transition-colors hover:bg-[#24283b]/40"
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-[#9ece6a]">
                        {String(sub.id ?? "")}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#565f89]">
                        {String(sub.user_id ?? "")}
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan">
                        {String(sub.task_id ?? "")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {String(sub.language || "C++")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            sub.status === "success"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {String(sub.status ?? "unknown")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#c0caf5]">
                        {String(sub.runtime_ms ?? 0)}ms
                      </td>
                      <td className="px-4 py-3 font-mono text-[#c0caf5]">
                        {String(sub.memory_mb ?? "0 MB")}
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setInspectingSubmission(sub)
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-[#9ece6a]/10 h-7 px-2.5 text-xs font-medium text-[#9ece6a] hover:bg-[#9ece6a]/20 border border-[#9ece6a]/30 transition-colors"
                        >
                          Inspect Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ==================== RIGHT DRAWER: RECORD EDIT / NEW ==================== */}
      {editingRecord && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-2xl flex-col border-l border-[#292e42] bg-[#1a1b26] p-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#292e42] pb-4">
              <div className="flex items-center gap-3">
                <Database className="size-4 text-[#7aa2f7]" />
                <h2 className="text-sm font-bold text-white">
                  {isNewRecord
                    ? `New Record in \`${selectedTable}\``
                    : `Edit Record [${editingRecord.id}] in \`${selectedTable}\``}
                </h2>
              </div>

              {/* Mode switch for tasks */}
              <div className="flex items-center gap-3">
                {selectedTable === "tasks" && (
                  <div className="flex rounded-lg border border-[#292e42] bg-[#16161e] p-0.5">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("visual")}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                        drawerTab === "visual"
                          ? "bg-[#7aa2f7] text-[#16161e]"
                          : "text-[#565f89] hover:text-[#c0caf5]"
                      }`}
                    >
                      Visual Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Sync content to string before switching to JSON tab
                        const updated = { ...editingRecord }
                        if (typeof updated.content === "object" && updated.content !== null) {
                          updated.content = JSON.stringify(updated.content, null, 2)
                        }
                        setEditingRecord(updated)
                        setDrawerTab("json")
                      }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                        drawerTab === "json"
                          ? "bg-[#7aa2f7] text-[#16161e]"
                          : "text-[#565f89] hover:text-[#c0caf5]"
                      }`}
                    >
                      Raw JSONB
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="text-[#565f89] hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSaveDrawerRecord}
              className="flex-1 overflow-y-auto py-4 space-y-4 pr-2"
            >
              {/* ==================== SPECIALIZED VISUAL FORM: TASKS ==================== */}
              {selectedTable === "tasks" && drawerTab === "visual" ? (
                <div className="space-y-4">
                  {/* Task Meta Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-[#292e42] bg-[#16161e] p-3.5">
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Task ID</label>
                      <input
                        type="text"
                        value={String(editingRecord.id || "")}
                        onChange={(e) => setEditingRecord({ ...editingRecord, id: e.target.value })}
                        disabled={!isNewRecord}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] px-2.5 py-1 text-xs text-white font-mono disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Task Type</label>
                      <select
                        value={String(editingRecord.task_type || "theory")}
                        onChange={(e) => setEditingRecord({ ...editingRecord, task_type: e.target.value })}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] px-2.5 py-1 text-xs text-[#7aa2f7] font-semibold"
                      >
                        <option value="theory">theory</option>
                        <option value="quiz">quiz</option>
                        <option value="coding">coding</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#565f89]">Sequence Order</label>
                      <input
                        type="number"
                        value={Number(editingRecord.sequence_order || 1)}
                        onChange={(e) => setEditingRecord({ ...editingRecord, sequence_order: Number(e.target.value) })}
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Task Title */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#565f89]">Task Title</label>
                    <input
                      type="text"
                      value={String(editingRecord.title || "")}
                      onChange={(e) => setEditingRecord({ ...editingRecord, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs text-white"
                      placeholder="e.g. Implement AVL Tree Node Rotation"
                    />
                  </div>

                  {/* SUB-FORM 1: THEORY */}
                  {editingRecord.task_type === "theory" && (
                    <div className="space-y-3 rounded-xl border border-[#7aa2f7]/30 bg-[#16161e]/70 p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#7aa2f7]">
                        <BookOpen className="size-4" />
                        <span>Theory & Socratic Discussion Content</span>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Header Title</label>
                        <input
                          type="text"
                          value={String((editingRecord.content as any)?.headerTitle || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, headerTitle: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] px-2.5 py-1 text-xs text-white"
                          placeholder="CORE THEORY: ASYMPTOTIC INVARIANTS"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Summary Lead Paragraph</label>
                        <textarea
                          rows={3}
                          value={String((editingRecord.content as any)?.summaryLead || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, summaryLead: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] p-2 text-xs text-white"
                          placeholder="Executive breakdown of the algorithmic structure..."
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Socratic Invariant Question</label>
                        <textarea
                          rows={2}
                          value={String((editingRecord.content as any)?.socraticCheck || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, socraticCheck: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] p-2 text-xs text-[#7dcfff]"
                          placeholder="Why is the tree balance factor strictly bounded by +/- 1?"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Key Takeaways (One per line)</label>
                        <textarea
                          rows={3}
                          value={
                            Array.isArray((editingRecord.content as any)?.keyTakeaways)
                              ? (editingRecord.content as any).keyTakeaways.join("\n")
                              : String((editingRecord.content as any)?.keyTakeaways || "")
                          }
                          onChange={(e) => {
                            const lines = e.target.value.split("\n").filter((l) => l.trim().length > 0)
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, keyTakeaways: lines } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] p-2 text-xs text-white font-mono"
                          placeholder="Height variance bounded by 1&#10;Rotations take strictly O(1) pointer updates"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-FORM 2: QUIZ */}
                  {editingRecord.task_type === "quiz" && (
                    <div className="space-y-3 rounded-xl border border-[#bb9af7]/30 bg-[#16161e]/70 p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#bb9af7]">
                        <HelpCircle className="size-4" />
                        <span>Socratic Concept Quiz & 4 Options</span>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Quiz Header Title</label>
                        <input
                          type="text"
                          value={String((editingRecord.content as any)?.headerTitle || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, headerTitle: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] px-2.5 py-1 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Question Prompt</label>
                        <textarea
                          rows={2}
                          value={String((editingRecord.content as any)?.questionPrompt || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, questionPrompt: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] p-2 text-xs text-white"
                          placeholder="Given a node N with left height = 3 and right height = 1..."
                        />
                      </div>

                      {/* Options A, B, C, D */}
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-semibold text-[#565f89]">
                          Options (Select Radio for Correct Option)
                        </label>
                        {["A", "B", "C", "D"].map((optId, idx) => {
                          const curContent = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                          const optionsArr: any[] = Array.isArray(curContent.options) ? curContent.options : []
                          const existingOpt = optionsArr.find((o) => o.id === optId) || optionsArr[idx]
                          const optText = existingOpt?.text || curContent[`option${optId}`] || ""
                          const isCorrect = existingOpt ? existingOpt.isCorrect : curContent.correctOption === optId

                          return (
                            <div key={optId} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="quizCorrectVisual"
                                checked={Boolean(isCorrect)}
                                onChange={() => {
                                  const updatedOptions = ["A", "B", "C", "D"].map((id, oIdx) => {
                                    const opt = optionsArr.find((o) => o.id === id) || optionsArr[oIdx]
                                    return {
                                      id,
                                      text: opt?.text || curContent[`option${id}`] || `Option ${id}`,
                                      isCorrect: id === optId,
                                    }
                                  })
                                  setEditingRecord({
                                    ...editingRecord,
                                    content: {
                                      ...curContent,
                                      correctOption: optId,
                                      options: updatedOptions,
                                    },
                                  })
                                }}
                                className="size-4 text-[#bb9af7]"
                              />
                              <span className="font-mono text-xs font-bold text-[#bb9af7]">
                                {optId}:
                              </span>
                              <input
                                type="text"
                                value={optText}
                                onChange={(e) => {
                                  const updatedOptions = ["A", "B", "C", "D"].map((id, oIdx) => {
                                    const opt = optionsArr.find((o) => o.id === id) || optionsArr[oIdx]
                                    const currentText = id === optId ? e.target.value : (opt?.text || curContent[`option${id}`] || "")
                                    return {
                                      id,
                                      text: currentText,
                                      isCorrect: opt?.isCorrect || curContent.correctOption === id,
                                    }
                                  })
                                  setEditingRecord({
                                    ...editingRecord,
                                    content: {
                                      ...curContent,
                                      [`option${optId}`]: e.target.value,
                                      options: updatedOptions,
                                    },
                                  })
                                }}
                                className="flex-1 rounded border border-[#292e42] bg-[#1a1b26] px-2.5 py-1 text-xs text-white"
                                placeholder={`Text for option ${optId}`}
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Pedagogical Explanation</label>
                        <textarea
                          rows={2}
                          value={String((editingRecord.content as any)?.explanation || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, explanation: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] p-2 text-xs text-white"
                          placeholder="Balance factor is 3 - 1 = +2, requiring a right rotation to rebalance..."
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-FORM 3: CODING */}
                  {editingRecord.task_type === "coding" && (
                    <div className="space-y-3 rounded-xl border border-[#7dcfff]/30 bg-[#16161e]/70 p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#7dcfff]">
                        <Code2 className="size-4" />
                        <span>C++ Algorithmic Implementation & Test Cases</span>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Coding Header Title</label>
                        <input
                          type="text"
                          value={String((editingRecord.content as any)?.headerTitle || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, headerTitle: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] px-2.5 py-1 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#565f89]">Starter C++ Code</label>
                        <textarea
                          rows={10}
                          value={String((editingRecord.content as any)?.initialCode || "")}
                          onChange={(e) => {
                            const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                            setEditingRecord({ ...editingRecord, content: { ...cur, initialCode: e.target.value } })
                          }}
                          className="mt-1 w-full rounded border border-[#292e42] bg-[#1a1b26] p-3 font-mono text-xs text-emerald-300 focus:outline-none"
                        />
                      </div>

                      {/* Test Cases */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-[#565f89]">
                            Evaluation Test Cases
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                              const tcList: any[] = Array.isArray(cur.testCases) ? [...cur.testCases] : []
                              tcList.push({
                                id: tcList.length + 1,
                                input: "[10, 20, 30]",
                                expected: "Optimal",
                                isPublic: true,
                              })
                              setEditingRecord({
                                ...editingRecord,
                                content: { ...cur, testCases: tcList },
                              })
                            }}
                            className="flex items-center gap-1 rounded bg-[#7dcfff]/15 px-2 py-0.5 text-[10px] font-semibold text-[#7dcfff] hover:bg-[#7dcfff]/25"
                          >
                            <Plus className="size-3" />
                            <span>Add Test Case</span>
                          </button>
                        </div>

                        {((editingRecord.content as any)?.testCases || [
                          { id: 1, input: (editingRecord.content as any)?.testCasesInput || "[10, 20, 30]", expected: (editingRecord.content as any)?.testCasesExpected || "Pass", isPublic: true },
                        ]).map((tc: any, tcIdx: number) => (
                          <div key={tc.id || tcIdx} className="rounded-lg border border-[#292e42] bg-[#1a1b26] p-2.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-[#7dcfff] font-bold">
                                Case #{tc.id || tcIdx + 1}
                              </span>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#565f89]">
                                  <input
                                    type="checkbox"
                                    checked={tc.isPublic !== false}
                                    onChange={(e) => {
                                      const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                                      const tcList: any[] = Array.isArray(cur.testCases) ? [...cur.testCases] : []
                                      if (tcList[tcIdx]) {
                                        tcList[tcIdx] = { ...tcList[tcIdx], isPublic: e.target.checked }
                                      }
                                      setEditingRecord({ ...editingRecord, content: { ...cur, testCases: tcList } })
                                    }}
                                    className="rounded border-[#292e42] text-[#7dcfff]"
                                  />
                                  <span>Public Example</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                                    const tcList: any[] = Array.isArray(cur.testCases) ? cur.testCases.filter((_: any, i: number) => i !== tcIdx) : []
                                    setEditingRecord({ ...editingRecord, content: { ...cur, testCases: tcList } })
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] text-[#565f89]">Input</span>
                                <input
                                  type="text"
                                  value={tc.input || ""}
                                  onChange={(e) => {
                                    const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                                    const tcList: any[] = Array.isArray(cur.testCases) ? [...cur.testCases] : []
                                    if (tcList[tcIdx]) tcList[tcIdx] = { ...tcList[tcIdx], input: e.target.value }
                                    setEditingRecord({ ...editingRecord, content: { ...cur, testCases: tcList } })
                                  }}
                                  className="w-full rounded border border-[#292e42] bg-[#16161e] px-2 py-1 font-mono text-[11px] text-white"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-[#565f89]">Expected Output</span>
                                <input
                                  type="text"
                                  value={tc.expected || ""}
                                  onChange={(e) => {
                                    const cur = typeof editingRecord.content === "object" && editingRecord.content !== null ? editingRecord.content : {}
                                    const tcList: any[] = Array.isArray(cur.testCases) ? [...cur.testCases] : []
                                    if (tcList[tcIdx]) tcList[tcIdx] = { ...tcList[tcIdx], expected: e.target.value }
                                    setEditingRecord({ ...editingRecord, content: { ...cur, testCases: tcList } })
                                  }}
                                  className="w-full rounded border border-[#292e42] bg-[#16161e] px-2 py-1 font-mono text-[11px] text-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ==================== GENERAL / RAW JSONB FORM ==================== */
                <div className="space-y-3.5">
                  {/* FEATURE 2: DAG PREREQUISITE SELECTOR FOR ROADMAP NODES */}
                  {selectedTable === "roadmap_nodes" && (
                    <div className="space-y-2 rounded-xl border border-[#292e42] bg-[#16161e] p-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#7aa2f7] flex items-center gap-1.5">
                          <Layers className="size-3.5" />
                          <span>Prerequisites (DAG Graph Dependencies)</span>
                        </label>
                        {dagCycleResult.hasCycle ? (
                          <span className="flex items-center gap-1 rounded bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400 border border-red-500/30">
                            <ShieldAlert className="size-3" />
                            <span>DAG Cycle Detected!</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="size-3" />
                            <span>DAG Valid (Acyclic)</span>
                          </span>
                        )}
                      </div>

                      {/* DAG Integrity Error Alert Banner */}
                      {dagCycleResult.hasCycle && (
                        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-red-200">
                            <ShieldAlert className="size-4 shrink-0 text-red-400" />
                            <span>DAG Integrity Error: Circular dependency detected!</span>
                          </div>
                          <p className="font-mono text-[11px] text-red-300/90 leading-tight">
                            Cycle Path: {dagCycleResult.cycleString}
                          </p>
                          <p className="text-[10px] text-red-400/80">
                            Topological sort is impossible with circular dependencies. Uncheck the circular node to save.
                          </p>
                        </div>
                      )}

                      {/* Candidate nodes multi-select checkboxes */}
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 pt-1">
                        {nodesList
                          .filter((n) => n.id !== editingRecord.id)
                          .map((candidateNode) => {
                            const currentPrereqs: string[] = Array.isArray(editingRecord.prerequisites)
                              ? editingRecord.prerequisites
                              : typeof editingRecord.prerequisites === "string"
                              ? (JSON.parse(editingRecord.prerequisites || "[]") as string[])
                              : []
                            const isChecked = currentPrereqs.includes(candidateNode.id)

                            return (
                              <label
                                key={candidateNode.id}
                                className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? "border-[#7aa2f7]/50 bg-[#7aa2f7]/15 text-white"
                                    : "border-[#292e42] bg-[#1a1b26] text-[#565f89] hover:text-[#c0caf5]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const nextPrereqs = e.target.checked
                                        ? [...currentPrereqs, candidateNode.id]
                                        : currentPrereqs.filter((id) => id !== candidateNode.id)
                                      setEditingRecord({
                                        ...editingRecord,
                                        prerequisites: nextPrereqs,
                                      })
                                    }}
                                    className="rounded border-[#292e42] bg-[#16161e] text-[#7aa2f7] focus:ring-0"
                                  />
                                  <span className="font-mono font-semibold text-[11px] text-[#7aa2f7]">
                                    {candidateNode.short_code || candidateNode.shortCode || "01"}
                                  </span>
                                  <span className="font-medium text-xs text-[#c0caf5]">
                                    {candidateNode.label}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-[#565f89]">
                                  {candidateNode.id}
                                </span>
                              </label>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Standard Record Fields */}
                  {Object.entries(editingRecord).map(([key, val]) => {
                    // Skip prerequisites rendering here if already handled by DAG visual selector
                    if (selectedTable === "roadmap_nodes" && key === "prerequisites") return null

                    const isJson =
                      (typeof val === "object" && val !== null) ||
                      (typeof val === "string" &&
                        (val.trim().startsWith("{") || val.trim().startsWith("[")))

                    const formattedVal =
                      typeof val === "object" && val !== null
                        ? JSON.stringify(val, null, 2)
                        : String(val ?? "")

                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-xs font-semibold text-[#7aa2f7]">
                            {key}
                          </label>
                          {isJson && (
                            <span className="font-mono text-[10px] text-cyan">
                              JSONB Object
                            </span>
                          )}
                        </div>
                        {isJson ? (
                          <div>
                            <textarea
                              rows={6}
                              value={formattedVal}
                              onChange={(e) => {
                                setEditingRecord({
                                  ...editingRecord,
                                  [key]: e.target.value,
                                })
                                setJsonErrors((prev) => ({ ...prev, [key]: "" }))
                              }}
                              className="mt-1 w-full rounded-lg border border-[#292e42] bg-[#16161e] p-2.5 font-mono text-xs text-[#c0caf5] focus:border-[#7aa2f7] focus:outline-none"
                            />
                            {jsonErrors[key] && (
                              <p className="mt-1 text-[10px] text-red-400 font-semibold">
                                {jsonErrors[key]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={formattedVal}
                            onChange={(e) =>
                              setEditingRecord({
                                ...editingRecord,
                                [key]: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs text-white focus:border-[#7aa2f7] focus:outline-none"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#292e42]">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="rounded-lg border border-[#292e42] px-4 py-2 text-xs font-semibold text-[#565f89] hover:bg-[#24283b] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedTable === "roadmap_nodes" && dagCycleResult.hasCycle}
                  className="rounded-lg bg-[#7aa2f7] px-4 py-2 text-xs font-bold text-[#16161e] hover:bg-[#7aa2f7]/90 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Changes to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: INSPECT SUBMISSION ==================== */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-6 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-[#292e42] bg-[#1a1b26] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#292e42] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="size-4 text-[#9ece6a]" />
                  <span>Submission Details [{inspectingSubmission.id}]</span>
                </h3>
                <p className="text-xs text-[#565f89]">
                  Task: {inspectingSubmission.task_id} | Language: {inspectingSubmission.language}
                </p>
              </div>
              <button
                onClick={() => setInspectingSubmission(null)}
                className="text-[#565f89] hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#565f89]">
                    Submitted C++ Source Code
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inspectingSubmission.code || "")
                      setCodeCopied(true)
                      setTimeout(() => setCodeCopied(false), 2000)
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#7aa2f7] hover:underline"
                  >
                    {codeCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                    <span>{codeCopied ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
                <pre className="rounded-xl border border-[#292e42] bg-[#16161e] p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                  {inspectingSubmission.code}
                </pre>
              </div>

              {inspectingSubmission.stdout && (
                <div>
                  <span className="text-xs font-semibold text-[#565f89]">
                    Execution stdout
                  </span>
                  <pre className="mt-1 rounded-xl border border-[#292e42] bg-[#16161e] p-3 font-mono text-xs text-[#c0caf5] overflow-x-auto">
                    {inspectingSubmission.stdout}
                  </pre>
                </div>
              )}

              {inspectingSubmission.stderr && (
                <div>
                  <span className="text-xs font-semibold text-red-400">
                    Execution stderr / Compiler Errors
                  </span>
                  <pre className="mt-1 rounded-xl border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-300 overflow-x-auto">
                    {inspectingSubmission.stderr}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[#292e42] pt-3">
              <button
                onClick={() => setInspectingSubmission(null)}
                className="rounded-lg bg-[#24283b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#292e42]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: SUPABASE HEALTH CHECK & RAW DB INSPECTOR ==================== */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#292e42] bg-[#1a1b26] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#292e42] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl border border-[#7aa2f7]/30 bg-[#7aa2f7]/15 text-[#7aa2f7]">
                  <Database className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Supabase Health Check & Raw DB Inspector</span>
                    <span className="rounded bg-cyan/15 border border-cyan/30 px-2 py-0.5 font-mono text-[10px] text-cyan font-semibold">
                      Direct REST Mode
                    </span>
                  </h3>
                  <p className="text-xs text-[#565f89]">
                    Queried directly from Supabase REST API without any Mock Data or Fallback layer.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="rounded-lg p-1 text-[#565f89] hover:bg-[#24283b] hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {isInspecting ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="size-8 text-[#7aa2f7] animate-spin" />
                  <p className="text-xs text-[#7aa2f7] font-semibold">
                    Querying all 6 tables directly from Supabase REST API...
                  </p>
                  <p className="text-[11px] text-[#565f89]">
                    Bypassing local storage and mock fallbacks
                  </p>
                </div>
              ) : inspectorResult ? (
                <>
                  {/* Connection Status Banner */}
                  <div
                    className={`flex items-center justify-between rounded-xl border p-3.5 ${
                      inspectorResult.connected
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {inspectorResult.connected ? (
                        <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="size-5 text-red-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">
                          {inspectorResult.connected
                            ? "Supabase Connected & Authenticated"
                            : "Supabase Direct Connection Error"}
                        </div>
                        <div className="text-[11px] font-mono text-[#c0caf5] mt-0.5">
                          {inspectorResult.endpoint || "https://kcpgwxsibuqgkudgbjgd.supabase.co"}
                        </div>
                        {inspectorResult.error && (
                          <div className="text-[11px] text-red-300 font-mono mt-1">
                            Error: {inspectorResult.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded bg-[#16161e] border border-[#292e42] px-2 py-1 font-mono text-[10px] text-[#7aa2f7]">
                        Verified: {new Date(inspectorResult.exportedAt || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                      <Activity className="size-3.5 text-[#7aa2f7]" />
                      <span>Live Database vs UI Display Reconciliation</span>
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-[#292e42] bg-[#16161e]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#292e42] bg-[#1a1b26]/60 font-mono text-[10px] uppercase tracking-wider text-[#565f89]">
                            <th className="px-4 py-2.5">TABLE NAME</th>
                            <th className="px-4 py-2.5 text-center">SUPABASE RAW ROWS</th>
                            <th className="px-4 py-2.5 text-center">UI CURRENT ROWS</th>
                            <th className="px-4 py-2.5 text-right">SYNC STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#292e42]/60 font-mono text-[11px]">
                          {[
                            {
                              name: "users",
                              raw: inspectorResult.counts?.users ?? 0,
                              ui: usersList.length,
                            },
                            {
                              name: "knowledge_documents",
                              raw: inspectorResult.counts?.knowledge_documents ?? 0,
                              ui: documentsList.length,
                            },
                            {
                              name: "roadmap_nodes",
                              raw: inspectorResult.counts?.roadmap_nodes ?? 0,
                              ui: nodesList.length,
                            },
                            {
                              name: "tasks",
                              raw: inspectorResult.counts?.tasks ?? 0,
                              ui: tasksCount,
                            },
                            {
                              name: "user_progress",
                              raw: inspectorResult.counts?.user_progress ?? 0,
                              ui: progressList.length,
                            },
                            {
                              name: "code_submissions",
                              raw: inspectorResult.counts?.code_submissions ?? 0,
                              ui: submissionsList.length,
                            },
                          ].map((item) => {
                            const isSynced = item.raw === item.ui
                            return (
                              <tr key={item.name} className="hover:bg-[#24283b]/30 transition-colors">
                                <td className="px-4 py-2.5 font-semibold text-white">
                                  {item.name}
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-[#7dcfff]">
                                  {item.raw}
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-[#c0caf5]">
                                  {item.ui}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {isSynced ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                      <CheckCircle2 className="size-2.5" />
                                      <span>Synced 100%</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                      <AlertTriangle className="size-2.5" />
                                      <span>Mismatch ({item.raw} vs {item.ui})</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Relational Integrity Audit Cards */}
                  <div>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                      <Shield className="size-3.5 text-[#9ece6a]" />
                      <span>Relational Integrity & Foreign Key Health</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div className="rounded-xl border border-[#292e42] bg-[#16161e] p-3 space-y-1">
                        <div className="text-[10px] font-semibold text-[#565f89] uppercase tracking-wider">
                          Orphan Nodes Check
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-base font-extrabold ${
                              (inspectorResult.audit?.orphanNodes || []).length === 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {(inspectorResult.audit?.orphanNodes || []).length === 0 ? "0 Orphans" : `${inspectorResult.audit?.orphanNodes?.length} Orphans`}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#565f89]">
                          All nodes reference valid Knowledge Documents
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#292e42] bg-[#16161e] p-3 space-y-1">
                        <div className="text-[10px] font-semibold text-[#565f89] uppercase tracking-wider">
                          Orphan Tasks Check
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-base font-extrabold ${
                              (inspectorResult.audit?.orphanTasks || []).length === 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {(inspectorResult.audit?.orphanTasks || []).length === 0 ? "0 Orphans" : `${inspectorResult.audit?.orphanTasks?.length} Orphans`}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#565f89]">
                          All tasks reference existing Roadmap Nodes
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#292e42] bg-[#16161e] p-3 space-y-1">
                        <div className="text-[10px] font-semibold text-[#565f89] uppercase tracking-wider">
                          Curriculum Completeness
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-base font-extrabold ${
                              (inspectorResult.audit?.incompleteNodes || []).length === 0
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {(inspectorResult.audit?.incompleteNodes || []).length === 0 ? "15/15 Complete" : `${15 - (inspectorResult.audit?.incompleteNodes?.length || 0)}/15 Complete`}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#565f89]">
                          Each Node has exactly 3 tasks (Theory + Quiz + Coding)
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#292e42] pt-3.5 mt-2">
              <button
                onClick={() => handleOpenRawInspector()}
                disabled={isInspecting}
                className="flex items-center gap-1.5 rounded-lg border border-[#292e42] bg-[#16161e] px-3 py-1.5 text-xs font-semibold text-[#c0caf5] hover:border-[#7aa2f7]/40 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${isInspecting ? "animate-spin" : ""}`} />
                <span>Re-run Audit</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="rounded-lg border border-[#292e42] bg-[#16161e] px-3.5 py-1.5 text-xs font-semibold text-[#565f89] hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadSnapshot}
                  disabled={!inspectorResult?.tables || isInspecting}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                >
                  <Download className="size-3.5" />
                  <span>Download supabase_snapshot.json</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
