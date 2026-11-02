"use client"

import * as React from "react"
import {
  AlertTriangle,
  BarChart2,
  Bot,
  CheckCircle2,
  CornerDownRight,
  FileText,
  Lightbulb,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Unlock,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSocraticTutorProfile } from "@/mocks/socraticTutorData"

export interface SocraticTutorPanelProps {
  nodeId: string
  nodeLabel: string
  nodeComplexity: string
  taskId: string
  activeMode: "theory" | "quiz" | "coding"
  taskDetail: any
  selectedOption: string | null
  selectedQuizOptionObj: {
    id: string
    text: string
    isCorrect: boolean
  } | null
  codeRunOutcome: "initial" | "warning" | "passed"
  hintsRemaining: number
  onUpdateHintsRemaining: (nextHints: number) => void
  onFocusFaultyLine?: (lineNumber: number) => void
  onClose?: () => void
}

export function SocraticTutorPanel({
  nodeId,
  nodeLabel,
  nodeComplexity,
  taskId,
  activeMode,
  taskDetail,
  selectedOption,
  selectedQuizOptionObj,
  codeRunOutcome,
  hintsRemaining,
  onUpdateHintsRemaining,
  onFocusFaultyLine,
  onClose,
}: SocraticTutorPanelProps) {
  const profile = React.useMemo(
    () => getSocraticTutorProfile(nodeId, nodeLabel, nodeComplexity),
    [nodeId, nodeLabel, nodeComplexity]
  )

  const modeTiers = React.useMemo(
    () => profile.tiers[activeMode] || profile.tiers.coding,
    [profile, activeMode]
  )

  // Map hintsRemaining (2..0) to how many tiers are unlocked (1..3)
  // Default hintsRemaining is 2 => Tier 1 unlocked; 1 => Tier 1 & 2 unlocked; 0 => All 3 tiers unlocked
  const unlockedTierCount = React.useMemo(() => {
    if (hintsRemaining >= 2) return 1
    if (hintsRemaining === 1) return 2
    return 3
  }, [hintsRemaining])

  const [selectedTier, setSelectedTier] = React.useState<number>(1)
  const [activeResourceView, setActiveResourceView] = React.useState<
    "slide" | "dryrun" | null
  >(null)

  // Sync active tier with task changes without losing unlocked hintsRemaining state
  React.useEffect(() => {
    setActiveResourceView(null)
    setSelectedTier((prev) => Math.min(prev, unlockedTierCount))
  }, [nodeId, taskId, activeMode, unlockedTierCount])

  // Automatically highlight the highest unlocked tier when a warning occurs in coding mode
  React.useEffect(() => {
    if (activeMode === "coding" && codeRunOutcome === "warning") {
      setSelectedTier(unlockedTierCount)
    }
  }, [activeMode, codeRunOutcome, unlockedTierCount])

  const handleUnlockNextTier = React.useCallback(() => {
    if (hintsRemaining > 0) {
      const nextRemaining = hintsRemaining - 1
      onUpdateHintsRemaining(nextRemaining)
      const newlyUnlockedTier = nextRemaining === 1 ? 2 : 3
      setSelectedTier(newlyUnlockedTier)
    } else {
      // Cycle through already-unlocked tiers when all 3 are unlocked
      setSelectedTier((prev) => (prev % 3) + 1)
    }
  }, [hintsRemaining, onUpdateHintsRemaining])

  const handleSelectTierTab = React.useCallback(
    (tierNum: number) => {
      if (tierNum <= unlockedTierCount) {
        setSelectedTier(tierNum)
      } else {
        handleUnlockNextTier()
      }
    },
    [unlockedTierCount, handleUnlockNextTier]
  )

  const activeTierObj = modeTiers[selectedTier - 1] || modeTiers[0]

  // Primary context-aware Socratic guidance text based on current Task mode & student state
  const primaryGuidance = React.useMemo(() => {
    if (activeMode === "theory") {
      return {
        label: "Socratic Concept Check:",
        paragraph1: taskDetail?.socraticCheck || modeTiers[0]?.content,
        paragraph2:
          "Reflect on how this structural invariant bounds worst-case complexity before advancing to the Quiz.",
      }
    }

    if (activeMode === "quiz") {
      if (!selectedOption) {
        return {
          label: "Socratic Hint (Awaiting Selection):",
          paragraph1: taskDetail?.hints?.awaiting || modeTiers[0]?.content,
          paragraph2: null,
        }
      }
      const isRight = Boolean(selectedQuizOptionObj?.isCorrect)
      return {
        label: isRight
          ? `Socratic Verification (Option ${selectedOption} Correct):`
          : `Socratic Hint (Triggered by Option ${selectedOption}):`,
        paragraph1: isRight
          ? taskDetail?.hints?.correct
          : taskDetail?.hints?.incorrect,
        paragraph2: isRight
          ? "You have verified the invariant. Click Submit in the Quiz header to proceed to the coding task."
          : "Use the Progressive Hint Ladder below if you need to trace the invariant step by step.",
      }
    }

    // Coding mode
    if (codeRunOutcome === "passed") {
      return {
        label: "Socratic Verification (All 8/8 Tests Passed):",
        paragraph1: `Your defensive guard around Line ${profile.faultyLine.line} resolved the boundary edge case while maintaining ${nodeComplexity} complexity.`,
        paragraph2:
          "Notice how handling empty or null pointers upfront keeps the core pointer manipulation clean and O(1) in auxiliary space.",
      }
    }

    if (codeRunOutcome === "warning") {
      return {
        label:
          taskDetail?.socraticHint?.triggerLabel ||
          `Socratic Hint (Triggered by Line ${profile.faultyLine.line}):`,
        paragraph1:
          taskDetail?.socraticHint?.paragraph1 ||
          profile.faultyLine.calloutDetail,
        paragraph2:
          taskDetail?.socraticHint?.paragraph2 ||
          profile.faultyLine.suggestedFixHint,
      }
    }

    return {
      label:
        taskDetail?.socraticHint?.triggerLabel ||
        `Socratic Guidance (${nodeLabel}):`,
      paragraph1:
        taskDetail?.socraticHint?.paragraph1 || modeTiers[0]?.content,
      paragraph2: taskDetail?.socraticHint?.paragraph2 || null,
    }
  }, [
    activeMode,
    taskDetail,
    modeTiers,
    selectedOption,
    selectedQuizOptionObj,
    codeRunOutcome,
    profile,
    nodeComplexity,
    nodeLabel,
  ])

  return (
    <div className="flex h-full min-h-0 flex-col justify-between rounded-2xl border border-border-subtle bg-surface-elevated/98 p-4 shadow-2xl backdrop-blur-xl">
      {/* ==================== 1. HEADER + RAG GROUNDED + CLOSE BUTTON ==================== */}
      <div className="shrink-0">
        <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-cyan/35 bg-cyan/10 text-cyan">
              <Bot className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-text-primary">
                  Socratic AI Tutor
                </h2>
                <span
                  title="Stateless Socratic Guidance Engine — guides with questions without spoiling answers"
                  className="inline-flex items-center gap-1 rounded border border-purple/35 bg-purple/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-purple"
                >
                  <ShieldCheck className="size-2.5" />
                  <span>No-Spoiler</span>
                </span>
              </div>
              <p className="text-[10px] text-text-muted">
                Stateless Guidance Engine • {profile.ragSourceBadge}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-secondary px-2.5 py-1 text-[9.5px] font-medium text-success">
              <span className="size-1.5 rounded-full bg-success" />
              <span>RAG Grounded</span>
            </span>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Socratic AI Tutor"
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:border-border hover:text-text-primary"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ==================== 2. CONTEXT TRIGGER STATUS BAR ==================== */}
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-secondary px-3 py-1.5 text-[10.5px]">
          {activeMode === "coding" && codeRunOutcome === "warning" ? (
            <>
              <div className="flex min-w-0 items-center gap-1.5 text-warning">
                <AlertTriangle className="size-3.5 shrink-0 text-danger" />
                <span className="truncate font-medium">
                  Fault detected at{" "}
                  <strong className="font-mono text-text-primary">
                    Line {profile.faultyLine.line}
                  </strong>
                </span>
              </div>
              {onFocusFaultyLine && (
                <button
                  type="button"
                  onClick={() => onFocusFaultyLine(profile.faultyLine.line)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-danger/50 bg-danger/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-warning transition-colors hover:bg-danger/25"
                >
                  <Target className="size-2.5" />
                  <span>Jump Ln {profile.faultyLine.line}</span>
                </button>
              )}
            </>
          ) : activeMode === "coding" && codeRunOutcome === "passed" ? (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span className="font-medium">
                All 8/8 tests passed • Line {profile.faultyLine.line} verified
              </span>
            </div>
          ) : activeMode === "quiz" && selectedOption ? (
            <div className="flex items-center gap-1.5 text-cyan">
              <Sparkles className="size-3.5 shrink-0 text-purple" />
              <span className="truncate font-medium">
                Context: Triggered by{" "}
                <strong className="text-text-primary">
                  Option {selectedOption}
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Sparkles className="size-3.5 shrink-0 text-cyan" />
              <span className="truncate">
                Active Context:{" "}
                <strong className="text-text-primary">{nodeLabel}</strong> (
                {activeMode.toUpperCase()})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==================== 3. MAIN BODY: PRIMARY SOCRATIC CARD + 3-TIER HINT LADDER OR SLIDE/DRY-RUN DRAWER ==================== */}
      <div className="my-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        {/* Primary Context-Aware Socratic Guidance Card */}
        <div className="rounded-xl border border-primary/45 bg-surface p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-purple">
            <Lightbulb className="size-3.5 shrink-0 text-purple" />
            <span>{primaryGuidance.label}</span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-text-primary">
            {primaryGuidance.paragraph1}
          </p>

          {primaryGuidance.paragraph2 && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-secondary/90 px-2.5 py-2 text-[11px] leading-relaxed text-cyan">
              <CornerDownRight className="mt-0.5 size-3.5 shrink-0 text-purple" />
              <span>{primaryGuidance.paragraph2}</span>
            </div>
          )}
        </div>

        {/* 3-Tier Progressive Hint Ladder */}
        <div className="rounded-xl border border-border-subtle bg-surface-secondary/90 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-wider text-text-secondary uppercase">
              Progressive Hint Ladder
            </span>
            <span className="font-mono text-[10px] text-cyan">
              {unlockedTierCount}/3 Tiers Unlocked
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {modeTiers.map((t: any) => {
              const isUnlocked = t.tier <= unlockedTierCount
              const isSelected = selectedTier === t.tier
              return (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => handleSelectTierTab(t.tier)}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10.5px] font-semibold transition-all",
                    isSelected
                      ? "border-primary bg-primary/20 text-text-primary shadow-[0_0_12px_var(--color-primary-glow)]"
                      : isUnlocked
                        ? "border-border-subtle bg-surface text-text-secondary hover:border-border"
                        : "border-border-subtle/60 bg-surface-secondary/60 text-text-muted hover:border-border"
                  )}
                >
                  {isUnlocked ? (
                    <Unlock
                      className="size-3 shrink-0"
                      style={{ color: t.color }}
                    />
                  ) : (
                    <Lock className="size-3 shrink-0 text-text-muted" />
                  )}
                  <span>Tier {t.tier}</span>
                </button>
              )
            })}
          </div>

          {activeTierObj && (
            <div className="mt-2.5 rounded-xl border border-border-subtle bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono text-[10px] font-bold tracking-wide uppercase"
                  style={{ color: activeTierObj.color }}
                >
                  Tier {activeTierObj.tier} • {activeTierObj.badge}
                </span>
              </div>
              <div className="mt-1 text-xs font-bold text-text-primary">
                {activeTierObj.title}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
                {activeTierObj.content}
              </p>
            </div>
          )}
        </div>

        {/* Optional Resource Preview (Slide Excerpt or Dry-Run Table) */}
        {activeResourceView && (
          <div className="rounded-xl border border-primary/50 bg-surface-secondary p-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan">
                {activeResourceView === "slide" ? (
                  <>
                    <FileText className="size-3.5 text-primary" />
                    <span>{profile.slideCitation.slideTitle}</span>
                  </>
                ) : (
                  <>
                    <BarChart2 className="size-3.5 text-primary" />
                    <span>{profile.dryRunTable.title}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveResourceView(null)}
                className="cursor-pointer rounded p-0.5 text-text-muted hover:bg-surface hover:text-text-primary"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {activeResourceView === "slide" ? (
              <div className="mt-2.5 space-y-2 text-[11px]">
                <div className="font-mono text-[9.5px] text-text-muted">
                  {profile.slideCitation.courseRef}
                </div>
                <p className="rounded-lg border border-border-subtle bg-surface p-2.5 leading-relaxed text-text-primary">
                  “{profile.slideCitation.excerpt}”
                </p>
                <div className="rounded-lg border border-success/35 bg-success/10 px-2.5 py-1.5 font-mono text-[10px] text-success">
                  {profile.slideCitation.keyInvariant}
                </div>
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left font-mono text-[9.5px]">
                  <thead>
                    <tr className="border-b border-border-subtle text-cyan">
                      {profile.dryRunTable.columns.map((col: string) => (
                        <th key={col} className="px-1.5 py-1 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/60 text-text-secondary">
                    {profile.dryRunTable.rows.map(
                      (row: string[], rIdx: number) => (
                        <tr
                          key={rIdx}
                          className={cn(
                            rIdx === profile.dryRunTable.rows.length - 1 &&
                              "bg-danger/12 text-warning"
                          )}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-1.5 py-1">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== 4. FOOTER ACTIONS: SLIDE PDF + DRY-RUN TABLE + REQUEST HINT ==================== */}
      <div className="shrink-0 space-y-2 border-t border-border-subtle pt-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveResourceView((prev) =>
                prev === "slide" ? null : "slide"
              )
            }
            className={cn(
              "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
              activeResourceView === "slide"
                ? "border-primary bg-primary/20 text-text-primary"
                : "border-border-subtle bg-surface text-text-secondary hover:border-border hover:text-text-primary"
            )}
          >
            <FileText className="size-3.5 text-primary" />
            <span className="truncate">
              {taskDetail?.slideLabel || "Open Slide 14 (PDF)"}
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveResourceView((prev) =>
                prev === "dryrun" ? null : "dryrun"
              )
            }
            className={cn(
              "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
              activeResourceView === "dryrun"
                ? "border-primary bg-primary/20 text-text-primary"
                : "border-border-subtle bg-surface text-text-secondary hover:border-border hover:text-text-primary"
            )}
          >
            <BarChart2 className="size-3.5 text-primary" />
            <span className="truncate">Trace Dry-Run Table</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleUnlockNextTier}
          className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/15 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/25"
        >
          <MessageSquare className="size-3.5" />
          <span>
            {hintsRemaining > 0
              ? `Request Another Socratic Hint (${hintsRemaining}/3 Left)`
              : "All 3 Hint Tiers Unlocked (Cycle Tiers)"}
          </span>
        </button>
      </div>
    </div>
  )
}
