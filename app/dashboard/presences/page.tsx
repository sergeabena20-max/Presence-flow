"use client"

import { useState } from "react"

export default function PresencesPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n’est pas disponible sur cet appareil."))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })
  }

  async function handleAttendance() {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const position = await getPosition()
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Pointage refusé.")
        return
      }

      setMessage(`${data.message} Distance vérifiée : ${data.attendance.distanceM} m.`)
    } catch (err) {
      const geoError = err as GeolocationPositionError | Error
      if ("code" in geoError) {
        if (geoError.code === 1) setError("Autorisez la localisation pour pouvoir pointer votre présence.")
        else if (geoError.code === 2) setError("Position GPS indisponible. Vérifiez votre localisation et réessayez.")
        else setError("La récupération de votre position a pris trop de temps.")
      } else {
        setError(geoError.message || "Une erreur est survenue.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell narrow-shell">
        <a className="back-link" href="/dashboard">← Tableau de bord</a>
        <section className="form-card attendance-card">
          <p className="dashboard-eyebrow">PRÉSENCE</p>
          <h1>Pointer ma présence</h1>
          <p className="dashboard-subtitle">
            Votre position GPS sera vérifiée par rapport au lieu configuré par votre organisation.
          </p>

          <div className="attendance-status">
            <span className="status-dot" />
            <div>
              <strong>Vérification GPS</strong>
              <p>Autorisez la localisation lorsque votre navigateur le demande.</p>
            </div>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}

          <button className="primary-button attendance-button" type="button" onClick={handleAttendance} disabled={loading}>
            {loading ? "Vérification de la position…" : "Pointer maintenant"}
          </button>

          <p className="form-help">
            Le système ne valide le pointage que si vous êtes dans le rayon autorisé.
          </p>
        </section>
      </div>
    </main>
  )
}
