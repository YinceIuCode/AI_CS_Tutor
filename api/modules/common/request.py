from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Authentication Requests
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    fullName: str
    email: str
    password: str
    confirmPassword: Optional[str] = None

# Coding & Sandbox Requests
class CodeRunRequest(BaseModel):
    taskId: str
    code: str
    language: str = "C++"

class CodeSubmitRequest(BaseModel):
    taskId: str
    code: str
    language: str = "C++"

# Quiz Requests
class QuizEvaluateRequest(BaseModel):
    taskId: str
    selectedOption: str

# Socratic Tutor Requests
class TutorChatRequest(BaseModel):
    nodeId: Optional[str] = "avl-tree"
    taskId: str
    studentCode: Optional[str] = ""
    studentMessage: str
    errorLog: Optional[str] = None

# Progress & Auto-save Requests
class SaveDraftRequest(BaseModel):
    taskId: str
    code: str
    language: str = "C++"
