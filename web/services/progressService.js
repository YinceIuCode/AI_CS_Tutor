import { syncTaskProgressToSupabase } from "./adminService"

/**
 * @typedef {Object} QuizProgressItem
 * @property {string | null} selectedOption
 * @property {boolean} [isSubmitted]
 */

/**
 * @typedef {Object} CodeProgressItem
 * @property {string} code
 * @property {string} [language]
 * @property {boolean} [isSubmitted]
 */

/**
 * @typedef {Object} UserProgressData
 * @property {string} userId
 * @property {"registered" | "guest"} accountType
 * @property {"empty" | "ready"} roadmapFlowState
 * @property {string} fileName
 * @property {string} fileSize
 * @property {Record<string, boolean>} completedTasks
 * @property {Record<string, QuizProgressItem>} quizAnswers
 * @property {Record<string, CodeProgressItem>} codeDrafts
 * @property {Record<string, number>} hintsRemaining
 * @property {string} updatedAt
 */

const REGISTERED_PROGRESS_PREFIX = "algopath_progress_v2_"
const GUEST_PROGRESS_PREFIX = "algopath_guest_progress_v2_"
const PROGRESS_BROADCAST_CHANNEL = "algopath_progress_sync"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

/**
 * Create a default empty progress object for a user.
 *
 * @param {string} userId
 * @param {"registered" | "guest"} [accountType="registered"]
 * @returns {UserProgressData}
 */
