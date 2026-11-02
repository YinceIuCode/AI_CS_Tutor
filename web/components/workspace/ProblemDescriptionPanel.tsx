"use client"

import * as React from "react"
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileCode2,
  HelpCircle,
  Info,
  Lightbulb,
  Maximize2,
  PanelLeftClose,
  Terminal,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProblemExample {
  input: string
  output: string
  explanation?: string
}

export interface ProblemDetail {
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  description: string
  inputFormat: string
  outputFormat: string
  examples: ProblemExample[]
  constraints: string[]
  notes?: string
}

export interface ProblemDescriptionPanelProps {
  problem?: ProblemDetail | null
  taskTitle?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

/**
 * Format inline backtick code snippets (e.g. `node->left`, `nullptr`, `O(1)`)
 * into styled semantic tokens without bringing in heavy markdown parsers.
 */
function renderFormattedInlineText(text: string) {
  if (!text) return null
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1)
      return (
        <code
          key={index}
          className="rounded-md border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan selection:bg-cyan/20"
        >
          {code}
        </code>
      )
    }
    return <span key={index}>{part}</span>
  })
}

/**
 * Difficulty badge color resolver using OffByOne semantic tokens.
 */
function getDifficultyBadge(difficulty: "Easy" | "Medium" | "Hard" = "Medium") {
  switch (difficulty) {
    case "Easy":
      return {
        label: "Easy",
        className: "border-success/30 bg-success/10 text-success",
        dotColor: "bg-success",
      }
    case "Hard":
      return {
        label: "Hard",
        className: "border-danger/30 bg-danger/10 text-danger",
        dotColor: "bg-danger",
      }
    case "Medium":
    default:
      return {
        label: "Medium",
        className: "border-warning/30 bg-warning/10 text-warning",
        dotColor: "bg-warning",
      }
  }
}

/**
 * Problem Description Panel:
 * A LeetCode/Codeforces-style interactive problem specification panel
 * positioned adjacent to the Monaco Code Editor.
 */
export function ProblemDescriptionPanel({
  problem,
  taskTitle,
  isCollapsed,
  onToggleCollapse,
  className,
}: ProblemDescriptionPanelProps) {
  const [copiedExampleIndex, setCopiedExampleIndex] = React.useState<number | null>(
    null
  )

  const handleCopy = (text: string, index: number) => {
    if (!navigator?.clipboard) return
    navigator.clipboard.writeText(text)
    setCopiedExampleIndex(index)
    setTimeout(() => {
      setCopiedExampleIndex(null)
    }, 1800)
  }

  // Fallback if problem data is still loading
  if (!problem) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center p-6 text-center text-text-muted",
          className
        )}
      >
        <BookOpen className="size-8 text-cyan/50 animate-pulse mb-3" />
        <p className="text-xs font-medium">Loading problem description...</p>
      </div>
    )
  }

  const badge = getDifficultyBadge(problem.difficulty)

  return (
    <aside
      aria-label="Problem Description"
      className={cn(
        "flex h-full flex-col overflow-hidden bg-surface-secondary select-text",
        className
      )}
    >
      {/* 1. Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-cyan/10 text-cyan">
            <BookOpen className="size-3.5" />
          </div>
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider truncate">
            Description
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              badge.className
            )}
          >
            <span className={cn("size-1.5 rounded-full", badge.dotColor)} />
            {badge.label}
          </span>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse Problem Description"
            aria-label="Collapse Problem Description"
            className="hidden lg:inline-flex size-6 cursor-pointer items-center justify-center rounded-md border border-border-subtle bg-surface-secondary text-text-muted transition-colors hover:border-cyan/50 hover:text-cyan"
          >
            <PanelLeftClose className="size-3.5" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-text-secondary text-xs sm:text-[13px] leading-relaxed custom-scrollbar">
        {/* Title */}
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-text-primary tracking-tight">
            {problem.title || taskTitle || "Problem Specification"}
          </h2>
        </div>

        {/* Description Body */}
        <div className="space-y-2.5">
          {problem.description.split("\n\n").map((para, i) => (
            <p key={i} className="text-text-secondary leading-relaxed">
              {renderFormattedInlineText(para)}
            </p>
          ))}
        </div>

        {/* Input & Output Format */}
        <div className="space-y-2.5 rounded-xl border border-border-subtle bg-surface/60 p-3.5">
          <div>
            <span className="font-semibold text-text-primary text-[11px] uppercase tracking-wider block mb-1">
              Input Format
            </span>
            <div className="text-text-secondary leading-relaxed text-[12px]">
              {renderFormattedInlineText(problem.inputFormat)}
            </div>
          </div>
          <div className="border-t border-border-subtle/70 pt-2.5">
            <span className="font-semibold text-text-primary text-[11px] uppercase tracking-wider block mb-1">
              Output Format
            </span>
            <div className="text-text-secondary leading-relaxed text-[12px]">
              {renderFormattedInlineText(problem.outputFormat)}
            </div>
          </div>
        </div>

        {/* Examples Section */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-primary">
              <Terminal className="size-3.5 text-cyan" />
              <span>Examples</span>
            </div>

            <div className="space-y-3">
              {problem.examples.map((example, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border-subtle bg-surface/70 overflow-hidden"
                >
                  {/* Example Header */}
                  <div className="flex items-center justify-between border-b border-border-subtle/80 bg-surface px-3 py-1.5 text-[11px] font-semibold text-text-muted">
                    <span>Example {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(example.input, idx)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-text-muted hover:text-cyan transition-colors"
                      title="Copy example input"
                    >
                      {copiedExampleIndex === idx ? (
                        <>
                          <Check className="size-2.5 text-success" />
                          <span className="text-success font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-2.5" />
                          <span>Copy Input</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Example Body */}
                  <div className="p-3 space-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-text-muted block text-[10px] font-sans font-medium uppercase tracking-wider mb-1">
                        Input
                      </span>
                      <pre className="rounded-lg border border-border-subtle bg-background p-2 text-text-primary overflow-x-auto whitespace-pre-wrap leading-snug">
                        {example.input}
                      </pre>
                    </div>

                    <div>
                      <span className="text-text-muted block text-[10px] font-sans font-medium uppercase tracking-wider mb-1">
                        Output
                      </span>
                      <pre className="rounded-lg border border-border-subtle bg-background p-2 text-cyan overflow-x-auto whitespace-pre-wrap leading-snug font-bold">
                        {example.output}
                      </pre>
                    </div>

                    {example.explanation && (
                      <div className="pt-1 text-[11px] font-sans font-normal text-text-muted leading-relaxed">
                        <span className="font-semibold text-text-primary">
                          Explanation:{" "}
                        </span>
                        {renderFormattedInlineText(example.explanation)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints Section */}
        {problem.constraints && problem.constraints.length > 0 && (
          <div className="space-y-2">
            <span className="font-bold text-text-primary text-xs uppercase tracking-wider block">
              Constraints:
            </span>
            <ul className="space-y-1 rounded-xl border border-border-subtle bg-surface/50 p-3 pl-6 list-disc font-mono text-[11px] text-text-secondary marker:text-cyan">
              {problem.constraints.map((constraint, idx) => (
                <li key={idx} className="leading-snug">
                  {renderFormattedInlineText(constraint)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Notes (if present) */}
        {problem.notes && (
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/8 p-3 text-xs leading-relaxed text-text-secondary">
            <Lightbulb className="size-4 shrink-0 text-primary mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold text-text-primary block mb-0.5">
                Note:
              </span>
              <span>{renderFormattedInlineText(problem.notes)}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
