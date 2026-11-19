"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchRoadmapData } from "@/services/roadmapService"

export const ROADMAP_QUERY_KEY = ["roadmap", "skill-tree"]

/**
 * Custom TanStack Query hook to fetch and manage the OffByOne DSA Skill Tree Roadmap.
 *
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - Whether the query should execute automatically.
 * @param {string} [options.fileName] - Uploaded syllabus PDF file name.
 * @param {string} [options.fileSize] - Uploaded syllabus PDF file size.
 * @param {string} [options.documentId] - Document ID for course scoping (e.g. CS101 vs CS102).
 */
export function useRoadmap(options = {}) {
  const {
    enabled = true,
    fileName = "CS101_DSA_Syllabus_HCMUS.pdf",
    fileSize = "2.4 MB",
    documentId = "",
  } = options

  return useQuery({
    queryKey: [...ROADMAP_QUERY_KEY, fileName, documentId],
    queryFn: () => fetchRoadmapData({ fileName, fileSize, documentId }),
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}
