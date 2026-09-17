"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Impossible de modifier le mot de passe.")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Impossible de contacter le serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Changement de mot de passe">
        <div className="brand-mark">PF</div>
        <p className="eyebrow">PRESENCE-FLOW</p>
        <h1>Sécurisez votre compte</h1>
        <p className="subtitle">
          Pour votre sécurité, vous devez définir un nouveau mot de passe avant de continuer.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="currentPassword">Ancien mot de passe</label>
          <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />

          <label htmlFor="newPassword">Nouveau mot de passe</label>
          <input id="newPassword" name="newPassword" type="password" minLength={8} autoComplete="new-password" required />

          <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
          <input id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Modification…" : "Définir mon nouveau mot de passe"}
          </button>
        </form>

        <p className="footer-note">Minimum 8 caractères. Ne partagez jamais votre mot de passe.</p>
      </section>
    </main>
  )
}
