"use client"

import { useEffect, useState } from "react"

const RADII = [50, 100, 150, 200, 300, 500, 1000]
type Settings = { name: string; latitude: number | null; longitude: number | null; allowedRadiusM: number; workStartTime: string; checkInToleranceMinutes: number; workEndTime: string }

export default function ParametresPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [radius, setRadius] = useState("100")
  const [workStartTime, setWorkStartTime] = useState("08:00")
  const [tolerance, setTolerance] = useState("30")
  const [workEndTime, setWorkEndTime] = useState("17:00")
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/organizations/settings", { cache: "no-store" }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Impossible de charger les paramètres.")
      const organization = data.organization as Settings
      setSettings(organization); setLatitude(organization.latitude?.toString() ?? ""); setLongitude(organization.longitude?.toString() ?? ""); setRadius(organization.allowedRadiusM.toString()); setWorkStartTime(organization.workStartTime); setTolerance(organization.checkInToleranceMinutes.toString()); setWorkEndTime(organization.workEndTime)
    }).catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les paramètres.")).finally(() => setLoading(false))
  }, [])

  function useCurrentLocation() {
    setError(""); setMessage("")
    if (!navigator.geolocation) { setError("La géolocalisation n’est pas disponible sur cet appareil."); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition((position) => { setLatitude(position.coords.latitude.toFixed(6)); setLongitude(position.coords.longitude.toFixed(6)); setMessage("Position GPS récupérée. Vérifiez-la puis enregistrez."); setLocating(false) }, (positionError) => { setError(positionError.code === 1 ? "Autorisez la localisation pour récupérer la position actuelle." : positionError.code === 2 ? "Position GPS indisponible. Vérifiez votre localisation et réessayez." : "La récupération de la position a pris trop de temps."); setLocating(false) }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("")
    const lat = Number(latitude), lng = Number(longitude), radiusValue = Number(radius), toleranceValue = Number(tolerance)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) { setError("Veuillez saisir une latitude valide."); setSaving(false); return }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) { setError("Veuillez saisir une longitude valide."); setSaving(false); return }
    try {
      const response = await fetch("/api/organizations/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: lat, longitude: lng, allowedRadiusM: radiusValue, workStartTime, checkInToleranceMinutes: toleranceValue, workEndTime }) })
      const data = await response.json()
      if (!response.ok) { setError(data.error ?? "Impossible d’enregistrer les paramètres."); return }
      setSettings(data.organization); setMessage("Paramètres enregistrés avec succès.")
    } catch { setError("Erreur réseau. Réessayez dans quelques instants.") } finally { setSaving(false) }
  }

  if (loading) return <main className="dashboard-page"><div className="dashboard-shell narrow-shell"><p className="dashboard-eyebrow">PARAMÈTRES</p><h1>Chargement…</h1></div></main>

  return <main className="dashboard-page"><div className="dashboard-shell narrow-shell">
    <a className="back-link" href="/dashboard">← Tableau de bord</a>
    <section className="form-card">
      <p className="dashboard-eyebrow">PARAMÈTRES DE L’ORGANISATION</p><h1>Lieu et horaires de pointage</h1>
      <p className="dashboard-subtitle">Ces règles sont appliquées à tous les utilisateurs de votre organisation.</p>
      {settings && <div className="attendance-status"><span className="status-dot" /><div><strong>{settings.name}</strong><p>GPS vérifié côté serveur · horaires en heure du Cameroun.</p></div></div>}
      {error && <p className="login-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
      <form onSubmit={saveSettings}>
        <div className="form-grid">
          <label>Latitude<input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required /></label>
          <label>Longitude<input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required /></label>
        </div>
        <button className="secondary-button" type="button" onClick={useCurrentLocation} disabled={locating || saving}>{locating ? "Récupération du GPS…" : "Utiliser ma position actuelle"}</button>
        <div className="form-grid">
          <label>Heure de début<input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} required /></label>
          <label>Délai de tolérance<input type="number" min="0" max="180" value={tolerance} onChange={(e) => setTolerance(e.target.value)} required /><small>Ex. 30 min : arrivée autorisée jusqu’à 08:30.</small></label>
          <label>Heure de départ<input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} required /><small>Le départ devient disponible à cette heure.</small></label>
          <label>Rayon autorisé<select value={radius} onChange={(e) => setRadius(e.target.value)} disabled={saving}>{RADII.map(value => <option key={value} value={value}>{value} mètres</option>)}</select></label>
        </div>
        <p className="form-help">Exemple : début 08:00 + tolérance 30 min = arrivée possible jusqu’à 08:30. Après 08:30, l’arrivée est refusée. Le départ est disponible à partir de 17:00.</p>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer les paramètres"}</button>
      </form>
    </section>
  </div></main>
}
