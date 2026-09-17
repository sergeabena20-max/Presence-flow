"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Organization = { id: string; name: string; type: string }

const typeLabels: Record<string, string> = {
  COMPANY: "Entreprise",
  SCHOOL: "École",
  HOSPITAL: "Hôpital",
  ADMINISTRATION: "Administration",
  OTHER: "Autre",
}

export default function InscriptionPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationId, setOrganizationId] = useState("")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", matricule: "", functionTitle: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/register", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? "Impossible de charger les organisations.")
        setOrganizations(data.organizations ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les organisations."))
      .finally(() => setLoading(false))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (form.password !== form.confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }
    setSaving(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ...form }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Inscription impossible.")
        return
      }
      router.push("/login?registered=1")
    } catch {
      setError("Impossible de contacter le serveur.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card register-card">
        <div className="brand-mark">PF</div>
        <p className="eyebrow">PRESENCE-FLOW</p>
        <h1>Créer mon compte</h1>
        <p className="subtitle">Choisissez votre organisation puis créez votre compte utilisateur.</p>

        {error && <p className="login-error" role="alert">{error}</p>}

        <form onSubmit={submit} className="login-form">
          <label htmlFor="organization">Organisation</label>
          <select id="organization" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required disabled={loading}>
            <option value="">{loading ? "Chargement…" : "Sélectionnez votre organisation"}</option>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} · {typeLabels[organization.type] ?? organization.type}</option>)}
          </select>

          <div className="form-grid">
            <label>Prénom<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
            <label>Nom<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
            <label>E-mail<input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label>Téléphone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label>Matricule / identifiant<input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} /></label>
            <label>Fonction / profil<input placeholder="Ex. Élève, Employé…" value={form.functionTitle} onChange={(e) => setForm({ ...form, functionTitle: e.target.value })} /></label>
          </div>

          <label>Mot de passe<input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          <label>Confirmer le mot de passe<input type="password" autoComplete="new-password" minLength={8} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></label>

          <button type="submit" disabled={saving || loading || !organizationId}>{saving ? "Création du compte…" : "Créer mon compte"}</button>
        </form>

        <p className="footer-note"><a href="/login">J’ai déjà un compte · Se connecter</a></p>
      </section>
    </main>
  )
}
