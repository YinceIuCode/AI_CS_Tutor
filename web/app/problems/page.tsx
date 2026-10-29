"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/database/supabase-client"
import {
  Database,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Code,
  Sparkles,
} from "lucide-react"

interface TestCase {
  input: any
  output: any
}

interface Problem {
  problem_id: string
  title: string
  description: string
  difficulty?: string
  starter_code?: {
    python?: string
    [key: string]: any
  } | string
  test_cases?: TestCase[]
  is_public?: boolean
  tags?: string[]
}

interface SubmitResponse {
  status: "PASSED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "ERROR"
  message: string
  passed_count?: number
  total_count?: number
  details?: Array<{ testcase: number; status: string }>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ProblemsTestPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [dataSource, setDataSource] = useState<"api" | "supabase" | null>(null)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 1. Kiểm tra trạng thái Backend API & Tải bài tập
  useEffect(() => {
    fetchProblems()
  }, [])

  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/`, { cache: "no-store" })
      if (res.ok) {
        setApiOnline(true)
        return true
      }
      setApiOnline(false)
      return false
    } catch {
      setApiOnline(false)
      return false
    }
  }

  async function fetchProblems() {
    setLoading(true)
    setErrorMsg(null)
    const isApiOk = await checkBackendHealth()

    // Cách 1: Ưu tiên gọi qua Backend FastAPI
    if (isApiOk) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/problems`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setProblems(data)
            selectProblem(data[0])
            setDataSource("api")
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn("Lỗi gọi Backend API, thử kết nối Supabase trực tiếp:", err)
      }
    }

    // Cách 2: Dự phòng gọi trực tiếp Supabase từ Frontend
    try {
      const { data, error } = await supabase.from("problems").select("*")
      if (error) {
        throw error
      }
      if (data && data.length > 0) {
        setProblems(data as Problem[])
        selectProblem(data[0] as Problem)
        setDataSource("supabase")
      } else {
        setErrorMsg("Không tìm thấy bài tập nào trong bảng 'problems' trên Supabase!")
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối Supabase: ${err.message || String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  function selectProblem(p: Problem) {
    setSelectedProblem(p)
    setResult(null)

    // Lấy starter code
    let starter = ""
    if (typeof p.starter_code === "object" && p.starter_code?.python) {
      starter = p.starter_code.python
    } else if (typeof p.starter_code === "string") {
      starter = p.starter_code
    } else {
      starter = "def solve(a, b):\n    # Viết code của bạn ở đây\n    pass\n"
    }
    setCode(starter)
  }

  // 2. Nộp bài lên Backend FastAPI để chấm testcases
  async function handleSubmitCode() {
    if (!selectedProblem) return

    setSubmitting(true)
    setResult(null)
    setErrorMsg(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: selectedProblem.problem_id,
          code: code,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setResult({
          status: "ERROR",
          message: `Backend phản hồi lỗi HTTP ${res.status}: ${text}`,
        })
        return
      }

      const data: SubmitResponse = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({
        status: "ERROR",
        message: `Không kết nối được Backend tại ${API_BASE_URL}. Hãy đảm bảo bạn đã chạy: 'uvicorn main:app --reload' ở thư mục api! (Chi tiết: ${err.message})`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Tiện ích điền sẵn code mẫu đúng / sai để test nhanh
  function fillSampleCode(type: "correct" | "wrong") {
    if (type === "correct") {
      setCode(`def solve(a, b):\n    # Hàm tính tổng 2 số\n    return a + b\n`)
    } else {
      setCode(`def solve(a, b):\n    # Hàm trả về sai kết quả\n    return a - b\n`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Kiểm thử Database & Chấm bài (AI CS Tutor)
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Giao diện Frontend kiểm tra dữ liệu Supabase kết nối qua FastAPI backend.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Trạng thái Backend */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900">
              <span className="font-semibold text-slate-400">Backend:</span>
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${apiOnline === true
                    ? "bg-emerald-400 animate-pulse"
                    : apiOnline === false
                      ? "bg-rose-500"
                      : "bg-amber-400"
                  }`}
              />
              <span className={apiOnline ? "text-emerald-300" : "text-rose-400"}>
                {apiOnline === true ? "Online (8000)" : apiOnline === false ? "Offline" : "Đang kiểm tra..."}
              </span>
            </div>

            {/* Trạng thái nguồn dữ liệu */}
            {dataSource && (
              <div className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 text-slate-300">
                Nguồn DB:{" "}
                <span className="font-semibold text-emerald-400">
                  {dataSource === "api" ? "FastAPI → Supabase" : "Supabase Direct"}
                </span>
              </div>
            )}

            <button
              onClick={fetchProblems}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Tải lại dữ liệu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Có lỗi xảy ra:</div>
              <div className="text-sm">{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Trạng thái tải */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-emerald-400 mb-3" />
            <p>Đang tải bài tập từ Supabase...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Cột trái: Chi tiết bài tập từ Database */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">

                {/* Chọn bài tập nếu có nhiều bài */}
                {problems.length > 1 && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Chọn bài tập:
                    </label>
                    <select
                      value={selectedProblem?.problem_id || ""}
                      onChange={(e) => {
                        const found = problems.find((p) => p.problem_id === e.target.value)
                        if (found) selectProblem(found)
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {problems.map((p) => (
                        <option key={p.problem_id} value={p.problem_id}>
                          {p.title} ({p.difficulty || "Easy"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedProblem ? (
                  <>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <h2 className="text-xl font-bold text-white">
                        {selectedProblem.title}
                      </h2>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                        {selectedProblem.difficulty || "Easy"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono break-all">
                      ID: {selectedProblem.problem_id}
                    </div>

                    {/* Mô tả bài toán */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Đề bài:
                      </h3>
                      <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                        {selectedProblem.description}
                      </div>
                    </div>

                    {/* Danh sách Test Cases lưu trong Supabase */}
                    {selectedProblem.test_cases && selectedProblem.test_cases.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Test Cases trong Database ({selectedProblem.test_cases.length}):
                        </h3>
                        <div className="space-y-2">
                          {selectedProblem.test_cases.map((tc, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950 border border-slate-800/80 rounded-md p-2.5 text-xs font-mono flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">#{idx + 1}</span>
                                <span className="text-slate-400">Input:</span>
                                <span className="text-amber-300">
                                  {JSON.stringify(tc.input)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Expected:</span>
                                <span className="text-emerald-400 font-bold">
                                  {JSON.stringify(tc.output)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Không có bài tập nào được chọn.</p>
                )}
              </div>

              {/* Dữ liệu JSON gốc từ DB để kiểm tra cấu trúc */}
              <details className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
                <summary className="font-semibold text-slate-400 cursor-pointer hover:text-slate-200">
                  Xem toàn bộ dữ liệu Supabase JSON (Debug)
                </summary>
                <pre className="mt-3 p-3 bg-slate-950 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-300 border border-slate-800">
                  {JSON.stringify(selectedProblem, null, 2)}
                </pre>
              </details>
            </div>

            {/* Cột phải: Editor làm bài & Kiểm thử API nộp bài */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-indigo-400" />
                    <span className="font-semibold text-white text-sm">
                      Python Solution Editor
                    </span>
                  </div>

                  {/* Nút test nhanh */}
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => fillSampleCode("correct")}
                      className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Điền code đúng
                    </button>
                    <button
                      type="button"
                      onClick={() => fillSampleCode("wrong")}
                      className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition"
                    >
                      Điền code sai
                    </button>
                    <button
                      type="button"
                      onClick={() => selectedProblem && selectProblem(selectedProblem)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Quay lại starter code gốc"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Khu vực soạn thảo Code */}
                <div className="relative">
                  <textarea
                    rows={12}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Viết code Python ở đây..."
                    className="w-full bg-slate-950 text-slate-100 font-mono text-sm p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 leading-relaxed resize-y"
                    spellCheck={false}
                  />
                </div>

                {/* Nút nộp bài */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Endpoint: <code className="text-slate-400 font-mono">{API_BASE_URL}/api/submit</code>
                  </span>

                  <button
                    onClick={handleSubmitCode}
                    disabled={submitting || !selectedProblem}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Đang chấm bài...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Chạy & Nộp bài</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hộp kết quả chấm bài từ Backend */}
              {result && (
                <div
                  className={`border rounded-xl p-5 shadow-sm space-y-3 transition-all ${result.status === "PASSED"
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                      : result.status === "WRONG_ANSWER"
                        ? "bg-amber-950/40 border-amber-800 text-amber-200"
                        : "bg-rose-950/40 border-rose-800 text-rose-200"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-base">
                      {result.status === "PASSED" && (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>KẾT QUẢ: THÀNH CÔNG (PASSED)</span>
                        </>
                      )}
                      {result.status === "WRONG_ANSWER" && (
                        <>
                          <XCircle className="w-5 h-5 text-amber-400" />
                          <span>KẾT QUẢ: SAI TESTCASE (WRONG ANSWER)</span>
                        </>
                      )}
                      {(result.status === "ERROR" || result.status === "RUNTIME_ERROR") && (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                          <span>KẾT QUẢ: LỖI THỰC THI ({result.status})</span>
                        </>
                      )}
                    </div>

                    {result.passed_count !== undefined && result.total_count !== undefined && (
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/50">
                        {result.passed_count}/{result.total_count} test cases
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/60 text-sm font-mono whitespace-pre-wrap">
                    {result.message}
                  </div>
                </div>
              )}

              {/* Hướng dẫn chạy backend nếu chưa bật */}
              {!apiOnline && (
                <div className="bg-slate-900/80 border border-amber-900/60 rounded-xl p-4 text-xs text-amber-200/90 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-300">
                    <Terminal className="w-4 h-4" />
                    Lưu ý: Để test chức năng chấm bài, cần khởi động Backend FastAPI:
                  </div>
                  <div className="bg-slate-950 p-3 rounded font-mono text-slate-300 select-all border border-slate-800">
                    cd api<br />
                    uvicorn main:app --reload --port 8000
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
