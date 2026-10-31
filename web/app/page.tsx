"use client"

import Link from "next/link"
import {
  ArrowRight,
  CloudLightning,
  Eye,
  GitFork,
  Shield,
  User,
} from "lucide-react"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { useAuth } from "@/hooks/useAuth"

/**
 * Cấu hình đường dẫn (href) cho các nút và liên kết trên trang chủ Landing (`/`).
 * Bạn có thể thay đổi trực tiếp các đường dẫn tại đây để điều hướng sang các trang tương ứng.
 */
export const LANDING_LINKS = {
  brand: "/",
  features: "#features",
  howItWorks: "#how-it-works",
  login: "/auth",
  getStarted: "/auth?tab=signup",
  exploreSkillTree: "/roadmap",
  cards: {
    skillTree: "/roadmap",
    sandbox: "/workspace",
    socraticAi: "/workspace",
  },
} as const

const FEATURE_HIGHLIGHTS = [
  {
    icon: CloudLightning,
    line1: "Syllabus-Driven",
    line2: "Roadmap",
  },
  {
    icon: Shield,
    line1: "Zero-Hallucination",
    line2: "RAG",
  },
] as const

const FEATURE_CARDS = [
  {
    title: "Automated Skill Tree",
    description:
      "Extracts core topics directly from your PDF syllabus to build a structured, prerequisite-based learning roadmap.",
    icon: GitFork,
    iconColor: "text-[#7AA2F7]",
    href: LANDING_LINKS.cards.skillTree,
  },
  {
    title: "Code Sandbox & Theory Quiz",
    description:
      "Practice implementation in an integrated code editor alongside static quizzes on Big-O complexity and algorithm tracing.",
    icon: Eye,
    iconColor: "text-[#8DB0FF]",
    href: LANDING_LINKS.cards.sandbox,
  },
  {
    title: "Socratic AI Feedback",
    description:
      "No direct answers. When tests fail, context-aware RAG prompts guide you to find the logical flaw yourself.",
    icon: User,
    iconColor: "text-[#C7A9FF]",
    href: LANDING_LINKS.cards.socraticAi,
  },
] as const

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="relative flex min-h-svh flex-col justify-between overflow-x-hidden bg-[#15161E] px-5 py-3 font-sans text-[#A9B1D6] selection:bg-[#7AA2F7]/30 selection:text-[#C0CAF5] md:px-9 md:py-4 lg:h-svh lg:max-h-svh lg:overflow-hidden">
      {/* Hiệu ứng quầng sáng nền bên phải (Radial Glow #7AA2F7 16%) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[44%] right-[6%] h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-[#7AA2F7]/16 blur-[130px] lg:h-[560px] lg:w-[560px]"
      />

      {/* ==================== THANH ĐIỀU HƯỚNG (NAVBAR) ==================== */}
      <header className="relative z-40 mx-auto w-full max-w-[1400px] shrink-0">
        <nav className="flex items-center justify-between rounded-xl border border-[#292E42] bg-[#1A1B26]/95 px-5 py-2.5 shadow-lg backdrop-blur-md">
          {/* Logo & Slogan */}
          <div className="flex items-center">
            <Link
              href={LANDING_LINKS.brand}
              className="flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <span className="size-8 shrink-0 rounded-full bg-[#7AA2F7]" />
              <span className="text-lg font-bold tracking-tight text-[#C0CAF5]">
                AlgoPath
              </span>
            </Link>

            <div className="mx-4 hidden h-5 w-px bg-[#3B4261] md:block" />

            <p className="hidden text-xs text-[#A9B1D6] lg:block">
              Smarter DSA mastery, one node at a time
            </p>
          </div>

          {/* Liên kết giữa Navbar */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href={LANDING_LINKS.features}
              className="text-xs font-medium text-[#A9B1D6] transition-colors hover:text-[#C0CAF5]"
            >
              Features
            </Link>
            <Link
              href={LANDING_LINKS.howItWorks}
              className="text-xs font-medium text-[#A9B1D6] transition-colors hover:text-[#C0CAF5]"
            >
              How It Works
            </Link>
          </div>

          {/* Cụm nút hành động bên phải (Log In / Get Started hoặc User Profile khi đã đăng nhập) */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <UserProfileMenu />
            ) : (
              <>
                <Link
                  href={LANDING_LINKS.login}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-[#414868] bg-[#1A1B26] px-5 text-xs font-semibold text-[#C0CAF5] transition-colors hover:border-[#7AA2F7] hover:bg-[#292E42]/60"
                >
                  Log In
                </Link>
                <Link
                  href={LANDING_LINKS.getStarted}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#7AA2F7] px-5 text-xs font-semibold text-[#15161E] transition-colors hover:bg-[#8DB0FF]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ==================== NỘI DUNG CHÍNH (HERO SECTION) ==================== */}
      {/* Căn đúng chuẩn max-w-[1320px] giống hệt 3 thẻ bên dưới để thẳng hàng dọc 2 bên và nằm gọn trong thanh Header nổi (max-w-[1400px]) */}
      <main className="relative z-10 mx-auto grid w-full max-w-[1320px] grid-cols-1 items-center gap-6 py-1 lg:grid-cols-12 lg:gap-6">
        {/* CỘT TRÁI (7/12): Giữ nguyên kích thước chữ lớn chuẩn Figma, căn thẳng mép trái với Thẻ 1 bên dưới */}
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            {/* Nhãn Pill Badge (Ngang hàng với nhãn Syllabus bên cột phải) */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7AA2F7]/40 bg-[#1A1B26] px-3.5 py-1 text-[11px] font-medium text-[#A9B1D6]">
              <span className="font-mono text-[#7AA2F7]">&lt;/&gt;</span>
              <span>AI-Powered • DSA Learning Platform</span>
            </div>

            {/* Tiêu đề chính: Chữ Thinking nằm trên hàng 2, vươn tự nhiên vào khoảng trống phía trên nhánh cây */}
            <h1 className="relative z-20 mt-3.5 text-3xl leading-[1.14] font-extrabold tracking-tight sm:text-4xl lg:text-[42px] xl:text-[48px]">
              <span className="block whitespace-nowrap">
                <span className="text-[#7DCFFF]">Master </span>
                <span className="text-[#7AA2F7]">Data </span>
                <span className="text-[#FF9E64]">Structures</span>
              </span>
              <span className="mt-1 block whitespace-nowrap">
                <span className="text-[#7DCFFF]">Through </span>
                <span className="text-[#7AA2F7]">Computational </span>
                <span className="text-[#FF9E64]">Thinking</span>
              </span>
            </h1>

            {/* Đoạn mô tả phụ */}
            <p className="mt-3.5 max-w-[510px] text-xs leading-[1.65] text-[#A9B1D6] sm:text-sm">
              Automatically transform your course syllabus into an interactive
              Skill Tree. Debug code and master Big-O complexity with stateless
              Socratic AI hints—designed to guide your logic, never to spoil the
              solution.
            </p>
          </div>

          <div className="mt-5">
            {/* Nút CTA chính: Explore Skill Tree */}
            <div>
              <Link
                href={LANDING_LINKS.exploreSkillTree}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7AA2F7] px-10 text-sm font-bold text-[#15161E] shadow-[0_0_30px_rgba(122,162,247,0.25)] transition-all hover:bg-[#8DB0FF] hover:shadow-[0_0_36px_rgba(122,162,247,0.4)]"
              >
                <span>Explore Skill Tree</span>
                <ArrowRight className="size-4 stroke-[2.5]" />
              </Link>
            </div>

            {/* 3 chỉ số / điểm nổi bật nhỏ bên dưới nút CTA (Ngang hàng đáy với 2 thẻ Code & Hint bên phải) */}
            <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-[#A9B1D6]">
              {FEATURE_HIGHLIGHTS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.line1} className="flex items-center gap-5">
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4 shrink-0 text-[#7AA2F7]" />
                      <div className="leading-tight">
                        <span className="block">{item.line1}</span>
                        <span className="block">{item.line2}</span>
                      </div>
                    </div>
                    <div className="h-7 w-px bg-[#292E42]" />
                  </div>
                )
              })}

              {/* Mục thứ 3: Mastery Tracking */}
              <div className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="size-4 shrink-0 text-[#7AA2F7]"
                  aria-hidden="true"
                >
                  <rect
                    x="2"
                    y="9"
                    width="2.5"
                    height="5"
                    rx="1"
                    fill="currentColor"
                  />
                  <rect
                    x="6.75"
                    y="6"
                    width="2.5"
                    height="8"
                    rx="1"
                    fill="currentColor"
                  />
                  <rect
                    x="11.5"
                    y="2.5"
                    width="2.5"
                    height="11.5"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
                <span>Mastery Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): Bố cục hình tháp (trên thu gọn tránh chữ Thinking, dưới mở rộng 2 thẻ Code & Hint căn thẳng mép phải với Thẻ 3) */}
        <div className="flex flex-col justify-between select-none lg:col-span-5">
          {/* Hàng trên cùng: Nhãn trạng thái Syllabus căn phải, ngang hàng với Pill Badge bên trái */}
          <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#292E42] bg-[#1A1B26] px-3.5 py-1.5 text-[11px]">
              <span className="size-2 rounded-full bg-[#7DCFFF]" />
              <span className="font-mono text-[#A9B1D6]">
                CS101_Syllabus.pdf
              </span>
              <span className="text-[#414868]">→</span>
              <span className="font-semibold text-[#7AA2F7]">
                65% Mastered
              </span>
            </div>
          </div>

          {/* Phần giữa: Sơ đồ Cây Đường Tròn (Mọi cạnh nối đều là đường thẳng nối tâm, vuông góc 90° với tiếp tuyến 2 đường tròn) */}
          <div className="my-1 flex items-center justify-end">
            <svg
              viewBox="0 0 460 210"
              className="h-[152px] w-full max-w-[460px] overflow-visible xl:h-[172px]"
              aria-label="DSA Skill Tree Roadmap"
            >
              {/* Các đoạn thẳng nối tâm chuẩn hình học (vuông góc tiếp tuyến đường tròn tại điểm tiếp xúc) */}
              {[
                {
                  x1: 255,
                  y1: 28,
                  r1: 20,
                  x2: 155,
                  y2: 100,
                  r2: 19,
                  color: "#7AA2F7",
                  dashed: false,
                },
                {
                  x1: 255,
                  y1: 28,
                  r1: 20,
                  x2: 355,
                  y2: 100,
                  r2: 19,
                  color: "#7AA2F7",
                  dashed: false,
                },
                {
                  x1: 155,
                  y1: 100,
                  r1: 19,
                  x2: 95,
                  y2: 172,
                  r2: 18,
                  color: "#414868",
                  dashed: true,
                },
                {
                  x1: 355,
                  y1: 100,
                  r1: 19,
                  x2: 285,
                  y2: 172,
                  r2: 18,
                  color: "#FF9E64",
                  dashed: false,
                },
                {
                  x1: 355,
                  y1: 100,
                  r1: 19,
                  x2: 420,
                  y2: 172,
                  r2: 18,
                  color: "#414868",
                  dashed: true,
                },
              ].map((edge, idx) => {
                const dx = edge.x2 - edge.x1
                const dy = edge.y2 - edge.y1
                const dist = Math.hypot(dx, dy)
                const ux = dx / dist
                const uy = dy / dist
                return (
                  <line
                    key={idx}
                    x1={edge.x1 + ux * edge.r1}
                    y1={edge.y1 + uy * edge.r1}
                    x2={edge.x2 - ux * edge.r2}
                    y2={edge.y2 - uy * edge.r2}
                    stroke={edge.color}
                    strokeWidth="2"
                    strokeDasharray={edge.dashed ? "4 4" : undefined}
                    strokeLinecap="round"
                  />
                )
              })}

              {/* Danh sách các Node tròn trên cây */}
              {[
                {
                  code: "✓",
                  label: "Arrays & Big-O",
                  x: 255,
                  y: 28,
                  r: 20,
                  border: "#7DCFFF",
                  textColor: "#C0CAF5",
                  codeColor: "#7DCFFF",
                  labelSide: "right" as const,
                },
                {
                  code: "✓",
                  label: "Linked Lists",
                  x: 155,
                  y: 100,
                  r: 19,
                  border: "#7AA2F7",
                  textColor: "#C0CAF5",
                  codeColor: "#7AA2F7",
                  labelSide: "left" as const,
                },
                {
                  code: "03",
                  label: "Trees & Recursion",
                  x: 355,
                  y: 100,
                  r: 19,
                  border: "#7AA2F7",
                  textColor: "#C0CAF5",
                  codeColor: "#7DCFFF",
                  labelSide: "bottom" as const,
                },
                {
                  code: "04",
                  label: "Hash Tables",
                  x: 95,
                  y: 172,
                  r: 18,
                  border: "#414868",
                  textColor: "#565F89",
                  codeColor: "#565F89",
                  labelSide: "bottom" as const,
                },
                {
                  code: "BST",
                  label: "Binary Search Tree",
                  x: 285,
                  y: 172,
                  r: 18,
                  border: "#FF9E64",
                  textColor: "#FF9E64",
                  codeColor: "#FF9E64",
                  labelSide: "bottom" as const,
                },
                {
                  code: "06",
                  label: "Heaps & PQ",
                  x: 420,
                  y: 172,
                  r: 18,
                  border: "#414868",
                  textColor: "#565F89",
                  codeColor: "#565F89",
                  labelSide: "bottom" as const,
                },
              ].map((node) => (
                <g
                  key={node.label}
                  transform={`translate(${node.x}, ${node.y})`}
                >
                  <circle
                    r={node.r}
                    fill="#1A1B26"
                    stroke={node.border}
                    strokeWidth="2"
                  />
                  <text
                    y="4"
                    textAnchor="middle"
                    fill={node.codeColor}
                    fontSize="10.5"
                    fontWeight="700"
                    className="font-mono"
                  >
                    {node.code}
                  </text>
                  {node.labelSide === "right" && (
                    <text
                      x={node.r + 8}
                      y="4"
                      textAnchor="start"
                      fill={node.textColor}
                      fontSize="11"
                      fontWeight="600"
                    >
                      {node.label}
                    </text>
                  )}
                  {node.labelSide === "left" && (
                    <text
                      x={-(node.r + 8)}
                      y="4"
                      textAnchor="end"
                      fill={node.textColor}
                      fontSize="11"
                      fontWeight="600"
                    >
                      {node.label}
                    </text>
                  )}
                  {node.labelSide === "bottom" && (
                    <text
                      y={node.r + 14}
                      textAnchor="middle"
                      fill={node.textColor}
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Hàng dưới cùng: 2 thẻ Code Sandbox & Socratic Hint nằm ngang hàng với nút CTA và căn thẳng mép phải với Thẻ 3 */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Thẻ 1: Code Sandbox + Big-O */}
            <div className="rounded-xl border border-[#292E42] bg-[#1A1B26] p-3 font-mono text-[11px]">
              <div className="mb-1.5 flex items-center justify-between border-b border-[#292E42] pb-1">
                <span className="font-semibold text-[#C0CAF5]">
                  bst_search.cpp
                </span>
                <span className="rounded bg-[#7DCFFF]/15 px-1.5 py-0.5 text-[10px] text-[#7DCFFF]">
                  O(log N)
                </span>
              </div>
              <div className="space-y-0.5 leading-relaxed">
                <div className="text-[#565F89]">
                  <span className="text-[#7DCFFF]">Node*</span>{" "}
                  <span className="text-[#7AA2F7]">find</span>(Node* r,{" "}
                  <span className="text-[#7DCFFF]">int</span> k) &#123;
                </div>
                <div className="-mx-1 rounded border-l-2 border-[#FF9E64] bg-[#FF9E64]/12 px-1 py-0.5 text-[#C0CAF5]">
                  <span className="text-[#FF9E64]">if</span> (r-&gt;val == k){" "}
                  <span className="text-[#7DCFFF]">return</span> r;
                </div>
                <div className="pl-2 text-[#A9B1D6]">
                  <span className="text-[#7DCFFF]">return</span>{" "}
                  find(r-&gt;left, k);
                </div>
                <div className="text-[#565F89]">&#125;</div>
              </div>
            </div>

            {/* Thẻ 2: Socratic AI Hint */}
            <div className="flex flex-col justify-between rounded-xl border border-[#7AA2F7]/40 bg-[#1A1B26] p-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C7A9FF]">
                    <span className="size-2 rounded-full bg-[#C7A9FF]" />
                    Socratic Hint
                  </span>
                  <span className="rounded border border-[#292E42] bg-[#15161E] px-1.5 py-0.5 text-[9px] text-[#565F89]">
                    RAG
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#A9B1D6]">
                  &ldquo;What happens if{" "}
                  <code className="rounded bg-[#15161E] px-1 py-0.5 font-mono text-[#7DCFFF]">
                    r
                  </code>{" "}
                  reaches{" "}
                  <code className="rounded bg-[#15161E] px-1 py-0.5 font-mono text-[#C0CAF5]">
                    nullptr
                  </code>{" "}
                  before checking{" "}
                  <code className="rounded bg-[#15161E] px-1 py-0.5 font-mono text-[#FF9E64]">
                    r-&gt;val
                  </code>
                  ?&rdquo;
                </p>
              </div>
              <div className="mt-1.5 border-t border-[#292E42] pt-1 text-[10px] text-[#7AA2F7]">
                Guides logic • No spoilers
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================== 3 THẺ TÍNH NĂNG ==================== */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-[1320px] shrink-0"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex items-start gap-3.5 rounded-2xl border border-[#292E42] bg-[#1A1B26]/90 p-4 transition-all hover:border-[#414868] hover:bg-[#1A1B26] xl:p-4.5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#7AA2F7]/40 bg-[#7AA2F7]/16 transition-transform group-hover:scale-105">
                  <Icon className={`size-4.5 ${card.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#C0CAF5] transition-colors group-hover:text-[#7DCFFF]">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-xs leading-[1.5] text-[#565F89]">
                    {card.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ==================== CHÂN TRANG (FOOTER) ==================== */}
      <footer className="relative z-10 mx-auto flex w-full max-w-[1320px] shrink-0 items-center justify-center gap-3 pb-0.5 text-[11px]">
        <div className="flex items-center">
          <div className="h-px w-16 bg-[#283457] sm:w-28" />
          <div className="size-1 rounded-full bg-[#414868]" />
        </div>

        <p className="tracking-wide">
          <span className="font-semibold text-[#7AA2F7]">AlgoPath</span>
          <span className="mx-1.5 text-[#3B4261]">—</span>
          <span className="text-[#565F89]">
            Build Better Algorithmic Thinkers
          </span>
        </p>

        <div className="flex items-center">
          <div className="size-1 rounded-full bg-[#414868]" />
          <div className="h-px w-16 bg-[#283457] sm:w-28" />
        </div>
      </footer>
    </div>
  )
}
