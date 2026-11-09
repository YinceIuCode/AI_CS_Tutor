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
  Settings,
  Sparkles,
  Target,
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
  onRunCode: () => void
  onFocusFaultyLine?: (line?: number) => void
  className?: string
}

export function CodeAnalysisPanel({
  status,
  activeAction,
  executionResult,
  isOutdated,
  onRunCode,
  onFocusFaultyLine,
  className,
}: CodeAnalysisPanelProps) {
  const [showStdout, setShowStdout] = React.useState<boolean>(false)

  const isRunning = status === "running"
  const isIdle = status === "idle" || (!executionResult && !isRunning)

  return (
    <div
      aria-label="Code Analysis & Test Results"
      className={cn(
        "shrink-0 rounded-2xl border border-border-subtle bg-surface-secondary p-3.5 transition-all select-text",
        className
      )}
    >
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <Settings
            className={cn("size-4 text-cyan", isRunning && "animate-spin")}
          />
          <h2 className="text-xs font-bold text-text-primary">
            Code Analysis &amp; Test Results
          </h2>

          {isOutdated && !isRunning && !isIdle && (
            <span className="inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
              <AlertCircle className="size-2.5" />
              Outdated
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-cyan animate-pulse">
              <Loader2 className="size-3 animate-spin text-cyan" />
              {activeAction === "submit"
                ? "Submitting & evaluating test suite..."
                : "Compiling & executing test cases..."}
            </span>
          ) : executionResult ? (
            <div className="flex items-center gap-2 font-mono text-[10px]">
              {executionResult.status === "success" ? (
                <span className="text-success font-semibold">
                  {executionResult.action === "submit" ? "Accepted" : "Passed"}
                </span>
              ) : (
                <span className="text-danger font-semibold">
                  {executionResult.errorType || "Failed"}
                </span>
              )}
              <span className="text-text-muted">•</span>
              <span className="text-text-secondary">
                {executionResult.metrics.runtimeMs}ms
              </span>
              {executionResult.metrics.memoryMb && (
                <>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-secondary">
                    {executionResult.metrics.memoryMb}
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2.5 py-0.5 font-mono text-[10px] text-text-muted">
              <span className="size-1.5 rounded-full bg-cyan/60" />
              Ready to execute
            </span>
          )}
        </div>
      </div>

      {/* 2. Outdated Banner (When user edited code after last run) */}
      {isOutdated && !isRunning && !isIdle && (
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

      {/* 3. Dynamic State Bodies (Strictly normalized card height min-h-[148px] to prevent layout jumps) */}
      <div className="mt-3">
        {/* ==================== STATE A: IDLE (Awaiting Execution) ==================== */}
        {isIdle && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Card 1: Complexity Estimation (Awaiting Run) */}
            <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-dashed border-border-subtle bg-surface/50 p-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                    <BarChart2 className="size-3.5 text-text-muted" />
                    <span>Complexity Estimation</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted">
                    <span className="size-1.5 rounded-full bg-text-muted/50" />
                    Awaiting Run
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-text-muted">Time Complexity</span>
                    <span className="font-mono text-text-muted tracking-widest">——</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-text-muted">Space Complexity</span>
                    <span className="font-mono text-text-muted tracking-widest">——</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-border-subtle/80 bg-surface-secondary/60 px-2.5 py-1.5 text-[11px] text-text-muted">
                <Terminal className="size-3.5 shrink-0 text-text-muted" />
                <span>Asymptotic complexity will be evaluated upon code execution.</span>
              </div>
            </div>

            {/* Card 2: Test Suite Verification (Ready to Test) */}
            <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-dashed border-border-subtle bg-surface/50 p-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                    <Code2 className="size-3.5 text-text-muted" />
                    <span>Test Suite Verification</span>
                  </div>
                  <span className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted">
                    Ready to Test
                  </span>
                </div>

                <div className="mt-2 text-[11px] leading-relaxed text-text-secondary">
                  <div className="font-medium text-text-primary">
                    No execution results yet
                  </div>
                  <div className="mt-0.5 text-text-secondary">
                    Run your solution to compile, test against sample cases, and verify boundary limits.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onRunCode}
                className="mt-2.5 flex cursor-pointer items-center justify-between rounded-lg border border-primary/30 bg-primary/8 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-all hover:border-primary/60 hover:bg-primary/15"
              >
                <span className="flex items-center gap-1.5">
                  <Play className="size-3 fill-current text-primary" />
                  <span>Click "Run Code" or press Run</span>
                </span>
                <span className="font-mono text-[10px] text-text-muted font-normal">
                  Sample Tests
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== STATE B: RUNNING (In-flight Execution Pipeline) ==================== */}
        {isRunning && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Card 1: Complexity Estimation (Analyzing...) */}
            <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-cyan/40 bg-surface/80 p-3 shadow-[0_0_20px_rgba(125,207,255,0.06)]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                    <BarChart2 className="size-3.5 animate-pulse text-cyan" />
                    <span>Complexity Estimation</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/15 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                    <span className="size-1.5 rounded-full bg-cyan animate-ping" />
                    Analyzing...
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Time Complexity</span>
                    <div className="h-3 w-16 rounded bg-cyan/20 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Space Complexity</span>
                    <div className="h-3 w-14 rounded bg-cyan/20 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 py-1.5 text-[11px] text-cyan">
                <Sparkles className="size-3.5 shrink-0 animate-spin text-cyan" />
                <span className="truncate">Parsing AST &amp; calculating asymptotic bounds...</span>
              </div>
            </div>

            {/* Card 2: Test Suite Verification (Executing...) */}
            <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-primary/40 bg-surface/80 p-3 shadow-[0_0_20px_rgba(255,158,100,0.06)]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                    <Terminal className="size-3.5 animate-pulse text-primary" />
                    <span>Test Suite Verification</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Loader2 className="size-2.5 animate-spin" />
                    {activeAction === "submit" ? "Grading Suite..." : "Executing Tests..."}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1 text-[11px] font-mono text-text-secondary">
                  <div className="flex items-center gap-2 text-success">
                    <Check className="size-3" />
                    <span>Compiling with g++ (C++17, -O2)...</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan animate-pulse">
                    <span className="size-1.5 rounded-full bg-cyan" />
                    <span className="truncate">
                      {activeAction === "submit"
                        ? "Feeding 8 hidden & boundary test vectors..."
                        : "Executing sample test runners in sandbox..."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                  <span>Sandboxed Execution Engine</span>
                  <span className="text-primary font-bold">In progress...</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan via-primary to-cyan animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STATE C: SUCCESS ==================== */}
        {!isRunning && !isIdle && executionResult?.status === "success" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Card 1: Complexity Analysis (Only when provided) */}
              {executionResult.complexity ? (
                <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                        <BarChart2 className="size-3.5 text-cyan" />
                        <span>Complexity Estimation</span>
                      </div>
                      {executionResult.complexity.optimal && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success">
                          <span className="size-1.5 rounded-full bg-success" />
                          Optimal
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-1 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-text-secondary">Time Complexity</span>
                        <span className="font-mono font-bold text-success">
                          {executionResult.complexity.timeComplexity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-text-secondary">Space Complexity</span>
                        <span className="font-mono font-bold text-success">
                          {executionResult.complexity.spaceComplexity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary px-2.5 py-1.5 text-[11px] text-text-secondary">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    <span>{executionResult.complexity.optimalNote}</span>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[148px] flex-col justify-center rounded-xl border border-border-subtle bg-surface p-3 text-center text-text-muted">
                  <BarChart2 className="size-5 mx-auto mb-1 text-text-muted" />
                  <span className="text-xs font-medium">Complexity analysis not available</span>
                </div>
              )}

              {/* Card 2: Test Suite Verification */}
              <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-success/50 bg-surface p-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <CheckCircle2 className="size-3.5 text-success" />
                      <span>Test Suite Verification</span>
                    </div>
                    <span className="rounded-md border border-success/40 bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                      Passed ({executionResult.passedCount} / {executionResult.totalCount} Tests)
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] leading-relaxed text-text-secondary">
                    <div className="font-medium text-text-primary">
                      All standard &amp; boundary test cases passed
                    </div>
                    <div className="mt-0.5 text-text-secondary">
                      {executionResult.action === "submit"
                        ? "• Full test suite verified. Submission meets all runtime and logic requirements."
                        : "• Sample test cases verified successfully without errors."}
                    </div>
                  </div>
                </div>

                {executionResult.action === "submit" ? (
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-2.5 py-1.5 text-[11px] font-medium text-success">
                    <Check className="size-3.5 shrink-0 text-success" />
                    <span>Mastery task completed &amp; saved to Roadmap</span>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary px-2.5 py-1.5 text-[11px] text-text-secondary">
                    <span>Sample tests passed. Ready to submit solution.</span>
                    <span className="font-mono text-[10px] text-cyan font-semibold">
                      Click Submit to grade
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Program Output (Stdout toggle) */}
            {executionResult.stdout && (
              <div className="rounded-xl border border-border-subtle bg-surface/70 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowStdout((prev) => !prev)}
                  className="flex w-full cursor-pointer items-center justify-between bg-surface px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="size-3 text-cyan" />
                    <span>Program Output (stdout)</span>
                  </div>
                  {showStdout ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
                {showStdout && (
                  <pre className="p-3 font-mono text-[11px] text-text-secondary bg-background overflow-x-auto whitespace-pre-wrap border-t border-border-subtle">
                    {executionResult.stdout}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== STATE D: FAILED ==================== */}
        {!isRunning && !isIdle && executionResult?.status === "failed" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Card 1: Error Diagnostic */}
              <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-danger/60 bg-surface p-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <AlertTriangle className="size-3.5 text-danger" />
                      <span>{executionResult.errorType || "Execution Error"}</span>
                    </div>
                    <span className="rounded-md border border-danger/40 bg-danger/15 px-2 py-0.5 text-[10px] font-semibold text-danger">
                      {executionResult.failedTestLabel || "Failed"}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] leading-relaxed text-text-secondary">
                    <div className="font-medium text-text-primary">
                      {executionResult.errorTitle}
                    </div>
                    {executionResult.errorMessage && (
                      <div className="mt-0.5 text-text-secondary">
                        • {executionResult.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                {executionResult.faultyLine ? (
                  <button
                    type="button"
                    onClick={() =>
                      onFocusFaultyLine?.(executionResult.faultyLine?.line)
                    }
                    className="mt-2.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-danger/40 bg-danger/10 px-2.5 py-1.5 text-left text-[11px] font-medium text-warning transition-colors hover:border-danger/70 hover:bg-danger/18"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ArrowRight className="size-3.5 shrink-0 text-danger" />
                      <span className="truncate">
                        {executionResult.errorAction ||
                          `Review Line ${executionResult.faultyLine.line}`}
                      </span>
                    </span>
                    <span className="shrink-0 rounded bg-danger/25 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-text-primary">
                      Ln {executionResult.faultyLine.line}
                    </span>
                  </button>
                ) : executionResult.errorAction ? (
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-[11px] text-warning">
                    <ArrowRight className="size-3.5 shrink-0 text-danger" />
                    <span>{executionResult.errorAction}</span>
                  </div>
                ) : null}
              </div>

              {/* Card 2: Failed Test Case Details (Expected vs Actual) */}
              <div className="flex min-h-[148px] flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3 font-mono text-[11px]">
                <div>
                  <div className="flex items-center justify-between border-b border-border-subtle pb-1.5 font-sans text-xs font-bold text-text-primary">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="size-3.5 text-danger" />
                      <span>Test Case Failure Details</span>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {executionResult.passedCount} / {executionResult.totalCount} Passed
                    </span>
                  </div>

                  {(() => {
                    const failedCase =
                      executionResult.testCases.find((tc) => !tc.passed) ||
                      executionResult.testCases[0]

                    if (!failedCase) {
                      return (
                        <div className="mt-2 text-xs text-text-muted font-sans">
                          No test case details reported for this failure.
                        </div>
                      )
                    }

                    return (
                      <div className="mt-2 space-y-1.5">
                        <div className="text-[10.5px] font-sans font-medium text-text-muted">
                          {failedCase.label}
                        </div>
                        <div className="rounded bg-background p-1.5 text-text-secondary overflow-x-auto text-[10.5px]">
                          <span className="text-text-muted select-none">Input: </span>
                          {failedCase.input}
                        </div>
                        <div className="rounded bg-background p-1.5 text-cyan overflow-x-auto text-[10.5px]">
                          <span className="text-text-muted select-none">Expected: </span>
                          {failedCase.expected}
                        </div>
                        <div className="rounded bg-danger/10 border border-danger/25 p-1.5 text-danger overflow-x-auto text-[10.5px] font-bold">
                          <span className="text-danger/70 select-none">Actual: </span>
                          {failedCase.actual}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="mt-2 text-[10.5px] font-sans text-text-muted text-right">
                  Use Socratic AI Tutor on the left for contextual debugging clues.
                </div>
              </div>
            </div>

            {/* Program Output / Compiler log */}
            {executionResult.stdout && (
              <div className="rounded-xl border border-border-subtle bg-surface/70 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowStdout((prev) => !prev)}
                  className="flex w-full cursor-pointer items-center justify-between bg-surface px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="size-3 text-danger" />
                    <span>Console / Compiler Diagnostics</span>
                  </div>
                  {showStdout ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
                {showStdout && (
                  <pre className="p-3 font-mono text-[11px] text-danger/90 bg-background overflow-x-auto whitespace-pre-wrap border-t border-border-subtle">
                    {executionResult.stdout}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
