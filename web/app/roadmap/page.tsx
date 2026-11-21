"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BookOpen,
  Check,
  CheckCircle2,
  CloudUpload,
  Database,
  FileCode2,
  FileText,
  GitBranch,
  Lock,
  Map,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import RoadmapCanvas from "@/components/roadmap/RoadmapCanvas"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { BRAND } from "@/config/brand"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { useAuth } from "@/hooks/useAuth"
import { useRoadmap } from "@/hooks/useRoadmap"
import { useUserProgress } from "@/hooks/useUserProgress"
import {
  SAMPLE_COURSES,
  MOCK_ROADMAP_NODES,
  MOCK_OOP_ROADMAP_NODES,
} from "@/mocks/roadmapData"
import { recordUploadedDocument, fetchTableData } from "@/services/adminService"
import { applyUserProgressToNodes } from "@/services/progressService"
import {
  buildRoadmapPayload,
  getRoadmapNodeById,
  getWorkspaceRouteForNode,
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

  // Danh sách đa tài liệu PDF (hỗ trợ lưu và hiển thị từ 1 đến 5 files)
  const [documents, setDocuments] = React.useState<any[]>(() => SAMPLE_COURSES)
  const [activeDocId, setActiveDocId] = React.useState<string>(SAMPLE_COURSES[0].id)

  // Tab chuyển đổi bên cột phải: "progress" (Tiến độ & Resume) | "rag" (Quản lý tài liệu & Upload)
  const [rightSidebarTab, setRightSidebarTab] = React.useState<"progress" | "rag">("progress")
  // Bộ lọc Node trong tab Learning Progress: "in_progress" | "completed" | "all"
  const [nodeFilter, setNodeFilter] = React.useState<"in_progress" | "completed" | "all">("in_progress")

  const [simulatedFileMeta, setSimulatedFileMeta] = React.useState({
    fileName: "CS101_DSA_Syllabus_HCMUS.pdf",
    fileSize: "2.4 MB",
  })

  // ID của Node đang mở Pop-up Screen (null = đóng Pop-up)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)

  // ID của Node đang được chọn trong danh sách "IN PROGRESS NODES" ở cột phải
  const [selectedResumeNodeId, setSelectedResumeNodeId] = React.useState<string | null>(null)

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

  // Khôi phục trạng thái Roadmap & file PDF đã upload khi refresh hoặc đăng nhập lại
  React.useEffect(() => {
    if (!isProgressLoaded) return
    if (userProgress.roadmapFlowState === "ready") {
      setDocuments((prev) => (prev.length > 0 ? prev : SAMPLE_COURSES))
      setActiveDocId((prev) => prev || SAMPLE_COURSES[0].id)
      setSimulatedFileMeta({
        fileName: userProgress.fileName || "CS101_DSA_Syllabus_HCMUS.pdf",
        fileSize: userProgress.fileSize || "2.4 MB",
      })
      setFlowState((prev) => (prev === "loading" ? prev : "ready"))
      setRightSidebarTab("progress")
    } else if (userProgress.roadmapFlowState === "empty") {
      setDocuments([])
      setActiveDocId("")
      setFlowState((prev) => (prev === "loading" ? prev : "empty"))
      setRightSidebarTab("rag")
    }
  }, [
    isProgressLoaded,
    userProgress.roadmapFlowState,
    userProgress.fileName,
    userProgress.fileSize,
  ])

  // Đồng bộ danh sách tài liệu từ Supabase hoặc SAMPLE_COURSES
  React.useEffect(() => {
    let isMounted = true
    async function syncDocuments() {
      try {
        const res = await fetchTableData("knowledge_documents")
        if (!isMounted) return
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((d: any) => {
            const isOop =
              String(d.id).includes("oop") ||
              String(d.id).includes("0002") ||
              String(d.name || "").toLowerCase().includes("oop") ||
              String(d.file_name || "").toLowerCase().includes("oop") ||
              String(d.title || "").toLowerCase().includes("oop")
            const sample = isOop ? SAMPLE_COURSES[1] : SAMPLE_COURSES[0]
            const docName =
              d.name ||
              d.file_name ||
              d.title ||
              (isOop ? "CS102_OOP_Cpp_Syllabus_HCMUS.pdf" : "CS101_DSA_Syllabus_HCMUS.pdf")
            return {
              id: d.id,
              name: docName,
              size: d.file_size || sample.size,
              chunks: d.chunks_count || d.content?.totalPages || sample.chunks,
              status: "indexed",
              courseTitle: isOop
                ? "CS102 - Object-Oriented Programming (HCMUS)"
                : "CS101 - Data Structures & Algorithms (HCMUS)",
              nodes: isOop ? MOCK_OOP_ROADMAP_NODES : MOCK_ROADMAP_NODES,
            }
          })
          setDocuments(mapped)
          return
        }
      } catch {}
      if (isMounted) {
        setDocuments(SAMPLE_COURSES)
      }
    }

    if (flowState === "ready" || userProgress.roadmapFlowState === "ready") {
      syncDocuments()
    }
    return () => {
      isMounted = false
    }
  }, [flowState, userProgress.roadmapFlowState])

  // Loại bỏ các bản ghi trùng lặp theo Course Code hoặc File Name
  const dedupedDocuments = React.useMemo(() => {
    const seen = new Set<string>()
    return documents.filter((doc) => {
      const normName = String(doc.name || doc.file_name || doc.title || doc.id).trim().toLowerCase()
      const cleanKey =
        normName.includes("oop") || normName.includes("cs102") || String(doc.id).includes("0002")
          ? "cs102-oop"
          : "cs101-dsa"
      if (seen.has(cleanKey)) return false
      seen.add(cleanKey)
      return true
    })
  }, [documents])

  // Phân biệt tài liệu OOP C++ vs DSA
  const isOopActive = React.useMemo(() => {
    const idStr = String(activeDocId || "").toLowerCase()
    return (
      idStr === "doc-oop-syllabus" ||
      idStr === "00000005-0000-4000-8000-000000000002" ||
      idStr.includes("oop") ||
      idStr.includes("0002")
    )
  }, [activeDocId])

  // Phân giải tài liệu đang Active
  const activeDocument = React.useMemo(() => {
    if (!dedupedDocuments.length) return null
    // 1. Exact ID match
    const exact = dedupedDocuments.find((d) => d.id === activeDocId)
    if (exact) return exact

    // 2. Course match (OOP vs DSA)
    const matched = dedupedDocuments.find((d) => {
      const isDocOop =
        String(d.id).includes("oop") ||
        String(d.id).includes("0002") ||
        String(d.name).toLowerCase().includes("oop")
      return isOopActive === isDocOop
    })
    return matched || dedupedDocuments[0] || null
  }, [dedupedDocuments, activeDocId, isOopActive])

  // TanStack Query lấy dữ liệu Roadmap backend nếu có API URL
  const {
    data: rawRoadmapData,
    isLoading: isQueryLoading,
    isError: isQueryError,
    error: queryError,
    refetch,
  } = useRoadmap({
    enabled: flowState === "ready",
    fileName: activeDocument?.name || (isOopActive ? "CS102_OOP_Cpp_Syllabus_HCMUS.pdf" : "CS101_DSA_Syllabus_HCMUS.pdf"),
    fileSize: activeDocument?.size || (isOopActive ? "1.8 MB" : "2.4 MB"),
    documentId: activeDocId,
  })

  // Lắng nghe sự kiện preset thay đổi từ Admin Console để làm mới dữ liệu
  React.useEffect(() => {
    const handleProgressUpdate = () => {
      refetch()
    }
    window.addEventListener("algopath:progress-updated", handleProgressUpdate)
    return () => {
      window.removeEventListener("algopath:progress-updated", handleProgressUpdate)
    }
  }, [refetch])

  // Lấy danh sách Node gốc của tài liệu đang Active (LỌC NGHIÊM NGẶT THEO activeDocumentId)
  const rawActiveNodes = React.useMemo(() => {
    let candidateNodes: any[] = []

    if (isOopActive) {
      if (rawRoadmapData?.nodes && rawRoadmapData.nodes.some((n: any) => String(n.id).startsWith("oop-"))) {
        candidateNodes = rawRoadmapData.nodes
      } else {
        candidateNodes = MOCK_OOP_ROADMAP_NODES
      }
    } else {
      if (rawRoadmapData?.nodes && rawRoadmapData.nodes.length > 0) {
        candidateNodes = rawRoadmapData.nodes
      } else {
        candidateNodes = activeDocument?.nodes || MOCK_ROADMAP_NODES
      }
    }

    // QUY TẮC BẤT BIẾN: Chỉ lấy đúng các node thuộc về môn học đang active!
    if (isOopActive) {
      return candidateNodes.filter((node: any) => {
        const docId = String(node.document_id || "")
        return (
          docId === "00000005-0000-4000-8000-000000000002" ||
          docId === "doc-oop-syllabus" ||
          docId.includes("0002") ||
          String(node.id).startsWith("oop-")
        )
      })
    } else {
      return candidateNodes.filter((node: any) => {
        const nodeId = String(node.id || "")
        return !nodeId.startsWith("oop-")
      })
    }
  }, [activeDocument, isOopActive, rawRoadmapData])

  // Đồng bộ tiến độ User vào từng Node của tài liệu đang chọn
  const mergedActiveNodes = React.useMemo(() => {
    if (!rawActiveNodes.length) return []
    return applyUserProgressToNodes(rawActiveNodes, userProgress)
  }, [rawActiveNodes, userProgress])

  // Lọc tất cả các Node có trạng thái hoàn thành (status === 'completed')
  const completedNodes = React.useMemo(() => {
    if (!mergedActiveNodes || !mergedActiveNodes.length) return []
    return mergedActiveNodes.filter((node: any) => node.status === "completed")
  }, [mergedActiveNodes])

  // Tổng hợp Payload Roadmap đầy đủ (Cây DAG, thống kê %, knowledgeBase)
  const roadmapData = React.useMemo(() => {
    if (!activeDocument || !mergedActiveNodes.length) return null
    return buildRoadmapPayload(mergedActiveNodes, {
      id: activeDocument.id,
      name: activeDocument.name,
      size: activeDocument.size,
      chunks: activeDocument.chunks || 48,
      status: "indexed",
      indexedAt: activeDocument.indexedAt || new Date().toISOString(),
    })
  }, [activeDocument, mergedActiveNodes])

  // Lọc tất cả các Node có trạng thái đang học (status === 'current')
  const inProgressNodes: any[] = React.useMemo(() => {
    if (!mergedActiveNodes || !mergedActiveNodes.length) return []
    return mergedActiveNodes.filter((node: any) => node.status === "current")
  }, [mergedActiveNodes])

  // Lọc danh sách Node theo filter đang chọn (In Progress | Completed | All)
  const displayedNodes = React.useMemo(() => {
    if (!mergedActiveNodes.length) return []
    if (nodeFilter === "in_progress") {
      return inProgressNodes.length > 0 ? inProgressNodes : mergedActiveNodes.filter((n: any) => n.status !== "locked")
    }
    if (nodeFilter === "completed") {
      return completedNodes
    }
    return mergedActiveNodes
  }, [mergedActiveNodes, inProgressNodes, completedNodes, nodeFilter])

  // Tự động giữ Node được chọn đồng bộ khi đổi tài liệu hoặc thay đổi tiến trình
  React.useEffect(() => {
    if (inProgressNodes.length > 0) {
      if (!inProgressNodes.some((n: any) => n.id === selectedResumeNodeId)) {
        setSelectedResumeNodeId((inProgressNodes[0] as any)?.id || null)
      }
    } else if (mergedActiveNodes.length > 0) {
      const fallback: any =
        mergedActiveNodes.find((n: any) => n.status !== "locked") ||
        mergedActiveNodes[0]
      setSelectedResumeNodeId(fallback?.id || null)
    } else {
      setSelectedResumeNodeId(null)
    }
  }, [inProgressNodes, mergedActiveNodes, selectedResumeNodeId])

  // Node mục tiêu để gắn vào nút "Resume Workspace" (chỉ chọn node đã mở khóa: current hoặc completed)
  const targetResumeNode: any = React.useMemo(() => {
    if (!mergedActiveNodes.length) return null
    return (
      mergedActiveNodes.find((n: any) => n.id === selectedResumeNodeId && n.status !== "locked") ||
      inProgressNodes[0] ||
      mergedActiveNodes.find((n: any) => n.status !== "locked") ||
      null
    )
  }, [mergedActiveNodes, selectedResumeNodeId, inProgressNodes])

  const isGeneratedReady =
    flowState === "ready" && Boolean(roadmapData && roadmapData.nodes && roadmapData.nodes.length)
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

  // Hàm thêm nhanh tài liệu mẫu từ danh sách SAMPLE_COURSES
  const handleAddSample = React.useCallback(
    (sampleId?: string) => {
      if (documents.length >= 5) {
        setUploadError("Max 5/5 documents reached.")
        return
      }
      setUploadError(null)

      let picked = SAMPLE_COURSES.find((s) => s.id === sampleId)
      if (!picked) {
        picked =
          SAMPLE_COURSES.find((s) => !documents.some((d) => d.id === s.id)) ||
          SAMPLE_COURSES[documents.length % SAMPLE_COURSES.length]
      }

      const uniqueId = `doc-${picked.id}-${Date.now()}`
      const newDoc = {
        ...picked,
        id: documents.some((d) => d.id === picked.id) ? uniqueId : picked.id,
      }

      setFlowState("loading")
      setLoadingStepIndex(0)
      setSimulatedFileMeta({ fileName: newDoc.name, fileSize: newDoc.size })

      const timer = window.setTimeout(() => {
        setDocuments((prev) => [...prev, newDoc])
        setActiveDocId(newDoc.id)
        setFlowState("ready")
        saveRoadmapState({
          roadmapFlowState: "ready",
          fileName: newDoc.name,
          fileSize: newDoc.size,
        })
        recordUploadedDocument(newDoc, currentUser).catch(() => {})
      }, 1200)

      return () => window.clearTimeout(timer)
    },
    [documents, saveRoadmapState]
  )

  const processSelectedPdfFile = React.useCallback(
    (file: File | null | undefined) => {
      if (!file) return
      if (documents.length >= 5) {
        setUploadError("Max 5/5 documents reached. Remove a file to upload another.")
        return
      }
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
      setUploadError(null)

      // Chọn mẫu lộ trình tương ứng cho tài liệu vừa nạp
      const template = SAMPLE_COURSES[documents.length % SAMPLE_COURSES.length]
      const newDoc = {
        id: `doc-custom-${Date.now()}`,
        name: file.name,
        size: formattedSize,
        chunks: Math.floor(Math.random() * 25) + 35,
        status: "indexed",
        courseTitle: file.name.replace(/\.pdf$/i, "").replace(/_/g, " "),
        nodes: template.nodes,
      }

      setFlowState("loading")
      setLoadingStepIndex(0)
      setSimulatedFileMeta({ fileName: newDoc.name, fileSize: newDoc.size })

      const timer = window.setTimeout(() => {
        setDocuments((prev) => [...prev, newDoc])
        setActiveDocId(newDoc.id)
        setFlowState("ready")
        saveRoadmapState({
          roadmapFlowState: "ready",
          fileName: newDoc.name,
          fileSize: newDoc.size,
        })
        recordUploadedDocument(newDoc, currentUser).catch(() => {})
      }, 1800)

      return () => window.clearTimeout(timer)
    },
    [documents, saveRoadmapState]
  )

  const handleOpenFileDialog = () => {
    if (isProcessingOrFetching || documents.length >= 5) return
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
    if (isProcessingOrFetching || documents.length >= 5) return
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processSelectedPdfFile(file)
    }
  }

  const handleDeleteDoc = React.useCallback(
    (docIdToDelete: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setDocuments((prev) => {
        const next = prev.filter((d) => d.id !== docIdToDelete)
        if (next.length === 0) {
          setFlowState("empty")
          setActiveDocId("")
          setSelectedNodeId(null)
          setSelectedResumeNodeId(null)
          saveRoadmapState({
            roadmapFlowState: "empty",
          })
        } else if (activeDocId === docIdToDelete) {
          setActiveDocId(next[0].id)
        }
        return next
      })
    },
    [activeDocId, saveRoadmapState]
  )

  const handleReset = () => {
    setDocuments([])
    setActiveDocId("")
    setFlowState("empty")
    setUploadError(null)
    setSelectedNodeId(null)
    setSelectedResumeNodeId(null)
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
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background p-2.5 font-sans text-text-secondary selection:bg-primary/30 selection:text-text-primary md:p-3">
      {/* Quầng sáng nền nhẹ chuẩn Tokyo Night */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30%] left-[25%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[140px]"
      />

      {/* ==================== KHÔNG GIAN LÀM VIỆC CHÍNH 2 CỘT (MAIN WORKSPACE 100VH) ==================== */}
      <main className="relative z-10 grid h-full min-h-0 w-full flex-1 grid-cols-1 gap-2.5 lg:grid-cols-12 overflow-hidden">
        {/* -------------------- CỘT TRÁI (9/12): KHỐI UNIFIED ROADMAP CONTAINER -------------------- */}
        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm lg:col-span-8 xl:col-span-9">
          {/* 1. Header Hàng Đầu Gộp Toàn Bộ: Brand Logo + Tiêu đề + Search (Ctrl+K) + Tiến Trình + Theme + User */}
          <div className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface px-4">
            {/* Left: Brand Logo + Roadmap Title */}
            <div className="flex items-center gap-3">
              <Link
                href={ROADMAP_LINKS.brand}
                className="group flex shrink-0 items-center transition-opacity hover:opacity-95"
              >
                <BrandLogo size="sm" priority />
              </Link>

              <div className="hidden h-5 w-px bg-border-subtle sm:block" />

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-wider text-text-primary uppercase">
                  Learning Roadmap
                </span>
              </div>
            </div>

            {/* Middle: Compact Search Bar (Ctrl+K) */}
            <div className="hidden max-w-[320px] flex-1 items-center justify-between rounded-md border border-border-subtle bg-surface-secondary px-3 py-1.5 text-xs text-text-muted transition-colors focus-within:border-primary/60 md:flex">
              <div className="flex flex-1 items-center gap-2">
                <Search className="size-3.5 shrink-0 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search concepts, algorithms..."
                  className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
              <kbd className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[9px] text-text-muted">
                Ctrl K
              </kbd>
            </div>

            {/* Right: Progress Indicator + Theme Toggle + User Profile */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex size-8 items-center justify-center">
                  <svg className="size-8 -rotate-90" viewBox="0 0 32 32">
                    <circle
                      cx="16"
                      cy="16"
                      r="13"
                      fill="none"
                      stroke="var(--color-border-subtle)"
                      strokeWidth="2.75"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="13"
                      fill="none"
                      stroke="var(--color-cyan)"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 13}
                      strokeDashoffset={
                        2 * Math.PI * 13 * (1 - completionPercent / 100)
                      }
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute font-mono text-[9px] font-bold text-text-primary tabular-nums">
                    {completionPercent}%
                  </span>
                </div>
                <span className="hidden font-mono text-xs text-text-secondary sm:inline-block">
                  {unlockedCount}/{totalCount}
                </span>
              </div>

              <div className="h-5 w-px bg-border-subtle" />
              {(currentUser?.role === "admin" || currentUser?.role === "tutor") && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#bb9af7]/40 bg-[#bb9af7]/10 px-2.5 py-1 text-xs font-semibold text-[#bb9af7] transition-all hover:bg-[#bb9af7]/20 hover:border-[#bb9af7]/60 shadow-sm"
                  title="Open Admin Console"
                >
                  <Shield className="size-3.5 text-[#bb9af7]" />
                  <span className="hidden md:inline">Admin Console</span>
                </Link>
              )}
              <ThemeToggleButton />
              <UserProfileMenu />
            </div>
          </div>

          {/* 2. Vùng Canvas Đồ Thị Cây Ngang Chấm Bi (Fill hết chiều cao còn lại) */}
          <div className="relative min-h-0 flex-1 overflow-hidden bg-surface-secondary/40 select-none">
            {isGeneratedReady && roadmapData?.nodes ? (
              <RoadmapCanvas
                roadmapNodes={roadmapData.nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(nodeId: string) => setSelectedNodeId(nodeId)}
              />
            ) : (
              /* ARCHITECTURAL CANVAS BACKGROUND (3 LỚP CHIỀU SÂU KỸ THUẬT KHI CHƯA CÓ ROADMAP) */
              <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
                {/* Lớp 1: Dot Matrix Grid với Radial Mask */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(#292e42_1.25px,transparent_1.25px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_50%,#000_40%,transparent_100%)] opacity-80"
                />

                {/* Lớp 2: Ambient Subtle Glow ở tâm sau Card */}
                <div
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 h-[320px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7aa2f7]/[0.04] blur-[100px]"
                />

                {/* Lớp 3: Blueprint DAG Wireframe (Bản vẽ kỹ thuật nhánh cây DAG mảnh, nét đứt sắc nét) */}
                <svg
                  viewBox="0 0 1000 460"
                  className="absolute inset-0 size-full opacity-35"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  {/* DAG Blueprint Edges (stroke #292e42, dashed 4 4, strokeWidth 1.5) */}
                  <g stroke="#292e42" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
                    {/* Root (110, 230) -> Col 1 */}
                    <path d="M 132 230 C 185 230, 215 130, 268 130" />
                    <path d="M 132 230 L 268 230" />
                    <path d="M 132 230 C 185 230, 215 330, 268 330" />

                    {/* Col 1 -> Col 2 */}
                    <path d="M 312 130 L 468 130" />
                    <path d="M 312 230 L 468 230" />
                    <path d="M 312 330 L 468 330" />

                    {/* Col 2 -> Col 3 */}
                    <path d="M 512 130 C 565 130, 595 180, 668 180" />
                    <path d="M 512 230 C 565 230, 595 180, 668 180" />
                    <path d="M 512 230 C 565 230, 595 280, 668 280" />
                    <path d="M 512 330 C 565 330, 595 280, 668 280" />

                    {/* Col 3 -> Col 4 Leaf */}
                    <path d="M 712 180 C 765 180, 795 230, 868 230" />
                    <path d="M 712 280 C 765 280, 795 230, 868 230" />
                  </g>

                  {/* Blueprint Nodes (w-11 h-11 = r: 22, border border-[#292e42]/60, bg-[#1a1b26]/30) */}
                  {[
                    { cx: 110, cy: 230 },
                    { cx: 290, cy: 130 },
                    { cx: 290, cy: 230 },
                    { cx: 290, cy: 330 },
                    { cx: 490, cy: 130 },
                    { cx: 490, cy: 230 },
                    { cx: 490, cy: 330 },
                    { cx: 690, cy: 180 },
                    { cx: 690, cy: 280 },
                    { cx: 890, cy: 230 },
                  ].map((node, i) => (
                    <g key={i}>
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r="22"
                        fill="#1a1b26"
                        fillOpacity="0.3"
                        stroke="#292e42"
                        strokeOpacity="0.6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r="3.5"
                        fill="#3b4261"
                        fillOpacity="0.8"
                      />
                    </g>
                  ))}
                </svg>
              </div>
            )}

            {/* HỘP THÔNG BÁO TRUNG TÂM KHI ĐANG LOAD PROGRESS HOẶC CHƯA CÓ PDF */}
            {!isProgressLoaded && (
              <div className="absolute top-1/2 left-1/2 z-20 w-[90%] max-w-[400px] -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center rounded-xl border border-border-subtle bg-surface p-6 text-center shadow-xl">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-cyan">
                    <Sparkles className="size-5 animate-spin text-cyan" />
                  </div>
                  <div className="mt-4 h-4 w-44 rounded-md bg-border-subtle/80" />
                  <div className="mt-2.5 h-3 w-60 rounded-md bg-border-subtle/50" />
                  <div className="mt-1.5 h-3 w-36 rounded-md bg-border-subtle/30" />
                </div>
              </div>
            )}

            {isProgressLoaded && flowState === "empty" && (
              <div className="absolute top-1/2 left-1/2 z-20 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2">
                {/* Khung Card ngoài cùng: gọn gàng, bo tròn 2xl, backdrop-blur */}
                <div className="w-full rounded-2xl border border-[#292e42] bg-[#16161e]/95 p-3 shadow-[0_24px_64px_rgba(0,0,0,0.65)] backdrop-blur-md">
                  {/* Box bo góc lồng bên trong có viền nét đứt: Vùng Dropzone & Upload trực tiếp */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (!isProcessingOrFetching) setIsDraggingFile(true)
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDropPdf}
                    onClick={handleOpenFileDialog}
                    className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                      isDraggingFile
                        ? "border-[#7aa2f7] bg-[#7aa2f7]/10"
                        : "border-[#3b4261] bg-[#1a1b26]/70 hover:border-[#7aa2f7]/60 hover:bg-[#1a1b26]"
                    }`}
                  >
                    {/* 1. Icon đám mây upload trong khung bo góc nhẹ */}
                    <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-[#7aa2f7]/25 bg-[#7aa2f7]/10 text-[#7aa2f7] shadow-sm">
                      <CloudUpload className="size-5.5 stroke-[1.75]" />
                    </div>

                    {/* 2. Tiêu đề gọn, sắc nét */}
                    <h2 className="mb-1.5 text-base font-bold text-[#c0caf5] tracking-tight">
                      Generate Your Interactive Skill Tree
                    </h2>

                    {/* 3. Mô tả ngắn gọn (2 dòng) */}
                    <p className="mb-5 max-w-xs text-xs leading-relaxed text-[#787c99]">
                      Drag &amp; drop your course syllabus (PDF) here, or click below to extract topics and build your learning path.
                    </p>

                    {/* 4. Nút bấm chính (Primary Button - không bị gãy dòng) */}
                    <button
                      type="button"
                      disabled={isProcessingOrFetching}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenFileDialog()
                      }}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#7aa2f7] hover:bg-[#89b4fa] px-5 py-2 text-xs font-semibold whitespace-nowrap text-[#16161e] shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-50"
                    >
                      <CloudUpload className="size-3.5 stroke-[2]" />
                      <span>Choose Syllabus PDF</span>
                    </button>

                    {/* 5. Nút Load Sample chuyển thành dòng chữ nhỏ ngay bên dưới */}
                    <p className="mt-3.5 text-xs text-[#787c99]">
                      Or try with{" "}
                      <button
                        type="button"
                        disabled={isProcessingOrFetching}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddSample("doc-dsa-syllabus")
                        }}
                        className="cursor-pointer font-mono text-xs text-[#7aa2f7] underline underline-offset-4 transition-colors hover:text-[#89b4fa] disabled:pointer-events-none disabled:opacity-50"
                      >
                        sample CS101_DSA_Syllabus_HCMUS.pdf
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* HỘP LOADING AI KHI BACKEND ĐANG PHÂN TÍCH PDF (LẶP SUBTITLE & MỜ DẦN KHI XONG) */}
            {showLoadingOverlay && (
              <div
                className={`absolute top-1/2 left-1/2 z-30 w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
                  isOverlayFadingOut
                    ? "pointer-events-none opacity-0"
                    : "opacity-100"
                }`}
              >
                <div className="flex flex-col items-center rounded-xl border border-border bg-surface p-6 text-center shadow-xl">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-cyan">
                    <Sparkles className="size-5 animate-spin" />
                  </div>

                  <h2 className="mt-3.5 text-sm font-bold text-text-primary">
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

                  {/* Nhịp sóng trạng thái AI */}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-secondary px-3 py-1 font-mono text-[10px] text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-cyan" />
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span className="size-1.5 rounded-full bg-purple" />
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
                <div className="flex flex-col items-center rounded-xl border border-danger/60 bg-surface p-6 text-center shadow-xl">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-danger/15 text-danger">
                    <AlertTriangle className="size-5" />
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

          {/* 3. Thanh Legend & Thao Tác Dưới Cùng (Unified Bottom Bar) */}
          <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-t border-border-subtle bg-surface px-4 text-xs">
            {/* Legend Pills */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" />
                <span className="text-[11px] text-text-secondary">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-cyan" />
                <span className="text-[11px] text-text-secondary">Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-border" />
                <span className="text-[11px] text-text-secondary">Locked</span>
              </div>
            </div>

            {/* Quick Actions */}
            {isGeneratedReady && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-[11px] font-medium text-text-muted transition-colors hover:text-text-primary"
                >
                  <RotateCcw className="size-3 text-primary" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* -------------------- CỘT PHẢI: UNIFIED RIGHT DOCK PANEL -------------------- */}
        <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#292e42] bg-[#1a1b26] lg:col-span-4 xl:col-span-3 shadow-xl">
          {/* ==================== 1. ĐỈNH PANEL: COMPACT DOCUMENT SWITCHER & TAB BAR ==================== */}
          <div className="shrink-0 border-b border-[#292e42] bg-[#16161e]/70 p-3.5">
            {/* Active Syllabus Bar */}
            <div className="flex items-center justify-between gap-2.5">
              <div
                onClick={() => setRightSidebarTab((prev) => (prev === "rag" ? "progress" : "rag"))}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                title="Click to toggle between Learning Progress and RAG Sources"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#7aa2f7]/15 text-[#7aa2f7] border border-[#7aa2f7]/30 group-hover:scale-105 transition-transform">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-xs font-bold text-white group-hover:text-[#7aa2f7] transition-colors">
                    {activeDocument?.name || simulatedFileMeta.fileName}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-[#565f89]">
                    <span>{activeDocument?.size || simulatedFileMeta.fileSize}</span>
                    <span>•</span>
                    <span className="text-[#7aa2f7]">
                      {activeDocument?.chunks || 48} chunks
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#24283b] text-[#bb9af7] border border-[#bb9af7]/30">
                  {dedupedDocuments.length}/5 Docs
                </span>
                <button
                  type="button"
                  onClick={() => setRightSidebarTab((prev) => (prev === "rag" ? "progress" : "rag"))}
                  className={`size-7 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                    rightSidebarTab === "rag"
                      ? "border-[#7aa2f7] bg-[#7aa2f7]/20 text-[#7aa2f7]"
                      : "border-[#292e42] bg-[#16161e] text-[#565f89] hover:text-[#c0caf5] hover:border-[#3b4261]"
                  }`}
                  title={rightSidebarTab === "rag" ? "Back to Learning Progress" : "Switch / Upload PDF"}
                >
                  <CloudUpload className="size-3.5" />
                </button>
              </div>
            </div>

            {/* 2 Segmented Tabs */}
            <div className="mt-3 grid grid-cols-2 rounded-lg border border-[#292e42] bg-[#16161e] p-1 gap-1">
              <button
                type="button"
                onClick={() => setRightSidebarTab("progress")}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  rightSidebarTab === "progress"
                    ? "bg-[#7aa2f7] text-[#16161e] shadow-sm"
                    : "text-[#565f89] hover:text-[#c0caf5]"
                }`}
              >
                <BarChart2 className="size-3.5" />
                <span>Learning Progress</span>
              </button>

              <button
                type="button"
                onClick={() => setRightSidebarTab("rag")}
                className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  rightSidebarTab === "rag"
                    ? "bg-[#bb9af7] text-[#16161e] shadow-sm"
                    : "text-[#565f89] hover:text-[#c0caf5]"
                }`}
              >
                <Database className="size-3.5" />
                <span>RAG Sources ({dedupedDocuments.length}/5)</span>
              </button>
            </div>
          </div>

          {/* ==================== 2. NỘI DUNG TAB 1: LEARNING PROGRESS ==================== */}
          {rightSidebarTab === "progress" && (
            <div className="flex flex-1 flex-col min-h-0 px-4 py-3 overflow-hidden">
              {/* Khối tiến độ tổng */}
              <div className="shrink-0 mb-3 rounded-xl border border-[#292e42] bg-[#16161e]/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#565f89] uppercase tracking-wider">
                    Tree Mastery
                  </span>
                  <span className="font-mono text-base font-extrabold text-[#7aa2f7] tabular-nums">
                    {completionPercent}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#16161e] border border-[#292e42]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#60a5fa] to-[#7aa2f7] transition-all duration-500 shadow-[0_0_8px_rgba(122,162,247,0.4)]"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#565f89]">
                  <span>Progress Overview</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {unlockedCount}/{totalCount} Nodes Unlocked
                  </span>
                </div>
              </div>

              {/* Bộ lọc danh sách Node: In Progress | Completed | All */}
              <div className="shrink-0 mb-2.5 flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#565f89]">
                  Select Node To Resume
                </span>
                <div className="flex items-center gap-1 bg-[#16161e] p-0.5 rounded-lg border border-[#292e42]">
                  <button
                    type="button"
                    onClick={() => setNodeFilter("in_progress")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono transition-colors cursor-pointer ${
                      nodeFilter === "in_progress"
                        ? "bg-[#7aa2f7] text-[#16161e]"
                        : "text-[#565f89] hover:text-[#c0caf5]"
                    }`}
                  >
                    Active ({inProgressNodes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNodeFilter("completed")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono transition-colors cursor-pointer ${
                      nodeFilter === "completed"
                        ? "bg-emerald-500 text-[#16161e]"
                        : "text-[#565f89] hover:text-[#c0caf5]"
                    }`}
                  >
                    Done ({completedNodes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNodeFilter("all")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono transition-colors cursor-pointer ${
                      nodeFilter === "all"
                        ? "bg-[#bb9af7] text-[#16161e]"
                        : "text-[#565f89] hover:text-[#c0caf5]"
                    }`}
                  >
                    All ({mergedActiveNodes.length})
                  </button>
                </div>
              </div>

              {/* Danh sách thẻ Node cuộn thoải mái, không bị đè */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-description-scrollbar">
                {displayedNodes.length > 0 ? (
                  displayedNodes.map((node: any) => {
                    const isSelected = node.id === selectedResumeNodeId
                    const isCompleted = node.status === "completed"
                    const isCurrent = node.status === "current"

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          setSelectedResumeNodeId(node.id)
                          setSelectedNodeId(node.id)
                        }}
                        className={`group flex items-center justify-between rounded-xl p-3 transition-all cursor-pointer border ${
                          isSelected
                            ? "border-[#7aa2f7] bg-[#24283b] shadow-md ring-1 ring-[#7aa2f7]/50"
                            : isCompleted
                            ? "border-emerald-500/20 bg-[#16161e]/80 hover:border-emerald-500/40 hover:bg-[#1a1b26]"
                            : isCurrent
                            ? "border-[#60a5fa]/30 bg-[#16161e]/80 hover:border-[#60a5fa]/60 hover:bg-[#1a1b26]"
                            : "border-[#292e42] bg-[#16161e]/40 hover:border-[#3b4261] opacity-75"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {/* Node shortCode badge */}
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-extrabold ${
                              isCompleted
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : isCurrent
                                ? "bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/40"
                                : "bg-[#24283b] text-[#565f89] border border-[#292e42]"
                            }`}
                          >
                            {node.shortCode || "01"}
                          </div>

                          <div className="min-w-0">
                            <h4
                              className={`text-xs font-bold leading-snug line-clamp-1 ${
                                isSelected
                                  ? "text-white"
                                  : isCompleted
                                  ? "text-[#c0caf5]"
                                  : isCurrent
                                  ? "text-white"
                                  : "text-[#565f89]"
                              }`}
                              title={node.label}
                            >
                              {node.label}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-[10.5px] font-mono">
                              <span
                                className={
                                  isCompleted
                                    ? "text-emerald-400 font-semibold"
                                    : isCurrent
                                    ? "text-[#60a5fa] font-semibold"
                                    : "text-[#565f89]"
                                }
                              >
                                {node.target_complexity || node.complexity || "O(1)"}
                              </span>
                              <span className="text-[#565f89]">•</span>
                              <span className="text-[#565f89]">
                                {node.completedTasks}/{node.totalTasks || 3} Tasks
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Icon Indicator */}
                        <div className="ml-2 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="size-4 text-emerald-400" />
                          ) : isCurrent ? (
                            isSelected ? (
                              <div className="flex size-4 items-center justify-center rounded-full bg-[#7aa2f7] text-[#16161e]">
                                <Check className="size-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="size-4 rounded-full border-2 border-[#60a5fa] animate-pulse" />
                            )
                          ) : (
                            <Lock className="size-3.5 text-[#565f89]" />
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[#565f89]">
                    <p>No nodes match current filter.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. NỘI DUNG TAB 2: RAG DOCUMENTS ==================== */}
          {rightSidebarTab === "rag" && (
            <div className="flex flex-1 flex-col min-h-0 px-4 py-3 overflow-hidden">
              {/* Dropzone Upload Box */}
              <div className="shrink-0 mb-3">
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
                    if (!isProcessingOrFetching && dedupedDocuments.length < 5) setIsDraggingFile(true)
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleDropPdf}
                  onClick={() => {
                    if (dedupedDocuments.length < 5) handleOpenFileDialog()
                  }}
                  className={`rounded-xl border-2 border-dashed p-3 transition-all flex flex-col items-center text-center cursor-pointer ${
                    dedupedDocuments.length >= 5
                      ? "border-[#3b4261] bg-[#16161e]/40 opacity-60 cursor-not-allowed"
                      : isDraggingFile
                      ? "border-[#bb9af7] bg-[#bb9af7]/10"
                      : "border-[#3b4261] hover:border-[#bb9af7]/70 bg-[#16161e]/70"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#bb9af7]/15 border border-[#bb9af7]/30 text-[#bb9af7] flex items-center justify-center mb-1.5">
                    <CloudUpload className="size-4.5 stroke-[1.75]" />
                  </div>

                  <p className="text-xs font-bold text-white mb-0.5">
                    Drop syllabus or lecture PDF here
                  </p>
                  <p className="text-[10.5px] text-[#565f89] mb-2.5">
                    Max 10MB • Up to 5 documents
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessingOrFetching || dedupedDocuments.length >= 5}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenFileDialog()
                      }}
                      className="px-3 py-1.5 rounded-md bg-[#bb9af7] hover:bg-[#bb9af7]/90 text-[#16161e] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="size-3.5 stroke-[2]" />
                      <span>Choose PDF</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingOrFetching || dedupedDocuments.length >= 5}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddSample()
                      }}
                      className="px-2.5 py-1.5 rounded-md bg-[#24283b] hover:bg-[#292e42] text-[#c0caf5] border border-[#3b4261] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <Plus className="size-3" />
                      <span>+ Add Sample</span>
                    </button>
                  </div>

                  {uploadError && (
                    <p className="mt-1.5 text-[10.5px] font-semibold text-red-400">
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>

              {/* Section Header */}
              <div className="shrink-0 mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#565f89]">
                  Indexed Knowledge Documents
                </span>
                <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {dedupedDocuments.length} Indexed
                </span>
              </div>

              {/* Danh sách PDF thoáng đãng, không bị cắt chữ */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 custom-description-scrollbar">
                {dedupedDocuments.map((doc) => {
                  const isDocOop =
                    String(doc.id).includes("oop") ||
                    String(doc.id).includes("0002") ||
                    String(doc.name).toLowerCase().includes("oop")
                  const isActive = doc.id === activeDocId || isDocOop === isOopActive
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setActiveDocId(doc.id)
                        setSelectedNodeId(null)
                      }}
                      className={`group rounded-xl p-3 transition-all cursor-pointer border ${
                        isActive
                          ? "bg-[#24283b] border-[#7aa2f7] ring-1 ring-[#7aa2f7]/50 shadow-md"
                          : "bg-[#16161e]/70 border-[#292e42] hover:border-[#3b4261] hover:bg-[#1a1b26]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                              isActive
                                ? "bg-[#7aa2f7]/25 text-[#7aa2f7] border border-[#7aa2f7]/40"
                                : "bg-[#24283b] text-[#565f89] border border-[#292e42]"
                            }`}
                          >
                            <FileText className="size-4.5" />
                          </div>

                          <div className="min-w-0">
                            <span
                              className={`block text-xs font-bold leading-tight line-clamp-1 ${
                                isActive ? "text-white" : "text-[#c0caf5]"
                              }`}
                              title={doc.name}
                            >
                              {doc.name}
                            </span>

                            <div className="mt-1 flex items-center gap-2 text-[10.5px] font-mono text-[#565f89]">
                              <span>{doc.size || "2.4 MB"}</span>
                              <span>•</span>
                              <span className={isActive ? "text-[#7aa2f7] font-semibold" : "text-[#565f89]"}>
                                {doc.chunks || 48} chunks
                              </span>
                              {isActive && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-bold uppercase text-[9.5px]">
                                    ACTIVE
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteDoc(doc.id, e)}
                          title="Remove this PDF"
                          className="cursor-pointer rounded-md p-1.5 text-[#565f89] hover:bg-red-500/15 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ==================== 4. CHÂN PANEL CỐ ĐỊNH ==================== */}
          <div className="shrink-0 p-3.5 border-t border-[#292e42] bg-[#16161e]/90">
            {isGeneratedReady && targetResumeNode ? (
              <Link
                href={getWorkspaceRouteForNode(targetResumeNode)}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#7aa2f7] hover:bg-[#89b4fa] px-3 text-xs font-bold text-[#16161e] shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="truncate">
                  Resume: {targetResumeNode.shortCode ? `${targetResumeNode.shortCode} ` : ""}{targetResumeNode.label}
                </span>
                <ArrowRight className="size-4 stroke-[2.2] shrink-0" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#24283b] px-3 text-xs font-semibold text-[#565f89] opacity-40 cursor-not-allowed shadow-none"
              >
                <span>Resume Workspace</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </aside>
      </main>

      {/* ==================== POP-UP MODAL CĂN GIỮA MÀN HÌNH ==================== */}
      {isGeneratedReady && popupNode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={() => setSelectedNodeId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-node-title"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-[540px] overflow-hidden rounded-xl border bg-surface shadow-2xl ${
              popupNode.status === "locked"
                ? "border-border"
                : "border-primary/50"
            }`}
          >
            {/* 1. Header Pop-up: Huy hiệu Node + Tên chủ đề + Badge trạng thái + Nút X */}
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle bg-surface px-5 py-3.5">
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
                    {(popupNode.target_complexity || popupNode.complexity) && (
                      <span className="rounded-md border border-border-subtle bg-surface-secondary px-2 py-0.5 font-mono text-[10px] text-cyan">
                        {popupNode.target_complexity || popupNode.complexity}
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
