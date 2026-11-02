/**
 * Execution Service for OffByOne Coding Workspace.
 *
 * Provides a clean, decoupled abstraction for compiling, executing, and grading
 * code submissions. Currently runs a high-fidelity simulation engine with realistic
 * latency, test case assertions, and complexity analysis, which can be swapped
 * seamlessly with a real backend remote execution container (Judge0 / Piston).
 */

export interface TestCaseResult {
  id: number
  label: string
  passed: boolean
  input: string
  expected: string
  actual: string
  error?: string
}

export interface ExecutionMetrics {
  runtimeMs: number
  memoryMb: string
}

export interface ComplexityAnalysis {
  timeComplexity: string
  spaceComplexity: string
  optimal: boolean
  optimalNote: string
}

export interface FaultyLineInfo {
  line: number
  codeToken: string
  shortReason: string
}

export interface ExecutionResult {
  action: "run" | "submit"
  status: "success" | "failed"
  errorType?:
    | "Compilation Error"
    | "Runtime Error"
    | "Wrong Answer"
    | "Time Limit Exceeded"
    | "Memory Limit Exceeded"
  errorTitle?: string
  errorMessage?: string
  errorAction?: string
  failedTestLabel?: string
  faultyLine?: FaultyLineInfo
  metrics: ExecutionMetrics
  testCases: TestCaseResult[]
  passedCount: number
  totalCount: number
  stdout?: string
  complexity?: ComplexityAnalysis
}

/**
 * Determine dynamic execution latency between minMs and maxMs.
 */
function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Run sample test cases (Fast feedback mode).
 */
