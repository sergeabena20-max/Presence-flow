import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) redirect("/login")

  const organizationCount =
    session.role === "SUPER_ADMIN"
      ? await prisma.organization.count()
      : 0

  const personnelCount = session.organizationId
    ? await prisma.user.count({
        where: { organizationId: session.organizationId, isActive: true },
      })
    : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const attendanceCount = session.organizationId
    ? await prisma.attendance.count({
        where: {
          organizationId: session.organizationId,
          attendanceDate: today,
        },
      })
    : 0

  const isSuperAdmin = session.role === "SUPER_ADMIN"

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">PRESENCE-FLOW</p>
            <h1>Tableau de bord</h1>
            <p className="dashboard-subtitle">
              Vue d’ensemble de votre plateforme de gestion des présences.
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button className="logout-button" type="submit">
              Déconnexion
            </button>
          </form>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span className="status-dot" />
            <span>Session active</span>
          </div>
          <strong>
            {isSuperAdmin ? "Super Administrateur" : "Espace organisation"}
          </strong>
        </section>

        <section className="stats-grid" aria-label="Statistiques">
          {isSuperAdmin && (
            <article className="stat-card">
              <span>Organisations</span>
              <strong>{organizationCount}</strong>
              <small>organisations enregistrées</small>
            </article>
          )}

          <article className="stat-card">
            <span>Personnel actif</span>
            <strong>{personnelCount}</strong>
            <small>utilisateurs actifs</small>
          </article>

          <article className="stat-card">
            <span>Présences aujourd’hui</span>
            <strong>{attendanceCount}</strong>
            <small>enregistrements du jour</small>
          </article>
        </section>

        <section className="dashboard-actions">
          <div className="section-heading">
            <div>
              <p className="dashboard-eyebrow">GESTION</p>
              <h2>Accès rapides</h2>
            </div>
          </div>

          <div className="action-grid">
            {isSuperAdmin && (
              <a className="action-card" href="/dashboard/organisations">
                <span className="action-icon">⌘</span>
                <div>
                  <strong>Organisations</strong>
                  <p>Créer et gérer les organisations.</p>
                </div>
                <span>→</span>
              </a>
            )}

            <a className="action-card" href="/dashboard/personnel">
              <span className="action-icon">♙</span>
              <div>
                <strong>Personnel</strong>
                <p>Gérer les utilisateurs de votre espace.</p>
              </div>
              <span>→</span>
            </a>

            <a className="action-card" href="/dashboard/presences">
              <span className="action-icon">✓</span>
              <div>
                <strong>Présences</strong>
                <p>Consulter les présences et pointages.</p>
              </div>
              <span>→</span>
            </a>

            <a className="action-card" href="/dashboard/parametres">
              <span className="action-icon">⚙</span>
              <div>
                <strong>Paramètres</strong>
                <p>Configurer votre espace et la géolocalisation.</p>
              </div>
              <span>→</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
