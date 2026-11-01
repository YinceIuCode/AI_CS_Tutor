"use client"

import * as React from "react"
import { useAuth } from "@/hooks/useAuth"
import {
  createDefaultProgress,
  getUserProgress,
  markTaskAsCompleted,
  saveCodeProgress,
  saveHintsProgress,
  saveQuizProgress,
  saveRoadmapFlowState,
} from "@/services/progressService"

/**
 * Custom hook to read and persist learning progress scoped to the authenticated user.
 * - Registered users persist across sessions in `localStorage` (`algopath_progress_<userId>`).
 * - Guest users persist across refreshes in `sessionStorage` (`algopath_guest_progress_<userId>`).
 */
export function useUserProgress() {
  const { currentUser } = useAuth()

  const [userProgress, setUserProgress] = React.useState(() =>
    createDefaultProgress(
      currentUser?.id || "anonymous",
      currentUser?.accountType || "registered"
    )
  )
  const [isProgressLoaded, setIsProgressLoaded] = React.useState(false)

  // Load progress whenever the active user changes
  React.useEffect(() => {
    if (!currentUser?.id) {
      setIsProgressLoaded(false)
      return
    }
    const loaded = getUserProgress(currentUser)
    setUserProgress(loaded)
    setIsProgressLoaded(true)
  }, [currentUser])

  // Synchronize across components in the same tab or across tabs
  React.useEffect(() => {
    if (!currentUser?.id) return

    const handleSync = () => {
      setUserProgress(getUserProgress(currentUser))
    }

    window.addEventListener("algopath:progress-updated", handleSync)
    window.addEventListener("storage", handleSync)

    /** @type {BroadcastChannel | null} */
    let channel = null
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("algopath_progress_sync")
      channel.onmessage = (event) => {
        if (event?.data?.userId === currentUser.id) {
          handleSync()
        }
      }
    }

    return () => {
      window.removeEventListener("algopath:progress-updated", handleSync)
      window.removeEventListener("storage", handleSync)
      if (channel) {
        channel.close()
      }
    }
  }, [currentUser])

  const saveRoadmapState = React.useCallback(
    (
      /** @type {{ roadmapFlowState: "empty" | "ready"; fileName?: string; fileSize?: string }} */ payload
    ) => {
      if (!currentUser?.id) return
      const next = saveRoadmapFlowState(currentUser, payload)
      setUserProgress(next)
    },
    [currentUser]
  )

  const saveQuizAnswer = React.useCallback(
    (
      /** @type {string} */ taskId,
      /** @type {{ selectedOption: string | null; isSubmitted?: boolean }} */ quizState
    ) => {
      if (!currentUser?.id || !taskId) return
      const next = saveQuizProgress(currentUser, taskId, quizState)
      setUserProgress(next)
    },
    [currentUser]
  )

  const saveCodeDraft = React.useCallback(
    (
      /** @type {string} */ taskId,
      /** @type {{ code: string; language?: string; isSubmitted?: boolean }} */ codeState
    ) => {
      if (!currentUser?.id || !taskId) return
      const next = saveCodeProgress(currentUser, taskId, codeState)
      setUserProgress(next)
    },
    [currentUser]
  )

  const saveHints = React.useCallback(
    (/** @type {string} */ taskId, /** @type {number} */ remaining) => {
      if (!currentUser?.id || !taskId) return
      const next = saveHintsProgress(currentUser, taskId, remaining)
      setUserProgress(next)
    },
    [currentUser]
  )

  const completeTask = React.useCallback(
    (/** @type {string} */ taskId) => {
      if (!currentUser?.id || !taskId) return
      const next = markTaskAsCompleted(currentUser, taskId)
      setUserProgress(next)
    },
    [currentUser]
  )

  return {
    userProgress,
    isProgressLoaded,
    saveRoadmapState,
    saveQuizAnswer,
    saveCodeDraft,
    saveHints,
    completeTask,
  }
}
