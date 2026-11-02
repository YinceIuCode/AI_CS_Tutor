"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  Code2,
  Eye,
  EyeOff,
  GitFork,
  Home,
  Info,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { BRAND } from "@/config/brand"
import { BrandLogo } from "@/components/brand-logo"

/**
 * Cấu hình đường dẫn điều hướng cho trang Đăng nhập / Đăng ký (Auth).
 */
export const AUTH_LINKS = {
  backToHome: "/",
  forgotPassword: "/auth/forgot-password",
  afterLoginRedirect: "/roadmap",
  afterSignupRedirect: "/roadmap",
  continueAsGuest: "/roadmap",
} as const

export type AuthTab = "login" | "signup"

interface LoginFormProps extends React.ComponentProps<"div"> {
  defaultTab?: AuthTab
}

export function LoginForm({
  className,
  defaultTab = "login",
  ...props
}: LoginFormProps) {
  const router = useRouter()
  const {
    isAuthenticated,
    isInitializing,
    isLoading,
    login,
    register,
    loginAsGuest,
  } = useAuth()

  const [activeTab, setActiveTab] = React.useState<AuthTab>(defaultTab)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // Controlled form state
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  // Error & Info feedback messages
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null)

  // Nếu người dùng đã có phiên đăng nhập và truy cập /auth thì chuyển về /roadmap
  React.useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace(AUTH_LINKS.afterLoginRedirect)
    }
  }, [isInitializing, isAuthenticated, router])

  const handleTabSwitch = (nextTab: AuthTab) => {
    setActiveTab(nextTab)
    setErrorMessage(null)
    setInfoMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    setInfoMessage(null)

    try {
      if (activeTab === "login") {
        await login(email, password)
        router.push(AUTH_LINKS.afterLoginRedirect)
      } else {
        await register({
          fullName,
          email,
          password,
          confirmPassword,
        })
        router.push(AUTH_LINKS.afterSignupRedirect)
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check your input."
      )
    }
  }

  const handleGuestLogin = async () => {
    setErrorMessage(null)
    setInfoMessage(null)
    try {
      await loginAsGuest()
      router.push(AUTH_LINKS.continueAsGuest)
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not start Guest session."
      )
    }
  }

  const handleGoogleSignInClick = () => {
    setErrorMessage(null)
    setInfoMessage("Google Sign-In is not configured yet.")
  }

  const handleForgotPasswordClick = () => {
    setErrorMessage(null)
    setInfoMessage(
      "Password recovery requires Backend and Email Service integration, which is not configured yet."
    )
  }

  return (
    <div
      className={cn(
        "relative flex min-h-svh w-full items-center justify-center overflow-x-hidden bg-surface-secondary px-4 py-4 font-sans text-text-secondary selection:bg-primary/30 selection:text-text-primary sm:px-6 lg:h-svh lg:overflow-hidden lg:py-6",
        className
      )}
      {...props}
    >
      {/* Hiệu ứng quầng sáng nền Tokyo Night */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[15%] left-[8%] h-[400px] w-[400px] rounded-full bg-primary/12 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[10%] bottom-[12%] h-[420px] w-[420px] rounded-full bg-cyan/10 blur-[140px]"
      />

      {/* ==================== KHUNG THẺ CHÍNH 2 CỘT CĂN GIỮA MÀN HÌNH ==================== */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1100px] items-center justify-center">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-border-subtle bg-surface/90 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-md lg:grid-cols-12">
          {/* -------------------- CỘT TRÁI: THƯƠNG HIỆU, THÔNG ĐIỆP & CÂY NHỊ PHÂN -------------------- */}
          <div className="flex flex-col justify-between border-b border-border-subtle bg-surface-secondary/45 p-6 sm:p-8 lg:col-span-6 lg:border-r lg:border-b-0 lg:px-10 lg:py-8">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <Link
                  href={AUTH_LINKS.backToHome}
                  className="group inline-flex items-center transition-opacity hover:opacity-95"
                >
                  <BrandLogo size="md" priority />
                </Link>

                <span className="rounded-full border border-border-subtle bg-surface px-3 py-1 font-mono text-[10px] text-primary">
                  DSA Learning Platform
                </span>
              </div>

              <h1 className="text-2xl leading-[1.2] font-extrabold tracking-tight sm:text-3xl lg:text-[36px]">
                <span className="block text-text-primary">
                  Learn DSA by <span className="text-cyan">thinking,</span>
                </span>
                <span className="mt-1 block text-primary">not copying.</span>
              </h1>
              <p className="mt-3 max-w-[390px] text-xs leading-relaxed text-text-secondary sm:text-sm">
                Build algorithmic confidence with guided practice and Socratic
                AI hints.
              </p>
            </div>

            {/* Sơ đồ Cây Nhị Phân (8 -> 4, 12 -> 2, 6, 10, 14) nối tâm vuông góc tiếp tuyến */}
            <div className="my-4 flex items-center justify-center select-none">
              <svg
                viewBox="0 0 380 220"
                className="h-[185px] w-full max-w-[360px] overflow-visible sm:h-[200px]"
                aria-label="Binary Search Tree Illustration"
              >
                <defs>
                  <filter
                    id="auth-node-glow"
                    x="-35%"
                    y="-35%"
                    width="170%"
                    height="170%"
                  >
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>

                <circle
                  cx="95"
                  cy="45"
                  r="1.5"
                  fill="var(--color-cyan)"
                  fillOpacity="0.45"
                />
                <circle
                  cx="285"
                  cy="42"
                  r="1.5"
                  fill="var(--color-primary)"
                  fillOpacity="0.5"
                />
                <rect
                  x="262"
                  y="52"
                  width="4"
                  height="4"
                  rx="0.5"
                  stroke="var(--color-cyan)"
                  strokeOpacity="0.5"
                  fill="none"
                />
                <circle
                  cx="62"
                  cy="125"
                  r="1.5"
                  fill="var(--color-cyan)"
                  fillOpacity="0.35"
                />
                <circle
                  cx="320"
                  cy="120"
                  r="1.5"
                  fill="var(--color-purple)"
                  fillOpacity="0.4"
                />
                <circle
                  cx="190"
                  cy="195"
                  r="1.5"
                  fill="var(--color-primary)"
                  fillOpacity="0.4"
                />

                <g strokeWidth="1.8" strokeLinecap="round">
                  {[
                    {
                      x1: 190,
                      y1: 42,
                      r1: 22,
                      x2: 122,
                      y2: 108,
                      r2: 21,
                      color: "var(--color-cyan)",
                    },
                    {
                      x1: 190,
                      y1: 42,
                      r1: 22,
                      x2: 258,
                      y2: 108,
                      r2: 21,
                      color: "var(--color-primary)",
                    },
                    {
                      x1: 122,
                      y1: 108,
                      r1: 21,
                      x2: 78,
                      y2: 174,
                      r2: 19,
                      color: "var(--color-cyan)",
                    },
                    {
                      x1: 122,
                      y1: 108,
                      r1: 21,
                      x2: 162,
                      y2: 174,
                      r2: 19,
                      color: "var(--color-cyan)",
                    },
                    {
                      x1: 258,
                      y1: 108,
                      r1: 21,
                      x2: 218,
                      y2: 174,
                      r2: 19,
                      color: "var(--color-primary)",
                    },
                    {
                      x1: 258,
                      y1: 108,
                      r1: 21,
                      x2: 302,
                      y2: 174,
                      r2: 19,
                      color: "var(--color-primary)",
                    },
                  ].map((edge, idx) => {
                    const dx = edge.x2 - edge.x1
                    const dy = edge.y2 - edge.y1
                    const dist = Math.hypot(dx, dy)
                    const ux = dx / dist
                    const uy = dy / dist
                    return (
                      <line
                        key={idx}
                        x1={edge.x1 + ux * edge.r1}
                        y1={edge.y1 + uy * edge.r1}
                        x2={edge.x2 - ux * edge.r2}
                        y2={edge.y2 - uy * edge.r2}
                        stroke={edge.color}
                      />
                    )
                  })}
                </g>

                {[
                  {
                    val: "8",
                    x: 190,
                    y: 42,
                    r: 21,
                    stroke: "var(--color-cyan)",
                    glow: "var(--color-cyan)",
                  },
                  {
                    val: "4",
                    x: 122,
                    y: 108,
                    r: 20,
                    stroke: "var(--color-cyan)",
                    glow: "var(--color-cyan)",
                  },
                  {
                    val: "12",
                    x: 258,
                    y: 108,
                    r: 20,
                    stroke: "#7AA2F7",
                    glow: "var(--color-primary)",
                  },
                  {
                    val: "2",
                    x: 78,
                    y: 174,
                    r: 18,
                    stroke: "var(--color-cyan)",
                    glow: "var(--color-cyan)",
                  },
                  {
                    val: "6",
                    x: 162,
                    y: 174,
                    r: 18,
                    stroke: "var(--color-cyan)",
                    glow: "var(--color-cyan)",
                  },
                  {
                    val: "10",
                    x: 218,
                    y: 174,
                    r: 18,
                    stroke: "var(--color-cyan)",
                    glow: "var(--color-cyan)",
                  },
                  {
                    val: "14",
                    x: 302,
                    y: 174,
                    r: 18,
                    stroke: "var(--color-purple)",
                    glow: "var(--color-primary)",
                  },
                ].map((node) => (
                  <g
                    key={node.val}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <circle
                      r={node.r + 2}
                      fill="none"
                      stroke={node.glow}
                      strokeOpacity="0.45"
                      strokeWidth="1.5"
                      filter="url(#auth-node-glow)"
                    />
                    <circle
                      r={node.r}
                      fill="var(--color-surface)"
                      stroke={node.stroke}
                      strokeWidth="2"
                    />
                    <text
                      y="5"
                      textAnchor="middle"
                      fill="var(--color-text-primary)"
                      fontSize="13.5"
                      fontWeight="700"
                    >
                      {node.val}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Dòng 3 điểm nổi bật dưới cùng của cột trái */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-text-secondary sm:justify-start sm:gap-4">
              <div className="inline-flex items-center gap-2">
                <Brain className="size-4 text-cyan" />
                <span>Socratic AI</span>
              </div>
              <span className="text-border">•</span>
              <div className="inline-flex items-center gap-2">
                <GitFork className="size-4 text-primary" />
                <span>Skill Tree</span>
              </div>
              <span className="text-border">•</span>
              <div className="inline-flex items-center gap-2">
                <Code2 className="size-4 text-primary" />
                <span>Code Sandbox</span>
              </div>
            </div>
          </div>

          {/* -------------------- CỘT PHẢI: BIỂU MẪU LOG IN / SIGN UP -------------------- */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-6 lg:px-10 lg:py-7">
            <div className="mx-auto w-full max-w-[410px]">
              {/* Nút quay về trang chủ tích hợp trực tiếp trong khung đăng nhập / đăng ký */}
              <div className="mb-3 flex items-center justify-between">
                <Link
                  href={AUTH_LINKS.backToHome}
                  className="group inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary/80 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary/60 hover:bg-primary/20 hover:text-text-primary"
                >
                  <ArrowLeft className="size-3.5 text-primary transition-transform group-hover:-translate-x-0.5" />
                  <Home className="size-3.5 text-primary" />
                  <span>Back to Home</span>
                </Link>

                {activeTab === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(BRAND.demoEmail)
                      setPassword("Demo1234")
                      setErrorMessage(null)
                      setInfoMessage(null)
                    }}
                    className="cursor-pointer rounded-md border border-border-subtle bg-surface-secondary/80 px-2.5 py-1 font-mono text-[10px] text-cyan transition-colors hover:border-primary/60"
                  >
                    Fill Demo Account
                  </button>
                )}
              </div>

              {/* Tiêu đề chào mừng */}
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                Welcome to <span className="text-text-primary">OffBy</span><span className="bg-gradient-to-r from-[#7DCFFF] via-[#7AA2F7] to-[#BB9AF7] bg-clip-text text-transparent">One</span>
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                {activeTab === "login"
                  ? BRAND.slogan
                  : "Create an account to build your personalized DSA Skill Tree."}
              </p>

              {/* Thanh chuyển đổi chế độ: Log In | Sign Up */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="mt-3.5 grid grid-cols-2 rounded-full border border-border-subtle bg-surface-secondary p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "login"}
                  onClick={() => handleTabSwitch("login")}
                  className={cn(
                    "cursor-pointer rounded-full py-2 text-xs font-semibold transition-all",
                    activeTab === "login"
                      ? "bg-primary font-bold text-surface-secondary shadow-[0_0_20px_rgba(122,162,247,0.3)]"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Log In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "signup"}
                  onClick={() => handleTabSwitch("signup")}
                  className={cn(
                    "cursor-pointer rounded-full py-2 text-xs font-semibold transition-all",
                    activeTab === "signup"
                      ? "bg-primary font-bold text-surface-secondary shadow-[0_0_20px_rgba(122,162,247,0.3)]"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Sign Up
                </button>
              </div>

              {/* Thông báo Lỗi hoặc Thông tin (Google Sign-In / Forgot Password) */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-xl border border-danger/60 bg-danger/12 px-3 py-2 text-[11px] leading-snug text-warning"
                >
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-danger" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {infoMessage && (
                <div
                  role="status"
                  className="mt-3 flex items-start gap-2 rounded-xl border border-primary/50 bg-primary/12 px-3 py-2 text-[11px] leading-snug text-text-primary"
                >
                  <Info className="mt-0.5 size-3.5 shrink-0 text-cyan" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* Form nhập thông tin */}
              <form
                className="mt-3.5 space-y-2.5"
                onSubmit={handleSubmit}
                noValidate
              >
                {/* Trường Họ tên (Chỉ hiển thị khi chọn tab Sign Up) */}
                {activeTab === "signup" && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-text-primary"
                    >
                      Full Name
                    </label>
                    <div className="mt-1 flex h-9.5 items-center gap-3 rounded-xl border border-border-subtle bg-surface-secondary/80 px-3.5 transition-colors focus-within:border-primary">
                      <User className="size-4 shrink-0 text-text-muted" />
                      <input
                        id="auth-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Trường Email */}
                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-text-primary"
                  >
                    Email
                  </label>
                  <div className="mt-1 flex h-9.5 items-center gap-3 rounded-xl border border-border-subtle bg-surface-secondary/80 px-3.5 transition-colors focus-within:border-primary">
                    <Mail className="size-4 shrink-0 text-text-muted" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={BRAND.demoEmail}
                      required
                      className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                  </div>
                </div>

                {/* Trường Password & Confirm Password */}
                {activeTab === "login" ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="auth-password"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPasswordClick}
                        className="cursor-pointer text-[11px] font-medium text-primary transition-colors hover:text-primary-hover"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="mt-1 flex h-9.5 items-center gap-3 rounded-xl border border-border-subtle bg-surface-secondary/80 px-3.5 transition-colors focus-within:border-primary">
                      <Lock className="size-4 shrink-0 text-text-muted" />
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="cursor-pointer text-text-muted transition-colors hover:text-text-secondary"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="auth-password"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Password
                      </label>
                      <div className="mt-1 flex h-9.5 items-center gap-2 rounded-xl border border-border-subtle bg-surface-secondary/80 px-3 transition-colors focus-within:border-primary">
                        <Lock className="size-3.5 shrink-0 text-text-muted" />
                        <input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 8 chars"
                          required
                          className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="cursor-pointer text-text-muted transition-colors hover:text-text-secondary"
                        >
                          {showPassword ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="auth-confirm-password"
                        className="block text-xs font-semibold text-text-primary"
                      >
                        Confirm Password
                      </label>
                      <div className="mt-1 flex h-9.5 items-center gap-2 rounded-xl border border-border-subtle bg-surface-secondary/80 px-3 transition-colors focus-within:border-primary">
                        <Lock className="size-3.5 shrink-0 text-text-muted" />
                        <input
                          id="auth-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          required
                          className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          className="cursor-pointer text-text-muted transition-colors hover:text-text-secondary"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nút Submit chính (Log In / Sign Up) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-surface-secondary shadow-[0_0_25px_rgba(122,162,247,0.25)] transition-all hover:bg-primary-hover hover:shadow-[0_0_32px_rgba(122,162,247,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>
                    {isLoading
                      ? activeTab === "login"
                        ? "Logging in..."
                        : "Creating account..."
                      : activeTab === "login"
                        ? "Log In"
                        : "Sign Up"}
                  </span>
                </button>

                {/* Đường kẻ phân cách "or continue with" */}
                <div className="relative flex items-center py-0.5">
                  <div className="grow border-t border-border-subtle" />
                  <span className="mx-3 shrink-0 text-[11px] text-text-muted">
                    or continue with
                  </span>
                  <div className="grow border-t border-border-subtle" />
                </div>

                {/* Nút Continue with Google */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignInClick}
                  className="inline-flex h-9.5 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-border-subtle bg-surface-secondary/85 text-xs font-semibold text-text-primary transition-colors hover:border-border hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Nút Continue as Guest (Thông qua Auth Service thống nhất) */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGuestLogin}
                  className="inline-flex h-9.5 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent text-xs font-semibold text-text-secondary transition-all hover:border-cyan hover:bg-cyan/8 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <User className="size-4 shrink-0 text-cyan" />
                  <span>Continue as Guest</span>
                </button>

                {/* Dòng chuyển đổi tạo tài khoản / đăng nhập ở dưới cùng */}
                <p className="pt-0.5 text-center text-xs text-text-secondary">
                  {activeTab === "login" ? (
                    <>
                      New to {BRAND.name}?{" "}
                      <button
                        type="button"
                        onClick={() => handleTabSwitch("signup")}
                        className="cursor-pointer font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary-hover"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => handleTabSwitch("login")}
                        className="cursor-pointer font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary-hover"
                      >
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
