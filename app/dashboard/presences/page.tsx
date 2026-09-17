"use client"

import { useEffect, useMemo, useState } from "react"

type Attendance = {
  id: string
  status: "PRESENT" | "LATE" | "ABSENT"
  checkInAt: string | null
  checkOutAt: string | null
  checkInDistanceM: number | null
  checkOutDistanceM: number | null
  checkInAccuracyM: number | null
  verification: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    matricule: string | null
    functionTitle: string | null
    department: { name: string } | null
  }
}

function formatTime(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function formatDistance(value: number | null) {
  return value == null ? "—" : `${Math.round(value)} m`
}

function statusLabel(status: Attendance["status"]) {
  if (status === "LATE") return "En retard"
  if (status === "ABSENT") return "Absent"
  return "Présent"
}

export default function PresencesPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [date, setDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [pointing, setPointing] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function loadAttendances() {
    try {
      const response = await fetch("/api/attendance/today", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Impossible de charger les présences.")
      setAttendances(data.attendances ?? [])
      setDate(data.date ?? "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les présences.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAttendances() }, [])

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n’est pas disponible sur cet appareil."))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    })
  }

  async function handleAttendance() {
    setPointing(true)
    setMessage("")
    setError("")
    try {
      const position = await getPosition()
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Pointage refusé.")
        return
      }
      setMessage(`${data.message} Distance vérifiée : ${data.attendance.distanceM} m.`)
      await loadAttendances()
    } catch (err) {
      const geoError = err as GeolocationPositionError | Error
      if ("code" in geoError) {
        if (geoError.code === 1) setError("Autorisez la localisation pour pouvoir pointer votre présence.")
        else if (geoError.code === 2) setError("Position GPS indisponible. Vérifiez votre localisation et réessayez.")
        else setError("La récupération de votre position a pris trop de temps.")
      } else setError(geoError.message || "Une erreur est survenue.")
    } finally {
      setPointing(false)
    }
  }

  const stats = useMemo(() => ({
    total: attendances.length,
    present: attendances.filter((item) => item.status === "PRESENT").length,
    late: attendances.filter((item) => item.status === "LATE").length,
    closed: attendances.filter((item) => item.checkOutAt).length,
  }), [attendances])

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <a className="back-link" href="/dashboard">← Tableau de bord</a>
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">PRÉSENCES</p>
            <h1>Suivi des présences</h1>
            <p className="dashboard-subtitle">Pointages, arrivées, départs et vérification GPS de votre organisation.</p>
          </div>
          <button className="secondary-button" type="button" onClick={loadAttendances} disabled={loading}>↻ Actualiser</button>
        </header>

        <section className="stats-grid" aria-label="Résumé des présences">
          <article className="stat-card"><span>Pointages</span><strong>{stats.total}</strong><small>aujourd’hui</small></article>
          <article className="stat-card"><span>Présents</span><strong>{stats.present}</strong><small>à l’heure</small></article>
          <article className="stat-card"><span>Retards</span><strong>{stats.late}</strong><small>pointages en retard</small></article>
          <article className="stat-card"><span>Départs</span><strong>{stats.closed}</strong><small>journées clôturées</small></article>
        </section>

        <section className="form-card attendance-card">
          <div className="section-heading">
            <div>
              <p className="dashboard-eyebrow">JOURNÉE</p>
              <h2>{date ? date.split("-").reverse().join("/") : "Aujourd’hui"}</h2>
            </div>
            <span className="active-badge">GPS actif</span>
          </div>

          <div className="attendance-status">
            <span className="status-dot" />
            <div><strong>Pointage sécurisé par GPS</strong><p>La distance par rapport au lieu de l’organisation est vérifiée côté serveur.</p></div>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}

          <button className="primary-button attendance-button" type="button" onClick={handleAttendance} disabled={pointing}>
            {pointing ? "Vérification de la position…" : attendances[0]?.checkInAt && !attendances[0]?.checkOutAt ? "Enregistrer mon départ" : "Pointer mon arrivée"}
          </button>
        </section>

        <section className="dashboard-actions">
          <div className="section-heading"><div><p className="dashboard-eyebrow">POINTAGES</p><h2>Activité du jour</h2></div></div>
          {loading ? <div className="form-card"><p>Chargement des pointages…</p></div> : attendances.length === 0 ? (
            <div className="form-card"><h3>Aucun pointage aujourd’hui</h3><p className="dashboard-subtitle">Les pointages enregistrés apparaîtront ici.</p></div>
          ) : (
            <div className="personnel-list">
              {attendances.map((item) => (
                <article className="personnel-row" key={item.id}>
                  <div><strong>{item.user.firstName} {item.user.lastName}</strong><p>{item.user.matricule || item.user.email}{item.user.functionTitle ? ` · ${item.user.functionTitle}` : ""}</p></div>
                  <div><strong>{formatTime(item.checkInAt)}</strong><p>Arrivée · {formatDistance(item.checkInDistanceM)}</p></div>
                  <div><strong>{formatTime(item.checkOutAt)}</strong><p>Départ</p></div>
                  <div><span className={item.status === "LATE" ? "inactive-badge" : "active-badge"}>{statusLabel(item.status)}</span><p>{item.verification === "GPS_RADIUS" ? `GPS ±${Math.round(item.checkInAccuracyM ?? 0)} m` : "—"}</p></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
