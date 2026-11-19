import copy
from typing import Dict, Any, Optional
from fastapi import APIRouter, status
from modules.common.request import QuizEvaluateRequest
from modules.common.response import success_response, error_response
from services.database.database import DatabaseService

router = APIRouter(prefix="/api", tags=["Roadmap & Lectures"])

@router.get("/roadmap")
def get_roadmap(document_id: Optional[str] = None):
    raw_nodes = DatabaseService.get_roadmap_nodes()
    tasks = DatabaseService.get_tasks_for_roadmap()

    # Filter nodes strictly according to document_id
    if document_id:
        doc_str = str(document_id).lower()
        if "oop" in doc_str or "0002" in doc_str:
            nodes = [n for n in raw_nodes if n.get("document_id") == "00000005-0000-4000-8000-000000000002" or str(n.get("id", "")).startswith("oop-")]
        else:
            nodes = [n for n in raw_nodes if not str(n.get("id", "")).startswith("oop-")]
    else:
        # Default to CS101 DSA
        nodes = [n for n in raw_nodes if not str(n.get("id", "")).startswith("oop-")]

    # Map tasks to nodes
    tasks_by_node = {}
    for t in tasks:
        node_id = t.get("node_id")
        if node_id not in tasks_by_node:
            tasks_by_node[node_id] = []
        tasks_by_node[node_id].append({
            "id": t["id"],
            "title": t["title"],
            "description": t.get("description", ""),
            "type": t.get("task_type", "theory"),
            "status": "locked"
        })

    formatted_nodes = []
    for n in nodes:
        node_tasks = tasks_by_node.get(n["id"], [])
        formatted_nodes.append({
            "id": n["id"],
            "shortCode": n.get("short_code", ""),
            "label": n.get("label", ""),
            "description": n.get("description", ""),
            "complexity": n.get("target_complexity") or n.get("complexity", "O(N)"),
            "prerequisites": n.get("prerequisites", []),
            "totalTasks": len(node_tasks) or 3,
            "completedTasks": 0,
            "progress": 0,
            "status": "locked",
            "tasks": node_tasks,
            "socraticProfile": n.get("socratic_profile", {})
        })

    payload = {
        "courseTitle": "Data Structures & Algorithms",
        "nodes": formatted_nodes,
        "documentMeta": {
            "name": "CS101_DSA_Syllabus_HCMUS.pdf",
            "size": "2.4 MB",
            "status": "indexed"
        }
    }
    return success_response(payload)

@router.get("/tasks/{task_id}")
def get_task_detail(task_id: str):
    task = DatabaseService.get_task_by_id(task_id)
    if not task:
        return error_response(f"Task '{task_id}' không tồn tại.", status_code=status.HTTP_404_NOT_FOUND)

    content = copy.deepcopy(task.get("content", {}))

    # CRUCIAL SECURITY FILTERING:
    # 1. If Quiz: Strip 'isCorrect' so client cannot inspect element to cheat!
    if task.get("task_type") == "quiz":
        if "options" in content and isinstance(content["options"], list):
            for opt in content["options"]:
                if isinstance(opt, dict):
                    opt.pop("isCorrect", None)
        content.pop("explanation", None)  # Hide answer explanation until submitted

    # 2. If Coding: Hide hidden test cases from public endpoint
    elif task.get("task_type") == "coding":
        if "testCases" in content and isinstance(content["testCases"], list):
            content["testCases"] = [
                tc for tc in content["testCases"]
                if tc.get("isPublic", True)
            ]

    result = {
        "id": task["id"],
        "nodeId": task.get("node_id"),
        "title": task.get("title"),
        "type": task.get("task_type"),
        **content
    }
    return success_response(result)

@router.post("/quiz/evaluate")
def evaluate_quiz(request: QuizEvaluateRequest):
    task = DatabaseService.get_task_by_id(request.taskId)
    if not task:
        return error_response("Task không tồn tại.", status_code=status.HTTP_404_NOT_FOUND)

    content = task.get("content", {})
    options = content.get("options", [])
    correct_opt = None
    explanation = content.get("explanation", "Đáp án chính xác!")

    for opt in options:
        if isinstance(opt, dict) and opt.get("isCorrect") is True:
            correct_opt = opt.get("id")
            break

    is_correct = (request.selectedOption == correct_opt)

    result = {
        "isCorrect": is_correct,
        "selectedOption": request.selectedOption,
        "correctOption": correct_opt if is_correct else None,
        "explanation": explanation if is_correct else "Chưa chính xác. Hãy xem xét lại định nghĩa và cấu trúc dữ liệu."
    }
    return success_response(result)

@router.get("/progress/{user_id}")
def get_user_progress(user_id: str):
    progress = DatabaseService.get_user_progress(user_id)
    if not progress:
        return success_response({
            "userId": user_id,
            "completedTasks": {},
            "quizAnswers": {},
            "codeDrafts": {},
            "hintsRemaining": {}
        })
    return success_response({
        "userId": progress.get("user_id"),
        "completedTasks": progress.get("completed_tasks") or {},
        "quizAnswers": progress.get("quiz_answers") or {},
        "codeDrafts": progress.get("code_drafts") or {},
        "hintsRemaining": progress.get("hints_remaining") or {},
        "updatedAt": progress.get("updated_at")
    })

@router.put("/progress/{user_id}")
def update_user_progress(user_id: str, payload: Dict[str, Any]):
    progress_data = {
        "user_id": user_id,
        "completed_tasks": payload.get("completedTasks", {}),
        "quiz_answers": payload.get("quizAnswers", {}),
        "code_drafts": payload.get("codeDrafts", {}),
        "hints_remaining": payload.get("hintsRemaining", {}),
    }
    DatabaseService.upsert_user_progress(progress_data)
    return success_response({"status": "synced", "userId": user_id})
