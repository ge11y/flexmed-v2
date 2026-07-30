"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/admin"
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!response.ok || !result?.ok) {
        setError(result?.error || "Unable to sign in to the admin workspace.")
        return
      }

      router.replace(next)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "grid", placeItems: "center", padding: "32px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "520px", padding: "28px", display: "grid", gap: "22px" }}>
        <div style={{ display: "grid", gap: "10px" }}>
          <div className="section-label">Admin Sign In</div>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)" }}>FlexMed Admin</h1>
          <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Enter the admin username and password to open the back-office workspace.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <label style={{ display: "grid", gap: "8px" }}>
            <span className="section-label" style={{ color: "var(--text-primary)" }}>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              style={{
                borderRadius: "14px",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                padding: "14px 16px",
                fontSize: "15px",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "8px" }}>
            <span className="section-label" style={{ color: "var(--text-primary)" }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              style={{
                borderRadius: "14px",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                padding: "14px 16px",
                fontSize: "15px",
              }}
            />
          </label>

          {error ? (
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(185, 28, 28, 0.24)",
                background: "rgba(254, 242, 242, 0.8)",
                color: "#991b1b",
                padding: "12px 14px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          ) : null}

          <button type="submit" className="fm-btn-primary" disabled={submitting} style={{ justifyContent: "center" }}>
            {submitting ? "Signing In..." : "Sign In to Admin"}
          </button>
        </form>
      </div>
    </div>
  )
}
