"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  BookOpen,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  FileText,
  HelpCircle,
  Maximize2,
  Minimize2,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Square,
  Target,
  Terminal,
  X,
} from "lucide-react"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { useTheme } from "next-themes"
import themeConfig from "@/config/theme.config.json"
import { SocraticTutorPanel } from "@/components/workspace/SocraticTutorPanel"
import { ProblemDescriptionPanel } from "@/components/workspace/ProblemDescriptionPanel"
import { CodeAnalysisPanel } from "@/components/workspace/CodeAnalysisPanel"
import {
  runCode,
  submitCode,
  type ExecutionResult,
} from "@/services/executionService"
import { useAuth } from "@/hooks/useAuth"
import { useUserProgress } from "@/hooks/useUserProgress"
import { cn } from "@/lib/utils"
import { BRAND } from "@/config/brand"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { getSocraticTutorProfile } from "@/mocks/socraticTutorData"
import { resolveWorkspaceSession, evaluateQuizAnswer } from "@/services/roadmapService"
import { syncTaskProgressToSupabase } from "@/services/adminService"

/**
 * Cấu hình các đường dẫn điều hướng (href) trong trang Workspace.
 */
export const WORKSPACE_LINKS = {
  brand: "/",
  backToSkillTree: "/roadmap",
  profile: "/auth",
} as const

export type WorkspaceMode = "theory" | "quiz" | "coding"

/**
 * Hàm tính tọa độ đoạn thẳng nối tâm 2 đường tròn (luôn thẳng và vuông góc 90° với tiếp tuyến).
 */
function getCircleEdge(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.hypot(dx, dy)
  if (dist === 0) return { x1, y1, x2, y2 }
  const ux = dx / dist
  const uy = dy / dist
  return {
    x1: x1 + ux * r1,
    y1: y1 + uy * r1,
    x2: x2 - ux * r2,
    y2: y2 - uy * r2,
  }
}

/**
 * Cấu hình bảng màu Tokyo Night chuẩn VSCode cho Monaco Editor.
 */
const handleEditorBeforeMount: BeforeMount = (monaco) => {
  // 1. OffByOne Tokyo Night Dark Theme
  monaco.editor.defineTheme("offbyone-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "BB9AF7" },
      { token: "keyword.directive", foreground: "BB9AF7" },
      { token: "type", foreground: "7AA2F7" },
      { token: "type.identifier", foreground: "73DACA" },
      { token: "identifier", foreground: "C0CAF5" },
      { token: "number", foreground: "FF9E64" },
      { token: "string", foreground: "9ECE6A" },
      { token: "comment", foreground: "565F89", fontStyle: "italic" },
      { token: "delimiter", foreground: "89DDFF" },
      { token: "operator", foreground: "89DDFF" },
    ],
    colors: {
      "editor.background": themeConfig.dark.monaco.background,
      "editor.foreground": themeConfig.dark.monaco.foreground,
      "editor.lineHighlightBackground": themeConfig.dark.monaco.lineHighlightBackground,
      "editor.selectionBackground": themeConfig.dark.monaco.selectionBackground,
      "editorLineNumber.foreground": themeConfig.dark.monaco.lineNumber,
      "editorLineNumber.activeForeground": themeConfig.dark.monaco.lineNumberActive,
      "editorCursor.foreground": themeConfig.dark.monaco.cursor,
      "editorGutter.background": themeConfig.dark.monaco.gutterBackground,
      "scrollbarSlider.background": themeConfig.dark.monaco.scrollbarSlider,
      "scrollbarSlider.hoverBackground": themeConfig.dark.monaco.scrollbarSliderHover,
      "scrollbarSlider.activeBackground": themeConfig.dark.monaco.scrollbarSliderActive,
    },
  })

  // 2. OffByOne Crisp Developer Slate Light Theme
  monaco.editor.defineTheme("offbyone-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "7C3AED" },
      { token: "keyword.directive", foreground: "7C3AED" },
      { token: "type", foreground: "4F46E5" },
      { token: "type.identifier", foreground: "0284C7" },
      { token: "identifier", foreground: "0F172A" },
      { token: "number", foreground: "D97706" },
      { token: "string", foreground: "059669" },
      { token: "comment", foreground: "64748B", fontStyle: "italic" },
      { token: "delimiter", foreground: "0284C7" },
      { token: "operator", foreground: "0284C7" },
    ],
    colors: {
      "editor.background": themeConfig.light.monaco.background,
      "editor.foreground": themeConfig.light.monaco.foreground,
      "editor.lineHighlightBackground": themeConfig.light.monaco.lineHighlightBackground,
      "editor.selectionBackground": themeConfig.light.monaco.selectionBackground,
      "editorLineNumber.foreground": themeConfig.light.monaco.lineNumber,
      "editorLineNumber.activeForeground": themeConfig.light.monaco.lineNumberActive,
      "editorCursor.foreground": themeConfig.light.monaco.cursor,
      "editorGutter.background": themeConfig.light.monaco.gutterBackground,
      "scrollbarSlider.background": themeConfig.light.monaco.scrollbarSlider,
      "scrollbarSlider.hoverBackground": themeConfig.light.monaco.scrollbarSliderHover,
      "scrollbarSlider.activeBackground": themeConfig.light.monaco.scrollbarSliderActive,
    },
  })

  // Backwards compatibility alias
  monaco.editor.defineTheme("tokyo-night", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: { "editor.background": themeConfig.dark.monaco.background },
  })
}

interface WorkspaceViewProps {
  nodeId?: string
  taskId?: string
}

