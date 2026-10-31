"use client"

import * as React from "react"
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Maximize2, Minus, Move, Plus } from "lucide-react"
import CustomRoadmapNode from "@/components/roadmap/CustomRoadmapNode"
import { buildLayoutedRoadmapGraph } from "@/utils/graphLayout"

const nodeTypes = {
  roadmapNode: CustomRoadmapNode,
}

function RoadmapFlowInner({
  roadmapNodes = [],
  selectedNodeId = null,
  onSelectNode,
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  const layouted = React.useMemo(
    () =>
      buildLayoutedRoadmapGraph(roadmapNodes, {
        direction: "LR",
        selectedNodeId,
      }),
    [roadmapNodes, selectedNodeId]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges)

  // Sync nodes & edges whenever roadmap data or selection updates
  React.useEffect(() => {
    setNodes(layouted.nodes)
    setEdges(layouted.edges)
  }, [layouted, setNodes, setEdges])

  // Re-fit view automatically when the roadmap node list changes
  const nodeSignature = React.useMemo(
    () => roadmapNodes.map((n) => n.id).join(","),
    [roadmapNodes]
  )

  React.useEffect(() => {
    if (!roadmapNodes.length) return
    const timer = window.setTimeout(() => {
      fitView({
        padding: 0.08,
        minZoom: 0.65,
        maxZoom: 1.1,
        duration: 260,
      })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [nodeSignature, roadmapNodes.length, fitView])

  const handleNodeClick = React.useCallback(
    (_event, node) => {
      if (onSelectNode) {
        onSelectNode(node.id)
      }
    },
    [onSelectNode]
  )

  return (
    <div
      className="relative h-full min-h-[470px] w-full flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Ambient Tokyo Night Glow inside the Canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[380px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7AA2F7]/[0.05] blur-[110px]"
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{
          padding: 0.08,
          minZoom: 0.65,
          maxZoom: 1.1,
        }}
        minZoom={0.4}
        maxZoom={1.85}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={[0, 1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="#292E42"
        />
      </ReactFlow>

      {/* Helper hint for Left/Right Click Pan + Tokyo Night Zoom Controls */}
      <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-20 flex items-center justify-between gap-2">
        <div className="hidden items-center gap-1.5 rounded-lg border border-[#292E42]/80 bg-[#1A1B26]/85 px-2.5 py-1 text-[11px] text-[#565F89] backdrop-blur-sm sm:inline-flex">
          <Move className="size-3 text-[#7AA2F7]" />
          <span>Hold Left or Right Click to drag map • Scroll to zoom</span>
        </div>

        <div className="pointer-events-auto ml-auto flex items-center gap-1 rounded-xl border border-[#292E42] bg-[#1A1B26]/95 p-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => zoomIn({ duration: 180 })}
            title="Zoom In"
            aria-label="Zoom In"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-[#A9B1D6] transition-colors hover:bg-[#292E42] hover:text-[#C0CAF5]"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => zoomOut({ duration: 180 })}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-[#A9B1D6] transition-colors hover:bg-[#292E42] hover:text-[#C0CAF5]"
          >
            <Minus className="size-3.5" />
          </button>
          <div className="mx-0.5 h-4 w-px bg-[#292E42]" />
          <button
            type="button"
            onClick={() =>
              fitView({
                padding: 0.06,
                minZoom: 0.78,
                maxZoom: 1.15,
                duration: 240,
              })
            }
            title="Fit View"
            aria-label="Fit View"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-[#7AA2F7] transition-colors hover:bg-[#292E42] hover:text-[#7DCFFF]"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoadmapCanvas(props) {
  return (
    <ReactFlowProvider>
      <RoadmapFlowInner {...props} />
    </ReactFlowProvider>
  )
}
