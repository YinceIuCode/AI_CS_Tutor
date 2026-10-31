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
  "Extracting DSA topics & prerequisite dependencies...",
  "Indexing 48 vector chunks into Active Knowledge Base (RAG)...",
] as const

export default function RoadmapPage() {
  const router = useRouter()
  const { currentUser, isAuthenticated, isInitializing } = useAuth()
  const { userProgress, isProgressLoaded, saveRoadmapState } = useUserProgress()

  const [flowState, setFlowState] = React.useState<FlowState>("empty")
  const [progress, setProgress] = React.useState(0)
  const [loadingStepIndex, setLoadingStepIndex] = React.useState(0)
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

  // Truy xuất dữ liệu chi tiết của Node đang mở trong Pop-up theo ID
  const popupNode = React.useMemo(() => {
    if (!isGeneratedReady || !selectedNodeId || !roadmapData?.nodes) {
      return null
    }
    return getRoadmapNodeById(roadmapData.nodes, selectedNodeId)
  }, [isGeneratedReady, selectedNodeId, roadmapData])

  const triggerSimulation = React.useCallback(
    (fileName = "CS101_DSA_Syllabus_HCMUS.pdf", fileSize = "2.4 MB") => {
      setSimulatedFileMeta({ fileName, fileSize })
      setFlowState("loading")
      setProgress(0)
      setLoadingStepIndex(0)
      setSelectedNodeId(null)

      const startTime = Date.now()
      const durationMs = 2200

      const interval = window.setInterval(() => {
        const elapsed = Date.now() - startTime
        const nextProgress = Math.min(
          100,
          Math.round((elapsed / durationMs) * 100)
        )
        setProgress(nextProgress)

        if (nextProgress < 38) {
          setLoadingStepIndex(0)
        } else if (nextProgress < 75) {
          setLoadingStepIndex(1)
        } else {
          setLoadingStepIndex(2)
        }

        if (elapsed >= durationMs) {
          window.clearInterval(interval)
          setFlowState("ready")
          saveRoadmapState({
            roadmapFlowState: "ready",
            fileName,
            fileSize,
          })
        }
      }, 45)
    },
    [saveRoadmapState]
  )

  const handleReset = () => {
    setFlowState("empty")
    setProgress(0)
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
      <div className="flex min-h-svh items-center justify-center bg-[#15161E] font-mono text-xs text-[#7DCFFF]">
        Verifying session...
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh flex-col justify-between overflow-x-hidden bg-[#15161E] px-4 py-3 font-sans text-[#A9B1D6] selection:bg-[#7AA2F7]/30 selection:text-[#C0CAF5] md:px-7 md:py-4 lg:h-svh lg:overflow-hidden">
      {/* Quầng sáng nền nhẹ chuẩn Tokyo Night */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30%] left-[25%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7AA2F7]/8 blur-[140px]"
      />

      {/* ==================== THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP NAVBAR) ==================== */}
      <header className="relative z-40 mx-auto w-full max-w-[1480px] shrink-0">
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-[#292E42] bg-[#1A1B26]/95 px-5 py-2.5 shadow-lg backdrop-blur-md">
          <Link
            href={ROADMAP_LINKS.brand}
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
          >
            <span className="size-8 shrink-0 rounded-full bg-[#7AA2F7]" />
            <span className="text-lg font-bold tracking-tight text-[#C0CAF5]">
              AlgoPath
            </span>
          </Link>

          <div className="hidden max-w-[460px] flex-1 items-center justify-between rounded-full border border-[#292E42] bg-[#15161E]/90 px-4 py-2 text-xs text-[#565F89] transition-colors focus-within:border-[#414868] md:flex">
            <div className="flex flex-1 items-center gap-2.5">
              <Search className="size-4 shrink-0 text-[#565F89]" />
              <input
                type="text"
                placeholder="Search concepts, algorithms, or problems..."
                className="w-full bg-transparent text-xs text-[#C0CAF5] placeholder:text-[#565F89] focus:outline-none"
              />
            </div>
            <kbd className="rounded-md border border-[#292E42] bg-[#1A1B26] px-2 py-0.5 font-mono text-[10px] font-medium text-[#A9B1D6]">
              Ctrl + K
            </kbd>
          </div>

          <div className="flex items-center gap-3">
            <UserProfileMenu />
          </div>
        </nav>
      </header>

      {/* ==================== KHÔNG GIAN LÀM VIỆC CHÍNH 2 CỘT (MAIN WORKSPACE) ==================== */}
      <main className="relative z-10 mx-auto mt-3 grid min-h-0 w-full max-w-[1480px] flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* -------------------- CỘT TRÁI (9/12): KHUNG CHỨA HORIZONTAL ROADMAP TREE -------------------- */}
        <section className="flex min-h-0 flex-col justify-between rounded-2xl border border-[#292E42] bg-[#15161E]/90 p-4 shadow-xl lg:col-span-8 xl:col-span-9">
          {/* 1. Thanh Banner Thông Tin Roadmap */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-[#292E42] bg-[#1A1B26] px-5 py-3">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#7AA2F7]/35 bg-[#7AA2F7]/12 text-[#7DCFFF]">
                <Map className="size-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wide text-[#C0CAF5] uppercase sm:text-[15px]">
                  DATA STRUCTURES &amp; ALGORITHMS ROADMAP
                </h1>
                <p className="mt-0.5 text-xs text-[#A9B1D6]">
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
                    stroke="#292E42"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#7DCFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={
                      2 * Math.PI * 18 * (1 - completionPercent / 100)
                    }
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-[#C0CAF5]">
                  {completionPercent}%
                </span>
              </div>

              <div className="text-xs text-[#A9B1D6]">
                Unlocked:{" "}
                <span className="font-bold text-[#C0CAF5]">
                  {unlockedCount} / {totalCount}
                </span>{" "}
                Nodes
              </div>
            </div>
          </div>

          {/* 2. Canvas Đồ Thị Cây Ngang (Horizontal React Flow + Dagre) */}
          <div className="relative my-2.5 flex min-h-[450px] flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-[#292E42]/50 bg-[#13141C]/65 select-none">
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
                        isProcessingOrFetching ? "#7AA2F7" : "#3B4261"
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
                      fill="#15161E"
                      stroke={
                        isProcessingOrFetching ? "#7AA2F7" : "#3B4261"
                      }
                      strokeWidth="2"
                      strokeDasharray="6 5"
                    />
                    <text
                      y={NODE_RADIUS + 20}
                      textAnchor="middle"
                      fill="#565F89"
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
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[#292E42] bg-[#1A1B26]/95 px-7 py-7 text-center shadow-2xl">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#7DCFFF]/10 text-[#7DCFFF]">
                    <FileCode2 className="size-7" />
                  </div>
                  <h2 className="mt-3.5 text-base font-bold text-[#C0CAF5]">
                    No Skill Tree Generated Yet
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-[#A9B1D6]">
                    Upload your course syllabus or lecture slides on the right
                    panel to extract topics and build your learning path.
                  </p>
                </div>
              </div>
            )}

            {/* HỘP THANH LOADING KHI BACKEND ĐANG XỬ LÝ HOẶC TANSTACK QUERY ĐANG TẢI DỮ LIỆU */}
            {isProcessingOrFetching && (
              <div className="absolute top-1/2 left-1/2 z-20 w-[90%] max-w-[410px] -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center rounded-2xl border border-[#7AA2F7]/50 bg-[#1A1B26]/98 px-7 py-7 text-center shadow-[0_0_40px_rgba(122,162,247,0.2)]">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#7AA2F7]/16 text-[#7DCFFF]">
                    <Sparkles className="size-5 animate-spin" />
                  </div>
                  <h2 className="mt-3.5 text-sm font-bold text-[#C0CAF5]">
                    Generating Your DSA Skill Tree...
                  </h2>
                  <p className="mt-1 font-mono text-[11px] text-[#7DCFFF]">
                    {flowState === "ready" && isQueryLoading
                      ? "Fetching roadmap graph from service..."
                      : LOADING_STEPS[loadingStepIndex]}
                  </p>

                  <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#15161E] p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7AA2F7] to-[#7DCFFF] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex w-full items-center justify-between font-mono text-[10px] text-[#565F89]">
                    <span>Backend RAG Pipeline</span>
                    <span className="font-bold text-[#C0CAF5]">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* HỘP BÁO LỖI KHI TANSTACK QUERY GẶP SỰ CỐ */}
            {flowState === "ready" && isQueryError && (
              <div className="absolute top-1/2 left-1/2 z-20 w-[90%] max-w-[400px] -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center rounded-2xl border border-[#DB4B4B]/60 bg-[#1A1B26]/98 px-7 py-6 text-center shadow-2xl">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#DB4B4B]/15 text-[#DB4B4B]">
                    <AlertTriangle className="size-6" />
                  </div>
                  <h2 className="mt-3 text-sm font-bold text-[#C0CAF5]">
                    Failed to Load Roadmap Data
                  </h2>
                  <p className="mt-1.5 text-xs text-[#A9B1D6]">
                    {queryError instanceof Error
                      ? queryError.message
                      : "An unexpected error occurred while fetching the skill tree."}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-[#7AA2F7] px-5 text-xs font-bold text-[#15161E] transition-colors hover:bg-[#8DB0FF]"
                  >
                    Retry Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Chú Thích Trạng Thái (Bottom Legend Pill) + Thanh gợi ý mở Pop-up */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-5 rounded-full border border-[#292E42] bg-[#1A1B26] px-5 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#9ECE6A]" />
                <span className="text-[#A9B1D6]">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#3DB5E6]" />
                <span className="text-[#A9B1D6]">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#414868]" />
                <span className="text-[#A9B1D6]">Locked</span>
              </div>
            </div>

            {isGeneratedReady && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedNodeId("avl-tree")}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#7AA2F7]/40 bg-[#7AA2F7]/12 px-3.5 py-1.5 text-[11px] font-semibold text-[#7DCFFF] transition-colors hover:bg-[#7AA2F7]/20"
                >
                  <span>Preview &ldquo;AVL Tree&rdquo; Pop-up</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#292E42] bg-[#1A1B26] px-3.5 py-1.5 text-[11px] font-medium text-[#A9B1D6] transition-colors hover:border-[#414868] hover:text-[#C0CAF5]"
                >
                  <RotateCcw className="size-3 text-[#7AA2F7]" />
                  <span>Reset to Empty State</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* -------------------- CỘT PHẢI (3/12): UPLOAD PANEL & ACTIVE KNOWLEDGE BASE -------------------- */}
        <aside className="flex min-h-0 flex-col gap-4 lg:col-span-4 xl:col-span-3">
          {/* KHUNG TRÊN: Upload your study material (PDF/Syllabus) */}
          <div className="rounded-2xl border border-[#292E42] bg-[#15161E]/90 p-4 shadow-xl">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#414868] bg-[#1A1B26]/60 px-6 py-7 text-center transition-colors hover:border-[#7AA2F7]/60">
              <CloudUpload className="size-11 stroke-[1.75] text-[#3DB5E6]" />

              <p className="mt-3 text-xs font-medium text-[#C0CAF5]">
                Upload your study material (PDF/Syllabus)
              </p>

              <button
                type="button"
                disabled={isProcessingOrFetching}
                onClick={() =>
                  triggerSimulation("CS101_DSA_Syllabus_HCMUS.pdf", "2.4 MB")
                }
                className="mt-3.5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#7AA2F7] px-6 text-xs font-bold text-[#15161E] shadow-[0_0_20px_rgba(122,162,247,0.25)] transition-all hover:bg-[#8DB0FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="size-4 stroke-[2.2]" />
                <span>
                  {isProcessingOrFetching ? "Processing PDF..." : "Choose File"}
                </span>
              </button>

              <p className="mt-3 text-[11px] text-[#565F89]">
                {currentUser?.accountType === "guest"
                  ? "Guest Mode: Loads sample CS101 Syllabus (Sign in to save custom PDFs)"
                  : "Supported format: PDF (Max 10MB)"}
              </p>
            </div>
          </div>

          {/* KHUNG DƯỚI: Active Knowledge Base (RAG) */}
          <div className="flex flex-1 flex-col rounded-2xl border border-[#292E42] bg-[#15161E]/90 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="size-4 text-[#7AA2F7]" />
                <h2 className="text-xs font-bold text-[#C0CAF5]">
                  Active Knowledge Base (RAG)
                </h2>
              </div>
              {isGeneratedReady && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#9ECE6A]/15 px-2 py-0.5 text-[10px] font-semibold text-[#9ECE6A]">
                  <span className="size-1.5 rounded-full bg-[#9ECE6A]" />
                  Indexed
                </span>
              )}
            </div>

            <div className="mt-4">
              {flowState === "empty" && (
                <div className="flex items-center gap-3.5 rounded-xl border border-[#292E42] bg-[#1A1B26] p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#15161E] text-[#565F89]">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#C0CAF5]">
                      0 Documents Indexed
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#565F89]">
                      Your uploaded PDFs will appear here for RAG citations.
                    </p>
                  </div>
                </div>
              )}

              {isProcessingOrFetching && (
                <div className="rounded-xl border border-[#7AA2F7]/40 bg-[#1A1B26] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#7AA2F7]/15 text-[#7DCFFF]">
                      <FileText className="size-5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-[#C0CAF5]">
                        {simulatedFileMeta.fileName}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#7DCFFF]">
                        Chunking &amp; embedding PDF ({progress}%)...
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
                      className="rounded-xl border border-[#7AA2F7]/40 bg-[#1A1B26] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#7AA2F7]/16 text-[#7DCFFF]">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div
                              className="truncate text-xs font-bold text-[#C0CAF5]"
                              title={doc.name}
                            >
                              {doc.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#565F89]">
                              <span>{doc.size}</span>
                              <span>•</span>
                              <span className="text-[#7AA2F7]">
                                {doc.chunks} chunks
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleReset}
                          title="Remove PDF & reset roadmap"
                          className="cursor-pointer rounded-lg p-1.5 text-[#565F89] transition-colors hover:bg-[#15161E] hover:text-[#FF9E64]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[#292E42] pt-2.5 text-[10px] text-[#A9B1D6]">
                        <span>
                          {roadmapData?.knowledgeBase?.totalDocuments ?? 1}{" "}
                          Document Indexed
                        </span>
                        <span className="font-mono text-[#9ECE6A]">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0E14]/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedNodeId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-node-title"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[540px] overflow-hidden rounded-2xl border bg-[#1A1B26] shadow-[0_28px_80px_rgba(0,0,0,0.85)] ${
              popupNode.status === "locked"
                ? "border-[#414868]"
                : "border-[#7AA2F7]/65"
            }`}
          >
            {/* 1. Header Pop-up: Huy hiệu Node + Tên chủ đề + Badge trạng thái + Nút X */}
            <div className="flex items-start justify-between gap-4 border-b border-[#292E42] bg-[#15161E]/60 px-6 py-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 bg-[#1A1B26] ${
                    popupNode.status === "completed"
                      ? "border-[#9ECE6A] text-[#9ECE6A]"
                      : popupNode.status === "current"
                        ? "border-[#3DB5E6] font-mono text-sm font-extrabold text-[#7DCFFF]"
                        : "border-[#414868] text-[#565F89]"
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
                      className="text-lg font-bold tracking-tight text-[#C0CAF5]"
                    >
                      {popupNode.label}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        popupNode.status === "completed"
                          ? "bg-[#9ECE6A]/15 text-[#9ECE6A]"
                          : popupNode.status === "current"
                            ? "bg-[#3DB5E6]/15 text-[#7DCFFF]"
                            : "bg-[#414868]/40 text-[#A9B1D6]"
                      }`}
                    >
                      {popupNode.status}
                    </span>
                    {popupNode.complexity && (
                      <span className="rounded-md border border-[#292E42] bg-[#15161E] px-2 py-0.5 font-mono text-[10px] text-[#7DCFFF]">
                        {popupNode.complexity}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#A9B1D6]">
                    {popupNode.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close pop-up"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#292E42] bg-[#15161E] text-[#A9B1D6] transition-colors hover:border-[#7AA2F7] hover:text-[#C0CAF5]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 2. Thân Pop-up: Prerequisites, Tiến độ học tập, Danh sách Task (chỉ hiển thị thông tin) & Nút hành động chính Enter Workspace */}
            <div className="px-6 py-4">
              {/* Khung thông tin Prerequisites & Mastery Progress */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#292E42] bg-[#15161E]/85 p-3 sm:grid-cols-2">
                <div className="flex flex-col justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#565F89]">
                    <GitBranch className="size-3.5 text-[#7AA2F7]" />
                    <span>Prerequisites</span>
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {popupNode.prerequisiteLabels &&
                    popupNode.prerequisiteLabels.length > 0 ? (
                      popupNode.prerequisiteLabels.map(
                        (prereqLabel: string) => (
                          <span
                            key={prereqLabel}
                            className="rounded-md border border-[#292E42] bg-[#1A1B26] px-2 py-0.5 font-mono text-[10px] font-medium text-[#7AA2F7]"
                          >
                            {prereqLabel}
                          </span>
                        )
                      )
                    ) : (
                      <span className="font-mono text-[11px] font-medium text-[#9ECE6A]">
                        None (Foundation Topic)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#A9B1D6]">
                      Learning Progress ({popupNode.completedTasks}/
                      {popupNode.totalTasks} Tasks)
                    </span>
                    <span className="font-mono font-bold text-[#7DCFFF]">
                      {popupNode.progress}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#1A1B26] p-0.5">
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
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#292E42] bg-[#15161E]/75 px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            task.status === "completed"
                              ? "bg-[#9ECE6A] text-[#15161E]"
                              : task.status === "current"
                                ? "bg-[#7DCFFF] text-[#15161E]"
                                : "border border-[#414868] bg-[#1A1B26] text-[#565F89]"
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
                                ? "text-[#A9B1D6]"
                                : "text-[#C0CAF5]"
                            }`}
                          >
                            {task.title}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-[#565F89]">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-md border border-[#292E42] bg-[#1A1B26] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#7DCFFF]">
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
                  className="mt-4 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#292E42] bg-[#15161E] px-4 text-xs font-semibold text-[#565F89] select-none sm:text-sm"
                >
                  <Lock className="size-4 shrink-0 text-[#565F89]" />
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
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7AA2F7] text-sm font-bold text-[#15161E] shadow-[0_0_24px_rgba(122,162,247,0.3)] transition-all hover:bg-[#8DB0FF]"
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
