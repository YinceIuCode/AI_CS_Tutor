/**
 * Node-Specific Socratic AI Tutor Dataset for all 10 DSA Curriculum Nodes.
 * Combines:
 *  - 3-Tier Progressive Hint Ladder (Tier 1: Conceptual Probe, Tier 2: Pointer / Dry-Run Trace, Tier 3: Edge-Case Guard)
 *  - Interactive Quick-Reply Chips & Socratic Conversational Responses
 *  - RAG Lecture Slide Citation Preview & Pointer Dry-Run Trace Table
 *  - Faulty Line Metadata for Monaco Editor Line Highlight & Pointer Callout
 *  - Spoiler-Free Guardrail Responses
 */

export const SOCRATIC_NODE_PROFILES = {
  /* ==================== 1. AVL TREE ==================== */
  "avl-tree": {
    nodeId: "avl-tree",
    topicLabel: "AVL Tree",
    ragSourceBadge: "Slide 14 • AVL Rotations",
    faultyLine: {
      line: 19,
      codeToken: "Node* x = y->left;",
      shortReason: "Null pointer dereference if y == nullptr or y->left == nullptr",
      calloutTitle: "SIGSEGV Risk at Line 19",
      calloutDetail:
        "Dereferencing y->left and x->right without verifying (!y || !y->left) crashes on empty or single-node subtrees (Test Case #5).",
      suggestedFixHint: "Add: if (!y || !y->left) return y; before Line 19.",
    },
    tiers: {
      theory: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Why Local Subtree Heights Suffice",
          content:
            "Notice how Balance Factor (BF) is defined as Height(Left) - Height(Right). When you rotate node y with its child x, why don't nodes above y's parent need their pointers rewired?",
        },
        {
          tier: 2,
          badge: "Invariant Trace",
          color: "#7DCFFF",
          title: "Subtree Order Preservation (T1 < x < T2 < y < T3)",
          content:
            "During a Right Rotation, only subtree T2 changes parent (from x->right to y->left). Since all keys in T2 are strictly between x and y, the global BST ordering remains intact in O(1) time.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Height Recalculation Order",
          content:
            "After rotating, y becomes the child of x. Which node's height MUST be recomputed first—y (the lower node) or x (the new root)?",
        },
      ],
      quiz: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Interpreting the Sign of Balance Factor",
          content:
            "Balance Factor = Height(Left) - Height(Right) = 3 - 1 = +2. A positive sign means the Left subtree is heavier. Which direction must the tree tip to equalize height?",
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: "Visualizing Left-Left (LL) Imbalance",
          content:
            "Imagine holding node N and pulling its taller left child up to become the new root while N drops down to the right. That clockwise motion is a Right Rotation.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "When Single vs. Double Rotation Applies",
          content:
            "If the left child itself had BF = -1 (Left-Right case), you would perform Left-Right rotation. Here, standard LL imbalance with BF = +2 requires a single Right Rotation.",
        },
      ],
      coding: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "What Happens When a Subtree Is Empty?",
          content:
            "Look at Line 19: `Node* x = y->left;` followed by `Node* T2 = x->right;`. What happens in memory if `rotateRight` is called when `y == nullptr` or `y->left == nullptr`?",
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: "Tracing Test Case #5 (Leaf / Null Pivot)",
          content:
            "In Test Case #5, `y->left` is `nullptr`. Line 19 sets `x = nullptr`, and Line 20 immediately evaluates `nullptr->right`, triggering `SIGSEGV` before any rotation occurs.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Defensive Guard Clause Before Dereferencing",
          content:
            "Guard the entry of `rotateRight(Node* y)` by checking whether `y` or `y->left` is null (`if (!y || !y->left) return y;`) right before Line 19.",
        },
      ],
    },
    quickReplies: [
      {
        id: "avl-q1",
        label: "Why does T2 move to y->left?",
        studentPrompt: "Why does subtree T2 move from x->right to y->left during rotateRight?",
        aiResponse:
          "Great question! Every key in `T2` was originally in `x->right` (so `T2 > x`) and inside `y->left` (so `T2 < y`). When `x` becomes the new root and `y` becomes `x->right`, attaching `T2` to `y->left` keeps `x < T2 < y` without touching any node inside `T2`!",
        followUpQuestion: "If we updated `x->height` before `y->height`, what wrong value would `x->height` compute?",
      },
      {
        id: "avl-q2",
        label: "Why update y->height before x->height?",
        studentPrompt: "Why must we update y->height before x->height on Lines 25-26?",
        aiResponse:
          "Look at the tree after rotation: `y` is now the right child of `x`. Since `height(x)` depends on `max(height(x->left), height(x->right)) + 1`, and `x->right` is `y`, `y->height` must be fresh first!",
        followUpQuestion: "What happens at Line 19 if `y->left` is `nullptr`?",
      },
      {
        id: "avl-q3",
        label: "How to fix Line 19 SIGSEGV?",
        studentPrompt: "What guard condition do I need around Line 19 to pass Test Case #5?",
        aiResponse:
          "Before dereferencing `y->left` on Line 19 and `x->right` on Line 20, ask yourself: can a rotation happen if `y` is null or has no left child? Adding `if (!y || !y->left) return y;` at the start of `rotateRight` safely exits without crashing.",
        followUpQuestion: "Try adding that guard in the editor and clicking Run Code!",
      },
    ],
    slideCitation: {
      slideTitle: "Slide 14: AVL Tree Right Rotation (LL Case)",
      courseRef: "CS201 Data Structures • Week 7 Lecture Notes",
      excerpt:
        "In a Left-Left (LL) imbalance where BF(y) = +2 and BF(y->left) >= 0, a single Right Rotation around pivot y promotes x = y->left to subtree root, re-attaches T2 = x->right as y->left, and restores BF ∈ {-1, 0, +1} in O(1) time.",
      keyInvariant: "Invariant: key(T1) < key(x) < key(T2) < key(y) < key(T3) before and after rotation.",
    },
    dryRunTable: {
      title: "Pointer Dry-Run Trace • rotateRight(y) on Test Case #5",
      columns: ["Step", "Line", "Expression", "y", "x", "T2 / Status"],
      rows: [
        ["1 (Normal)", "Ln 19", "Node* x = y->left", "Node(30)", "Node(20)", "Valid pivot"],
        ["2 (Normal)", "Ln 20", "Node* T2 = x->right", "Node(30)", "Node(20)", "T2 = Node(25)"],
        ["3 (Normal)", "Ln 22-23", "x->right = y; y->left = T2", "y->left=25", "x->right=30", "Rewired O(1)"],
        ["4 (Test #5)", "Ln 19", "Node* x = y->left", "Node(10)", "nullptr", "y has no left child!"],
        ["5 (Crash)", "Ln 20", "Node* T2 = x->right", "Node(10)", "nullptr", "💥 SIGSEGV (null->right)"],
      ],
    },
  },

  /* ==================== 2. BINARY SEARCH TREE ==================== */
  "binary-search-tree": {
    nodeId: "binary-search-tree",
    topicLabel: "Binary Search Tree",
    ragSourceBadge: "Slide 11 • BST Invariants",
    faultyLine: {
      line: 11,
      codeToken: "if (key < root->key) {",
      shortReason: "Missing base case: if (!root) return new TreeNode(key);",
      calloutTitle: "Null Dereference at Line 11",
      calloutDetail:
        "Comparing `key < root->key` without first checking `if (!root)` crashes immediately when inserting into an empty tree or reaching a leaf spot.",
      suggestedFixHint: "Insert `if (!root) return new TreeNode(key);` at Line 10.",
    },
    tiers: {
      theory: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Local vs. Global Subtree Ordering",
          content:
            "Why is checking `node->left->key < node->key` at every node NOT enough to guarantee a valid Binary Search Tree?",
        },
        {
          tier: 2,
          badge: "Invariant Trace",
          color: "#7DCFFF",
          title: "Propagating [minBound, maxBound] Downward",
          content:
            "Every time you branch left from ancestor P, all descendants in that subtree must be strictly less than P.key—even if they are on a right branch deeper down.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Duplicate Keys & Skewed Degeneration",
          content:
            "If sorted keys [10, 20, 30, 40] are inserted into an unbalanced BST, what shape does the tree take and what happens to search complexity?",
        },
      ],
      quiz: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Preserving BST Order During Two-Child Deletion",
          content:
            "If node K has both a left and a right subtree, its replacement must be larger than every key in K's left subtree and smaller than every remaining key in K's right subtree.",
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: "Locating the Inorder Successor",
          content:
            "Step once into `K->right`, then walk `left` as far as possible until `left == nullptr`. That node is the minimum of the right subtree (Inorder Successor).",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Why Maximum of Right Subtree Fails",
          content:
            "If you replaced K with the maximum of K's right subtree, K's new key would be larger than its right children—violating the BST property immediately.",
        },
      ],
      coding: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Where Does Recursive Insertion Stop?",
          content:
            "Look at `insertBST(TreeNode* root, int key)` on Line 10. As recursion walks down `root->left` or `root->right`, it eventually hits `nullptr`. Where is the new `TreeNode(key)` allocated?",
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: "Tracing Line 11 on an Empty Tree (Test Case #1)",
          content:
            "When `root == nullptr`, execution jumps straight to Line 11 (`if (key < root->key)`), attempting to read memory at `0x0` and crashing.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Adding the Base Case Before Line 11",
          content:
            "At the very top of `insertBST`, check `if (!root) return new TreeNode(key);` so recursion terminates cleanly and links the new leaf back up.",
        },
      ],
    },
    quickReplies: [
      {
        id: "bst-q1",
        label: "Why does Line 11 crash?",
        studentPrompt: "Why does `if (key < root->key)` on Line 11 fail on Test Case #1?",
        aiResponse:
          "Because every recursive search in a BST eventually reaches a `nullptr` child where the new key should be attached! Without `if (!root) return new TreeNode(key);` before Line 11, `root->key` dereferences a null pointer.",
        followUpQuestion: "What should `insertBST` return when `root == nullptr`?",
      },
      {
        id: "bst-q2",
        label: "Inorder Successor vs Predecessor?",
        studentPrompt: "Can we use Inorder Predecessor instead of Inorder Successor when deleting?",
        aiResponse:
          "Yes! Either the maximum of the left subtree (Inorder Predecessor) or the minimum of the right subtree (Inorder Successor) satisfies the global BST ordering invariant.",
        followUpQuestion: "How many children can an Inorder Successor have at most?",
      },
      {
        id: "bst-q3",
        label: "What if key == root->key?",
        studentPrompt: "What happens in `insertBST` if the key already exists in the tree?",
        aiResponse:
          "In standard strict-key BSTs, if `key == root->key`, neither the `<` nor `>` branch executes, and `return root;` leaves the existing node unchanged without duplicates.",
        followUpQuestion: "Try adding the base case above Line 11 and click Run Code!",
      },
    ],
    slideCitation: {
      slideTitle: "Slide 11: Recursive BST Insertion & Hibbard Deletion",
      courseRef: "CS201 Data Structures • Week 6 Lecture Notes",
      excerpt:
        "Recursive BST insertion walks down the unique search path in O(H) time until encountering a null link (root == nullptr), where it allocates and returns a new leaf node to be assigned to the parent's child pointer.",
      keyInvariant: "Invariant: For every node u, max(Left(u)) < u.key < min(Right(u)).",
    },
    dryRunTable: {
      title: "Recursive Call Trace • insertBST(root, 25)",
      columns: ["Call Depth", "Line", "root", "key", "Action / Result"],
      rows: [
        ["Depth 0", "Ln 11", "Node(20)", "25", "25 > 20 → recurse root->right"],
        ["Depth 1", "Ln 11", "Node(30)", "25", "25 < 30 → recurse root->left"],
        ["Depth 2 (Bug)", "Ln 11", "nullptr", "25", "💥 Dereferences nullptr->key"],
        ["Depth 2 (Fixed)", "Ln 10", "nullptr", "25", "✓ Returns new TreeNode(25)"],
      ],
    },
  },

  /* ==================== 3. LINKED LIST ==================== */
  "linked-list": {
    nodeId: "linked-list",
    topicLabel: "Linked List",
    ragSourceBadge: "Slide 06 • Pointer Rewiring",
    faultyLine: {
      line: 16,
      codeToken: "curr->next = prev;",
      shortReason: "Verify head == nullptr guard & cycle safety before rewiring curr->next",
      calloutTitle: "Pointer Rewiring Check at Line 16",
      calloutDetail:
        "Line 16 reverses the link direction (`curr->next = prev`). Ensure boundary guards (`if (!head || !head->next) return head;`) are explicit for edge-case verification.",
      suggestedFixHint: "Add `if (!head || !head->next) return head;` before the loop to handle 0/1-node lists explicitly.",
    },
    tiers: {
      theory: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Why We Need Three Pointers to Reverse In-Place",
          content:
            "As soon as you execute `curr->next = prev`, the original forward link is overwritten. How do you keep track of the remainder of the list without O(N) extra memory?",
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: "Lockstep Advancement: prev → curr → nextTemp",
          content:
            "In every iteration: (1) save `nextTemp = curr->next`, (2) flip `curr->next = prev`, (3) advance `prev = curr`, (4) advance `curr = nextTemp`.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Empty List & Single-Node Termination",
          content:
            "When `curr` finally becomes `nullptr`, `prev` sits on the last non-null node—which is now the new head of the reversed list.",
        },
      ],
      quiz: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Hash Set vs. Two Pointers for Cycle Detection",
          content:
            "Storing visited node addresses in an `unordered_set` takes O(N) auxiliary memory. How does Floyd's Tortoise and Hare avoid storing past nodes?",
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: "Relative Speed Inside a Cycle",
          content:
            "Once both `slow` (+1 step) and `fast` (+2 steps) enter the cycle, the distance between them shrinks by 1 link per iteration, guaranteeing collision in O(N) time and O(1) space.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Safe Loop Condition for Fast Pointer",
          content:
            "Why must the loop condition check `while (fast && fast->next)` before evaluating `fast = fast->next->next`?",
        },
      ],
      coding: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: "Inspecting the Reversal Invariant at Line 16",
          content:
            "At Line 16 (`curr->next = prev;`), `curr` detaches from the forward chain and points backward. What invariant holds between `prev` and `curr` at the start of each iteration?",
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: "Tracing Boundary Inputs (Empty & 1-Node List)",
          content:
            "On a 1-node list `[42]`, `nextTemp` is `nullptr`, `42->next` becomes `nullptr`, `prev` becomes `42`, and `curr` becomes `nullptr`.",
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: "Explicit Early-Exit Guard",
          content:
            "Add an explicit guard `if (!head || !head->next) return head;` at the top of `reverseList` to short-circuit empty and single-element lists.",
        },
      ],
    },
    quickReplies: [
      {
        id: "ll-q1",
        label: "What if I swap Line 15 and 16?",
        studentPrompt: "What happens if I write `curr->next = prev` BEFORE `nextTemp = curr->next`?",
        aiResponse:
          "If you overwrite `curr->next = prev` first, `nextTemp = curr->next` will just set `nextTemp = prev`! You permanently lose the pointer to the rest of the linked list (a memory leak + infinite/truncated loop).",
        followUpQuestion: "Why does `return prev;` at Line 20 return the new head instead of `return curr;`?",
      },
      {
        id: "ll-q2",
        label: "Why return prev instead of curr?",
        studentPrompt: "At the end of the while loop, why do we return `prev` instead of `curr`?",
        aiResponse:
          "Because the `while (curr != nullptr)` loop only stops when `curr` walks off the end of the list (`curr == nullptr`). At that exact moment, `prev` is pointing to the last real node—which is the new head!",
        followUpQuestion: "How can you add a fast guard for `!head || !head->next` at the top of `reverseList`?",
      },
      {
        id: "ll-q3",
        label: "How to pass Edge Case #3?",
        studentPrompt: "How do I satisfy the Edge Case #3 boundary check in the editor?",
        aiResponse:
          "Add `if (!head || !head->next) return head;` at the start of `reverseList` before initializing `prev` and `curr`, then click **Run Code**.",
        followUpQuestion: "What is the auxiliary space complexity of this iterative reversal vs. recursive reversal?",
      },
    ],
    slideCitation: {
      slideTitle: "Slide 06: Three-Pointer Singly Linked List Reversal",
      courseRef: "CS201 Data Structures • Week 3 Lecture Notes",
      excerpt:
        "In-place reversal maintains two disjoint sublists: the already-reversed prefix headed by `prev`, and the unreversed suffix headed by `curr`. Caching `nextTemp = curr->next` preserves reachability before pointer inversion.",
      keyInvariant: "Loop Invariant: `prev` points to reversed prefix; `curr` points to unreversed suffix.",
    },
    dryRunTable: {
      title: "Pointer Dry-Run Trace • reverseList([1 -> 2 -> 3])",
      columns: ["Iter", "Line", "prev", "curr", "nextTemp", "List State"],
      rows: [
        ["Init", "Ln 11-12", "null", "1", "—", "null   1 -> 2 -> 3"],
        ["Iter 1", "Ln 15-18", "1", "2", "2", "null <- 1   2 -> 3"],
        ["Iter 2", "Ln 15-18", "2", "3", "3", "null <- 1 <- 2   3"],
        ["Iter 3", "Ln 15-18", "3", "null", "null", "null <- 1 <- 2 <- 3 (Return prev=3)"],
      ],
    },
  },
}

