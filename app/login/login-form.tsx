"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "1") setMessage("Compte créé avec succès. Vous pouvez maintenant vous connecter.")
  }, [searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error ?? "Connexion impossible."); return }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Impossible de contacter le serveur.")
    } finally { setLoading(false) }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Connexion Presence-Flow">
        <div className="brand-mark">PF</div>
        <p className="eyebrow">PRESENCE-FLOW</p>
        <h1>Bienvenue</h1>
        <p className="subtitle">Connectez-vous à votre espace Presence-Flow.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@organisation.com" required />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" required />
          {message && <p className="success-message" role="status">{message}</p>}
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</button>
        </form>
        <div className="login-register-link">
          <span>Vous n’avez pas encore de compte ?</span>
          <a href="/inscription">Créer mon compte</a>
        </div>
        <p className="footer-note">Votre compte est rattaché à une seule organisation.</p>
      </section>
    </main>
  )
}
