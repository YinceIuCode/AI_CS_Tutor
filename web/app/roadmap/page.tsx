"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  ChevronDown,
  CloudUpload,
  Database,
  FileCode2,
  FileText,
  Lock,
  Map,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"

/**
 * Cấu hình đường dẫn điều hướng (href) trên trang Roadmap.
 * Có thể thay đổi giá trị workspace để điều hướng nút "→ Enter Workspace" trong Pop-up sang trang học/code tương ứng.
 */
export const ROADMAP_LINKS = {
  brand: "/landing",
  profile: "/auth",
  workspace: "/workspace",
  codeSandbox: "/sandbox",
  theoryQuiz: "/quiz",
} as const

type FlowState = "empty" | "loading" | "ready"
type NodeStatus = "completed" | "current" | "locked"

interface RoadmapNode {
  id: number
  slotLabel: string
  shortCode: string
  title: string
  status: NodeStatus
  complexity: string
  /** 3 nhiệm vụ (Tasks) hiển thị bên trong Pop-up Screen khi ấn vào Node */
  tasks: [string, string, string]
  /** Tọa độ ở trạng thái Empty (khung chữ nhật 6 Topic như ảnh mẫu) */
  emptyPos: { x: number; y: number }
  /** Tọa độ ở trạng thái Ready (Cây lộ trình phân tầng chuẩn đồ thị) */
  treePos: { x: number; y: number }
}

/**
 * Hàm tính toán tọa độ 2 đầu mút của đoạn thẳng nối tâm 2 đường tròn.
 * Đảm bảo đường nối luôn thẳng tắp đi qua 2 tâm và vuông góc 90° với tiếp tuyến của cả 2 đường tròn tại điểm tiếp xúc.
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

const ROADMAP_NODES: RoadmapNode[] = [
  {
    id: 1,
    slotLabel: "Topic 1",
    shortCode: "01",
    title: "Arrays & Big-O",
    status: "completed",
    complexity: "O(1) / O(N)",
    tasks: [
      "Core Theory & Big-O Complexity",
      "Quiz: Asymptotic Growth Analysis",
      "Code: Dynamic Array & Two Pointers",
    ],
    emptyPos: { x: 120, y: 72 },
    treePos: { x: 450, y: 62 },
  },
  {
    id: 2,
    slotLabel: "Topic 2",
    shortCode: "02",
    title: "Linked Lists",
    status: "completed",
    complexity: "O(N)",
    tasks: [
      "Core Theory & Big-O Complexity",
      "Quiz: Pointer Reference Tracing",
      "Code: Reverse & Cycle Detection",
    ],
    emptyPos: { x: 450, y: 72 },
    treePos: { x: 265, y: 185 },
  },
  {
    id: 3,
    slotLabel: "Topic 3",
    shortCode: "03",
    title: "Binary Search Tree",
    status: "current",
    complexity: "O(log N)",
    tasks: [
      "Core Theory & Big-O Complexity",
      "Quiz: BST Invariant & Traversal",
      "Code: Node Insertion & Search",
    ],
    emptyPos: { x: 780, y: 72 },
    treePos: { x: 635, y: 185 },
  },
  {
    id: 4,
    slotLabel: "Topic 4",
    shortCode: "04",
    title: "Hash Tables",
    status: "locked",
    complexity: "O(1) average",
    tasks: [
      "Core Theory & Big-O Complexity",
      "Quiz: Collision Resolution Check",
      "Code: Chaining & Linear Probing",
    ],
    emptyPos: { x: 120, y: 342 },
    treePos: { x: 155, y: 325 },
  },
  {
    id: 5,
    slotLabel: "Topic 5",
    shortCode: "05",
    title: "AVL Tree",
    status: "locked",
    complexity: "O(log N)",
    tasks: [
      "Core Theory & Big-O Complexity",
      "Quiz: Balance Factor Check",
      "Code: Left & Right Rotations",
    ],
    emptyPos: { x: 450, y: 342 },
    treePos: { x: 450, y: 325 },
  },
  {
    id: 6,
    slotLabel: "Topic 6",
    shortCode: "06",
    title: "Graphs & DP",
    status: "locked",
    complexity: "O(V + E)",
    tasks: [
      "Core Theory & Big-O Complexity",
      "Quiz: Shortest Path & State Transition",
      "Code: BFS, Dijkstra & Memoization",
    ],
    emptyPos: { x: 780, y: 342 },
    treePos: { x: 745, y: 325 },
  },
]

/** Các cạnh nối ở trạng thái Empty (Khung chữ nhật 6 Topic đúng theo ảnh mẫu) */
const EMPTY_EDGES: Array<{ from: number; to: number }> = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 1, to: 4 },
  { from: 3, to: 6 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
]

