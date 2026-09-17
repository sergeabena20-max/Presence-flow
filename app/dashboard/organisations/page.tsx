import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function OrganisationsPage() {
  const session = await getSession()

  if (!session) redirect("/login")
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard")

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, attendances: true } } },
  })

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <a className="back-link" href="/dashboard">← Tableau de bord</a>
            <p className="dashboard-eyebrow">ADMINISTRATION</p>
            <h1>Organisations</h1>
            <p className="dashboard-subtitle">
              Gérez les organisations qui utilisent Presence-Flow.
            </p>
          </div>
          <a className="primary-button" href="/dashboard/organisations/nouvelle">
            + Nouvelle organisation
          </a>
        </header>

        <section className="table-card">
          <div className="table-header">
            <h2>Organisations enregistrées</h2>
            <span>{organizations.length} organisation(s)</span>
          </div>

          {organizations.length === 0 ? (
            <div className="empty-state">
              <strong>Aucune organisation</strong>
              <p>Commencez par créer votre première organisation.</p>
            </div>
          ) : (
            <div className="organization-list">
              {organizations.map((organization) => (
                <article className="organization-row" key={organization.id}>
                  <div>
                    <strong>{organization.name}</strong>
                    <span>{organization.type}</span>
                  </div>
                  <div className="organization-meta">
                    <span>{organization._count.users} utilisateur(s)</span>
                    <span>{organization._count.attendances} présence(s)</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
