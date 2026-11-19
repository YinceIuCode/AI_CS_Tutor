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
  Sparkles,
  Terminal,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
  Zap,
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

  // Tab 2 state (Curriculum Builder)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string>("avl-tree")
  const [activeLessonType, setActiveLessonType] = React.useState<"theory" | "quiz" | "coding">("theory")
  const [nodeFormData, setNodeFormData] = React.useState<any>({
    label: "AVL Tree",
    shortCode: "08",
    complexity: "O(log N)",
    description: "Self-balancing binary search tree bounding height variance <= 1.",
    primarySlideReference: "Slide 14 (PDF)",
    documentId: "doc-cs101-hcmus",
  })
  const [theoryContent, setTheoryContent] = React.useState<any>({
    headerTitle: "CORE THEORY: AVL TREE & BIG-O COMPLEXITY",
    summaryLead: "An AVL Tree is a self-balancing Binary Search Tree where the difference between heights of left and right subtrees (the Balance Factor) cannot exceed 1 for any node.",
    socraticCheck: "Notice how the Balance Factor only depends on the height of direct child subtrees. Why do we only need O(1) local pointer updates during a rotation instead of rebuilding the entire tree?",
  })
  const [quizContent, setQuizContent] = React.useState<any>({
    headerTitle: "QUIZ: AVL TREE INVARIANTS",
    questionPrompt: "Given an AVL Tree node N with Left Subtree Height = 3 and Right Subtree Height = 1. What is the Balance Factor of node N, and does it require a rotation?",
    optionA: "Balance Factor = +2 (Requires Right Rotation)",
    optionB: "Balance Factor = -1 (Balanced, no rotation)",
    optionC: "Balance Factor = +3 (Degenerates into Linked List)",
    optionD: "Balance Factor = 0 (Perfect binary tree)",
    correctOption: "A",
  })
  const [codingContent, setCodingContent] = React.useState<any>({
    headerTitle: "TASK: IMPLEMENT AVL NODE INSERTION & ROTATION",
    initialCode: `#include <iostream>\n#include <algorithm>\n\nstruct Node {\n    int key;\n    Node *left = nullptr;\n    Node *right = nullptr;\n    int height = 1;\n};\n\nint getHeight(Node *N) {\n    return N ? N->height : 0;\n}\n\nint getBalanceFactor(Node *N) {\n    return N ? getHeight(N->left) - getHeight(N->right) : 0;\n}\n\n// TODO: Implement Right Rotation (LL Rotation)\nNode* rightRotate(Node *y) {\n    Node *x = y->left;\n    Node *T2 = x->right;\n    x->right = y;\n    y->left = T2;\n    y->height = std::max(getHeight(y->left), getHeight(y->right)) + 1;\n    x->height = std::max(getHeight(x->left), getHeight(x->right)) + 1;\n    return x;\n}\n\nint main() {\n    std::cout << "AVL Rotations Ready!" << std::endl;\n    return 0;\n}`,
    testCasesInput: "[10, 20, 30]",
    testCasesExpected: "Rotated Left, Root is 20",
  })

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

  // Sync Node data when changing selectedNodeId in Curriculum Builder
  React.useEffect(() => {
    const node = nodesList.find((n) => n.id === selectedNodeId) || MOCK_ROADMAP_NODES.find((n) => n.id === selectedNodeId)
    if (node) {
      setNodeFormData({
        label: node.label,
        shortCode: node.short_code || node.shortCode,
        complexity: node.target_complexity || node.complexity || "O(log N)",
        description: node.description,
        primarySlideReference: `Slide 14 (${node.label}.pdf)`,
        documentId: node.document_id || "doc-cs101-hcmus",
      })

      const details = (WORKSPACE_TASK_DETAILS as Record<string, any>)[node.id] || {}
      const t1 = details[`${node.id}-task-1`]
      if (t1) {
        setTheoryContent({
          headerTitle: t1.headerTitle || `CORE THEORY: ${node.label.toUpperCase()}`,
          summaryLead: t1.summaryLead || `Comprehensive breakdown of ${node.label}.`,
          socraticCheck: t1.socraticCheck || "How does the invariant preserve efficiency?",
        })
      }

      const t2 = details[`${node.id}-task-2`]
      if (t2) {
        setQuizContent({
          headerTitle: t2.headerTitle || `QUIZ: ${node.label.toUpperCase()}`,
          questionPrompt: t2.questionPrompt || `What is the operational bound of ${node.label}?`,
          optionA: t2.options?.[0]?.text || "Option A",
          optionB: t2.options?.[1]?.text || "Option B",
          optionC: t2.options?.[2]?.text || "Option C",
          optionD: t2.options?.[3]?.text || "Option D",
          correctOption: t2.options?.find((o: any) => o.isCorrect)?.id || "A",
        })
      }
    }
  }, [selectedNodeId, nodesList])

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

  // Handle Curriculum Save
  const handleSaveCurriculum = async () => {
    const tasksList = [
      {
        id: `${selectedNodeId}-task-1`,
        type: "theory",
        title: theoryContent.headerTitle,
        description: theoryContent.summaryLead,
        content: {
          nodeId: selectedNodeId,
          taskId: `${selectedNodeId}-task-1`,
          type: "theory",
          headerTitle: theoryContent.headerTitle,
          summaryLead: theoryContent.summaryLead,
          socraticCheck: theoryContent.socraticCheck,
        },
      },
      {
        id: `${selectedNodeId}-task-2`,
        type: "quiz",
        title: quizContent.headerTitle,
        description: quizContent.questionPrompt,
        content: {
          nodeId: selectedNodeId,
          taskId: `${selectedNodeId}-task-2`,
          type: "quiz",
          headerTitle: quizContent.headerTitle,
          questionPrompt: quizContent.questionPrompt,
          options: [
            { id: "A", text: quizContent.optionA, isCorrect: quizContent.correctOption === "A" },
            { id: "B", text: quizContent.optionB, isCorrect: quizContent.correctOption === "B" },
            { id: "C", text: quizContent.optionC, isCorrect: quizContent.correctOption === "C" },
            { id: "D", text: quizContent.optionD, isCorrect: quizContent.correctOption === "D" },
          ],
        },
      },
      {
        id: `${selectedNodeId}-task-3`,
        type: "coding",
        title: codingContent.headerTitle,
        description: "Practice algorithmic implementation.",
        content: {
          nodeId: selectedNodeId,
          taskId: `${selectedNodeId}-task-3`,
          type: "coding",
          headerTitle: codingContent.headerTitle,
          initialCode: codingContent.initialCode,
          testCases: [
            { id: 1, input: codingContent.testCasesInput, expected: codingContent.testCasesExpected },
          ],
        },
      },
    ]

    await saveCurriculumNodeAndTasks(selectedNodeId, nodeFormData, tasksList)
    showToast(`Curriculum updated! Changes are live on Roadmap & Workspace.`)
    loadRelationalContext()
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
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-white">
                {currentUser?.fullName || "Admin"}
              </div>
              <div className="text-[10px] font-medium text-[#bb9af7] uppercase">
                {currentUser?.role || "admin"}
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

        {/* ==================== TAB 2: CURRICULUM BUILDER ==================== */}
        {activeTab === "curriculum" && (
          <div className="flex flex-1 flex-col overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#292e42] pb-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Node & Lesson Visual Form Editor
                </h2>
                <p className="text-xs text-[#565f89]">
                  Edit learning theory, quiz questions, or C++ coding starter code.
                </p>
              </div>

              {/* Node Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#565f89]">Select Node:</span>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="rounded-lg border border-[#292e42] bg-[#1a1b26] px-3 py-1.5 text-xs font-semibold text-[#7aa2f7] focus:border-[#7aa2f7] focus:outline-none"
                >
                  {MOCK_ROADMAP_NODES.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.shortCode} - {n.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveCurriculum}
                  className="rounded-lg bg-[#bb9af7] px-4 py-1.5 text-xs font-bold text-[#16161e] hover:bg-[#bb9af7]/90 transition-colors shadow-sm"
                >
                  Save to Database
                </button>
              </div>
            </div>

            {/* Node Metadata Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-[#292e42] bg-[#1a1b26] p-4">
              <div>
                <label className="text-[11px] font-semibold text-[#565f89]">
                  Node Label
                </label>
                <input
                  type="text"
                  value={nodeFormData.label}
                  onChange={(e) =>
                    setNodeFormData({ ...nodeFormData, label: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#565f89]">
                  Short Code
                </label>
                <input
                  type="text"
                  value={nodeFormData.shortCode}
                  onChange={(e) =>
                    setNodeFormData({ ...nodeFormData, shortCode: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#565f89]">
                  Target Complexity
                </label>
                <input
                  type="text"
                  value={nodeFormData.complexity}
                  onChange={(e) =>
                    setNodeFormData({ ...nodeFormData, complexity: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#565f89]">
                  Slide PDF Reference
                </label>
                <input
                  type="text"
                  value={nodeFormData.primarySlideReference}
                  onChange={(e) =>
                    setNodeFormData({
                      ...nodeFormData,
                      primarySlideReference: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Task Type Tabs */}
            <div className="flex items-center gap-2 border-b border-[#292e42]">
              <button
                onClick={() => setActiveLessonType("theory")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold ${
                  activeLessonType === "theory"
                    ? "border-[#7aa2f7] text-[#7aa2f7]"
                    : "border-transparent text-[#565f89] hover:text-[#c0caf5]"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>Task 1: Core Theory</span>
              </button>
              <button
                onClick={() => setActiveLessonType("quiz")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold ${
                  activeLessonType === "quiz"
                    ? "border-[#bb9af7] text-[#bb9af7]"
                    : "border-transparent text-[#565f89] hover:text-[#c0caf5]"
                }`}
              >
                <HelpCircle className="size-3.5" />
                <span>Task 2: Socratic Quiz</span>
              </button>
              <button
                onClick={() => setActiveLessonType("coding")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold ${
                  activeLessonType === "coding"
                    ? "border-[#7dcfff] text-[#7dcfff]"
                    : "border-transparent text-[#565f89] hover:text-[#c0caf5]"
                }`}
              >
                <Code2 className="size-3.5" />
                <span>Task 3: C++ Coding Task</span>
              </button>
            </div>

            {/* Lesson Body Form */}
            <div className="flex-1 overflow-auto rounded-xl border border-[#292e42] bg-[#1a1b26] p-4">
              {activeLessonType === "theory" && (
                <div className="space-y-3 max-w-2xl">
                  <div>
                    <label className="text-xs font-semibold text-[#565f89]">
                      Theory Header Title
                    </label>
                    <input
                      type="text"
                      value={theoryContent.headerTitle}
                      onChange={(e) =>
                        setTheoryContent({ ...theoryContent, headerTitle: e.target.value })
                      }
                      className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#565f89]">
                      Summary Lead
                    </label>
                    <textarea
                      rows={3}
                      value={theoryContent.summaryLead}
                      onChange={(e) =>
                        setTheoryContent({ ...theoryContent, summaryLead: e.target.value })
                      }
                      className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#565f89]">
                      Socratic Check Question
                    </label>
                    <textarea
                      rows={2}
                      value={theoryContent.socraticCheck}
                      onChange={(e) =>
                        setTheoryContent({
                          ...theoryContent,
                          socraticCheck: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {activeLessonType === "quiz" && (
                <div className="space-y-3 max-w-2xl">
                  <div>
                    <label className="text-xs font-semibold text-[#565f89]">
                      Quiz Prompt / Question
                    </label>
                    <textarea
                      rows={2}
                      value={quizContent.questionPrompt}
                      onChange={(e) =>
                        setQuizContent({ ...quizContent, questionPrompt: e.target.value })
                      }
                      className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-[#565f89]">
                      4 Options & Correct Answer
                    </span>
                    {["A", "B", "C", "D"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={quizContent.correctOption === opt}
                          onChange={() =>
                            setQuizContent({ ...quizContent, correctOption: opt })
                          }
                          className="size-4 text-[#bb9af7]"
                        />
                        <span className="font-mono text-xs font-bold text-[#bb9af7]">
                          {opt}:
                        </span>
                        <input
                          type="text"
                          value={quizContent[`option${opt}`]}
                          onChange={(e) =>
                            setQuizContent({
                              ...quizContent,
                              [`option${opt}`]: e.target.value,
                            })
                          }
                          className="flex-1 rounded border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLessonType === "coding" && (
                <div className="space-y-3 max-w-3xl">
                  <div>
                    <label className="text-xs font-semibold text-[#565f89]">
                      Coding Starter Code (C++)
                    </label>
                    <textarea
                      rows={12}
                      value={codingContent.initialCode}
                      onChange={(e) =>
                        setCodingContent({
                          ...codingContent,
                          initialCode: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-3 font-mono text-xs text-emerald-300 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#565f89]">
                        Test Case Input
                      </label>
                      <input
                        type="text"
                        value={codingContent.testCasesInput}
                        onChange={(e) =>
                          setCodingContent({
                            ...codingContent,
                            testCasesInput: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#565f89]">
                        Test Case Expected Output
                      </label>
                      <input
                        type="text"
                        value={codingContent.testCasesExpected}
                        onChange={(e) =>
                          setCodingContent({
                            ...codingContent,
                            testCasesExpected: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded border border-[#292e42] bg-[#16161e] p-2 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                          {userFullName}
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
