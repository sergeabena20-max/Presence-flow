"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

const typeLabels: Record<string, string> = {
  COMPANY: "Entreprise",
  SCHOOL: "École",
  HOSPITAL: "Hôpital",
  ADMINISTRATION: "Administration",
  OTHER: "Autre",
}

export default function InscriptionPage() {
  const router = useRouter()
  const [organizationType, setOrganizationType] = useState("COMPANY")
  const [form, setForm] = useState({
    organizationName: "", firstName: "", lastName: "", email: "", phone: "",
    matricule: "", functionTitle: "", className: "", password: "", confirmPassword: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

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
        body: JSON.stringify({ ...form, organizationType }),
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

  const isSchool = organizationType === "SCHOOL"
  const roleHint = organizationType === "SCHOOL"
    ? "Élève / étudiant : indiquez votre classe et votre matricule."
    : organizationType === "COMPANY"
      ? "Indiquez votre fonction ou votre poste dans l’entreprise."
      : organizationType === "HOSPITAL"
        ? "Indiquez votre fonction et, si utile, votre service."
        : "Indiquez votre fonction, service ou profil."

  return (
    <main className="login-page">
      <section className="login-card register-card">
        <div className="brand-mark">PF</div>
        <p className="eyebrow">PRESENCE-FLOW</p>
        <h1>Créer mon compte</h1>
        <p className="subtitle">Saisissez le nom de votre organisation. Sa validation sera effectuée par un administrateur.</p>

        {error && <p className="login-error" role="alert">{error}</p>}

        <form onSubmit={submit} className="login-form">
          <div className="form-grid">
            <label className="full-width">
              Type d’organisation *
              <select value={organizationType} onChange={(e) => setOrganizationType(e.target.value)} required>
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="full-width">
              Nom de l’organisation *
              <input value={form.organizationName} onChange={(e) => update("organizationName", e.target.value)} placeholder="Ex. Collège / Entreprise ABC" required />
            </label>
            <label>Prénom *<input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required /></label>
            <label>Nom *<input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required /></label>
            <label>E-mail *<input type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></label>
            <label>Téléphone<input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
            <label>Matricule / identifiant<input value={form.matricule} onChange={(e) => update("matricule", e.target.value)} required={isSchool} /></label>
            {isSchool && <label>Classe *<input value={form.className} onChange={(e) => update("className", e.target.value)} placeholder="Ex. 3e A, Terminale C" required /></label>}
            {!isSchool && <label>Fonction / profil<input value={form.functionTitle} onChange={(e) => update("functionTitle", e.target.value)} placeholder="Ex. Technicien, infirmier, agent…" /></label>}
          </div>

          <p className="form-help">{roleHint}</p>

          <label>Mot de passe *<input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required /></label>
          <label>Confirmer le mot de passe *<input type="password" autoComplete="new-password" minLength={8} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required /></label>

          <button type="submit" disabled={saving}>{saving ? "Envoi de la demande…" : "Créer mon compte"}</button>
        </form>

        <p className="footer-note">Votre demande sera vérifiée avant l’activation de votre compte. <a href="/login">Se connecter</a></p>
      </section>
    </main>
  )
}
