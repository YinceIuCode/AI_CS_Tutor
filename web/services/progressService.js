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

const REGISTERED_PROGRESS_PREFIX = "algopath_progress_"
const GUEST_PROGRESS_PREFIX = "algopath_guest_progress_"
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
  if (typeof window === "undefined" || !user?.id) {
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
 *
 * @param { { id?: string; accountType?: "registered" | "guest" } | null | undefined } user
 * @param { { roadmapFlowState: "empty" | "ready"; fileName?: string; fileSize?: string } } payload
 */
export function saveRoadmapFlowState(user, payload) {
  return updateUserProgress(user, (prev) => ({
    ...prev,
    roadmapFlowState: payload.roadmapFlowState,
    fileName: payload.fileName ?? prev.fileName,
    fileSize: payload.fileSize ?? prev.fileSize,
  }))
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
  return updateUserProgress(user, (prev) => ({
    ...prev,
    quizAnswers: {
      ...prev.quizAnswers,
      [taskId]: {
        ...(prev.quizAnswers[taskId] || {}),
        ...quizState,
      },
    },
  }))
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
        ...(prev.codeDrafts[taskId] || {}),
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
  return updateUserProgress(user, (prev) => ({
    ...prev,
    completedTasks: {
      ...prev.completedTasks,
      [taskId]: true,
    },
  }))
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
export function applyUserProgressToNodes(baseNodes = [], userProgress = null) {
  const completedMap = userProgress?.completedTasks || {}

  // Pass 1: Update tasks and node completion percentages
  const updatedNodes = baseNodes.map((node) => {
    const rawTasks = Array.isArray(node.tasks) ? node.tasks : []
    let foundCurrent = false

    const nextTasks = rawTasks.map((task) => {
      const isDone =
        task.status === "completed" || Boolean(completedMap[task.id])
      if (isDone) {
        return { ...task, status: "completed" }
      }
      if (!foundCurrent && node.status !== "locked") {
        foundCurrent = true
        return { ...task, status: "current" }
      }
      return {
        ...task,
        status: task.status === "current" ? "current" : "locked",
      }
    })

    const totalTasks = nextTasks.length || node.totalTasks || 3
    const completedTasksCount = nextTasks.filter(
      (t) => t.status === "completed"
    ).length
    const progress =
      totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0

    let nextNodeStatus = node.status
    if (completedTasksCount >= totalTasks && totalTasks > 0) {
      nextNodeStatus = "completed"
    }

    return {
      ...node,
      status: nextNodeStatus,
      completedTasks: completedTasksCount,
      totalTasks,
      progress,
      tasks: nextTasks,
    }
  })

  // Pass 2: Unlock locked nodes if all their prerequisites are now completed
  const nodeById = new Map(updatedNodes.map((n) => [n.id, n]))

  return updatedNodes.map((node) => {
    if (node.status !== "locked") return node
    const prereqs = Array.isArray(node.prerequisites) ? node.prerequisites : []
    if (prereqs.length === 0) return node

    const allPrereqsCompleted = prereqs.every(
      (prereqId) => nodeById.get(prereqId)?.status === "completed"
    )

    if (!allPrereqsCompleted) return node

    // Unlock the node and set its first non-completed task to "current"
    let assignedCurrent = false
    const unlockedTasks = (node.tasks || []).map((t) => {
      if (t.status === "completed") return t
      if (!assignedCurrent) {
        assignedCurrent = true
        return { ...t, status: "current" }
      }
      return { ...t, status: "locked" }
    })

    return {
      ...node,
      status: "current",
      tasks: unlockedTasks,
    }
  })
}