/**
 * Topic-specific overrides for the remaining 7 curriculum nodes so all 10 nodes
 * have authentic, domain-specific Socratic mentoring, faulty line callouts, and dry-run tables.
 */
const EXTRA_NODE_OVERRIDES = {
  "dsa-foundations": {
    ragSourceBadge: "Slide 02 • Memory & ADT Contracts",
    faultyLine: {
      line: 14,
      codeToken: "int result = nums[0];",
      shortReason: "Check negative-only arrays & integer overflow boundaries",
      calloutTitle: "Boundary Invariant Check at Line 14",
      calloutDetail:
        "Initializing `result = nums[0]` is safe only after `nums.empty()` is guarded, but watch out for accumulator overflow or unvalidated constraints inTest Case #5.",
      suggestedFixHint: "Add an explicit size/bound check (`if (n == 1) return nums[0];`) near Line 14.",
    },
    slideTitle: "Slide 02: Abstract Data Types & Memory Layout",
    excerpt:
      "An Abstract Data Type (ADT) specifies mathematical invariants and preconditions independently of physical RAM layout (contiguous stack/heap arrays vs. linked heap nodes).",
  },
  "complexity-analysis": {
    ragSourceBadge: "Slide 04 • Asymptotic Bounds & Master Theorem",
    faultyLine: {
      line: 16,
      codeToken: "for (int i = 1; i < n; ++i) {",
      shortReason: "Verify loop invariant & off-by-one boundary on n == 1",
      calloutTitle: "Loop Bound Trace at Line 16",
      calloutDetail:
        "In asymptotic and boundary testing, verify what happens when `n == 1` (0 iterations) vs. nested loops that accidentally trigger O(N²) work.",
      suggestedFixHint: "Add `if (n <= 1) return nums[0];` before Line 16 to explicitly document the base case.",
    },
    slideTitle: "Slide 04: Big-O, Big-Theta & Amortized Analysis",
    excerpt:
      "Amortized analysis guarantees that even if a dynamic array resize costs O(N) occasionally, doubling capacity ensures an average of O(1) cost per push_back over any sequence of N operations.",
  },
  "arrays-strings": {
    ragSourceBadge: "Slide 05 • Two-Pointer & Sliding Window",
    faultyLine: {
      line: 16,
      codeToken: "for (int i = 1; i < n; ++i) {",
      shortReason: "Window right-pointer boundary check at index n - 1",
      calloutTitle: "Index Boundary Check at Line 16",
      calloutDetail:
        "Contiguous array traversals must guard against `i + 1` or `left > right` out-of-bounds access on single-element or all-negative inputs.",
      suggestedFixHint: "Add `if (n == 1) return nums[0];` before Line 16 and verify index bounds.",
    },
    slideTitle: "Slide 05: Contiguous Memory, Prefix Sums & Sliding Window",
    excerpt:
      "Because array elements occupy contiguous addresses (`base + i * sizeof(T)`), CPU cache lines prefetch adjacent elements in O(1) time, enabling Two-Pointer and Sliding Window reductions from O(N²) to O(N).",
  },
  "stack-queue": {
    ragSourceBadge: "Slide 08 • LIFO / FIFO & Monotonic Stack",
    faultyLine: {
      line: 14,
      codeToken: "int result = nums[0];",
      shortReason: "Underflow risk if popping/peeking before checking `!empty()`",
      calloutTitle: "Container Underflow Guard at Line 14",
      calloutDetail:
        "Stack and Queue operations (`top()`, `front()`, `pop()`) invoke undefined behavior if called on an empty container without a prior `!empty()` check.",
      suggestedFixHint: "Add an explicit boundary guard (`if (n <= 1) return nums[0];`) near Line 14.",
    },
    slideTitle: "Slide 08: Call Stack Frames, Circular Buffers & Monotonic Queues",
    excerpt:
      "A Monotonic Stack maintains elements in strictly increasing or decreasing order. Each element is pushed once and popped at most once, yielding O(N) amortized time for Next Greater Element queries.",
  },
  trees: {
    ragSourceBadge: "Slide 10 • Hierarchical DFS & BFS Traversals",
    faultyLine: {
      line: 14,
      codeToken: "int result = nums[0];",
      shortReason: "Missing null-root / single-node leaf base case check",
      calloutTitle: "Recursive Base Case at Line 14",
      calloutDetail:
        "Tree traversals (Preorder, Inorder, Postorder, Level-Order) must handle `root == nullptr` and leaf nodes (`!left && !right`) before combining child results.",
      suggestedFixHint: "Add `if (n == 1) return nums[0];` before the loop on Line 16.",
    },
    slideTitle: "Slide 10: Binary Tree Depth-First & Level-Order Traversals",
    excerpt:
      "DFS traversals (Pre/In/Postorder) use O(H) call-stack space where H is tree height, whereas BFS Level-Order traversal uses a FIFO queue requiring O(W) space where W is the maximum tree width.",
  },
  "sorting-algorithms": {
    ragSourceBadge: "Slide 16 • Divide-and-Conquer & Stability",
    faultyLine: {
      line: 16,
      codeToken: "for (int i = 1; i < n; ++i) {",
      shortReason: "Partition / merge boundary when subarray has size <= 1",
      calloutTitle: "Subarray Partition Guard at Line 16",
      calloutDetail:
        "Comparison sorts must immediately return when `left >= right` (subarray size <= 1) and avoid worst-case O(N²) pivot selection on already-sorted arrays.",
      suggestedFixHint: "Add `if (n <= 1) return nums[0];` before Line 16 to handle trivial subarrays.",
    },
    slideTitle: "Slide 16: MergeSort, QuickSort Pivot Selection & Ω(N log N) Lower Bound",
    excerpt:
      "Any comparison-based sorting algorithm requires at least log2(N!) = Ω(N log N) comparisons in the worst case. MergeSort guarantees O(N log N) stably using O(N) buffer space, while QuickSort achieves O(N log N) average-case in-place.",
  },
  "graph-algorithms": {
    ragSourceBadge: "Slide 19 • BFS, DFS & Dijkstra Shortest Paths",
    faultyLine: {
      line: 16,
      codeToken: "for (int i = 1; i < n; ++i) {",
      shortReason: "Unvisited disconnected component / cycle revisit check",
      calloutTitle: "Visited State Guard at Line 16",
      calloutDetail:
        "Graph traversals without marking vertices `visited` BEFORE pushing to the queue/stack will loop infinitely on cyclic graphs or miss disconnected components.",
      suggestedFixHint: "Add `if (n <= 1) return nums[0];` before Line 16 to guard single-vertex graphs.",
    },
    slideTitle: "Slide 19: Graph Representations, Topological Sort & Dijkstra",
    excerpt:
      "Using an Adjacency List represents sparse graphs in O(V + E) space. BFS finds shortest paths in unweighted graphs in O(V + E), whereas Dijkstra with a min-heap solves non-negative weighted graphs in O((V + E) log V).",
  },
}

