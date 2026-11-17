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
import { ThemeToggleButton } from "@/components/theme-toggle-button"

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
    title: "Personalized Learning Roadmap",
    description:
      "Turn course syllabi and learning materials into structured roadmaps with organized topics, learning objectives, and meaningful learning progression.",
    keyPoints: [
      "Syllabus-Based Topic Extraction",
      "Prerequisite & Dependency Mapping",
      "Interactive Learning Tree",
    ],
    icon: GitBranch,
    iconColor: "text-cyan",
    iconBg: "bg-cyan/10 border-cyan/30",
    href: LANDING_LINKS.exploreSkillTree,
    actionLabel: "Explore Roadmap",
  },
  {
    id: "02",
    title: "Interactive Learning Workspace",
    description:
      "Explore concepts, review learning materials, and complete interactive learning activities in an integrated environment designed to strengthen your understanding.",
    keyPoints: [
      "Concept Theory & Interactive Quizzes",
      "Hands-On Practice Environment",
      "Execution & Instant Feedback",
      "Comprehension Tracking",
    ],
    icon: Code2,
    iconColor: "text-primary",
    iconBg: "bg-primary/10 border-primary/30",
    href: LANDING_LINKS.workspace,
    actionLabel: "Open Workspace",
  },
  {
    id: "03",
    title: "Context-Aware Socratic AI",
    description:
      "Receive personalized, progressive hints grounded in learning materials and task context. Develop your reasoning skills instead of relying on ready-made answers.",
    keyPoints: [
      "RAG-Grounded Guidance",
      "Progressive Socratic Hints",
      "Independent Problem Solving",
    ],
    icon: BrainCircuit,
    iconColor: "text-purple",
    iconBg: "bg-purple/10 border-purple/30",
    href: LANDING_LINKS.workspace,
    actionLabel: "Try Socratic AI",
  },
] as const

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Upload Your Learning Materials",
    description:
      "Provide your course syllabus and relevant learning resources in PDF format to get started.",
    icon: FileUp,
    badgeColor: "text-cyan border-cyan/30 bg-cyan/10",
    visual: (
      <div className="rounded-xl border border-border-subtle bg-background p-3 text-left">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cyan/15 text-cyan">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] font-semibold text-text-primary">
              CS101_Syllabus.pdf
            </p>
            <p className="text-[10px] text-text-muted">2.4 MB • PDF Document</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-border-subtle/60 pt-2 text-[10px]">
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 className="size-3" />
            Uploaded &amp; Parsed
          </span>
          <span className="font-mono text-text-muted">100%</span>
        </div>
      </div>
    ),
  },
  {
    step: "02",
    title: "Generate Your Learning Roadmap",
    description:
      "Transform learning materials into an organized roadmap that helps you navigate topics, prerequisites, and learning objectives.",
    icon: GitFork,
    badgeColor: "text-primary border-primary/30 bg-primary/10",
    visual: (
      <div className="rounded-xl border border-border-subtle bg-background p-3 text-left">
        <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
          <span>Skill Tree DAG</span>
          <span className="text-primary">3 Nodes Connected</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-1.5 font-mono text-[10px]">
          <div className="flex flex-1 items-center gap-1 rounded border border-success/40 bg-success/10 px-1.5 py-1 text-success">
            <Check className="size-3" />
            <span className="truncate">Arrays</span>
          </div>
          <span className="text-border">→</span>
          <div className="flex flex-1 items-center gap-1 rounded border border-primary bg-primary/15 px-1.5 py-1 text-text-primary">
            <span className="size-1.5 rounded-full bg-cyan" />
            <span className="truncate">Trees</span>
          </div>
          <span className="text-border">→</span>
          <div className="flex flex-1 items-center gap-1 rounded border border-border-subtle bg-surface px-1.5 py-1 text-text-muted">
            <Lock className="size-2.5" />
            <span className="truncate">Graphs</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: "03",
    title: "Explore, Learn & Practice",
    description:
      "Study concepts, verify comprehension through quizzes, and complete interactive learning activities in the integrated workspace.",
    icon: Code2,
    badgeColor: "text-purple border-purple/30 bg-purple/10",
    visual: (
      <div className="rounded-xl border border-border-subtle bg-background p-3 text-left">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="font-semibold text-text-primary">bst_search.cpp</span>
          <span className="rounded bg-cyan/15 px-1.5 py-0.5 text-[9px] text-cyan">
            O(log N)
          </span>
        </div>
        <div className="mt-1.5 space-y-0.5 font-mono text-[10px] text-text-muted">
          <p>
            <span className="text-cyan">Node*</span> find(Node* r, int k) &#123;
          </p>
          <p className="pl-2 text-text-primary">
            <span className="text-warning">if</span> (r-&gt;val == k) return r;
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border-subtle/60 pt-1.5 text-[10px] text-success">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Passed 4/4 Tests
          </span>
          <span className="font-mono text-[9px] text-text-muted">0.4ms</span>
        </div>
      </div>
    ),
  },
  {
    step: "04",
    title: "Receive Socratic AI Guidance",
    description:
      "Get context-aware hints that guide your thinking and help you overcome learning challenges independently without spoiling solutions.",
    icon: Brain,
    badgeColor: "text-warning border-warning/30 bg-warning/10",
    visual: (
      <div className="rounded-xl border border-primary/40 bg-background p-3 text-left">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple">
            <span className="size-1.5 rounded-full bg-purple" />
            Tier 1 Hint
          </span>
          <span className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px] text-primary">
            RAG Active
          </span>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-text-secondary">
          &ldquo;What happens if <code className="text-cyan">root</code> is{" "}
          <code className="text-text-primary">nullptr</code> before checking child nodes?&rdquo;
        </p>
        <p className="mt-2 border-t border-border-subtle/60 pt-1 text-[9px] text-primary">
          Guides reasoning • No code spoilers
        </p>
      </div>
    ),
  },
] as const

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-text-secondary selection:bg-primary/30 selection:text-text-primary">
      {/* 1. Architectural Background Grid with Subtle Radial Mask */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_60%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_60%,transparent_100%)]"
        aria-hidden="true"
      />

      {/* ==================== 1. FULL-WIDTH EDGE-TO-EDGE HEADER ==================== */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          {/* Logo & Slogan */}
          <div className="flex items-center">
            <Link
              href={LANDING_LINKS.brand}
              className="group flex items-center transition-opacity hover:opacity-95"
            >
              <BrandLogo size="md" priority />
            </Link>

            <div className="mx-4 hidden h-5 w-px bg-surface-elevated md:block" />

            <p className="hidden text-xs text-text-secondary lg:block">
              {BRAND.slogan}
            </p>
          </div>

          {/* Centered Navbar Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href={LANDING_LINKS.features}
              className="text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Features
            </Link>
            <Link
              href={LANDING_LINKS.howItWorks}
              className="text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              How It Works
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <PwaInstallButton />
            <ThemeToggleButton />
            {isAuthenticated ? (
              <UserProfileMenu />
            ) : (
              <>
                <Link
                  href={LANDING_LINKS.login}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-xs font-semibold text-text-primary transition-colors hover:border-primary hover:bg-surface-elevated"
                >
                  Log In
                </Link>
                <Link
                  href={LANDING_LINKS.getStarted}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-semibold text-white dark:text-[#15161E] shadow-sm transition-colors hover:bg-primary-hover"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==================== 2. HERO SECTION (EXPANSIVE & SPACIOUS) ==================== */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-between px-6 pt-6 pb-8">
        <div className="my-auto grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
        {/* LEFT COLUMN (6/12): Clear typography, relaxed spacing, balanced hierarchy */}
        <div className="flex flex-col justify-center lg:col-span-6">
          <div>
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-surface px-4 py-1.5 text-xs font-medium text-text-secondary">
              <span className="font-mono text-primary">&lt;/&gt;</span>
              <span>{BRAND.description}</span>
            </div>

            {/* Headline: Clean, unified typography with single accent */}
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[46px] leading-[1.15]">
              Turn Your Learning Materials <br className="hidden sm:inline" />
              Into <span className="text-primary">a Clear Path Forward.</span>
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base sm:leading-[1.75]">
              {BRAND.heroDescription}
            </p>
          </div>

          <div className="mt-8">
            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
              <Link
                href={LANDING_LINKS.exploreSkillTree}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-white dark:text-[#15161E] shadow-sm transition-colors hover:bg-primary-hover sm:text-base"
              >
                <span>Explore Your Learning Path</span>
                <ArrowRight className="size-4 stroke-[2]" />
              </Link>
              <Link
                href={LANDING_LINKS.howItWorks}
                className="inline-flex h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-5 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:bg-surface-elevated"
              >
                How It Works
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="mt-7 flex flex-wrap items-center gap-6 text-xs text-text-secondary sm:gap-8">
              {FEATURE_HIGHLIGHTS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.line1} className="flex items-center gap-6 sm:gap-8">
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4.5 shrink-0 text-primary" />
                      <div className="leading-tight">
                        <span className="block">{item.line1}</span>
                        <span className="block">{item.line2}</span>
                      </div>
                    </div>
                    <div className="h-7 w-px bg-surface-elevated" />
                  </div>
                )
              })}

              {/* Mastery Tracking */}
              <div className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="size-4.5 shrink-0 text-primary"
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
                <span>Learning Progress Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (6/12): Hero Interactive Learning Showcase */}
        <div className="relative select-none lg:col-span-6">
          {/* Subtle Ambient Depth Glow behind DAG mockup */}
          <div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-primary/[0.04] blur-[120px]"
            aria-hidden="true"
          />

          <div className="relative rounded-xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            {/* Top Bar of the Showcase Terminal */}
            <div className="flex items-center justify-between border-b border-border-subtle/80 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-danger/80" />
                <span className="size-2.5 rounded-full bg-warning/80" />
                <span className="size-2.5 rounded-full bg-success/80" />
                <span className="ml-2 font-mono text-[11px] text-text-muted">
                  interactive_skill_tree.dag
                </span>
              </div>

              {/* Syllabus Pill */}
              <div className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-secondary px-2.5 py-1 text-[11px]">
                <span className="size-1.5 rounded-full bg-cyan" />
                <span className="font-mono text-text-secondary">
                  CS101_Syllabus.pdf
                </span>
                <span className="text-border">→</span>
                <span className="font-semibold text-primary font-mono tabular-nums">
                  65% Mastered
                </span>
              </div>
            </div>

            {/* Skill Tree SVG Canvas with Architectural Dot Grid Background */}
            <div className="relative my-3 flex items-center justify-center rounded-lg border border-border-subtle/70 bg-surface-secondary/40 bg-[radial-gradient(var(--dot-grid-color,rgba(255,255,255,0.08))_1px,transparent_1px)] [background-size:16px_16px] p-2.5 sm:p-3">
              <svg
                viewBox="0 0 460 215"
                className="h-[195px] w-full max-w-[520px] overflow-visible sm:h-[215px] xl:h-[235px]"
                aria-label="DSA Skill Tree Roadmap"
              >
                {/* Connecting Dependency Edges */}
                {[
                  {
                    x1: 230,
                    y1: 32,
                    r1: 18,
                    x2: 130,
                    y2: 102,
                    r2: 18,
                    color: "var(--color-primary)",
                    dashed: false,
                  },
                  {
                    x1: 230,
                    y1: 32,
                    r1: 18,
                    x2: 330,
                    y2: 102,
                    r2: 18,
                    color: "var(--color-primary)",
                    dashed: false,
                  },
                  {
                    x1: 130,
                    y1: 102,
                    r1: 18,
                    x2: 75,
                    y2: 172,
                    r2: 17,
                    color: "var(--color-border)",
                    dashed: true,
                  },
                  {
                    x1: 330,
                    y1: 102,
                    r1: 18,
                    x2: 230,
                    y2: 172,
                    r2: 17,
                    color: "var(--color-warning)",
                    dashed: false,
                  },
                  {
                    x1: 330,
                    y1: 102,
                    r1: 18,
                    x2: 385,
                    y2: 172,
                    r2: 17,
                    color: "var(--color-border)",
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

                {/* Structured Tech Nodes with Outer Ring & Status Badges */}
                {[
                  {
                    code: "01",
                    label: "Arrays & Big-O",
                    status: "DONE",
                    x: 230,
                    y: 32,
                    r: 18,
                    border: "var(--color-success)",
                    codeColor: "var(--color-success)",
                    badgeColor: "var(--color-success)",
                    badgeBg: "rgba(16, 185, 129, 0.14)",
                    badgeBorder: "rgba(16, 185, 129, 0.35)",
                    badgeX: 256,
                    badgeY: 28,
                    badgeW: 36,
                    labelX: 256,
                    labelY: 21,
                    labelAnchor: "start" as const,
                  },
                  {
                    code: "02",
                    label: "Linked Lists",
                    status: "DONE",
                    x: 130,
                    y: 102,
                    r: 18,
                    border: "var(--color-success)",
                    codeColor: "var(--color-success)",
                    badgeColor: "var(--color-success)",
                    badgeBg: "rgba(16, 185, 129, 0.14)",
                    badgeBorder: "rgba(16, 185, 129, 0.35)",
                    badgeX: 50,
                    badgeY: 98,
                    badgeW: 36,
                    labelX: 104,
                    labelY: 92,
                    labelAnchor: "end" as const,
                  },
                  {
                    code: "03",
                    label: "Trees & Recursion",
                    status: "ACTIVE",
                    x: 330,
                    y: 102,
                    r: 18,
                    border: "var(--color-primary)",
                    codeColor: "var(--color-primary)",
                    badgeColor: "var(--color-primary)",
                    badgeBg: "rgba(129, 140, 248, 0.14)",
                    badgeBorder: "rgba(129, 140, 248, 0.35)",
                    badgeX: 356,
                    badgeY: 98,
                    badgeW: 42,
                    labelX: 356,
                    labelY: 92,
                    labelAnchor: "start" as const,
                  },
                  {
                    code: "04",
                    label: "Hash Tables",
                    status: "LOCKED",
                    x: 75,
                    y: 172,
                    r: 17,
                    border: "var(--color-border)",
                    codeColor: "var(--color-text-muted)",
                    badgeColor: "var(--color-text-muted)",
                    badgeBg: "var(--color-surface)",
                    badgeBorder: "var(--color-border-subtle)",
                    badgeX: 55,
                    badgeY: 201,
                    badgeW: 40,
                    labelX: 75,
                    labelY: 198,
                    labelAnchor: "middle" as const,
                  },
                  {
                    code: "05",
                    label: "Binary Search Tree",
                    status: "ACTIVE",
                    x: 230,
                    y: 172,
                    r: 17,
                    border: "var(--color-warning)",
                    codeColor: "var(--color-warning)",
                    badgeColor: "var(--color-warning)",
                    badgeBg: "rgba(245, 158, 11, 0.14)",
                    badgeBorder: "rgba(245, 158, 11, 0.35)",
                    badgeX: 209,
                    badgeY: 201,
                    badgeW: 42,
                    labelX: 230,
                    labelY: 198,
                    labelAnchor: "middle" as const,
                  },
                  {
                    code: "06",
                    label: "Heaps & PQ",
                    status: "LOCKED",
                    x: 385,
                    y: 172,
                    r: 17,
                    border: "var(--color-border)",
                    codeColor: "var(--color-text-muted)",
                    badgeColor: "var(--color-text-muted)",
                    badgeBg: "var(--color-surface)",
                    badgeBorder: "var(--color-border-subtle)",
                    badgeX: 365,
                    badgeY: 201,
                    badgeW: 40,
                    labelX: 385,
                    labelY: 198,
                    labelAnchor: "middle" as const,
                  },
                ].map((node) => (
                  <g key={node.label}>
                    {/* Outer Ring */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 4}
                      fill="var(--color-surface-elevated)"
                      opacity="0.85"
                    />

                    {/* Main Node Body */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r}
                      fill="var(--color-surface)"
                      stroke={node.border}
                      strokeWidth="2"
                    />

                    {/* Code Identifier */}
                    <text
                      x={node.x}
                      y={node.y + 3.5}
                      textAnchor="middle"
                      fill={node.codeColor}
                      fontSize="10"
                      fontWeight="700"
                      className="font-mono tabular-nums"
                    >
                      {node.code}
                    </text>

                    {/* Node Label */}
                    <text
                      x={node.labelX}
                      y={node.labelY}
                      textAnchor={node.labelAnchor}
                      fill={node.status === "LOCKED" ? "var(--color-text-muted)" : "var(--color-text-primary)"}
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      {node.label}
                    </text>

                    {/* Compact Tech Status Badge */}
                    <rect
                      x={node.badgeX}
                      y={node.badgeY}
                      width={node.badgeW}
                      height="12"
                      rx="3"
                      fill={node.badgeBg}
                      stroke={node.badgeBorder}
                      strokeWidth="1"
                    />
                    <text
                      x={node.badgeX + node.badgeW / 2}
                      y={node.badgeY + 8.5}
                      textAnchor="middle"
                      fill={node.badgeColor}
                      fontSize="7.5"
                      fontWeight="700"
                      className="font-mono tracking-wider"
                    >
                      {node.status}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Bottom 2 Live Preview Cards */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-3.5 border-t border-border-subtle/80">
              {/* Card 1: Code Sandbox */}
              <div className="rounded-xl border border-border-subtle bg-background p-3.5 font-mono text-[11px]">
                <div className="mb-2 flex items-center justify-between border-b border-border-subtle pb-1.5">
                  <span className="font-semibold text-text-primary">
                    bst_search.cpp
                  </span>
                  <span className="rounded bg-cyan/15 px-1.5 py-0.5 text-[10px] text-cyan">
                    O(log N)
                  </span>
                </div>
                <div className="space-y-0.5 leading-relaxed">
                  <div className="text-text-muted">
                    <span className="text-cyan">Node*</span>{" "}
                    <span className="text-primary">find</span>(Node* r,{" "}
                    <span className="text-cyan">int</span> k) &#123;
                  </div>
                  <div className="-mx-1 rounded border-l-2 border-warning bg-warning/12 px-1.5 py-0.5 text-text-primary">
                    <span className="text-warning">if</span> (r-&gt;val == k){" "}
                    <span className="text-cyan">return</span> r;
                  </div>
                  <div className="pl-2 text-text-secondary">
                    <span className="text-cyan">return</span>{" "}
                    find(r-&gt;left, k);
                  </div>
                  <div className="text-text-muted">&#125;</div>
                </div>
              </div>

              {/* Card 2: Socratic AI Hint */}
              <div className="flex flex-col justify-between rounded-xl border border-primary/40 bg-background p-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple">
                      <span className="size-2 rounded-full bg-purple" />
                      Socratic Hint
                    </span>
                    <span className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px] text-text-muted">
                      RAG
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
                    &ldquo;What happens if{" "}
                    <code className="rounded bg-surface px-1 py-0.5 font-mono text-cyan">
                      r
                    </code>{" "}
                    reaches{" "}
                    <code className="rounded bg-surface px-1 py-0.5 font-mono text-text-primary">
                      nullptr
                    </code>{" "}
                    before checking{" "}
                    <code className="rounded bg-surface px-1 py-0.5 font-mono text-warning">
                      r-&gt;val
                    </code>
                    ?&rdquo;
                  </p>
                </div>
                <div className="mt-2 border-t border-border-subtle pt-1.5 text-[10px] text-primary">
                  Guides logic • No spoilers
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* ==================== 5. STRUCTURAL TECHNICAL METRICS STRIP ==================== */}
        <div className="mt-10 w-full border-t border-border-subtle/80 pt-6 pb-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <GitBranch className="size-4.5" />
              </div>
              <div className="leading-tight">
                <p className="font-mono text-sm font-bold text-text-primary tabular-nums">10 Core DSA Modules</p>
                <p className="text-[11px] text-text-muted">Structured Topic Graph</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:border-l sm:border-border-subtle/60 sm:pl-6">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-cyan/30 bg-cyan/10 text-cyan">
                <Code2 className="size-4.5" />
              </div>
              <div className="leading-tight">
                <p className="font-mono text-sm font-bold text-text-primary tabular-nums">30 Interactive Tasks</p>
                <p className="text-[11px] text-text-muted">Theory, Quiz &amp; Code</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border-subtle/60 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-purple/30 bg-purple/10 text-purple">
                <Shield className="size-4.5" />
              </div>
              <div className="leading-tight">
                <p className="font-mono text-sm font-bold text-text-primary">RAG Syllabus Grounding</p>
                <p className="text-[11px] text-text-muted">Context-Aware Alignment</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border-subtle/60 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-warning/30 bg-warning/10 text-warning">
                <BrainCircuit className="size-4.5" />
              </div>
              <div className="leading-tight">
                <p className="font-mono text-sm font-bold text-text-primary">3-Tier Socratic Guardrails</p>
                <p className="text-[11px] text-text-muted">Zero Spoiler Guidance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 3. SECTION 1 – FEATURES ==================== */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-6 pt-10 pb-16 lg:pt-14 lg:pb-20"
      >
        {/* Section Heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-surface px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
            <span>WHY OFFBYONE</span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
            Everything You Need for Smarter Learning
          </h2>

          <p className="mx-auto mt-3.5 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
            A smarter way to navigate course syllabi, practice interactively, and
            understand complex concepts through AI-powered guidance.
          </p>
        </div>

        {/* 3 Unified Feature Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES_DATA.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-5 shadow-sm transition-colors duration-150 hover:border-border hover:bg-surface-elevated"
              >
                <div>
                  {/* Top Bar: Icon + Step Index */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg border ${card.iconBg}`}
                    >
                      <Icon className={`size-5 ${card.iconColor}`} />
                    </div>
                    <span className="font-mono text-xs font-semibold text-text-muted">
                      FEATURE {card.id}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-4 text-base font-bold text-text-primary transition-colors group-hover:text-cyan sm:text-lg">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-text-secondary sm:text-sm">
                    {card.description}
                  </p>

                  {/* Key Points List */}
                  <ul className="mt-6 space-y-2.5 border-t border-border-subtle/70 pt-5 text-xs sm:text-sm">
                    {card.keyPoints.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2.5 text-text-primary/90"
                      >
                        <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
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
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary transition-all group-hover:gap-2.5 group-hover:text-primary-hover sm:text-sm"
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
        className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-14 lg:py-20"
      >
        {/* Section Heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-surface px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            <span>YOUR LEARNING JOURNEY</span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
            From Syllabus to Deeper Understanding
          </h2>

          <p className="mx-auto mt-3.5 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
            Four simple steps to transform raw course materials into an active,
            guided learning experience.
          </p>
        </div>

        {/* 4-Step Process Timeline */}
        <div className="relative mt-12">
          {/* Connecting line across steps (Desktop only) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 left-[12%] right-[12%] hidden h-0.5 border-t-2 border-dashed border-border-subtle lg:block"
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.step}
                  className="group relative flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-4 shadow-sm transition-colors duration-150 hover:border-border hover:bg-surface-elevated"
                >
                  <div>
                    {/* Step Number + Icon Header */}
                    <div className="relative z-10 mb-4 flex items-center justify-between">
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg border font-mono text-xs font-bold ${step.badgeColor}`}
                      >
                        <StepIcon className="size-4" />
                      </div>
                      <span className="font-mono text-xs font-extrabold tracking-wider text-text-muted">
                        STEP {step.step}
                      </span>
                    </div>

                    {/* Step Title */}
                    <h3 className="text-sm font-bold text-text-primary transition-colors group-hover:text-cyan sm:text-base">
                      {step.title}
                    </h3>

                    {/* Step Description */}
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
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
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 lg:py-16">
        <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface p-8 text-center shadow-sm sm:p-12">
          <div className="relative z-10 mx-auto max-w-2xl">
            {/* Sparkle Icon */}
            <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-cyan">
              <Sparkles className="size-4" />
            </div>

            {/* CTA Heading */}
            <h2 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              Ready to Take Control of Your Learning?
            </h2>

            {/* CTA Description */}
            <p className="mt-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
              Start your learning journey with a smarter, more structured approach.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={LANDING_LINKS.getStarted}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-white dark:text-[#15161E] shadow-sm transition-colors hover:bg-primary-hover"
              >
                <span>Get Started</span>
                <ArrowRight className="size-4 stroke-[2]" />
              </Link>

              <Link
                href={LANDING_LINKS.exploreSkillTree}
                className="inline-flex h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-6 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:bg-surface-elevated"
              >
                Explore Your Learning Path
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. CHÂN TRANG (FOOTER) ==================== */}
      <footer className="relative z-10 border-t border-border-subtle/80 bg-background px-6 pt-10 pb-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          {/* Top Row: Brand & Quick Navigation */}
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* Brand Logo & Slogan */}
            <div className="flex flex-col items-center gap-2 md:items-start">
              <Link href={LANDING_LINKS.brand}>
                <BrandLogo size="md" />
              </Link>
              <p className="text-xs text-text-muted">
                {BRAND.slogan} • {BRAND.description}
              </p>
            </div>

            {/* Quick Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-secondary">
              <Link
                href={LANDING_LINKS.features}
                className="transition-colors hover:text-text-primary"
              >
                Features
              </Link>
              <Link
                href={LANDING_LINKS.howItWorks}
                className="transition-colors hover:text-text-primary"
              >
                How It Works
              </Link>
              <Link
                href={LANDING_LINKS.exploreSkillTree}
                className="transition-colors hover:text-text-primary"
              >
                Skill Tree
              </Link>
              <Link
                href={LANDING_LINKS.login}
                className="transition-colors hover:text-text-primary"
              >
                Log In
              </Link>
              <Link
                href={LANDING_LINKS.getStarted}
                className="font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                Get Started
              </Link>
            </nav>
          </div>

          {/* Divider with Center Tagline */}
          <div className="relative flex items-center justify-center py-2">
            <div className="grow border-t border-border-subtle/80" />
            <p className="mx-4 text-center font-mono text-[11px] tracking-wide text-text-muted">
              {BRAND.tagline}
            </p>
            <div className="grow border-t border-border-subtle/80" />
          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col items-center justify-between gap-2 text-[11px] text-text-muted sm:flex-row">
            <p>{BRAND.copyright}</p>
            <p>Master Concepts Through Independent &amp; Computational Thinking</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
