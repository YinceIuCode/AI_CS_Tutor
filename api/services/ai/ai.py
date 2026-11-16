import json
import urllib.request
from typing import Optional, Dict, Any
from modules.common.config import GEMINI_API_KEY

class AIService:
    @staticmethod
    def generate_socratic_guidance(
        topic_label: str,
        task_title: str,
        student_code: str,
        student_question: str,
        error_log: Optional[str] = None,
        socratic_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate Socratic guidance for CS/DSA problems:
        Never give the direct answer or complete code solution.
        Prompt the student with guided questions pointing out memory models, invariants, or edge cases.
        """
        # If Gemini API key is configured, call Gemini Live / REST
        if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
            try:
                system_prompt = (
                    "You are the Socratic AI Tutor for OffByOne, specializing in Data Structures & Algorithms. "
                    "PEDAGOGICAL RULE: Never provide the direct solution code. Instead, analyze the student's code "
                    "and ask 1-2 thought-provoking guiding questions that lead them to discover the fix themselves. "
                    "Keep your response concise, empathetic, and academically rigorous."
                )
                user_content = (
                    f"Topic: {topic_label}\n"
                    f"Task: {task_title}\n"
                    f"Student Code:\n{student_code}\n\n"
                    f"Student Question: {student_question}\n"
                    f"Error Log: {error_log or 'None'}\n"
                )
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [
                        {"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_content}"}]}
                    ]
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"reply": text, "source": "gemini"}
            except Exception as e:
                print(f"[Gemini AI Service Error] {e}")

        # Pedagogical Fallback: Rule-based Socratic hints
        invariants = socratic_profile.get("keyInvariants", []) if socratic_profile else []
        inv_hint = invariants[0] if invariants else "Check the pointer balance and boundary condition."
        
        reply = (
            f"Hãy quan sát kỹ cấu trúc dữ liệu của bạn trước khi thực hiện thao tác:\n"
            f"💡 Nhắc nhở bất biến: {inv_hint}\n"
            f"❓ Câu hỏi gợi mở: Điều gì sẽ xảy ra nếu con trỏ hiện tại trỏ tới nullptr hoặc cây con bị rỗng?"
        )
        return {"reply": reply, "source": "socratic_engine"}
