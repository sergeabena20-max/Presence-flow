import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function getDoualaDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Douala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function getTodayDate() {
  return new Date(`${getDoualaDateKey()}T00:00:00.000Z`)
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) redirect("/login")
  if (session.mustChangePassword) redirect("/dashboard/changer-mot-de-passe")

  const isSuperAdmin = session.role === "SUPER_ADMIN"
  const today = getTodayDate()

  if (isSuperAdmin) {
    const [organizationCount, personnelCount, attendanceCount] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count({ where: { role: "USER", isActive: true } }),
      prisma.attendance.count({ where: { attendanceDate: today, checkInAt: { not: null } } }),
    ])

    return (
      <main className="dashboard-page">
        <div className="dashboard-shell">
          <DashboardHeader />
          <section className="dashboard-welcome">
            <div><span className="status-dot" /><span>Session active</span></div>
            <strong>Super Administrateur</strong>
          </section>
          <section className="stats-grid" aria-label="Statistiques de la plateforme">
            <StatCard label="Organisations" value={organizationCount} detail="organisations enregistrées" />
            <StatCard label="Personnel actif" value={personnelCount} detail="utilisateurs actifs" />
            <StatCard label="Pointages aujourd’hui" value={attendanceCount} detail="pointages enregistrés" />
          </section>
          <QuickActions isSuperAdmin />
        </div>
      </main>
    )
  }

  if (!session.organizationId) redirect("/login")

  const organizationId = session.organizationId
  const [organization, personnelCount, attendances] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } }),
    prisma.user.count({ where: { organizationId, role: "USER", isActive: true } }),
    prisma.attendance.findMany({
      where: { organizationId, attendanceDate: today },
      select: { status: true, checkInAt: true, checkOutAt: true },
    }),
  ])

  if (!organization) redirect("/login")

  const presentCount = attendances.filter((item) => item.checkInAt && item.status === "PRESENT").length
  const lateCount = attendances.filter((item) => item.checkInAt && item.status === "LATE").length
  const checkedInCount = attendances.filter((item) => item.checkInAt).length
  const absentCount = Math.max(personnelCount - checkedInCount, 0)

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <DashboardHeader />
        <section className="dashboard-welcome">
          <div><span className="status-dot" /><span>Session active</span></div>
          <strong>{organization.name}</strong>
        </section>
        <section className="stats-grid" aria-label="Statistiques de présence">
          <StatCard label="Personnel actif" value={personnelCount} detail="employés / utilisateurs" />
          <StatCard label="Présents" value={presentCount} detail="pointages à l’heure" />
          <StatCard label="Retards" value={lateCount} detail="pointages en retard" />
          <StatCard label="Absents" value={absentCount} detail="sans pointage aujourd’hui" />
        </section>
        <section className="dashboard-actions">
          <div className="section-heading">
            <div>
              <p className="dashboard-eyebrow">AUJOURD’HUI</p>
              <h2>Suivi des présences</h2>
              <p className="dashboard-subtitle">{checkedInCount} personne(s) ont déjà pointé aujourd’hui.</p>
            </div>
          </div>
        </section>
        <QuickActions isSuperAdmin={false} />
      </div>
    </main>
  )
}

function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-eyebrow">PRESENCE-FLOW</p>
        <h1>Tableau de bord</h1>
        <p className="dashboard-subtitle">Vue d’ensemble de votre gestion des présences.</p>
      </div>
      <form action="/api/auth/logout" method="post">
        <button className="logout-button" type="submit">Déconnexion</button>
      </form>
    </header>
  )
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function QuickActions({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return (
    <section className="dashboard-actions">
      <div className="section-heading">
        <div><p className="dashboard-eyebrow">GESTION</p><h2>Accès rapides</h2></div>
      </div>
      <div className="action-grid">
        {isSuperAdmin && <a className="action-card" href="/dashboard/organisations"><span className="action-icon">⌘</span><div><strong>Organisations</strong><p>Créer et gérer les organisations.</p></div><span>→</span></a>}
        {!isSuperAdmin && <a className="action-card" href="/dashboard/administrateurs"><span className="action-icon">♙</span><div><strong>Administrateurs</strong><p>Gérer les comptes administrateurs de votre organisation.</p></div><span>→</span></a>}
        <a className="action-card" href="/dashboard/personnel"><span className="action-icon">♙</span><div><strong>Personnel</strong><p>Gérer les utilisateurs de votre espace.</p></div><span>→</span></a>
        <a className="action-card" href="/dashboard/presences"><span className="action-icon">✓</span><div><strong>Présences</strong><p>Consulter les pointages et l’historique.</p></div><span>→</span></a>
        <a className="action-card" href="/dashboard/parametres"><span className="action-icon">⚙</span><div><strong>Paramètres</strong><p>Configurer le lieu et la géolocalisation.</p></div><span>→</span></a>
      </div>
    </section>
  )
}
