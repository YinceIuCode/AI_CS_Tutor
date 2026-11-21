from typing import Optional, Dict, Any, List
from modules.common.config import SUPABASE_URL, SUPABASE_KEY

# Khởi tạo Supabase Client chính thức (SDK)
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
        TODO:
        1. Nhiệm vụ: Tìm kiếm và lấy thông tin tài khoản người dùng theo địa chỉ email.
        2. Input / Output:
           - Input: email (str, ví dụ 'student@offbyone.demo').
           - Output: Dict thông tin user gồm {id, email, password_hash, full_name, role, account_type} hoặc None nếu không tìm thấy.
        3. Bảng Supabase liên quan:
           - Bảng: public.users
           - Cột: email (text, unique, so khớp không phân biệt hoa thường), password_hash (text), role (text: 'student' | 'tutor' | 'admin'), id (uuid).
        4. Các bước gợi ý:
           - Step 1: Chuẩn hóa email: norm_email = email.strip().lower()
           - Step 2: Dùng supabase_client.table("users").select("*").eq("email", norm_email).limit(1).execute()
           - Step 3: Kiểm tra res.data và trả về record đầu tiên hoặc None.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.get_user_by_email using Supabase Client")

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Lấy thông tin người dùng dựa vào User UUID khóa chính.
        2. Input / Output:
           - Input: user_id (str dạng UUID v4, ví dụ '00000001-0000-4000-8000-000000000001').
           - Output: Dict thông tin user hoặc None.
        3. Bảng Supabase liên quan:
           - Bảng: public.users
           - Cột: id (uuid, primary key), email, full_name, role, account_type.
        4. Các bước gợi ý:
           - Step 1: supabase_client.table("users").select("*").eq("id", user_id).limit(1).execute()
           - Step 2: Trả về res.data[0] nếu tồn tại.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.get_user_by_id using Supabase Client")

    @classmethod
    def create_user(cls, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Chèn bản ghi tài khoản mới vào bảng users khi đăng ký tài khoản.
        2. Input / Output:
           - Input: user_data dict gồm {id: uuid_str, email: str, full_name: str, password_hash: str, role: str, account_type: str}.
           - Output: Dict bản ghi vừa chèn thành công hoặc None nếu trùng email.
        3. Bảng Supabase liên quan:
           - Bảng: public.users
           - Ràng buộc: email unique constraint.
        4. Các bước gợi ý:
           - Step 1: Chuẩn bị payload hợp lệ đúng kiểu dữ liệu cột trong Supabase.
           - Step 2: Gọi supabase_client.table("users").insert(user_data).execute()
           - Step 3: Bắt lỗi IntegrityError / DuplicateKey và trả về bản ghi hoặc None.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.create_user using Supabase Client")

    @classmethod
    def update_user_password(cls, user_id: str, new_password_hash: str) -> bool:
        """
        TODO:
        1. Nhiệm vụ: Cập nhật hash mật khẩu mới cho người dùng (hỗ trợ nâng cấp tự động lên Bcrypt).
        2. Input / Output:
           - Input: user_id (str uuid), new_password_hash (str chuẩn bcrypt $2b$12$...).
           - Output: bool (True nếu cập nhật thành công, False nếu thất bại).
        3. Bảng Supabase liên quan:
           - Bảng: public.users, cột: password_hash.
        4. Các bước gợi ý:
           - Step 1: Gọi supabase_client.table("users").update({"password_hash": new_password_hash}).eq("id", user_id).execute()
           - Step 2: Trả về bool(res.data).
        """
        raise NotImplementedError("TODO: Implement DatabaseService.update_user_password using Supabase Client")

    # ====================================================================
    # 2. BẢNG KNOWLEDGE_DOCUMENTS & ROADMAP_NODES (Giáo trình & Cây kỹ năng)
    # ====================================================================

    @classmethod
    def get_documents(cls) -> List[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Lấy danh sách toàn bộ giáo trình/tài liệu PDF đã được lập chỉ mục trong hệ thống.
        2. Input / Output:
           - Input: Không.
           - Output: List[Dict] danh sách tài liệu gồm {id, course_code, title, file_name, file_size, linked_nodes_count, content}.
        3. Bảng Supabase liên quan:
           - Bảng: public.knowledge_documents
           - Cột: id (uuid), title (text), file_name (text), content (jsonb chứa totalPages, status).
        4. Các bước gợi ý:
           - Step 1: Gọi supabase_client.table("knowledge_documents").select("*").order("created_at").execute()
           - Step 2: Trả về res.data hoặc danh sách rỗng [].
        """
        raise NotImplementedError("TODO: Implement DatabaseService.get_documents using Supabase Client")

    @classmethod
    def create_document(cls, doc_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Thêm tài liệu giáo trình mới sau khi hoàn thành OCR / RAG Indexing.
        2. Input / Output:
           - Input: doc_data dict gồm {id, course_code, title, file_name, file_size, user_id, linked_nodes_count, content}.
           - Output: Dict bản ghi tài liệu đã tạo.
        3. Bảng Supabase liên quan:
           - Bảng: public.knowledge_documents
           - Khóa ngoại: user_id (references users.id).
        4. Các bước gợi ý:
           - Step 1: supabase_client.table("knowledge_documents").insert(doc_data).execute()
           - Step 2: Trả về bản ghi vừa tạo.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.create_document using Supabase Client")

    @classmethod
    def get_roadmap_nodes(cls, document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Lấy danh sách các Node kỹ năng trong cây Roadmap, hỗ trợ lọc theo tài liệu giáo trình cụ thể.
        2. Input / Output:
           - Input: document_id (Optional[str], ví dụ '00000005-0000-4000-8000-000000000001' cho DSA, '...0002' cho OOP).
           - Output: List[Dict] các Node gồm {id, document_id, label, short_code, target_complexity, prerequisites, socratic_profile, sequence_order}.
        3. Bảng Supabase liên quan:
           - Bảng: public.roadmap_nodes
           - Cột: id (text/uuid), document_id (uuid, FK), label (text), short_code (text), target_complexity (text, CHÚ Ý không phải 'complexity'), prerequisites (jsonb/array), socratic_profile (jsonb).
        4. Các bước gợi ý:
           - Step 1: query = supabase_client.table("roadmap_nodes").select("*").order("sequence_order")
           - Step 2: Nếu có document_id, thêm .eq("document_id", document_id)
           - Step 3: Thực thi query và trả về res.data.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.get_roadmap_nodes using Supabase Client")

    # ====================================================================
    # 3. BẢNG TASKS (Bài tập lý thuyết, trắc nghiệm, code)
    # ====================================================================

    @classmethod
    def get_tasks_for_roadmap(cls) -> List[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Lấy danh sách tóm tắt tất cả các task để map vào từng Node trên cây Roadmap.
        2. Input / Output:
           - Input: Không.
           - Output: List[Dict] gồm {id, node_id, task_type, title, description, sequence_order}.
        3. Bảng Supabase liên quan:
           - Bảng: public.tasks
           - Cột: task_type ('theory' | 'quiz' | 'coding'), node_id (FK references roadmap_nodes.id).
        4. Các bước gợi ý:
           - Step 1: supabase_client.table("tasks").select("id,node_id,task_type,title,description,sequence_order").order("sequence_order").execute()
           - Step 2: Trả về res.data.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.get_tasks_for_roadmap using Supabase Client")

    @classmethod
    def get_task_by_id(cls, task_id: str) -> Optional[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Lấy nội dung chi tiết bài học (content JSONB) theo task_id.
        2. Input / Output:
           - Input: task_id (str, ví dụ 'avl-tree-task-1', 'avl-tree-task-2', 'avl-tree-task-3').
           - Output: Dict chi tiết task gồm content {headerTitle, summaryLead, cards, options, testCases, initialCode, ...}.
        3. Bảng Supabase liên quan:
           - Bảng: public.tasks
           - Cột: id, node_id, task_type, title, description, content (jsonb).
        4. Các bước gợi ý:
           - Step 1: supabase_client.table("tasks").select("*").eq("id", task_id).limit(1).execute()
           - Step 2: Trả về res.data[0] nếu có hoặc None.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.get_task_by_id using Supabase Client")

    # ====================================================================
    # 4. BẢNG USER_PROGRESS (Tiến độ học tập & Bản nháp của sinh viên)
    # ====================================================================

    @classmethod
    def get_user_progress(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Lấy tiến độ học tập hiện tại của sinh viên theo user_id.
        2. Input / Output:
           - Input: user_id (str UUID của sinh viên).
           - Output: Dict tiến độ {user_id, completed_tasks, quiz_answers, code_drafts, hints_remaining, updated_at} hoặc None.
        3. Bảng Supabase liên quan:
           - Bảng: public.user_progress
           - Cột: user_id (uuid, unique), completed_tasks (jsonb), quiz_answers (jsonb), code_drafts (jsonb), hints_remaining (jsonb hoặc int).
        4. Các bước gợi ý:
           - Step 1: supabase_client.table("user_progress").select("*").eq("user_id", user_id).limit(1).execute()
           - Step 2: Trả về res.data[0] hoặc None.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.get_user_progress using Supabase Client")

    @classmethod
    def upsert_user_progress(cls, progress_data: Dict[str, Any]) -> bool:
        """
        TODO:
        1. Nhiệm vụ: Cập nhật hoặc chèn mới tiến độ học tập của sinh viên (Upsert trên user_id).
        2. Input / Output:
           - Input: progress_data dict chứa {user_id, completed_tasks, quiz_answers, code_drafts, hints_remaining}.
           - Output: bool (True nếu lưu thành công, False nếu lỗi).
        3. Bảng Supabase liên quan:
           - Bảng: public.user_progress
           - Ràng buộc: On conflict "user_id" do update.
        4. Các bước gợi ý:
           - Step 1: supabase_client.table("user_progress").upsert(progress_data, on_conflict="user_id").execute()
           - Step 2: Trả về True nếu không có exception.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.upsert_user_progress using Supabase Client")

    # ====================================================================
    # 5. BẢNG CODE_SUBMISSIONS (Lịch sử nộp bài code C++)
    # ====================================================================

    @classmethod
    def record_submission(cls, submission_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        TODO:
        1. Nhiệm vụ: Lưu lịch sử nộp bài và kết quả chấm điểm của sinh viên vào database.
        2. Input / Output:
           - Input: submission_data dict {id: uuid, user_id, task_id, code, language, status, passed_count, total_count, execution_metrics, test_results}.
           - Output: Dict bản ghi submission vừa lưu.
        3. Bảng Supabase liên quan:
           - Bảng: public.code_submissions
           - Cột: status ('success' | 'failed' | 'compilation_error' | 'runtime_error'), execution_metrics (jsonb), test_results (jsonb).
        4. Các bước gợi ý:
           - Step 1: Tạo id = str(uuid.uuid4()) nếu chưa có.
           - Step 2: supabase_client.table("code_submissions").insert(submission_data).execute()
           - Step 3: Trả về bản ghi submission đã lưu.
        """
        raise NotImplementedError("TODO: Implement DatabaseService.record_submission using Supabase Client")
