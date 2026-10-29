# 🎓 AlgoPath Web — AI CS Tutor Frontend

Frontend application for **AlgoPath (AI CS Tutor)**, an AI-powered Data Structures & Algorithms (DSA) learning platform built with **Next.js (App Router)**, **React 19**, **Tailwind CSS v4**, **shadcn/ui**, and **Monaco Editor**.

---

## ✨ Key Screens & Routes

| Route | Source File | Description | Documentation |
| :--- | :--- | :--- | :--- |
| `/landing` | [`app/landing/page.tsx`](./app/landing/page.tsx) | Marketing landing page featuring Tokyo Night theme, interactive Skill Tree preview, and core feature highlights. | [`docs/landing.md`](./docs/landing.md) |
| `/auth` (`/login`) | [`app/auth/page.tsx`](./app/auth/page.tsx), [`components/login-form.tsx`](./components/login-form.tsx) | Unified Login & Sign Up screen with tab switching (`?tab=signup`), Google OAuth button, and **Continue as Guest** flow. | [`docs/auth.md`](./docs/auth.md) |
| `/roadmap` (`/skill-tree`) | [`app/roadmap/page.tsx`](./app/roadmap/page.tsx) | Interactive DSA Skill Tree & Syllabus PDF upload workspace (`Empty` → `Loading` → `Generated Tree`) with node Task Pop-up modal. | [`docs/roadmap.md`](./docs/roadmap.md) |
| `/workspace` (`/sandbox`) | [`app/workspace/page.tsx`](./app/workspace/page.tsx) | 3-stage learning workspace (**Core Theory**, **Quiz**, and **Monaco C++ Code Editor** + **AVL Tree Visualization** + **Socratic AI Tutor**). | [`docs/workspace.md`](./docs/workspace.md) |

---

## 📂 Directory Structure

```text
web/
├── app/
│   ├── auth/             # Unified Login & Sign Up route (/auth)
│   ├── landing/          # Landing screen route (/landing)
│   ├── login/            # Legacy login route compatibility (/login)
│   ├── roadmap/          # Interactive DSA Roadmap & PDF upload flow (/roadmap)
│   ├── sandbox/          # Alias route for Workspace (/sandbox)
│   ├── skill-tree/       # Alias route for Roadmap (/skill-tree)
│   ├── workspace/        # 3-stage Learning Workspace: Theory, Quiz & Code (/workspace)
│   ├── globals.css       # Tailwind CSS v4 & theme tokens
│   └── layout.tsx        # Root application layout
├── components/
│   ├── ui/               # Reusable shadcn/ui primitives
│   └── login-form.tsx    # Split-card Tokyo Night authentication component
├── docs/                 # Detailed screen & component documentation
│   ├── auth.md
│   ├── landing.md
│   ├── roadmap.md
│   └── workspace.md
└── lib/
    └── utils.ts          # Classname merging utilities
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
   - Landing Page: `http://localhost:3000/landing`
   - Login / Sign Up: `http://localhost:3000/auth`
   - DSA Roadmap Tree: `http://localhost:3000/roadmap`
   - Learning Workspace: `http://localhost:3000/workspace`
