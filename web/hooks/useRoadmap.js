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
 */
export function useRoadmap(options = {}) {
  const {
    enabled = true,
    fileName = "CS101_DSA_Syllabus_HCMUS.pdf",
    fileSize = "2.4 MB",
  } = options

  return useQuery({
    queryKey: [...ROADMAP_QUERY_KEY, fileName],
    queryFn: () => fetchRoadmapData({ fileName, fileSize }),
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}