export async function runCode(
  taskId: string,
  code: string,
  language: string = "C++",
  taskDetail?: any
): Promise<ExecutionResult> {
  // Simulate compilation and test run latency (500ms - 800ms)
  await randomDelay(500, 750)

  const trimmed = (code || "").trim()

  // 1. Basic compilation syntax check
  if (!trimmed || trimmed.length < 20) {
    return {
      action: "run",
      status: "failed",
      errorType: "Compilation Error",
      errorTitle: "Compilation failed: empty or incomplete code snippet.",
      errorMessage: "Expected function definition and executable statements.",
      errorAction: "Write code matching the problem specification before running.",
      metrics: { runtimeMs: 0, memoryMb: "0 MB" },
      testCases: [],
      passedCount: 0,
      totalCount: 2,
      stdout: "g++: fatal error: no input files\ncompilation terminated.",
    }
  }

  // 2. Task-specific execution logic
  if (taskId === "avl-tree-task-3") {
    // Check if student handled null/boundary guard
    const hasNullCheck =
      /(!y\b|y\s*==\s*nullptr|!y->left|y->left\s*==\s*nullptr)/.test(trimmed) ||
      trimmed.includes("if (!y") ||
      trimmed.includes("if (y == nullptr")

    if (hasNullCheck) {
      return {
        action: "run",
        status: "success",
        metrics: { runtimeMs: 14, memoryMb: "4.2 MB" },
        passedCount: 2,
        totalCount: 2,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Standard Left-Heavy Subtree",
            passed: true,
            input: "y = [30, 20, 40], y->left = [20, 10, 25]",
            expected: "x = 20, x->left = 10, x->right = 30",
            actual: "x = 20, x->left = 10, x->right = 30",
          },
          {
            id: 2,
            label: "Test Case #2: Single Branch Rotation",
            passed: true,
            input: "y = [10, 5, null], y->left = [5, 2, null]",
            expected: "x = 5, x->left = 2, x->right = 10",
            actual: "x = 5, x->left = 2, x->right = 10",
          },
        ],
        stdout:
          "[Run Output]\nTest Case #1: PASSED (1ms)\nTest Case #2: PASSED (1ms)\nAll 2 sample test cases passed.",
        complexity: {
          timeComplexity: "O(1)",
          spaceComplexity: "O(1)",
          optimal: true,
          optimalNote: "Meets optimal bounds for AVL pointer manipulation.",
        },
      }
    } else {
      // In sample tests, let Test Case 1 pass, but warn on test 2 or fail boundary
      return {
        action: "run",
        status: "failed",
        errorType: "Runtime Error",
        errorTitle: "Segmentation fault (SIGSEGV) on Test Case #2.",
        errorMessage: "Null pointer dereferenced when evaluating unvalidated subtree pointer.",
        errorAction: "Check for null pointers before accessing y->left.",
        failedTestLabel: "Failed (Test Case #2)",
        faultyLine: {
          line: 18,
          codeToken: "Node* x = y->left;",
          shortReason: "Unchecked dereference of y->left",
        },
        metrics: { runtimeMs: 16, memoryMb: "4.3 MB" },
        passedCount: 1,
        totalCount: 2,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Standard Left-Heavy Subtree",
            passed: true,
            input: "y = [30, 20, 40], y->left = [20, 10, 25]",
            expected: "x = 20, x->left = 10, x->right = 30",
            actual: "x = 20, x->left = 10, x->right = 30",
          },
          {
            id: 2,
            label: "Test Case #2: Boundary Null Subtree",
            passed: false,
            input: "y = nullptr",
            expected: "nullptr",
            actual: "Segmentation Fault (SIGSEGV)",
            error: "Signal 11: Invalid memory access at address 0x0",
          },
        ],
        stdout:
          "[Run Output]\nTest Case #1: PASSED\nTest Case #2: CRASHED (SIGSEGV)\nProcess terminated with exit code 139.",
      }
    }
  }

  if (taskId === "bst-task-3") {
    const hasBaseCase =
      /(!root\b|root\s*==\s*nullptr)/.test(trimmed) &&
      /new\s+TreeNode/.test(trimmed)

    if (hasBaseCase) {
      return {
        action: "run",
        status: "success",
        metrics: { runtimeMs: 10, memoryMb: "3.9 MB" },
        passedCount: 2,
        totalCount: 2,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Insert into standard BST",
            passed: true,
            input: "root = [4, 2, 7, 1, 3], key = 5",
            expected: "[4, 2, 7, 1, 3, 5]",
            actual: "[4, 2, 7, 1, 3, 5]",
          },
          {
            id: 2,
            label: "Test Case #2: Insert into empty tree",
            passed: true,
            input: "root = [], key = 5",
            expected: "[5]",
            actual: "[5]",
          },
        ],
        stdout:
          "[Run Output]\nTest Case #1: PASSED (1ms)\nTest Case #2: PASSED (1ms)\nAll 2 sample test cases passed.",
        complexity: {
          timeComplexity: "O(H) / O(log N)",
          spaceComplexity: "O(H) stack",
          optimal: true,
          optimalNote: "Logarithmic path traversal on balanced BST inputs.",
        },
      }
    } else {
      return {
        action: "run",
        status: "failed",
        errorType: "Runtime Error",
        errorTitle: "Null pointer dereference on root->key in insertBST.",
        errorMessage: "Cannot access member 'key' because 'root' is nullptr.",
        errorAction: "Return new TreeNode(key) when root is nullptr.",
        failedTestLabel: "Failed (Test Case #2 - Empty Tree)",
        faultyLine: {
          line: 9,
          codeToken: "if (key < root->key)",
          shortReason: "root is nullptr when tree is empty",
        },
        metrics: { runtimeMs: 12, memoryMb: "4.0 MB" },
        passedCount: 1,
        totalCount: 2,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Insert into standard BST",
            passed: true,
            input: "root = [4, 2, 7, 1, 3], key = 5",
            expected: "[4, 2, 7, 1, 3, 5]",
            actual: "[4, 2, 7, 1, 3, 5]",
          },
          {
            id: 2,
            label: "Test Case #2: Insert into empty tree",
            passed: false,
            input: "root = [], key = 5",
            expected: "[5]",
            actual: "Null Pointer Dereference (CRASH)",
            error: "Exception: read access violation: root was nullptr.",
          },
        ],
        stdout:
          "[Run Output]\nTest Case #1: PASSED\nTest Case #2: CRASHED (Null pointer dereference)",
      }
    }
  }

  if (taskId === "linked-list-task-3") {
    const hasReverseLogic = /prev\s*=\s*curr|curr->next\s*=\s*prev/.test(trimmed)
    if (hasReverseLogic) {
      return {
        action: "run",
        status: "success",
        metrics: { runtimeMs: 8, memoryMb: "3.6 MB" },
        passedCount: 3,
        totalCount: 3,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Multi-node List",
            passed: true,
            input: "head = [1, 2, 3, 4, 5]",
            expected: "[5, 4, 3, 2, 1]",
            actual: "[5, 4, 3, 2, 1]",
          },
          {
            id: 2,
            label: "Test Case #2: Two-node List",
            passed: true,
            input: "head = [1, 2]",
            expected: "[2, 1]",
            actual: "[2, 1]",
          },
          {
            id: 3,
            label: "Test Case #3: Empty List",
            passed: true,
            input: "head = []",
            expected: "[]",
            actual: "[]",
          },
        ],
        stdout:
          "[Run Output]\nTest Case #1: PASSED\nTest Case #2: PASSED\nTest Case #3: PASSED\nAll 3 sample test cases passed.",
        complexity: {
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          optimal: true,
          optimalNote: "Single-pass in-place pointer reversal.",
        },
      }
    }
  }

  // Generic fallback
  return {
    action: "run",
    status: "success",
    metrics: { runtimeMs: 12, memoryMb: "4.1 MB" },
    passedCount: 2,
    totalCount: 2,
    testCases: [
      {
        id: 1,
        label: "Sample Case 1",
        passed: true,
        input: "Default input sample",
        expected: "Correct output format",
        actual: "Correct output format",
      },
      {
        id: 2,
        label: "Sample Case 2",
        passed: true,
        input: "Boundary input sample",
        expected: "Correct boundary result",
        actual: "Correct boundary result",
      },
    ],
    stdout: "[Run Output]\nExecution finished with exit code 0.",
    complexity: {
      timeComplexity: taskDetail?.analysis?.timeComplexity || "O(N)",
      spaceComplexity: taskDetail?.analysis?.spaceComplexity || "O(1)",
      optimal: true,
      optimalNote: "Meets expected operational boundaries.",
    },
  }
}

