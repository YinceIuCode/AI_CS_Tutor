import dagre from "@dagrejs/dagre"
import { Position } from "@xyflow/react"

const NODE_WIDTH = 224
const NODE_HEIGHT = 138

/**
 * Determine edge visual state ("completed" | "active" | "locked") based on source and target node statuses.
 */
function resolveEdgeState(sourceStatus, targetStatus) {
  if (sourceStatus === "completed" && targetStatus === "completed") {
    return "completed"
  }
  if (
    (sourceStatus === "completed" && targetStatus === "current") ||
    (sourceStatus === "current" && targetStatus === "current")
  ) {
    return "active"
  }
  return "locked"
}

/**
 * Build React Flow nodes and edges from Roadmap domain nodes and compute automatic Dagre layout coordinates.
 * Defaults to "LR" (Horizontal Tree from Left to Right).
 *
 * @param {Array} roadmapNodes - List of roadmap topic nodes with `prerequisites`.
 * @param {Object} options
 * @param {string} [options.direction="LR"] - Layout direction ("LR" for Horizontal Tree, "TB" for Vertical Tree).
 * @param {string|null} [options.selectedNodeId=null] - Currently selected node ID for Pop-up highlight.
 */
export function buildLayoutedRoadmapGraph(roadmapNodes = [], options = {}) {
  const { direction = "LR", selectedNodeId = null } = options
  const isHorizontal = direction === "LR"

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: direction,
    align: "UL",
    nodesep: isHorizontal ? 38 : 56,
    ranksep: isHorizontal ? 86 : 64,
    marginx: 28,
    marginy: 24,
  })

  const nodeMap = new Map()
  roadmapNodes.forEach((node) => {
    nodeMap.set(node.id, node)
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })
  })

  const rawEdges = []
  roadmapNodes.forEach((targetNode) => {
    const prereqs = Array.isArray(targetNode.prerequisites)
      ? targetNode.prerequisites
      : []

    prereqs.forEach((sourceId) => {
      if (!nodeMap.has(sourceId)) return

      dagreGraph.setEdge(sourceId, targetNode.id)

      const sourceNode = nodeMap.get(sourceId)
      const edgeState = resolveEdgeState(sourceNode.status, targetNode.status)

      const strokeColor =
        edgeState === "completed"
          ? "#9ECE6A"
          : edgeState === "active"
            ? "#3DB5E6"
            : "#414868"

      rawEdges.push({
        id: `edge-${sourceId}-${targetNode.id}`,
        source: sourceId,
        target: targetNode.id,
        type: "default",
        animated: edgeState === "active",
        style: {
          stroke: strokeColor,
          strokeWidth: edgeState === "locked" ? 2 : 2.5,
          strokeDasharray:
            edgeState === "locked"
              ? "6 5"
              : edgeState === "active"
                ? "7 4"
                : undefined,
        },
      })
    })
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = roadmapNodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id)
    const position = dagreNode
      ? {
          x: dagreNode.x - NODE_WIDTH / 2,
          y: dagreNode.y - NODE_HEIGHT / 2,
        }
      : { x: 0, y: 0 }

    return {
      id: node.id,
      type: "roadmapNode",
      position,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      data: {
        ...node,
        isSelected: node.id === selectedNodeId,
      },
    }
  })

  return {
    nodes: layoutedNodes,
    edges: rawEdges,
  }
}
