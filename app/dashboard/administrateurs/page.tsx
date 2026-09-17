"use client"

import { useEffect, useState } from "react"

type Admin = { id: string; firstName: string; lastName: string; email: string; phone: string | null; isActive: boolean; createdAt: string }
type Form = { firstName: string; lastName: string; email: string; phone: string; password: string }
const emptyForm: Form = { firstName: "", lastName: "", email: "", phone: "", password: "" }

export default function AdministrateursPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [form, setForm] = useState<Form>(emptyForm)
  const [editing, setEditing] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    try {
      const response = await fetch("/api/admins", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Impossible de charger les administrateurs.")
      setAdmins(data.admins)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur de chargement.") }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function startEdit(admin: Admin) {
    setEditing(admin)
    setForm({ firstName: admin.firstName, lastName: admin.lastName, email: admin.email, phone: admin.phone ?? "", password: "" })
    setError(""); setMessage("")
  }
  function reset() { setEditing(null); setForm(emptyForm); setError(""); setMessage("") }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("")
    try {
      const response = await fetch(editing ? `/api/admins/${editing.id}` : "/api/admins", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { firstName: form.firstName, lastName: form.lastName, phone: form.phone, password: form.password } : form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Opération impossible.")
      setMessage(editing ? "Administrateur modifié avec succès." : "Administrateur créé avec succès.")
      reset(); await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue.") }
    finally { setSaving(false) }
  }

  async function toggle(admin: Admin) {
    setError(""); setMessage("")
    const response = await fetch(`/api/admins/${admin.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !admin.isActive }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? "Impossible de modifier le statut."); return }
    setMessage(admin.isActive ? "Administrateur désactivé." : "Administrateur activé.")
    await load()
  }

  async function remove(admin: Admin) {
    if (!window.confirm(`Supprimer définitivement le compte de ${admin.firstName} ${admin.lastName} ?`)) return
    setError(""); setMessage("")
    const response = await fetch(`/api/admins/${admin.id}`, { method: "DELETE" })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? "Impossible de supprimer l’administrateur."); return }
    setMessage("Administrateur supprimé."); await load()
  }

  return (
    <main className="dashboard-page"><div className="dashboard-shell">
      <a className="back-link" href="/dashboard">← Tableau de bord</a>
      <header className="dashboard-header"><div><p className="dashboard-eyebrow">ADMINISTRATION</p><h1>Administrateurs</h1><p className="dashboard-subtitle">Gérez les comptes administrateurs de votre organisation.</p></div></header>
      {error && <p className="login-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
      <section className="form-card"><p className="dashboard-eyebrow">{editing ? "MODIFICATION" : "NOUVEL ADMINISTRATEUR"}</p><h2>{editing ? "Modifier le compte" : "Ajouter un administrateur"}</h2>
        <form onSubmit={save}><div className="form-grid">
          <label>Prénom<input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></label>
          <label>Nom<input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></label>
          <label>E-mail<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={!!editing} /></label>
          <label>Téléphone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label>{editing ? "Nouveau mot de passe (facultatif)" : "Mot de passe"}<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} minLength={8} required={!editing} placeholder={editing ? "Laisser vide pour conserver" : "8 caractères minimum"} /></label>
        </div><div className="button-row"><button className="primary-button" disabled={saving}>{saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer l’administrateur"}</button>{editing && <button type="button" className="secondary-button" onClick={reset}>Annuler</button>}</div></form>
      </section>
      <section className="dashboard-actions"><div className="section-heading"><div><p className="dashboard-eyebrow">COMPTES</p><h2>Administrateurs de l’organisation</h2></div></div>
        {loading ? <p className="form-help">Chargement…</p> : <div className="personnel-list">{admins.map(admin => <article className="personnel-row" key={admin.id}>
          <div><strong>{admin.firstName} {admin.lastName}</strong><p>{admin.email}</p>{admin.phone && <small>{admin.phone}</small>}</div>
          <span className={admin.isActive ? "active-badge" : "inactive-badge"}>{admin.isActive ? "Actif" : "Inactif"}</span>
          <div className="row-actions"><button className="secondary-button" onClick={() => startEdit(admin)}>Modifier</button><button className="secondary-button" onClick={() => toggle(admin)}>{admin.isActive ? "Désactiver" : "Activer"}</button><button className="danger-button" onClick={() => remove(admin)}>Supprimer</button></div>
        </article>)}</div>}
      </section>
    </div></main>
  )
}