/**
 * Resolves the complete Socratic AI Tutor profile for any of the 10 roadmap nodes.
 */
export function getSocraticTutorProfile(nodeId, nodeLabel = "Algorithm", complexity = "O(N)") {
  if (SOCRATIC_NODE_PROFILES[nodeId]) {
    return SOCRATIC_NODE_PROFILES[nodeId]
  }

  const extra = EXTRA_NODE_OVERRIDES[nodeId] || {
    ragSourceBadge: `Syllabus RAG • ${nodeLabel}`,
    faultyLine: {
      line: 14,
      codeToken: "int result = nums[0];",
      shortReason: `Boundary & invariant check on ${nodeLabel} input`,
      calloutTitle: `Boundary Check at Line 14`,
      calloutDetail: `Ensure single-element and boundary inputs for ${nodeLabel} are guarded before loop execution.`,
      suggestedFixHint: `Add if (n <= 1) return nums[0]; before the loop.`,
    },
    slideTitle: `Lecture Notes: ${nodeLabel} (${complexity})`,
    excerpt: `${nodeLabel} achieves ${complexity} operational complexity by maintaining strict structural invariants across updates and queries.`,
  }

  return {
    nodeId,
    topicLabel: nodeLabel,
    ragSourceBadge: extra.ragSourceBadge,
    faultyLine: extra.faultyLine,
    tiers: {
      theory: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: `Core Invariant of ${nodeLabel}`,
          content: `What structural property of ${nodeLabel} allows us to guarantee ${complexity} complexity instead of brute-force scanning?`,
        },
        {
          tier: 2,
          badge: "Invariant Trace",
          color: "#7DCFFF",
          title: `Memory Layout & State Transitions`,
          content: `Trace how ${nodeLabel} updates its internal state step by step. Notice how work per step is bounded by ${complexity}.`,
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: `Degenerate Inputs & Boundary Safety`,
          content: `What happens to ${nodeLabel} when the input is empty, has 1 element, or arrives in adversarial (already sorted/reverse) order?`,
        },
      ],
      quiz: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: `Eliminating Non-Optimal Bounds`,
          content: `Compare the options against the syllabus invariant for ${nodeLabel}. Does updating ${nodeLabel} require rebuilding everything from scratch?`,
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: `Verifying the ${complexity} Complexity Bound`,
          content: `Count how many elements or pointers are touched during a single ${nodeLabel} operation—it matches ${complexity}.`,
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: `Space vs. Time Trade-Off`,
          content: `Confirm that boundary cases (0 or 1 element) are handled in O(1) auxiliary check without exponential blowup.`,
        },
      ],
      coding: [
        {
          tier: 1,
          badge: "Conceptual Probe",
          color: "#BB9AF7",
          title: `Inspecting Line ${extra.faultyLine.line} (${extra.faultyLine.codeToken})`,
          content: `Look closely at Line ${extra.faultyLine.line} in your editor. What assumption does this line make about the size and values of \`nums\`?`,
        },
        {
          tier: 2,
          badge: "Pointer / Dry-Run Trace",
          color: "#7DCFFF",
          title: `Tracing Boundary Test Case #5`,
          content: `${extra.faultyLine.calloutDetail}`,
        },
        {
          tier: 3,
          badge: "Edge-Case Guard",
          color: "#FF9E64",
          title: `Defensive Fix Suggestion`,
          content: `${extra.faultyLine.suggestedFixHint}`,
        },
      ],
    },
    quickReplies: [
      {
        id: `${nodeId}-q1`,
        label: `Why is ${nodeLabel} ${complexity}?`,
        studentPrompt: `Why does ${nodeLabel} achieve ${complexity} complexity here?`,
        aiResponse: `Because ${nodeLabel} maintains its structural invariant on every step, avoiding redundant re-scanning of already processed elements and bounding total work to \`${complexity}\`.`,
        followUpQuestion: `What happens at Line ${extra.faultyLine.line} when the input has only 1 element?`,
      },
      {
        id: `${nodeId}-q2`,
        label: `Explain Line ${extra.faultyLine.line} warning`,
        studentPrompt: `Why is the pointer highlighting Line ${extra.faultyLine.line} in the code editor?`,
        aiResponse: `${extra.faultyLine.calloutDetail} ${extra.faultyLine.suggestedFixHint}`,
        followUpQuestion: `Try adding that boundary guard in the editor and clicking Run Code!`,
      },
      {
        id: `${nodeId}-q3`,
        label: `What edge cases should I test?`,
        studentPrompt: `Which boundary test cases are most important for ${nodeLabel}?`,
        aiResponse: `Always test: (1) empty input \`[]\`, (2) single element \`[x]\`, (3) duplicate values, and (4) worst-case sorted/reverse-sorted sequences.`,
        followUpQuestion: `Does your current code handle both empty and single-element inputs cleanly?`,
      },
    ],
    slideCitation: {
      slideTitle: extra.slideTitle,
      courseRef: `CS201 Data Structures • ${nodeLabel} Module`,
      excerpt: extra.excerpt,
      keyInvariant: `Target Complexity Bound: ${complexity} with strict boundary guards.`,
    },
    dryRunTable: {
      title: `Dry-Run Trace • ${nodeLabel} on Sample & Boundary Inputs`,
      columns: ["Step", "Line", "Input State", "Accumulator / Pointer", "Status"],
      rows: [
        ["1", "Ln 12", "nums = [4, 2, 9, 1, 7]", "n = 5", "Non-empty check passed"],
        ["2", `Ln ${extra.faultyLine.line}`, "i = 0", "result = 4", "Initial baseline set"],
        ["3", "Ln 16-18", "i = 1..4", "result = 9", "Optimal O(N) pass"],
        ["4 (Edge #5)", `Ln ${extra.faultyLine.line}`, "Boundary / 1-element", "Needs explicit guard", "⚠️ Verify boundary invariant"],
      ],
    },
  }
}

