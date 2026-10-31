"use client"

import * as React from "react"
import { Handle, Position } from "@xyflow/react"
import { Check, Lock, Sparkles } from "lucide-react"

/**
 * Custom React Flow Node with Tokyo Night Skill-Card aesthetic:
 * - Left/Right edge-mounted connection ports so curves never cross over labels.
 * - Status Medallion (Completed Check / Active Step Number / Locked Icon).
 * - Topic Title, Big-O Complexity tag, and 3-stage segmented Task Progress Bar.
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

  const cardStyle =
    status === "completed"
      ? "border-[#9ECE6A]/70 bg-gradient-to-br from-[#1A1B26] via-[#1A1B26] to-[#9ECE6A]/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.5),0_0_18px_rgba(158,206,106,0.14)] hover:border-[#9ECE6A]"
      : status === "current"
        ? "border-[#3DB5E6] bg-gradient-to-br from-[#1A1B26] via-[#1E2235] to-[#3DB5E6]/[0.12] shadow-[0_12px_32px_rgba(0,0,0,0.55),0_0_24px_rgba(61,181,230,0.24)] hover:border-[#7DCFFF]"
        : "border-[#292E42] bg-[#161722]/90 opacity-80 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:border-[#414868] hover:opacity-95"

  const medallionStyle =
    status === "completed"
      ? "border-[#9ECE6A] bg-[#9ECE6A]/15 text-[#9ECE6A] shadow-[0_0_12px_rgba(158,206,106,0.28)]"
      : status === "current"
        ? "border-[#3DB5E6] bg-[#3DB5E6]/15 text-[#7DCFFF] shadow-[0_0_14px_rgba(61,181,230,0.35)]"
        : "border-[#414868] bg-[#15161E] text-[#565F89]"

  const badgeStyle =
    status === "completed"
      ? "border-[#9ECE6A]/35 bg-[#9ECE6A]/12 text-[#9ECE6A]"
      : status === "current"
        ? "border-[#3DB5E6]/40 bg-[#3DB5E6]/15 text-[#7DCFFF]"
        : "border-[#292E42] bg-[#15161E] text-[#565F89]"

  const portColor =
    status === "completed"
      ? "!border-[#9ECE6A] !bg-[#15161E]"
      : status === "current"
        ? "!border-[#3DB5E6] !bg-[#15161E]"
        : "!border-[#414868] !bg-[#15161E]"

  return (
    <div
      className={`group relative w-[224px] cursor-pointer rounded-2xl border-[1.75px] p-3.5 transition-all duration-200 select-none hover:-translate-y-0.5 ${cardStyle} ${
        isSelected
          ? "ring-2 ring-[#7AA2F7] ring-offset-2 ring-offset-[#15161E]"
          : ""
      }`}
    >
      {/* Left Target Port */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className={`!size-2.5 !rounded-full !border-2 ${portColor}`}
      />

      {/* Right Source Port */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className={`!size-2.5 !rounded-full !border-2 ${portColor}`}
      />

      {/* Subtle top highlight line for active/completed nodes */}
      {status !== "locked" && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-6 top-0 h-[1.5px] rounded-full ${
            status === "completed"
              ? "bg-gradient-to-r from-transparent via-[#9ECE6A]/70 to-transparent"
              : "bg-gradient-to-r from-transparent via-[#7DCFFF]/85 to-transparent"
          }`}
        />
      )}

      {/* Row 1: Medallion + Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`relative flex size-9 shrink-0 items-center justify-center rounded-xl border-[2px] transition-transform duration-200 group-hover:scale-105 ${medallionStyle}`}
          >
            {status === "completed" && (
              <Check className="size-4 stroke-[2.75]" />
            )}
            {status === "current" && (
              <>
                <span className="font-mono text-xs font-extrabold">
                  {data?.shortCode || "01"}
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#7DCFFF] shadow-[0_0_8px_#7DCFFF]"
                />
              </>
            )}
            {status === "locked" && <Lock className="size-3.5 stroke-[2]" />}
          </div>

          <div className="min-w-0">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${badgeStyle}`}
            >
              {status === "completed" ? (
                "Mastered"
              ) : status === "current" ? (
                <>
                  <Sparkles className="size-2.5" />
                  <span>Active</span>
                </>
              ) : (
                "Locked"
              )}
            </span>
          </div>
        </div>

        {/* Complexity Tag */}
        {data?.complexity && (
          <span className="truncate rounded-md border border-[#292E42] bg-[#15161E]/90 px-2 py-0.5 font-mono text-[10px] font-medium text-[#7AA2F7]">
            {data.complexity.split("/")[0].trim()}
          </span>
        )}
      </div>

      {/* Row 2: Topic Title */}
      <div className="mt-2.5">
        <h3
          className={`line-clamp-1 text-[13.5px] leading-snug font-bold tracking-tight ${
            status === "locked" ? "text-[#A9B1D6]" : "text-[#C0CAF5]"
          }`}
        >
          {data?.label}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#565F89]">
          {data?.description || "Core concepts, quiz & coding challenge"}
        </p>
      </div>

      {/* Row 3: 3-Segment Task Progress Bar (Theory • Quiz • Code) */}
      <div className="mt-3 border-t border-[#292E42]/80 pt-2.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium text-[#A9B1D6]">
            {completedTasks}/{totalTasks} Tasks
          </span>
          <span
            className={`font-mono font-bold ${
              status === "completed"
                ? "text-[#9ECE6A]"
                : status === "current"
                  ? "text-[#7DCFFF]"
                  : "text-[#565F89]"
            }`}
          >
            {progress}%
          </span>
        </div>

        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((idx) => {
            const taskStatus = tasks[idx]?.status
            const isSegmentDone =
              taskStatus === "completed" || idx < completedTasks
            const isSegmentCurrent =
              !isSegmentDone &&
              status !== "locked" &&
              (taskStatus === "current" || idx === completedTasks)

            return (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-colors ${
                  isSegmentDone
                    ? "bg-[#9ECE6A] shadow-[0_0_6px_rgba(158,206,106,0.45)]"
                    : isSegmentCurrent
                      ? "bg-[#3DB5E6] shadow-[0_0_6px_rgba(61,181,230,0.45)]"
                      : "bg-[#292E42]"
                }`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default React.memo(CustomRoadmapNode)