/** Các cạnh nối cây phân cấp ở trạng thái Ready (Cây nhị phân / DAG lộ trình học) */
const TREE_EDGES: Array<{
  from: number
  to: number
  state: "completed" | "active" | "locked"
}> = [
  { from: 1, to: 2, state: "completed" },
  { from: 1, to: 3, state: "active" },
  { from: 2, to: 4, state: "locked" },
  { from: 2, to: 5, state: "locked" },
  { from: 3, to: 5, state: "locked" },
  { from: 3, to: 6, state: "locked" },
]

const LOADING_STEPS = [
  "Parsing PDF layout & course syllabus sections...",
  "Extracting DSA topics & prerequisite dependencies...",
  "Indexing 48 vector chunks into Active Knowledge Base (RAG)...",
] as const

export default function RoadmapPage() {
  const [flowState, setFlowState] = React.useState<FlowState>("empty")
  const [progress, setProgress] = React.useState(0)
  const [loadingStepIndex, setLoadingStepIndex] = React.useState(0)
  const [uploadedFile, setUploadedFile] = React.useState<{
    name: string
    size: string
    chunks: number
  } | null>(null)

  // Node đang mở Pop-up Screen (null = đóng Pop-up)
  const [popupNode, setPopupNode] = React.useState<RoadmapNode | null>(null)

  const triggerSimulation = React.useCallback(
    (fileName = "CS101_DSA_Syllabus_HCMUS.pdf", fileSize = "2.4 MB") => {
      setFlowState("loading")
      setProgress(0)
      setLoadingStepIndex(0)
      setPopupNode(null)

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
          setUploadedFile({
            name: fileName,
            size: fileSize,
            chunks: 48,
          })
          setFlowState("ready")
        }
      }, 45)
    },
    []
  )

  const handleReset = () => {
    setFlowState("empty")
    setProgress(0)
    setUploadedFile(null)
    setPopupNode(null)
  }

  const completionPercent = flowState === "ready" ? 33 : 0
  const unlockedCount = flowState === "ready" ? 3 : 0
  const totalCount = flowState === "ready" ? ROADMAP_NODES.length : 0

  return (
    <div className="relative flex min-h-svh flex-col justify-between overflow-hidden bg-[#15161E] px-5 py-4 font-sans text-[#A9B1D6] selection:bg-[#7AA2F7]/30 selection:text-[#C0CAF5] md:px-8 md:py-5">
      {/* Quầng sáng nền nhẹ chuẩn Tokyo Night */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30%] left-[25%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7AA2F7]/8 blur-[140px]"
      />

      {/* ==================== THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP NAVBAR) ==================== */}
      <header className="relative z-10 mx-auto w-full max-w-[1440px]">
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-[#292E42] bg-[#1A1B26]/95 px-5 py-3 shadow-lg backdrop-blur-md">
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
            <Link
              href={ROADMAP_LINKS.profile}
              className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-[#292E42]/40"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#3DB5E6] text-xs font-bold text-[#15161E]">
                D
              </span>
              <span className="hidden text-xs font-medium text-[#C0CAF5] sm:inline">
                Duc Vinh Hoang
              </span>
              <ChevronDown className="size-3.5 text-[#A9B1D6]" />
            </Link>
          </div>
        </nav>
      </header>

      {/* ==================== KHÔNG GIAN LÀM VIỆC CHÍNH 2 CỘT (MAIN WORKSPACE) ==================== */}
      <main className="relative z-10 mx-auto my-4 grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
        {/* -------------------- CỘT TRÁI (8/12): KHUNG CHỨA ROADMAP TREE -------------------- */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#292E42] bg-[#15161E]/90 p-5 shadow-xl lg:col-span-8 xl:col-span-9">
          {/* 1. Thanh Banner Thông Tin Roadmap */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#292E42] bg-[#1A1B26] px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#7AA2F7]/35 bg-[#7AA2F7]/12 text-[#7DCFFF]">
                <Map className="size-6" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wide text-[#C0CAF5] uppercase sm:text-base">
                  DATA STRUCTURES &amp; ALGORITHMS ROADMAP
                </h1>
                <p className="mt-0.5 text-xs text-[#A9B1D6]">
                  {flowState === "ready" && uploadedFile
                    ? `Generated from ${uploadedFile.name} • Click any node (e.g. AVL Tree) to open its task pop-up.`
                    : "Upload your course syllabus (PDF) to generate your skill tree."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex size-12 items-center justify-center">
                <svg className="size-12 -rotate-90" viewBox="0 0 44 44">
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

          {/* 2. Canvas Đồ Thị Cây (Sử dụng chung 1 hệ tọa độ SVG với getCircleEdge để mọi đường nối luôn thẳng & vuông góc 90° với tiếp tuyến) */}
          <div className="relative my-3 flex min-h-[420px] flex-1 flex-col items-center justify-center select-none">
            <svg
              viewBox="0 0 900 415"
              className="h-full max-h-[425px] w-full"
              preserveAspectRatio="xMidYMid meet"
              aria-label="DSA Skill Tree Graph"
            >
              {/* -------- CÁC ĐƯỜNG THẲNG NỐI TÂM (VUÔNG GÓC TIẾP TUYẾN 2 ĐƯỜNG TRÒN) -------- */}
              {flowState !== "ready"
                ? EMPTY_EDGES.map((edge) => {
                    const n1 = ROADMAP_NODES.find((n) => n.id === edge.from)!
                    const n2 = ROADMAP_NODES.find((n) => n.id === edge.to)!
                    const isVertical = n1.emptyPos.x === n2.emptyPos.x
                    const startOffset = isVertical
                      ? NODE_RADIUS + 26
                      : NODE_RADIUS
                    const pts = getCircleEdge(
                      n1.emptyPos.x,
                      n1.emptyPos.y,
                      startOffset,
                      n2.emptyPos.x,
                      n2.emptyPos.y,
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
                          flowState === "loading" ? "#7AA2F7" : "#3B4261"
                        }
                        strokeOpacity={flowState === "loading" ? 0.5 : 0.85}
                        strokeWidth="1.75"
                        strokeDasharray="5 5"
                      />
                    )
                  })
                : TREE_EDGES.map((edge) => {
                    const n1 = ROADMAP_NODES.find((n) => n.id === edge.from)!
                    const n2 = ROADMAP_NODES.find((n) => n.id === edge.to)!
                    const pts = getCircleEdge(
                      n1.treePos.x,
                      n1.treePos.y,
                      NODE_RADIUS,
                      n2.treePos.x,
                      n2.treePos.y,
                      NODE_RADIUS
                    )
                    const strokeColor =
                      edge.state === "completed"
                        ? "#9ECE6A"
                        : edge.state === "active"
                          ? "#3DB5E6"
                          : "#3B4261"

                    return (
                      <line
                        key={`${edge.from}-${edge.to}`}
                        x1={pts.x1}
                        y1={pts.y1}
                        x2={pts.x2}
                        y2={pts.y2}
                        stroke={strokeColor}
                        strokeWidth={edge.state === "locked" ? "1.75" : "2.25"}
                        strokeDasharray={
                          edge.state === "locked" ? "5 5" : undefined
                        }
                        strokeLinecap="round"
                      />
                    )
                  })}

              {/* -------- CÁC ĐỈNH ĐƯỜNG TRÒN (NODES) -------- */}
              {ROADMAP_NODES.map((node) => {
                const pos =
                  flowState === "ready" ? node.treePos : node.emptyPos
                const isSelected =
                  flowState === "ready" && popupNode?.id === node.id

                if (flowState !== "ready") {
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                    >
                      <circle
                        r={NODE_RADIUS}
                        fill="#15161E"
                        stroke={
                          flowState === "loading" ? "#7AA2F7" : "#3B4261"
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
                        {node.slotLabel}
                      </text>
                    </g>
                  )
                }

                const borderColor =
                  node.status === "completed"
                    ? "#9ECE6A"
                    : node.status === "current"
                      ? "#3DB5E6"
                      : "#414868"

                const textColor =
                  node.status === "completed"
                    ? "#9ECE6A"
                    : node.status === "current"
                      ? "#7DCFFF"
                      : "#565F89"

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setPopupNode(node)}
                    className="cursor-pointer"
                  >
                    {/* Vòng chọn khi đang mở Pop-up của Node */}
                    {isSelected && (
                      <circle
                        r={NODE_RADIUS + 6}
                        fill="none"
                        stroke="#7AA2F7"
                        strokeOpacity="0.55"
                        strokeWidth="3"
                      />
                    )}

                    {/* Đường tròn chính của Node */}
                    <circle
                      r={NODE_RADIUS}
                      fill="#1A1B26"
                      stroke={borderColor}
                      strokeWidth="2.5"
                    />

                    {/* Biểu tượng trong tâm đường tròn */}
                    {node.status === "completed" && (
                      <path
                        d="M -7 0 L -2 5 L 8 -5"
                        fill="none"
                        stroke="#9ECE6A"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {node.status === "current" && (
                      <text
                        y="5"
                        textAnchor="middle"
                        fill="#7DCFFF"
                        fontSize="14"
                        fontWeight="800"
                        className="font-mono"
                      >
                        {node.shortCode}
                      </text>
                    )}
                    {node.status === "locked" && (
                      <g
                        transform="translate(-6, -7)"
                        stroke="#565F89"
                        strokeWidth="1.6"
                        fill="none"
                      >
                        <rect x="1" y="6" width="10" height="8" rx="1.5" />
                        <path d="M 3.5 6 V 4a2.5 2.5 0 0 1 5 0v2" />
                      </g>
                    )}

                    {/* Nhãn tên chủ đề bên dưới đường tròn */}
                    <text
                      y={NODE_RADIUS + 20}
                      textAnchor="middle"
                      fill={
                        node.status === "locked" ? "#A9B1D6" : "#C0CAF5"
                      }
                      fontSize="13"
                      fontWeight="700"
                    >
                      {node.title}
                    </text>
                    <text
                      y={NODE_RADIUS + 36}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="11"
                      className="font-mono"
                    >
                      {node.complexity}
                    </text>
                  </g>
                )
              })}
            </svg>

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

            {/* HỘP THANH LOADING KHI BACKEND ĐANG XỬ LÝ (LOADING) */}
            {flowState === "loading" && (
              <div className="absolute top-1/2 left-1/2 z-20 w-[90%] max-w-[410px] -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center rounded-2xl border border-[#7AA2F7]/50 bg-[#1A1B26]/98 px-7 py-7 text-center shadow-[0_0_40px_rgba(122,162,247,0.2)]">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#7AA2F7]/16 text-[#7DCFFF]">
                    <Sparkles className="size-5 animate-spin" />
                  </div>
                  <h2 className="mt-3.5 text-sm font-bold text-[#C0CAF5]">
                    Generating Your DSA Skill Tree...
                  </h2>
                  <p className="mt-1 font-mono text-[11px] text-[#7DCFFF]">
                    {LOADING_STEPS[loadingStepIndex]}
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

            {/* ==================== POP-UP SCREEN KHI ẤN VÀO NODE (ĐÚNG THEO ẢNH MẪU) ==================== */}
            {flowState === "ready" && popupNode && (
              <div
                className="absolute inset-0 z-30 flex items-center justify-center bg-[#15161E]/55 backdrop-blur-[2px]"
                onClick={() => setPopupNode(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="popup-node-title"
                  onClick={(e) => e.stopPropagation()}
                  className="w-[92%] max-w-[360px] rounded-2xl border border-[#7AA2F7]/65 bg-[#1A1B26] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
                >
                  {/* Tiêu đề Node + Nút đóng X */}
                  <div className="flex items-center justify-between border-b border-[#292E42] pb-3.5">
                    <h2
                      id="popup-node-title"
                      className="text-lg font-bold text-[#C0CAF5]"
                    >
                      {popupNode.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setPopupNode(null)}
                      aria-label="Close pop-up"
                      className="cursor-pointer rounded-md p-1 text-sm font-medium text-[#565F89] transition-colors hover:text-[#C0CAF5]"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Danh sách 3 Task đánh số 1, 2, 3 trong vòng tròn xanh #7AA2F7 */}
                  <ol className="mt-5 space-y-3.5">
                    {popupNode.tasks.map((task, idx) => (
                      <li key={task} className="flex items-center gap-3.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#7AA2F7] text-xs font-bold text-[#15161E]">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-[#A9B1D6]">
                          {task}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {/* Nút chính: → Enter Workspace */}
                  <Link
                    href={`${ROADMAP_LINKS.workspace}?topic=${encodeURIComponent(
                      popupNode.title
                    )}`}
                    className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7AA2F7] text-sm font-bold text-[#15161E] transition-colors hover:bg-[#8DB0FF]"
                  >
                    <ArrowRight className="size-4 stroke-[2.5]" />
                    <span>Enter Workspace</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 3. Chú Thích Trạng Thái (Bottom Legend Pill) + Thanh gợi ý mở Pop-up */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-5 rounded-full border border-[#292E42] bg-[#1A1B26] px-5 py-2 text-xs">
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

            {flowState === "ready" && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPopupNode(ROADMAP_NODES[4])}
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

        {/* -------------------- CỘT PHẢI (4/12): UPLOAD PANEL & ACTIVE KNOWLEDGE BASE -------------------- */}
        <aside className="flex flex-col gap-5 lg:col-span-4 xl:col-span-3">
          {/* KHUNG TRÊN: Upload your study material (PDF/Syllabus) */}
          <div className="rounded-2xl border border-[#292E42] bg-[#15161E]/90 p-4 shadow-xl">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#414868] bg-[#1A1B26]/60 px-6 py-9 text-center transition-colors hover:border-[#7AA2F7]/60">
              <CloudUpload className="size-12 stroke-[1.75] text-[#3DB5E6]" />

              <p className="mt-4 text-xs font-medium text-[#C0CAF5]">
                Upload your study material (PDF/Syllabus)
              </p>

              <button
                type="button"
                disabled={flowState === "loading"}
                onClick={() =>
                  triggerSimulation("CS101_DSA_Syllabus_HCMUS.pdf", "2.4 MB")
                }
                className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#7AA2F7] px-6 text-xs font-bold text-[#15161E] shadow-[0_0_20px_rgba(122,162,247,0.25)] transition-all hover:bg-[#8DB0FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="size-4 stroke-[2.2]" />
                <span>
                  {flowState === "loading" ? "Processing PDF..." : "Choose File"}
                </span>
              </button>

              <p className="mt-3.5 text-[11px] text-[#565F89]">
                Supported format: PDF (Max 10MB)
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
              {flowState === "ready" && (
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

              {flowState === "loading" && (
                <div className="rounded-xl border border-[#7AA2F7]/40 bg-[#1A1B26] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#7AA2F7]/15 text-[#7DCFFF]">
                      <FileText className="size-5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-[#C0CAF5]">
                        CS101_DSA_Syllabus_HCMUS.pdf
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#7DCFFF]">
                        Chunking &amp; embedding PDF ({progress}%)...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {flowState === "ready" && uploadedFile && (
                <div className="rounded-xl border border-[#7AA2F7]/40 bg-[#1A1B26] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#7AA2F7]/16 text-[#7DCFFF]">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="truncate text-xs font-bold text-[#C0CAF5]"
                          title={uploadedFile.name}
                        >
                          {uploadedFile.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#565F89]">
                          <span>{uploadedFile.size}</span>
                          <span>•</span>
                          <span className="text-[#7AA2F7]">
                            {uploadedFile.chunks} chunks
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
                    <span>1 Document Indexed</span>
                    <span className="font-mono text-[#9ECE6A]">
                      RAG Citations Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
