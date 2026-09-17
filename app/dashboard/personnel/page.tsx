"use client"

import { useEffect, useMemo, useState } from "react"

type User = {
  id: string; email: string; firstName: string; lastName: string; phone: string | null
  matricule: string | null; role: string; functionTitle: string | null; isActive: boolean
  departmentId: string | null; department: { name: string } | null
}
type Department = { id: string; name: string; _count?: { users: number } }

const emptyForm = { firstName: "", lastName: "", email: "", phone: "", matricule: "", functionTitle: "", departmentId: "", password: "" }

export default function PersonnelPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [usersResponse, departmentsResponse] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
      ])
      const usersData = await usersResponse.json()
      const departmentsData = await departmentsResponse.json()
      if (!usersResponse.ok) throw new Error(usersData.error ?? "Impossible de charger le personnel.")
      setUsers(usersData.users)
      if (departmentsResponse.ok) setDepartments(departmentsData.departments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.")
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter((u) => `${u.firstName} ${u.lastName} ${u.email} ${u.matricule ?? ""} ${u.functionTitle ?? ""}`.toLowerCase().includes(term))
  }, [users, search])

  function openCreate() {
    setEditing(null); setForm(emptyForm); setError(""); setMessage(""); setShowForm(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? "", matricule: user.matricule ?? "", functionTitle: user.functionTitle ?? "", departmentId: user.departmentId ?? "", password: "" })
    setError(""); setMessage(""); setShowForm(true)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("")
    try {
      const url = editing ? `/api/users/${editing.id}` : "/api/users"
      const method = editing ? "PATCH" : "POST"
      const body = { ...form, ...(editing ? {} : { password: form.password }) }
      if (editing && !form.password) delete (body as { password?: string }).password
      if (editing) delete (body as { email?: string }).email
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) { setError(data.error ?? "Opération impossible."); return }
      setMessage(editing ? "Personnel modifié avec succès." : "Personnel ajouté avec succès.")
      setShowForm(false); setForm(emptyForm); setEditing(null); await load()
    } catch { setError("Erreur réseau. Réessayez.") } finally { setSaving(false) }
  }

  async function toggle(user: User) {
    setError(""); setMessage("")
    const response = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !user.isActive }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? "Impossible de modifier le statut."); return }
    setMessage(user.isActive ? "Utilisateur désactivé." : "Utilisateur activé.")
    await load()
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
    setForm((current) => ({ ...current, departmentId: data.department.id }))
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <a className="back-link" href="/dashboard">← Tableau de bord</a>
        <header className="dashboard-header">
          <div><p className="dashboard-eyebrow">GESTION DU PERSONNEL</p><h1>Personnel</h1><p className="dashboard-subtitle">Ajoutez et gérez les utilisateurs de votre organisation.</p></div>
          <button className="primary-button" type="button" onClick={openCreate}>+ Ajouter un membre</button>
        </header>

        {error && <p className="login-error" role="alert">{error}</p>}
        {message && <p className="success-message" role="status">{message}</p>}

        {showForm && <section className="form-card">
          <div className="section-heading"><div><p className="dashboard-eyebrow">{editing ? "MODIFICATION" : "NOUVEAU MEMBRE"}</p><h2>{editing ? "Modifier le personnel" : "Ajouter un membre"}</h2></div><button className="logout-button" type="button" onClick={() => setShowForm(false)}>Fermer</button></div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label>Prénom<input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} required /></label>
              <label>Nom<input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} required /></label>
              <label>E-mail<input type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm({...form, email: e.target.value})} required /></label>
              <label>Téléphone<input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></label>
              <label>Matricule<input value={form.matricule} onChange={(e) => setForm({...form, matricule: e.target.value})} /></label>
              <label>Fonction<input value={form.functionTitle} onChange={(e) => setForm({...form, functionTitle: e.target.value})} /></label>
              <label>Département<select value={form.departmentId} onChange={(e) => setForm({...form, departmentId: e.target.value})}><option value="">Sans département</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              <label>Mot de passe{editing && <small> Laisser vide pour conserver l’actuel</small>}<input type="password" minLength={8} value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required={!editing} /></label>
            </div>
            <div className="button-row"><button className="secondary-button" type="button" onClick={createDepartment}>+ Nouveau département</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le membre"}</button></div>
          </form>
        </section>}

        <section className="dashboard-actions">
          <div className="section-heading"><div><p className="dashboard-eyebrow">{users.length} MEMBRE(S)</p><h2>Liste du personnel</h2></div><input className="search-input" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          {loading ? <p className="dashboard-subtitle">Chargement…</p> : <div className="personnel-list">
            {filtered.length === 0 ? <p className="dashboard-subtitle">Aucun membre trouvé.</p> : filtered.map(user => <article className="personnel-row" key={user.id}>
              <div><strong>{user.firstName} {user.lastName}</strong><p>{user.email} {user.matricule ? `• ${user.matricule}` : ""}</p></div>
              <div><span>{user.functionTitle || "—"}</span><small>{user.department?.name || "Sans département"}</small></div>
              <span className={user.isActive ? "active-badge" : "inactive-badge"}>{user.isActive ? "Actif" : "Inactif"}</span>
              <div className="row-actions"><button type="button" onClick={() => openEdit(user)}>Modifier</button><button type="button" onClick={() => toggle(user)}>{user.isActive ? "Désactiver" : "Activer"}</button>{user.role === "USER" && <button type="button" onClick={() => remove(user)}>Supprimer</button>}</div>
            </article>)}
          </div>}
        </section>
      </div>
    </main>
  )
}
