"use client"

import { useEffect, useState } from "react"

type Member = { id:string; role:"ADMIN"|"USER"; firstName:string; lastName:string; email:string; phone:string|null; isActive:boolean; createdAt:string }
type Organization = { id:string; name:string; type:string; phone:string|null; email:string|null; address:string|null; createdAt:string; users:Member[]; _count:{attendances:number} }

export default function OrganisationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [organization,setOrganization]=useState<Organization|null>(null)
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [message,setMessage]=useState("")

  async function load(){
    setLoading(true); setError("")
    try { const {id}=await params; const r=await fetch("/api/organizations/"+id,{cache:"no-store"}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Impossible de charger l’organisation."); setOrganization(d.organization) }
    catch(e){setError(e instanceof Error?e.message:"Erreur de chargement.")} finally{setLoading(false)}
  }
  useEffect(()=>{load()},[])

  async function removeUser(user:Member){
    if(!window.confirm("Supprimer définitivement ce compte ?")) return
    const r=await fetch("/api/users/"+user.id,{method:"DELETE"}); const d=await r.json()
    if(!r.ok){setError(d.error||"Suppression impossible.");return}
    setMessage("Compte supprimé."); await load()
  }
  async function removeAdmin(user:Member){
    if(!window.confirm("Supprimer définitivement cet administrateur ?")) return
    const r=await fetch("/api/admins/"+user.id,{method:"DELETE"}); const d=await r.json()
    if(!r.ok){setError(d.error||"Suppression impossible.");return}
    setMessage("Administrateur supprimé."); await load()
  }
  async function removeOrganization(){
    if(!organization) return
    if(!window.confirm("Supprimer définitivement « "+organization.name+" » et toutes ses données ?")) return
    const r=await fetch("/api/organizations/"+organization.id,{method:"DELETE"}); const d=await r.json()
    if(!r.ok){setError(d.error||"Suppression impossible.");return}
    window.location.href="/dashboard/organisations"
  }

  if(loading) return <main className="dashboard-page"><div className="dashboard-shell narrow-shell"><p className="dashboard-eyebrow">ORGANISATION</p><h1>Chargement…</h1></div></main>
  if(!organization) return <main className="dashboard-page"><div className="dashboard-shell"><a className="back-link" href="/dashboard/organisations">← Organisations</a><p className="login-error">{error||"Organisation introuvable."}</p></div></main>

  const admins=organization.users.filter(u=>u.role==="ADMIN"), users=organization.users.filter(u=>u.role==="USER")
  return <main className="dashboard-page"><div className="dashboard-shell">
    <a className="back-link" href="/dashboard/organisations">← Organisations</a>
    <header className="dashboard-header"><div><p className="dashboard-eyebrow">SUPERVISION</p><h1>{organization.name}</h1><p className="dashboard-subtitle">{organization.type} · {admins.length} administrateur(s) · {users.length} utilisateur(s) · {organization._count.attendances} présence(s)</p></div><button className="danger-button" onClick={removeOrganization}>Supprimer l’organisation</button></header>
    {error&&<p className="login-error" role="alert">{error}</p>}{message&&<p className="success-message" role="status">{message}</p>}
    <section className="dashboard-actions"><div className="section-heading"><div><p className="dashboard-eyebrow">COMPTES</p><h2>Administrateurs</h2><p className="dashboard-subtitle">Le Super Administrateur peut superviser et supprimer les comptes administrateurs.</p></div></div>
      <div className="personnel-list">{admins.length===0?<div className="form-card"><p>Aucun administrateur.</p></div>:admins.map(u=><article className="personnel-row" key={u.id}><div><strong>{u.firstName} {u.lastName}</strong><p>{u.email}{u.phone?" · "+u.phone:""}</p></div><span className={u.isActive?"active-badge":"inactive-badge"}>{u.isActive?"Actif":"Inactif"}</span><button className="danger-button" onClick={()=>removeAdmin(u)}>Supprimer</button></article>)}</div>
    </section>
    <section className="dashboard-actions"><div className="section-heading"><div><p className="dashboard-eyebrow">UTILISATEURS</p><h2>Personnel</h2><p className="dashboard-subtitle">Consultation et suppression uniquement. Les paramètres GPS et horaires restent sous le contrôle de l’administrateur de l’organisation.</p></div></div>
      <div className="personnel-list">{users.length===0?<div className="form-card"><p>Aucun utilisateur.</p></div>:users.map(u=><article className="personnel-row" key={u.id}><div><strong>{u.firstName} {u.lastName}</strong><p>{u.email}{u.phone?" · "+u.phone:""}</p></div><span className={u.isActive?"active-badge":"inactive-badge"}>{u.isActive?"Actif":"Inactif"}</span><button className="danger-button" onClick={()=>removeUser(u)}>Supprimer</button></article>)}</div>
    </section>
  </div></main>
}
