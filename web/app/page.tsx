import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="flex max-w-lg min-w-0 flex-col gap-6 text-sm leading-relaxed border border-slate-800 bg-slate-900 p-8 rounded-2xl shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
            AI CS Tutor Ready
          </span>
          <h1 className="text-2xl font-bold text-white mt-3">Chào mừng bạn đến với AI CS Tutor</h1>
          <p className="text-slate-400 mt-2">
            Backend FastAPI và Supabase đã được kết nối. Bạn có thể truy cập trang kiểm thử để xem bài tập từ Database và test tính năng nộp bài / chấm test cases tự động.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/problems" className="w-full sm:w-auto">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer">
              Mở trang Test Database & Bài tập &rarr;
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer">
              Đăng nhập
            </Button>
          </Link>
        </div>

        <div className="font-mono text-xs text-slate-500 border-t border-slate-800 pt-4">
          Route test: <code className="text-emerald-400">/problems</code>
        </div>
      </div>
    </div>
  )
}
