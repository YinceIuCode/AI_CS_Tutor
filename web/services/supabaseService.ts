/**
 * Supabase Data Service for OffByOne Platform.
 * 
 * Supports:
 * 1. Lean DSA Schema (6 Tables: users, knowledge_documents, roadmap_nodes, tasks, user_progress, code_submissions)
 * 2. Enterprise Schema (25 Tables)
 * 
 * Provides clear console telemetry so developers can distinguish between Live Supabase data and Mock Fallback.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient"

const isStrictSupabase = process.env.NEXT_PUBLIC_STRICT_SUPABASE === "true"

function logSupabaseSuccess(action: string, detail: string) {
  if (typeof window !== "undefined") {
    console.log(
      `%c🟢 [Supabase Live] ${action}: %c${detail}`,
      "color: #10B981; font-weight: bold;",
      "color: #059669; font-weight: normal;"
    )
  }
}

function logSupabaseFallback(action: string, reason: string) {
  if (typeof window !== "undefined") {
    console.warn(
      `%c🟡 [Mock Fallback] ${action}: %c${reason}`,
      "color: #F59E0B; font-weight: bold;",
      "color: #D97706; font-weight: normal;"
    )
  }
}

// =========================================================================
// 1. AUTH & USERS
// =========================================================================

export async function fetchUserByEmailFromSupabase(email: string) {
  if (!isSupabaseConfigured() || !supabase) {
    logSupabaseFallback("Auth Query", "Supabase client unconfigured or NEXT_PUBLIC_USE_MOCK_DATA=true")
    return null
  }
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle()

    if (error) {
      logSupabaseFallback("User Auth", `Error querying 'users': ${error.message} (Code: ${error.code})`)
      if (isStrictSupabase) throw error
      return null
    }

    if (data) {
      logSupabaseSuccess("User Auth", `Found active account for '${data.email}' (ID: ${data.id})`)
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        accountType: data.account_type,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
      }
    }

    return null
  } catch (err: any) {
    logSupabaseFallback("User Auth", err.message || "Network error")
    if (isStrictSupabase) throw err
    return null
  }
}

export async function insertUserToSupabase(userRecord: {
  id: string
  email: string
  fullName: string
  role?: string
  accountType?: string
  passwordHash?: string
}) {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userRecord.id,
        email: userRecord.email.toLowerCase(),
        full_name: userRecord.fullName,
        role: userRecord.role || "student",
        account_type: userRecord.accountType || "registered",
        password_hash: userRecord.passwordHash || null,
      })
      .select()
      .maybeSingle()

    if (error) {
      logSupabaseFallback("Insert User", error.message)
      if (isStrictSupabase) throw error
      return null
    }
    logSupabaseSuccess("User Registration", `Created account '${userRecord.email}' on Supabase`)
    return data
  } catch (err: any) {
    logSupabaseFallback("Insert User", err.message)
    if (isStrictSupabase) throw err
    return null
  }
}

// =========================================================================
// 2. ROADMAP & TOPIC NODES (Shared DSA Content)
// =========================================================================

export async function fetchFullRoadmapFromSupabase(courseCode: string = "CS101") {
  if (!isSupabaseConfigured() || !supabase) {
    logSupabaseFallback("Roadmap Fetch", "Supabase unconfigured, loading MOCK_ROADMAP_NODES")
    return null
  }

  try {
    // A. TRY LEAN 6-TABLE SCHEMA FIRST (Fastest & Simplest)
    const { data: leanNodes, error: leanNodesErr } = await supabase
      .from("roadmap_nodes")
      .select("*")
      .order("sequence_order", { ascending: true })

    if (!leanNodesErr && leanNodes && leanNodes.length > 0) {
      // Fetch Tasks
      const { data: leanTasks } = await supabase
        .from("tasks")
        .select("*")
        .order("sequence_order", { ascending: true })

      // Fetch Knowledge Doc
      const { data: leanDoc } = await supabase
        .from("knowledge_documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // Map tasks to nodes
      const tasksByNode = new Map<string, any[]>()
      ;(leanTasks || []).forEach((t) => {
        const list = tasksByNode.get(t.node_id) || []
        list.push({
          id: t.id,
          title: t.title,
          description: t.description,
          type: t.task_type,
          status: "locked",
        })
        tasksByNode.set(t.node_id, list)
      })

      const formattedNodes = leanNodes.map((n) => {
        const nodeTasks = tasksByNode.get(n.id) || []
        return {
          id: n.id,
          shortCode: n.short_code,
          label: n.label,
          description: n.description,
          complexity: n.target_complexity,
          prerequisites: Array.isArray(n.prerequisites) ? n.prerequisites : [],
          totalTasks: nodeTasks.length || 3,
          completedTasks: 0,
          progress: 0,
          status: "locked" as const,
          tasks: nodeTasks,
          socraticProfile: n.socratic_profile,
        }
      })

      logSupabaseSuccess(
        "Roadmap Data",
        `Loaded ${formattedNodes.length} nodes and ${leanTasks?.length || 0} tasks directly from Supabase 'roadmap_nodes' & 'tasks'`
      )

      return {
        courseTitle: "Data Structures & Algorithms",
        nodes: formattedNodes,
        documentMeta: leanDoc
          ? {
              id: leanDoc.id,
              name: leanDoc.name,
              size: leanDoc.file_size,
              chunks: leanDoc.chunks_count,
              status: leanDoc.status,
              indexedAt: leanDoc.indexed_at,
            }
          : undefined,
      }
    }

    if (leanNodesErr) {
      logSupabaseFallback("Roadmap Fetch", `Error from 'roadmap_nodes': ${leanNodesErr.message}`)
      if (isStrictSupabase) throw leanNodesErr
    }

    return null
  } catch (err: any) {
    logSupabaseFallback("Roadmap Fetch", err.message || "Network exception")
    if (isStrictSupabase) throw err
    return null
  }
}

// =========================================================================
// 3. WORKSPACE TASK DETAILS (Theory / Quiz / Coding)
// =========================================================================

export async function fetchTaskDetailFromSupabase(nodeKey: string, taskKey: string) {
  if (!isSupabaseConfigured() || !supabase) return null

  try {
    // 1. Try Lean Schema (single task with content JSONB)
    const { data: task, error: tErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskKey)
      .maybeSingle()

    if (!tErr && task && task.content && Object.keys(task.content).length > 0) {
      logSupabaseSuccess("Task Detail", `Loaded '${taskKey}' content from Supabase 'tasks.content' JSONB`)
      return {
        nodeId: nodeKey,
        taskId: taskKey,
        type: task.task_type,
        ...task.content,
      }
    }

    if (tErr) {
      logSupabaseFallback("Task Detail", `Could not query 'tasks': ${tErr.message}`)
      if (isStrictSupabase) throw tErr
    }

    return null
  } catch (err: any) {
    logSupabaseFallback("Task Detail", err.message || "Fetch exception")
    if (isStrictSupabase) throw err
    return null
  }
}

// =========================================================================
// 4. USER PROGRESS & SUBMISSIONS SYNC
// =========================================================================

export async function syncTaskCompletionToSupabase(
  userId: string,
  taskKey: string,
  isCompleted: boolean = true
) {
  if (!isSupabaseConfigured() || !supabase || !userId) return false

  try {
    const { data: currentProg } = await supabase
      .from("user_progress")
      .select("completed_tasks")
      .eq("user_id", userId)
      .maybeSingle()

    const completedMap = currentProg?.completed_tasks || {}
    completedMap[taskKey] = isCompleted

    const { error } = await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        completed_tasks: completedMap,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      logSupabaseFallback("Sync Progress", error.message)
      return false
    }

    logSupabaseSuccess("Sync Progress", `Updated task completion for '${taskKey}' in Supabase 'user_progress'`)
    return true
  } catch (err: any) {
    logSupabaseFallback("Sync Progress", err.message)
    return false
  }
}

export async function saveCodeDraftToSupabase(
  userId: string,
  taskKey: string,
  code: string,
  language: string = "C++"
) {
  if (!isSupabaseConfigured() || !supabase || !userId) return false

  try {
    const { data: currentProg } = await supabase
      .from("user_progress")
      .select("code_drafts")
      .eq("user_id", userId)
      .maybeSingle()

    const drafts = currentProg?.code_drafts || {}
    drafts[taskKey] = {
      code,
      language,
      updatedAt: new Date().toISOString(),
    }

    const { error } = await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        code_drafts: drafts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      logSupabaseFallback("Auto-save Draft", error.message)
      return false
    }

    logSupabaseSuccess("Auto-save Draft", `Saved code draft for '${taskKey}' to Supabase 'user_progress'`)
    return true
  } catch (err: any) {
    logSupabaseFallback("Auto-save Draft", err.message)
    return false
  }
}

export async function recordSubmissionToSupabase(
  userId: string,
  taskKey: string,
  submissionPayload: {
    actionType: "run" | "submit"
    status: "success" | "failed"
    code: string
    passedCount: number
    totalCount: number
    runtimeMs: number
    memoryMb: string
    stdout?: string
    errorType?: string
    errorTitle?: string
    errorMessage?: string
    testCases?: any[]
  }
) {
  if (!isSupabaseConfigured() || !supabase || !userId) return null

  try {
    const { data: submission, error: subErr } = await supabase
      .from("code_submissions")
      .insert({
        user_id: userId,
        task_id: taskKey,
        action_type: submissionPayload.actionType,
        status: submissionPayload.status,
        code: submissionPayload.code,
        passed_test_cases: submissionPayload.passedCount,
        total_test_cases: submissionPayload.totalCount,
        runtime_ms: submissionPayload.runtimeMs,
        memory_mb: submissionPayload.memoryMb,
        stdout: submissionPayload.stdout || null,
        error_details: submissionPayload.errorType
          ? {
              errorType: submissionPayload.errorType,
              errorTitle: submissionPayload.errorTitle,
              errorMessage: submissionPayload.errorMessage,
            }
          : null,
        test_case_results: submissionPayload.testCases || [],
        submitted_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()

    if (subErr) {
      logSupabaseFallback("Code Submission", subErr.message)
      return null
    }

    logSupabaseSuccess(
      "Code Submission",
      `Recorded submission for '${taskKey}' (Verdict: ${submissionPayload.status}) in Supabase 'code_submissions'`
    )
    return submission
  } catch (err: any) {
    logSupabaseFallback("Code Submission", err.message)
    return null
  }
}
