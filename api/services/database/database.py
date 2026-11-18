import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List
from modules.common.config import SUPABASE_URL, SUPABASE_KEY

# Attempt to initialize official supabase client
supabase_client = None
try:
    from supabase import create_client, Client
    if SUPABASE_URL and SUPABASE_KEY:
        supabase_client: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"[Supabase Init] Falling back to direct REST client: {e}")

class DatabaseService:
    @staticmethod
    def _rest_request(endpoint: str, method: str = "GET", body: Optional[Dict] = None, headers_extra: Optional[Dict] = None) -> Any:
        url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{endpoint.lstrip('/')}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        if headers_extra:
            headers.update(headers_extra)

        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_body = resp.read().decode("utf-8")
                return json.loads(res_body) if res_body else None
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode("utf-8")
            print(f"[Database Error {he.code}] {err_msg}")
            return None
        except Exception as ex:
            print(f"[Database Exception] {ex}")
            return None

    # 1. USER AUTHENTICATION QUERIES
    @classmethod
    def get_user_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        norm_email = email.strip().lower()
        if supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("email", norm_email).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase] Error get_user_by_email: {e}")

        # Fallback to REST
        results = cls._rest_request(f"users?email=eq.{norm_email}&limit=1")
        return results[0] if results and len(results) > 0 else None

    @classmethod
    def create_user(cls, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("users").insert(user_data).execute()
                return res.data[0] if res.data else user_data
            except Exception as e:
                print(f"[Supabase] Error create_user: {e}")

        results = cls._rest_request("users", method="POST", body=user_data)
        return results[0] if results and len(results) > 0 else user_data

    # 2. ROADMAP & TASKS QUERIES
    @classmethod
    def get_roadmap_nodes(cls) -> List[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("roadmap_nodes").select("*").order("sequence_order").execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase] Error get_roadmap_nodes: {e}")

        results = cls._rest_request("roadmap_nodes?order=sequence_order.asc")
        return results or []

    @classmethod
    def get_tasks_for_roadmap(cls) -> List[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("tasks").select("id,node_id,task_type,title,description,sequence_order").order("sequence_order").execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[Supabase] Error get_tasks_for_roadmap: {e}")

        results = cls._rest_request("tasks?select=id,node_id,task_type,title,description,sequence_order&order=sequence_order.asc")
        return results or []

    @classmethod
    def get_task_by_id(cls, task_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("tasks").select("*").eq("id", task_id).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase] Error get_task_by_id: {e}")

        results = cls._rest_request(f"tasks?id=eq.{task_id}&limit=1")
        return results[0] if results and len(results) > 0 else None

    # 3. USER PROGRESS & DRAFTS
    @classmethod
    def get_user_progress(cls, user_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("user_progress").select("*").eq("user_id", user_id).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase] Error get_user_progress: {e}")

        results = cls._rest_request(f"user_progress?user_id=eq.{user_id}&limit=1")
        return results[0] if results and len(results) > 0 else None

    @classmethod
    def upsert_user_progress(cls, progress_data: Dict[str, Any]) -> bool:
        if supabase_client:
            try:
                supabase_client.table("user_progress").upsert(progress_data, on_conflict="user_id").execute()
                return True
            except Exception as e:
                print(f"[Supabase] Error upsert_user_progress: {e}")

        res = cls._rest_request("user_progress", method="POST", body=progress_data, headers_extra={"Prefer": "resolution=merge-duplicates"})
        return res is not None

    # 4. SUBMISSIONS
    @classmethod
    def record_submission(cls, submission_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("code_submissions").insert(submission_data).execute()
                return res.data[0] if res.data else submission_data
            except Exception as e:
                print(f"[Supabase] Error record_submission: {e}")

        results = cls._rest_request("code_submissions", method="POST", body=submission_data)
        return results[0] if results and len(results) > 0 else submission_data
