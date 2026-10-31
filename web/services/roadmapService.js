import {
  INITIAL_KNOWLEDGE_BASE_DOC,
  MOCK_ROADMAP_NODES,
} from "@/mocks/roadmapData"
import { getWorkspaceTaskDetail } from "@/mocks/workspaceTasks"
import { applyUserProgressToNodes } from "@/services/progressService"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""
const USE_MOCK_DATA = !API_BASE_URL

/**
 * Compute aggregate roadmap statistics from the list of nodes.
 */
export function buildRoadmapPayload(
  nodes,
  documentMeta = INITIAL_KNOWLEDGE_BASE_DOC
) {
  const totalCount = nodes.length
  const unlockedCount = nodes.filter((node) => node.status !== "locked").length
  const totalTasks = nodes.reduce((acc, node) => acc + (node.totalTasks || 0), 0)
  const completedTasks = nodes.reduce(
    (acc, node) => acc + (node.completedTasks || 0),
    0
  )
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    courseTitle: "Data Structures & Algorithms",
    completionPercent,
    unlockedCount,
    totalCount,
    nodes,
    knowledgeBase: {
      documents: [documentMeta],
      totalDocuments: 1,
      ragStatus: "RAG Citations Active",
    },
  }
}

/**
 * Merge a raw roadmap payload with a user's persisted task completion state.
 */
export function mergeRoadmapWithUserProgress(roadmapPayload, userProgress) {
  if (!roadmapPayload || !Array.isArray(roadmapPayload.nodes)) {
    return roadmapPayload
  }
  const mergedNodes = applyUserProgressToNodes(
    roadmapPayload.nodes,
    userProgress
  )
  const docMeta =
    roadmapPayload.knowledgeBase?.documents?.[0] || INITIAL_KNOWLEDGE_BASE_DOC
  return buildRoadmapPayload(mergedNodes, docMeta)
}

/**
 * Fetch the generated DSA Skill Tree Roadmap.
 * Uses native browser Fetch API when `NEXT_PUBLIC_API_URL` is set; otherwise resolves Mock Data.
 */
export async function fetchRoadmapData(options = {}) {
  const {
    fileName = INITIAL_KNOWLEDGE_BASE_DOC.name,
    fileSize = INITIAL_KNOWLEDGE_BASE_DOC.size,
  } = options

  if (!USE_MOCK_DATA) {
    const response = await fetch(`${API_BASE_URL}/api/roadmap`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch roadmap data (HTTP ${response.status})`)
    }

    const json = await response.json()
    return json
  }

  // Simulated async response from Mock Data
  await new Promise((resolve) => setTimeout(resolve, 180))

  const documentMeta = {
    ...INITIAL_KNOWLEDGE_BASE_DOC,
    name: fileName,
    size: fileSize,
  }

  return buildRoadmapPayload(MOCK_ROADMAP_NODES, documentMeta)
}

/**
 * Find the target task when clicking "Enter Workspace" on a Node:
 * 1. Prefer the task with `status === "current"`.
 * 2. Otherwise pick the first accessible task (`status !== "locked"`), or fallback to the first task.
 */
export function getInitialTaskForNode(node) {
  if (!node || !Array.isArray(node.tasks) || node.tasks.length === 0) {
    return null
  }
  const currentTask = node.tasks.find((t) => t.status === "current")
  if (currentTask) return currentTask

  const accessibleTask = node.tasks.find((t) => t.status !== "locked")
  return accessibleTask || node.tasks[0]
}

/**
 * Build the `/workspace/:nodeId/:taskId` URL for a given Roadmap node.
 */
export function getWorkspaceRouteForNode(node) {
  if (!node) return "/workspace/avl-tree/avl-tree-task-1"
  const targetTask = getInitialTaskForNode(node)
  if (!targetTask) return `/workspace/${node.id}`
  return `/workspace/${encodeURIComponent(node.id)}/${encodeURIComponent(
    targetTask.id
  )}`
}

/**
 * Find a specific roadmap node by its ID and resolve its prerequisite labels & initial workspace route.
 */
export function getRoadmapNodeById(nodes = [], nodeId) {
  if (!nodeId || !Array.isArray(nodes)) return null
  const found = nodes.find((node) => node.id === nodeId)
  if (!found) return null

  const prerequisiteNodes = (found.prerequisites || [])
    .map((prereqId) => nodes.find((n) => n.id === prereqId))
    .filter(Boolean)

  return {
    ...found,
    prerequisiteLabels: prerequisiteNodes.map((n) => n.label),
    workspaceHref: getWorkspaceRouteForNode(found),
  }
}

/**
 * Resolve the active Node, active Task, and detailed Task content for `/workspace/:nodeId/:taskId`.
 *
 * @param {string} [nodeId]
 * @param {string} [taskId]
 * @param {import("@/services/progressService").UserProgressData | null} [userProgress]
 */
export function resolveWorkspaceSession(nodeId, taskId, userProgress = null) {
  const effectiveNodes = userProgress
    ? applyUserProgressToNodes(MOCK_ROADMAP_NODES, userProgress)
    : MOCK_ROADMAP_NODES

  const node =
    effectiveNodes.find((n) => n.id === nodeId) ||
    effectiveNodes.find((n) => n.id === "avl-tree") ||
    effectiveNodes[0]

  const activeTask =
    node.tasks.find((t) => t.id === taskId) ||
    getInitialTaskForNode(node) ||
    node.tasks[0]

  const taskDetail = getWorkspaceTaskDetail(node, activeTask)

  return {
    node,
    activeTask,
    taskDetail,
  }
}
