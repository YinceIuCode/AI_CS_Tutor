import dagre from "@dagrejs/dagre"
import { Position } from "@xyflow/react"

const NODE_WIDTH = 184
const NODE_HEIGHT = 132

/**
 * Planar (zero-crossing) grid slots for the 10 standard DSA Skill Tree topics:
 * - Row 0 (Top Track):    Linked List -> Trees -> Binary Search Tree -> AVL Tree
 * - Row 1 (Middle Track): DSA Foundations -> Arrays & Strings -> Stack & Queue -> Graph Algorithms
 * - Row 2 (Bottom Track): Complexity Analysis -> Sorting Algorithms
 * Every prerequisite edge connects strictly from Column C to Column C+1 on the same or adjacent row,
 * guaranteeing 0 wire crossings and 0 wires colliding with nodes.
 */
const PLANAR_TRACK_SLOTS = {
  "dsa-foundations": { col: 0, row: 1 },
  "linked-list": { col: 1, row: 0 },
  "arrays-strings": { col: 1, row: 1 },
  "complexity-analysis": { col: 1, row: 2 },
  trees: { col: 2, row: 0 },
  "stack-queue": { col: 2, row: 1 },
  "sorting-algorithms": { col: 2, row: 2 },
  "binary-search-tree": { col: 3, row: 0 },
  "graph-algorithms": { col: 3, row: 1 },
  "avl-tree": { col: 4, row: 0 },
}

const COLUMN_STEP_X = 256
const ROW_STEP_Y = 166

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
 * Build React Flow nodes and edges from Roadmap domain nodes using a planar (non-crossing)
 * Horizontal Tree layout with Dagre fallback for dynamic Backend nodes.
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
    ranker: "longest-path",
    align: "UL",
    nodesep: isHorizontal ? 44 : 60,
    ranksep: isHorizontal ? 88 : 64,
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
    const planarSlot = isHorizontal ? PLANAR_TRACK_SLOTS[node.id] : null
    const dagreNode = dagreGraph.node(node.id)

    const position = planarSlot
      ? {
          x: planarSlot.col * COLUMN_STEP_X,
          y: planarSlot.row * ROW_STEP_Y,
        }
      : dagreNode
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
