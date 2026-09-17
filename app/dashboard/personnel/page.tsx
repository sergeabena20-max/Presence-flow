"use client"

import { useEffect, useMemo, useState } from "react"

type User = {
  id: string; email: string; firstName: string; lastName: string; phone: string | null
  matricule: string | null; role: string; functionTitle: string | null; isActive: boolean
  departmentId: string | null; department: { name: string } | null
}
type Department = { id: string; name: string }

export default function PersonnelPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", matricule: "", functionTitle: "", departmentId: "", password: "" })
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    try {
      const [usersResponse, departmentsResponse] = await Promise.all([fetch("/api/users", { cache: "no-store" }), fetch("/api/departments", { cache: "no-store" })])
      const usersData = await usersResponse.json()
      const departmentsData = await departmentsResponse.json()
      if (!usersResponse.ok) throw new Error(usersData.error ?? "Impossible de charger le personnel.")
      setUsers(usersData.users ?? [])
      if (departmentsResponse.ok) setDepartments(departmentsData.departments ?? [])
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur de chargement.") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? users.filter((u) => `${u.firstName} ${u.lastName} ${u.email} ${u.matricule ?? ""} ${u.functionTitle ?? ""}`.toLowerCase().includes(term)) : users
  }, [users, search])

  function openEdit(user: User) {
    setEditing(user)
    setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "", matricule: user.matricule ?? "", functionTitle: user.functionTitle ?? "", departmentId: user.departmentId ?? "", password: "" })
    setError(""); setMessage("")
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return
    setSaving(true); setError(""); setMessage("")
    try {
      const body: Record<string, string> = { ...form }
      if (!form.password) delete body.password
      const response = await fetch(`/api/users/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) { setError(data.error ?? "Modification impossible."); return }
      setMessage("Utilisateur modifié avec succès."); setEditing(null); await load()
    } catch { setError("Erreur réseau. Réessayez.") }
    finally { setSaving(false) }
  }

  async function toggle(user: User) {
    setError(""); setMessage("")
    const response = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !user.isActive }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? "Impossible de modifier le statut."); return }
    setMessage(user.isActive ? "Utilisateur désactivé." : "Utilisateur activé."); await load()
  }

  async function remove(user: User) {
    if (!window.confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) return
    setError(""); setMessage("")
    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? "Impossible de supprimer l’utilisateur."); return }
    setMessage("Utilisateur supprimé."); await load()
  }

  async function createDepartment() {
    const name = window.prompt("Nom du nouveau département :")?.trim()
    if (!name) return
    const response = await fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? "Impossible de créer le département."); return }
    setDepartments((current) => [...current, data.department].sort((a, b) => a.name.localeCompare(b.name)))
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <a className="back-link" href="/dashboard">← Tableau de bord</a>
        <header className="dashboard-header">
          <div><p className="dashboard-eyebrow">GESTION DU PERSONNEL</p><h1>Personnel</h1><p className="dashboard-subtitle">Les utilisateurs créent eux-mêmes leur compte. Vous gérez ensuite leur accès à votre organisation.</p></div>
        </header>
        {error && <p className="login-error" role="alert">{error}</p>}
        {message && <p className="success-message" role="status">{message}</p>}

        {editing && <section className="form-card">
          <div className="section-heading"><div><p className="dashboard-eyebrow">MODIFICATION</p><h2>{editing.firstName} {editing.lastName}</h2></div><button className="logout-button" type="button" onClick={() => setEditing(null)}>Fermer</button></div>
          <form onSubmit={save}>
            <div className="form-grid">
              <label>Prénom<input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></label>
              <label>Nom<input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></label>
              <label>Téléphone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Matricule<input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} /></label>
              <label>Fonction / profil<input value={form.functionTitle} onChange={(e) => setForm({ ...form, functionTitle: e.target.value })} /></label>
              <label>Département<select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}><option value="">Sans département</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              <label>Nouveau mot de passe<small>Laisser vide pour conserver l’actuel</small><input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            </div>
            <div className="button-row"><button className="secondary-button" type="button" onClick={createDepartment}>+ Département</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button></div>
          </form>
        </section>}

        <section className="dashboard-actions">
          <div className="section-heading"><div><p className="dashboard-eyebrow">{users.length} UTILISATEUR(S)</p><h2>Utilisateurs de l’organisation</h2></div><input className="search-input" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          {loading ? <p className="dashboard-subtitle">Chargement…</p> : <div className="personnel-list">
            {filtered.length === 0 ? <div className="form-card"><h3>Aucun utilisateur inscrit</h3><p className="dashboard-subtitle">Dès qu’une personne choisira votre organisation lors de son inscription, elle apparaîtra ici.</p></div> : filtered.map(user => <article className="personnel-row" key={user.id}>
              <div><strong>{user.firstName} {user.lastName}</strong><p>{user.email} {user.matricule ? `• ${user.matricule}` : ""}</p></div>
              <div><span>{user.functionTitle || "—"}</span><small>{user.department?.name || "Sans département"}</small></div>
              <span className={user.isActive ? "active-badge" : "inactive-badge"}>{user.isActive ? "Actif" : "Inactif"}</span>
              <div className="row-actions"><button type="button" onClick={() => openEdit(user)}>Modifier</button><button type="button" onClick={() => toggle(user)}>{user.isActive ? "Désactiver" : "Activer"}</button><button type="button" onClick={() => remove(user)}>Supprimer</button></div>
            </article>)}
          </div>}
        </section>
      </div>
    </main>
  )
}
