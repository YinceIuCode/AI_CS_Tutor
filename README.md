# AI CS Tutor - Automated DSA Learning Pathway

AI CS Tutor is an educational project developed as part of the Computational Thinking course. The system aims to support Data Structures and Algorithms (DSA) learning by automating learning pathway generation, analyzing course materials, and evaluating student code.

The system uses AI to process course syllabi and lecture slides, generate dynamic skill trees, and provide Socratic hints to help students understand problems and improve their problem-solving skills.

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Execution](#execution)
4. [Project Structure](#project-structure)
5. [Troubleshoot](#troubleshoot)
6. [Contributing](#contributing)
7. [License](#license)

## Introduction

This project aims to develop an AI-powered learning assistant for Data Structures and Algorithms as part of the Computational Thinking course.

The system focuses on creating an automated learning pathway based on course materials, including syllabi and lecture slides. By analyzing these materials, the application generates a dynamic skill tree that represents the knowledge and prerequisites required to master different DSA topics.

The system also integrates AI-assisted code evaluation to analyze student submissions and provide Socratic hints rather than directly revealing solutions. This approach encourages independent thinking and helps students develop problem-solving skills.

The project is developed using the following technologies:

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui.
- **Backend:** Python, FastAPI.
- **AI Integration:** LangChain, Google Gemini API.
- **Database:** Supabase.

## Installation

### Prerequisites

Make sure the following tools are installed on your system:

- Node.js (v20 or later).
- Python (v3.12 or later).
- Git.

### Manual

Clone the repository:

```bash
git clone https://github.com/YinceIuCode/ai_cs_tutor.git
cd ai_cs_tutor
```

#### Backend

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
```

#### Frontend

```bash
cd web
npm install
cp .env.example .env
```

## Execution

### Backend

```bash
cd api
python -m modules.api
```

### Frontend

```bash
cd web
npm run dev
```


## Project Structure

The project is organized into separate frontend and backend applications.

```text
AI_CS_Tutor/
├── .github/                # GitHub configurations
├── api/                    # Backend application
│   ├── modules/             # Application modules
│   ├── services/            # External services
│   ├── scripts/             # Development scripts
│   ├── tests/               # Backend tests
│   ├── .env.example         # Environment configuration template
│   └── pyproject.toml       # Python project configuration
│
├── docs/                    # Project documentation
├── web/                     # Frontend application
│   └── src/
│       ├── app/             # Next.js App Router
│       └── components/      # React components
│
├── .gitignore
├── LICENSE
└── README.md
```

## Troubleshoot

### Backend Issues

If the backend fails to start, make sure that:

- The Python virtual environment is activated.
- All dependencies have been installed using `pip install -e .`.
- The `.env` file exists and contains the required environment variables.
- Port `8000` is not being used by another process.

### Frontend Issues

If the frontend fails to start, make sure that:

- Node.js and npm are properly installed.
- Dependencies have been installed using `npm install`.
- Port `3000` is available.
- The frontend configuration points to the correct backend API address.

### Database Configuration

The project uses Supabase as its database service.

Make sure that the Supabase project is configured correctly and that the required credentials are provided in the backend environment configuration.

Do not commit `.env` files or expose API keys and database credentials in the repository.

## Contributing

This project is developed as a group assignment for the Computational Thinking course.

### Team Members

| Name | Role |
|---|---|
| Hoàng Đức Vinh | Team Leader |
| Võ Lê Hoàng | Member |
| Trần Ngọc Nghĩa | Member |
| Trần Quốc Dũng | Member |
| Phạm Bạch Đăng Khoa | Member |
| Phạm Trần Minh Tuấn | Member |
| Trương Hoàng Long | Member |

For major changes, please discuss the proposed modifications with the team before submitting a pull request. Make sure that changes are tested appropriately and that existing functionality is not broken.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
