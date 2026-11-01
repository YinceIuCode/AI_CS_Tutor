"use client"

import * as React from "react"
import { Handle, Position } from "@xyflow/react"
import { Check, Lock } from "lucide-react"

/**
 * Custom React Flow Node — Tokyo Night "Skill Orb / Medallion" Design:
 * - Preserves the true Skill Tree / Constellation feel (circular multi-ring orb, not a rectangular card)
 *   so clicking a node to open the Detail Pop-up remains meaningful and rewarding.
 * - Features an SVG radial mastery ring around the orb, 3 mini task pips (Theory • Quiz • Code)
 *   on the bottom rim, and left/right orb-rim connection ports so curves never cross the label pill.
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

  // SVG Radial Progress Ring geometry (76x76 viewBox, r = 33)
  const radius = 33
  const circumference = 2 * Math.PI * radius
  const dashOffset =
    status === "completed"
      ? 0
      : status === "locked"
        ? circumference
        : circumference - ( Math.max(progress, 18) / 100 ) * circumference

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

  return (
    <div className="group flex w-[184px] cursor-pointer flex-col items-center select-none">
      {/* ==================== 1. MULTI-RING SKILL ORB (76x76px) ==================== */}
      <div className="relative flex size-[76px] items-center justify-center">
        {/* Left Target Port anchored directly to the Left Rim of the Orb */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          style={{ top: "50%", left: "2px" }}
          className={`!size-2.5 !rounded-full !border-2 ${portColor}`}
        />

        {/* Right Source Port anchored directly to the Right Rim of the Orb */}
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={false}
          style={{ top: "50%", right: "2px" }}
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
