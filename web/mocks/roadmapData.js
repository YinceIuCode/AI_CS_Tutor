/**
 * Mock Data for the AlgoPath DSA Skill Tree Roadmap.
 * Designed to match the Backend API contract so it can be replaced by a real Fetch API call without UI changes.
 */

export const INITIAL_KNOWLEDGE_BASE_DOC = {
  id: "doc-cs101-hcmus",
  name: "CS101_DSA_Syllabus_HCMUS.pdf",
  size: "2.4 MB",
  chunks: 48,
  status: "indexed",
  indexedAt: "2026-10-30T10:30:00Z",
}

/**
 * 10 core Data Structures & Algorithms nodes with realistic prerequisite relationships.
 * Status values: "completed" | "current" | "locked"
 * Task types: "theory" | "quiz" | "coding"
 */
export const MOCK_ROADMAP_NODES = [
  {
    id: "dsa-foundations",
    shortCode: "01",
    label: "DSA Foundations",
    description:
      "Core memory models, pointers, recursion fundamentals, and mathematical induction for algorithmic problem solving.",
    status: "completed",
    complexity: "O(1) / O(N)",
    prerequisites: [],
    progress: 100,
    totalTasks: 3,
    completedTasks: 3,
    tasks: [
      {
        id: "dsa-foundations-task-1",
        title: "Core Theory & Memory Models",
        description:
          "Understand stack vs. heap allocation, pointer dereferencing, and base/recursive cases.",
        status: "completed",
        type: "theory",
      },
      {
        id: "dsa-foundations-task-2",
        title: "Quiz: Stack Frames & Pointers",
        description:
          "Trace memory addresses and recursion tree depth on sample C++ snippets.",
        status: "completed",
        type: "quiz",
      },
      {
        id: "dsa-foundations-task-3",
        title: "Code: Recursive Array Reversal",
        description:
          "Implement in-place pointer manipulation and recursive helper functions.",
        status: "completed",
        type: "coding",
      },
    ],
  },
  {
    id: "complexity-analysis",
    shortCode: "02",
    label: "Complexity Analysis",
    description:
      "Asymptotic notation (Big-O, Big-Omega, Big-Theta), time-space trade-offs, and recurrence relations using the Master Theorem.",
    status: "current",
    complexity: "O(1) to O(N²)",
    prerequisites: ["dsa-foundations"],
    progress: 67,
    totalTasks: 3,
    completedTasks: 2,
    tasks: [
      {
        id: "complexity-analysis-task-1",
        title: "Core Theory & Asymptotic Bounds",
        description:
          "Analyze worst-case, average-case, and amortized complexity across nested loops and recurrences.",
        status: "completed",
        type: "theory",
      },
      {
        id: "complexity-analysis-task-2",
        title: "Quiz: Master Theorem Check",
        description:
          "Evaluate tight time and auxiliary space bounds for divide-and-conquer recurrences.",
        status: "completed",
        type: "quiz",
      },
      {
        id: "complexity-analysis-task-3",
        title: "Code: Optimize O(N²) to O(N)",
        description:
          "Refactor a brute-force prefix sum solution into an optimal linear-time algorithm.",
        status: "current",
        type: "coding",
      },
    ],
  },
  {
    id: "arrays-strings",
    shortCode: "03",
    label: "Arrays & Strings",
    description:
      "Contiguous memory operations, dynamic resizing, two-pointer techniques, sliding window, and prefix sum patterns.",
    status: "completed",
    complexity: "O(1) access / O(N)",
    prerequisites: ["dsa-foundations"],
    progress: 100,
    totalTasks: 3,
    completedTasks: 3,
    tasks: [
      {
        id: "arrays-strings-task-1",
        title: "Core Theory & Sliding Window",
        description:
          "Explore amortized O(1) push_back doubling and two-pointer monotonic window maintenance.",
        status: "completed",
        type: "theory",
      },
      {
        id: "arrays-strings-task-2",
        title: "Quiz: Two-Pointer Boundaries",
        description:
          "Identify off-by-one invariants in sliding window and partitioning algorithms.",
        status: "completed",
        type: "quiz",
      },
      {
        id: "arrays-strings-task-3",
        title: "Code: Longest Unique Substring",
        description:
          "Implement an O(N) sliding window scanner with constant extra space.",
        status: "completed",
        type: "coding",
      },
    ],
  },
  {
    id: "linked-list",
    shortCode: "04",
    label: "Linked List",
    description:
      "Singly, doubly, and circular linked lists, sentinel dummy nodes, fast-and-slow pointer cycle detection, and in-place reversal.",
    status: "completed",
    complexity: "O(1) insert / O(N)",
    prerequisites: ["dsa-foundations"],
    progress: 100,
    totalTasks: 3,
    completedTasks: 3,
    tasks: [
      {
        id: "linked-list-task-1",
        title: "Core Theory & Pointer Nodes",
        description:
          "Compare pointer-based node allocation against contiguous arrays and handle edge cases cleanly.",
        status: "completed",
        type: "theory",
      },
      {
        id: "linked-list-task-2",
        title: "Quiz: Floyd's Cycle Check",
        description:
          "Detect lost references and memory leaks during pointer rewiring.",
        status: "completed",
        type: "quiz",
      },
      {
        id: "linked-list-task-3",
        title: "Code: In-Place List Reversal",
        description:
          "Write O(N) time and O(1) space linked list reversal and tortoise-hare cycle detection.",
        status: "completed",
        type: "coding",
      },
    ],
  },
  {
    id: "stack-queue",
    shortCode: "05",
    label: "Stack & Queue",
    description:
      "LIFO and FIFO abstract data types, circular ring buffers, monotonic stacks/deques, and expression parsing.",
    status: "current",
    complexity: "O(1) push / pop",
    prerequisites: ["arrays-strings", "linked-list"],
    progress: 67,
    totalTasks: 3,
    completedTasks: 2,
    tasks: [
      {
        id: "stack-queue-task-1",
        title: "Core Theory & Monotonic Stack",
        description:
          "Master circular queue indexing and next-greater-element monotonic stack patterns.",
        status: "completed",
        type: "theory",
      },
      {
        id: "stack-queue-task-2",
        title: "Quiz: Circular Buffer Trace",
        description:
          "Trace front/rear modulo pointers and stack states across push/pop sequences.",
        status: "completed",
        type: "quiz",
      },
      {
        id: "stack-queue-task-3",
        title: "Code: Next Greater Element",
        description:
          "Implement an O(N) monotonic stack solver and fixed-capacity ring buffer.",
        status: "current",
        type: "coding",
      },
    ],
  },
  {
    id: "trees",
    shortCode: "06",
    label: "Trees",
    description:
      "Hierarchical tree terminology, binary tree representations, recursive and iterative DFS (Pre/In/Post-order), and level-order BFS.",
    status: "completed",
    complexity: "O(N) traversal",
    prerequisites: ["linked-list"],
    progress: 100,
    totalTasks: 3,
    completedTasks: 3,
    tasks: [
      {
        id: "trees-task-1",
        title: "Core Theory & Tree Traversals",
        description:
          "Understand structural properties of binary trees and recursive subtree decomposition.",
        status: "completed",
        type: "theory",
      },
      {
        id: "trees-task-2",
        title: "Quiz: Traversal Reconstruction",
        description:
          "Reconstruct unique binary trees from traversal sequences and compute subtree heights.",
        status: "completed",
        type: "quiz",
      },
      {
        id: "trees-task-3",
        title: "Code: Level-Order BFS Traversal",
        description:
          "Implement tree traversals using an explicit stack and queue without recursion.",
        status: "completed",
        type: "coding",
      },
    ],
  },
  {
    id: "binary-search-tree",
    shortCode: "07",
    label: "Binary Search Tree",
    description:
      "BST ordering invariant, logarithmic search, insertion, Hibbard deletion with inorder successor, and range queries.",
    status: "completed",
    complexity: "O(log N) avg",
    prerequisites: ["trees"],
    progress: 100,
    totalTasks: 3,
    completedTasks: 3,
    tasks: [
      {
        id: "bst-task-1",
        title: "Core Theory & BST Ordering",
        description:
          "Analyze why balanced BSTs achieve O(log N) operations while skewed trees degrade to O(N).",
        status: "completed",
        type: "theory",
      },
      {
        id: "bst-task-2",
        title: "Quiz: BST Invariant Validation",
        description:
          "Spot invalid local-only BST checks and trace two-child node deletion.",
        status: "completed",
        type: "quiz",
      },
      {
        id: "bst-task-3",
        title: "Code: BST Insert & Search",
        description:
          "Implement recursive and iterative BST operations maintaining strict key bounds.",
        status: "completed",
        type: "coding",
      },
    ],
  },
  {
    id: "avl-tree",
    shortCode: "08",
    label: "AVL Tree",
    description:
      "Self-balancing binary search trees, height-balance factor invariants, and single/double rotations (LL, RR, LR, RL).",
    status: "current",
    complexity: "O(log N) strict",
    prerequisites: ["binary-search-tree"],
    progress: 33,
    totalTasks: 3,
    completedTasks: 1,
    tasks: [
      {
        id: "avl-tree-task-1",
        title: "Core Theory & Big-O",
        description:
          "Master height balance factors BF(N) = height(left) - height(right) and O(1) structural rotations.",
        status: "completed",
        type: "theory",
      },
      {
        id: "avl-tree-task-2",
        title: "Quiz: Balance Factor",
        description:
          "Identify LL, RR, LR, and RL imbalance cases and choose the exact rotation sequence.",
        status: "current",
        type: "quiz",
      },
      {
        id: "avl-tree-task-3",
        title: "Code: Right Rotation",
        description:
          "Implement rotateRight and rotateLeft with null-safe pointer updates and height recalculation.",
        status: "locked",
        type: "coding",
      },
    ],
  },
  {
    id: "sorting-algorithms",
    shortCode: "09",
    label: "Sorting Algorithms",
    description:
      "Comparison and non-comparison sorting: Merge Sort, Quick Sort partitioning, Heap Sort, stability analysis, and lower bounds.",
    status: "locked",
    complexity: "O(N log N)",
    prerequisites: ["arrays-strings", "complexity-analysis"],
    progress: 0,
    totalTasks: 3,
    completedTasks: 0,
    tasks: [
      {
        id: "sorting-task-1",
        title: "Core Theory & Sorting Stability",
        description:
          "Compare Merge Sort, Quick Sort pivot selection, and the Ω(N log N) decision-tree lower bound.",
        status: "locked",
        type: "theory",
      },
      {
        id: "sorting-task-2",
        title: "Quiz: Partition & Stability",
        description:
          "Trace pivot partitioning steps and identify worst-case input permutations.",
        status: "locked",
        type: "quiz",
      },
      {
        id: "sorting-task-3",
        title: "Code: Quick Sort & Merge Sort",
        description:
          "Implement randomized Quick Sort and count array inversions using Merge Sort.",
        status: "locked",
        type: "coding",
      },
    ],
  },
  {
    id: "graph-algorithms",
    shortCode: "10",
    label: "Graph Algorithms",
    description:
      "Adjacency list/matrix representations, BFS shortest path, DFS cycle detection, topological sorting, and Dijkstra's algorithm.",
    status: "locked",
    complexity: "O(V + E)",
    prerequisites: ["trees", "stack-queue"],
    progress: 0,
    totalTasks: 3,
    completedTasks: 0,
    tasks: [
      {
        id: "graph-task-1",
        title: "Core Theory & Graph Traversals",
        description:
          "Contrast adjacency lists vs. matrices and analyze BFS/DFS time and space complexity.",
        status: "locked",
        type: "theory",
      },
      {
        id: "graph-task-2",
        title: "Quiz: Topological & Dijkstra",
        description:
          "Trace priority queue edge relaxations and DAG in-degree ordering.",
        status: "locked",
        type: "quiz",
      },
      {
        id: "graph-task-3",
        title: "Code: Dijkstra Shortest Path",
        description:
          "Implement shortest-path algorithms on weighted and unweighted directed graphs.",
        status: "locked",
        type: "coding",
      },
    ],
  },
]

/**
 * Placeholder slots shown in the Empty / Processing state before the Roadmap is generated.
 */
export const EMPTY_PLACEHOLDER_SLOTS = [
  { id: 1, slotLabel: "Topic 1", x: 120, y: 72 },
  { id: 2, slotLabel: "Topic 2", x: 450, y: 72 },
  { id: 3, slotLabel: "Topic 3", x: 780, y: 72 },
  { id: 4, slotLabel: "Topic 4", x: 120, y: 342 },
  { id: 5, slotLabel: "Topic 5", x: 450, y: 342 },
  { id: 6, slotLabel: "Topic 6", x: 780, y: 342 },
]

export const EMPTY_PLACEHOLDER_EDGES = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 1, to: 4 },
  { from: 3, to: 6 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
]
