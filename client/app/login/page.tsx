"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { LoginForm, type AuthTab } from "@/components/login-form"

function LoginPageContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const defaultTab: AuthTab = tabParam === "signup" ? "signup" : "login"

  return <LoginForm key={defaultTab} defaultTab={defaultTab} />
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<LoginForm defaultTab="login" />}>
      <LoginPageContent />
    </React.Suspense>
  )
}
