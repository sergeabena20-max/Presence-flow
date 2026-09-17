"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  firstName: string
  organizationName: string
  workStartTime: string
  tolerance: number
  workEndTime: string
  allowedRadiusM: number
  checkInAt: string | null
  checkOutAt: string | null
  status: "PRESENT" | "LATE" | "ABSENT" | null
  distanceM: number | null
}

function formatTime(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("La géolocalisation n’est pas disponible sur cet appareil."))
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
  })
}

export default function UserAttendance(props: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const arrivalClosed = !props.checkInAt
  const departureReady = !!props.checkInAt && !props.checkOutAt

  async function point() {
    setLoading(true); setError(""); setMessage("")
    try {
      const position = await getPosition()
      const response = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error ?? "Pointage refusé."); return }
      setMessage(`${data.message} Distance vérifiée : ${data.attendance.distanceM} m.`)
      router.refresh()
    } catch (err) {
      const geoError = err as GeolocationPositionError | Error
      if ("code" in geoError) setError(geoError.code === 1 ? "Autorisez votre localisation pour pouvoir pointer." : geoError.code === 2 ? "Position GPS indisponible. Vérifiez votre localisation et réessayez." : "La récupération de votre position a pris trop de temps.")
      else setError(geoError.message || "Une erreur est survenue.")
    } finally { setLoading(false) }
  }

  const buttonLabel = departureReady ? "Marquer mon départ" : arrivalClosed ? "Marquer ma présence" : "Présence enregistrée"

  return <section className="user-presence-card">
    <div className="user-presence-top">
      <div><p className="dashboard-eyebrow">AUJOURD’HUI</p><h2>{new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", dateStyle: "full" }).format(new Date())}</h2></div>
      <span className="active-badge">GPS · {props.allowedRadiusM} m</span>
    </div>
    <p className="dashboard-subtitle">{props.organizationName} · Horaires : {props.workStartTime} · départ dès {props.workEndTime}.</p>

    <div className="user-presence-times">
      <div><small>ARRIVÉE</small><strong>{formatTime(props.checkInAt)}</strong>{props.status === "LATE" && <span className="inactive-badge">En retard</span>}</div>
      <div><small>DÉPART</small><strong>{formatTime(props.checkOutAt)}</strong></div>
      <div><small>DISTANCE</small><strong>{props.distanceM == null ? "—" : `${Math.round(props.distanceM)} m`}</strong></div>
    </div>

    {error && <p className="login-error" role="alert">{error}</p>}
    {message && <p className="success-message" role="status">{message}</p>}

    <button className="primary-button user-presence-button" type="button" onClick={point} disabled={loading || (!!props.checkOutAt) || (!props.checkInAt && false)}>
      {loading ? "Vérification de votre GPS…" : buttonLabel}
    </button>
    <p className="form-help">Arrivée : jusqu’à {props.workStartTime} + {props.tolerance} min. Après cette limite, l’arrivée est définitivement fermée. Départ : à partir de {props.workEndTime}.</p>
    <form action="/api/auth/logout" method="post"><button className="logout-button user-logout" type="submit">Déconnexion</button></form>
  </section>
}
