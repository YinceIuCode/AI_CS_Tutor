# OffByOne Data Model Examples

Tài liệu này chứa các ví dụ JSON thực tế được trích xuất trực tiếp từ mã nguồn và các Mock Services hiện đang vận hành trong dự án **OffByOne**.

---

## 1. User & Authentication Models

### 1.1. Public User Session Object
Được trả về bởi `toPublicUser()` trong [`web/services/authService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js#L33-L42), lưu trữ trong `sessionStorage` dưới khóa `"algopath_auth_session"`:

```json
{
  "id": "user-demo-student-01",
  "fullName": "Demo Student",
  "email": "student@offbyone.demo",
  "role": "student",
  "accountType": "registered"
}
```

### 1.2. Guest User Session Object
Được tạo bởi `loginAsGuest()` trong [`web/services/authService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/authService.js#L207-L219):

```json
{
  "id": "guest-1730650000000-k8f9a2b",
  "fullName": "Guest Student",
  "email": "guest@offbyone.demo",
  "role": "student",
  "accountType": "guest"
}
```

### 1.3. Registered User Record (Storage Model)
Được lưu trữ trong `localStorage` dưới khóa `"algopath_registered_users"` (chỉ lưu digest mật khẩu một chiều, không lưu plaintext):

```json
{
  "id": "user-1730650000000-x9q7m1a",
  "fullName": "Nguyen Van A",
  "email": "student_a@hcmus.edu.vn",
  "role": "student",
  "accountType": "registered",
  "passwordDigest": "h_7f4a9b2c"
}
```

---

## 2. Learning Material & Knowledge Base Models

### 2.1. Knowledge Base Document Metadata
Định nghĩa tại `INITIAL_KNOWLEDGE_BASE_DOC` trong [`web/mocks/roadmapData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js#L6-L13):

```json
{
  "id": "doc-cs101-hcmus",
  "name": "CS101_DSA_Syllabus_HCMUS.pdf",
  "size": "2.4 MB",
  "chunks": 48,
  "status": "indexed",
  "indexedAt": "2026-10-30T10:30:00Z"
}
```

---

## 3. Learning Roadmap Models

### 3.1. Full Roadmap Payload Contract
Được tạo bởi `buildRoadmapPayload()` trong [`web/services/roadmapService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/roadmapService.js#L14-L40):

```json
{
  "courseTitle": "Data Structures & Algorithms",
  "completionPercent": 42,
  "unlockedCount": 7,
  "totalCount": 10,
  "knowledgeBase": {
    "documents": [
      {
        "id": "doc-cs101-hcmus",
        "name": "CS101_DSA_Syllabus_HCMUS.pdf",
        "size": "2.4 MB",
        "chunks": 48,
        "status": "indexed",
        "indexedAt": "2026-10-30T10:30:00Z"
      }
    ],
    "totalDocuments": 1,
    "ragStatus": "RAG Citations Active"
  },
  "nodes": [ /* Danh sách 10 Roadmap Nodes */ ]
}
```

### 3.2. Roadmap Node Structure
Trích xuất từ `MOCK_ROADMAP_NODES` trong [`web/mocks/roadmapData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/roadmapData.js#L20-L59):

```json
{
  "id": "avl-tree",
  "shortCode": "08",
  "label": "AVL Tree",
  "description": "Self-balancing binary search tree maintaining O(log N) height via balance factors and single/double rotations.",
  "status": "current",
  "complexity": "O(log N)",
  "prerequisites": ["binary-search-tree"],
  "progress": 33,
  "totalTasks": 3,
  "completedTasks": 1,
  "tasks": [
    {
      "id": "avl-tree-task-1",
      "title": "Core Theory: Balance Factors",
      "description": "Understand height calculations and rotation invariants.",
      "status": "completed",
      "type": "theory"
    },
    {
      "id": "avl-tree-task-2",
      "title": "Quiz: Rotation Tracing",
      "description": "Calculate balance factor on sample tree states.",
      "status": "current",
      "type": "quiz"
    },
    {
      "id": "avl-tree-task-3",
      "title": "Code: Right Rotation",
      "description": "Implement rotateRight(y) in C++.",
      "status": "locked",
      "type": "coding"
    }
  ]
}
```

---

## 4. Learning Task Detail Models

### 4.1. Theory Task Detail Model
Trích xuất từ `WORKSPACE_TASK_DETAILS["avl-tree"]["avl-tree-task-1"]` trong [`web/mocks/workspaceTasks.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L7-L50):

```json
{
  "nodeId": "avl-tree",
  "taskId": "avl-tree-task-1",
  "type": "theory",
  "headerTitle": "CORE THEORY: AVL TREE & BIG-O COMPLEXITY",
  "moduleLabel": "Module 1 of 3:",
  "summaryLead": "An AVL Tree is a self-balancing Binary Search Tree where the difference between heights of left and right subtrees (the Balance Factor) cannot exceed 1 for any node.",
  "highlightTerms": {
    "concept": "Balance Factor",
    "bound": "1"
  },
  "cards": [
    {
      "badge": "01",
      "title": "AVL Balance Factor Invariant",
      "detail": "Balance Factor (BF) = Height(Left Subtree) - Height(Right Subtree). For every valid node, BF must strictly belong to {-1, 0, +1}."
    },
    {
      "badge": "02",
      "title": "Left-Heavy Imbalance (LL Case)",
      "detail": "When BF reaches +2 and the left child has BF >= 0, a single Clockwise (Right) Rotation restores balance in O(1) time."
    }
  ],
  "slideLabel": "Open Slide 14 (PDF)"
}
```

### 4.2. Quiz Task Detail Model
Trích xuất từ `WORKSPACE_TASK_DETAILS["avl-tree"]["avl-tree-task-2"]` trong [`web/mocks/workspaceTasks.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L52-L95):

```json
{
  "nodeId": "avl-tree",
  "taskId": "avl-tree-task-2",
  "type": "quiz",
  "question": "Given an AVL node with left subtree height 3 and right subtree height 1, what is its Balance Factor and which operation restores balance?",
  "options": [
    {
      "id": "A",
      "text": "Balance Factor = +2; perform a Right Rotation on this node",
      "isCorrect": true
    },
    {
      "id": "B",
      "text": "Balance Factor = +2; perform a Left Rotation on this node",
      "isCorrect": false
    },
    {
      "id": "C",
      "text": "Balance Factor = -2; perform a Left Rotation on this node",
      "isCorrect": false
    },
    {
      "id": "D",
      "text": "Balance Factor = -1; tree is already balanced",
      "isCorrect": false
    }
  ],
  "hints": {
    "awaiting": "Select one of the options (A, B, C, or D). Socratic AI will guide your reasoning based on your course syllabus.",
    "correct": "Spot on! The Balance Factor is +2 (3 - 1 = 2). Because the Left Subtree is heavier, rotating the tree to the Right restores balance in O(1) time.",
    "incorrect": "You calculated the Balance Factor as +2 (3 - 1 = 2). However, since the Left Subtree is taller, which direction should the heavy left side rotate towards to restore balance?"
  },
  "slideLabel": "Open Slide 14 (PDF)"
}
```

### 4.3. Coding Task Detail Model (Single-File Model)
Trích xuất từ `WORKSPACE_TASK_DETAILS["avl-tree"]["avl-tree-task-3"]` trong [`web/mocks/workspaceTasks.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/workspaceTasks.js#L96-L200):

```json
{
  "nodeId": "avl-tree",
  "taskId": "avl-tree-task-3",
  "type": "coding",
  "fileName": "solution.cpp",
  "language": "C++",
  "initialCode": "#include <iostream>\nusing namespace std;\n\nstruct Node {\n    int key, height;\n    Node *left, *right;\n    Node(int k) : key(k), height(1), left(nullptr), right(nullptr) {}\n};\n\nint height(Node* n) {\n    return n ? n->height : 0;\n}\n\nint getBalance(Node* n) {\n    return n ? height(n->left) - height(n->right) : 0;\n}\n\nNode* rotateRight(Node* y) {\n    Node* x = y->left;\n    Node* T2 = x->right;\n\n    x->right = y;\n    y->left = T2;\n\n    y->height = max(height(y->left), height(y->right)) + 1;\n    x->height = max(height(x->left), height(x->right)) + 1;\n\n    return x;\n}",
  "problem": {
    "title": "Right Rotation on AVL Tree",
    "difficulty": "Medium",
    "description": "Given the root pointer y of an unbalanced subtree in an AVL tree, perform a single Right Rotation (Clockwise) so that its left child x becomes the new subtree root while preserving the Binary Search Tree (BST) ordering property. After rotation, update the heights of both affected nodes and return the pointer to the new root node x.",
    "inputFormat": "A pointer Node* y pointing to the root of the unbalanced subtree.",
    "outputFormat": "Return Node* pointing to the new root node x of the rotated subtree.",
    "examples": [
      {
        "input": "y = [30, left: 20, right: 40]\ny->left = [20, left: 10, right: 25]",
        "output": "x = [20, left: 10, right: 30]\nx->right = [30, left: 25, right: 40]",
        "explanation": "Node 20 is promoted to the new subtree root. Node 30 becomes the right child of 20, and subtree T2 (rooted at 25) is transferred to become the left child of 30."
      }
    ],
    "constraints": [
      "The number of nodes in the subtree is in the range [1, 10^4].",
      "-10^5 <= Node.key <= 10^5",
      "Node y and its left child y->left are guaranteed to be non-null in valid rotation calls.",
      "Time Complexity: O(1)",
      "Auxiliary Space: O(1)"
    ],
    "notes": "Recalculate heights in bottom-up order: update height(y) first, and then height(x), because y is now a child of x."
  },
  "analysis": {
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "optimalNote": "Meets optimal bounds for AVL operations.",
    "failedTestLabel": "Failed (Test Case #5)",
    "errorTitle": "Segmentation fault (SIGSEGV) on Test Case #5.",
    "errorCause": "Possible cause: dereferencing a null pointer (y->left).",
    "errorAction": "Check for null pointers before accessing y->left."
  },
  "visualization": {
    "badge": "AVL Tree",
    "beforeTitle": "Before (Right Rotation)",
    "afterTitle": "After"
  },
  "socraticHint": {
    "triggerLabel": "Socratic Hint (Triggered by Test Case #5):",
    "paragraph1": "Before accessing y->left, make sure that y is not a null pointer. In some test cases, the node can be empty, which leads to a segmentation fault when you try to dereference it.",
    "paragraph2": "Can you add a null check at the beginning of the rotateRight function?"
  },
  "slideLabel": "Open Slide 14 (PDF)"
}
```

---

## 5. Student Learning Progress & Workspace Persistence Model

### 5.1. UserProgressData Object
Định nghĩa tại `createDefaultProgress()` trong [`web/services/progressService.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/progressService.js#L15-L53).
Lưu trữ trong `localStorage.getItem("algopath_progress_v2_<userId>")`:

```json
{
  "userId": "user-demo-student-01",
  "accountType": "registered",
  "roadmapFlowState": "ready",
  "fileName": "CS101_DSA_Syllabus_HCMUS.pdf",
  "fileSize": "2.4 MB",
  "completedTasks": {
    "dsa-foundations-task-1": true,
    "dsa-foundations-task-2": true,
    "dsa-foundations-task-3": true,
    "complexity-analysis-task-1": true,
    "complexity-analysis-task-2": true,
    "arrays-strings-task-1": true,
    "arrays-strings-task-2": true,
    "arrays-strings-task-3": true,
    "linked-list-task-1": true,
    "linked-list-task-2": true,
    "linked-list-task-3": true,
    "avl-tree-task-1": true
  },
  "quizAnswers": {
    "dsa-foundations-task-2": {
      "selectedOption": "A",
      "isSubmitted": true
    },
    "avl-tree-task-2": {
      "selectedOption": "B",
      "isSubmitted": false
    }
  },
  "codeDrafts": {
    "avl-tree-task-3": {
      "code": "#include <iostream>\nusing namespace std;\n\nNode* rotateRight(Node* y) {\n    if (!y || !y->left) return y;\n    Node* x = y->left;\n    Node* T2 = x->right;\n    x->right = y;\n    y->left = T2;\n    return x;\n}",
      "language": "C++",
      "isSubmitted": false
    }
  },
  "hintsRemaining": {
    "avl-tree-task-3": 1
  },
  "updatedAt": "2026-11-03T16:45:00.000Z"
}
```

---

## 6. Code Execution & Grading Models

### 6.1. Execution Result – Success State
Được trả về bởi `submitCode()` trong [`web/services/executionService.ts`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/services/executionService.ts#L220-L300):

```json
{
  "action": "submit",
  "status": "success",
  "metrics": {
    "runtimeMs": 11,
    "memoryMb": "4.2 MB"
  },
  "passedCount": 8,
  "totalCount": 8,
  "testCases": [
    {
      "id": 1,
      "label": "Test Case #1: Standard Left-Heavy Tree",
      "passed": true,
      "input": "y = [30, 20, 40]",
      "expected": "x = 20, rotated",
      "actual": "x = 20, rotated"
    },
    {
      "id": 5,
      "label": "Test Case #5: Boundary Guard (Empty/Null Node)",
      "passed": true,
      "input": "y = nullptr",
      "expected": "nullptr",
      "actual": "nullptr"
    }
  ],
  "stdout": "[Submission Evaluation]\n✓ Test 1: PASSED\n✓ Test 2: PASSED\n✓ Test 3: PASSED\n✓ Test 4: PASSED\n✓ Test 5: PASSED\n✓ Test 6: PASSED\n✓ Test 7: PASSED\n✓ Test 8: PASSED\n\nVerdict: ACCEPTED. All 8 tests passed.",
  "complexity": {
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "optimal": true,
    "optimalNote": "Meets optimal bounds for AVL operations."
  }
}
```

### 6.2. Execution Result – Failed State (Runtime Error)
Được trả về khi code chưa xử lý ngoại lệ biên:

```json
{
  "action": "submit",
  "status": "failed",
  "errorType": "Runtime Error",
  "errorTitle": "Segmentation fault (SIGSEGV) on Test Case #5.",
  "errorMessage": "Possible cause: dereferencing a null pointer (y->left).",
  "errorAction": "Check for null pointers before accessing y->left.",
  "failedTestLabel": "Failed (Test Case #5 - Null Subtree)",
  "faultyLine": {
    "line": 18,
    "codeToken": "Node* x = y->left;",
    "shortReason": "Unchecked dereference of y->left"
  },
  "metrics": {
    "runtimeMs": 18,
    "memoryMb": "4.4 MB"
  },
  "passedCount": 4,
  "totalCount": 8,
  "testCases": [
    {
      "id": 5,
      "label": "Test Case #5: Boundary Guard (Empty Subtree)",
      "passed": false,
      "input": "y = nullptr",
      "expected": "nullptr",
      "actual": "SIGSEGV (Segmentation Fault)",
      "error": "Fatal signal 11: Attempted to dereference nullptr at y->left."
    }
  ],
  "stdout": "[Submission Evaluation]\n✓ Test 1: PASSED\n✓ Test 2: PASSED\n✓ Test 3: PASSED\n✓ Test 4: PASSED\n✗ Test 5: FAILED (SIGSEGV)\nVerdict: RUNTIME ERROR on Test Case #5."
}
```

---

## 7. Socratic AI Tutor & Context Models

### 7.1. Socratic Node Profile
Trích xuất từ `SOCRATIC_NODE_PROFILES["avl-tree"]` trong [`web/mocks/socraticTutorData.js`](file:///d:/HCMUS_Subject/CT/AI_CS_Tutor/web/mocks/socraticTutorData.js#L7-L130):

```json
{
  "nodeId": "avl-tree",
  "topicLabel": "AVL Tree",
  "ragSourceBadge": "RAG Citations Active • CS101_DSA_Syllabus_HCMUS.pdf",
  "faultyLine": {
    "line": 19,
    "codeToken": "Node* x = y->left;",
    "shortReason": "Null pointer dereference if y == nullptr or y->left == nullptr",
    "calloutTitle": "SIGSEGV Risk at Line 19",
    "calloutDetail": "Dereferencing y->left and x->right without verifying (!y || !y->left) crashes on empty or single-node subtrees (Test Case #5).",
    "suggestedFixHint": "Add: if (!y || !y->left) return y; before Line 19."
  },
  "slideCitation": {
    "slideTitle": "Slide 14: AVL Tree Right Rotation (LL Case)",
    "courseRef": "CS201 Data Structures • Week 7 Lecture Notes",
    "excerpt": "In a Left-Left (LL) imbalance where BF(y) = +2 and BF(y->left) >= 0, a single Right Rotation around pivot y promotes x = y->left to subtree root, re-attaches T2 = x->right as y->left, and restores BF in {-1, 0, +1} in O(1) time.",
    "keyInvariant": "Invariant: key(T1) < key(x) < key(T2) < key(y) < key(T3) before and after rotation."
  },
  "dryRunTable": {
    "title": "Pointer Dry-Run Trace • rotateRight(y) on Test Case #5",
    "columns": ["Step", "Line", "Expression", "y", "x", "T2 / Status"],
    "rows": [
      ["1 (Normal)", "Ln 19", "Node* x = y->left", "Node(30)", "Node(20)", "Valid pivot"],
      ["4 (Test #5)", "Ln 19", "Node* x = y->left", "Node(10)", "nullptr", "y has no left child!"],
      ["5 (Crash)", "Ln 20", "Node* T2 = x->right", "Node(10)", "nullptr", "💥 SIGSEGV (null->right)"]
    ]
  },
  "tiers": {
    "coding": [
      {
        "tier": 1,
        "badge": "Conceptual Probe",
        "color": "var(--color-purple)",
        "title": "What Happens When a Subtree Is Empty?",
        "content": "Look at Line 19: Node* x = y->left; followed by Node* T2 = x->right;. What happens in memory if rotateRight is called when y == nullptr or y->left == nullptr?"
      },
      {
        "tier": 2,
        "badge": "Pointer / Dry-Run Trace",
        "color": "var(--color-cyan)",
        "title": "Tracing Test Case #5 (Leaf / Null Pivot)",
        "content": "In Test Case #5, y->left is nullptr. Line 19 sets x = nullptr, and Line 20 immediately evaluates nullptr->right, triggering SIGSEGV before any rotation occurs."
      },
      {
        "tier": 3,
        "badge": "Edge-Case Guard",
        "color": "var(--color-warning)",
        "title": "Defensive Guard Clause",
        "content": "How would you write a defensive guard at the very start of rotateRight to verify that y and y->left are valid before dereferencing their member fields?"
      }
    ]
  }
}
```
