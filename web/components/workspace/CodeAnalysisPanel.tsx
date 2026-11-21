"use client"

import * as React from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExecutionResult } from "@/services/executionService"

export interface CodeAnalysisPanelProps {
  status: "idle" | "running" | "success" | "failed"
  activeAction: "run" | "submit" | null
  executionResult: ExecutionResult | null
  isOutdated: boolean
  sampleTestCases?: Array<{ input: string; output?: string; expected?: string }>
  onRunCode: () => void
  onFocusFaultyLine?: (line?: number) => void
  className?: string
}

export function CodeAnalysisPanel({
  status,
  activeAction,
  executionResult,
  isOutdated,
  sampleTestCases,
  onRunCode,
  onFocusFaultyLine,
  className,
}: CodeAnalysisPanelProps) {
  const [showStdout, setShowStdout] = React.useState<boolean>(false)
  const [activeTab, setActiveTab] = React.useState<"sample1" | "sample2" | "execution">("sample1")
  const [isDrawerCollapsed, setIsDrawerCollapsed] = React.useState<boolean>(false)

  const isRunning = status === "running"
  const isIdle = status === "idle" || (!executionResult && !isRunning)

  // Default samples if none provided
  const samples = React.useMemo(() => {
    if (sampleTestCases && sampleTestCases.length > 0) return sampleTestCases
    return [
      { input: "[10, 20, 30]", expected: "Rotated Left, Root is 20" },
      { input: "[5, 4, 3]", expected: "Rotated Right, Root is 4" },
    ]
  }, [sampleTestCases])

  // When execution completes, auto switch to execution tab if there's an error or on first run
  React.useEffect(() => {
    if (executionResult) {
      if (executionResult.status !== "success") {
        setActiveTab("execution")
      }
    }
  }, [executionResult])

  return (
    <div
      aria-label="Code Analysis & Test Results"
      className={cn(
        "shrink-0 rounded-lg border border-border-subtle bg-surface p-3 transition-colors select-text shadow-sm",
        className
      )}
    >
      {/* 1. Header Bar: Persistent Tab Bar & Status */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Terminal
              className={cn("size-3.5 text-[#7aa2f7]", isRunning && "animate-spin")}
            />
            <h2 className="text-xs font-bold text-text-primary">
              Console &amp; Test Results
            </h2>
          </div>

          {/* Unified Tab Bar - ALWAYS Visible regardless of run status */}
          {!isDrawerCollapsed && (
            <div className="flex items-center gap-1 rounded-md border border-border-subtle bg-surface-secondary/70 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("sample1")}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold transition-colors",
                  activeTab === "sample1"
                    ? "bg-[#7aa2f7]/20 text-[#7aa2f7] border border-[#7aa2f7]/40 shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <span>Sample 1</span>
                {executionResult && (
                  executionResult.status === "success" ? (
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-rose-400" />
                  )
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sample2")}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold transition-colors",
                  activeTab === "sample2"
                    ? "bg-[#7aa2f7]/20 text-[#7aa2f7] border border-[#7aa2f7]/40 shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <span>Sample 2</span>
                {executionResult && (
                  executionResult.status === "success" ? (
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-rose-400" />
                  )
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("execution")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold transition-colors",
                  activeTab === "execution"
                    ? "bg-[#7aa2f7]/20 text-[#7aa2f7] border border-[#7aa2f7]/40 shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <span>Execution &amp; Complexity</span>
                {isRunning && <Loader2 className="size-2.5 animate-spin text-[#7aa2f7]" />}
              </button>
            </div>
          )}

          {isOutdated && !isRunning && !isIdle && (
            <span className="inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
              <AlertCircle className="size-2.5" />
              Outdated
            </span>
          )}
        </div>

        {/* Right side: Status indicators & Drawer Collapse Button */}
        <div className="flex items-center gap-2.5">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#7aa2f7]/40 bg-[#7aa2f7]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#7aa2f7]">
              <Loader2 className="size-3 animate-spin text-[#7aa2f7]" />
              {activeAction === "submit"
                ? "Submitting & evaluating..."
                : "Compiling & executing..."}
            </span>
          ) : executionResult ? (
            <div className="flex items-center gap-2 font-mono text-[10.5px] tabular-nums">
              {executionResult.status === "success" ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <Check className="size-3 stroke-[2.5]" />
                  {executionResult.action === "submit" ? "Accepted" : "Passed"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                  <XCircle className="size-3" />
                  {executionResult.errorType || "Failed"}
                </span>
              )}
              <span className="text-text-muted">•</span>
              <span className="text-[#c0caf5]">
                {executionResult.metrics.runtimeMs}ms
              </span>
              {executionResult.metrics.memoryMb && (
                <>
                  <span className="text-text-muted">•</span>
                  <span className="text-[#c0caf5]">
                    {executionResult.metrics.memoryMb}
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-[#16161e] px-2 py-0.5 font-mono text-[10px] text-text-muted">
              <span className="size-1.5 rounded-full bg-[#7aa2f7]" />
              Ready to execute
            </span>
          )}

          {/* Drawer Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsDrawerCollapsed((prev) => !prev)}
            title={isDrawerCollapsed ? "Expand Console" : "Collapse Console"}
            className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md border border-border-subtle bg-surface-secondary text-text-muted transition-colors hover:border-[#7aa2f7]/50 hover:text-[#7aa2f7]"
          >
            {isDrawerCollapsed ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Outdated Banner */}
      {isOutdated && !isRunning && !isIdle && !isDrawerCollapsed && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning/8 px-3 py-1.5 text-[11px] text-warning">
          <div className="flex items-center gap-2 truncate">
            <AlertCircle className="size-3.5 shrink-0 text-warning" />
            <span className="truncate">
              Code was modified since last run. Results below are from the previous version.
            </span>
          </div>
          <button
            type="button"
            onClick={onRunCode}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-warning/40 bg-surface px-2 py-0.5 text-[10.5px] font-semibold text-text-primary transition-colors hover:border-warning hover:text-warning"
          >
            <RotateCcw className="size-3" />
            <span>Re-run Code</span>
          </button>
        </div>
      )}

      {/* 3. Tab Content Area */}
      {!isDrawerCollapsed && (
        <div className="mt-2.5">
          {/* ==================== TAB 1: SAMPLE 1 ==================== */}
          {activeTab === "sample1" && (
            <div className="rounded-lg border border-border-subtle bg-surface-secondary/50 p-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Input */}
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-text-muted uppercase">Input:</span>
                  <div className="rounded border border-border-subtle bg-[#16161e] p-2 font-mono text-[11px] text-[#c0caf5] min-h-[36px] flex items-center">
                    {samples[0]?.input || "[10, 20, 30]"}
                  </div>
                </div>

                {/* Expected Output */}
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-text-muted uppercase">Expected Output:</span>
                  <div className="rounded border border-border-subtle bg-[#16161e] p-2 font-mono text-[11px] text-[#9ece6a] min-h-[36px] flex items-center">
                    {samples[0]?.expected || samples[0]?.output || "Rotated Left, Root is 20"}
                  </div>
                </div>

                {/* Actual Output (Dynamic based on Run Code) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-text-muted uppercase">Actual Output:</span>
                    {executionResult && (
                      executionResult.status === "success" ? (
                        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-400">
                          Passed ✓
                        </span>
                      ) : (
                        <span className="rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.2 font-mono text-[9px] font-bold text-rose-400">
                          Failed ✗
                        </span>
                      )
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded border p-2 font-mono text-[11px] min-h-[36px] flex items-center",
                      executionResult
                        ? executionResult.status === "success"
                          ? "border-emerald-500/30 bg-[#16161e] text-emerald-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold"
                        : "border-border-subtle bg-[#16161e] text-[#565f89] italic"
                    )}
                  >
                    {executionResult
                      ? executionResult.status === "success"
                        ? (samples[0]?.expected || samples[0]?.output || "Output matches expected invariants")
                        : (executionResult.testCases?.[0]?.actual || (executionResult as any).errorOutput || executionResult.errorMessage || "Failed to produce expected state")
                      : "Not executed yet (Click 'Run Code' above)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: SAMPLE 2 ==================== */}
          {activeTab === "sample2" && (
            <div className="rounded-lg border border-border-subtle bg-surface-secondary/50 p-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Input */}
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-text-muted uppercase">Input:</span>
                  <div className="rounded border border-border-subtle bg-[#16161e] p-2 font-mono text-[11px] text-[#c0caf5] min-h-[36px] flex items-center">
                    {samples[1]?.input || "[5, 4, 3]"}
                  </div>
                </div>

                {/* Expected Output */}
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-text-muted uppercase">Expected Output:</span>
                  <div className="rounded border border-border-subtle bg-[#16161e] p-2 font-mono text-[11px] text-[#9ece6a] min-h-[36px] flex items-center">
                    {samples[1]?.expected || samples[1]?.output || "Rotated Right, Root is 4"}
                  </div>
                </div>

                {/* Actual Output (Dynamic based on Run Code) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-text-muted uppercase">Actual Output:</span>
                    {executionResult && (
                      executionResult.status === "success" ? (
                        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-400">
                          Passed ✓
                        </span>
                      ) : (
                        <span className="rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.2 font-mono text-[9px] font-bold text-rose-400">
                          Failed ✗
                        </span>
                      )
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded border p-2 font-mono text-[11px] min-h-[36px] flex items-center",
                      executionResult
                        ? executionResult.status === "success"
                          ? "border-emerald-500/30 bg-[#16161e] text-emerald-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold"
                        : "border-border-subtle bg-[#16161e] text-[#565f89] italic"
                    )}
                  >
                    {executionResult
                      ? executionResult.status === "success"
                        ? (samples[1]?.expected || samples[1]?.output || "Output matches expected invariants")
                        : (executionResult.testCases?.[1]?.actual || (executionResult as any).errorOutput || executionResult.errorMessage || "Failed to produce expected state")
                      : "Not executed yet (Click 'Run Code' above)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: EXECUTION & COMPLEXITY ==================== */}
          {activeTab === "execution" && (
            <div className="space-y-3">
              {/* If Currently Running */}
              {isRunning && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex min-h-[135px] flex-col justify-between rounded-lg border border-[#7aa2f7]/30 bg-surface p-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                          <BarChart2 className="size-3.5 text-[#7aa2f7]" />
                          <span>Complexity Estimation</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#7aa2f7]/40 bg-[#7aa2f7]/15 px-2 py-0.5 text-[10px] font-semibold text-[#7aa2f7]">
                          Analyzing...
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span>Time Complexity</span>
                          <div className="h-3 w-16 rounded bg-[#7aa2f7]/20 animate-pulse" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span>Space Complexity</span>
                          <div className="h-3 w-14 rounded bg-[#7aa2f7]/20 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-[#7aa2f7]/30 bg-[#7aa2f7]/10 px-2.5 py-1.5 text-[11px] text-[#7aa2f7]">
                      <Sparkles className="size-3.5 shrink-0 animate-spin text-[#7aa2f7]" />
                      <span className="truncate">Parsing AST &amp; calculating asymptotic bounds...</span>
                    </div>
                  </div>

                  <div className="flex min-h-[135px] flex-col justify-between rounded-lg border border-primary/30 bg-surface p-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                          <Terminal className="size-3.5 text-primary" />
                          <span>Test Suite Verification</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Loader2 className="size-2.5 animate-spin" />
                          {activeAction === "submit" ? "Grading..." : "Executing..."}
                        </span>
                      </div>
                      <div className="mt-2.5 space-y-1 text-[11px] font-mono text-text-secondary">
                        <div className="flex items-center gap-2 text-success">
                          <Check className="size-3" />
                          <span>Compiling with g++ (C++17, -O2)...</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#7aa2f7]">
                          <span className="size-1.5 rounded-full bg-[#7aa2f7]" />
                          <span>Executing sandboxed test vectors...</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                      <div className="h-full w-3/4 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* If Executed Successfully */}
              {!isRunning && executionResult && executionResult.status === "success" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Card 1: Complexity Analysis */}
                    <div className="flex min-h-[135px] flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                            <BarChart2 className="size-3.5 text-[#7aa2f7]" />
                            <span>Complexity Estimation</span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            Optimal
                          </span>
                        </div>
                        <div className="mt-2.5 space-y-1 text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="text-text-secondary">Time Complexity:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {executionResult.complexity?.timeComplexity || "O(log N)"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-text-secondary">Space Complexity:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {executionResult.complexity?.spaceComplexity || "O(1)"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary px-2.5 py-1 text-[10.5px] text-text-secondary">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                        <span className="truncate">{executionResult.complexity?.optimalNote || "All asymptotic bounds satisfied."}</span>
                      </div>
                    </div>

                    {/* Card 2: Test Suite Verification */}
                    <div className="flex min-h-[135px] flex-col justify-between rounded-xl border border-emerald-500/40 bg-surface p-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                            <span>Test Suite Verification</span>
                          </div>
                          <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Passed ({executionResult.passedCount} / {executionResult.totalCount} Tests)
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
                          {executionResult.action === "submit"
                            ? "Full test suite verified. Submission meets all runtime and invariant bounds."
                            : "All sample test cases verified successfully without errors."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-medium text-emerald-400">
                        <Check className="size-3.5 shrink-0" />
                        <span>Ready for submission. Solution validated cleanly.</span>
                      </div>
                    </div>
                  </div>

                  {/* Program Output (stdout toggle) */}
                  {executionResult.stdout && (
                    <div className="rounded-xl border border-border-subtle bg-surface/70 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowStdout((prev) => !prev)}
                        className="flex w-full cursor-pointer items-center justify-between bg-surface px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="size-3 text-[#7aa2f7]" />
                          <span>Program Output (stdout)</span>
                        </div>
                        {showStdout ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </button>
                      {showStdout && (
                        <pre className="p-3 font-mono text-[11px] text-[#c0caf5] bg-[#16161e] max-h-48 overflow-y-auto overflow-x-auto whitespace-pre-wrap border-t border-border-subtle custom-scrollbar">
                          {executionResult.stdout}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* If Executed with Error */}
              {!isRunning && executionResult && executionResult.status !== "success" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Error Diagnostic */}
                    <div className="flex min-h-[135px] flex-col justify-between rounded-xl border border-rose-500/50 bg-surface p-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                            <AlertTriangle className="size-3.5 text-rose-400" />
                            <span>{executionResult.errorType || "Execution Error"}</span>
                          </div>
                          <span className="rounded-md border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                            {executionResult.failedTestLabel || "Failed"}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-text-secondary leading-relaxed">
                          {executionResult.errorMessage || executionResult.errorTitle || "Tests or compilation encountered an issue."}
                        </p>
                      </div>

                      {executionResult.faultyLine ? (
                        <button
                          type="button"
                          onClick={() => onFocusFaultyLine?.(executionResult.faultyLine?.line)}
                          className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-left text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <ArrowRight className="size-3 text-rose-400" />
                            <span className="truncate">{executionResult.errorAction || `Review Line ${executionResult.faultyLine.line}`}</span>
                          </span>
                          <span className="shrink-0 rounded bg-rose-500/25 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                            Ln {executionResult.faultyLine.line}
                          </span>
                        </button>
                      ) : null}
                    </div>

                    {/* Test Case Failure Details */}
                    <div className="flex min-h-[135px] flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3 font-mono text-[11px]">
                      <div>
                        <div className="flex items-center justify-between border-b border-border-subtle pb-1 font-sans text-xs font-bold text-text-primary">
                          <div className="flex items-center gap-1.5">
                            <XCircle className="size-3.5 text-rose-400" />
                            <span>Failure Trace</span>
                          </div>
                          <span className="text-[10px] text-text-muted">
                            {executionResult.passedCount} / {executionResult.totalCount} Passed
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-[10.5px]">
                          {executionResult.testCases?.slice(0, 1).map((tc, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="rounded bg-[#16161e] p-1.5 text-[#c0caf5] truncate">
                                <span className="text-[#565f89]">Input: </span>{tc.input}
                              </div>
                              <div className="rounded bg-[#16161e] p-1.5 text-rose-300 border border-rose-500/25 truncate">
                                <span className="text-rose-400/70">Actual: </span>{tc.actual}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] font-sans text-text-muted text-right">
                        Use Socratic AI Tutor on the right for debugging clues.
                      </div>
                    </div>
                  </div>

                  {/* Stderr / Compiler Output */}
                  {executionResult.stdout && (
                    <div className="rounded-xl border border-border-subtle bg-surface/70 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowStdout((prev) => !prev)}
                        className="flex w-full cursor-pointer items-center justify-between bg-surface px-3 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-text-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="size-3 text-rose-400" />
                          <span>Compiler Diagnostics / Error Trace</span>
                        </div>
                        {showStdout ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                      {showStdout && (
                        <pre className="p-3 font-mono text-[11px] text-rose-300 bg-[#16161e] max-h-48 overflow-y-auto overflow-x-auto whitespace-pre-wrap border-t border-border-subtle custom-scrollbar">
                          {executionResult.stdout}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* If Idle (Not run yet) */}
              {isIdle && !isRunning && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border-subtle bg-surface-secondary/50 p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <BarChart2 className="size-3.5 text-[#7aa2f7]" />
                      <span>Target Complexity Bound</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Time: <span className="font-mono text-emerald-400 font-semibold">O(log N)</span> | Space: <span className="font-mono text-emerald-400 font-semibold">O(1) aux</span>
                    </p>
                    <p className="text-[10.5px] text-[#565f89]">
                      AST validator checks recursion tree balance and memory allocation limits.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border-subtle bg-surface-secondary/50 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                        <Terminal className="size-3.5 text-[#7aa2f7]" />
                        <span>Execution Suite Ready</span>
                      </div>
                      <p className="mt-1 text-[11px] text-text-secondary">
                        2 sample test cases + hidden stress vectors loaded.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onRunCode}
                      className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-[#7aa2f7]/40 bg-[#7aa2f7]/15 py-1 px-3 font-mono text-[11px] font-bold text-[#7aa2f7] hover:bg-[#7aa2f7]/25 transition-colors cursor-pointer"
                    >
                      <Play className="size-3 fill-current" />
                      <span>Execute Sandbox Tests</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
