"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

export default function NewOrganizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Impossible de créer l’organisation.")
        return
      }

      setSuccess("Organisation et administrateur créés avec succès.")
      setTimeout(() => router.push("/dashboard/organisations"), 700)
    } catch {
      setError("Impossible de contacter le serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell narrow-shell">
        <a className="back-link" href="/dashboard/organisations">← Organisations</a>
        <section className="form-card">
          <p className="dashboard-eyebrow">NOUVELLE ORGANISATION</p>
          <h1>Créer une organisation</h1>
          <p className="dashboard-subtitle">
            Créez l’organisation et son premier administrateur.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Nom de l’organisation *
                <input name="name" placeholder="Ex. Entreprise ABC" required />
              </label>
              <label>
                Type *
                <select name="type" defaultValue="COMPANY" required>
                  <option value="COMPANY">Entreprise</option>
                  <option value="SCHOOL">École</option>
                  <option value="HOSPITAL">Hôpital</option>
                  <option value="ADMINISTRATION">Administration</option>
                  <option value="OTHER">Autre</option>
                </select>
              </label>
              <label>
                Téléphone
                <input name="phone" placeholder="6 XX XX XX XX" />
              </label>
              <label>
                E-mail de l’organisation
                <input name="email" type="email" placeholder="contact@organisation.com" />
              </label>
              <label className="full-width">
                Adresse
                <input name="address" placeholder="Adresse de l’organisation" />
              </label>
            </div>

            <div className="form-section-divider">
              <p className="dashboard-eyebrow">ADMINISTRATEUR INITIAL</p>
              <p className="dashboard-subtitle">Cet administrateur pourra ensuite gérer son organisation.</p>
            </div>

            <div className="form-grid">
              <label>
                Prénom *
                <input name="adminFirstName" placeholder="Prénom" required />
              </label>
              <label>
                Nom *
                <input name="adminLastName" placeholder="Nom" required />
              </label>
              <label>
                E-mail *
                <input name="adminEmail" type="email" placeholder="admin@organisation.com" required />
              </label>
              <label>
                Téléphone
                <input name="adminPhone" placeholder="6 XX XX XX XX" />
              </label>
              <label className="full-width">
                Mot de passe temporaire *
                <input name="adminPassword" type="password" minLength={8} placeholder="Minimum 8 caractères" required />
              </label>
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}
            {success && <p className="success-message" role="status">{success}</p>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Création en cours…" : "Créer l’organisation"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
