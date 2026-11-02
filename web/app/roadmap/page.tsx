"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CloudUpload,
  Database,
  FileCode2,
  FileText,
  GitBranch,
  Lock,
  Map,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import RoadmapCanvas from "@/components/roadmap/RoadmapCanvas"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { BRAND } from "@/config/brand"
import { BrandLogo } from "@/components/brand-logo"
import { PwaInstallButton } from "@/components/pwa-install-button"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { useAuth } from "@/hooks/useAuth"
import { useRoadmap } from "@/hooks/useRoadmap"
import { useUserProgress } from "@/hooks/useUserProgress"
import {
  EMPTY_PLACEHOLDER_EDGES,
  EMPTY_PLACEHOLDER_SLOTS,
} from "@/mocks/roadmapData"
import {
  getRoadmapNodeById,
  mergeRoadmapWithUserProgress,
} from "@/services/roadmapService"

/**
 * Cấu hình đường dẫn điều hướng (href) trên trang Roadmap.
 */
export const ROADMAP_LINKS = {
  brand: "/",
  profile: "/auth",
  workspace: "/workspace",
  codeSandbox: "/sandbox",
  theoryQuiz: "/quiz",
} as const

type FlowState = "empty" | "loading" | "ready"

/**
 * Hàm tính toán tọa độ 2 đầu mút của đoạn thẳng nối tâm 2 đường tròn cho trạng thái Empty/Loading placeholder.
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

const NODE_RADIUS = 30

const LOADING_STEPS = [
  "Parsing PDF layout & course syllabus sections...",
  "Extracting learning topics & prerequisite dependencies...",
  "Indexing vector chunks into Active Knowledge Base (RAG)...",
  "Synthesizing prerequisite Skill Tree with AI Tutor...",
] as const

function formatPdfFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "2.4 MB"
  const mb = bytes / (1024 * 1024)
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`
  const kb = Math.max(1, Math.round(bytes / 1024))
  return `${kb} KB`
}

export default function RoadmapPage() {
  const router = useRouter()
  const { currentUser, isAuthenticated, isInitializing } = useAuth()
  const { userProgress, isProgressLoaded, saveRoadmapState } = useUserProgress()

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [flowState, setFlowState] = React.useState<FlowState>("empty")
  const [loadingStepIndex, setLoadingStepIndex] = React.useState(0)
  const [isSubtitleFading, setIsSubtitleFading] = React.useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = React.useState(false)
  const [isOverlayFadingOut, setIsOverlayFadingOut] = React.useState(false)
  const [isDraggingFile, setIsDraggingFile] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [simulatedFileMeta, setSimulatedFileMeta] = React.useState({
    fileName: "CS101_DSA_Syllabus_HCMUS.pdf",
    fileSize: "2.4 MB",
  })

  // ID của Node đang mở Pop-up Screen (null = đóng Pop-up)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null
  )

  // Protected Route: Yêu cầu phiên người dùng hoặc Guest
  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/auth")
    }
  }, [isInitializing, isAuthenticated, router])

  // Khôi phục trạng thái Roadmap & file PDF đã upload khi refresh hoặc đăng nhập lại
  React.useEffect(() => {
    if (!isProgressLoaded) return
    if (userProgress.roadmapFlowState === "ready") {
      setSimulatedFileMeta({
        fileName: userProgress.fileName || "CS101_DSA_Syllabus_HCMUS.pdf",
        fileSize: userProgress.fileSize || "2.4 MB",
      })
      setFlowState((prev) => (prev === "loading" ? prev : "ready"))
    } else if (userProgress.roadmapFlowState === "empty") {
      setFlowState((prev) => (prev === "loading" ? prev : "empty"))
    }
  }, [
    isProgressLoaded,
    userProgress.roadmapFlowState,
    userProgress.fileName,
    userProgress.fileSize,
  ])

  // TanStack Query quản lý việc lấy dữ liệu Roadmap khi hoàn tất bước Processing
  const {
    data: rawRoadmapData,
    isLoading: isQueryLoading,
    isError: isQueryError,
    isSuccess: isQuerySuccess,
    error: queryError,
    refetch,
  } = useRoadmap({
    enabled: flowState === "ready",
    fileName: simulatedFileMeta.fileName,
    fileSize: simulatedFileMeta.fileSize,
  })

  // Đồng bộ tiến độ các Task đã hoàn thành của User vào cây Skill Tree
  const roadmapData = React.useMemo(
    () => mergeRoadmapWithUserProgress(rawRoadmapData, userProgress),
    [rawRoadmapData, userProgress]
  )

  const isGeneratedReady =
    flowState === "ready" && isQuerySuccess && Boolean(roadmapData)
  const isProcessingOrFetching =
    flowState === "loading" || (flowState === "ready" && isQueryLoading)

  // Chạy lặp lại dòng Subtitle (kèm hiệu ứng mờ chuyển câu) cho tới khi LLM / Upload hoàn tất
  React.useEffect(() => {
    if (!isProcessingOrFetching) return
    setIsSubtitleFading(false)

    const stepInterval = window.setInterval(() => {
      setIsSubtitleFading(true)
      window.setTimeout(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length)
        setIsSubtitleFading(false)
      }, 220)
    }, 1150)

    return () => window.clearInterval(stepInterval)
  }, [isProcessingOrFetching])

  // Quản lý hiệu ứng mờ dần (Fade-out) của hộp Loading khi file đã xử lý xong
  React.useEffect(() => {
    if (isProcessingOrFetching) {
      setShowLoadingOverlay(true)
      setIsOverlayFadingOut(false)
      return
    }

    if (showLoadingOverlay) {
      setIsOverlayFadingOut(true)
      const fadeTimer = window.setTimeout(() => {
        setShowLoadingOverlay(false)
        setIsOverlayFadingOut(false)
      }, 450)
      return () => window.clearTimeout(fadeTimer)
    }
  }, [isProcessingOrFetching, showLoadingOverlay])

  // Truy xuất dữ liệu chi tiết của Node đang mở trong Pop-up theo ID
  const popupNode = React.useMemo(() => {
    if (!isGeneratedReady || !selectedNodeId || !roadmapData?.nodes) {
      return null
    }
    return getRoadmapNodeById(roadmapData.nodes, selectedNodeId)
  }, [isGeneratedReady, selectedNodeId, roadmapData])

  const triggerSimulation = React.useCallback(
    (fileName = "CS101_DSA_Syllabus_HCMUS.pdf", fileSize = "2.4 MB") => {
      setUploadError(null)
      setSimulatedFileMeta({ fileName, fileSize })
      setFlowState("loading")
      setLoadingStepIndex(0)
      setSelectedNodeId(null)

      // Thời gian chờ phản hồi từ pipeline phân tích PDF (sẵn sàng thay bằng await uploadSyllabusPdf(file))
      const timer = window.setTimeout(() => {
        setFlowState("ready")
        saveRoadmapState({
          roadmapFlowState: "ready",
          fileName,
          fileSize,
        })
      }, 2800)

      return () => window.clearTimeout(timer)
    },
    [saveRoadmapState]
  )

  const processSelectedPdfFile = React.useCallback(
    (file: File | null | undefined) => {
      if (!file) return
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      if (!isPdf) {
        setUploadError("Please select a valid PDF file (.pdf).")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size exceeds the 10MB limit.")
        return
      }
      const formattedSize = formatPdfFileSize(file.size)
      triggerSimulation(file.name, formattedSize)
    },
    [triggerSimulation]
  )

  const handleOpenFileDialog = () => {
    if (isProcessingOrFetching) return
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processSelectedPdfFile(file)
    }
    e.target.value = ""
  }

  const handleDropPdf = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingFile(false)
    if (isProcessingOrFetching) return
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processSelectedPdfFile(file)
    }
  }

  const handleReset = () => {
    setFlowState("empty")
    setUploadError(null)
    setSelectedNodeId(null)
    saveRoadmapState({
      roadmapFlowState: "empty",
    })
  }

  const completionPercent = isGeneratedReady
    ? (roadmapData?.completionPercent ?? 0)
    : 0
  const unlockedCount = isGeneratedReady ? (roadmapData?.unlockedCount ?? 0) : 0
  const totalCount = isGeneratedReady ? (roadmapData?.totalCount ?? 0) : 0
  const indexedDocs = isGeneratedReady
    ? (roadmapData?.knowledgeBase?.documents ?? [])
    : []

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface-secondary font-mono text-xs text-cyan">
        Verifying session...
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh flex-col justify-between overflow-x-hidden bg-surface-secondary px-4 py-3 font-sans text-text-secondary selection:bg-primary/30 selection:text-text-primary md:px-7 md:py-4 lg:h-svh lg:overflow-hidden">
      {/* Quầng sáng nền nhẹ chuẩn Tokyo Night */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30%] left-[25%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[140px]"
      />

      {/* ==================== THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP NAVBAR) ==================== */}
      <header className="relative z-40 mx-auto w-full max-w-[1480px] shrink-0">
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface/95 px-5 py-2.5 shadow-lg backdrop-blur-md">
          <Link
            href={ROADMAP_LINKS.brand}
            className="group flex shrink-0 items-center transition-opacity hover:opacity-95"
          >
            <BrandLogo size="sm" priority />
          </Link>

          <div className="hidden max-w-[460px] flex-1 items-center justify-between rounded-full border border-border-subtle bg-surface-secondary/90 px-4 py-2 text-xs text-text-muted transition-colors focus-within:border-border md:flex">
            <div className="flex flex-1 items-center gap-2.5">
              <Search className="size-4 shrink-0 text-text-muted" />
              <input
                type="text"
                placeholder="Search concepts, algorithms, or problems..."
                className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <kbd className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] font-medium text-text-secondary">
              Ctrl + K
            </kbd>
          </div>

          <div className="flex items-center gap-3">
            <PwaInstallButton />
            <ThemeToggleButton />
            <UserProfileMenu />
          </div>
        </nav>
      </header>

      {/* ==================== KHÔNG GIAN LÀM VIỆC CHÍNH 2 CỘT (MAIN WORKSPACE) ==================== */}
      <main className="relative z-10 mx-auto mt-3 grid min-h-0 w-full max-w-[1480px] flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* -------------------- CỘT TRÁI (9/12): KHUNG CHỨA HORIZONTAL ROADMAP TREE -------------------- */}
        <section className="flex min-h-0 flex-col justify-between rounded-2xl border border-border-subtle bg-surface-secondary/90 p-4 shadow-xl lg:col-span-8 xl:col-span-9">
          {/* 1. Thanh Banner Thông Tin Roadmap */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface px-5 py-3">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/12 text-cyan">
                <Map className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-sm font-bold tracking-wide text-text-primary uppercase sm:text-[15px]">
                    YOUR LEARNING ROADMAP
                  </h1>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[9px] font-medium text-cyan">
                    CURRENT DEMO: DATA STRUCTURES &amp; ALGORITHMS
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {isGeneratedReady && indexedDocs[0]
                    ? `Generated from ${indexedDocs[0].name} • Hold Left/Right Click to pan • Click any node to open tasks.`
                    : "Upload your course syllabus (PDF) to generate your horizontal skill tree."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex size-11 items-center justify-center">
                <svg className="size-11 -rotate-90" viewBox="0 0 44 44">
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="var(--color-border-subtle)"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="var(--color-cyan)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={
                      2 * Math.PI * 18 * (1 - completionPercent / 100)
                    }
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-text-primary">
                  {completionPercent}%
                </span>
              </div>

              <div className="text-xs text-text-secondary">
                Unlocked:{" "}
                <span className="font-bold text-text-primary">
                  {unlockedCount} / {totalCount}
                </span>{" "}
                Nodes
              </div>
            </div>
          </div>

          {/* 2. Canvas Đồ Thị Cây Ngang (Horizontal React Flow + Dagre) */}
          <div className="relative my-2.5 flex min-h-[450px] flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-border-subtle/50 bg-surface-secondary/65 select-none">
            {isGeneratedReady && roadmapData?.nodes ? (
              <RoadmapCanvas
                roadmapNodes={roadmapData.nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(nodeId: string) => setSelectedNodeId(nodeId)}
              />
            ) : (
              <svg
                viewBox="0 0 900 415"
                className="h-full max-h-[440px] w-full"
                preserveAspectRatio="xMidYMid meet"
                aria-label="DSA Skill Tree Placeholder"
              >
                {EMPTY_PLACEHOLDER_EDGES.map((edge) => {
                  const n1 = EMPTY_PLACEHOLDER_SLOTS.find(
                    (n) => n.id === edge.from
                  )!
                  const n2 = EMPTY_PLACEHOLDER_SLOTS.find(
                    (n) => n.id === edge.to
                  )!
                  const isVertical = n1.x === n2.x
                  const startOffset = isVertical
                    ? NODE_RADIUS + 26
                    : NODE_RADIUS
                  const pts = getCircleEdge(
                    n1.x,
                    n1.y,
                    startOffset,
                    n2.x,
                    n2.y,
                    NODE_RADIUS
                  )
                  return (
                    <line
                      key={`${edge.from}-${edge.to}`}
                      x1={pts.x1}
                      y1={pts.y1}
                      x2={pts.x2}
                      y2={pts.y2}
                      stroke={
                        isProcessingOrFetching ? "var(--color-primary)" : "var(--color-border-subtle)"
                      }
                      strokeOpacity={isProcessingOrFetching ? 0.5 : 0.85}
                      strokeWidth="1.75"
                      strokeDasharray="5 5"
                    />
                  )
                })}

                {EMPTY_PLACEHOLDER_SLOTS.map((slot) => (
                  <g
                    key={slot.id}
                    transform={`translate(${slot.x}, ${slot.y})`}
                  >
                    <circle
                      r={NODE_RADIUS}
                      fill="var(--color-surface-secondary)"
                      stroke={
                        isProcessingOrFetching ? "var(--color-primary)" : "var(--color-border-subtle)"
                      }
                      strokeWidth="2"
                      strokeDasharray="6 5"
                    />
                    <text
                      y={NODE_RADIUS + 20}
                      textAnchor="middle"
                      fill="var(--color-text-muted)"
                      fontSize="13"
                      fontWeight="500"
                    >
                      {slot.slotLabel}
                    </text>
                  </g>
                ))}
              </svg>
            )}

            {/* HỘP THÔNG BÁO TRUNG TÂM KHI CHƯA CÓ PDF (EMPTY) */}
            {flowState === "empty" && (
              <div className="absolute top-1/2 left-1/2 z-20 w-[90%] max-w-[400px] -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border-subtle bg-surface/95 px-7 py-7 text-center shadow-2xl">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
                    <FileCode2 className="size-7" />
                  </div>
                  <h2 className="mt-3.5 text-base font-bold text-text-primary">
                    No Skill Tree Generated Yet
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    Upload your course syllabus or lecture slides on the right
                    panel to extract topics and build your learning path.
                  </p>
                </div>
              </div>
            )}

            {/* HỘP LOADING AI KHI BACKEND ĐANG PHÂN TÍCH PDF (LẶP SUBTITLE & MỜ DẦN KHI XONG) */}
            {showLoadingOverlay && (
              <div
                className={` absolute top-1/2 left-1/2 z-30 w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                  isOverlayFadingOut
                    ? "pointer-events-none scale-95 opacity-0"
                    : "scale-100 opacity-100"
                }`}
              >
                <div className="flex flex-col items-center rounded-2xl border border-primary/50 bg-surface/98 px-7 py-7 text-center shadow-[0_0_45px_rgba(122,162,247,0.24)] backdrop-blur-md">
                  <div className="relative flex size-12 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 text-cyan">
                    <Sparkles className="size-5 animate-spin" />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1 rounded-2xl border border-cyan/30 animate-ping"
                    />
                  </div>

                  <h2 className="mt-4 text-sm font-bold text-text-primary">
                    Generating Your Learning Roadmap...
                  </h2>

                  {/* Subtitle chạy lặp lại kèm hiệu ứng chuyển mờ (fade) giữa các câu */}
                  <div className="mt-2 flex min-h-[36px] items-center justify-center">
                    <p
                      className={`font-mono text-[11px] leading-relaxed text-cyan transition-opacity duration-200 ${
                        isSubtitleFading ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {isOverlayFadingOut
                        ? "Skill tree ready! Rendering interactive nodes..."
                        : LOADING_STEPS[loadingStepIndex]}
                    </p>
                  </div>

                  {/* Nhịp sóng trạng thái AI (thay cho thanh % thời gian cố định) */}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-secondary px-3.5 py-1 font-mono text-[10px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-cyan [animation-delay:-0.3s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-[#BB9AF7]" />
                    </span>
                    <span className="truncate max-w-[230px]">
                      Analyzing {simulatedFileMeta.fileName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* HỘP BÁO LỖI KHI TANSTACK QUERY GẶP SỰ CỐ */}
            {flowState === "ready" && isQueryError && (
              <div className="absolute top-1/2 left-1/2 z-20 w-[90%] max-w-[400px] -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center rounded-2xl border border-danger/60 bg-surface/98 px-7 py-6 text-center shadow-2xl">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-danger/15 text-danger">
                    <AlertTriangle className="size-6" />
                  </div>
                  <h2 className="mt-3 text-sm font-bold text-text-primary">
                    Failed to Load Roadmap Data
                  </h2>
                  <p className="mt-1.5 text-xs text-text-secondary">
                    {queryError instanceof Error
                      ? queryError.message
                      : "An unexpected error occurred while fetching the skill tree."}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-xs font-bold text-surface-secondary transition-colors hover:bg-primary-hover"
                  >
                    Retry Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Chú Thích Trạng Thái (Bottom Legend Pill) + Thanh gợi ý mở Pop-up */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-5 rounded-full border border-border-subtle bg-surface px-5 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-success" />
                <span className="text-text-secondary">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-cyan" />
                <span className="text-text-secondary">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="text-text-secondary">Locked</span>
              </div>
            </div>

            {isGeneratedReady && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedNodeId("avl-tree")}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/40 bg-primary/12 px-3.5 py-1.5 text-[11px] font-semibold text-cyan transition-colors hover:bg-primary/20"
                >
                  <span>Preview &ldquo;AVL Tree&rdquo; Pop-up</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3.5 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-border hover:text-text-primary"
                >
                  <RotateCcw className="size-3 text-primary" />
                  <span>Reset to Empty State</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* -------------------- CỘT PHẢI (3/12): UPLOAD PANEL & ACTIVE KNOWLEDGE BASE -------------------- */}
        <aside className="flex min-h-0 flex-col gap-4 lg:col-span-4 xl:col-span-3">
          {/* KHUNG TRÊN: Upload your study material (PDF/Syllabus) */}
          <div className="rounded-2xl border border-border-subtle bg-surface-secondary/90 p-4 shadow-xl">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault()
                if (!isProcessingOrFetching) setIsDraggingFile(true)
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDropPdf}
              onClick={handleOpenFileDialog}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors ${
                isDraggingFile
                  ? "border-cyan bg-primary/12"
                  : "border-border bg-surface/60 hover:border-primary/60"
              }`}
            >
              <CloudUpload className="size-11 stroke-[1.75] text-cyan" />

              <p className="mt-3 text-xs font-medium text-text-primary">
                Upload your study material (PDF/Syllabus)
              </p>

              <button
                type="button"
                disabled={isProcessingOrFetching}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenFileDialog()
                }}
                className="mt-3.5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 text-xs font-bold text-surface-secondary shadow-[0_0_20px_rgba(122,162,247,0.25)] transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="size-4 stroke-[2.2]" />
                <span>
                  {isProcessingOrFetching ? "Analyzing PDF..." : "Choose File"}
                </span>
              </button>

              <button
                type="button"
                disabled={isProcessingOrFetching}
                onClick={(e) => {
                  e.stopPropagation()
                  triggerSimulation("CS101_DSA_Syllabus_HCMUS.pdf", "2.4 MB")
                }}
                className="mt-2 cursor-pointer font-mono text-[11px] font-medium text-cyan underline decoration-[#7DCFFF]/40 underline-offset-4 transition-colors hover:text-text-primary disabled:pointer-events-none disabled:opacity-50"
              >
                Or use sample CS101_DSA_Syllabus_HCMUS.pdf
              </button>

              {uploadError && (
                <p className="mt-2.5 text-[11px] font-medium text-danger">
                  {uploadError}
                </p>
              )}

              <p className="mt-2.5 text-[11px] text-text-muted">
                {currentUser?.accountType === "guest"
                  ? "Select any PDF from your device or drag & drop here"
                  : "Supported format: PDF (Max 10MB) • Drag & drop supported"}
              </p>
            </div>
          </div>

          {/* KHUNG DƯỚI: Active Knowledge Base (RAG) */}
          <div className="flex flex-1 flex-col rounded-2xl border border-border-subtle bg-surface-secondary/90 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="size-4 text-primary" />
                <h2 className="text-xs font-bold text-text-primary">
                  Active Knowledge Base (RAG)
                </h2>
              </div>
              {isGeneratedReady && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  Indexed
                </span>
              )}
            </div>

            <div className="mt-4">
              {flowState === "empty" && (
                <div className="flex items-center gap-3.5 rounded-xl border border-border-subtle bg-surface p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-muted">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-text-primary">
                      0 Documents Indexed
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-text-muted">
                      Your uploaded PDFs will appear here for RAG citations.
                    </p>
                  </div>
                </div>
              )}

              {isProcessingOrFetching && (
                <div className="rounded-xl border border-primary/40 bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-cyan">
                      <FileText className="size-5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-text-primary">
                        {simulatedFileMeta.fileName}
                      </div>
                      <p className="mt-0.5 text-[11px] text-cyan">
                        Chunking &amp; embedding PDF into vector store...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isGeneratedReady &&
                indexedDocs.map(
                  (doc: {
                    id: string
                    name: string
                    size: string
                    chunks: number
                  }) => (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-primary/40 bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/16 text-cyan">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div
                              className="truncate text-xs font-bold text-text-primary"
                              title={doc.name}
                            >
                              {doc.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                              <span>{doc.size}</span>
                              <span>•</span>
                              <span className="text-primary">
                                {doc.chunks} chunks
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleReset}
                          title="Remove PDF & reset roadmap"
                          className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-secondary hover:text-warning"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5 text-[10px] text-text-secondary">
                        <span>
                          {roadmapData?.knowledgeBase?.totalDocuments ?? 1}{" "}
                          Document Indexed
                        </span>
                        <span className="font-mono text-success">
                          {roadmapData?.knowledgeBase?.ragStatus ??
                            "RAG Citations Active"}
                        </span>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        </aside>
      </main>

      {/* ==================== POP-UP MODAL CĂN GIỮA MÀN HÌNH (KHÔNG BAO GIỜ BỊ CẮT KHUẤT) ==================== */}
      {isGeneratedReady && popupNode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-secondary/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedNodeId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-node-title"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[540px] overflow-hidden rounded-2xl border bg-surface shadow-[0_28px_80px_rgba(0,0,0,0.85)] ${
              popupNode.status === "locked"
                ? "border-border"
                : "border-primary/65"
            }`}
          >
            {/* 1. Header Pop-up: Huy hiệu Node + Tên chủ đề + Badge trạng thái + Nút X */}
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle bg-surface-secondary/60 px-6 py-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 bg-surface ${
                    popupNode.status === "completed"
                      ? "border-success text-success"
                      : popupNode.status === "current"
                        ? "border-cyan font-mono text-sm font-extrabold text-cyan"
                        : "border-border text-text-muted"
                  }`}
                >
                  {popupNode.status === "completed" && (
                    <Check className="size-5 stroke-[2.75]" />
                  )}
                  {popupNode.status === "current" &&
                    (popupNode.shortCode || "01")}
                  {popupNode.status === "locked" && <Lock className="size-4" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="popup-node-title"
                      className="text-lg font-bold tracking-tight text-text-primary"
                    >
                      {popupNode.label}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        popupNode.status === "completed"
                          ? "bg-success/15 text-success"
                          : popupNode.status === "current"
                            ? "bg-cyan/15 text-cyan"
                            : "bg-border/40 text-text-secondary"
                      }`}
                    >
                      {popupNode.status}
                    </span>
                    {popupNode.complexity && (
                      <span className="rounded-md border border-border-subtle bg-surface-secondary px-2 py-0.5 font-mono text-[10px] text-cyan">
                        {popupNode.complexity}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {popupNode.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close pop-up"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface-secondary text-text-secondary transition-colors hover:border-primary hover:text-text-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 2. Thân Pop-up: Prerequisites, Tiến độ học tập, Danh sách Task (chỉ hiển thị thông tin) & Nút hành động chính Enter Workspace */}
            <div className="px-6 py-4">
              {/* Khung thông tin Prerequisites & Mastery Progress */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border-subtle bg-surface-secondary/85 p-3 sm:grid-cols-2">
                <div className="flex flex-col justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
                    <GitBranch className="size-3.5 text-primary" />
                    <span>Prerequisites</span>
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {popupNode.prerequisiteLabels &&
                    popupNode.prerequisiteLabels.length > 0 ? (
                      popupNode.prerequisiteLabels.map(
                        (prereqLabel: string) => (
                          <span
                            key={prereqLabel}
                            className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] font-medium text-primary"
                          >
                            {prereqLabel}
                          </span>
                        )
                      )
                    ) : (
                      <span className="font-mono text-[11px] font-medium text-success">
                        None (Foundation Topic)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-text-secondary">
                      Learning Progress ({popupNode.completedTasks}/
                      {popupNode.totalTasks} Tasks)
                    </span>
                    <span className="font-mono font-bold text-cyan">
                      {popupNode.progress}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7AA2F7] to-[#9ECE6A] transition-all duration-300"
                      style={{ width: `${popupNode.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Danh sách 3 Task hiển thị dạng thông tin tĩnh (không phải nút bấm điều hướng) */}
              <div className="mt-3.5 space-y-2 select-none">
                {popupNode.tasks.map(
                  (
                    task: {
                      id: string
                      title: string
                      description: string
                      status: string
                      type: string
                    },
                    idx: number
                  ) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-secondary/75 px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            task.status === "completed"
                              ? "bg-success text-surface-secondary"
                              : task.status === "current"
                                ? "bg-cyan text-surface-secondary"
                                : "border border-border bg-surface text-text-muted"
                          }`}
                        >
                          {task.status === "locked" ? (
                            <Lock className="size-3" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`truncate text-xs font-bold sm:text-[13px] ${
                              task.status === "locked"
                                ? "text-text-secondary"
                                : "text-text-primary"
                            }`}
                          >
                            {task.title}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-text-muted">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-cyan">
                          {task.type}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Nút hành động chính duy nhất: → Enter Workspace (điều hướng tới /workspace/:nodeId/:taskId) */}
              {popupNode.status === "locked" ? (
                <button
                  type="button"
                  disabled
                  className="mt-4 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-secondary px-4 text-xs font-semibold text-text-muted select-none sm:text-sm"
                >
                  <Lock className="size-4 shrink-0 text-text-muted" />
                  <span className="truncate">
                    Locked — Complete{" "}
                    {popupNode.prerequisiteLabels &&
                    popupNode.prerequisiteLabels.length > 0
                      ? popupNode.prerequisiteLabels.join(" & ")
                      : "Prerequisites"}{" "}
                    to Unlock
                  </span>
                </button>
              ) : (
                <Link
                  href={popupNode.workspaceHref}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-surface-secondary shadow-[0_0_24px_rgba(122,162,247,0.3)] transition-all hover:bg-primary-hover"
                >
                  <ArrowRight className="size-4 stroke-[2.5]" />
                  <span>Enter Workspace</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
