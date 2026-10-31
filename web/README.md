# 🎓 AlgoPath Web — AI CS Tutor Frontend

Frontend application for **AlgoPath (AI CS Tutor)**, an AI-powered Data Structures & Algorithms (DSA) learning platform built with **Next.js (App Router)**, **React 19**, **Tailwind CSS v4**, **shadcn/ui**, and **Monaco Editor**.

---

## ✨ Key Screens & Routes

| Route | Source File | Description | Documentation |
| :--- | :--- | :--- | :--- |
| `/` (`/landing`) | [`app/page.tsx`](./app/page.tsx) | Root Landing screen featuring Tokyo Night theme, interactive Skill Tree preview, and core feature highlights. | [`docs/landing.md`](./docs/landing.md) |
| `/auth` (`/login`) | [`app/auth/page.tsx`](./app/auth/page.tsx), [`components/login-form.tsx`](./components/login-form.tsx) | Unified Login & Sign Up centered split-card screen with integrated **Back to Home**, tab switching (`?tab=signup`), Google OAuth, and **Continue as Guest**. | [`docs/auth.md`](./docs/auth.md) |
| `/roadmap` (`/skill-tree`) | [`app/roadmap/page.tsx`](./app/roadmap/page.tsx) | Interactive DSA Skill Tree & Syllabus PDF upload workspace (`Empty` → `Loading` → `Generated Tree`) with node Task Pop-up modal. | [`docs/roadmap.md`](./docs/roadmap.md) |
| `/workspace/:nodeId/:taskId` (`/workspace`, `/sandbox`) | [`app/workspace/[nodeId]/[taskId]/page.tsx`](./app/workspace/[nodeId]/[taskId]/page.tsx), [`app/workspace/page.tsx`](./app/workspace/page.tsx) | Shared 3-stage learning workspace dynamically bound to `nodeId` & `taskId` (**Core Theory**, **Quiz**, and **Monaco C++ Code Editor** + **Visualization** + **Socratic AI Tutor**). | [`docs/workspace.md`](./docs/workspace.md) |

---

## 📂 Directory Structure

```text
web/
├── app/
│   ├── auth/             # Unified Login & Sign Up route (/auth)
│   ├── landing/          # Alias route for Root Landing screen (/landing)
│   ├── login/            # Legacy login route compatibility (/login)
│   ├── roadmap/          # Interactive DSA Roadmap & PDF upload flow (/roadmap)
│   ├── sandbox/          # Alias route for Workspace (/sandbox)
│   ├── skill-tree/       # Alias route for Roadmap (/skill-tree)
│   ├── workspace/        # 3-stage Learning Workspace: Theory, Quiz & Code (/workspace)
│   ├── globals.css       # Tailwind CSS v4 & theme tokens
│   ├── layout.tsx        # Root application layout
│   └── page.tsx          # Root Landing Screen (/)
├── components/
│   ├── roadmap/          # React Flow custom node & interactive canvas
│   │   ├── CustomRoadmapNode.jsx
│   │   └── RoadmapCanvas.jsx
│   ├── ui/               # Reusable shadcn/ui primitives
│   └── login-form.tsx    # Centered split-card Tokyo Night authentication component
├── docs/                 # Detailed screen & component documentation
│   ├── auth.md
│   ├── landing.md
│   ├── roadmap.md
│   └── workspace.md
├── hooks/
│   └── useRoadmap.js     # TanStack Query hook for Roadmap data
├── lib/
│   └── utils.ts          # Classname merging utilities
├── mocks/
│   ├── roadmapData.js    # Mock DSA Skill Tree nodes, tasks & RAG metadata
│   └── workspaceTasks.js # Detailed Theory, Quiz & Coding content linked by nodeId & taskId
├── services/
│   └── roadmapService.js # Roadmap API / Mock data service (Fetch API ready)
└── utils/
    └── graphLayout.js    # Automatic DAG layout calculator using Dagre
```

---

## 🚀 Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

3. **Open in browser:**
   - Landing Page (Root): `http://localhost:3000/`
   - Login / Sign Up: `http://localhost:3000/auth`
   - DSA Roadmap Tree: `http://localhost:3000/roadmap`
   - Learning Workspace: `http://localhost:3000/workspace`
