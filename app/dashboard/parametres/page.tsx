"use client"

import { useEffect, useState } from "react"

const RADII = [50, 100, 150, 200, 300, 500, 1000]

type Settings = {
  name: string
  latitude: number | null
  longitude: number | null
  allowedRadiusM: number
}

export default function ParametresPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [radius, setRadius] = useState("100")
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/organizations/settings", {
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok) {
          setError(data.error ?? "Impossible de charger les paramètres.")
          return
        }

        const organization = data.organization as Settings
        setSettings(organization)
        setLatitude(organization.latitude?.toString() ?? "")
        setLongitude(organization.longitude?.toString() ?? "")
        setRadius(organization.allowedRadiusM.toString())
      } catch {
        setError("Impossible de charger les paramètres.")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  function useCurrentLocation() {
    setError("")
    setMessage("")

    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas disponible sur cet appareil.")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        setMessage("Position GPS récupérée. Vérifiez-la puis enregistrez.")
        setLocating(false)
      },
      (positionError) => {
        if (positionError.code === 1) {
          setError("Autorisez la localisation pour récupérer la position actuelle.")
        } else if (positionError.code === 2) {
          setError("Position GPS indisponible. Vérifiez votre localisation et réessayez.")
        } else {
          setError("La récupération de la position a pris trop de temps.")
        }
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    const lat = Number(latitude)
    const lng = Number(longitude)
    const radiusValue = Number(radius)

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError("Veuillez saisir une latitude valide.")
      setSaving(false)
      return
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError("Veuillez saisir une longitude valide.")
      setSaving(false)
      return
    }

    try {
      const response = await fetch("/api/organizations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          allowedRadiusM: radiusValue,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Impossible d’enregistrer les paramètres.")
        return
      }

      const organization = data.organization as Settings
      setSettings(organization)
      setMessage("Paramètres enregistrés avec succès.")
    } catch {
      setError("Erreur réseau. Réessayez dans quelques instants.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-shell narrow-shell">
          <p className="dashboard-eyebrow">PARAMÈTRES</p>
          <h1>Chargement…</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell narrow-shell">
        <a className="back-link" href="/dashboard">← Tableau de bord</a>

        <section className="form-card">
          <p className="dashboard-eyebrow">PARAMÈTRES DE L’ORGANISATION</p>
          <h1>Lieu de pointage</h1>
          <p className="dashboard-subtitle">
            Configurez le lieu de référence et le rayon dans lequel vos utilisateurs pourront pointer leur présence.
          </p>

          {settings && (
            <div className="attendance-status">
              <span className="status-dot" />
              <div>
                <strong>{settings.name}</strong>
                <p>La vérification GPS sera effectuée côté serveur.</p>
              </div>
            </div>
          )}

          {error && <p className="login-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}

          <form onSubmit={saveSettings}>
            <div className="form-grid">
              <label>
                Latitude
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  placeholder="3.8480"
                  required
                />
              </label>

              <label>
                Longitude
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  placeholder="11.5021"
                  required
                />
              </label>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={useCurrentLocation}
              disabled={locating || saving}
            >
              {locating ? "Récupération du GPS…" : "Utiliser ma position actuelle"}
            </button>

            <label>
              Rayon autorisé
              <select
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
                disabled={saving}
              >
                {RADII.map((value) => (
                  <option key={value} value={value}>
                    {value} mètres
                  </option>
                ))}
              </select>
            </label>

            <p className="form-help">
              Exemple : avec un rayon de 100 m, le pointage est accepté uniquement si la position GPS se trouve à 100 mètres maximum du lieu configuré.
            </p>

            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
