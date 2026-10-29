"use client"

import * as React from "react"
import Link from "next/link"
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileText,
  Lightbulb,
  Lock,
  MessageSquare,
  Play,
  Search,
  Send,
  Settings,
  Sparkles,
  Square,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Cấu hình các đường dẫn điều hướng (href) trong trang Workspace.
 */
export const WORKSPACE_LINKS = {
  brand: "/landing",
  backToSkillTree: "/roadmap",
  profile: "/auth",
} as const

/**
 * 3 trạng thái hiển thị chính ở khu vực trung tâm (được điều khiển bởi thanh điều hướng bên trái):
 * - "theory": Task 1 - Core Theory & Big-O (Mặc định mở đầu tiên khi vào trang)
 * - "quiz"  : Task 2 - Quiz: Balance Factor (Mặc định chưa chọn đáp án nào)
 * - "code"  : Task 3 - Code: Right Rotation (Hiển thị trọn vẹn Editor + Code Analysis + Visualization trên 1 màn hình)
 */
export type WorkspaceMode = "theory" | "quiz" | "code"

const INITIAL_CPP_CODE = `#include <iostream>
using namespace std;

struct Node {
    int key, height;
    Node *left, *right;
    Node(int k) : key(k), height(1), left(nullptr), right(nullptr) {}
};

int height(Node* n) {
    return n ? n->height : 0;
}

int getBalance(Node* n) {
    return n ? height(n->left) - height(n->right) : 0;
}

Node* rotateRight(Node* y) {
    Node* x = y->left;
    Node* T2 = x->right;

    x->right = y;
    y->left = T2;

    y->height = max(height(y->left), height(y->right)) + 1;
    x->height = max(height(x->left), height(x->right)) + 1;

    return x;
}`

const QUIZ_OPTIONS = [
  {
    id: "A",
    text: "Balance Factor = +2 (Requires Right Rotation)",
    isCorrect: true,
  },
  {
    id: "B",
    text: "Balance Factor = +2 (Requires Left Rotation)",
    isCorrect: false,
  },
  {
    id: "C",
    text: "Balance Factor = -2 (Requires Right Rotation)",
    isCorrect: false,
  },
  {
    id: "D",
    text: "Balance Factor = +1 (Tree is already balanced)",
    isCorrect: false,
  },
] as const

const THEORY_CARDS = [
  {
    badge: "01",
    title: "AVL Balance Factor Invariant",
    detail:
      "Balance Factor (BF) = Height(Left Subtree) - Height(Right Subtree). Every node in an AVL tree must strictly satisfy BF ∈ {-1, 0, +1}.",
    tag: "Invariant",
  },
  {
    badge: "02",
    title: "Left-Heavy Imbalance (BF = +2 → Right Rotation)",
    detail:
      "When inserting into the left-left (LL) subtree causes BF = +2, a single Right Rotation around the unbalanced root restores height balance in O(1) time.",
    tag: "LL Rotation",
  },
  {
    badge: "03",
    title: "Right-Heavy Imbalance (BF = -2 → Left Rotation)",
    detail:
      "When inserting into the right-right (RR) subtree causes BF = -2, a single Left Rotation pulls the right child up as the new subtree root.",
    tag: "RR Rotation",
  },
  {
    badge: "04",
    title: "Guaranteed O(log N) Worst-Case Complexity",
    detail:
      "By bounding tree height to ~1.44 log2(N), AVL trees prevent degenerate O(N) skewed chains on sorted inputs for Search, Insert, and Delete.",
    tag: "Big-O Guaranteed",
  },
] as const

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
  monaco.editor.defineTheme("tokyo-night", {
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
      "editor.background": "#15161E",
      "editor.foreground": "#C0CAF5",
      "editor.lineHighlightBackground": "#28345766",
      "editor.selectionBackground": "#7AA2F740",
      "editorLineNumber.foreground": "#545C7E",
      "editorLineNumber.activeForeground": "#C0CAF5",
      "editorCursor.foreground": "#7DCFFF",
      "editorGutter.background": "#15161E",
      "scrollbarSlider.background": "#292E4280",
      "scrollbarSlider.hoverBackground": "#414868B3",
      "scrollbarSlider.activeBackground": "#7AA2F780",
    },
  })
}

