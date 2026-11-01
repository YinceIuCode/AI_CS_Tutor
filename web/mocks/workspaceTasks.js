/**
 * Detailed Task Content for the OffByOne Learning Workspace.
 * Linked to `MOCK_ROADMAP_NODES` in `roadmapData.js` via `nodeId` and `taskId`.
 * All displayed content is in English.
 */

export const WORKSPACE_TASK_DETAILS = {
  /* ==================== 1. AVL TREE ==================== */
  "avl-tree": {
    "avl-tree-task-1": {
      nodeId: "avl-tree",
      taskId: "avl-tree-task-1",
      type: "theory",
      headerTitle: "CORE THEORY: AVL TREE & BIG-O COMPLEXITY",
      moduleLabel: "Module 1 of 3:",
      summaryLead:
        "An AVL Tree is a self-balancing Binary Search Tree where the difference between heights of left and right subtrees (the Balance Factor) cannot exceed 1 for any node.",
      highlightTerms: {
        concept: "Balance Factor",
        bound: "1",
      },
      cards: [
        {
          badge: "01",
          title: "AVL Balance Factor Invariant",
          detail:
            "Balance Factor (BF) = Height(Left Subtree) - Height(Right Subtree). Every node in an AVL tree must strictly satisfy BF ∈ {-1, 0, +1}.",
          tag: "Invariant",
        },
        {
          badge: "02",
          title: "Left-Heavy Imbalance (BF = +2 → Right Rotation)",
          detail:
            "When inserting into the left-left (LL) subtree causes BF = +2, a single Right Rotation around the unbalanced root restores height balance in O(1) time.",
          tag: "LL Rotation",
        },
        {
          badge: "03",
          title: "Right-Heavy Imbalance (BF = -2 → Left Rotation)",
          detail:
            "When inserting into the right-right (RR) subtree causes BF = -2, a single Left Rotation pulls the right child up as the new subtree root.",
          tag: "RR Rotation",
        },
        {
          badge: "04",
          title: "Guaranteed O(log N) Worst-Case Complexity",
          detail:
            "By bounding tree height to ~1.44 log2(N), AVL trees prevent degenerate O(N) skewed chains on sorted inputs for Search, Insert, and Delete.",
          tag: "Big-O Guaranteed",
        },
      ],
      socraticCheck:
        "Notice how the Balance Factor only depends on the height of direct child subtrees. Why do we only need O(1) local pointer updates during a rotation instead of rebuilding the entire tree?",
      slideLabel: "Open Slide 14 (PDF)",
    },
    "avl-tree-task-2": {
      nodeId: "avl-tree",
      taskId: "avl-tree-task-2",
      type: "quiz",
      headerTitle: "QUIZ: AVL TREE",
      questionLabel: "Question 2 of 3:",
      questionPrompt:
        "Given an AVL Tree node N with Left Subtree Height = 3 and Right Subtree Height = 1. What is the Balance Factor of node N, and does it require a rotation?",
      options: [
        {
          id: "A",
          text: "Balance Factor = +2 (Requires Right Rotation)",
          isCorrect: true,
        },
        {
          id: "B",
          text: "Balance Factor = +2 (Requires Left Rotation)",
          isCorrect: false,
        },
        {
          id: "C",
          text: "Balance Factor = -2 (Requires Right Rotation)",
          isCorrect: false,
        },
        {
          id: "D",
          text: "Balance Factor = +1 (Tree is already balanced)",
          isCorrect: false,
        },
      ],
      hints: {
        awaiting:
          "Select one of the options (A, B, C, or D) on the left. If your choice has a logical flaw, Socratic AI will guide your reasoning without spoiling the answer.",
        correct:
          "Spot on! The Balance Factor is +2 (3 - 1 = 2). Because the Left Subtree is heavier, rotating the tree to the Right restores balance in O(1) time.",
        incorrect:
          "You calculated the Balance Factor as +2 (3 - 1 = 2). However, since the Left Subtree is taller (height 3 > height 1), which direction should the heavy left side rotate towards to restore balance?",
      },
      slideLabel: "Open Slide 14 (PDF)",
    },
    "avl-tree-task-3": {
      nodeId: "avl-tree",
      taskId: "avl-tree-task-3",
      type: "coding",
      fileName: "solution.cpp",
      language: "C++",
      initialCode: `#include <iostream>
using namespace std;

struct Node {
    int key, height;
    Node *left, *right;
    Node(int k) : key(k), height(1), left(nullptr), right(nullptr) {}
};

int height(Node* n) {
    return n ? n->height : 0;
}

int getBalance(Node* n) {
    return n ? height(n->left) - height(n->right) : 0;
}

Node* rotateRight(Node* y) {
    Node* x = y->left;
    Node* T2 = x->right;

    x->right = y;
    y->left = T2;

    y->height = max(height(y->left), height(y->right)) + 1;
    x->height = max(height(x->left), height(x->right)) + 1;

    return x;
}`,
      analysis: {
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)",
        optimalNote: "Meets optimal bounds for AVL operations.",
        failedTestLabel: "Failed (Test Case #5)",
        errorTitle: "Segmentation fault (SIGSEGV) on Test Case #5.",
        errorCause: "Possible cause: dereferencing a null pointer (y->left).",
        errorAction: "Check for null pointers before accessing y->left.",
      },
      visualization: {
        badge: "AVL Tree",
        beforeTitle: "Before (Right Rotation)",
        afterTitle: "After",
      },
      socraticHint: {
        triggerLabel: "Socratic Hint (Triggered by Test Case #5):",
        paragraph1:
          "Before accessing y->left, make sure that y is not a null pointer. In some test cases, the node can be empty, which leads to a segmentation fault when you try to dereference it.",
        paragraph2:
          "Can you add a null check at the beginning of the rotateRight function?",
      },
      slideLabel: "Open Slide 14 (PDF)",
    },
  },

  /* ==================== 2. BINARY SEARCH TREE ==================== */
  "binary-search-tree": {
    "bst-task-1": {
      nodeId: "binary-search-tree",
      taskId: "bst-task-1",
      type: "theory",
      headerTitle: "CORE THEORY: BINARY SEARCH TREE INVARIANTS",
      moduleLabel: "Module 1 of 3:",
      summaryLead:
        "A Binary Search Tree (BST) enforces a strict global ordering property: every key in the left subtree is strictly smaller than the root, and every key in the right subtree is strictly larger.",
      cards: [
        {
          badge: "01",
          title: "Global Subtree Key Ordering",
          detail:
            "For any node N, max(LeftSubtree) < N.key < min(RightSubtree). Checking only immediate children is insufficient to validate a BST.",
          tag: "BST Invariant",
        },
        {
          badge: "02",
          title: "Inorder Traversal Produces Sorted Output",
          detail:
            "Visiting Left → Root → Right on a valid BST always yields keys in strictly ascending order in O(N) time.",
          tag: "Traversal",
        },
        {
          badge: "03",
          title: "Hibbard Deletion (Two-Child Case)",
          detail:
            "When deleting a node with two children, replace its key with its Inorder Successor (minimum key in right subtree) and delete the successor.",
          tag: "Deletion",
        },
        {
          badge: "04",
          title: "Average O(log N) vs. Skewed O(N) Worst Case",
          detail:
            "Random insertions yield O(log N) height, whereas sorted insertions without rebalancing degenerate into a linked list of height O(N).",
          tag: "Complexity",
        },
      ],
      socraticCheck:
        "Why does checking only (node->left->key < node->key && node->right->key > node->key) fail to detect an invalid BST when a deep grandchild violates an ancestor's bound?",
      slideLabel: "Open Slide 11 (PDF)",
    },
    "bst-task-2": {
      nodeId: "binary-search-tree",
      taskId: "bst-task-2",
      type: "quiz",
      headerTitle: "QUIZ: BINARY SEARCH TREE",
      questionLabel: "Question 2 of 3:",
      questionPrompt:
        "When deleting a node K that has two children in a Binary Search Tree, which node can safely replace K while preserving the BST ordering property?",
      options: [
        {
          id: "A",
          text: "The minimum node in K's right subtree (Inorder Successor)",
          isCorrect: true,
        },
        {
          id: "B",
          text: "The maximum node in K's right subtree",
          isCorrect: false,
        },
        {
          id: "C",
          text: "The minimum node in K's left subtree",
          isCorrect: false,
        },
        {
          id: "D",
          text: "Any leaf node in the tree",
          isCorrect: false,
        },
      ],
      hints: {
        awaiting:
          "Select one of the options (A, B, C, or D) on the left to verify how BST deletion preserves key ordering.",
        correct:
          "Correct! The minimum key in K's right subtree (Inorder Successor) is larger than everything in K's left subtree and smaller than all remaining keys in K's right subtree.",
        incorrect:
          "Think about the ordering requirement: the replacement key must be greater than all keys in K's left subtree, yet smaller than all other keys in K's right subtree. Which node satisfies both bounds?",
      },
      slideLabel: "Open Slide 11 (PDF)",
    },
    "bst-task-3": {
      nodeId: "binary-search-tree",
      taskId: "bst-task-3",
      type: "coding",
      fileName: "bst_insert.cpp",
      language: "C++",
      initialCode: `#include <iostream>
using namespace std;

struct TreeNode {
    int key;
    TreeNode *left, *right;
    TreeNode(int k) : key(k), left(nullptr), right(nullptr) {}
};

TreeNode* insertBST(TreeNode* root, int key) {
    if (key < root->key) {
        root->left = insertBST(root->left, key);
    } else if (key > root->key) {
        root->right = insertBST(root->right, key);
    }
    return root;
}

TreeNode* searchBST(TreeNode* root, int target) {
    if (!root || root->key == target) return root;
    return target < root->key
        ? searchBST(root->left, target)
        : searchBST(root->right, target);
}`,
      analysis: {
        timeComplexity: "O(H) / O(log N)",
        spaceComplexity: "O(H) stack",
        optimalNote: "Logarithmic path traversal on balanced BST inputs.",
        failedTestLabel: "Failed (Test Case #1 - Empty Tree)",
        errorTitle: "Null pointer dereference on root->key in insertBST.",
        errorCause: "Possible cause: missing base case when root == nullptr.",
        errorAction: "Return new TreeNode(key) when root is nullptr.",
      },
      visualization: {
        badge: "Binary Search Tree",
        beforeTitle: "Recursive Search Path",
        afterTitle: "Subtree Insertion",
      },
      socraticHint: {
        triggerLabel: "Socratic Hint (Triggered by Test Case #1):",
        paragraph1:
          "In insertBST(TreeNode* root, int key), when recursion reaches the empty spot where the new key belongs, root becomes nullptr.",
        paragraph2:
          "What base condition should you place at the top of insertBST before comparing key < root->key?",
      },
      slideLabel: "Open Slide 11 (PDF)",
    },
  },

  /* ==================== 3. LINKED LIST ==================== */
  "linked-list": {
    "linked-list-task-1": {
      nodeId: "linked-list",
      taskId: "linked-list-task-1",
      type: "theory",
      headerTitle: "CORE THEORY: LINKED LISTS & POINTER REWIRING",
      moduleLabel: "Module 1 of 3:",
      summaryLead:
        "A Linked List stores elements in non-contiguous heap nodes connected via next/prev pointers, enabling O(1) insertion and deletion once a node reference is known.",
      cards: [
        {
          badge: "01",
          title: "O(1) Pointer Insertion vs. O(N) Sequential Lookup",
          detail:
            "Unlike arrays, linked lists do not support O(1) random indexing, but splicing a node in or out requires only local pointer updates.",
          tag: "Trade-off",
        },
        {
          badge: "02",
          title: "Sentinel (Dummy Head) Pattern",
          detail:
            "Using a stack-allocated dummy head node eliminates special-case branching when inserting at or deleting the first node.",
          tag: "Clean Code",
        },
        {
          badge: "03",
          title: "Three-Pointer In-Place Reversal",
          detail:
            "Maintaining prev, curr, and nextTemp pointers reverses a singly linked list in O(N) time and O(1) auxiliary space.",
          tag: "In-Place O(1)",
        },
        {
          badge: "04",
          title: "Floyd's Tortoise and Hare Cycle Detection",
          detail:
            "Advancing slow by 1 step and fast by 2 steps detects cycles in O(N) time without a hash set.",
          tag: "Two Pointers",
        },
      ],
      socraticCheck:
        "When reversing a singly linked list in-place, why must you save ListNode* nextTemp = curr->next BEFORE assigning curr->next = prev?",
      slideLabel: "Open Slide 06 (PDF)",
    },
    "linked-list-task-2": {
      nodeId: "linked-list",
      taskId: "linked-list-task-2",
      type: "quiz",
      headerTitle: "QUIZ: LINKED LIST",
      questionLabel: "Question 2 of 3:",
      questionPrompt:
        "In Floyd's Cycle Detection algorithm on a Linked List, if the fast pointer (2 steps/iter) and slow pointer (1 step/iter) meet inside a cycle, what is the auxiliary space complexity?",
      options: [
        {
          id: "A",
          text: "O(1) auxiliary space (Only two pointers used)",
          isCorrect: true,
        },
        {
          id: "B",
          text: "O(N) auxiliary space due to visited node storage",
          isCorrect: false,
        },
        {
          id: "C",
          text: "O(log N) auxiliary call stack space",
          isCorrect: false,
        },
        {
          id: "D",
          text: "O(N²) time and O(N) space",
          isCorrect: false,
        },
      ],
      hints: {
        awaiting:
          "Choose an option (A, B, C, or D) to analyze the memory footprint of Floyd's Tortoise and Hare algorithm.",
        correct:
          "Exactly! Because Floyd's algorithm only tracks two node pointers (slow and fast) without a hash table or recursion, its extra space is strictly O(1).",
        incorrect:
          "Does Floyd's Tortoise and Hare algorithm allocate any hash set or recursive stack frames, or does it only move two pointers along existing nodes?",
      },
      slideLabel: "Open Slide 06 (PDF)",
    },
    "linked-list-task-3": {
      nodeId: "linked-list",
      taskId: "linked-list-task-3",
      type: "coding",
      fileName: "reverse_list.cpp",
      language: "C++",
      initialCode: `#include <iostream>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v) : val(v), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;

    while (curr != nullptr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
      analysis: {
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        optimalNote: "Single-pass in-place pointer reversal.",
        failedTestLabel: "Edge Case Check (#3)",
        errorTitle: "Verify empty list (head == nullptr) & single-node list.",
        errorCause: "Ensure loop invariant holds when curr starts as nullptr.",
        errorAction: "Trace prev return value when head is nullptr.",
      },
      visualization: {
        badge: "Linked List",
        beforeTitle: "Before (head → 1 → 2)",
        afterTitle: "After (2 → 1 → null)",
      },
      socraticHint: {
        triggerLabel: "Socratic Hint (Pointer Rewiring Trace):",
        paragraph1:
          "In each iteration, curr->next is redirected to point backward at prev. Saving nextTemp = curr->next beforehand prevents losing the rest of the list.",
        paragraph2:
          "When the while loop terminates (curr == nullptr), why does prev point to the new head of the reversed list?",
      },
      slideLabel: "Open Slide 06 (PDF)",
    },
  },
}

/**
 * Fallback generator so every single node and task in `MOCK_ROADMAP_NODES`
 * (DSA Foundations, Complexity Analysis, Arrays & Strings, Stack & Queue, Trees, Sorting, Graphs)
 * dynamically renders complete, topic-accurate English Theory, Quiz, or Coding content.
 */
export function getWorkspaceTaskDetail(node, task) {
  if (!node || !task) return null

  const nodeBucket = WORKSPACE_TASK_DETAILS[node.id]
  if (nodeBucket && nodeBucket[task.id]) {
    return nodeBucket[task.id]
  }

  // Dynamic topic-specific English content for remaining nodes
  if (task.type === "theory") {
    return {
      nodeId: node.id,
      taskId: task.id,
      type: "theory",
      headerTitle: `CORE THEORY: ${node.label.toUpperCase()} (${node.complexity})`,
      moduleLabel: "Module 1 of 3:",
      summaryLead: `${node.description} Mastering ${node.label} requires understanding both its structural invariants and its ${node.complexity} complexity bounds.`,
      cards: [
        {
          badge: "01",
          title: `${node.label} Structural Invariant`,
          detail: `Core representation and memory layout properties that guarantee correctness across all ${node.label} operations.`,
          tag: "Invariant",
        },
        {
          badge: "02",
          title: `Time & Space Complexity (${node.complexity})`,
          detail: `Detailed asymptotic breakdown of worst-case and average-case performance for ${node.label}.`,
          tag: node.complexity,
        },
        {
          badge: "03",
          title: "Boundary Conditions & Edge Cases",
          detail: `Handling empty inputs, single-element structures, and capacity limits safely without undefined behavior.`,
          tag: "Edge Cases",
        },
        {
          badge: "04",
          title: "Algorithmic Problem Patterns",
          detail: `Recognizing when to apply ${node.label} to optimize brute-force solutions in competitive and systems programming.`,
          tag: "Optimization",
        },
      ],
      socraticCheck: `When applying ${node.label} in practice, which structural invariant is responsible for achieving the ${node.complexity} complexity bound?`,
      slideLabel: "Open Lecture Slides (PDF)",
    }
  }

  if (task.type === "quiz") {
    return {
      nodeId: node.id,
      taskId: task.id,
      type: "quiz",
      headerTitle: `QUIZ: ${node.label.toUpperCase()}`,
      questionLabel: "Question 2 of 3:",
      questionPrompt: `Regarding ${node.label} (${task.title}): Which statement accurately describes its operational complexity and structural invariant?`,
      options: [
        {
          id: "A",
          text: `Maintains the ${node.label} invariant with ${node.complexity} operational bound`,
          isCorrect: true,
        },
        {
          id: "B",
          text: `Requires rebuilding the entire data structure in O(N²) on every update`,
          isCorrect: false,
        },
        {
          id: "C",
          text: `Cannot handle empty or single-element boundary inputs without extra O(N) memory`,
          isCorrect: false,
        },
        {
          id: "D",
          text: `Always degrades to exponential O(2^N) time on sorted sequences`,
          isCorrect: false,
        },
      ],
      hints: {
        awaiting:
          "Select one of the options (A, B, C, or D) on the left. Socratic AI will guide your reasoning based on your course syllabus.",
        correct: `Spot on! ${node.label} preserves its structural invariant while achieving ${node.complexity} efficiency.`,
        incorrect: `Re-evaluate how ${node.label} updates its internal state. Does it really need O(N²) work on every operation, or does its invariant bound the work to ${node.complexity}?`,
      },
      slideLabel: "Open Lecture Slides (PDF)",
    }
  }

  // Default Coding task for the node
  return {
    nodeId: node.id,
    taskId: task.id,
    type: "coding",
    fileName: "solution.cpp",
    language: "C++",
    initialCode: `#include <iostream>
#include <vector>
using namespace std;

// Topic: ${node.label} (${node.complexity})
// Task: ${task.title}
// ${task.description}

class Solution {
public:
    int solve(vector<int>& nums) {
        if (nums.empty()) return 0;
        int n = static_cast<int>(nums.size());
        int result = nums[0];

        for (int i = 1; i < n; ++i) {
            result = max(result, nums[i]);
        }
        return result;
    }
};

int main() {
    Solution solver;
    vector<int> sample = {4, 2, 9, 1, 7};
    cout << solver.solve(sample) << endl;
    return 0;
}`,
    analysis: {
      timeComplexity: node.complexity,
      spaceComplexity: "O(1)",
      optimalNote: `Meets optimal bounds for ${node.label} operations.`,
      failedTestLabel: "Edge Case Check (#5)",
      errorTitle: `Boundary condition check on ${node.label} input.`,
      errorCause:
        "Possible cause: unvalidated empty container or boundary index.",
      errorAction:
        "Verify base cases and index bounds before accessing elements.",
    },
    visualization: {
      badge: node.label,
      beforeTitle: "Before State",
      afterTitle: "After Transition",
    },
    socraticHint: {
      triggerLabel: `Socratic Hint (${node.label}):`,
      paragraph1: `When implementing ${task.title}, pay close attention to how pointers or indices transition at the boundaries of the ${node.label} structure.`,
      paragraph2:
        "What defensive guard condition at the start of the function prevents out-of-bounds or null dereference errors?",
    },
    slideLabel: "Open Lecture Slides (PDF)",
  }
}