export function createDefaultProgress(userId, accountType = "registered") {
  return {
    userId: userId || "anonymous",
    accountType,
    roadmapFlowState: "empty",
    fileName: "CS101_DSA_Syllabus_HCMUS.pdf",
    fileSize: "2.4 MB",
    completedTasks: {},
    quizAnswers: {},
    codeDrafts: {},
    hintsRemaining: {},
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Resolve storage engine and key based on accountType.
 * - Registered users persist across logins in `localStorage`.
 * - Guest users persist across page refreshes in `sessionStorage` and are cleared on logout.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 */
function getStorageTarget(user) {
  // Admin là quản trị viên hệ thống, không lưu tiến độ học tập
  if (typeof window === "undefined" || !user?.id || user?.role === "admin") {
    return null
  }
  const isGuest = user.accountType === "guest"
  const storage = isGuest ? window.sessionStorage : window.localStorage
  const key = isGuest
    ? `${GUEST_PROGRESS_PREFIX}${user.id}`
    : `${REGISTERED_PROGRESS_PREFIX}${user.id}`

  return { storage, key, isGuest }
}

/**
 * Read the saved learning progress for the given user.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @returns {UserProgressData}
 */
export function getUserProgress(user) {
  const accountType = user?.accountType === "guest" ? "guest" : "registered"
  const fallback = createDefaultProgress(user?.id || "anonymous", accountType)
  const target = getStorageTarget(user)
  if (!target) return fallback

  try {
    const raw = target.storage.getItem(target.key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return {
      ...fallback,
      ...parsed,
      completedTasks: parsed.completedTasks || {},
      quizAnswers: parsed.quizAnswers || {},
      codeDrafts: parsed.codeDrafts || {},
      hintsRemaining: parsed.hintsRemaining || {},
    }
  } catch {
    return fallback
  }
}

/**
 * Persist updated user progress and notify listeners in the current tab.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @param {(prev: UserProgressData) => UserProgressData} updater
 * @returns {UserProgressData}
 */
export function updateUserProgress(user, updater) {
  const current = getUserProgress(user)
  const next = {
    ...updater(current),
    updatedAt: new Date().toISOString(),
  }

  const target = getStorageTarget(user)
  if (target) {
    try {
      target.storage.setItem(target.key, JSON.stringify(next))
      window.dispatchEvent(new CustomEvent("algopath:progress-updated"))

      // Broadcast instant update across multiple open tabs on the same browser
      if (typeof BroadcastChannel !== "undefined" && !target.isGuest) {
        const channel = new BroadcastChannel(PROGRESS_BROADCAST_CHANNEL)
        channel.postMessage({ userId: user?.id, updatedAt: next.updatedAt })
        channel.close()
      }

      // When Backend API is configured, asynchronously sync registered user progress to server for multi-device support
      if (API_BASE_URL && !target.isGuest && user?.id) {
        fetch(`${API_BASE_URL}/api/progress/${encodeURIComponent(user.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(() => {
          // Fallback silently to localStorage if backend is unreachable
        })
      }
    } catch {
      // Ignore storage quota errors in restricted environments
    }
  }

  return next
}

/**
 * Save Roadmap upload/generation state for the current user.
 * When resetting to "empty", also reset completedTasks/quizAnswers/codeDrafts so the tree starts fresh.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @param { { roadmapFlowState: "empty" | "ready"; fileName?: string; fileSize?: string } } payload
 */
export function saveRoadmapFlowState(user, payload) {
  return updateUserProgress(user, (prev) => {
    if (payload.roadmapFlowState === "empty") {
      return {
        ...prev,
        roadmapFlowState: "empty",
        completedTasks: {},
        quizAnswers: {},
        codeDrafts: {},
        hintsRemaining: {},
      }
    }
    return {
      ...prev,
      roadmapFlowState: payload.roadmapFlowState,
      fileName: payload.fileName ?? prev.fileName,
      fileSize: payload.fileSize ?? prev.fileSize,
    }
  })
}

/**
 * Save selected quiz option (and optional submission state) for a task.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @param {string} taskId
 * @param {QuizProgressItem} quizState
 */
export function saveQuizProgress(user, taskId, quizState) {
  if (!taskId) return getUserProgress(user)
  const next = updateUserProgress(user, (prev) => ({
    ...prev,
    quizAnswers: {
      ...prev.quizAnswers,
      [taskId]: {
        ...(prev.quizAnswers[taskId] || {}),
        ...quizState,
      },
    },
  }))

  if (user?.id) {
    try {
      syncTaskProgressToSupabase(user.id, taskId, undefined, quizState).catch(() => {})
    } catch {}
  }

  return next
}

/**
 * Save code draft in Monaco Editor for a coding task.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @param {string} taskId
 * @param {CodeProgressItem} codeState
 */
export function saveCodeProgress(user, taskId, codeState) {
  if (!taskId) return getUserProgress(user)

  return updateUserProgress(user, (prev) => ({
    ...prev,
    codeDrafts: {
      ...prev.codeDrafts,
      [taskId]: {
        ...(typeof prev.codeDrafts[taskId] === "object" && prev.codeDrafts[taskId] !== null
          ? prev.codeDrafts[taskId]
          : typeof prev.codeDrafts[taskId] === "string"
          ? { code: prev.codeDrafts[taskId] }
          : {}),
        ...codeState,
      },
    },
  }))
}

/**
 * Save remaining Socratic hints count for a task.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @param {string} taskId
 * @param {number} remaining
 */
export function saveHintsProgress(user, taskId, remaining) {
  if (!taskId) return getUserProgress(user)
  return updateUserProgress(user, (prev) => ({
    ...prev,
    hintsRemaining: {
      ...prev.hintsRemaining,
      [taskId]: remaining,
    },
  }))
}

/**
 * Mark a specific task as completed and persist to user's progress.
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @param {string} taskId
 */
export function markTaskAsCompleted(user, taskId) {
  if (!taskId) return getUserProgress(user)

  const next = updateUserProgress(user, (prev) => ({
    ...prev,
    completedTasks: {
      ...prev.completedTasks,
      [taskId]: true,
    },
  }))

  if (user?.id) {
    try {
      syncTaskProgressToSupabase(user.id, taskId, true, null).catch(() => {})
    } catch {}
  }

  return next
}

/**
 * Clear temporary Guest progress on logout.
 *
 * @param {string} [guestId]
 */
export function clearGuestProgress(guestId) {
  if (typeof window === "undefined") return
  try {
    if (guestId) {
      window.sessionStorage.removeItem(`${GUEST_PROGRESS_PREFIX}${guestId}`)
    }
    const keysToRemove = []
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i)
      if (k && k.startsWith(GUEST_PROGRESS_PREFIX)) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Merge a user's saved task completions into the Roadmap nodes:
 * - Updates task statuses (`completed` / `current` / `locked`) within each node.
 * - Recalculates `completedTasks` and `progress` percentage on each node.
 * - Automatically unlocks downstream nodes when prerequisites are completed.
 *
 * @template T
 * @param {Array<T>} baseNodes
 * @param {UserProgressData | null | undefined} [userProgress]
 * @returns {Array<T>}
 */
/**
 * Sanitize completedTasks by purging any taskId belonging to a node that is currently LOCKED.
 * Enforces the strict DAG invariant: a node cannot have completed tasks if its prerequisites are not met.
 *
 * @param {Array} baseNodes
 * @param {Record<string, boolean>} rawCompletedTasks
 * @returns {Record<string, boolean>}
 */
export function sanitizeUserProgress(baseNodes = [], rawCompletedTasks = {}) {
  if (!rawCompletedTasks || typeof rawCompletedTasks !== "object") {
    return {}
  }

  const completedMap = { ...rawCompletedTasks }

  // Fixed-point topological resolution of unlocked nodes
  const completedNodeIds = new Set()
  const unlockedNodeIds = new Set()

  let changed = true
  let iterations = 0
  const maxIterations = Math.max(10, baseNodes.length * 2)

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++

    for (const node of baseNodes) {
      if (completedNodeIds.has(node.id)) continue

      const prereqs = Array.isArray(node.prerequisites) ? node.prerequisites : []
      // Rule 1: EVERY prerequisite must be 100% completed
      const allPrereqsDone =
        prereqs.length === 0 ||
        prereqs.every((pId) => completedNodeIds.has(pId))

      if (allPrereqsDone) {
        if (!unlockedNodeIds.has(node.id)) {
          unlockedNodeIds.add(node.id)
          changed = true
        }

        const nodeTasks = Array.isArray(node.tasks) ? node.tasks : []
        const totalTasks = nodeTasks.length || node.totalTasks || 3
        const doneTasks = nodeTasks.filter((t) => Boolean(completedMap[t.id]))

        if (doneTasks.length >= totalTasks && totalTasks > 0) {
          completedNodeIds.add(node.id)
          changed = true
        }
      }
    }
  }

  // Any node NOT in unlockedNodeIds is LOCKED.
  // Purge any orphan/stale completed tasks belonging to locked nodes!
  for (const node of baseNodes) {
    if (!unlockedNodeIds.has(node.id)) {
      const nodeTasks = Array.isArray(node.tasks) ? node.tasks : []
      nodeTasks.forEach((t) => {
        delete completedMap[t.id]
      })
      delete completedMap[`${node.id}-task-1`]
      delete completedMap[`${node.id}-task-2`]
      delete completedMap[`${node.id}-task-3`]
      if (node.id === "sorting-algorithms") {
        delete completedMap["sorting-task-1"]
        delete completedMap["sorting-task-2"]
        delete completedMap["sorting-task-3"]
      }
      if (node.id === "graph-algorithms") {
        delete completedMap["graph-task-1"]
        delete completedMap["graph-task-2"]
        delete completedMap["graph-task-3"]
      }
      if (node.id === "binary-search-tree") {
        delete completedMap["bst-task-1"]
        delete completedMap["bst-task-2"]
        delete completedMap["bst-task-3"]
      }
    }
  }

  return completedMap
}

/**
 * Compute the strict DAG state for all nodes in the skill tree based on user progress.
 *
 * Implements 5 Strict Invariants:
 * 1. EVERY prerequisite must be 100% completed (`status === 'completed'`) for a node to unlock.
 * 2. Priority 1: If !isUnlocked -> STRICTLY `status = 'locked'`, `completedTasks = 0`, `progress = 0`, all tasks locked.
 * 3. Priority 2: If isUnlocked:
 *    - if doneCount >= totalTasks -> `status = 'completed'` (100%)
 *    - else -> `status = 'current'` (Active / In Progress)
 *
 * @template T
 * @param {Array<T>} baseNodes
 * @param {UserProgressData | null | undefined} [userProgress]
 * @returns {Array<T>}
 */
export function applyUserProgressToNodes(baseNodes = [], userProgress = null) {
  if (!Array.isArray(baseNodes) || baseNodes.length === 0) {
    return []
  }

  const rawCompletedMap = userProgress?.completedTasks || {}

  // 1. Sanitize orphaned completed tasks belonging to locked nodes
  const sanitizedCompletedMap = sanitizeUserProgress(baseNodes, rawCompletedMap)

  // 2. Fixed-point topological resolution of node states
  const completedNodeIds = new Set()
  const unlockedNodeIds = new Set()

  let changed = true
  let iterations = 0
  const maxIterations = Math.max(10, baseNodes.length * 2)

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++

    for (const node of baseNodes) {
      if (completedNodeIds.has(node.id)) continue

      const prereqs = Array.isArray(node.prerequisites) ? node.prerequisites : []
      // Rule 1: EVERY prerequisite must be completed (Array.prototype.every)
      const allPrereqsDone =
        prereqs.length === 0 ||
        prereqs.every((pId) => completedNodeIds.has(pId))

      if (allPrereqsDone) {
        if (!unlockedNodeIds.has(node.id)) {
          unlockedNodeIds.add(node.id)
          changed = true
        }

        const nodeTasks = Array.isArray(node.tasks) ? node.tasks : []
        const totalTasks = nodeTasks.length || node.totalTasks || 3
        const doneTasks = nodeTasks.filter(
          (t) => Boolean(sanitizedCompletedMap[t.id])
        )

        if (doneTasks.length >= totalTasks && totalTasks > 0) {
          completedNodeIds.add(node.id)
          changed = true
        }
      }
    }
  }

  // 3. Map final node states with strict Priority 1 (!isUnlocked) and Priority 2 (isUnlocked)
  return baseNodes.map((node) => {
    const isUnlocked = unlockedNodeIds.has(node.id)
    const nodeTasks = Array.isArray(node.tasks) ? node.tasks : []
    const totalTasks = nodeTasks.length || node.totalTasks || 3

    // ==================== PRIORITY 1: LOCKED ====================
    // If not unlocked, STRICTLY locked: 0/3 tasks, 0% progress, all tasks locked!
    if (!isUnlocked) {
      const lockedTasks = nodeTasks.map((t) => ({
        ...t,
        status: "locked",
      }))
      return {
        ...node,
        status: "locked",
        completedTasks: 0,
        totalTasks,
        progress: 0,
        tasks: lockedTasks,
      }
    }

    // ==================== PRIORITY 2: UNLOCKED ====================
    const doneTasksCount = nodeTasks.filter(
      (t) => Boolean(sanitizedCompletedMap[t.id])
    ).length
    const isAllDone = doneTasksCount >= totalTasks && totalTasks > 0

    if (isAllDone) {
      // Completed node (100%)
      const completedTasks = nodeTasks.map((t) => ({
        ...t,
        status: "completed",
      }))
      return {
        ...node,
        status: "completed",
        completedTasks: totalTasks,
        totalTasks,
        progress: 100,
        tasks: completedTasks,
      }
    }

    // In Progress node (current, 0 to < totalTasks)
    let assignedCurrent = false
    const currentTasks = nodeTasks.map((t) => {
      const isTaskDone = Boolean(sanitizedCompletedMap[t.id])
      if (isTaskDone) {
        return { ...t, status: "completed" }
      }
      if (!assignedCurrent) {
        assignedCurrent = true
        return { ...t, status: "current" }
      }
      return { ...t, status: "locked" }
    })

    const progress =
      totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0

    return {
      ...node,
      status: "current",
      completedTasks: doneTasksCount,
      totalTasks,
      progress,
      tasks: currentTasks,
    }
  })
}
