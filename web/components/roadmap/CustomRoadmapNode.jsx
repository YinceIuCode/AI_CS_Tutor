"use client"

import * as React from "react"
import { Handle, Position } from "@xyflow/react"
import { Check, Lock, Sparkles } from "lucide-react"

/**
 * Custom React Flow Node — Tokyo Night "Skill Orb / Medallion" Design with 450ms Delayed Hover Preview:
 * - Preserves the true Skill Tree / Constellation feel (circular multi-ring orb).
 * - Hovering for 450ms reveals a compact side preview card showing ONLY:
 *   Topic Name, Status Badge, Progress %, and Task Count (no Enter Workspace button).
 * - Clicking the node opens the full Detail Pop-up Modal.
 */
function CustomRoadmapNode({ data }) {
  const status = data?.status || "locked"
  const isSelected = Boolean(data?.isSelected)
  const completedTasks = data?.completedTasks ?? 0
  const totalTasks = data?.totalTasks ?? 3
  const progress =
    data?.progress ??
    (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)
  const tasks = Array.isArray(data?.tasks) ? data.tasks : []

  // Delayed Hover Preview state (450ms delay)
  const [showHoverPreview, setShowHoverPreview] = React.useState(false)
  const hoverTimerRef = React.useRef(null)

  const handleMouseEnter = React.useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current)
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setShowHoverPreview(true)
    }, 450)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setShowHoverPreview(false)
  }, [])

  // Hide hover preview immediately if the full Pop-up Modal is opened for this node
  React.useEffect(() => {
    if (isSelected) {
      setShowHoverPreview(false)
    }
  }, [isSelected])

  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  // SVG Radial Progress Ring geometry (76x76 viewBox, r = 33)
  const radius = 33
  const circumference = 2 * Math.PI * radius
  const dashOffset =
    status === "completed"
      ? 0
      : status === "locked"
        ? circumference
        : circumference - (Math.max(progress, 18) / 100) * circumference

  const ringStroke =
    status === "completed"
      ? "#10b981"
      : status === "current"
        ? "#60a5fa"
        : "#414868"

  const coreStyle =
    status === "completed"
      ? "border-[2.5px] border-[#10b981] bg-[#0d2822] shadow-[0_0_12px_rgba(16,185,129,0.25)]"
      : status === "current"
        ? "border-[3px] border-[#60a5fa] bg-[#172544] shadow-[0_0_14px_rgba(59,130,246,0.3)]"
        : "border-2 border-dashed border-[#414868] bg-[#1a1b26]"

  const portColor =
    status === "completed"
      ? "!border-[#10b981] !bg-[#0d2822]"
      : status === "current"
        ? "!border-[#60a5fa] !bg-[#172544]"
        : "!border-[#414868] !bg-[#1a1b26]"

  const complexityColor =
    status === "completed"
      ? "text-[#34d399] font-mono font-medium text-[11px]"
      : status === "current"
        ? "text-[#60a5fa] font-mono font-medium text-[11px]"
        : "text-[#787c99] font-mono text-[11px]"

  const statusLabel =
    status === "completed"
      ? "Completed"
      : status === "current"
        ? "In Progress"
        : "Locked"

  const statusBadgeClass =
    status === "completed"
      ? "border-[#10b981]/40 bg-[#10b981]/15 text-[#34d399]"
      : status === "current"
        ? "border-[#60a5fa]/40 bg-[#60a5fa]/15 text-[#60a5fa]"
        : "border-[#414868] bg-[#24283b] text-[#787c99]"

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex w-[184px] cursor-pointer flex-col items-center select-none transition-opacity ${
        status === "locked" ? "opacity-85" : "opacity-100"
      }`}
    >
      {/* ==================== HOVER PREVIEW CARD (450ms DELAY, COMPACT SUMMARY ONLY) ==================== */}
      {showHoverPreview && !isSelected && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-50 w-[215px] -translate-x-1/2 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="rounded-lg border border-border-subtle bg-surface p-3 shadow-md">
            {/* 1. Tên chủ đề & Trạng thái */}
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-1 text-xs font-bold text-text-primary">
                {data?.label}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase ${statusBadgeClass}`}
              >
                {status === "current" && <Sparkles className="size-2.5" />}
                {statusLabel}
              </span>
            </div>

            {/* 2. Tiến trình & Số lượng nhiệm vụ */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-medium text-text-secondary">
                  Tasks:{" "}
                  <strong className="font-mono text-text-primary tabular-nums">
                    {completedTasks}/{totalTasks}
                  </strong>
                </span>
                <span className={`font-mono font-bold tabular-nums ${complexityColor}`}>
                  {progress}%
                </span>
              </div>

              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    status === "completed"
                      ? "bg-success"
                      : status === "current"
                        ? "bg-primary"
                        : "bg-border"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 3. Gợi ý click (Không có nút Enter Workspace) */}
            <div className="mt-2 border-t border-border-subtle/80 pt-1.5 text-center font-mono text-[9.5px] text-text-muted">
              Click node to view task details
            </div>
          </div>

          {/* Mũi tên trỏ xuống viên ngọc */}
          <div className="mx-auto -mt-1.5 size-2.5 rotate-45 border-r border-b border-border bg-surface-elevated" />
        </div>
      )}

      {/* ==================== 1. MULTI-RING SKILL ORB (76x76px) ==================== */}
      <div className="relative flex size-[76px] items-center justify-center">
        {/* Left Target Port anchored cleanly outside the Left Rim of the Orb */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          style={{ top: "50%", left: "-3px" }}
          className={`!size-2.5 !rounded-full !border-2 ${portColor}`}
        />

        {/* Right Source Port anchored cleanly outside the Right Rim of the Orb */}
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={false}
          style={{ top: "50%", right: "-3px" }}
          className={`!size-2.5 !rounded-full !border-2 ${portColor}`}
        />

        {/* Selection Ring when Node Detail Pop-up is open */}
        {isSelected && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 rounded-full border-2 border-primary shadow-sm"
          />
        )}

        {/* Outer SVG Radial Progress Ring + Decorative Orbit Track */}
        <svg
          viewBox="0 0 76 76"
          className="pointer-events-none absolute inset-0 size-full -rotate-90"
          aria-hidden="true"
        >
          {/* Background Orbit Track */}
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="none"
            stroke={status === "locked" ? "#414868" : status === "completed" ? "rgba(16, 185, 129, 0.2)" : "rgba(96, 165, 250, 0.2)"}
            strokeWidth={status === "locked" ? "2" : "2.5"}
            strokeDasharray={status === "locked" ? "4 4" : undefined}
          />
          {/* Dynamic Mastery Arc */}
          {status !== "locked" && (
            <circle
              cx="38"
              cy="38"
              r={radius}
              fill="none"
              stroke={ringStroke}
              strokeWidth="3.25"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-300"
            />
          )}
        </svg>

        {/* Inner Core Medallion (56x56px) */}
        <div
          className={`relative z-10 flex size-[56px] items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${coreStyle}`}
        >
          {status === "completed" && (
            <Check className="size-6 text-[#34d399]" strokeWidth={2.5} />
          )}
          {status === "current" && (
            <span className="font-mono text-sm font-bold text-white tracking-tight">
              {data?.shortCode || "01"}
            </span>
          )}
          {status === "locked" && (
            <Lock className="size-4.5 text-[#787c99]" strokeWidth={2} />
          )}
        </div>
      </div>

      {/* ==================== 2. FLOATING NAMEPLATE PILL ==================== */}
      <div className="relative z-10 mt-2 flex flex-col items-center rounded-lg border border-slate-300 dark:border-[#3b4261] bg-white dark:bg-[#1f2335] px-3 py-2 text-center shadow-md dark:shadow-lg transition-colors max-w-[185px]">
        <span className="line-clamp-2 text-[12px] font-bold tracking-tight leading-snug text-slate-900 dark:text-[#ffffff]">
          {data?.label}
        </span>
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
          <span className={complexityColor}>
            {data?.target_complexity || data?.complexity || "O(N)"}
          </span>
          <span className="text-text-muted opacity-50">•</span>
          <span className="rounded bg-slate-100 dark:bg-[#292e42] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-700 dark:text-[#c0caf5]">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </div>
    </div>
  )
}

export default React.memo(CustomRoadmapNode)