export default function WorkspacePage() {
  // 1. Mặc định bắt đầu ở Task 1 ("theory")
  const [activeMode, setActiveMode] = React.useState<WorkspaceMode>("theory")

  // 2. Ở Task 2 ("quiz"), ban đầu chưa chọn đáp án nào (null)
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  )

  // 3. State cho phần Monaco Code Editor (Task 3)
  const [code, setCode] = React.useState<string>(INITIAL_CPP_CODE)
  const [cursorPos, setCursorPos] = React.useState<{
    line: number
    col: number
  }>({
    line: 19,
    col: 18,
  })
  const [hintsRemaining, setHintsRemaining] = React.useState<number>(2)

  const handleEditorDidMount: OnMount = (editor) => {
    editor.setPosition({ lineNumber: 19, column: 18 })
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      })
    })
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden bg-[#15161E] px-4 py-3 font-sans text-[#A9B1D6] selection:bg-[#7AA2F7]/30 selection:text-[#C0CAF5] lg:h-svh lg:max-h-svh lg:overflow-hidden md:px-6">
      {/* ==================== THANH HEADER TRÊN CÙNG (TOP NAVBAR) ==================== */}
      <header className="relative z-10 mx-auto w-full max-w-[1480px] shrink-0">
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-[#292E42] bg-[#1A1B26]/95 px-5 py-2.5 shadow-lg backdrop-blur-md">
          {/* Logo AlgoPath */}
          <Link
            href={WORKSPACE_LINKS.brand}
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
          >
            <span className="size-7 shrink-0 rounded-full bg-[#7AA2F7]" />
            <span className="text-base font-bold tracking-tight text-[#C0CAF5]">
              AlgoPath
            </span>
          </Link>

          {/* Thanh Search ở giữa */}
          <div className="hidden max-w-[460px] flex-1 items-center justify-between rounded-full border border-[#292E42] bg-[#15161E]/90 px-4 py-1.5 text-xs text-[#545C7E] transition-colors focus-within:border-[#414868] md:flex">
            <div className="flex flex-1 items-center gap-2.5">
              <Search className="size-3.5 shrink-0 text-[#545C7E]" />
              <input
                type="text"
                placeholder="Search concepts, algorithms, or problems..."
                className="w-full bg-transparent text-xs text-[#C0CAF5] placeholder:text-[#545C7E] focus:outline-none"
              />
            </div>
            <kbd className="rounded border border-[#292E42] bg-[#1A1B26] px-2 py-0.5 font-mono text-[10px] font-medium text-[#A9B1D6]">
              Ctrl + K
            </kbd>
          </div>

          {/* User Profile bên phải */}
          <Link
            href={WORKSPACE_LINKS.profile}
            className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-[#292E42]/40"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[#7AA2F7] text-xs font-bold text-[#15161E]">
              D
            </span>
            <span className="hidden text-xs font-bold text-[#C0CAF5] sm:inline">
              Duc Vinh Hoang
            </span>
            <ChevronDown className="size-3.5 text-[#A9B1D6]" />
          </Link>
        </nav>
      </header>

      {/* ==================== KHÔNG GIAN LÀM VIỆC 3 CỘT (MAIN WORKSPACE) ==================== */}
      <main className="relative z-10 mx-auto mt-3 grid min-h-0 w-full max-w-[1480px] flex-1 grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* -------------------- CỘT 1 (TRÁI - 2/12): THANH ĐIỀU HƯỚNG 3 TASK -------------------- */}
        <aside className="flex flex-col justify-between rounded-2xl border border-[#292E42] bg-[#16161E] p-3.5 lg:col-span-2">
          <div>
            {/* Nút quay lại Skill Tree */}
            <Link
              href={WORKSPACE_LINKS.backToSkillTree}
              className="flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-[#292E42] bg-[#1A1B26] text-xs font-medium text-[#A9B1D6] transition-colors hover:border-[#414868] hover:text-[#C0CAF5]"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Skill Tree</span>
            </Link>

            {/* Tiêu đề chủ đề hiện tại */}
            <div className="mt-4 border-b border-[#292E42] pb-3">
              <h1 className="text-sm font-bold text-[#C0CAF5]">
                AVL Tree Mastery
              </h1>
              <p className="mt-0.5 text-[11px] leading-snug text-[#545C7E]">
                Complete all tasks to unlock the next node.
              </p>
            </div>

            {/* Danh sách 3 Task (Bấm để chuyển giữa Task 1, Task 2, Task 3) */}
            <div className="mt-3.5 space-y-3">
              {/* TASK 1: Core Theory & Big-O */}
              <button
                type="button"
                onClick={() => setActiveMode("theory")}
                className={cn(
                  "w-full cursor-pointer rounded-xl border p-3 text-left transition-all",
                  activeMode === "theory"
                    ? "border-[#7AA2F7] bg-[#283457]/40 shadow-[0_0_20px_rgba(122,162,247,0.18)]"
                    : "border-[#9ECE6A]/55 bg-[#1A1B26]/60 hover:border-[#9ECE6A]"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {activeMode === "theory" ? (
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#7DCFFF] bg-[#7DCFFF]/15 text-[#7DCFFF]">
                      <Square className="size-2.5 fill-current" />
                    </span>
                  ) : (
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#9ECE6A] text-[#15161E]">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-[10px]",
                        activeMode === "theory"
                          ? "text-[#7DCFFF]"
                          : "text-[#545C7E]"
                      )}
                    >
                      Task 1
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-[#C0CAF5]">
                      Core Theory &amp; Big-O
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  {activeMode === "theory" ? (
                    <span className="rounded-full bg-[#7AA2F7] px-3 py-0.5 text-[10px] font-bold text-[#15161E]">
                      In Progress
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#9ECE6A]/50 bg-[#9ECE6A]/15 px-3 py-0.5 text-[10px] font-semibold text-[#9ECE6A]">
                      Completed
                    </span>
                  )}
                </div>
              </button>

              {/* TASK 2: Quiz: Balance Factor */}
              <button
                type="button"
                onClick={() => setActiveMode("quiz")}
                className={cn(
                  "w-full cursor-pointer rounded-xl border p-3 text-left transition-all",
                  activeMode === "quiz"
                    ? "border-[#7AA2F7] bg-[#283457]/40 shadow-[0_0_20px_rgba(122,162,247,0.18)]"
                    : activeMode === "code"
                      ? "border-[#9ECE6A]/55 bg-[#1A1B26]/60 hover:border-[#9ECE6A]"
                      : "border-[#292E42] bg-[#1A1B26]/45 hover:border-[#414868]"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {activeMode === "code" ? (
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#9ECE6A] text-[#15161E]">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  ) : activeMode === "quiz" ? (
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#7DCFFF] bg-[#7DCFFF]/15 text-[#7DCFFF]">
                      <Square className="size-2.5 fill-current" />
                    </span>
                  ) : (
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#292E42] text-[#A9B1D6]">
                      <Lock className="size-3" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-[10px]",
                        activeMode === "quiz"
                          ? "text-[#7DCFFF]"
                          : "text-[#545C7E]"
                      )}
                    >
                      Task 2
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-[#C0CAF5]">
                      Quiz: Balance Factor
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  {activeMode === "quiz" ? (
                    <span className="rounded-full bg-[#7AA2F7] px-3 py-0.5 text-[10px] font-bold text-[#15161E]">
                      In Progress
                    </span>
                  ) : activeMode === "code" ? (
                    <span className="rounded-full border border-[#9ECE6A]/50 bg-[#9ECE6A]/15 px-3 py-0.5 text-[10px] font-semibold text-[#9ECE6A]">
                      Completed
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#292E42] px-3 py-0.5 text-[10px] font-medium text-[#545C7E]">
                      Locked
                    </span>
                  )}
                </div>
              </button>

              {/* TASK 3: Code: Right Rotation */}
              <button
                type="button"
                onClick={() => setActiveMode("code")}
                className={cn(
                  "w-full cursor-pointer rounded-xl border p-3 text-left transition-all",
                  activeMode === "code"
                    ? "border-[#7AA2F7] bg-[#283457]/40 shadow-[0_0_20px_rgba(122,162,247,0.18)]"
                    : "border-[#292E42] bg-[#1A1B26]/45 hover:border-[#414868]"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {activeMode === "code" ? (
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#7AA2F7] text-[#15161E]">
                      <Code2 className="size-3 stroke-[2.5]" />
                    </span>
                  ) : (
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#292E42] text-[#A9B1D6]">
                      <Lock className="size-3" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-[10px]",
                        activeMode === "code"
                          ? "text-[#7DCFFF]"
                          : "text-[#545C7E]"
                      )}
                    >
                      Task 3
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-xs font-bold",
                        activeMode === "code"
                          ? "text-[#C0CAF5]"
                          : "text-[#A9B1D6]"
                      )}
                    >
                      Code: Right Rotation
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  {activeMode === "code" ? (
                    <span className="rounded-full bg-[#7AA2F7] px-3 py-0.5 text-[10px] font-bold text-[#15161E]">
                      In Progress
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#292E42] px-3 py-0.5 text-[10px] font-medium text-[#545C7E]">
                      Locked
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[#292E42] bg-[#15161E] p-2 text-center text-[10px] text-[#545C7E]">
            Click Task 1, 2, or 3 to preview each stage.
          </div>
        </aside>

        {/* ==================== TRẠNG THÁI 1 & 2: THEORY HOẶC QUIZ ==================== */}
        {activeMode !== "code" ? (
          <>
            {/* -------------------- CỘT GIỮA (7/12): KHUNG NỘI DUNG THEORY / QUIZ -------------------- */}
            <section className="flex flex-col rounded-2xl border border-[#292E42] bg-[#16161E] p-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-[#292E42] pb-4">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="size-4 text-[#C0CAF5]" />
                  <h2 className="text-xs font-bold tracking-wider text-[#C0CAF5] uppercase">
                    {activeMode === "theory"
                      ? "CORE THEORY: AVL TREE & BIG-O COMPLEXITY"
                      : "QUIZ: AVL TREE"}
                  </h2>
                </div>

                {activeMode === "theory" ? (
                  <button
                    type="button"
                    onClick={() => setActiveMode("quiz")}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#7AA2F7] px-4 text-xs font-bold text-[#15161E] transition-colors hover:bg-[#8DB0FF]"
                  >
                    <span>Next: Take Quiz</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveMode("code")}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#7AA2F7] px-4 text-xs font-bold text-[#15161E] transition-colors hover:bg-[#8DB0FF]"
                  >
                    <Send className="size-3.5" />
                    <span>Submit</span>
                  </button>
                )}
              </div>

              {/* Nội dung Trạng thái 1: THEORY */}
              {activeMode === "theory" && (
                <div className="mt-6">
                  <p className="text-sm leading-relaxed text-[#C0CAF5]">
                    <span className="font-semibold text-[#7DCFFF]">
                      Module 1 of 3:
                    </span>{" "}
                    An AVL Tree is a self-balancing Binary Search Tree where the
                    difference between heights of left and right subtrees (the{" "}
                    <span className="font-semibold text-[#73DACA]">
                      Balance Factor
                    </span>
                    ) cannot exceed{" "}
                    <span className="font-bold text-[#FF9E64]">1</span> for any
                    node.
                  </p>

                  <div className="mt-6 space-y-3.5">
                    {THEORY_CARDS.map((card) => (
                      <div
                        key={card.badge}
                        className="flex items-start gap-4 rounded-xl border border-[#292E42] bg-[#15161E]/85 p-4 transition-colors hover:border-[#414868]"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#283457] font-mono text-xs font-bold text-[#7AA2F7]">
                          {card.badge}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-bold text-[#C0CAF5]">
                              {card.title}
                            </h3>
                            <span className="rounded bg-[#7AA2F7]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#7DCFFF]">
                              {card.tag}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-[#A9B1D6]">
                            {card.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nội dung Trạng thái 2: QUIZ (Ban đầu chưa chọn đáp án nào) */}
              {activeMode === "quiz" && (
                <div className="mt-6">
                  <p className="text-sm leading-relaxed text-[#C0CAF5]">
                    <span className="font-semibold text-[#7DCFFF]">
                      Question 2 of 3:
                    </span>{" "}
                    Given an AVL Tree node N with Left Subtree Height ={" "}
                    <span className="font-bold text-[#FF9E64]">3</span> and
                    Right Subtree Height ={" "}
                    <span className="font-bold text-[#FF9E64]">1</span>.
                    <br />
                    What is the{" "}
                    <span className="font-semibold text-[#73DACA]">
                      Balance Factor
                    </span>{" "}
                    of node N, and does it require a rotation?
                  </p>

                  <div className="mt-7 space-y-3.5">
                    {QUIZ_OPTIONS.map((option) => {
                      const isSelected = selectedOption === option.id
                      const isWrongSelection = isSelected && !option.isCorrect
                      const isRightSelection = isSelected && option.isCorrect

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedOption(option.id)}
                          className={cn(
                            "relative flex w-full cursor-pointer items-center rounded-xl border px-4 py-4 text-left transition-all",
                            isWrongSelection &&
                              "border-[#DB4B4B] bg-[#DB4B4B]/6",
                            isRightSelection &&
                              "border-[#9ECE6A] bg-[#9ECE6A]/8",
                            !isSelected &&
                              "border-[#292E42] bg-[#15161E]/70 hover:border-[#414868]"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                              isWrongSelection &&
                                "bg-[#DB4B4B] text-[#15161E]",
                              isRightSelection &&
                                "bg-[#9ECE6A] text-[#15161E]",
                              !isSelected && "bg-[#283457] text-[#7AA2F7]"
                            )}
                          >
                            {option.id}
                          </span>

                          <span
                            className={cn(
                              "flex-1 text-center text-xs font-medium sm:text-[13px]",
                              isSelected ? "text-[#C0CAF5]" : "text-[#A9B1D6]"
                            )}
                          >
                            {option.text}
                          </span>

                          {isWrongSelection && (
                            <span className="absolute right-3 bottom-1.5 inline-flex items-center gap-1 rounded bg-[#DB4B4B] px-2 py-0.5 text-[10px] font-bold text-[#15161E]">
                              <X className="size-2.5 stroke-[3]" />
                              <span>Incorrect Selection</span>
                            </span>
                          )}

                          {isRightSelection && (
                            <span className="absolute right-3 bottom-1.5 inline-flex items-center gap-1 rounded bg-[#9ECE6A] px-2 py-0.5 text-[10px] font-bold text-[#15161E]">
                              <Check className="size-2.5 stroke-[3]" />
                              <span>Correct Answer</span>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* -------------------- CỘT PHẢI (3/12): SOCRATIC AI TUTOR PANEL -------------------- */}
            <aside className="flex flex-col rounded-2xl border border-[#292E42] bg-[#16161E] p-5 lg:col-span-3">
              <div className="flex items-start justify-between gap-2 border-b border-[#292E42] pb-4">
                <div className="flex items-center gap-2.5">
                  <Box className="size-5 shrink-0 text-[#7DCFFF]" />
                  <div>
                    <h2 className="text-xs font-bold text-[#C0CAF5]">
                      Socratic AI Tutor
                    </h2>
                    <p className="text-[10px] text-[#545C7E]">
                      Stateless Guidance Engine
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292E42] bg-[#15161E] px-2.5 py-1 text-[10px] font-medium text-[#9ECE6A]">
                  <span className="size-1.5 rounded-full bg-[#9ECE6A]" />
                  <span>RAG Grounded</span>
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-[#7AA2F7]/50 bg-[#1A1B26] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C7A9FF]">
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>
                    {activeMode === "theory"
                      ? "Socratic Concept Check:"
                      : selectedOption
                        ? `Socratic Hint (Triggered by Option ${selectedOption}):`
                        : "Socratic Hint (Awaiting Selection):"}
                  </span>
                </div>

                {activeMode === "theory" ? (
                  <p className="mt-3 text-xs leading-relaxed text-[#A9B1D6]">
                    Notice how the{" "}
                    <span className="font-semibold text-[#73DACA]">
                      Balance Factor
                    </span>{" "}
                    only depends on the height of direct child subtrees. Why do
                    we only need{" "}
                    <span className="font-semibold text-[#FF9E64]">O(1)</span>{" "}
                    local pointer updates during a rotation instead of
                    rebuilding the entire tree?
                  </p>
                ) : !selectedOption ? (
                  <p className="mt-3 text-xs leading-relaxed text-[#A9B1D6]">
                    Select one of the options (<span className="font-bold text-[#7AA2F7]">A</span>,{" "}
                    <span className="font-bold text-[#7AA2F7]">B</span>,{" "}
                    <span className="font-bold text-[#7AA2F7]">C</span>, or{" "}
                    <span className="font-bold text-[#7AA2F7]">D</span>) on the
                    left. If your choice has a logical flaw, Socratic AI will
                    guide your reasoning without spoiling the answer.
                  </p>
                ) : selectedOption === "A" ? (
                  <p className="mt-3 text-xs leading-relaxed text-[#A9B1D6]">
                    Spot on! The{" "}
                    <span className="font-semibold text-[#73DACA]">
                      Balance Factor
                    </span>{" "}
                    is{" "}
                    <span className="font-semibold text-[#9ECE6A]">
                      +2 (3 - 1 = 2)
                    </span>
                    . Because the Left Subtree is heavier, rotating the tree to
                    the <span className="font-bold text-[#9ECE6A]">Right</span>{" "}
                    restores balance in O(1) time.
                  </p>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-[#A9B1D6]">
                    You correctly calculated the{" "}
                    <span className="font-semibold text-[#73DACA]">
                      Balance Factor
                    </span>{" "}
                    as{" "}
                    <span className="font-semibold text-[#FF9E64]">
                      +2 (3 - 1 = 2)
                    </span>
                    . However, since the Left Subtree is taller (
                    <span className="font-semibold text-[#FF9E64]">
                      height 3 &gt; height 1
                    </span>
                    ), which direction should the heavy left side rotate towards
                    to restore balance?
                  </p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#292E42] bg-[#1A1B26] px-2.5 text-[11px] font-medium text-[#A9B1D6] transition-colors hover:border-[#414868] hover:text-[#C0CAF5]"
                >
                  <FileText className="size-3.5 text-[#7AA2F7]" />
                  <span>Open Slide 14 (PDF)</span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#292E42] bg-[#1A1B26] px-2.5 text-[11px] font-medium text-[#A9B1D6] transition-colors hover:border-[#414868] hover:text-[#C0CAF5]"
                >
                  <BarChart2 className="size-3.5 text-[#7AA2F7]" />
                  <span>Trace Dry-Run Table</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setHintsRemaining((prev) => (prev > 0 ? prev - 1 : 3))
                }
                className="mt-2.5 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#7AA2F7]/40 bg-[#283457]/45 text-[11px] font-semibold text-[#7AA2F7] transition-colors hover:bg-[#283457]/70"
              >
                <MessageSquare className="size-3.5" />
                <span>
                  Request Another Socratic Hint ({hintsRemaining}/3 Left)
                </span>
              </button>
            </aside>
          </>
        ) : (
          /* ==================== TRẠNG THÁI 3: CODE WORKSPACE (HIỂN THỊ TRỌN VẸN TRÊN 1 MÀN HÌNH KHÔNG CẦN CUỘN) ==================== */
          <>
            {/* -------------------- CỘT GIỮA (7/12): VSCODE/MONACO CODE EDITOR + CODE ANALYSIS -------------------- */}
            <section className="flex min-h-0 flex-col justify-between gap-3 lg:col-span-7">
              {/* 1. KHUNG TRÊN: VSCODE / MONACO-STYLE CODE EDITOR VỚI TÔ MÀU CÚ PHÁP TỪNG BIẾN & HÀM */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#292E42] bg-[#16161E]">
                {/* Thanh Tab & Nút điều khiển Editor */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#292E42] bg-[#1A1B26] px-3.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[#292E42] bg-[#15161E] px-3 py-1 text-xs font-medium text-[#C0CAF5]">
                      <span className="font-mono text-[11px] font-bold text-[#7DCFFF]">
                        C++
                      </span>
                      <span>solution.cpp</span>
                      <X className="size-3 text-[#545C7E]" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#292E42] bg-[#15161E] px-2.5 font-mono text-[11px] text-[#C0CAF5]"
                    >
                      <span>C++</span>
                      <ChevronDown className="size-3 text-[#545C7E]" />
                    </button>

                    <button
                      type="button"
                      className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-[#414868] bg-[#1A1B26] px-3 text-[11px] font-semibold text-[#C0CAF5] transition-colors hover:border-[#7AA2F7]"
                    >
                      <Play className="size-3 text-[#7AA2F7]" />
                      <span>Run Code</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-[#7AA2F7] px-3.5 text-[11px] font-bold text-[#15161E] transition-colors hover:bg-[#8DB0FF]"
                    >
                      <Send className="size-3" />
                      <span>Submit</span>
                    </button>
                  </div>
                </div>

                {/* Vùng soạn thảo Monaco Editor thực tế (1 thanh cuộn duy nhất, tắt Minimap ở góc phải) */}
                <div className="relative min-h-[300px] flex-1 bg-[#15161E]">
                  <Editor
                    height="100%"
                    defaultLanguage="cpp"
                    theme="tokyo-night"
                    value={code}
                    onChange={(val) => setCode(val ?? "")}
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
                <div className="flex shrink-0 items-center justify-end gap-4 border-t border-[#292E42] bg-[#1A1B26] px-4 py-1 font-mono text-[10px] text-[#545C7E]">
                  <span>
                    Ln {cursorPos.line}, Col {cursorPos.col}
                  </span>
                  <span>C++</span>
                  <span>UTF-8</span>
                  <span className="inline-flex items-center gap-1.5 text-[#9ECE6A]">
                    <span className="size-1.5 rounded-full bg-[#9ECE6A]" />
                    Ready
                  </span>
                </div>
              </div>

              {/* 2. KHUNG DƯỚI: CODE ANALYSIS & TEST RESULTS (Thu gọn vừa vặn không cần cuộn trang) */}
              <div className="shrink-0 rounded-2xl border border-[#292E42] bg-[#16161E] p-3.5">
                <div className="flex items-center gap-2 border-b border-[#292E42] pb-2.5">
                  <Settings className="size-4 text-[#7DCFFF]" />
                  <h2 className="text-xs font-bold text-[#C0CAF5]">
                    Code Analysis &amp; Test Results
                  </h2>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Thẻ Trái: Complexity Estimation */}
                  <div className="flex flex-col justify-between rounded-xl border border-[#292E42] bg-[#15161E] p-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#C0CAF5]">
                          <BarChart2 className="size-3.5 text-[#7DCFFF]" />
                          <span>Complexity Estimation</span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#9ECE6A]/40 bg-[#9ECE6A]/12 px-2 py-0.5 text-[10px] font-semibold text-[#9ECE6A]">
                          <span className="size-1.5 rounded-full bg-[#9ECE6A]" />
                          Optimal
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[#A9B1D6]">
                            Time Complexity
                          </span>
                          <span className="font-mono font-bold text-[#9ECE6A]">
                            O(1)
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[#A9B1D6]">
                            Space Complexity
                          </span>
                          <span className="font-mono font-bold text-[#9ECE6A]">
                            O(1)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-[#292E42] bg-[#1A1B26] px-2.5 py-1.5 text-[11px] text-[#A9B1D6]">
                      <CheckCircle2 className="size-3.5 shrink-0 text-[#9ECE6A]" />
                      <span>Meets optimal bounds for AVL operations.</span>
                    </div>
                  </div>

                  {/* Thẻ Phải: Edge Case Warning */}
                  <div className="flex flex-col justify-between rounded-xl border border-[#DB4B4B]/65 bg-[#15161E] p-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#C0CAF5]">
                          <AlertTriangle className="size-3.5 text-[#DB4B4B]" />
                          <span>Edge Case Warning</span>
                        </div>
                        <span className="rounded-md border border-[#DB4B4B]/40 bg-[#DB4B4B]/15 px-2 py-0.5 text-[10px] font-semibold text-[#DB4B4B]">
                          Failed (Test Case #5)
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] leading-relaxed text-[#A9B1D6]">
                        <div className="font-medium text-[#C0CAF5]">
                          Segmentation fault (SIGSEGV) on Test Case #5.
                        </div>
                        <div className="mt-0.5 text-[#A9B1D6]">
                          • Possible cause: dereferencing a null pointer (
                          <span className="font-mono text-[#C0CAF5]">
                            y-&gt;left
                          </span>
                          ).
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-[#DB4B4B]/40 bg-[#DB4B4B]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#FF9E64]">
                      <ArrowRight className="size-3.5 shrink-0 text-[#DB4B4B]" />
                      <span>
                        Check for null pointers before accessing y-&gt;left.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* -------------------- CỘT PHẢI (3/12): VISUALIZATION (BEFORE/AFTER RIGHT ROTATION) + SOCRATIC AI TUTOR -------------------- */}
            <aside className="flex min-h-0 flex-col justify-between gap-3 lg:col-span-3">
              {/* 1. KHUNG TRÊN: VISUALIZATION (Sơ đồ cây Before / After Right Rotation giống hệt ảnh mẫu) */}
              <div className="shrink-0 rounded-2xl border border-[#292E42] bg-[#16161E] p-4">
                <div className="flex items-center justify-between border-b border-[#292E42] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Box className="size-4 text-[#7DCFFF]" />
                    <h2 className="text-xs font-bold text-[#C0CAF5]">
                      Visualization
                    </h2>
                  </div>
                  <span className="rounded-md border border-[#292E42] bg-[#1A1B26] px-2 py-0.5 text-[10px] font-semibold text-[#A9B1D6]">
                    AVL Tree
                  </span>
                </div>

                {/* Sơ đồ Before (Right Rotation) -> After (Mọi cạnh nối đều dùng getCircleEdge thẳng & vuông góc 90° với tiếp tuyến) */}
                <div className="mt-2.5 rounded-xl border border-[#292E42] bg-[#15161E] p-2">
                  <svg
                    viewBox="0 0 310 155"
                    className="h-[145px] w-full select-none"
                    aria-label="AVL Tree Right Rotation Visualization"
                  >
                    {/* Tiêu đề 2 nhánh */}
                    <text
                      x="72"
                      y="15"
                      textAnchor="middle"
                      fill="#A9B1D6"
                      fontSize="9.5"
                      fontWeight="600"
                    >
                      Before (Right Rotation)
                    </text>
                    <text
                      x="238"
                      y="15"
                      textAnchor="middle"
                      fill="#A9B1D6"
                      fontSize="9.5"
                      fontWeight="600"
                    >
                      After
                    </text>

                    {/* Cạnh nối cây BEFORE: y(88,42) -> x(52,85), y(88,42) -> T3(118,85), x(52,85) -> T1(26,130), x(52,85) -> T2(76,130) */}
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
                      /* Cạnh nối cây AFTER: x(222,42) -> T1(192,85), x(222,42) -> y(258,85), y(258,85) -> T2(234,130), y(258,85) -> T3(284,130) */
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

                    {/* Mũi tên chuyển đổi ở giữa (→) */}
                    <g
                      transform="translate(146, 75)"
                      stroke="#7AA2F7"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="0" y1="0" x2="16" y2="0" />
                      <polyline points="11,-4 16,0 11,4" />
                    </g>

                    {/* Các Node của cả 2 cây Before và After */}
                    {[
                      // BEFORE TREE
                      {
                        id: "b-y",
                        label: "y",
                        x: 88,
                        y: 42,
                        r: 14,
                        fill: "#3B336A",
                        stroke: "#C7A9FF",
                        text: "#FFFFFF",
                      },
                      {
                        id: "b-x",
                        label: "x",
                        x: 52,
                        y: 85,
                        r: 14,
                        fill: "#1E4E68",
                        stroke: "#7DCFFF",
                        text: "#FFFFFF",
                      },
                      {
                        id: "b-t3",
                        label: "T3",
                        x: 118,
                        y: 85,
                        r: 13,
                        fill: "#1A1B26",
                        stroke: "#414868",
                        text: "#A9B1D6",
                      },
                      {
                        id: "b-t1",
                        label: "T1",
                        x: 26,
                        y: 130,
                        r: 13,
                        fill: "#1A1B26",
                        stroke: "#414868",
                        text: "#A9B1D6",
                      },
                      {
                        id: "b-t2",
                        label: "T2",
                        x: 76,
                        y: 130,
                        r: 13,
                        fill: "#1A1B26",
                        stroke: "#414868",
                        text: "#A9B1D6",
                      },
                      // AFTER TREE
                      {
                        id: "a-x",
                        label: "x",
                        x: 222,
                        y: 42,
                        r: 14,
                        fill: "#1E4E68",
                        stroke: "#7DCFFF",
                        text: "#FFFFFF",
                      },
                      {
                        id: "a-t1",
                        label: "T1",
                        x: 192,
                        y: 85,
                        r: 13,
                        fill: "#1A1B26",
                        stroke: "#414868",
                        text: "#A9B1D6",
                      },
                      {
                        id: "a-y",
                        label: "y",
                        x: 258,
                        y: 85,
                        r: 14,
                        fill: "#3B336A",
                        stroke: "#C7A9FF",
                        text: "#FFFFFF",
                      },
                      {
                        id: "a-t2",
                        label: "T2",
                        x: 234,
                        y: 130,
                        r: 13,
                        fill: "#1A1B26",
                        stroke: "#414868",
                        text: "#A9B1D6",
                      },
                      {
                        id: "a-t3",
                        label: "T3",
                        x: 284,
                        y: 130,
                        r: 13,
                        fill: "#1A1B26",
                        stroke: "#414868",
                        text: "#A9B1D6",
                      },
                    ].map((node) => (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                      >
                        <circle
                          r={node.r}
                          fill={node.fill}
                          stroke={node.stroke}
                          strokeWidth="1.75"
                        />
                        <text
                          y="3.5"
                          textAnchor="middle"
                          fill={node.text}
                          fontSize="10"
                          fontWeight="700"
                        >
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* 2. KHUNG DƯỚI: SOCRATIC AI TUTOR (Theo mẫu mới nhất) */}
              <div className="flex min-h-0 flex-1 flex-col justify-between rounded-2xl border border-[#292E42] bg-[#16161E] p-4">
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-[#292E42] pb-3">
                    <div className="flex items-center gap-2">
                      <Box className="size-4 shrink-0 text-[#7DCFFF]" />
                      <div>
                        <h2 className="text-xs font-bold text-[#C0CAF5]">
                          Socratic AI Tutor
                        </h2>
                        <p className="text-[10px] text-[#545C7E]">
                          Stateless Guidance Engine
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#292E42] bg-[#15161E] px-2.5 py-0.5 text-[10px] font-medium text-[#9ECE6A]">
                      <span className="size-1.5 rounded-full bg-[#9ECE6A]" />
                      <span>RAG Grounded</span>
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#7AA2F7]/50 bg-[#1A1B26] p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C7A9FF]">
                      <Lightbulb className="size-3.5 shrink-0 text-[#C7A9FF]" />
                      <span>Socratic Hint (Triggered by Option B):</span>
                    </div>

                    <p className="mt-2 text-[11px] leading-relaxed text-[#A9B1D6]">
                      Before accessing{" "}
                      <span className="font-mono font-semibold text-[#C0CAF5]">
                        y-&gt;left
                      </span>
                      , make sure that{" "}
                      <span className="font-mono font-semibold text-[#C0CAF5]">
                        y
                      </span>{" "}
                      is not a null pointer. In some test cases, the node can be
                      empty, which leads to a segmentation fault when you try to
                      dereference it.
                    </p>

                    <p className="mt-2.5 text-[11px] leading-relaxed text-[#A9B1D6]">
                      Can you add a null check at the beginning of the{" "}
                      <span className="font-mono text-[#C0CAF5]">
                        rotateRight
                      </span>{" "}
                      function?
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#292E42] bg-[#1A1B26] px-2 text-[10.5px] font-medium text-[#A9B1D6] transition-colors hover:border-[#414868] hover:text-[#C0CAF5]"
                    >
                      <FileText className="size-3.5 text-[#7AA2F7]" />
                      <span>Open Slide 14 (PDF)</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#292E42] bg-[#1A1B26] px-2 text-[10.5px] font-medium text-[#A9B1D6] transition-colors hover:border-[#414868] hover:text-[#C0CAF5]"
                    >
                      <BarChart2 className="size-3.5 text-[#7AA2F7]" />
                      <span>Trace Dry-Run Table</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setHintsRemaining((prev) => (prev > 0 ? prev - 1 : 3))
                    }
                    className="mt-2 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#7AA2F7]/40 bg-[#283457]/45 text-[10.5px] font-semibold text-[#7AA2F7] transition-colors hover:bg-[#283457]/70"
                  >
                    <MessageSquare className="size-3.5" />
                    <span>
                      Request Another Socratic Hint ({hintsRemaining}/3 Left)
                    </span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  )
}
