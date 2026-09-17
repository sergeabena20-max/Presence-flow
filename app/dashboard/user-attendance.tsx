"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = { organizationName: string; workStartTime: string; tolerance: number; workEndTime: string; allowedRadiusM: number; checkInAt: string | null; checkOutAt: string | null; status: "PRESENT" | "LATE" | "ABSENT" | null; distanceM: number | null }

function formatTime(value: string | null) { return value ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—" }
function getPosition(): Promise<GeolocationPosition> { return new Promise((resolve, reject) => { if (!navigator.geolocation) return reject(new Error("La géolocalisation n’est pas disponible sur cet appareil.")); navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }) }) }

export default function UserAttendance(props: Props) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("")
  const departureReady = !!props.checkInAt && !props.checkOutAt

  async function point() {
    setLoading(true); setError(""); setMessage("")
    try {
      const position = await getPosition()
      const response = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error ?? "Pointage refusé."); return }
      setMessage(`${data.message} Distance vérifiée : ${data.attendance.distanceM} m.`); router.refresh()
    } catch (err) {
      const geoError = err as GeolocationPositionError | Error
      if ("code" in geoError) setError(geoError.code === 1 ? "Autorisez votre localisation pour pouvoir pointer." : geoError.code === 2 ? "Position GPS indisponible. Vérifiez votre localisation et réessayez." : "La récupération de votre position a pris trop de temps.")
      else setError(geoError.message || "Une erreur est survenue.")
    } finally { setLoading(false) }
  }

  return <section className="form-card">
    <div className="section-heading"><div><p className="dashboard-eyebrow">AUJOURD’HUI</p><h2>{new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", dateStyle: "full" }).format(new Date())}</h2></div><span className="active-badge">GPS · {props.allowedRadiusM} m</span></div>
    <p className="dashboard-subtitle">{props.organizationName} · Début {props.workStartTime} · départ dès {props.workEndTime}.</p>
    <div className="attendance-status"><span className="status-dot" /><div><strong>Localisation obligatoire pour le pointage</strong><p>Votre position est vérifiée côté serveur par rapport au rayon configuré par votre administrateur.</p></div></div>
    <div className="stats-grid" style={{ marginTop: 16 }}><article className="stat-card"><span>Arrivée</span><strong>{formatTime(props.checkInAt)}</strong><small>{props.status === "LATE" ? "En retard" : "Pointage"}</small></article><article className="stat-card"><span>Départ</span><strong>{formatTime(props.checkOutAt)}</strong><small>{props.checkOutAt ? "Enregistré" : `Disponible dès ${props.workEndTime}`}</small></article><article className="stat-card"><span>Distance</span><strong>{props.distanceM == null ? "—" : `${Math.round(props.distanceM)} m`}</strong><small>par rapport au site</small></article></div>
    {error && <p className="login-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
    <button className="primary-button" type="button" onClick={point} disabled={loading || !!props.checkOutAt}>{loading ? "Vérification de votre GPS…" : departureReady ? "Marquer mon départ" : props.checkInAt ? "Présence enregistrée" : "Marquer ma présence"}</button>
    <p className="form-help">Arrivée : jusqu’à {props.workStartTime} + {props.tolerance} min. Après cette limite, l’arrivée est définitivement fermée. Départ : à partir de {props.workEndTime}. Un pointage enregistré ne peut pas être annulé.</p>
    <form action="/api/auth/logout" method="post"><button className="logout-button" type="submit">Déconnexion</button></form>
  </section>
}