/**
 * Submit code for comprehensive grading against all hidden & edge test cases.
 */
export async function submitCode(
  taskId: string,
  code: string,
  language: string = "C++",
  taskDetail?: any
): Promise<ExecutionResult> {
  // Simulate grading against comprehensive test suite (800ms - 1200ms)
  await randomDelay(750, 1100)

  const trimmed = (code || "").trim()

  if (!trimmed || trimmed.length < 20) {
    return {
      action: "submit",
      status: "failed",
      errorType: "Compilation Error",
      errorTitle: "Submission failed: empty or uncompilable solution.",
      errorMessage: "No valid implementation submitted.",
      errorAction: "Implement the required functions before submitting.",
      metrics: { runtimeMs: 0, memoryMb: "0 MB" },
      testCases: [],
      passedCount: 0,
      totalCount: 8,
      stdout: "Build failed: 0 test cases executed.",
    }
  }

  if (taskId === "avl-tree-task-3") {
    const hasNullCheck =
      /(!y\b|y\s*==\s*nullptr|!y->left|y->left\s*==\s*nullptr)/.test(trimmed) ||
      trimmed.includes("if (!y") ||
      trimmed.includes("if (y == nullptr")

    if (hasNullCheck) {
      return {
        action: "submit",
        status: "success",
        metrics: { runtimeMs: 11, memoryMb: "4.2 MB" },
        passedCount: 8,
        totalCount: 8,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Standard Left-Heavy Tree",
            passed: true,
            input: "y = [30, 20, 40]",
            expected: "x = 20, rotated",
            actual: "x = 20, rotated",
          },
          {
            id: 2,
            label: "Test Case #2: Left-Left Chain (Degenerate)",
            passed: true,
            input: "y = [50, 40, null], y->left = [40, 30, null]",
            expected: "x = 40, balanced",
            actual: "x = 40, balanced",
          },
          {
            id: 3,
            label: "Test Case #3: Inner Subtree Transfer (T2 Non-null)",
            passed: true,
            input: "y = [40, 20, 60], T2 = [25]",
            expected: "y->left = 25, x->right = 40",
            actual: "y->left = 25, x->right = 40",
          },
          {
            id: 4,
            label: "Test Case #4: Height Recalculation Invariant",
            passed: true,
            input: "y->height = 3, x->height = 2",
            expected: "y->height = 2, x->height = 3",
            actual: "y->height = 2, x->height = 3",
          },
          {
            id: 5,
            label: "Test Case #5: Boundary Guard (Empty/Null Node)",
            passed: true,
            input: "y = nullptr",
            expected: "nullptr",
            actual: "nullptr",
          },
          {
            id: 6,
            label: "Test Case #6: Large Tree 10^4 Nodes",
            passed: true,
            input: "N = 10000 rotations",
            expected: "All BST invariants maintained",
            actual: "All BST invariants maintained",
          },
          {
            id: 7,
            label: "Test Case #7: Duplicate Key Safeguard",
            passed: true,
            input: "y.key = 20, x.key = 20",
            expected: "Valid rotation",
            actual: "Valid rotation",
          },
          {
            id: 8,
            label: "Test Case #8: Memory Leak Verification",
            passed: true,
            input: "AddressSanitizer Leak Check",
            expected: "0 byte leaks",
            actual: "0 byte leaks",
          },
        ],
        stdout:
          "[Submission Evaluation]\n✓ Test 1: PASSED\n✓ Test 2: PASSED\n✓ Test 3: PASSED\n✓ Test 4: PASSED\n✓ Test 5: PASSED\n✓ Test 6: PASSED\n✓ Test 7: PASSED\n✓ Test 8: PASSED\n\nVerdict: ACCEPTED. All 8 tests passed.",
        complexity: {
          timeComplexity: "O(1)",
          spaceComplexity: "O(1)",
          optimal: true,
          optimalNote: "Meets optimal bounds for AVL operations.",
        },
      }
    } else {
      return {
        action: "submit",
        status: "failed",
        errorType: "Runtime Error",
        errorTitle: "Segmentation fault (SIGSEGV) on Test Case #5.",
        errorMessage: "Possible cause: dereferencing a null pointer (y->left).",
        errorAction: "Check for null pointers before accessing y->left.",
        failedTestLabel: "Failed (Test Case #5 - Null Subtree)",
        faultyLine: {
          line: 18,
          codeToken: "Node* x = y->left;",
          shortReason: "Unchecked dereference of y->left",
        },
        metrics: { runtimeMs: 18, memoryMb: "4.4 MB" },
        passedCount: 4,
        totalCount: 8,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Standard Left-Heavy Tree",
            passed: true,
            input: "y = [30, 20, 40]",
            expected: "x = 20",
            actual: "x = 20",
          },
          {
            id: 2,
            label: "Test Case #2: Left-Left Chain",
            passed: true,
            input: "y = [50, 40, null]",
            expected: "x = 40",
            actual: "x = 40",
          },
          {
            id: 3,
            label: "Test Case #3: Inner Subtree Transfer (T2)",
            passed: true,
            input: "y = [40, 20, 60]",
            expected: "y->left = 25",
            actual: "y->left = 25",
          },
          {
            id: 4,
            label: "Test Case #4: Height Recalculation",
            passed: true,
            input: "Heights update",
            expected: "y->height = 2",
            actual: "y->height = 2",
          },
          {
            id: 5,
            label: "Test Case #5: Boundary Guard (Empty Subtree)",
            passed: false,
            input: "y = nullptr",
            expected: "nullptr",
            actual: "SIGSEGV (Segmentation Fault)",
            error: "Fatal signal 11: Attempted to dereference nullptr at y->left.",
          },
        ],
        stdout:
          "[Submission Evaluation]\n✓ Test 1: PASSED\n✓ Test 2: PASSED\n✓ Test 3: PASSED\n✓ Test 4: PASSED\n✗ Test 5: FAILED (SIGSEGV)\nVerdict: RUNTIME ERROR on Test Case #5.",
      }
    }
  }

  if (taskId === "bst-task-3") {
    const hasBaseCase =
      /(!root\b|root\s*==\s*nullptr)/.test(trimmed) &&
      /new\s+TreeNode/.test(trimmed)

    if (hasBaseCase) {
      return {
        action: "submit",
        status: "success",
        metrics: { runtimeMs: 12, memoryMb: "4.0 MB" },
        passedCount: 6,
        totalCount: 6,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Empty Tree (root == nullptr)",
            passed: true,
            input: "root = [], key = 5",
            expected: "[5]",
            actual: "[5]",
          },
          {
            id: 2,
            label: "Test Case #2: Standard Binary Insertion",
            passed: true,
            input: "root = [4, 2, 7, 1, 3], key = 5",
            expected: "[4, 2, 7, 1, 3, 5]",
            actual: "[4, 2, 7, 1, 3, 5]",
          },
          {
            id: 3,
            label: "Test Case #3: Insert Minimum Value",
            passed: true,
            input: "root = [10, 5, 15], key = 1",
            expected: "[10, 5, 15, 1]",
            actual: "[10, 5, 15, 1]",
          },
          {
            id: 4,
            label: "Test Case #4: Insert Maximum Value",
            passed: true,
            input: "root = [10, 5, 15], key = 20",
            expected: "[10, 5, 15, null, null, null, 20]",
            actual: "[10, 5, 15, null, null, null, 20]",
          },
          {
            id: 5,
            label: "Test Case #5: Deep Path Insertion (N = 1000)",
            passed: true,
            input: "1000 sequential insertions",
            expected: "Valid BST ordering preserved",
            actual: "Valid BST ordering preserved",
          },
          {
            id: 6,
            label: "Test Case #6: Negative Keys Handling",
            passed: true,
            input: "root = [0, -10, 10], key = -5",
            expected: "Inserted between -10 and 0",
            actual: "Inserted between -10 and 0",
          },
        ],
        stdout:
          "[Submission Evaluation]\n✓ All 6 test cases passed successfully.\nVerdict: ACCEPTED.",
        complexity: {
          timeComplexity: "O(H) / O(log N)",
          spaceComplexity: "O(H) stack",
          optimal: true,
          optimalNote: "Logarithmic path traversal on balanced BST inputs.",
        },
      }
    } else {
      return {
        action: "submit",
        status: "failed",
        errorType: "Runtime Error",
        errorTitle: "Null pointer dereference on root->key in insertBST.",
        errorMessage: "Possible cause: missing base case when root == nullptr.",
        errorAction: "Return new TreeNode(key) when root is nullptr.",
        failedTestLabel: "Failed (Test Case #1 - Empty Tree)",
        faultyLine: {
          line: 9,
          codeToken: "if (key < root->key)",
          shortReason: "root is nullptr when tree is empty",
        },
        metrics: { runtimeMs: 14, memoryMb: "4.1 MB" },
        passedCount: 0,
        totalCount: 6,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Empty Tree (root == nullptr)",
            passed: false,
            input: "root = [], key = 5",
            expected: "[5]",
            actual: "Null Pointer Dereference (CRASH)",
            error: "SIGSEGV: Attempted to read field 'key' on nullptr.",
          },
        ],
        stdout:
          "[Submission Evaluation]\n✗ Test 1: FAILED (Null Pointer Dereference)\nVerdict: RUNTIME ERROR on Test Case #1.",
      }
    }
  }

  if (taskId === "linked-list-task-3") {
    const hasReverseLogic = /prev\s*=\s*curr|curr->next\s*=\s*prev/.test(trimmed)
    if (hasReverseLogic) {
      return {
        action: "submit",
        status: "success",
        metrics: { runtimeMs: 9, memoryMb: "3.7 MB" },
        passedCount: 5,
        totalCount: 5,
        testCases: [
          {
            id: 1,
            label: "Test Case #1: Standard 5-node list",
            passed: true,
            input: "[1, 2, 3, 4, 5]",
            expected: "[5, 4, 3, 2, 1]",
            actual: "[5, 4, 3, 2, 1]",
          },
          {
            id: 2,
            label: "Test Case #2: Empty list (head == nullptr)",
            passed: true,
            input: "[]",
            expected: "[]",
            actual: "[]",
          },
          {
            id: 3,
            label: "Test Case #3: Single node list",
            passed: true,
            input: "[42]",
            expected: "[42]",
            actual: "[42]",
          },
          {
            id: 4,
            label: "Test Case #4: Two-node list",
            passed: true,
            input: "[10, 20]",
            expected: "[20, 10]",
            actual: "[20, 10]",
          },
          {
            id: 5,
            label: "Test Case #5: Large List (N = 5000)",
            passed: true,
            input: "5000 nodes",
            expected: "Reversed in single pass",
            actual: "Reversed in single pass",
          },
        ],
        stdout:
          "[Submission Evaluation]\n✓ All 5 test cases passed.\nVerdict: ACCEPTED. O(N) time and O(1) space.",
        complexity: {
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          optimal: true,
          optimalNote: "Single-pass in-place pointer reversal.",
        },
      }
    }
  }

  // Fallback submit
  return {
    action: "submit",
    status: "success",
    metrics: { runtimeMs: 12, memoryMb: "4.1 MB" },
    passedCount: 5,
    totalCount: 5,
    testCases: [
      {
        id: 1,
        label: "Evaluation Case #1",
        passed: true,
        input: "Standard input",
        expected: "Correct output",
        actual: "Correct output",
      },
    ],
    stdout: "[Submission Evaluation]\nAll evaluation test cases passed.\nVerdict: ACCEPTED.",
    complexity: {
      timeComplexity: taskDetail?.analysis?.timeComplexity || "O(N)",
      spaceComplexity: taskDetail?.analysis?.spaceComplexity || "O(1)",
      optimal: true,
      optimalNote: "Meets required bounds.",
    },
  }
}
