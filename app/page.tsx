import Link from "next/link"

const features = [
  {
    icon: "✓",
    title: "Pointage GPS",
    text: "Enregistrez les arrivées et départs avec une vérification de la position.",
  },
  {
    icon: "◷",
    title: "Suivi en temps réel",
    text: "Visualisez rapidement les présences, retards et absences de votre organisation.",
  },
  {
    icon: "▦",
    title: "Gestion du personnel",
    text: "Centralisez les collaborateurs, matricules, fonctions et départements au même endroit.",
  },
]

export default function Home() {
  return (
    <main className="landing-page">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />
      <div className="landing-shell">
        <nav className="landing-nav" aria-label="Navigation principale">
          <Link href="/" className="landing-brand">
            <span className="landing-brand-mark">P</span>
            <span>Presence-Flow</span>
          </Link>
          <Link href="/login" className="landing-login-link">
            Se connecter <span>→</span>
          </Link>
        </nav>

        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              Gestion intelligente des présences
            </div>
            <h1>Gérez les présences.<br /><span>Simplement.</span></h1>
            <p>
              Presence-Flow centralise le pointage et le suivi du personnel
              dans une interface moderne, claire et adaptée à votre organisation.
            </p>
            <div className="landing-actions">
              <Link href="/login" className="landing-primary-button">
                Accéder à mon espace <span>→</span>
              </Link>
              <a href="#fonctionnalites" className="landing-secondary-button">
                Découvrir la plateforme
              </a>
            </div>
            <div className="landing-trust">
              <span className="landing-check">✓</span>
              <span>Entreprises · Écoles · Hôpitaux · Administrations</span>
            </div>
          </div>

          <div className="landing-visual" aria-label="Aperçu du tableau de bord">
            <div className="landing-glow" />
            <div className="dashboard-preview">
              <div className="preview-topbar">
                <div className="preview-logo"><span>P</span> Presence-Flow</div>
                <div className="preview-avatar">A</div>
              </div>
              <div className="preview-heading">
                <div>
                  <small>TABLEAU DE BORD</small>
                  <strong>Bonjour, Administrateur</strong>
                </div>
                <span className="preview-status"><i /> Session active</span>
              </div>
              <div className="preview-stats">
                <div><small>Personnel actif</small><strong>124</strong><span>utilisateurs</span></div>
                <div><small>Présents</small><strong>108</strong><span>aujourd’hui</span></div>
                <div><small>Retards</small><strong>9</strong><span>aujourd’hui</span></div>
              </div>
              <div className="preview-panel">
                <div className="preview-panel-title"><strong>Activité du jour</strong><span>Voir tout →</span></div>
                <div className="preview-row"><span className="preview-person">JD</span><div><strong>Jean Dupont</strong><small>Développement</small></div><b className="preview-present">Présent</b><time>08:02</time></div>
                <div className="preview-row"><span className="preview-person">AM</span><div><strong>Anne Mballa</strong><small>Administration</small></div><b className="preview-late">En retard</b><time>08:24</time></div>
                <div className="preview-row"><span className="preview-person">PK</span><div><strong>Paul Kamga</strong><small>Comptabilité</small></div><b className="preview-present">Présent</b><time>07:55</time></div>
              </div>
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="landing-features">
          <div className="landing-section-heading">
            <small>UNE PLATEFORME PENSÉE POUR VOUS</small>
            <h2>Tout ce qu’il faut pour suivre les présences.</h2>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article className="landing-feature-card" key={feature.title}>
                <span className="landing-feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <small>PRESENCE-FLOW</small>
            <h2>Votre organisation mérite un suivi simple et efficace.</h2>
          </div>
          <Link href="/login" className="landing-primary-button">Se connecter <span>→</span></Link>
        </section>

        <footer className="landing-footer">
          <span>© {new Date().getFullYear()} Presence-Flow</span>
          <span>Gestion moderne des présences</span>
        </footer>
      </div>
    </main>
  )
}
