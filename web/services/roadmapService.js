import {
  INITIAL_KNOWLEDGE_BASE_DOC,
  MOCK_ROADMAP_NODES,
  MOCK_OOP_ROADMAP_NODES,
} from "@/mocks/roadmapData"
import { getWorkspaceTaskDetail } from "@/mocks/workspaceTasks"
import { applyUserProgressToNodes } from "@/services/progressService"
import { getCurriculumOverrides } from "@/services/adminService"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

/**
 * Overlay any admin curriculum overrides onto mock roadmap nodes
 */
export function getEffectiveMockNodes(docId = "") {
  if (docId === "doc-oop-syllabus" || String(docId).includes("oop")) {
    return MOCK_OOP_ROADMAP_NODES
  }

  const overrides = getCurriculumOverrides()
  if (!overrides || !overrides.nodes) return MOCK_ROADMAP_NODES

  return MOCK_ROADMAP_NODES.map((node) => {
    const override = overrides.nodes[node.id]
    if (!override) return node
    return {
      ...node,
      label: override.label || node.label,
      shortCode: override.short_code || override.shortCode || node.shortCode,
      complexity: override.target_complexity || override.complexity || node.target_complexity || node.complexity,
      target_complexity: override.target_complexity || override.complexity || node.target_complexity || node.complexity,
      description: override.description || node.description,
    }
  })
}

/**
 * Compute aggregate roadmap statistics from the list of nodes.
 */
export function buildRoadmapPayload(
  nodes,
  documentMeta = INITIAL_KNOWLEDGE_BASE_DOC
) {
  const isOop =
    documentMeta?.id === "doc-oop-syllabus" ||
    documentMeta?.id === "00000005-0000-4000-8000-000000000002" ||
    String(documentMeta?.id || "").includes("0002") ||
    String(documentMeta?.name || "").includes("OOP") ||
    nodes.some((n) => String(n.id).startsWith("oop-"))

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
    courseTitle: isOop
      ? "CS102 - Object-Oriented Programming (HCMUS)"
      : "CS101 - Data Structures & Algorithms (HCMUS)",
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
 * Prioritizes direct Supabase queries, then REST API, then local Mock Data fallback.
 */
export async function fetchRoadmapData(options = {}) {
  const {
    fileName = INITIAL_KNOWLEDGE_BASE_DOC.name,
    fileSize = INITIAL_KNOWLEDGE_BASE_DOC.size,
    documentId = "",
  } = options

  const isOop =
    documentId === "00000005-0000-4000-8000-000000000002" ||
    documentId === "doc-oop-syllabus" ||
    String(documentId).includes("oop") ||
    String(documentId).includes("0002") ||
    String(fileName).includes("OOP")

  // 1. Primary: Fetch from FastAPI Backend
  if (API_BASE_URL) {
    try {
      const docParam = isOop
        ? "00000005-0000-4000-8000-000000000002"
        : "00000005-0000-4000-8000-000000000001"
      const response = await fetch(
        `${API_BASE_URL}/api/roadmap?document_id=${encodeURIComponent(docParam)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      )

      if (response.ok) {
        const json = await response.json()
        if (json && Array.isArray(json.nodes)) {
          const filtered = isOop
            ? json.nodes.filter(
                (n) =>
                  n.document_id === "00000005-0000-4000-8000-000000000002" ||
                  String(n.id).startsWith("oop-")
              )
            : json.nodes.filter((n) => !String(n.id).startsWith("oop-"))
          return {
            ...json,
            nodes: filtered,
          }
        }
        return json
      }
    } catch (err) {
      console.warn("[RoadmapService] FastAPI backend unreachable, falling back to mock:", err.message)
    }
  }

  // 2. Offline Fallback from Mock Data
  await new Promise((resolve) => setTimeout(resolve, 150))
  const targetMockNodes = isOop
    ? MOCK_OOP_ROADMAP_NODES
    : getEffectiveMockNodes("doc-dsa-syllabus")
  const documentMeta = {
    ...INITIAL_KNOWLEDGE_BASE_DOC,
    id: isOop ? "00000005-0000-4000-8000-000000000002" : "00000005-0000-4000-8000-000000000001",
    name: fileName,
    size: fileSize,
  }
  return buildRoadmapPayload(targetMockNodes, documentMeta)
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
  const dsaNodes = getEffectiveMockNodes("doc-dsa-syllabus")
  const oopNodes = getEffectiveMockNodes("doc-oop-syllabus")
  const allBaseNodes = [...dsaNodes, ...oopNodes]
  const uniqueBaseNodes = Array.from(new Map(allBaseNodes.map((n) => [n.id, n])).values())

  const effectiveNodes = userProgress
    ? applyUserProgressToNodes(uniqueBaseNodes, userProgress)
    : uniqueBaseNodes

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

/**
 * Async version of resolveWorkspaceSession that attempts to fetch dynamic task content from Supabase.
 */
export async function resolveWorkspaceSessionAsync(
  nodeId,
  taskId,
  userProgress = null
) {
  const baseSession = resolveWorkspaceSession(nodeId, taskId, userProgress)
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${encodeURIComponent(baseSession.activeTask.id)}`)
      if (res.ok) {
        const json = await res.json()
        return {
          ...baseSession,
          taskDetail: json,
        }
      }
    } catch (err) {
      console.warn("[RoadmapService] Backend task detail fetch failed:", err)
    }
  }
  return baseSession
}

/**
 * Evaluate Quiz answer on the server (Protected grading).
 */
export async function evaluateQuizAnswer(taskId, selectedOption) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/quiz/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, selectedOption }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn("[RoadmapService] Quiz evaluate API unreachable:", err.message)
  }
  return null
}