/**
 * Generates a contextual Socratic AI reply when a student types a custom message
 * in the chat box. Enforces the Spoiler-Free Shield if the student asks for full code.
 */
export function generateCustomSocraticReply({
  profile,
  activeMode,
  userMessage,
  selectedOption,
  codeRunOutcome,
}) {
  const normalized = (userMessage || "").toLowerCase().trim()

  // 1. Spoiler-Free Shield trigger if student asks for full answer / full solution code
  if (
    /give me the code|full code|write the code|solve it for me|just give answer|what is the answer|chỉ đáp án|viết code hộ|code hoàn chỉnh/.test(
      normalized
    )
  ) {
    return {
      isSpoilerBlocked: true,
      reply: `🛡️ **Spoiler-Free Guardrail Active:** As your Socratic Tutor, I won't hand over the full solution directly—that would take away your "aha!" moment! Instead, look at **Line ${profile.faultyLine.line}** (\`${profile.faultyLine.codeToken}\`): ${profile.faultyLine.suggestedFixHint}`,
      followUp: "What happens to your pointers/variables right before that line executes?",
    }
  }

  // 2. Line / bug / crash / error inquiry
  if (/line|bug|error|crash|sigsegv|fault|test|wrong|sai|lỗi|dòng/.test(normalized)) {
    return {
      isSpoilerBlocked: false,
      reply: `Let's inspect **Line ${profile.faultyLine.line}** (\`${profile.faultyLine.codeToken}\`). ${profile.faultyLine.calloutDetail}`,
      followUp: `${profile.faultyLine.suggestedFixHint} Once you add that check, what will the function return on the boundary test case?`,
    }
  }

  // 3. Complexity / Big-O inquiry
  if (/complexity|big-o|time|space|o\(|độ phức tạp/.test(normalized)) {
    return {
      isSpoilerBlocked: false,
      reply: `Grounded in **${profile.slideCitation.slideTitle}**: ${profile.slideCitation.excerpt}`,
      followUp: `Can you see why the auxiliary space stays minimal when we only update local pointers/variables?`,
    }
  }

  // 4. Quiz mode specific guidance
  if (activeMode === "quiz") {
    const tierHint = profile.tiers.quiz[1] || profile.tiers.quiz[0]
    return {
      isSpoilerBlocked: false,
      reply: `${tierHint.content} ${
        selectedOption
          ? `You currently selected **Option ${selectedOption}**—trace how the structural invariant behaves under that choice.`
          : "Try selecting one of the options (A–D) on the left so we can test your hypothesis!"
      }`,
      followUp: "Which invariant from the lecture slides rules out the incorrect options?",
    }
  }

  // 5. Default Socratic response grounded in the active node
  const modeTiers = profile.tiers[activeMode] || profile.tiers.coding
  const activeTier =
    codeRunOutcome === "warning" ? modeTiers[1] || modeTiers[0] : modeTiers[0]

  return {
    isSpoilerBlocked: false,
    reply: `Good thinking on **${profile.topicLabel}**! ${activeTier.content}`,
    followUp: `${profile.faultyLine.suggestedFixHint} How does that preserve the invariant?`,
  }
}
