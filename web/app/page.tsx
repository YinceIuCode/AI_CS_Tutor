"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Brain,
  BrainCircuit,
  Check,
  CheckCircle2,
  CloudLightning,
  Code2,
  FileText,
  FileUp,
  GitBranch,
  GitFork,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react"
import { UserProfileMenu } from "@/components/user-profile-menu"
import { useAuth } from "@/hooks/useAuth"
import { BRAND } from "@/config/brand"
import { BrandLogo } from "@/components/brand-logo"
import { PwaInstallButton } from "@/components/pwa-install-button"

/**
 * Navigation links configuration across the Landing Page.
 */
export const LANDING_LINKS = {
  brand: "/",
  features: "#features",
  howItWorks: "#how-it-works",
  login: "/auth",
  getStarted: "/auth?tab=signup",
  exploreSkillTree: "/roadmap",
  workspace: "/workspace",
} as const

const FEATURE_HIGHLIGHTS = [
  {
    icon: CloudLightning,
    line1: "Syllabus-Driven",
    line2: "Roadmap",
  },
  {
    icon: Shield,
    line1: "RAG-Grounded",
    line2: "Guidance",
  },
] as const

const FEATURES_DATA = [
  {
    id: "01",
    title: "Dynamic Learning Roadmap",
    description:
      "Upload your course syllabus and let AI identify key topics, prerequisites and learning dependencies to generate a personalized, interactive Skill Tree.",
    keyPoints: [
      "Syllabus-Based Topic Extraction",
      "Prerequisite Mapping",
      "Interactive Skill Tree",
    ],
    icon: GitBranch,
    iconColor: "text-[#7DCFFF]",
    iconBg: "bg-[#7DCFFF]/10 border-[#7DCFFF]/30",
    href: LANDING_LINKS.exploreSkillTree,
    actionLabel: "Explore Roadmap",
  },
  {
    id: "02",
    title: "Integrated DSA Workspace",
    description:
      "Learn theory, challenge your understanding through quizzes, and implement algorithms in an integrated coding environment with execution and complexity analysis.",
    keyPoints: [
      "Interactive Theory & Quizzes",
      "C++ / Python Code Editor",
      "Code Execution & Test Cases",
      "Complexity Analysis",
    ],
    icon: Code2,
    iconColor: "text-[#7AA2F7]",
    iconBg: "bg-[#7AA2F7]/10 border-[#7AA2F7]/30",
    href: LANDING_LINKS.workspace,
    actionLabel: "Open Workspace",
  },
  {
    id: "03",
    title: "Context-Aware Socratic AI",
    description:
      "Powered by Retrieval-Augmented Generation, Socratic AI retrieves relevant learning materials and generates contextual hints to help you discover mistakes and develop your own reasoning.",
    keyPoints: [
      "RAG-Grounded Guidance",
      "Progressive Socratic Hints",
      "Context-Aware Code Debugging",
    ],
    icon: BrainCircuit,
    iconColor: "text-[#BB9AF7]",
    iconBg: "bg-[#BB9AF7]/10 border-[#BB9AF7]/30",
    href: LANDING_LINKS.workspace,
    actionLabel: "Try Socratic AI",
  },
] as const

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Upload Your Materials",
    description:
      "Upload your course syllabus or lecture slides in PDF format to get started.",
    icon: FileUp,
    badgeColor: "text-[#7DCFFF] border-[#7DCFFF]/30 bg-[#7DCFFF]/10",
    visual: (
      <div className="rounded-xl border border-[#292E42] bg-[#15161E] p-3 text-left">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#7DCFFF]/15 text-[#7DCFFF]">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] font-semibold text-[#C0CAF5]">
              CS101_Syllabus.pdf
            </p>
            <p className="text-[10px] text-[#565F89]">2.4 MB • PDF Document</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-[#292E42]/60 pt-2 text-[10px]">
          <span className="inline-flex items-center gap-1 text-[#9ECE6A]">
            <CheckCircle2 className="size-3" />
            Uploaded &amp; Parsed
          </span>
          <span className="font-mono text-[#565F89]">100%</span>
        </div>
      </div>
    ),
  },
  {
    step: "02",
    title: "Generate Your Learning Roadmap",
    description:
      "AI analyzes your learning materials, extracts DSA topics and identifies prerequisite relationships to build an interactive Skill Tree.",
    icon: GitFork,
    badgeColor: "text-[#7AA2F7] border-[#7AA2F7]/30 bg-[#7AA2F7]/10",
    visual: (
      <div className="rounded-xl border border-[#292E42] bg-[#15161E] p-3 text-left">
        <div className="flex items-center justify-between font-mono text-[10px] text-[#565F89]">
          <span>Skill Tree DAG</span>
          <span className="text-[#7AA2F7]">3 Nodes Connected</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-1.5 font-mono text-[10px]">
          <div className="flex flex-1 items-center gap-1 rounded border border-[#9ECE6A]/40 bg-[#9ECE6A]/10 px-1.5 py-1 text-[#9ECE6A]">
            <Check className="size-3" />
            <span className="truncate">Arrays</span>
          </div>
          <span className="text-[#414868]">→</span>
          <div className="flex flex-1 items-center gap-1 rounded border border-[#7AA2F7] bg-[#7AA2F7]/15 px-1.5 py-1 text-[#C0CAF5]">
            <span className="size-1.5 rounded-full bg-[#7DCFFF]" />
            <span className="truncate">Trees</span>
          </div>
          <span className="text-[#414868]">→</span>
          <div className="flex flex-1 items-center gap-1 rounded border border-[#292E42] bg-[#1A1B26] px-1.5 py-1 text-[#565F89]">
            <Lock className="size-2.5" />
            <span className="truncate">Graphs</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: "03",
    title: "Learn, Practice & Build",
    description:
      "Explore theoretical concepts, solve quizzes and implement algorithms in the integrated coding workspace.",
    icon: Code2,
    badgeColor: "text-[#BB9AF7] border-[#BB9AF7]/30 bg-[#BB9AF7]/10",
    visual: (
      <div className="rounded-xl border border-[#292E42] bg-[#15161E] p-3 text-left">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="font-semibold text-[#C0CAF5]">bst_search.cpp</span>
          <span className="rounded bg-[#7DCFFF]/15 px-1.5 py-0.5 text-[9px] text-[#7DCFFF]">
            O(log N)
          </span>
        </div>
        <div className="mt-1.5 space-y-0.5 font-mono text-[10px] text-[#565F89]">
          <p>
            <span className="text-[#7DCFFF]">Node*</span> find(Node* r, int k) &#123;
          </p>
          <p className="pl-2 text-[#C0CAF5]">
            <span className="text-[#FF9E64]">if</span> (r-&gt;val == k) return r;
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[#292E42]/60 pt-1.5 text-[10px] text-[#9ECE6A]">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Passed 4/4 Tests
          </span>
          <span className="font-mono text-[9px] text-[#565F89]">0.4ms</span>
        </div>
      </div>
    ),
  },
  {
    step: "04",
    title: "Receive Socratic AI Guidance",
    description:
      "When you encounter a mistake or need guidance, RAG-grounded Socratic AI generates contextual hints that help you reason through problems without revealing complete solutions.",
    icon: Brain,
    badgeColor: "text-[#FF9E64] border-[#FF9E64]/30 bg-[#FF9E64]/10",
    visual: (
      <div className="rounded-xl border border-[#7AA2F7]/40 bg-[#15161E] p-3 text-left">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C7A9FF]">
            <span className="size-1.5 rounded-full bg-[#C7A9FF]" />
            Tier 1 Hint
          </span>
          <span className="rounded border border-[#292E42] bg-[#1A1B26] px-1.5 py-0.5 text-[9px] text-[#7AA2F7]">
            RAG Active
          </span>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#A9B1D6]">
          &ldquo;What happens if <code className="text-[#7DCFFF]">root</code> is{" "}
          <code className="text-[#C0CAF5]">nullptr</code> before checking child nodes?&rdquo;
        </p>
        <p className="mt-2 border-t border-[#292E42]/60 pt-1 text-[9px] text-[#7AA2F7]">
          Guides reasoning • No code spoilers
        </p>
      </div>
    ),
  },
] as const

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#15161E] font-sans text-[#A9B1D6] selection:bg-[#7AA2F7]/30 selection:text-[#C0CAF5]">
      {/* Background Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-32 right-[-5%] h-[620px] w-[620px] rounded-full bg-[#7AA2F7]/12 blur-[160px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[900px] left-[-8%] h-[580px] w-[580px] rounded-full bg-[#BB9AF7]/10 blur-[160px]"
      />

      {/* ==================== 1. STICKY FLOATING NAVBAR ==================== */}
      <header className="sticky top-4 z-40 mx-auto w-full max-w-[1400px] px-4 shrink-0 transition-all sm:px-6 md:px-9">
        <nav className="relative flex items-center justify-between rounded-xl border border-[#292E42] bg-[#1A1B26]/95 px-5 py-2.5 shadow-xl backdrop-blur-md">
          {/* Logo & Slogan */}
          <div className="flex items-center">
            <Link
              href={LANDING_LINKS.brand}
              className="group flex items-center transition-opacity hover:opacity-95"
            >
              <BrandLogo size="md" priority />
            </Link>

            <div className="mx-4 hidden h-5 w-px bg-[#3B4261] md:block" />

            <p className="hidden text-xs text-[#A9B1D6] lg:block">
              {BRAND.slogan}
            </p>
          </div>

          {/* Centered Navbar Links: Fixed position in center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden items-center gap-8 md:flex pointer-events-auto">
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

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <PwaInstallButton />
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

      {/* ==================== 2. HERO SECTION (EXPANSIVE & SPACIOUS) ==================== */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-[1340px] flex-col justify-between px-5 pt-4 pb-6 md:px-9 lg:min-h-[calc(100vh-5.5rem)] lg:pt-6 lg:pb-8">
        <div className="my-auto grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* LEFT COLUMN (7/12): Clear typography, relaxed spacing, balanced hierarchy */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <div>
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#7AA2F7]/40 bg-[#1A1B26] px-4 py-1.5 text-xs font-medium text-[#A9B1D6]">
              <span className="font-mono text-[#7AA2F7]">&lt;/&gt;</span>
              <span>{BRAND.description}</span>
            </div>

            {/* Headline */}
            <h1 className="relative z-20 mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[48px] leading-[1.14]">
              <span className="block lg:whitespace-nowrap">
                <span className="text-[#7DCFFF]">Master </span>
                <span className="text-[#7AA2F7]">Data </span>
                <span className="text-[#FF9E64]">Structures</span>
              </span>
              <span className="mt-1.5 block lg:whitespace-nowrap">
                <span className="text-[#7DCFFF]">Through </span>
                <span className="text-[#7AA2F7]">Computational </span>
                <span className="text-[#FF9E64]">Thinking</span>
              </span>
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#A9B1D6] sm:text-base sm:leading-[1.75]">
              {BRAND.heroDescription}
            </p>
          </div>

          <div className="mt-8">
            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
              <Link
                href={LANDING_LINKS.exploreSkillTree}
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#7AA2F7] px-8 text-sm font-bold text-[#15161E] shadow-[0_0_30px_rgba(122,162,247,0.3)] transition-all hover:bg-[#8DB0FF] hover:shadow-[0_0_40px_rgba(122,162,247,0.45)] sm:text-base"
              >
                <span>Explore Skill Tree</span>
                <ArrowRight className="size-4.5 stroke-[2.5]" />
              </Link>
              <Link
                href={LANDING_LINKS.howItWorks}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#414868] bg-[#1A1B26]/80 px-6 text-sm font-semibold text-[#C0CAF5] transition-colors hover:border-[#7AA2F7] hover:bg-[#292E42]/60"
              >
                How It Works
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="mt-7 flex flex-wrap items-center gap-6 text-xs text-[#A9B1D6] sm:gap-8">
              {FEATURE_HIGHLIGHTS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.line1} className="flex items-center gap-6 sm:gap-8">
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4.5 shrink-0 text-[#7AA2F7]" />
                      <div className="leading-tight">
                        <span className="block">{item.line1}</span>
                        <span className="block">{item.line2}</span>
                      </div>
                    </div>
                    <div className="h-7 w-px bg-[#292E42]" />
                  </div>
                )
              })}

              {/* Mastery Tracking */}
              <div className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="size-4.5 shrink-0 text-[#7AA2F7]"
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

        {/* RIGHT COLUMN (5/12): Hero Interactive Learning Showcase */}
        <div className="relative select-none lg:col-span-5">
          {/* Subtle Ambient Glow behind preview */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#7AA2F7]/15 to-[#7DCFFF]/10 opacity-70 blur-2xl"
          />

          <div className="relative rounded-3xl border border-[#292E42] bg-[#1A1B26]/90 p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-md flex flex-col justify-between">
            {/* Top Bar of the Showcase Terminal */}
            <div className="flex items-center justify-between border-b border-[#292E42]/80 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#DB4B4B]/80" />
                <span className="size-2.5 rounded-full bg-[#FF9E64]/80" />
                <span className="size-2.5 rounded-full bg-[#9ECE6A]/80" />
                <span className="ml-2 font-mono text-[11px] text-[#565F89]">
                  interactive_skill_tree.dag
                </span>
              </div>

              {/* Syllabus Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#292E42] bg-[#15161E] px-3 py-1 text-[11px]">
                <span className="size-1.5 rounded-full bg-[#7DCFFF]" />
                <span className="font-mono text-[#A9B1D6]">
                  CS101_Syllabus.pdf
                </span>
                <span className="text-[#414868]">→</span>
                <span className="font-semibold text-[#7AA2F7]">
                  65% Mastered
                </span>
              </div>
            </div>

            {/* Skill Tree SVG - Spacious & Sharp */}
            <div className="my-4 flex items-center justify-center">
              <svg
                viewBox="0 0 460 210"
                className="h-[185px] w-full max-w-[480px] overflow-visible sm:h-[205px] xl:h-[220px]"
                aria-label="DSA Skill Tree Roadmap"
              >
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

            {/* Bottom 2 Live Preview Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-3 border-t border-[#292E42]/80">
              {/* Card 1: Code Sandbox */}
              <div className="rounded-xl border border-[#292E42] bg-[#15161E] p-3.5 font-mono text-[11px]">
                <div className="mb-2 flex items-center justify-between border-b border-[#292E42] pb-1.5">
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
                  <div className="-mx-1 rounded border-l-2 border-[#FF9E64] bg-[#FF9E64]/12 px-1.5 py-0.5 text-[#C0CAF5]">
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

              {/* Card 2: Socratic AI Hint */}
              <div className="flex flex-col justify-between rounded-xl border border-[#7AA2F7]/40 bg-[#15161E] p-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C7A9FF]">
                      <span className="size-2 rounded-full bg-[#C7A9FF]" />
                      Socratic Hint
                    </span>
                    <span className="rounded border border-[#292E42] bg-[#1A1B26] px-1.5 py-0.5 text-[9px] text-[#565F89]">
                      RAG
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#A9B1D6]">
                    &ldquo;What happens if{" "}
                    <code className="rounded bg-[#1A1B26] px-1 py-0.5 font-mono text-[#7DCFFF]">
                      r
                    </code>{" "}
                    reaches{" "}
                    <code className="rounded bg-[#1A1B26] px-1 py-0.5 font-mono text-[#C0CAF5]">
                      nullptr
                    </code>{" "}
                    before checking{" "}
                    <code className="rounded bg-[#1A1B26] px-1 py-0.5 font-mono text-[#FF9E64]">
                      r-&gt;val
                    </code>
                    ?&rdquo;
                  </p>
                </div>
                <div className="mt-2 border-t border-[#292E42] pt-1.5 text-[10px] text-[#7AA2F7]">
                  Guides logic • No spoilers
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Scroll cue smoothly bridging Hero to Features */}
        <div className="flex justify-center pt-4 pb-2">
          <a
            href={LANDING_LINKS.features}
            className="group inline-flex items-center gap-2 rounded-full border border-[#292E42] bg-[#1A1B26]/60 px-4 py-1.5 text-xs text-[#565F89] backdrop-blur-sm transition-all hover:border-[#7AA2F7]/50 hover:text-[#C0CAF5]"
          >
            <span className="font-mono text-[11px] tracking-wider uppercase">Scroll to explore</span>
            <ArrowRight className="size-3.5 rotate-90 text-[#7AA2F7] transition-transform group-hover:translate-y-0.5" />
          </a>
        </div>
      </section>

      {/* ==================== 3. SECTION 1 – FEATURES ==================== */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-[1340px] scroll-mt-24 px-5 pt-10 pb-16 md:px-9 lg:pt-14 lg:pb-20"
      >
        {/* Section Heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7AA2F7]/40 bg-[#1A1B26] px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#7AA2F7]">
            <span>WHY OFFBYONE</span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#C0CAF5] sm:text-3xl lg:text-4xl">
            Everything You Need to Master DSA
          </h2>

          <p className="mx-auto mt-3.5 max-w-2xl text-sm leading-relaxed text-[#A9B1D6] sm:text-base">
            A smarter way to learn, practice and understand Data Structures and
            Algorithms through AI-powered guidance.
          </p>
        </div>

        {/* 3 Unified Feature Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES_DATA.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#292E42] bg-[#1A1B26]/90 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#414868] hover:bg-[#1A1B26] hover:shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
              >
                <div>
                  {/* Top Bar: Icon + Step Index */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-12 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${card.iconBg}`}
                    >
                      <Icon className={`size-6 ${card.iconColor}`} />
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#565F89]">
                      FEATURE {card.id}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-5 text-base font-bold text-[#C0CAF5] transition-colors group-hover:text-[#7DCFFF] sm:text-lg">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#A9B1D6] sm:text-sm">
                    {card.description}
                  </p>

                  {/* Key Points List */}
                  <ul className="mt-6 space-y-2.5 border-t border-[#292E42]/70 pt-5 text-xs sm:text-sm">
                    {card.keyPoints.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2.5 text-[#C0CAF5]/90"
                      >
                        <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#7AA2F7]/15 text-[#7AA2F7]">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action Link */}
                <div className="mt-7 pt-2">
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#7AA2F7] transition-all group-hover:gap-2.5 group-hover:text-[#8DB0FF] sm:text-sm"
                  >
                    <span>{card.actionLabel}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ==================== 4. SECTION 2 – HOW IT WORKS ==================== */}
      <section
        id="how-it-works"
        className="relative z-10 mx-auto w-full max-w-[1340px] scroll-mt-24 px-5 py-14 md:px-9 lg:py-20"
      >
        {/* Section Heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7AA2F7]/40 bg-[#1A1B26] px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#7AA2F7]">
            <span>YOUR LEARNING JOURNEY</span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#C0CAF5] sm:text-3xl lg:text-4xl">
            From Syllabus to Smarter Thinking
          </h2>

          <p className="mx-auto mt-3.5 max-w-2xl text-sm leading-relaxed text-[#A9B1D6] sm:text-base">
            Four simple steps to turn your course materials into an interactive
            DSA learning experience.
          </p>
        </div>

        {/* 4-Step Process Timeline */}
        <div className="relative mt-12">
          {/* Connecting line across steps (Desktop only) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 left-[12%] right-[12%] hidden h-0.5 border-t-2 border-dashed border-[#292E42] lg:block"
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.step}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#292E42] bg-[#1A1B26]/85 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#414868] hover:bg-[#1A1B26]"
                >
                  <div>
                    {/* Step Number + Icon Header */}
                    <div className="relative z-10 mb-4 flex items-center justify-between">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl border font-mono text-xs font-bold transition-transform group-hover:scale-105 ${step.badgeColor}`}
                      >
                        <StepIcon className="size-5" />
                      </div>
                      <span className="font-mono text-xs font-extrabold tracking-wider text-[#565F89]">
                        STEP {step.step}
                      </span>
                    </div>

                    {/* Step Title */}
                    <h3 className="text-sm font-bold text-[#C0CAF5] transition-colors group-hover:text-[#7DCFFF] sm:text-base">
                      {step.title}
                    </h3>

                    {/* Step Description */}
                    <p className="mt-2 text-xs leading-relaxed text-[#A9B1D6]">
                      {step.description}
                    </p>
                  </div>

                  {/* Step Visual Preview Component */}
                  <div className="mt-5">{step.visual}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ==================== 5. FINAL CALL TO ACTION (CTA) ==================== */}
      <section className="relative z-10 mx-auto w-full max-w-[1340px] px-5 py-12 md:px-9 lg:py-16">
        <div className="relative overflow-hidden rounded-3xl border border-[#7AA2F7]/30 bg-gradient-to-b from-[#1A1B26] to-[#15161E] p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:p-12 lg:p-16">
          {/* Subtle Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#7AA2F7]/15 blur-[120px]"
          />

          <div className="relative z-10 mx-auto max-w-2xl">
            {/* Sparkle Icon */}
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#7AA2F7]/35 bg-[#7AA2F7]/12 text-[#7DCFFF]">
              <Sparkles className="size-5" />
            </div>

            {/* CTA Heading */}
            <h2 className="text-2xl font-extrabold tracking-tight text-[#C0CAF5] sm:text-3xl lg:text-4xl">
              Ready to Think Beyond the Bugs?
            </h2>

            {/* CTA Description */}
            <p className="mt-3.5 text-xs leading-relaxed text-[#A9B1D6] sm:text-sm">
              Start your DSA learning journey with personalized roadmaps and
              AI-powered guidance.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={LANDING_LINKS.getStarted}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7AA2F7] px-8 text-sm font-bold text-[#15161E] shadow-[0_0_30px_rgba(122,162,247,0.3)] transition-all hover:bg-[#8DB0FF] hover:shadow-[0_0_36px_rgba(122,162,247,0.45)]"
              >
                <span>Get Started</span>
                <ArrowRight className="size-4 stroke-[2.5]" />
              </Link>

              <Link
                href={LANDING_LINKS.exploreSkillTree}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#414868] bg-[#1A1B26] px-6 text-sm font-semibold text-[#C0CAF5] transition-colors hover:border-[#7AA2F7] hover:bg-[#292E42]/60"
              >
                Explore Skill Tree
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. CHÂN TRANG (FOOTER) ==================== */}
      <footer className="relative z-10 border-t border-[#292E42]/80 bg-[#15161E] px-5 pt-10 pb-8 md:px-9">
        <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-8">
          {/* Top Row: Brand & Quick Navigation */}
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* Brand Logo & Slogan */}
            <div className="flex flex-col items-center gap-2 md:items-start">
              <Link href={LANDING_LINKS.brand}>
                <BrandLogo size="md" />
              </Link>
              <p className="text-xs text-[#565F89]">
                {BRAND.slogan} • {BRAND.description}
              </p>
            </div>

            {/* Quick Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#A9B1D6]">
              <Link
                href={LANDING_LINKS.features}
                className="transition-colors hover:text-[#C0CAF5]"
              >
                Features
              </Link>
              <Link
                href={LANDING_LINKS.howItWorks}
                className="transition-colors hover:text-[#C0CAF5]"
              >
                How It Works
              </Link>
              <Link
                href={LANDING_LINKS.exploreSkillTree}
                className="transition-colors hover:text-[#C0CAF5]"
              >
                Skill Tree
              </Link>
              <Link
                href={LANDING_LINKS.login}
                className="transition-colors hover:text-[#C0CAF5]"
              >
                Log In
              </Link>
              <Link
                href={LANDING_LINKS.getStarted}
                className="font-semibold text-[#7AA2F7] transition-colors hover:text-[#8DB0FF]"
              >
                Get Started
              </Link>
            </nav>
          </div>

          {/* Divider with Center Tagline */}
          <div className="relative flex items-center justify-center py-2">
            <div className="grow border-t border-[#292E42]/80" />
            <p className="mx-4 text-center font-mono text-[11px] tracking-wide text-[#565F89]">
              {BRAND.tagline}
            </p>
            <div className="grow border-t border-[#292E42]/80" />
          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col items-center justify-between gap-2 text-[11px] text-[#565F89] sm:flex-row">
            <p>{BRAND.copyright}</p>
            <p>Master Data Structures through Computational Thinking</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
