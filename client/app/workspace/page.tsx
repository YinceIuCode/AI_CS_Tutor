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
  Maximize2,
  Minimize2,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Search,
  Send,
  Settings,
  Sparkles,
  Square,
  Target,
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
import { PwaInstallButton } from "@/components/pwa-install-button"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { getSocraticTutorProfile } from "@/mocks/socraticTutorData"
import { resolveWorkspaceSession } from "@/services/roadmapService"

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

  // 2. OffByOne Tokyo Night Day Light Theme
  monaco.editor.defineTheme("offbyone-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "9854F1" },
      { token: "keyword.directive", foreground: "9854F1" },
      { token: "type", foreground: "2E7DE9" },
      { token: "type.identifier", foreground: "007197" },
      { token: "identifier", foreground: "3760BF" },
      { token: "number", foreground: "B15C00" },
      { token: "string", foreground: "587539" },
      { token: "comment", foreground: "848CB5", fontStyle: "italic" },
      { token: "delimiter", foreground: "007197" },
      { token: "operator", foreground: "007197" },
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
  const { isAuthenticated, isInitializing } = useAuth()
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

  // Protected Route: Yêu cầu phiên người dùng hoặc Guest
  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/auth")
    }
  }, [isInitializing, isAuthenticated, router])

  const { node, activeTask, taskDetail } = React.useMemo(
    () => resolveWorkspaceSession(resolvedNodeId, resolvedTaskId, userProgress),
    [resolvedNodeId, resolvedTaskId, userProgress]
  )

  const activeMode: WorkspaceMode = (activeTask?.type ||
    taskDetail?.type ||
    "theory") as WorkspaceMode

  // Ở Task Quiz, khôi phục đáp án đã chọn từ tiến độ của User (nếu có)
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  )

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
                content: `  ⟵ ⚠️ ${socraticProfile.faultyLine.shortReason}`,
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
    const savedQuiz = userProgress.quizAnswers?.[activeTask.id]
    setSelectedOption(savedQuiz?.selectedOption ?? null)

    const savedCodeObj = userProgress.codeDrafts?.[activeTask.id]
    const savedCode = savedCodeObj?.code
    if (typeof savedCode === "string") {
      setCode(savedCode)
    } else if (taskDetail?.initialCode) {
      setCode(taskDetail.initialCode)
    }

    if (savedCodeObj?.isSubmitted) {
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
    node.id,
    activeTask.id,
    activeMode,
    taskDetail?.initialCode,
    isProgressLoaded,
    userProgress.userId,
  ])

  const handleSelectQuizOption = React.useCallback(
    (optionId: string, isCorrect: boolean) => {
      setSelectedOption(optionId)
      saveQuizAnswer(activeTask.id, {
        selectedOption: optionId,
        isSubmitted: isCorrect,
      })
      if (isCorrect) {
        completeTask(activeTask.id)
        setHasNewHintAlert(false)
      } else {
        setHasNewHintAlert(activeTool !== "tutor")
      }
    },
    [activeTask.id, saveQuizAnswer, completeTask, activeTool]
  )

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

      if (result.status === "success") {
        completeTask(activeTask.id)
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
    if (!selectedOption || !Array.isArray(taskDetail?.options)) return null
    return (
      taskDetail.options.find(
        (opt: { id: string; text: string; isCorrect: boolean }) =>
          opt.id === selectedOption
      ) || null
    )
  }, [selectedOption, taskDetail])

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface-secondary font-mono text-xs text-cyan">
        Verifying session...
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden bg-surface-secondary px-4 py-3 font-sans text-text-secondary selection:bg-primary/30 selection:text-text-primary md:px-6 lg:h-svh lg:max-h-svh lg:overflow-hidden">
      {/* ==================== THANH HEADER TRÊN CÙNG (TOP NAVBAR) ==================== */}
      <header className="relative z-40 mx-auto w-full max-w-[1480px] shrink-0">
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface/95 px-5 py-2.5 shadow-lg backdrop-blur-md">
          {/* Logo OffByOne */}
          <Link
            href={WORKSPACE_LINKS.brand}
            className="group flex shrink-0 items-center transition-opacity hover:opacity-95"
          >
            <BrandLogo size="sm" priority />
          </Link>

          {/* Thanh Search ở giữa */}
          <div className="hidden max-w-[460px] flex-1 items-center justify-between rounded-full border border-border-subtle bg-surface-secondary/90 px-4 py-1.5 text-xs text-text-muted transition-colors focus-within:border-border md:flex">
            <div className="flex flex-1 items-center gap-2.5">
              <Search className="size-3.5 shrink-0 text-text-muted" />
              <input
                type="text"
                placeholder="Search concepts, algorithms, or problems..."
                className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <kbd className="rounded border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] font-medium text-text-secondary">
              Ctrl + K
            </kbd>
          </div>

          {/* User Profile & PWA Download Button */}
          <div className="flex items-center gap-3">
            <PwaInstallButton />
            <ThemeToggleButton />
            <UserProfileMenu />
          </div>
        </nav>
      </header>

      {/* ==================== KHÔNG GIAN LÀM VIỆC 3 CỘT (MAIN WORKSPACE) ==================== */}
      <main className="relative z-10 mx-auto mt-3 grid min-h-0 w-full max-w-[1480px] flex-1 grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* -------------------- CỘT 1 (TRÁI - 2/12): THANH ĐIỀU HƯỚNG TASK THEO NODE + THẺ SOCRATIC AI TUTOR -------------------- */}
        <aside className="flex min-h-0 flex-col justify-between rounded-2xl border border-border-subtle bg-surface-secondary p-3.5 lg:col-span-2">
          {/* Phần đầu cố định: Nút Back + Tiêu đề Node */}
          <div className="shrink-0">
            <Link
              href={WORKSPACE_LINKS.backToSkillTree}
              className="flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface text-xs font-medium text-text-secondary transition-colors hover:border-border hover:text-text-primary"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Skill Tree</span>
            </Link>

            <div className="mt-3.5 border-b border-border-subtle pb-2.5">
              <h1 className="text-sm font-bold text-text-primary">
                {node.label} Mastery
              </h1>
              <p className="mt-0.5 text-[11px] leading-snug text-text-muted">
                Complete all tasks to unlock the next node.
              </p>
            </div>
          </div>

          {/* Danh sách các Task (Cuộn độc lập nếu danh sách dài) */}
          <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
            {node.tasks.map((taskItem, idx) => {
              const isSelected = taskItem.id === activeTask.id
              const isCompleted = taskItem.status === "completed"

              return (
                <button
                  key={taskItem.id}
                  type="button"
                  onClick={() => handleSelectTask(taskItem.id)}
                  className={cn(
                    "w-full cursor-pointer rounded-xl border p-2.5 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/20/40 shadow-[0_0_20px_rgba(122,162,247,0.18)]"
                      : isCompleted
                        ? "border-success/55 bg-surface/60 hover:border-success"
                        : "border-border-subtle bg-surface/45 hover:border-border"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {isSelected ? (
                      taskItem.type === "coding" ? (
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-surface-secondary">
                          <Code2 className="size-3 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-cyan bg-cyan/15 text-cyan">
                          <Square className="size-2.5 fill-current" />
                        </span>
                      )
                    ) : isCompleted ? (
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-surface-secondary">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary">
                        <Lock className="size-3" />
                      </span>
                    )}

                    <div className="min-w-0">
                      <div
                        className={cn(
                          "text-[10px]",
                          isSelected ? "text-cyan" : "text-text-muted"
                        )}
                      >
                        Task {idx + 1}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 text-xs font-bold",
                          isSelected || isCompleted
                            ? "text-text-primary"
                            : "text-text-secondary"
                        )}
                      >
                        {taskItem.title}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-center">
                    {isSelected ? (
                      <span className="rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-surface-secondary">
                        In Progress
                      </span>
                    ) : isCompleted ? (
                      <span className="rounded-full border border-success/50 bg-success/15 px-3 py-0.5 text-[10px] font-semibold text-success">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface px-3 py-0.5 text-[10px] font-medium text-text-muted">
                        Locked
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Phần cuối cố định: Thẻ Socratic AI Tutor riêng biệt nằm dưới danh sách Task */}
          <div className="mt-3 shrink-0 space-y-2 border-t border-border-subtle pt-3">
            <div
              className={cn(
                "relative rounded-xl border p-3 transition-all",
                activeTool === "tutor"
                  ? "border-cyan bg-primary/20/45 shadow-[0_0_20px_rgba(125,207,255,0.16)]"
                  : hasNewHintAlert
                    ? "border-warning/80 bg-surface/90 shadow-[0_0_18px_rgba(255,158,100,0.16)]"
                    : "border-border-subtle bg-surface/75 hover:border-border"
              )}
            >
              {/* Hàng trên: Bot Icon + Tiêu đề + Trạng thái Ready to help */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-cyan/35 bg-cyan/12 text-cyan">
                    <Bot className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-text-primary">
                      Socratic AI Tutor
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-success">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full bg-success",
                          hasNewHintAlert && "animate-ping bg-warning"
                        )}
                      />
                      <span className={cn(hasNewHintAlert && "text-warning")}>
                        {hasNewHintAlert ? "New hint ready" : "Ready to help"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge số lượng Hint khả dụng */}
                <span className="shrink-0 rounded-full border border-primary/35 bg-surface-secondary px-2 py-0.5 font-mono text-[9.5px] font-semibold text-cyan">
                  {hintsRemaining}/3
                </span>
              </div>

              {/* Mô tả ngắn */}
              <p className="mt-2 text-[11px] leading-snug text-text-secondary">
                Need guidance with this task?
              </p>

              {/* Nút Get a Hint mở Floating Side Drawer */}
              <button
                type="button"
                onClick={() => {
                  setHasNewHintAlert(false)
                  setActiveTool((prev) => (prev === "tutor" ? null : "tutor"))
                }}
                className={cn(
                  "mt-2.5 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[11px] font-bold transition-all",
                  activeTool === "tutor"
                    ? "border-cyan bg-cyan text-surface-secondary"
                    : "border-primary/45 bg-primary/20/55 text-text-primary hover:border-primary hover:bg-primary/20/85"
                )}
              >
                <Sparkles className="size-3 text-cyan" />
                <span>
                  {activeTool === "tutor" ? "Hide Hint Drawer" : "Get a Hint"}
                </span>
              </button>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-secondary p-1.5 text-center text-[10px] text-text-muted">
              Click Task 1, 2, or 3 to switch stages.
            </div>
          </div>
        </aside>

        {/* ==================== TRẠNG THÁI 1 & 2: THEORY HOẶC QUIZ (MỞ RỘNG TOÀN BỘ 10/12 CỘT CÒN LẠI) ==================== */}
        {activeMode !== "coding" ? (
          <section className="flex flex-col rounded-2xl border border-border-subtle bg-surface-secondary p-6 lg:col-span-10">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="size-4 text-text-primary" />
                <h2 className="text-xs font-bold tracking-wider text-text-primary uppercase">
                  {taskDetail?.headerTitle}
                </h2>
              </div>

              {activeMode === "theory" && nextTask ? (
                <button
                  type="button"
                  onClick={() => handleCompleteAndAdvance(nextTask.id)}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-surface-secondary transition-colors hover:bg-primary-hover"
                >
                  <span>Next: Take Quiz</span>
                  <ArrowRight className="size-3.5" />
                </button>
              ) : activeMode === "quiz" && nextTask ? (
                <button
                  type="button"
                  onClick={() => handleCompleteAndAdvance(nextTask.id)}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-surface-secondary transition-colors hover:bg-primary-hover"
                >
                  <Send className="size-3.5" />
                  <span>Submit</span>
                </button>
              ) : null}
            </div>

            {/* Nội dung Trạng thái 1: THEORY */}
            {activeMode === "theory" && (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-text-primary">
                  <span className="font-semibold text-cyan">
                    {taskDetail?.moduleLabel || "Module 1 of 3:"}
                  </span>{" "}
                  {taskDetail?.summaryLead}
                </p>

                <div className="mt-6 space-y-3.5">
                  {(taskDetail?.cards || []).map(
                    (card: {
                      badge: string
                      title: string
                      detail: string
                      tag: string
                    }) => (
                      <div
                        key={card.badge}
                        className="flex items-start gap-4 rounded-xl border border-border-subtle bg-surface-secondary/85 p-4 transition-colors hover:border-border"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/20 font-mono text-xs font-bold text-primary">
                          {card.badge}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-bold text-text-primary">
                              {card.title}
                            </h3>
                            <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan">
                              {card.tag}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                            {card.detail}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Nội dung Trạng thái 2: QUIZ */}
            {activeMode === "quiz" && (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-text-primary">
                  <span className="font-semibold text-cyan">
                    {taskDetail?.questionLabel || "Question 2 of 3:"}
                  </span>{" "}
                  {taskDetail?.questionPrompt}
                </p>

                <div className="mt-7 space-y-3.5">
                  {(taskDetail?.options || []).map(
                    (option: {
                      id: string
                      text: string
                      isCorrect: boolean
                    }) => {
                      const isSelected = selectedOption === option.id
                      const isWrongSelection = isSelected && !option.isCorrect
                      const isRightSelection = isSelected && option.isCorrect

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            handleSelectQuizOption(option.id, option.isCorrect)
                          }
                          className={cn(
                            "relative flex w-full cursor-pointer items-center rounded-xl border px-4 py-4 text-left transition-all",
                            isWrongSelection &&
                              "border-danger bg-danger/6",
                            isRightSelection &&
                              "border-success bg-success/8",
                            !isSelected &&
                              "border-border-subtle bg-surface-secondary/70 hover:border-border"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                              isWrongSelection && "bg-danger text-surface-secondary",
                              isRightSelection && "bg-success text-surface-secondary",
                              !isSelected && "bg-primary/20 text-primary"
                            )}
                          >
                            {option.id}
                          </span>

                          <span
                            className={cn(
                              "flex-1 text-center text-xs font-medium sm:text-[13px]",
                              isSelected ? "text-text-primary" : "text-text-secondary"
                            )}
                          >
                            {option.text}
                          </span>

                          {isWrongSelection && (
                            <span className="absolute right-3 bottom-1.5 inline-flex items-center gap-1 rounded bg-danger px-2 py-0.5 text-[10px] font-bold text-surface-secondary">
                              <X className="size-2.5 stroke-[3]" />
                              <span>Incorrect Selection</span>
                            </span>
                          )}

                          {isRightSelection && (
                            <span className="absolute right-3 bottom-1.5 inline-flex items-center gap-1 rounded bg-success px-2 py-0.5 text-[10px] font-bold text-surface-secondary">
                              <Check className="size-2.5 stroke-[3]" />
                              <span>Correct Answer</span>
                            </span>
                          )}
                        </button>
                      )
                    }
                  )}
                </div>
              </div>
            )}
          </section>
        ) : (
          /* ==================== TRẠNG THÁI 3: CODE WORKSPACE (MỞ RỘNG TOÀN BỘ 10/12 CỘT CÒN LẠI) ==================== */
          <section className="flex min-h-0 flex-col justify-between gap-3 lg:col-span-10">
            {/* 1. KHUNG TRÊN: MONACO CODE EDITOR */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-secondary">
              {/* Thanh Tab & Nút điều khiển Editor */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3.5 py-2">
                <div className="flex items-center gap-2">
                  {/* Nút mở/thu gọn Problem Description Panel */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProblemCollapsed((prev) => !prev)
                      setMobileTab("problem")
                    }}
                    className={cn(
                      "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-all",
                      !isProblemCollapsed
                        ? "border-cyan/50 bg-cyan/10 text-cyan shadow-[0_0_12px_rgba(125,207,255,0.18)]"
                        : "border-border-subtle bg-surface-secondary text-text-primary hover:border-cyan/60 hover:text-cyan"
                    )}
                    title={isProblemCollapsed ? "Expand Problem Description" : "Collapse Problem Description"}
                  >
                    {isProblemCollapsed ? (
                      <PanelLeftOpen className="size-3.5 text-cyan" />
                    ) : (
                      <PanelLeftClose className="size-3.5 text-cyan" />
                    )}
                    <span>Description</span>
                  </button>

                  {/* Segmented Switch on smaller screens (< lg) */}
                  <div className="inline-flex lg:hidden rounded-lg border border-border-subtle bg-surface-secondary p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMobileTab("problem")}
                      className={cn(
                        "rounded-md px-2 py-0.5 font-medium transition-colors",
                        mobileTab === "problem"
                          ? "bg-cyan/15 text-cyan font-bold"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Problem
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileTab("code")}
                      className={cn(
                        "rounded-md px-2 py-0.5 font-medium transition-colors",
                        mobileTab === "code"
                          ? "bg-primary/15 text-primary font-bold"
                          : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      Code
                    </button>
                  </div>

                  <div className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary px-3 py-1 text-xs font-medium text-text-primary">
                    <span className="font-mono text-[11px] font-bold text-cyan">
                      {taskDetail?.language || "C++"}
                    </span>
                    <span>{taskDetail?.fileName || "solution.cpp"}</span>
                    <X className="size-3 text-text-muted" />
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
                      "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-all",
                      activeTool === "visualization"
                        ? "border-cyan bg-cyan/15 text-cyan shadow-[0_0_14px_rgba(125,207,255,0.22)]"
                        : "border-border-subtle bg-surface-secondary text-text-primary hover:border-cyan/60 hover:text-cyan"
                    )}
                  >
                    <Box className="size-3.5 text-cyan" />
                    <span>Visualization</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-secondary px-2.5 font-mono text-[11px] text-text-primary"
                  >
                    <span>{taskDetail?.language || "C++"}</span>
                    <ChevronDown className="size-3 text-text-muted" />
                  </button>

                  <button
                    type="button"
                    disabled={executionStatus === "running"}
                    onClick={handleRunCode}
                    className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[11px] font-semibold text-text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play
                      className={`size-3 text-primary ${
                        executionStatus === "running" && activeAction === "run"
                          ? "animate-pulse"
                          : ""
                      }`}
                    />
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
                    className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[11px] font-bold text-surface-secondary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send
                      className={`size-3 ${
                        executionStatus === "running" && activeAction === "submit"
                          ? "animate-pulse"
                          : ""
                      }`}
                    />
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
                    problem={taskDetail?.problem}
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
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-danger/35 bg-gradient-to-r from-[#DB4B4B]/18 via-[#FF9E64]/10 to-transparent px-3.5 py-1.5 text-[11px]">
                      <div className="flex min-w-0 items-center gap-2 text-warning">
                        <span className="inline-flex items-center gap-1 rounded bg-danger/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-primary">
                          ↳ Line {socraticProfile.faultyLine.line}
                        </span>
                        <span className="truncate font-mono text-[10.5px] text-text-primary/90">
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
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-danger/50 bg-surface-secondary/85 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan transition-colors hover:border-cyan hover:text-text-primary"
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
              isOutdated={isOutdated}
              onRunCode={handleRunCode}
              onFocusFaultyLine={handleFocusFaultyLine}
            />
          </section>
        )}
      </main>

      {/* ==================== CỬA SỔ NỔI 1: VISUALIZATION FLOATING WINDOW (CHỈ Ở TASK CODING) ==================== */}
      {activeMode === "coding" && activeTool === "visualization" && (
        <div
          className={cn(
            "fixed top-[108px] right-6 z-50 flex flex-col rounded-2xl border border-border bg-surface-secondary/98 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-200 animate-in fade-in zoom-in-95",
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

      {/* ==================== CỬA SỔ NỔI 2: SOCRATIC AI TUTOR FLOATING SIDE DRAWER ==================== */}
      {activeTool === "tutor" && (
        <aside
          aria-label="Socratic AI Tutor Drawer"
          className="fixed top-[102px] right-5 bottom-4 z-50 flex w-[min(460px,calc(100vw-2.5rem))] flex-col transition-all duration-200 animate-in fade-in slide-in-from-right-5"
        >
          <SocraticTutorPanel
            nodeId={node.id}
            nodeLabel={node.label}
            nodeComplexity={node.complexity || "O(N)"}
            taskId={activeTask.id}
            activeMode={activeMode}
            taskDetail={taskDetail}
            selectedOption={selectedOption}
            selectedQuizOptionObj={selectedQuizOptionObj}
            codeRunOutcome={codeRunOutcome}
            hintsRemaining={hintsRemaining}
            onUpdateHintsRemaining={handleUpdateHintsRemaining}
            onFocusFaultyLine={handleFocusFaultyLine}
            onClose={() => setActiveTool(null)}
          />
        </aside>
      )}
    </div>
  )
}

export default function WorkspacePage() {
  return <WorkspaceView />
}
