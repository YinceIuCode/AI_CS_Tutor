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
      ? "#9ECE6A"
      : status === "current"
        ? "#3DB5E6"
        : "#292E42"

  const coreStyle =
    status === "completed"
      ? "border-[#9ECE6A]/80 bg-radial from-[#9ECE6A]/22 via-[#1A1B26] to-[#15161E] text-[#9ECE6A] shadow-[0_0_28px_rgba(158,206,106,0.28)]"
      : status === "current"
        ? "border-[#3DB5E6] bg-radial from-[#3DB5E6]/26 via-[#1A1B26] to-[#15161E] text-[#7DCFFF] shadow-[0_0_32px_rgba(61,181,230,0.36)]"
        : "border-[#414868]/80 bg-[#161722] text-[#565F89] shadow-[0_6px_18px_rgba(0,0,0,0.5)]"

  const portColor =
    status === "completed"
      ? "!border-[#9ECE6A] !bg-[#15161E]"
      : status === "current"
        ? "!border-[#3DB5E6] !bg-[#15161E]"
        : "!border-[#414868] !bg-[#15161E]"

  const pillBorder =
    status === "completed"
      ? "border-[#9ECE6A]/45 group-hover:border-[#9ECE6A]"
      : status === "current"
        ? "border-[#3DB5E6]/60 group-hover:border-[#7DCFFF]"
        : "border-[#292E42] group-hover:border-[#414868]"

  const complexityColor =
    status === "completed"
      ? "text-[#9ECE6A]"
      : status === "current"
        ? "text-[#7DCFFF]"
        : "text-[#565F89]"

  const statusLabel =
    status === "completed"
      ? "Completed"
      : status === "current"
        ? "In Progress"
        : "Locked"

  const statusBadgeClass =
    status === "completed"
      ? "border-[#9ECE6A]/40 bg-[#9ECE6A]/15 text-[#9ECE6A]"
      : status === "current"
        ? "border-[#3DB5E6]/40 bg-[#3DB5E6]/15 text-[#7DCFFF]"
        : "border-[#414868] bg-[#15161E] text-[#565F89]"

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex w-[184px] cursor-pointer flex-col items-center select-none"
    >
      {/* ==================== HOVER PREVIEW CARD (450ms DELAY, COMPACT SUMMARY ONLY) ==================== */}
      {showHoverPreview && !isSelected && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-50 w-[215px] -translate-x-1/2 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="rounded-xl border border-[#414868] bg-[#1A1B26]/98 p-3 shadow-[0_16px_38px_rgba(0,0,0,0.75)] backdrop-blur-md">
            {/* 1. Tên chủ đề & Trạng thái */}
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-1 text-xs font-bold text-[#C0CAF5]">
                {data?.label}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${statusBadgeClass}`}
              >
                {status === "current" && <Sparkles className="size-2.5" />}
                {statusLabel}
              </span>
            </div>

            {/* 2. Tiến trình & Số lượng nhiệm vụ */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-medium text-[#A9B1D6]">
                  Tasks:{" "}
                  <strong className="font-mono text-[#C0CAF5]">
                    {completedTasks}/{totalTasks}
                  </strong>
                </span>
                <span className={`font-mono font-bold ${complexityColor}`}>
                  {progress}%
                </span>
              </div>

              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#15161E]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    status === "completed"
                      ? "bg-[#9ECE6A]"
                      : status === "current"
                        ? "bg-gradient-to-r from-[#7AA2F7] to-[#7DCFFF]"
                        : "bg-[#414868]"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 3. Gợi ý click (Không có nút Enter Workspace) */}
            <div className="mt-2 border-t border-[#292E42]/80 pt-1.5 text-center font-mono text-[9.5px] text-[#565F89]">
              Click node to view task details
            </div>
          </div>

          {/* Mũi tên trỏ xuống viên ngọc */}
          <div className="mx-auto -mt-1.5 size-2.5 rotate-45 border-r border-b border-[#414868] bg-[#1A1B26]" />
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

        {/* Ambient Outer Halo for Completed / Active Orbs */}
        {status !== "locked" && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -inset-1.5 rounded-full opacity-60 blur-md transition-opacity duration-200 group-hover:opacity-95 ${
              status === "completed" ? "bg-[#9ECE6A]/25" : "bg-[#3DB5E6]/30"
            }`}
          />
        )}

        {/* Selection Ring when Node Detail Pop-up is open */}
        {isSelected && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 rounded-full border-2 border-[#7AA2F7] shadow-[0_0_24px_rgba(122,162,247,0.65)]"
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
            stroke="#292E42"
            strokeWidth="3"
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
          className={`relative z-10 flex size-[56px] items-center justify-center rounded-full border-[2px] transition-transform duration-200 group-hover:scale-108 ${coreStyle}`}
        >
          {status === "completed" && (
            <Check className="size-6 stroke-[2.75] text-[#9ECE6A]" />
          )}
          {status === "current" && (
            <span className="font-mono text-[15px] font-extrabold tracking-tight text-[#7DCFFF]">
              {data?.shortCode || "01"}
            </span>
          )}
          {status === "locked" && (
            <Lock className="size-4.5 stroke-[2] text-[#565F89]" />
          )}
        </div>

        {/* 3 Mini Task Mastery Pips (Theory • Quiz • Code) perched on the bottom rim of the Orb */}
        <div className="absolute -bottom-1 z-20 flex items-center gap-1 rounded-full border border-[#292E42] bg-[#15161E] px-2 py-0.5 shadow-md">
          {[0, 1, 2].map((idx) => {
            const taskStatus = tasks[idx]?.status
            const isPipDone =
              taskStatus === "completed" || idx < completedTasks
            const isPipCurrent =
              !isPipDone &&
              status !== "locked" &&
              (taskStatus === "current" || idx === completedTasks)

            return (
              <span
                key={idx}
                className={`size-1.5 rounded-full transition-colors ${
                  isPipDone
                    ? "bg-[#9ECE6A] shadow-[0_0_5px_#9ECE6A]"
                    : isPipCurrent
                      ? "bg-[#7DCFFF] shadow-[0_0_5px_#7DCFFF]"
                      : "bg-[#414868]"
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* ==================== 2. FLOATING GLASS NAMEPLATE PILL ==================== */}
      <div
        className={`relative z-10 mt-2.5 flex flex-col items-center rounded-xl border bg-[#1A1B26]/95 px-3 py-1.5 text-center shadow-[0_8px_20px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors ${pillBorder}`}
      >
        <span
          className={`line-clamp-1 text-[12.5px] leading-tight font-bold ${
            status === "locked" ? "text-[#A9B1D6]/80" : "text-[#C0CAF5]"
          }`}
        >
          {data?.label}
        </span>
        <span
          className={`mt-0.5 font-mono text-[10.5px] font-semibold ${complexityColor}`}
        >
          {data?.complexity || `${completedTasks}/${totalTasks} Mastered`}
        </span>
      </div>
    </div>
  )
}

export default React.memo(CustomRoadmapNode)
