"use client"

import { useEffect, useState } from "react"

type Admin={id:string;organizationId:string;firstName:string;lastName:string;email:string;phone:string|null;isActive:boolean;createdAt:string;organization:{id:string;name:string;type:string}}
type Organization={id:string;name:string;type:string}
type Form={organizationId:string;firstName:string;lastName:string;email:string;phone:string;password:string}
const emptyForm:Form={organizationId:"",firstName:"",lastName:"",email:"",phone:"",password:""}

export default function AdministrateursPage(){
  const [admins,setAdmins]=useState<Admin[]>([]);const [organizations,setOrganizations]=useState<Organization[]>([])
  const [organizationId,setOrganizationId]=useState("");const [form,setForm]=useState<Form>(emptyForm);const [editing,setEditing]=useState<Admin|null>(null)
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("")

  async function load(){
    setLoading(true);setError("")
    try{
      const [ar,or]=await Promise.all([fetch("/api/admins"+(organizationId?"?organizationId="+encodeURIComponent(organizationId):""),{cache:"no-store"}),fetch("/api/organizations",{cache:"no-store"})])
      const ad=await ar.json();const od=await or.json()
      if(!ar.ok)throw new Error(ad.error||"Impossible de charger les administrateurs.")
      setAdmins(ad.admins||[]);if(or.ok)setOrganizations(od.organizations||[])
    }catch(e){setError(e instanceof Error?e.message:"Erreur de chargement.")}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[organizationId])

  function startEdit(a:Admin){setEditing(a);setForm({organizationId:a.organizationId,firstName:a.firstName,lastName:a.lastName,email:a.email,phone:a.phone||"",password:""});setError("");setMessage("")}
  function reset(){setEditing(null);setForm({...emptyForm,organizationId:organizationId});setError("");setMessage("")}

  async function save(e:React.FormEvent){
    e.preventDefault();setSaving(true);setError("");setMessage("")
    try{
      const endpoint=editing?"/api/admins/"+editing.id:"/api/admins"
      const body=editing?{firstName:form.firstName,lastName:form.lastName,phone:form.phone,password:form.password}:{...form}
      const r=await fetch(endpoint,{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Opération impossible.")
      setMessage(editing?"Administrateur modifié.":"Administrateur créé.");reset();await load()
    }catch(e){setError(e instanceof Error?e.message:"Une erreur est survenue.")}finally{setSaving(false)}
  }
  async function toggle(a:Admin){const r=await fetch("/api/admins/"+a.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive:!a.isActive})});const d=await r.json();if(!r.ok){setError(d.error||"Impossible de modifier le statut.");return}setMessage(a.isActive?"Administrateur désactivé.":"Administrateur activé.");await load()}
  async function remove(a:Admin){if(!window.confirm("Supprimer définitivement le compte de "+a.firstName+" "+a.lastName+" ?"))return;const r=await fetch("/api/admins/"+a.id,{method:"DELETE"});const d=await r.json();if(!r.ok){setError(d.error||"Impossible de supprimer.");return}setMessage("Administrateur supprimé.");await load()}

  return <main className="dashboard-page"><div className="dashboard-shell"><a className="back-link" href="/dashboard">← Tableau de bord</a>
    <header className="dashboard-header"><div><p className="dashboard-eyebrow">SUPERVISION</p><h1>Administrateurs</h1><p className="dashboard-subtitle">Le Super Administrateur gère les comptes administrateurs de toutes les organisations. Un administrateur gère uniquement son organisation.</p></div></header>
    {error&&<p className="login-error" role="alert">{error}</p>}{message&&<p className="success-message" role="status">{message}</p>}
    <section className="form-card"><div className="form-grid">
      <label>Filtrer par organisation<select value={organizationId} onChange={e=>setOrganizationId(e.target.value)}><option value="">Toutes les organisations</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name} · {o.type}</option>)}</select></label>
    </div></section>
    <section className="form-card"><p className="dashboard-eyebrow">{editing?"MODIFICATION":"NOUVEL ADMINISTRATEUR"}</p><h2>{editing?"Modifier le compte":"Ajouter un administrateur"}</h2>
      <form onSubmit={save}><div className="form-grid">
        {(!editing)&&<label>Organisation<select value={form.organizationId} onChange={e=>setForm({...form,organizationId:e.target.value})} required><option value="">Sélectionner…</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name} · {o.type}</option>)}</select></label>}
        <label>Prénom<input value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required/></label><label>Nom<input value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required/></label>
        <label>E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required disabled={!!editing}/></label><label>Téléphone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>{editing?"Nouveau mot de passe (facultatif)":"Mot de passe"}<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength={8} required={!editing}/></label>
      </div><div className="button-row"><button className="primary-button" disabled={saving}>{saving?"Enregistrement…":editing?"Enregistrer":"Créer l’administrateur"}</button>{editing&&<button type="button" className="secondary-button" onClick={reset}>Annuler</button>}</div></form>
    </section>
    <section className="dashboard-actions"><div className="section-heading"><div><p className="dashboard-eyebrow">{admins.length} COMPTE(S)</p><h2>Comptes administrateurs</h2></div></div>
      {loading?<p className="form-help">Chargement…</p>:<div className="personnel-list">{admins.length===0?<div className="form-card"><p>Aucun administrateur pour cette sélection.</p></div>:admins.map(a=><article className="personnel-row" key={a.id}>
        <div><strong>{a.firstName} {a.lastName}</strong><p>{a.email}{a.phone?" · "+a.phone:""}</p><small>{a.organization.name} · {a.organization.type}</small></div>
        <span className={a.isActive?"active-badge":"inactive-badge"}>{a.isActive?"Actif":"Inactif"}</span>
        <div className="row-actions"><button className="secondary-button" onClick={()=>startEdit(a)}>Modifier</button><button className="secondary-button" onClick={()=>toggle(a)}>{a.isActive?"Désactiver":"Activer"}</button><button className="danger-button" onClick={()=>remove(a)}>Supprimer</button></div>
      </article>)}</div>}
    </section>
  </div></main>
}
