import uuid
from typing import Optional, Dict, Any, List, cast
from modules.common.config import SUPABASE_URL, SUPABASE_KEY

# ====================================================================
# KHỞI TẠO SUPABASE CLIENT
# ====================================================================
supabase_client = None
try:
    from supabase import create_client, Client
    if SUPABASE_URL and SUPABASE_KEY:
        supabase_client: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"[Supabase Client Init Warning]: {e}")


class DatabaseService:
    """
    Data Access Layer (DAL) kết nối trực tiếp tới Cơ sở dữ liệu Supabase.
    Quản lý truy vấn và đồng bộ 6 bảng dữ liệu cốt lõi:
    1. public.users
    2. public.knowledge_documents
    3. public.roadmap_nodes
    4. public.tasks
    5. public.user_progress
    6. public.code_submissions
    """

    # ====================================================================
    # 1. BẢNG USERS (Xác thực & Thông tin tài khoản)
    # ====================================================================

    @classmethod
    def get_user_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        """
        Tìm kiếm và lấy thông tin tài khoản người dùng theo email (không phân biệt hoa/thường).
        Trả về Dict thông tin user {id, email, password_hash, full_name, role, account_type} hoặc None nếu không thấy.
        """
        if not supabase_client:
            return None

        norm_email = email.strip().lower()

        try:
            res = (
                supabase_client.table("users")
                .select("*")
                .eq("email", norm_email)
                .limit(1)
                .execute()
            )
            data = cast(List[Dict[str, Any]], res.data or [])
            if data:
                return data[0]
            return None
        except Exception as e:
            print(f"[DatabaseService.get_user_by_email Error]: {e}")
            return None

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Lấy thông tin người dùng dựa vào User UUID khóa chính.
        Trả về Dict user hoặc None nếu không tồn tại.
        """
        if not supabase_client:
            return None

        try:
            res = (
                supabase_client.table("users")
                .select("*")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
            data = cast(List[Dict[str, Any]], res.data or [])
            if data:
                return data[0]
            return None
        except Exception as e:
            print(f"[DatabaseService.get_user_by_id Error]: {e}")
            return None

    @classmethod
    def create_user(cls, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Chèn bản ghi tài khoản mới vào bảng users khi đăng ký tài khoản.
        Trả về Dict bản ghi vừa chèn thành công hoặc None nếu lỗi / trùng email.
        """
        if not supabase_client:
            return None

        try:
            res = supabase_client.table("users").insert(user_data).execute()
            data = cast(List[Dict[str, Any]], res.data or [])
            if data:
                return data[0]
            return None
        except Exception as e:
            print(f"[DatabaseService.create_user Error]: {e}")
            return None

    @classmethod
    def update_user_password(cls, user_id: str, new_password_hash: str) -> bool:
        """
        Cập nhật hash mật khẩu mới cho người dùng (hỗ trợ nâng cấp tự động lên Bcrypt).
        Trả về True nếu cập nhật thành công, False nếu thất bại.
        """
        if not supabase_client:
            return False

        try:
            res = (
                supabase_client.table("users")
                .update({"password_hash": new_password_hash})
                .eq("id", user_id)
                .execute()
            )
            data = cast(List[Dict[str, Any]], res.data or [])
            return len(data) > 0
        except Exception as e:
            print(f"[DatabaseService.update_user_password Error]: {e}")
            return False

    # ====================================================================
    # 2. BẢNG KNOWLEDGE_DOCUMENTS & ROADMAP_NODES (Giáo trình & Cây kỹ năng)
    # ====================================================================

    @classmethod
    def get_documents(cls) -> List[Dict[str, Any]]:
        """
        Lấy danh sách toàn bộ giáo trình/tài liệu PDF đã được lập chỉ mục trong hệ thống.
        Trả về List[Dict] danh sách tài liệu sắp xếp theo created_at.
        """
        if not supabase_client:
            return []

        try:
            res = (
                supabase_client.table("knowledge_documents")
                .select("*")
                .order("created_at")
                .execute()
            )
            return cast(List[Dict[str, Any]], res.data or [])
        except Exception as e:
            print(f"[DatabaseService.get_documents Error]: {e}")
            return []

    @classmethod
    def create_document(cls, doc_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Thêm tài liệu giáo trình mới sau khi hoàn thành OCR / RAG Indexing.
        Trả về Dict bản ghi tài liệu đã tạo.
        """
        if not supabase_client:
            return None

        try:
            res = supabase_client.table("knowledge_documents").insert(doc_data).execute()
            data = cast(List[Dict[str, Any]], res.data or [])
            if data:
                return data[0]
            return None
        except Exception as e:
            print(f"[DatabaseService.create_document Error]: {e}")
            return None

    @classmethod
    def get_roadmap_nodes(cls, document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lấy danh sách các Node kỹ năng trong cây Roadmap, hỗ trợ lọc theo tài liệu giáo trình cụ thể.
        Sắp xếp theo thứ tự sequence_order.
        """
        if not supabase_client:
            return []

        try:
            query = supabase_client.table("roadmap_nodes").select("*").order("sequence_order")
            if document_id:
                query = query.eq("document_id", document_id)
            res = query.execute()
            return cast(List[Dict[str, Any]], res.data or [])
        except Exception as e:
            print(f"[DatabaseService.get_roadmap_nodes Error]: {e}")
            return []

    # ====================================================================
    # 3. BẢNG TASKS (Bài tập lý thuyết, trắc nghiệm, code)
    # ====================================================================

    @classmethod
    def get_tasks_for_roadmap(cls) -> List[Dict[str, Any]]:
        """
        Lấy danh sách tóm tắt tất cả các task để map vào từng Node trên cây Roadmap.
        """
        if not supabase_client:
            return []

        try:
            res = (
                supabase_client.table("tasks")
                .select("id,node_id,task_type,title,description,sequence_order")
                .order("sequence_order")
                .execute()
            )
            return cast(List[Dict[str, Any]], res.data or [])
        except Exception as e:
            print(f"[DatabaseService.get_tasks_for_roadmap Error]: {e}")
            return []

    @classmethod
    def get_task_by_id(cls, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Lấy nội dung chi tiết bài học (content JSONB) theo task_id.
        """
        if not supabase_client:
            return None

        try:
            res = (
                supabase_client.table("tasks")
                .select("*")
                .eq("id", task_id)
                .limit(1)
                .execute()
            )
            data = cast(List[Dict[str, Any]], res.data or [])
            if data:
                return data[0]
            return None
        except Exception as e:
            print(f"[DatabaseService.get_task_by_id Error]: {e}")
            return None

    # ====================================================================
    # 4. BẢNG USER_PROGRESS (Tiến độ học tập & Bản nháp của sinh viên)
    # ====================================================================

    @classmethod
    def get_user_progress(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Lấy tiến độ học tập hiện tại của sinh viên theo user_id.
        """
        if not supabase_client:
            return None

        try:
            res = (
                supabase_client.table("user_progress")
                .select("*")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            data = cast(List[Dict[str, Any]], res.data or [])
            if data:
                return data[0]
            return None
        except Exception as e:
            print(f"[DatabaseService.get_user_progress Error]: {e}")
            return None

    @classmethod
    def upsert_user_progress(cls, progress_data: Dict[str, Any]) -> bool:
        """
        Cập nhật hoặc chèn mới tiến độ học tập của sinh viên (Upsert dựa trên user_id).
        Nếu user_id đã tồn tại thì cập nhật, nếu chưa thì thêm mới.
        """
        if not supabase_client:
            return False

        try:
            res = (
                supabase_client.table("user_progress")
                .upsert(progress_data, on_conflict="user_id")
                .execute()
            )
            data = cast(List[Dict[str, Any]], res.data or [])
            return len(data) > 0
        except Exception as e:
            print(f"[DatabaseService.upsert_user_progress Error]: {e}")
            return False

    # ====================================================================
    # 5. BẢNG CODE_SUBMISSIONS (Lịch sử nộp bài code C++)
    # ====================================================================

    @classmethod
    def record_submission(cls, submission_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Lưu lịch sử nộp bài và kết quả chấm điểm của sinh viên vào database.
        Tự động tạo UUID cho submission nếu chưa có.
        """
        if not supabase_client:
            return None

        try:
            payload = dict(submission_data)
            if "id" not in payload or not payload["id"]:
                payload["id"] = str(uuid.uuid4())

            res = supabase_client.table("code_submissions").insert(payload).execute()
            data = cast(List[Dict[str, Any]], res.data or [])
            if data:
                return data[0]
            return None
        except Exception as e:
            print(f"[DatabaseService.record_submission Error]: {e}")
            return None
