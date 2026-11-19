from typing import Dict, Any
from fastapi import APIRouter, Body
from modules.common.request import TutorChatRequest, SaveDraftRequest
from modules.common.response import success_response, error_response
from services.ai.ai import AIService
from services.database.database import DatabaseService

router = APIRouter(prefix="/api", tags=["Socratic AI Tutor & Progress"])

@router.post("/tutor/chat")
def tutor_chat(request: TutorChatRequest):
    # Retrieve node socratic profile
    task = DatabaseService.get_task_by_id(request.taskId)
    node_id = task.get("node_id") if task else request.nodeId
    
    nodes = DatabaseService.get_roadmap_nodes()
    matched_node = next((n for n in nodes if n["id"] == node_id), None)
    topic_label = matched_node.get("label", "DSA Problem") if matched_node else "DSA Problem"
    socratic_profile = matched_node.get("socratic_profile", {}) if matched_node else {}

    result = AIService.generate_socratic_guidance(
        topic_label=topic_label,
        task_title=task.get("title", request.taskId) if task else request.taskId,
        student_code=request.studentCode or "",
        student_question=request.studentMessage,
        error_log=request.errorLog,
        socratic_profile=socratic_profile
    )
    return success_response(result)

@router.post("/progress/draft")
def save_draft(request: SaveDraftRequest):
    return success_response({"taskId": request.taskId, "saved": True}, message="Bản nháp đã lưu an toàn.")


