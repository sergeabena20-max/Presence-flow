"use client"

import { useEffect, useMemo, useState } from "react"

type Attendance = {
  id: string; status: "PRESENT"|"LATE"|"ABSENT"; checkInAt:string|null; checkOutAt:string|null
  checkInDistanceM:number|null; checkOutDistanceM:number|null; checkInAccuracyM:number|null; verification:string|null
  organization:{id:string;name:string}
  user:{id:string;firstName:string;lastName:string;email:string;matricule:string|null;functionTitle:string|null;department:{name:string}|null}
}
type Organization={id:string;name:string;type:string}

function formatTime(value:string|null){return value?new Intl.DateTimeFormat("fr-FR",{timeZone:"Africa/Douala",hour:"2-digit",minute:"2-digit"}).format(new Date(value)):"—"}
function formatDistance(value:number|null){return value==null?"—":`${Math.round(value)} m`}
function statusLabel(status:Attendance["status"]){return status==="LATE"?"En retard":status==="ABSENT"?"Absent":"Présent"}

export default function PresencesPage(){
  const [attendances,setAttendances]=useState<Attendance[]>([])
  const [organizations,setOrganizations]=useState<Organization[]>([])
  const [organizationId,setOrganizationId]=useState("")
  const [date,setDate]=useState("")
  const [role,setRole]=useState("")
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")

  async function loadAttendances(){
    setLoading(true);setError("")
    try{
      const query=new URLSearchParams()
      if(organizationId) query.set("organizationId",organizationId)
      if(date) query.set("date",date)
      const response=await fetch("/api/attendance/today?"+query.toString(),{cache:"no-store"})
      const data=await response.json()
      if(!response.ok)throw new Error(data.error||"Impossible de charger les présences.")
      setAttendances(data.attendances||[]);setOrganizations(data.organizations||[]);setRole(data.role||"");setDate(data.date||date)
    }catch(err){setError(err instanceof Error?err.message:"Impossible de charger les présences.")}finally{setLoading(false)}
  }
  useEffect(()=>{loadAttendances()},[organizationId])
  useEffect(()=>{if(date) loadAttendances()},[date])

  const stats=useMemo(()=>({total:attendances.length,present:attendances.filter(x=>x.status==="PRESENT").length,late:attendances.filter(x=>x.status==="LATE").length,closed:attendances.filter(x=>x.checkOutAt).length}),[attendances])
  const isSuper=role==="SUPER_ADMIN"

  return <main className="dashboard-page"><div className="dashboard-shell">
    <a className="back-link" href="/dashboard">← Tableau de bord</a>
    <header className="dashboard-header"><div><p className="dashboard-eyebrow">PRÉSENCES</p><h1>Suivi des présences</h1><p className="dashboard-subtitle">{isSuper?"Supervision des présences des organisations.":"Pointages, arrivées, départs et vérification GPS de votre organisation."}</p></div><button className="secondary-button" type="button" onClick={loadAttendances} disabled={loading}>↻ Actualiser</button></header>

    {isSuper&&<section className="form-card"><div className="form-grid">
      <label>Organisation<select value={organizationId} onChange={e=>setOrganizationId(e.target.value)}><option value="">Toutes les organisations</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name} · {o.type}</option>)}</select></label>
      <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
    </div><p className="form-help">Le Super Administrateur consulte les présences mais ne pointe pas et ne configure pas les horaires ou le GPS.</p></section>}
    {!isSuper&&<section className="form-card"><label>Date de consultation<input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label></section>}

    <section className="stats-grid" aria-label="Résumé des présences">
      <article className="stat-card"><span>Pointages</span><strong>{stats.total}</strong><small>{date||"aujourd’hui"}</small></article>
      <article className="stat-card"><span>Présents</span><strong>{stats.present}</strong><small>à l’heure</small></article>
      <article className="stat-card"><span>Retards</span><strong>{stats.late}</strong><small>pointages en retard</small></article>
      <article className="stat-card"><span>Départs</span><strong>{stats.closed}</strong><small>journées clôturées</small></article>
    </section>

    <section className="dashboard-actions"><div className="section-heading"><div><p className="dashboard-eyebrow">POINTAGES</p><h2>Activité du {date?date.split("-").reverse().join("/"):"jour"}</h2></div></div>
      {error&&<p className="login-error" role="alert">{error}</p>}
      {loading?<div className="form-card"><p>Chargement des pointages…</p></div>:attendances.length===0?<div className="form-card"><h3>Aucun pointage</h3><p className="dashboard-subtitle">Aucune présence enregistrée pour cette sélection.</p></div>:<div className="personnel-list">{attendances.map(item=><article className="personnel-row" key={item.id}>
        <div><strong>{item.user.firstName} {item.user.lastName}</strong><p>{item.user.matricule||item.user.email}{item.user.functionTitle?" · "+item.user.functionTitle:""}</p>{isSuper&&<small>{item.organization.name}</small>}</div>
        <div><strong>{formatTime(item.checkInAt)}</strong><p>Arrivée · {formatDistance(item.checkInDistanceM)}</p></div>
        <div><strong>{formatTime(item.checkOutAt)}</strong><p>Départ · {formatDistance(item.checkOutDistanceM)}</p></div>
        <div><span className={item.status==="LATE"?"inactive-badge":item.status==="ABSENT"?"inactive-badge":"active-badge"}>{statusLabel(item.status)}</span><p>{item.verification==="GPS_RADIUS"?`GPS ±${Math.round(item.checkInAccuracyM??0)} m`:"—"}</p></div>
      </article>)}</div>}
    </section>
  </div></main>
}
