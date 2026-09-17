import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function NewOrganizationPage() {
  const session = await getSession()

  if (!session) redirect("/login")
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard")

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell narrow-shell">
        <a className="back-link" href="/dashboard/organisations">← Organisations</a>
        <section className="form-card">
          <p className="dashboard-eyebrow">NOUVELLE ORGANISATION</p>
          <h1>Créer une organisation</h1>
          <p className="dashboard-subtitle">
            Les champs seront reliés à la base de données à l’étape suivante.
          </p>

          <div className="form-grid">
            <label>
              Nom de l’organisation
              <input placeholder="Ex. Entreprise ABC" />
            </label>
            <label>
              Type
              <select defaultValue="COMPANY">
                <option value="COMPANY">Entreprise</option>
                <option value="SCHOOL">École</option>
                <option value="HOSPITAL">Hôpital</option>
                <option value="ADMINISTRATION">Administration</option>
                <option value="OTHER">Autre</option>
              </select>
            </label>
            <label>
              Téléphone
              <input placeholder="6 XX XX XX XX" />
            </label>
            <label>
              E-mail
              <input type="email" placeholder="contact@organisation.com" />
            </label>
            <label className="full-width">
              Adresse
              <input placeholder="Adresse de l’organisation" />
            </label>
          </div>

          <button className="primary-button" type="button" disabled>
            Enregistrer l’organisation
          </button>
        </section>
      </div>
    </main>
  )
}
