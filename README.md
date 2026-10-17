# 🎓 AI CS Tutor - Automated DSA Learning Pathway

A project for the **Computational Thinking** course.
The AI CS Tutor system automates the learning pathway for Data Structures & Algorithms (DSA) by parsing course materials (Syllabus/Slides), generating dynamic skill trees, and evaluating student code using Socratic Hints.

## 🚀 Technologies
* **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui
* **Backend:** Python, FastAPI
* **AI/LLM Engine:** LangChain, Google Gemini API

## 📂 Project Structure
```text
AI_CS_Tutor/
├── web/                  # User Interface (Next.js)
│   ├── src/app/          # App Router (Dashboard, Pages...)
│   └── src/components/   # shadcn/ui building blocks
│
└── api/                  # AI Processing & Execution Sandbox (FastAPI)
    ├── main.py           # API Endpoints
    └── requirements.txt  # Python dependencies
```

## 🛠 Installation & Setup
Prerequisites: **Node.js (v20+)** and **Python (v3.11+)**.

1. Running the Backend (Port 8000)
Open a new terminal and run the following commands:
```bash
cd api

# Create and activate a virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
API will be running at: `http://localhost:8000`

2. Running the Frontend (Port 3000)
Open a separate terminal and run:
```bash
cd web

# Install npm packages
npm install

# Start the development server
npm run dev
```
The application will be running at: `http://localhost:3000/`

## 👥 Team Members
* Hoàng Đức Vinh (Team Leader)
* Võ Lê Hoàng (Member)
* Trần Ngọc Nghĩa (Member)
* Trần Quốc Dũng (Member)
* Phạm Bạch Đăng Khoa (Member)
* Phạm Trần Minh Tuấn (Member)
* Trương Hoàng Long (Member)