export function WorkspaceView({
  nodeId: propNodeId,
  taskId: propTaskId,
}: WorkspaceViewProps) {
  const router = useRouter()
  const params = useParams<{ nodeId?: string; taskId?: string }>()
  const { currentUser, isAuthenticated, isInitializing } = useAuth()
  const { resolvedTheme } = useTheme()
  const monacoTheme = resolvedTheme === "light" ? "offbyone-light" : "offbyone-dark"
  const {
    userProgress,
    isProgressLoaded,
    saveQuizAnswer,
    saveCodeDraft,
    saveHints,
    completeTask,
  } = useUserProgress()

  const resolvedNodeId = propNodeId || params?.nodeId || "avl-tree"
  const resolvedTaskId = propTaskId || params?.taskId || ""

  // Protected Route: Yêu cầu phiên người dùng hoặc Guest. Admin redirect về /admin.
  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/auth")
      return
    }
    if (!isInitializing && isAuthenticated && currentUser?.role === "admin") {
      router.replace("/admin")
    }
  }, [isInitializing, isAuthenticated, currentUser, router])

  const { node, activeTask, taskDetail: fallbackTaskDetail } = React.useMemo(
    () => resolveWorkspaceSession(resolvedNodeId, resolvedTaskId, userProgress),
    [resolvedNodeId, resolvedTaskId, userProgress]
  )

  // Chặn mở Workspace nếu Node đang bị khóa trong đồ thị DAG (DAG Invariant Protection)
  React.useEffect(() => {
    if (isProgressLoaded && node?.status === "locked") {
      router.replace("/roadmap")
    }
  }, [isProgressLoaded, node?.status, router])

  const [dynamicTaskDetail, setDynamicTaskDetail] = React.useState<any>(null)

  React.useEffect(() => {
    let isCancelled = false
    setDynamicTaskDetail(null)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    fetch(`${apiUrl}/api/tasks/${encodeURIComponent(activeTask.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((detail) => {
        if (!isCancelled && detail) {
          setDynamicTaskDetail(detail)
        }
      })
      .catch(() => {})
    return () => {
      isCancelled = true
    }
  }, [node.id, activeTask.id])

  const taskDetail = dynamicTaskDetail || fallbackTaskDetail

  const activeMode: WorkspaceMode = (activeTask?.type ||
    taskDetail?.type ||
    "theory") as WorkspaceMode

  // Ở Task Quiz, lưu trữ và khôi phục trạng thái từng câu hỏi (Q1, Q2, Q3)
  const [quizQuestionsMap, setQuizQuestionsMap] = React.useState<
    Record<string, { selected: string | null; checked: boolean; isCorrect: boolean }>
  >({})
  const [isEvaluatingQuiz, setIsEvaluatingQuiz] = React.useState<boolean>(false)
  const [quizQuestionIndex, setQuizQuestionIndex] = React.useState<number>(0)
  const [copiedTheoryCode, setCopiedTheoryCode] = React.useState<boolean>(false)

  // Ref theo dõi Task ID hiện tại để chống reset kết quả executionResult khi Alt-Tab / focus lại
  const activeTaskIdRef = React.useRef(activeTask.id)

  // Helper kiểm tra một task đã hoàn thành chưa (bền vững qua completedTasks hoặc initial status)
  const isTaskCompleted = React.useCallback(
    (taskId: string, initialStatus?: string) => {
      return (
        initialStatus === "completed" ||
        Boolean(userProgress?.completedTasks?.[taskId])
      )
    },
    [userProgress?.completedTasks]
  )

  // Topic tasks progress count: chỉ đếm các task thực sự đã hoàn thành
  const completedTasksCount = React.useMemo(() => {
    return node.tasks.filter((t) => isTaskCompleted(t.id, t.status)).length
  }, [node.tasks, isTaskCompleted])

  // Connected Stepper items resolver with strict "No Reverse Lock" guarantees
  const stepperTasks = React.useMemo(() => {
    return node.tasks.map((taskItem, idx) => {
      const isActive = taskItem.id === activeTask.id
      const isDone = isTaskCompleted(taskItem.id, taskItem.status)

      // Điều kiện mở khóa (Unlock):
      // - Task 0 (Theory): Luôn luôn mở
      // - Task > 0: Mở nếu tất cả task trước đó đã hoàn thành (allPreviousDone)
      //   HOẶC chính task này đã từng hoàn thành (isDone)
      //   HOẶC bất kỳ task nào sau đó đã hoàn thành (anyLaterDone)
      //   HOẶC người dùng đang đứng xem chính task này (isActive)
      const allPreviousDone = node.tasks
        .slice(0, idx)
        .every((prev) => isTaskCompleted(prev.id, prev.status))
      const anyLaterDone = node.tasks
        .slice(idx + 1)
        .some((later) => isTaskCompleted(later.id, later.status))

      const isLocked = !isDone && !isActive && !allPreviousDone && !anyLaterDone
      const isAvailable = !isLocked && !isDone && !isActive

      let taskIcon = <BookOpen className="size-3" />
      let typeLabel = "Theory"
      if (taskItem.type === "quiz") {
        taskIcon = <HelpCircle className="size-3" />
        typeLabel = "Quiz"
      } else if (taskItem.type === "coding") {
        taskIcon = <Code2 className="size-3" />
        typeLabel = "Coding"
      }

      return {
        ...taskItem,
        idx,
        isActive,
        isDone,
        isLocked,
        isAvailable,
        taskIcon,
        typeLabel,
      }
    })
  }, [node.tasks, activeTask.id, isTaskCompleted])

  // Dynamic Theory Reference Snippet & Dry-run State Trace
  const theorySnippet = React.useMemo(() => {
    if (taskDetail?.snippet?.code) {
      return {
        title: taskDetail.snippet.title || `${node.label} Reference Implementation`,
        code: taskDetail.snippet.code,
        traceSteps: taskDetail.snippet.traceSteps || [
          { label: "Step 1: Invariant Initialization", desc: "Validates base structure invariants and memory layout." },
          { label: "Step 2: Pointer / State Transition", desc: "Performs atomic state transitions according to theoretical bounds." },
          { label: "Step 3: Post-Condition Guard", desc: "Restores balance invariants and bounds execution time." },
        ],
        complexityNote: taskDetail.snippet.complexityNote || "Operations verified against complexity bounds."
      }
    }
    if (node.id === "avl-tree") {
      return {
        title: "AVL O(1) Right Rotation (LL Imbalance)",
        code: `// O(1) Right Rotation (LL Imbalance)
Node* rightRotate(Node* y) {
    Node* x = y->left;
    Node* T2 = x->right;
    
    // Perform pointer rewiring
    x->right = y;
    y->left = T2;
    
    // Update heights bottom-up
    y->height = max(height(y->left), height(y->right)) + 1;
    x->height = max(height(x->left), height(x->right)) + 1;
    
    return x; // Return new subtree root
}`,
        traceSteps: [
          { label: "Step 1: Unbalanced Subtree", desc: "Node y(30) has Left=x(20), Left Subtree Height=3, Right Height=1 (BF = +2)" },
          { label: "Step 2: Pivot Rewiring", desc: "x->right assigned to y, sub-tree T2 moved to y->left" },
          { label: "Step 3: New Balanced Root", desc: "x(20) becomes root, BF restores to 0, height recomputed in O(1)" },
        ],
        complexityNote: "Rotations strictly execute 4 pointer updates with zero recursive loops."
      }
    }
    if (node.id === "sorting-algorithms") {
      return {
        title: "In-Place Lomuto Partitioning Snippet",
        code: `// O(N) In-Place Partitioning (Lomuto)
int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high]; // Rightmost element as pivot
    int i = low - 1;
    
    for (int j = low; j < high; ++j) {
        if (arr[j] <= pivot) {
            swap(arr[++i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1; // Pivot fixed in sorted spot
}`,
        traceSteps: [
          { label: "Step 1: Pivot Selection", desc: "Pivot chosen, partition index i initialized before low" },
          { label: "Step 2: Dual Scanning", desc: "Elements <= pivot swapped to left partition [low..i]" },
          { label: "Step 3: Final Placement", desc: "Pivot placed at index i+1; Left <= pivot < Right invariant guaranteed" },
        ],
        complexityNote: "Partitioning runs in strict O(N) time and O(1) auxiliary space."
      }
    }
    return {
      title: `${node.label} Reference Implementation`,
      code: `// Core Invariant & Pointer Structure for ${node.label}
struct Node {
    int value;
    Node* left = nullptr;
    Node* right = nullptr;
    int height = 1;
};

// Guarantee invariant: ${node.complexity || "O(log N)"}
bool verifyInvariant(Node* root) {
    if (!root) return true;
    return verifyInvariant(root->left) && verifyInvariant(root->right);
}`,
      traceSteps: [
        { label: "Base State", desc: `Initial memory layout satisfying ${node.label} constraints` },
        { label: "Operation Step", desc: `Local update maintaining ${node.complexity || "O(log N)"} asymptotic bound` },
        { label: "Verified State", desc: "Boundary conditions verified with defensive null checks" },
      ],
      complexityNote: `Maintains invariant with ${node.complexity || "O(log N)"} complexity.`
    }
  }, [node.id, node.label, node.complexity])

  // 4 Core Breakdown Cards for Theory Mode
  const theoryCards = React.useMemo(() => {
    if (taskDetail?.cards && taskDetail.cards.length >= 4) {
      return taskDetail.cards.slice(0, 4)
    }
    return [
      {
        badge: "01",
        title: `${node.label} Structural Invariant`,
        detail: `Core representation and memory layout properties that guarantee correctness across all ${node.label} operations.`,
        tag: "Invariant",
      },
      {
        badge: "02",
        title: "Asymptotic Bound Analysis",
        detail: `Mathematical proof bounding worst-case operations to ${node.complexity || "O(log N)"} through localized invariant maintenance.`,
        tag: "Complexity",
      },
      {
        badge: "03",
        title: "Edge Cases & Pointer Guards",
        detail: "Defensive handling of empty roots, single-node scenarios, duplicate keys, and unbalanced input distributions.",
        tag: "Boundary",
      },
      {
        badge: "04",
        title: "Problem Patterns & Usage",
        detail: `Key algorithmic indicators where ${node.label} outperforms naive structures in competitive programming and systems design.`,
        tag: "Application",
      },
    ]
  }, [taskDetail?.cards, node.label, node.complexity])

  // 3-Question assessment suite for Task 2
  const quizQuestions = React.useMemo(() => {
    if (Array.isArray(taskDetail?.questions) && taskDetail.questions.length > 0) {
      return taskDetail.questions.map((q: any, idx: number) => ({
        prompt: q.prompt || q.questionPrompt || `Question ${idx + 1} for ${node.label}`,
        options: q.options || [],
        explanation: q.explanation || q.hints?.correct || `Correct! Option properly satisfies ${node.label} invariants.`,
        clue: q.hint || q.clue || q.hints?.incorrect || "Review how this data structure enforces local vs global invariants.",
      }))
    }

    const q1 = {
      prompt: taskDetail?.questionPrompt || `Which invariant strictly defines ${node.label}?`,
      options: taskDetail?.options || [
        { id: "A", text: `${node.label} maintains strict invariant bounds.`, isCorrect: true },
        { id: "B", text: "Degenerates into unlinked memory.", isCorrect: false },
        { id: "C", text: "Requires global array reallocation on each read.", isCorrect: false },
        { id: "D", text: "Disables asymptotic efficiency bounds.", isCorrect: false },
      ],
      explanation: taskDetail?.hints?.correct || `Correct! ${node.label} enforces this core invariant across mutations.`,
      clue: taskDetail?.hints?.incorrect || "Review how this data structure enforces local vs global invariants.",
    }

    const q2 = {
      prompt: `What is the tight operational time complexity bound for ${node.label}?`,
      options: [
        { id: "A", text: `${node.complexity || "O(log N)"} asymptotic bound`, isCorrect: true },
        { id: "B", text: "O(N²) quadratic time in all cases", isCorrect: false },
        { id: "C", text: "O(1) constant time without traversal", isCorrect: false },
        { id: "D", text: "O(N!) factorial recursion depth", isCorrect: false },
      ],
      explanation: `Correct! ${node.label} is specifically engineered to bound operations within ${node.complexity || "O(log N)"}.`,
      clue: `Think about how the tree height or partition step divides the problem size.`,
    }

    const q3 = {
      prompt: `How are mutations handled to avoid degrading memory performance?`,
      options: [
        { id: "A", text: "Local pointer updates or in-place partition without full reallocation", isCorrect: true },
        { id: "B", text: "Copying all elements into a new heap array on every insert", isCorrect: false },
        { id: "C", text: "Ignoring null checks and allowing undefined behavior", isCorrect: false },
        { id: "D", text: "Allocating auxiliary O(N²) buffers for temporary pointers", isCorrect: false },
      ],
      explanation: "Correct! Splicing and pointer rotations operate locally with O(1) auxiliary space.",
      clue: "Does a rotation or partition require rebuilding the entire data structure?",
    }

    return [q1, q2, q3]
  }, [taskDetail, node.label, node.complexity])

  const currentQ = quizQuestions[quizQuestionIndex] || quizQuestions[0]
  const currentQKey = `Q${quizQuestionIndex + 1}`
  const currentQState = quizQuestionsMap[currentQKey] || {
    selected: null,
    checked: false,
    isCorrect: false,
  }
  const currentQSelectedOption = currentQState.selected
  const isCurrentQChecked = currentQState.checked
  const isCurrentQCorrect = currentQState.isCorrect

  const correctQuizQuestionsCount = React.useMemo(() => {
    return quizQuestions.filter((_: any, idx: number) => quizQuestionsMap[`Q${idx + 1}`]?.isCorrect === true).length
  }, [quizQuestions, quizQuestionsMap])

  const isQuizFullyCompleted = correctQuizQuestionsCount === quizQuestions.length // 3/3 Correct

  // State cho phần Monaco Code Editor (khôi phục code đang viết dở hoặc dùng initialCode)
  const [code, setCode] = React.useState<string>(
    taskDetail?.initialCode || ""
  )
  const [isCodeSavedBadge, setIsCodeSavedBadge] = React.useState<boolean>(false)
  const [isRunningCode, setIsRunningCode] = React.useState<boolean>(false)
  const [codeRunOutcome, setCodeRunOutcome] = React.useState<
    "initial" | "warning" | "passed"
  >("initial")
  const [lastRunMetrics, setLastRunMetrics] = React.useState<{
    runtimeMs: number
    memoryMb: string
  } | null>(null)
  const [executionResult, setExecutionResult] = React.useState<ExecutionResult | null>(null)
  const [executionStatus, setExecutionStatus] = React.useState<
    "idle" | "running" | "success" | "failed"
  >("idle")
  const [activeAction, setActiveAction] = React.useState<"run" | "submit" | null>(null)
  const [isOutdated, setIsOutdated] = React.useState<boolean>(false)
  const executedCodeRef = React.useRef<string>("")
  const [cursorPos, setCursorPos] = React.useState<{
    line: number
    col: number
  }>({
    line: 18,
    col: 1,
  })
  const [hintsRemaining, setHintsRemaining] = React.useState<number>(2)

  // State dùng chung quản lý cửa sổ công cụ nổi (tại 1 thời điểm chỉ mở "tutor" hoặc "visualization")
  const [activeTool, setActiveTool] = React.useState<
    "tutor" | "visualization" | null
  >(null)
  const [isVisMinimized, setIsVisMinimized] = React.useState<boolean>(false)
  const [isVisExpanded, setIsVisExpanded] = React.useState<boolean>(false)
  const [hasNewHintAlert, setHasNewHintAlert] = React.useState<boolean>(false)
  const [isProblemCollapsed, setIsProblemCollapsed] = React.useState<boolean>(false)
  const [mobileTab, setMobileTab] = React.useState<"problem" | "code">("code")

  // Auto-resize Monaco Editor whenever Problem Description Panel toggles or mobile tab switches
  React.useEffect(() => {
    const timer = setTimeout(() => {
      editorRef.current?.layout()
    }, 80)
    return () => clearTimeout(timer)
  }, [isProblemCollapsed, mobileTab])

  // Refs tới Monaco Editor để điều khiển highlight dòng lỗi & cuộn tới dòng lỗi
  const editorRef = React.useRef<any>(null)
  const monacoRef = React.useRef<any>(null)
  const decorationIdsRef = React.useRef<string[]>([])

  const socraticProfile = React.useMemo(
    () =>
      getSocraticTutorProfile(
        node.id,
        node.label,
        node.complexity || "O(N)"
      ),
    [node.id, node.label, node.complexity]
  )

  const handleUpdateHintsRemaining = React.useCallback(
    (nextHints: number) => {
      setHintsRemaining(nextHints)
      saveHints(activeTask.id, nextHints)
    },
    [activeTask.id, saveHints]
  )

  const handleFocusFaultyLine = React.useCallback(
    (targetLine?: number) => {
      const lineToFocus = targetLine || socraticProfile.faultyLine.line || 18
      if (!editorRef.current) return
      editorRef.current.revealLineInCenter(lineToFocus)
      editorRef.current.setPosition({ lineNumber: lineToFocus, column: 1 })
      editorRef.current.focus()
    },
    [socraticProfile.faultyLine.line]
  )

  // Đồng bộ Monaco line decoration (vệt mờ + con trỏ trỏ tới dòng lỗi) khi Run Code bị warning
  React.useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    if (activeMode === "coding" && codeRunOutcome === "warning") {
      const targetLine = socraticProfile.faultyLine.line || 18
      const model = editor.getModel()
      const maxLine = model ? model.getLineCount() : targetLine
      const safeLine = Math.min(Math.max(1, targetLine), maxLine)

      decorationIdsRef.current = editor.deltaDecorations(
        decorationIdsRef.current,
        [
          {
            range: new monaco.Range(safeLine, 1, safeLine, 1),
            options: {
              isWholeLine: true,
              className: "algopath-faulty-line-bg",
              linesDecorationsClassName: "algopath-faulty-line-gutter",
              after: {
                content: `  ⟵ [FAULT] ${socraticProfile.faultyLine.shortReason}`,
                inlineClassName: "algopath-faulty-inline-pointer",
              },
            },
          },
        ]
      )
      editor.revealLineInCenter(safeLine)
      editor.setPosition({ lineNumber: safeLine, column: 1 })
    } else {
      decorationIdsRef.current = editor.deltaDecorations(
        decorationIdsRef.current,
        []
      )
    }
  }, [activeMode, codeRunOutcome, socraticProfile])

  // Đồng bộ đáp án Quiz, bản nháp Code và số lượt Hint từ bộ nhớ của User khi đổi Task hoặc khi F5
  React.useEffect(() => {
    const isNewTask = activeTaskIdRef.current !== activeTask.id
    activeTaskIdRef.current = activeTask.id

    // 1. Khôi phục trạng thái các câu hỏi Quiz
    const savedQuiz = userProgress.quizAnswers?.[activeTask.id] as any
    if (savedQuiz?.questionsMap && typeof savedQuiz.questionsMap === "object") {
      setQuizQuestionsMap(savedQuiz.questionsMap)
    } else if (savedQuiz?.selectedOption) {
      setQuizQuestionsMap({
        Q1: {
          selected: savedQuiz.selectedOption,
          checked: true,
          isCorrect: Boolean(savedQuiz.isSubmitted),
        },
      })
    } else if (isNewTask) {
      setQuizQuestionsMap({})
      setQuizQuestionIndex(0)
    }

    // 2. Chống reset code & executionResult khi Alt-Tab / visibilitychange
    if (isNewTask) {
      const savedCodeObj = userProgress.codeDrafts?.[activeTask.id]
      const savedCode =
        typeof savedCodeObj === "string" ? savedCodeObj : savedCodeObj?.code
      if (typeof savedCode === "string") {
        setCode(savedCode)
      } else if (taskDetail?.initialCode) {
        setCode(taskDetail.initialCode)
      }

      // Khôi phục kết quả chạy code từ sessionStorage nếu có
      const cachedRaw =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(`offbyone_exec_result_${activeTask.id}`)
          : null

      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw)
          setExecutionResult(cached.executionResult || null)
          setExecutionStatus(cached.executionStatus || "idle")
          setCodeRunOutcome(cached.codeRunOutcome || "initial")
          setLastRunMetrics(cached.lastRunMetrics || null)
          setActiveAction(cached.activeAction || null)
          if (cached.code) setCode(cached.code)
        } catch {
          setExecutionResult(null)
          setExecutionStatus("idle")
          setCodeRunOutcome("initial")
          setLastRunMetrics(null)
          setActiveAction(null)
        }
      } else if (savedCodeObj?.isSubmitted) {
        setCodeRunOutcome("passed")
        setLastRunMetrics({ runtimeMs: 12, memoryMb: "4.1 MB" })
        setExecutionStatus("success")
        setActiveAction("submit")
        setIsOutdated(false)
        setExecutionResult({
          action: "submit",
          status: "success",
          metrics: { runtimeMs: 12, memoryMb: "4.1 MB" },
          passedCount: 8,
          totalCount: 8,
          testCases: [],
          complexity: {
            timeComplexity: taskDetail?.analysis?.timeComplexity || "O(1)",
            spaceComplexity: taskDetail?.analysis?.spaceComplexity || "O(1)",
            optimal: true,
            optimalNote: taskDetail?.analysis?.optimalNote || "Meets optimal bounds.",
          },
        })
        executedCodeRef.current = typeof savedCode === "string" ? savedCode : (taskDetail?.initialCode || "")
      } else {
        setCodeRunOutcome("initial")
        setLastRunMetrics(null)
        setExecutionStatus("idle")
        setActiveAction(null)
        setIsOutdated(false)
        setExecutionResult(null)
        executedCodeRef.current = ""
      }
    }

    const savedHintCount = userProgress.hintsRemaining?.[activeTask.id]
    setHintsRemaining(
      typeof savedHintCount === "number" ? savedHintCount : 2
    )
    setIsCodeSavedBadge(false)
    setHasNewHintAlert(false)
    setActiveTool((prev) =>
      activeMode !== "coding" && prev === "visualization" ? null : prev
    )
  }, [
    activeTask.id,
    activeMode,
    taskDetail?.initialCode,
    isProgressLoaded,
    userProgress.userId,
    userProgress.quizAnswers,
    userProgress.codeDrafts,
    userProgress.hintsRemaining,
    taskDetail?.analysis,
  ])

  const handleSelectQuizOption = React.useCallback(
    (optionId: string) => {
      setQuizQuestionsMap((prev) => ({
        ...prev,
        [currentQKey]: {
          selected: optionId,
          checked: false,
          isCorrect: false,
        },
      }))
    },
    [currentQKey]
  )

  const handleCheckQuizAnswer = React.useCallback(async () => {
    if (!currentQSelectedOption) return
    setIsEvaluatingQuiz(true)
    const optObj = currentQ.options.find((o: any) => o.id === currentQSelectedOption)
    let isCorrect = Boolean(optObj?.isCorrect)

    try {
      const evalRes = await evaluateQuizAnswer(activeTask.id, currentQSelectedOption)
      if (evalRes && typeof evalRes.isCorrect === "boolean") {
        isCorrect = evalRes.isCorrect
      }
    } catch {}

    setIsEvaluatingQuiz(false)
    const nextMap = {
      ...quizQuestionsMap,
      [currentQKey]: {
        selected: currentQSelectedOption,
        checked: true,
        isCorrect,
      },
    }
    setQuizQuestionsMap(nextMap)

    const all3Correct = quizQuestions.every(
      (_: any, idx: number) => nextMap[`Q${idx + 1}`]?.isCorrect === true
    )

    saveQuizAnswer(activeTask.id, {
      questionsMap: nextMap,
      selectedOption: currentQSelectedOption,
      isSubmitted: all3Correct,
    } as any)

    if (all3Correct) {
      completeTask(activeTask.id)
      setHasNewHintAlert(false)
      if (currentUser?.id) {
        syncTaskProgressToSupabase(currentUser.id, activeTask.id, true, {
          questionsMap: nextMap,
        }).catch(() => {})
      }
    } else {
      setHasNewHintAlert(activeTool !== "tutor")
    }
  }, [
    currentQSelectedOption,
    currentQ.options,
    activeTask.id,
    currentQKey,
    quizQuestionsMap,
    quizQuestions,
    saveQuizAnswer,
    completeTask,
    activeTool,
    currentUser?.id,
  ])

  const handleNextQuizQuestion = React.useCallback(() => {
    if (quizQuestionIndex < quizQuestions.length - 1) {
      setQuizQuestionIndex((prev) => prev + 1)
    }
  }, [quizQuestionIndex, quizQuestions.length])

  const handleCodeChange = React.useCallback(
    (nextValue: string | undefined) => {
      const nextCode = nextValue ?? ""
      setCode(nextCode)
      saveCodeDraft(activeTask.id, {
        code: nextCode,
        language: taskDetail?.language || "C++",
      })
      setIsCodeSavedBadge(true)

      // Mark execution results as outdated if code has been modified since last run
      if (executedCodeRef.current && nextCode !== executedCodeRef.current) {
        setIsOutdated(true)
      }
    },
    [activeTask.id, saveCodeDraft, taskDetail?.language]
  )

  const handleCompleteAndAdvance = React.useCallback(
    (targetTaskId?: string) => {
      completeTask(activeTask.id)
      if (targetTaskId) {
        router.push(
          `/workspace/${encodeURIComponent(node.id)}/${encodeURIComponent(
            targetTaskId
          )}`
        )
      }
    },
    [completeTask, activeTask.id, router, node.id]
  )

  const handleRunCode = React.useCallback(async () => {
    if (executionStatus === "running") return
    setExecutionStatus("running")
    setIsRunningCode(true)
    setActiveAction("run")
    setIsOutdated(false)

    saveCodeDraft(activeTask.id, {
      code,
      language: taskDetail?.language || "C++",
    })

    try {
      const result = await runCode(
        activeTask.id,
        code,
        taskDetail?.language || "C++",
        taskDetail
      )
      executedCodeRef.current = code
      setExecutionResult(result)
      setExecutionStatus(result.status)
      setIsRunningCode(false)

      const isPass = result.status === "success"
      setCodeRunOutcome(isPass ? "passed" : "warning")
      setLastRunMetrics(result.metrics)
      setHasNewHintAlert(!isPass && activeTool !== "tutor")
      setIsCodeSavedBadge(true)

      // Lưu kết quả vào sessionStorage để chống reset khi Alt-Tab
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            `offbyone_exec_result_${activeTask.id}`,
            JSON.stringify({
              executionResult: result,
              executionStatus: result.status,
              codeRunOutcome: isPass ? "passed" : "warning",
              lastRunMetrics: result.metrics,
              activeAction: "run",
              code,
            })
          )
        } catch {}
      }
    } catch {
      setExecutionStatus("failed")
      setIsRunningCode(false)
    }
  }, [
    executionStatus,
    activeTask.id,
    code,
    taskDetail,
    saveCodeDraft,
    activeTool,
  ])

  const handleSubmitCode = React.useCallback(async () => {
    if (executionStatus === "running") return
    setExecutionStatus("running")
    setIsRunningCode(true)
    setActiveAction("submit")
    setIsOutdated(false)

    try {
      const result = await submitCode(
        activeTask.id,
        code,
        taskDetail?.language || "C++",
        taskDetail
      )
      executedCodeRef.current = code
      setExecutionResult(result)
      setExecutionStatus(result.status)
      setIsRunningCode(false)

      const isPass = result.status === "success"
      if (isPass) {
        completeTask(activeTask.id)
        if (currentUser?.id) {
          syncTaskProgressToSupabase(currentUser.id, activeTask.id, true, null).catch(() => {})
        }
        saveCodeDraft(activeTask.id, {
          code,
          language: taskDetail?.language || "C++",
          isSubmitted: true,
        })
        setCodeRunOutcome("passed")
        setHasNewHintAlert(false)
      } else {
        setCodeRunOutcome("warning")
        setHasNewHintAlert(activeTool !== "tutor")
      }
      setLastRunMetrics(result.metrics)
      setIsCodeSavedBadge(true)

      // Lưu kết quả vào sessionStorage để chống reset khi Alt-Tab
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            `offbyone_exec_result_${activeTask.id}`,
            JSON.stringify({
              executionResult: result,
              executionStatus: result.status,
              codeRunOutcome: isPass ? "passed" : "warning",
              lastRunMetrics: result.metrics,
              activeAction: "submit",
              code,
            })
          )
        } catch {}
      }
    } catch {
      setExecutionStatus("failed")
      setIsRunningCode(false)
    }
  }, [
    executionStatus,
    activeTask.id,
    code,
    taskDetail,
    completeTask,
    saveCodeDraft,
    activeTool,
    currentUser?.id,
  ])

  const handleSelectTask = React.useCallback(
    (targetTaskId: string) => {
      router.push(
        `/workspace/${encodeURIComponent(node.id)}/${encodeURIComponent(
          targetTaskId
        )}`
      )
    },
    [router, node.id]
  )

  // Tìm Task kế tiếp trong cùng Node để điều hướng khi bấm nút "Next: Take Quiz" hoặc "Submit"
  const nextTask = React.useMemo(() => {
    const currentIndex = node.tasks.findIndex((t) => t.id === activeTask.id)
    if (currentIndex >= 0 && currentIndex + 1 < node.tasks.length) {
      return node.tasks[currentIndex + 1]
    }
    return null
  }, [node.tasks, activeTask.id])

  const isTask1Completed = isTaskCompleted(node.tasks[0]?.id || "", node.tasks[0]?.status)

  const handleCompleteTask1AndProceed = React.useCallback(() => {
    completeTask(activeTask.id)
    if (currentUser?.id) {
      syncTaskProgressToSupabase(currentUser.id, activeTask.id, true, null).catch(() => {})
    }
    if (nextTask) {
      handleCompleteAndAdvance(nextTask.id)
    }
  }, [activeTask.id, completeTask, currentUser?.id, nextTask, handleCompleteAndAdvance])

  const handleCompleteQuizAndOpenCode = React.useCallback(() => {
    if (!isQuizFullyCompleted) return
    completeTask(activeTask.id)
    if (currentUser?.id) {
      syncTaskProgressToSupabase(currentUser.id, activeTask.id, true, {
        questionsMap: quizQuestionsMap,
      }).catch(() => {})
    }
    if (nextTask) {
      handleCompleteAndAdvance(nextTask.id)
    }
  }, [
    isQuizFullyCompleted,
    activeTask.id,
    completeTask,
    currentUser?.id,
    quizQuestionsMap,
    nextTask,
    handleCompleteAndAdvance,
  ])

  const handleCopyTheoryCode = React.useCallback((text: string) => {
    if (!text) return
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopiedTheoryCode(true)
    setTimeout(() => setCopiedTheoryCode(false), 2000)
  }, [])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    const defaultLine = socraticProfile.faultyLine.line || 18
    editor.setPosition({ lineNumber: defaultLine, column: 1 })
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      })
    })
  }

  const selectedQuizOptionObj = React.useMemo(() => {
    if (!currentQSelectedOption || !Array.isArray(currentQ?.options)) return null
    return (
      currentQ.options.find(
        (opt: any) => opt.id === currentQSelectedOption
      ) || null
    )
  }, [currentQSelectedOption, currentQ])

  const resolvedProblem = React.useMemo(() => {
    if (taskDetail?.problem) {
      const p = taskDetail.problem
      let descText = ""
      if (typeof p.description === "string") {
        descText = p.description
      } else if (p.description && typeof p.description === "object") {
        const paragraphs = [p.description.paragraph1, p.description.paragraph2].filter(Boolean)
        descText =
          paragraphs.length > 0
            ? paragraphs.join("\n\n")
            : typeof p.description.description === "string"
            ? p.description.description
            : typeof p.description.summaryLead === "string"
            ? p.description.summaryLead
            : "Problem Specification"
      } else if (typeof p.summaryLead === "string") {
        descText = p.summaryLead
      } else {
        descText = "No description provided."
      }

      return {
        ...p,
        title: p.title || activeTask.title || "Problem Specification",
        difficulty: (p.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
        description: descText,
        inputFormat: p.inputFormat || "Standard input format according to C++ function signature.",
        outputFormat: p.outputFormat || "Standard output format or return value.",
        examples: Array.isArray(p.examples) ? p.examples : [],
        constraints: Array.isArray(p.constraints)
          ? p.constraints
          : ["C++17 / C++20 compliance", "Optimal time and memory bounds"],
      }
    }

    // If taskDetail has an object-shaped description (e.g. OOP coding tasks)
    if (typeof taskDetail?.description === "object" && taskDetail?.description !== null) {
      const descObj = taskDetail.description
      const paragraphs = [descObj.paragraph1, descObj.paragraph2].filter(Boolean)
      const textDescription =
        paragraphs.length > 0
          ? paragraphs.join("\n\n")
          : typeof descObj.description === "string"
          ? descObj.description
          : typeof descObj.summaryLead === "string"
          ? descObj.summaryLead
          : "Problem Specification"

      return {
        title: descObj.title || taskDetail.title || activeTask.title || "Problem Specification",
        difficulty: (descObj.difficulty || taskDetail.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
        description: textDescription,
        inputFormat: descObj.inputFormat || taskDetail.inputFormat || "Standard input format according to C++ function signature.",
        outputFormat: descObj.outputFormat || taskDetail.outputFormat || "Standard output format or return value.",
        examples: Array.isArray(descObj.examples)
          ? descObj.examples
          : Array.isArray(taskDetail.testCases)
          ? taskDetail.testCases.slice(0, 3).map((tc: any, i: number) => ({
              input: tc.input || "",
              output: tc.expected || tc.output || "",
              explanation: tc.explanation || `Sample test case ${i + 1}`,
            }))
          : [],
        constraints: descObj.constraints || taskDetail.constraints || [
          "C++17 / C++20 compliance",
          "Optimal time and memory bounds",
        ],
      }
    }

    if (taskDetail?.description || taskDetail?.markdown || taskDetail?.content) {
      return {
        title: taskDetail.title || activeTask.title || "Problem Specification",
        difficulty: (taskDetail.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
        description:
          typeof taskDetail.description === "string"
            ? taskDetail.description
            : typeof taskDetail.markdown === "string"
            ? taskDetail.markdown
            : typeof taskDetail.content === "string"
            ? taskDetail.content
            : "No description provided.",
        inputFormat: taskDetail.inputFormat || "Standard Input as described.",
        outputFormat: taskDetail.outputFormat || "Standard Output result.",
        examples: Array.isArray(taskDetail.testCases)
          ? taskDetail.testCases.slice(0, 3).map((tc: any, i: number) => ({
              input: tc.input || "",
              output: tc.expected || tc.output || "",
              explanation: tc.explanation || `Sample test case ${i + 1}`,
            }))
          : [],
        constraints: taskDetail.constraints || [
          "1 <= N <= 10^5",
          "Time Limit: 2.0s",
          "Memory Limit: 256MB",
        ],
      }
    }
    return null
  }, [taskDetail, activeTask.title])

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface-secondary font-mono text-xs text-cyan">
        Verifying session...
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background p-2 font-sans text-text-secondary selection:bg-primary/30 selection:text-text-primary">
      {/* ==================== KHÔNG GIAN LÀM VIỆC IDE DOCKED 3 CỘT (MAIN WORKSPACE 100VH) ==================== */}
      <main className="relative z-10 flex h-full min-h-0 w-full flex-1 gap-2 overflow-hidden">
        {/* -------------------- CỘT 1 (TRÁI): THANH ĐIỀU HƯỚNG TASK THEO NODE + STEPPER + SOCRATIC -------------------- */}
        <aside className="w-56 xl:w-64 h-full min-h-0 shrink-0 flex flex-col justify-between overflow-hidden rounded-lg border border-border-subtle bg-surface p-2.5">
          {/* Top Header: BrandLogo + Back to Roadmap Link */}
          <div className="shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
              <Link
                href={WORKSPACE_LINKS.brand}
                className="group flex shrink-0 items-center transition-opacity hover:opacity-95"
                title="OffByOne Home"
              >
                <BrandLogo size="sm" priority />
              </Link>
              <Link
                href={WORKSPACE_LINKS.backToSkillTree}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border-subtle bg-surface-secondary px-2 text-[11px] font-medium text-text-secondary transition-colors hover:border-border hover:text-text-primary"
                title="Back to Skill Tree"
              >
                <ArrowLeft className="size-3 text-primary" />
                <span>Roadmap</span>
              </Link>
            </div>

            {/* Topic Progress Bar */}
            <div className="border-b border-border-subtle pb-2.5">
              <div className="flex items-center justify-between">
                <h1 className="text-xs font-bold uppercase tracking-wider text-text-primary truncate" title={node.label}>
                  {node.label}
                </h1>
                <span className="font-mono text-[10px] font-bold text-[#7aa2f7]">
                  {completedTasksCount}/{node.tasks.length}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-muted">
                <span>Topic Progress</span>
                <span>{Math.round((completedTasksCount / Math.max(1, node.tasks.length)) * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full border border-[#292e42] bg-[#16161e]">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${Math.round((completedTasksCount / Math.max(1, node.tasks.length)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Connected Vertical Stepper (No Reverse Lock) */}
          <div className="relative mt-2 flex-1 space-y-2.5 shrink-0 overflow-y-auto">
            {/* Continuous vertical connector line */}
            <div className="absolute left-[15px] top-3 bottom-5 w-0.5 bg-[#292e42] z-0" />

            {stepperTasks.map((st) => (
              <button
                key={st.id}
                type="button"
                disabled={st.isLocked}
                onClick={() => !st.isLocked && handleSelectTask(st.id)}
                className={cn(
                  "relative z-10 flex w-full items-start gap-2 rounded-lg border p-2 text-left transition-all",
                  st.isDone && st.isActive
                    ? "border-[#7aa2f7] ring-1 ring-[#7aa2f7]/60 bg-[#24283b] shadow-sm cursor-pointer"
                    : st.isActive
                    ? "border-[#7aa2f7] bg-[#7aa2f7]/10 shadow-sm cursor-pointer"
                    : st.isDone
                    ? "border-emerald-500/30 bg-[#16161e] hover:border-emerald-500/60 cursor-pointer"
                    : st.isAvailable
                    ? "border-[#292e42] bg-[#16161e] hover:border-[#7aa2f7]/50 cursor-pointer"
                    : "border-[#292e42]/50 bg-[#16161e]/40 opacity-50 cursor-not-allowed"
                )}
              >
                {/* Stepper Node Circle */}
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                    st.isDone
                      ? "border border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : st.isActive
                      ? "border-2 border-[#7aa2f7] bg-[#16161e] text-[#7aa2f7]"
                      : st.isAvailable
                      ? "border border-[#292e42] bg-[#1a1b26] text-[#c0caf5]"
                      : "border border-[#292e42] bg-[#16161e] text-[#565f89]"
                  )}
                >
                  {st.isDone ? (
                    <Check className="size-3 stroke-[3]" />
                  ) : st.isLocked ? (
                    <Lock className="size-2.5 text-[#565f89]" />
                  ) : (
                    st.taskIcon
                  )}
                </div>

                {/* Stepper Step Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold uppercase tracking-wider",
                        st.isDone
                          ? "text-emerald-400"
                          : st.isActive
                          ? "text-[#7aa2f7]"
                          : "text-text-muted"
                      )}
                    >
                      {`0${st.idx + 1} ${st.typeLabel}`}
                    </span>

                    {/* Status Badge: if isDone, ALWAYS show Done / Viewing • Done */}
                    {st.isDone ? (
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-emerald-400">
                        {st.isActive ? "Viewing • Done" : "Done"}
                      </span>
                    ) : st.isActive ? (
                      <span className="rounded bg-[#7aa2f7]/20 border border-[#7aa2f7]/40 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#7aa2f7]">
                        Active
                      </span>
                    ) : (
                      <span className="rounded border border-[#292e42] bg-[#16161e] px-1.5 py-0.2 font-mono text-[9px] text-[#565f89]">
                        {st.isAvailable ? "Open" : "Locked"}
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "mt-0.5 truncate text-[11px] font-medium leading-tight",
                      st.isActive
                        ? "text-white font-semibold"
                        : st.isDone
                        ? "text-[#c0caf5]"
                        : "text-text-muted"
                    )}
                  >
                    {st.title}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Socratic AI Tutor Card in Sidebar */}
          <div className="mt-2 space-y-2 border-t border-border-subtle pt-2 shrink-0">
            <div
              className={cn(
                "relative rounded-lg border p-2.5 transition-colors",
                activeTool === "tutor"
                  ? "border-[#7aa2f7]/60 bg-[#7aa2f7]/10"
                  : hasNewHintAlert
                  ? "border-warning/70 bg-surface"
                  : "border-[#292e42] bg-[#16161e] hover:border-[#7aa2f7]/40"
              )}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[#7aa2f7]/35 bg-[#7aa2f7]/15 text-[#7aa2f7]">
                    <Bot className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-bold text-white">
                      Socratic AI Tutor
                    </div>
                    <div className="flex items-center gap-1 text-[9.5px] font-medium text-emerald-400">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full bg-emerald-400",
                          hasNewHintAlert && "bg-warning"
                        )}
                      />
                      <span className={cn(hasNewHintAlert && "text-warning")}>
                        {hasNewHintAlert ? "New hint ready" : "Ready to guide"}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="shrink-0 rounded-md border border-[#7aa2f7]/30 bg-[#16161e] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-[#7aa2f7] tabular-nums">
                  {hintsRemaining}/3
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHasNewHintAlert(false)
                  setActiveTool((prev) => (prev === "tutor" ? null : "tutor"))
                }}
                className={cn(
                  "mt-2 inline-flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border text-[10.5px] font-semibold transition-colors",
                  activeTool === "tutor"
                    ? "border-[#7aa2f7] bg-[#7aa2f7]/20 text-[#7aa2f7]"
                    : "border-[#292e42] bg-[#1a1b26] text-[#c0caf5] hover:border-[#7aa2f7]/60 hover:text-white hover:bg-[#24283b]"
                )}
              >
                <Sparkles className="size-3 text-[#7aa2f7]" />
                <span>{activeTool === "tutor" ? "Hide Socratic Panel" : "Get a Hint"}</span>
              </button>
            </div>

            {/* Topic Reference Box */}
            <div className="rounded-lg border border-[#292e42] bg-[#16161e] p-2.5 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#7aa2f7]">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3.5 text-[#bb9af7]" />
                  <span>Topic Reference</span>
                </div>
                <span className="rounded bg-[#7aa2f7]/10 px-1.5 py-0.2 font-mono text-[9px] text-[#7aa2f7] border border-[#7aa2f7]/30">
                  RAG Indexed
                </span>
              </div>
              <p className="mt-1 text-[10.5px] font-mono text-[#c0caf5] truncate" title={(node as any).document_id === "doc-oop-syllabus" ? "CS102_OOP_Cpp_Syllabus.pdf" : "CS101_DSA_Syllabus.pdf"}>
                {(node as any).document_id === "doc-oop-syllabus" ? "CS102_OOP_Cpp_Syllabus.pdf" : "CS101_DSA_Syllabus.pdf"}
              </p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-[#565f89]">
                <span>{taskDetail?.slideLabel || "Slide 14 • Courseware"}</span>
                <span className="font-mono text-emerald-400">Verified</span>
              </div>
            </div>
          </div>

          {/* Footer of Left Sidebar: Compact User Profile + ThemeToggle */}
          <div className="mt-auto shrink-0 border-t border-border-subtle pt-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <UserProfileMenu />
            </div>
            <div className="shrink-0 ml-auto">
              <ThemeToggleButton />
            </div>
          </div>
        </aside>

        {/* -------------------- CỘT 2 (GIỮA): VÙNG LÀM VIỆC CHÍNH (THEORY / QUIZ / CODING) -------------------- */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          {activeMode !== "coding" ? (
            <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-border-subtle bg-surface-secondary custom-description-scrollbar transition-colors duration-150 ease-out">
              {/* Header Bar for Theory & Quiz */}
              <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-6 py-3">
                <div className="flex items-center gap-2.5">
                  {activeMode === "theory" ? (
                    <BookOpen className="size-4 text-[#7aa2f7]" />
                  ) : (
                    <HelpCircle className="size-4 text-[#bb9af7]" />
                  )}
                  <h2 className="text-xs font-bold tracking-wider text-text-primary uppercase">
                    {taskDetail?.headerTitle || taskDetail?.title || "Task Overview"}
                  </h2>
                </div>

                {/* Theory Header Action */}
                {activeMode === "theory" && (
                  <div className="flex items-center gap-2">
                    {isTask1Completed ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                          <Check className="size-3.5 stroke-[3]" />
                          Theory Completed
                        </span>
                        {nextTask && (
                          <button
                            type="button"
                            onClick={() => handleSelectTask(nextTask.id)}
                            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[#7aa2f7]/40 bg-[#7aa2f7]/15 px-3.5 text-xs font-bold text-[#7aa2f7] hover:bg-[#7aa2f7]/25 transition-all shadow-sm"
                          >
                            <span>Continue to Task 2: Quiz</span>
                            <ArrowRight className="size-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      nextTask && (
                        <button
                          type="button"
                          onClick={handleCompleteTask1AndProceed}
                          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-[#7aa2f7] px-4 text-xs font-bold text-[#16161e] transition-all hover:bg-[#7aa2f7]/90 active:scale-95 shadow-sm"
                        >
                          <span>Mark as Completed &amp; Take Quiz</span>
                          <ArrowRight className="size-3.5" />
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Quiz Header: Question Switcher Pills with Checkmarks */}
                {activeMode === "quiz" && (
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#16161e] border border-[#292e42] text-[#c0caf5]">
                      <span className={correctQuizQuestionsCount === quizQuestions.length ? "text-emerald-400" : "text-[#7aa2f7]"}>
                        {correctQuizQuestionsCount}/{quizQuestions.length}
                      </span> Correct
                    </span>

                    <div className="flex items-center gap-1.5">
                      {quizQuestions.map((_: any, qIdx: number) => {
                        const qK = `Q${qIdx + 1}`
                        const qRecord = quizQuestionsMap[qK]
                        const isQCorrect = qRecord?.isCorrect === true
                        const isQFailed = qRecord?.checked === true && !isQCorrect
                        const isCurrentPill = quizQuestionIndex === qIdx

                        return (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => setQuizQuestionIndex(qIdx)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer",
                              isCurrentPill
                                ? "border border-[#7aa2f7] bg-[#7aa2f7] text-[#16161e] shadow-sm"
                                : isQCorrect
                                ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                : isQFailed
                                ? "border border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                                : "border border-[#292e42] bg-[#16161e] text-[#c0caf5] hover:border-[#7aa2f7]/50"
                            )}
                          >
                            <span>Q{qIdx + 1}</span>
                            {isQCorrect && <Check className="size-3 stroke-[3] text-emerald-400" />}
                            {isQFailed && <span className="text-rose-400 text-[10px]">✗</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Area: Max-W-4xl Centered */}
              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-between px-6 py-6 space-y-6">
                {/* ==================== TRẠNG THÁI 1: INTERACTIVE TECH DOCS (THEORY) ==================== */}
                {activeMode === "theory" && (
                  <div className="space-y-6">
                    {/* Phần 1: Concept Overview & Complexity Strip */}
                    <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm space-y-3">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-[#7aa2f7] uppercase tracking-wider">
                          {taskDetail?.moduleLabel || "Module 1 of 3"}
                        </span>
                        <h3 className="mt-1 text-base sm:text-lg font-bold text-text-primary">
                          {taskDetail?.title || `${node.label} Core Foundations`}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-text-secondary">
                          {taskDetail?.summaryLead || `${node.description} Mastering ${node.label} requires understanding structural invariants alongside operational bounds.`}
                        </p>
                      </div>

                      {/* Complexity Strip */}
                      <div className="mt-3 rounded-lg border border-[#292e42] bg-[#16161e] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#7aa2f7] uppercase">Time Complexity:</span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            Best O({node.id.includes("sort") ? "N log N" : "1"}) | Avg {node.complexity || "O(log N)"} | Worst {node.id.includes("sort") ? "O(N²)" : node.complexity || "O(log N)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#bb9af7] uppercase">Space:</span>
                          <span className="font-mono text-white font-semibold">
                            {node.complexity?.includes("log") ? "O(log N) stack" : "O(1) aux"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#7dcfff] uppercase">Invariant:</span>
                          <span className="font-mono text-cyan truncate max-w-[170px]">
                            {node.label} Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Phần 2: Core Breakdown (Left) & Code Reference / Dry-run (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Left: 4 Core Technical Points */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#7aa2f7] flex items-center gap-1.5">
                          <BookOpen className="size-3.5" />
                          <span>Core Structural Invariants</span>
                        </h4>
                        <div className="space-y-3">
                          {theoryCards.map((card: any) => (
                            <div
                              key={card.badge}
                              className="rounded-xl border border-border-subtle bg-surface p-3.5 hover:border-[#7aa2f7]/50 transition-colors shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#7aa2f7]/15 font-mono text-[11px] font-bold text-[#7aa2f7]">
                                  {card.badge}
                                </span>
                                <span className="rounded bg-[#7aa2f7]/10 border border-[#7aa2f7]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#7aa2f7]">
                                  {card.tag}
                                </span>
                              </div>
                              <h5 className="mt-2 text-xs font-bold text-white">
                                {card.title}
                              </h5>
                              <p className="mt-1 text-[11.5px] leading-relaxed text-text-secondary">
                                {card.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Annotated C++ Snippet & Dry-Run Trace */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#bb9af7] flex items-center gap-1.5">
                            <Code2 className="size-3.5" />
                            <span>C++ Reference Snippet</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleCopyTheoryCode(theorySnippet.code)}
                            className="inline-flex items-center gap-1 text-[10.5px] font-mono text-text-muted hover:text-[#7aa2f7] transition-colors"
                          >
                            <Copy className="size-3" />
                            <span>{copiedTheoryCode ? "Copied" : "Copy Code"}</span>
                          </button>
                        </div>

                        {/* Code Block Container */}
                        <div className="rounded-xl border border-[#292e42] bg-[#16161e] p-3 font-mono text-[11px] overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between border-b border-[#292e42] pb-2 text-[10px] text-[#565f89]">
                            <span>{theorySnippet.title}</span>
                            <span className="text-[#9ece6a]">C++17 Validated</span>
                          </div>
                          <pre className="mt-2 text-[#c0caf5] leading-relaxed overflow-x-auto custom-scrollbar">
                            <code>{theorySnippet.code}</code>
                          </pre>
                        </div>

                        {/* Dry-run Memory / Pointer State Trace */}
                        <div className="rounded-xl border border-cyan/30 bg-surface p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-cyan">
                            <span className="flex items-center gap-1.5">
                              <Target className="size-3.5" />
                              <span>Dry-Run State Trace</span>
                            </span>
                            <span className="font-mono text-[10px] text-text-muted">Memory State</span>
                          </div>

                          <div className="space-y-2 pt-1">
                            {theorySnippet.traceSteps.map((step: any, sIdx: number) => (
                              <div key={sIdx} className="rounded-lg border border-[#292e42] bg-[#16161e] p-2 text-xs">
                                <div className="font-mono text-[10.5px] font-bold text-[#7aa2f7]">{step.label}</div>
                                <div className="mt-0.5 text-[11px] text-text-secondary">{step.desc}</div>
                              </div>
                            ))}
                          </div>

                          <p className="text-[10px] font-mono text-text-muted pt-1">
                            {theorySnippet.complexityNote}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Phần 3: Bottom Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveTool((prev) => (prev === "tutor" ? null : "tutor"))}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#7aa2f7]/30 bg-[#7aa2f7]/10 px-4 text-xs font-semibold text-[#7aa2f7] transition-colors hover:bg-[#7aa2f7]/20"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Need Concept Guidance? Ask Socratic AI</span>
                      </button>

                      <div className="flex items-center gap-2.5">
                        {isTask1Completed ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-1.5 font-mono text-xs font-semibold text-emerald-400">
                              <Check className="size-3.5 stroke-[3]" />
                              Theory Completed
                            </span>
                            {nextTask && (
                              <button
                                type="button"
                                onClick={() => handleSelectTask(nextTask.id)}
                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#7aa2f7]/40 bg-[#7aa2f7]/15 px-5 text-xs font-bold text-[#7aa2f7] shadow-sm transition-all hover:bg-[#7aa2f7]/25 active:scale-95"
                              >
                                <span>Continue to Task 2: Quiz</span>
                                <ArrowRight className="size-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          nextTask && (
                            <button
                              type="button"
                              onClick={handleCompleteTask1AndProceed}
                              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-[#7aa2f7] px-5 text-xs font-bold text-[#16161e] shadow-sm transition-all hover:bg-[#7aa2f7]/90 active:scale-95"
                            >
                              <span>Mark as Completed &amp; Take Quiz</span>
                              <ArrowRight className="size-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== TRẠNG THÁI 2: INTERACTIVE QUIZ ==================== */}
                {activeMode === "quiz" && (
                  <div className="space-y-6">
                    {/* Question Prompt Card */}
                    <div className="rounded-xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-[#bb9af7]/30 bg-[#bb9af7]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#bb9af7] uppercase tracking-wider">
                            Question {quizQuestionIndex + 1} of {quizQuestions.length}
                          </span>
                          <span className="font-mono text-[10.5px] text-text-muted">
                            Select one option below
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          {isCurrentQCorrect ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400">
                              <Check className="size-3 stroke-[3]" /> Correct
                            </span>
                          ) : isCurrentQChecked ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 font-bold text-rose-400">
                              Incorrect
                            </span>
                          ) : (
                            <span className="text-text-muted">Unanswered</span>
                          )}
                        </div>
                      </div>
                      <h3 className="mt-3 text-sm sm:text-base font-bold text-text-primary leading-snug">
                        {currentQ.prompt}
                      </h3>
                    </div>

                    {/* 4 Interactive Options */}
                    <div className="space-y-3">
                      {currentQ.options.map((option: any) => {
                        const isSelected = currentQSelectedOption === option.id
                        const isRightOption = Boolean(option.isCorrect)

                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={isEvaluatingQuiz}
                            onClick={() => handleSelectQuizOption(option.id)}
                            className={cn(
                              "relative flex w-full cursor-pointer items-center rounded-xl border p-4 text-left transition-all shadow-sm",
                              // If checked:
                              isCurrentQChecked && isSelected && isRightOption && "border-emerald-500 bg-emerald-500/15",
                              isCurrentQChecked && isSelected && !isRightOption && "border-rose-500 bg-rose-500/15",
                              isCurrentQChecked && !isSelected && isRightOption && "border-emerald-500/50 bg-emerald-500/5",
                              // If not checked:
                              !isCurrentQChecked && isSelected && "border-[#7aa2f7] bg-[#7aa2f7]/15 ring-1 ring-[#7aa2f7]",
                              !isCurrentQChecked && !isSelected && "border-border-subtle bg-surface hover:border-[#7aa2f7]/50 hover:bg-[#24283b]/30"
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                                isCurrentQChecked && isSelected && isRightOption && "bg-emerald-500 text-[#16161e]",
                                isCurrentQChecked && isSelected && !isRightOption && "bg-rose-500 text-white",
                                isCurrentQChecked && !isSelected && isRightOption && "bg-emerald-500/30 text-emerald-300",
                                !isCurrentQChecked && isSelected && "bg-[#7aa2f7] text-[#16161e]",
                                !isCurrentQChecked && !isSelected && "bg-[#24283b] text-[#c0caf5]"
                              )}
                            >
                              {option.id}
                            </span>

                            <span
                              className={cn(
                                "flex-1 px-4 text-xs font-medium sm:text-sm",
                                isSelected ? "text-white font-semibold" : "text-text-secondary"
                              )}
                            >
                              {option.text}
                            </span>

                            {isCurrentQChecked && isSelected && isRightOption && (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-[#16161e] shadow-sm">
                                <Check className="size-3 stroke-[3]" />
                                <span>Correct</span>
                              </span>
                            )}

                            {isCurrentQChecked && isSelected && !isRightOption && (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                                <X className="size-3 stroke-[3]" />
                                <span>Incorrect</span>
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Explanation Box (Revealed after Check Answer) */}
                    {isCurrentQChecked && (
                      <div
                        className={cn(
                          "rounded-xl border p-4.5 space-y-2 transition-all animate-in fade-in zoom-in-95",
                          isCurrentQCorrect
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                        )}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          {isCurrentQCorrect ? (
                            <>
                              <CheckCircle2 className="size-4 text-emerald-400" />
                              <span className="text-emerald-400 uppercase tracking-wider">Correct! Invariant Verified</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="size-4 text-rose-400" />
                              <span className="text-rose-400 uppercase tracking-wider">Concept Guidance</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-[#c0caf5]">
                          {isCurrentQCorrect ? currentQ.explanation : currentQ.clue}
                        </p>
                      </div>
                    )}

                    {/* Grounded Action Bar at Bottom of Quiz */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setActiveTool((prev) => (prev === "tutor" ? null : "tutor"))}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#292e42] bg-[#24283b] px-4 text-xs font-semibold text-[#c0caf5] transition-colors hover:border-[#7aa2f7]/50 hover:text-white"
                      >
                        <Sparkles className="size-3.5 text-[#7aa2f7]" />
                        <span>Ask Socratic Hint</span>
                      </button>

                      <div className="flex items-center gap-2.5">
                        {isQuizFullyCompleted ? (
                          <button
                            type="button"
                            onClick={handleCompleteQuizAndOpenCode}
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-emerald-500 px-5 text-xs font-bold text-[#16161e] shadow-sm transition-all hover:bg-emerald-400"
                          >
                            <span>Quiz Completed (3/3) • Proceed to Coding</span>
                            <ArrowRight className="size-3.5" />
                          </button>
                        ) : isCurrentQChecked && isCurrentQCorrect ? (
                          (() => {
                            const nextUnfinishedIdx = quizQuestions.findIndex(
                              (_: any, idx: number) => !quizQuestionsMap[`Q${idx + 1}`]?.isCorrect
                            )
                            if (nextUnfinishedIdx !== -1) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setQuizQuestionIndex(nextUnfinishedIdx)}
                                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-[#7aa2f7] px-5 text-xs font-bold text-[#16161e] shadow-sm transition-all hover:bg-[#7aa2f7]/90"
                                >
                                  <span>Go to Unanswered Question (Q{nextUnfinishedIdx + 1})</span>
                                  <ArrowRight className="size-3.5" />
                                </button>
                              )
                            }
                            return null
                          })()
                        ) : (
                          <button
                            type="button"
                            disabled={!currentQSelectedOption || isEvaluatingQuiz}
                            onClick={handleCheckQuizAnswer}
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-[#7aa2f7] px-5 text-xs font-bold text-[#16161e] shadow-sm transition-all hover:bg-[#7aa2f7]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>{isEvaluatingQuiz ? "Checking..." : isCurrentQChecked ? "Re-check Answer" : "Check Answer"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : (
          /* ==================== TRẠNG THÁI 3: CODE WORKSPACE (EXPANDED TO OCCUPY CENTER) ==================== */
          <section className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden">
            {/* 1. KHUNG TRÊN: MONACO CODE EDITOR */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-secondary">
              {/* Thanh Tab & Nút điều khiển Editor */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3 py-1.5">
                <div className="flex items-center gap-2">
                  {/* Nút mở Problem Description Panel khi bị thu gọn */}
                  {isProblemCollapsed && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProblemCollapsed(false)
                        setMobileTab("problem")
                      }}
                      className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-[#292e42] bg-[#16161e] px-2.5 text-[11px] font-semibold text-[#c0caf5] transition-colors hover:border-[#7aa2f7] hover:text-[#7aa2f7]"
                      title="Expand Problem Description"
                    >
                      <PanelLeftOpen className="size-3.5 text-[#7aa2f7]" />
                      <span>Expand Problem</span>
                    </button>
                  )}

                  {/* Segmented Switch on smaller screens (< lg) */}
                  <div className="inline-flex lg:hidden rounded-md border border-border-subtle bg-surface-secondary p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMobileTab("problem")}
                      className={cn(
                        "rounded px-2 py-0.5 font-medium transition-colors",
                        mobileTab === "problem"
                          ? "bg-[#7aa2f7]/15 text-[#7aa2f7] font-bold"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Problem
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileTab("code")}
                      className={cn(
                        "rounded px-2 py-0.5 font-medium transition-colors",
                        mobileTab === "code"
                          ? "bg-primary/15 text-primary font-bold"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Code
                    </button>
                  </div>

                  <div className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[#292e42] bg-[#16161e] px-2.5 py-1 text-xs font-medium text-text-primary">
                    <span className="font-mono text-[11px] font-bold text-[#7aa2f7]">
                      {taskDetail?.language || "C++"}
                    </span>
                    <span className="font-mono text-[11px] text-[#c0caf5]">
                      {taskDetail?.fileName || "solution.cpp"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Nút mở cửa sổ nổi Visualization trên thanh công cụ Code Editor */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTool((prev) =>
                        prev === "visualization" ? null : "visualization"
                      )
                    }
                    className={cn(
                      "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold transition-colors",
                      activeTool === "visualization"
                        ? "border-[#7aa2f7]/60 bg-[#7aa2f7]/15 text-[#7aa2f7]"
                        : "border-border-subtle bg-surface-secondary text-text-primary hover:border-[#7aa2f7]/60 hover:text-[#7aa2f7]"
                    )}
                  >
                    <Box className="size-3.5 text-[#7aa2f7]" />
                    <span>Visualization</span>
                  </button>

                  <div className="hidden sm:inline-flex h-7 items-center rounded-md border border-border-subtle bg-surface-secondary px-2.5 font-mono text-[11px] text-text-muted">
                    <span>C++17</span>
                  </div>

                  <button
                    type="button"
                    disabled={executionStatus === "running"}
                    onClick={handleRunCode}
                    className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[11px] font-semibold text-text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play className="size-3 text-primary" />
                    <span>
                      {executionStatus === "running" && activeAction === "run"
                        ? "Running..."
                        : "Run Code"}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={executionStatus === "running"}
                    onClick={handleSubmitCode}
                    className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3.5 text-[11px] font-bold text-surface-secondary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="size-3" />
                    <span>
                      {executionStatus === "running" && activeAction === "submit"
                        ? "Submitting..."
                        : "Submit"}
                    </span>
                  </button>
                </div>
              </div>

              {/* VÙNG LÀM VIỆC CHÍNH 2 CỘT: PROBLEM DESCRIPTION (TRÁI) & MONACO EDITOR (PHẢI) */}
              <div className="relative flex min-h-[340px] flex-1 overflow-hidden">
                {/* CỘT TRÁI: Problem Description Panel */}
                <div
                  className={cn(
                    "w-full border-b lg:border-b-0 lg:border-r border-border-subtle shrink-0 transition-all",
                    "lg:w-[380px] xl:w-[440px]",
                    isProblemCollapsed ? "hidden" : "flex flex-col",
                    mobileTab !== "problem" && "hidden lg:flex"
                  )}
                >
                  <ProblemDescriptionPanel
                    problem={resolvedProblem}
                    taskTitle={activeTask.title}
                    isCollapsed={isProblemCollapsed}
                    onToggleCollapse={() => setIsProblemCollapsed(true)}
                  />
                </div>

                {/* CỘT PHẢI: Monaco Code Editor */}
                <div
                  className={cn(
                    "flex flex-1 min-w-0 flex-col bg-surface-secondary",
                    mobileTab !== "code" && "hidden lg:flex"
                  )}
                >
                  {/* Thanh chỉ báo mờ trỏ tới dòng code lỗi khi Run Code bị fail */}
                  {codeRunOutcome === "warning" && (
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-danger/30 bg-danger/10 px-3.5 py-1.5 text-[11px]">
                      <div className="flex min-w-0 items-center gap-2 text-warning">
                        <span className="inline-flex items-center gap-1 rounded bg-danger/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-primary tabular-nums">
                          ↳ Line {socraticProfile.faultyLine.line}
                        </span>
                        <span className="truncate font-mono text-[10.5px] text-text-primary">
                          {socraticProfile.faultyLine.codeToken}
                        </span>
                        <span className="hidden truncate text-warning/90 sm:inline">
                          — {socraticProfile.faultyLine.shortReason}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleFocusFaultyLine(socraticProfile.faultyLine.line)
                        }
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-danger/40 bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan transition-colors hover:border-cyan hover:text-text-primary"
                      >
                        <Target className="size-3 text-danger" />
                        <span>
                          Point to Line {socraticProfile.faultyLine.line}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Vùng soạn thảo Monaco Editor */}
                  <div className="relative min-h-[300px] flex-1 bg-surface-secondary">
                    <Editor
                      height="100%"
                      defaultLanguage="cpp"
                      theme={monacoTheme}
                      value={code}
                      onChange={handleCodeChange}
                      beforeMount={handleEditorBeforeMount}
                      onMount={handleEditorDidMount}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12.5,
                        lineHeight: 19,
                        fontFamily:
                          "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        scrollBeyondLastLine: false,
                        renderLineHighlight: "all",
                        padding: { top: 10, bottom: 10 },
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                        overviewRulerBorder: false,
                        automaticLayout: true,
                        scrollbar: {
                          verticalScrollbarSize: 8,
                          horizontalScrollbarSize: 8,
                        },
                      }}
                    />
                  </div>

                  {/* Thanh trạng thái dưới đáy Editor (VSCode Status Bar) */}
                  <div className="flex shrink-0 items-center justify-end gap-4 border-t border-border-subtle bg-surface px-4 py-1 font-mono text-[10px] text-text-muted">
                    <span>
                      Ln {cursorPos.line}, Col {cursorPos.col}
                    </span>
                    <span>{taskDetail?.language || "C++"}</span>
                    <span>UTF-8</span>
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <span className="size-1.5 rounded-full bg-success" />
                      {isCodeSavedBadge ? "Draft Saved" : "Ready"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. KHUNG DƯỚI: CODE ANALYSIS & TEST RESULTS (STATE-DRIVEN DYNAMIC UI) */}
            <CodeAnalysisPanel
              status={executionStatus}
              activeAction={activeAction}
              executionResult={executionResult}
              sampleTestCases={resolvedProblem?.examples}
              isOutdated={isOutdated}
              onRunCode={handleRunCode}
              onFocusFaultyLine={handleFocusFaultyLine}
            />
          </section>
        )}
        </div>

        {/* -------------------- CỘT 3 (PHẢI): DOCKED SOCRATIC AI TUTOR PANEL -------------------- */}
        {activeTool === "tutor" && (
          <aside
            aria-label="Socratic AI Tutor Docked Panel"
            className="w-[340px] xl:w-[360px] h-full shrink-0 flex flex-col border border-[#292e42] bg-[#16161e] rounded-lg overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-right-4"
          >
            <SocraticTutorPanel
              nodeId={node.id}
              nodeLabel={node.label}
              nodeComplexity={node.complexity || "O(N)"}
              taskId={activeTask.id}
              activeMode={activeMode}
              taskDetail={taskDetail}
              selectedOption={currentQSelectedOption}
              selectedQuizOptionObj={selectedQuizOptionObj}
              codeRunOutcome={codeRunOutcome}
              hintsRemaining={hintsRemaining}
              onUpdateHintsRemaining={handleUpdateHintsRemaining}
              onFocusFaultyLine={handleFocusFaultyLine}
              onClose={() => setActiveTool(null)}
            />
          </aside>
        )}
      </main>

      {/* ==================== CỬA SỔ NỔI 1: VISUALIZATION FLOATING WINDOW (CHỈ Ở TASK CODING) ==================== */}
      {activeMode === "coding" && activeTool === "visualization" && (
        <div
          className={cn(
            "fixed top-[108px] right-6 z-50 flex flex-col rounded-xl border border-border-subtle bg-surface p-4 shadow-xl transition-all duration-150 animate-in fade-in zoom-in-95",
            isVisExpanded
              ? "w-[min(540px,calc(100vw-2rem))]"
              : "w-[min(450px,calc(100vw-2rem))]"
          )}
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-cyan/35 bg-cyan/10 text-cyan">
                <Box className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-text-primary">
                    Visualization
                  </h2>
                  <span className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 text-[10px] font-semibold text-cyan">
                    {taskDetail?.visualization?.badge || node.label}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted">
                  Interactive Before → After State Transition
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Nút thu gọn / mở rộng nội dung cửa sổ Visualization */}
              <button
                type="button"
                onClick={() => setIsVisMinimized((prev) => !prev)}
                title={isVisMinimized ? "Expand diagram" : "Collapse diagram"}
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:border-border hover:text-text-primary"
              >
                {isVisMinimized ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronUp className="size-3.5" />
                )}
              </button>

              {/* Nút phóng rộng kích thước cửa sổ Visualization */}
              {!isVisMinimized && (
                <button
                  type="button"
                  onClick={() => setIsVisExpanded((prev) => !prev)}
                  title={isVisExpanded ? "Standard window size" : "Expand window size"}
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:border-border hover:text-text-primary"
                >
                  {isVisExpanded ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                </button>
              )}

              {/* Nút đóng cửa sổ Visualization */}
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                aria-label="Close Visualization window"
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:border-danger/60 hover:text-text-primary"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {!isVisMinimized && (
            <div className="mt-3">
              <div className="rounded-xl border border-border-subtle bg-surface-secondary p-3">
                <svg
                  viewBox="0 0 310 155"
                  className={cn(
                    "w-full select-none transition-all duration-200",
                    isVisExpanded ? "h-[260px]" : "h-[215px]"
                  )}
                  aria-label="Algorithm Visualization"
                >
                  <text
                    x="72"
                    y="15"
                    textAnchor="middle"
                    fill="#A9B1D6"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {taskDetail?.visualization?.beforeTitle ||
                      "Before (Right Rotation)"}
                  </text>
                  <text
                    x="238"
                    y="15"
                    textAnchor="middle"
                    fill="#A9B1D6"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {taskDetail?.visualization?.afterTitle || "After"}
                  </text>

                  {[
                    {
                      x1: 88,
                      y1: 42,
                      r1: 14,
                      x2: 52,
                      y2: 85,
                      r2: 14,
                      color: "#7DCFFF",
                    },
                    {
                      x1: 88,
                      y1: 42,
                      r1: 14,
                      x2: 118,
                      y2: 85,
                      r2: 13,
                      color: "#545C7E",
                    },
                    {
                      x1: 52,
                      y1: 85,
                      r1: 14,
                      x2: 26,
                      y2: 130,
                      r2: 13,
                      color: "#7DCFFF",
                    },
                    {
                      x1: 52,
                      y1: 85,
                      r1: 14,
                      x2: 76,
                      y2: 130,
                      r2: 13,
                      color: "#7DCFFF",
                    },
                    {
                      x1: 222,
                      y1: 42,
                      r1: 14,
                      x2: 192,
                      y2: 85,
                      r2: 13,
                      color: "#545C7E",
                    },
                    {
                      x1: 222,
                      y1: 42,
                      r1: 14,
                      x2: 258,
                      y2: 85,
                      r2: 14,
                      color: "#7AA2F7",
                    },
                    {
                      x1: 258,
                      y1: 85,
                      r1: 14,
                      x2: 234,
                      y2: 130,
                      r2: 13,
                      color: "#7AA2F7",
                    },
                    {
                      x1: 258,
                      y1: 85,
                      r1: 14,
                      x2: 284,
                      y2: 130,
                      r2: 13,
                      color: "#7AA2F7",
                    },
                  ].map((e, idx) => {
                    const pts = getCircleEdge(
                      e.x1,
                      e.y1,
                      e.r1,
                      e.x2,
                      e.y2,
                      e.r2
                    )
                    return (
                      <line
                        key={idx}
                        x1={pts.x1}
                        y1={pts.y1}
                        x2={pts.x2}
                        y2={pts.y2}
                        stroke={e.color}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    )
                  })}

                  <g
                    transform="translate(146, 75)"
                    stroke="var(--color-primary)"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="0" y1="0" x2="16" y2="0" />
                    <polyline points="11,-4 16,0 11,4" />
                  </g>

                  {[
                    {
                      id: "b-y",
                      label: "y",
                      x: 88,
                      y: 42,
                      r: 14,
                      fill: "#3B336A",
                      stroke: "#C7A9FF",
                      text: "var(--color-text-primary)",
                    },
                    {
                      id: "b-x",
                      label: "x",
                      x: 52,
                      y: 85,
                      r: 14,
                      fill: "#1E4E68",
                      stroke: "#7DCFFF",
                      text: "var(--color-text-primary)",
                    },
                    {
                      id: "b-t3",
                      label: "T3",
                      x: 118,
                      y: 85,
                      r: 13,
                      fill: "var(--color-surface)",
                      stroke: "var(--color-border)",
                      text: "var(--color-text-secondary)",
                    },
                    {
                      id: "b-t1",
                      label: "T1",
                      x: 26,
                      y: 130,
                      r: 13,
                      fill: "var(--color-surface)",
                      stroke: "var(--color-border)",
                      text: "var(--color-text-secondary)",
                    },
                    {
                      id: "b-t2",
                      label: "T2",
                      x: 76,
                      y: 130,
                      r: 13,
                      fill: "var(--color-surface)",
                      stroke: "var(--color-border)",
                      text: "var(--color-text-secondary)",
                    },
                    {
                      id: "a-x",
                      label: "x",
                      x: 222,
                      y: 42,
                      r: 14,
                      fill: "#1E4E68",
                      stroke: "#7DCFFF",
                      text: "var(--color-text-primary)",
                    },
                    {
                      id: "a-t1",
                      label: "T1",
                      x: 192,
                      y: 85,
                      r: 13,
                      fill: "var(--color-surface)",
                      stroke: "var(--color-border)",
                      text: "var(--color-text-secondary)",
                    },
                    {
                      id: "a-y",
                      label: "y",
                      x: 258,
                      y: 85,
                      r: 14,
                      fill: "#3B336A",
                      stroke: "#C7A9FF",
                      text: "var(--color-text-primary)",
                    },
                    {
                      id: "a-t2",
                      label: "T2",
                      x: 234,
                      y: 130,
                      r: 13,
                      fill: "var(--color-surface)",
                      stroke: "var(--color-border)",
                      text: "var(--color-text-secondary)",
                    },
                    {
                      id: "a-t3",
                      label: "T3",
                      x: 284,
                      y: 130,
                      r: 13,
                      fill: "var(--color-surface)",
                      stroke: "var(--color-border)",
                      text: "var(--color-text-secondary)",
                    },
                  ].map((visNode) => (
                    <g
                      key={visNode.id}
                      transform={`translate(${visNode.x}, ${visNode.y})`}
                    >
                      <circle
                        r={visNode.r}
                        fill={visNode.fill}
                        stroke={visNode.stroke}
                        strokeWidth="1.75"
                      />
                      <text
                        y="3.5"
                        textAnchor="middle"
                        fill={visNode.text}
                        fontSize="10"
                        fontWeight="700"
                      >
                        {visNode.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="mt-2.5 flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-[10.5px] text-text-secondary">
                <span>
                  Complexity Bound:{" "}
                  <strong className="font-mono text-success">
                    {taskDetail?.analysis?.timeComplexity || node.complexity}
                  </strong>
                </span>
                <span className="font-mono text-[10px] text-cyan">
                  Pointer Invariant View
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WorkspacePage() {
  return <WorkspaceView />
}
