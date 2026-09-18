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

const landingAnimationStyles = `
  .landing-page { min-height:100vh; }
  .hero-widget { position:absolute; z-index:4; display:flex; align-items:center; gap:10px; padding:12px 14px; border:1px solid rgba(255,255,255,.72); border-radius:15px; background:rgba(255,255,255,.82); backdrop-filter:blur(18px); box-shadow:0 18px 45px rgba(19,93,130,.15); color:#10233f; }
  .hero-widget b { display:block; font-size:10px; letter-spacing:.6px; }.hero-widget small { display:block; margin-top:3px; color:#718092; font-size:8px; }.hero-widget strong { color:#1597dc; font-size:16px; }
  .hero-widget-gps { top:48px; right:-35px; animation:pfWidgetGps 4.5s ease-in-out infinite; }.hero-widget-presence { bottom:72px; left:-48px; animation:pfWidgetPresence 5s ease-in-out infinite; }.hero-widget-users { top:205px; left:-62px; display:grid; grid-template-columns:auto 1fr; column-gap:8px; }.hero-widget-users b{font-size:25px; grid-row:span 2; color:#1597dc}.hero-widget-users span{font-size:8px;font-weight:800;letter-spacing:1px}.hero-widget-users small{margin:0;color:#079669}.widget-pulse{width:9px;height:9px;border-radius:50%;background:#12b981;box-shadow:0 0 0 6px rgba(18,185,129,.12);animation:pfDotPulse 1.7s infinite}.widget-mini-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:#e8f8f2;color:#079669;font-weight:900}
  @keyframes pfWidgetGps {0%,100%{transform:translateY(0) rotate(1deg)}50%{transform:translateY(-9px) rotate(-1deg)}}
  @keyframes pfWidgetPresence {0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(8px) rotate(1deg)}}
  .landing-hero-copy { position:relative; z-index:5; }
  .landing-hero h1 { text-shadow:0 8px 35px rgba(21,151,220,.08); }
  .landing-visual { perspective:1400px; }
  .dashboard-preview { transform-style:preserve-3d; }
  .dashboard-preview::before { content:""; position:absolute; inset:8px; border-radius:16px; border:1px solid rgba(72,185,238,.18); pointer-events:none; transform:translateZ(18px); }
  .landing-feature-card { transition:transform .35s ease,box-shadow .35s ease; }
  .landing-feature-card:hover { transform:translateY(-9px) rotateX(2deg); box-shadow:0 24px 55px rgba(20,83,120,.13); }

  .landing-nav { animation: pfNavIn .8s ease both; }
  .landing-hero-copy { animation: pfHeroIn .9s .08s ease both; }
  .landing-badge { animation: pfBadgeIn .7s .25s ease both, pfBadgePulse 3.2s 1s ease-in-out infinite; }
  .landing-badge-dot { animation: pfDotPulse 1.8s ease-in-out infinite; }
  .landing-visual { animation: pfVisualIn 1s .18s ease both; }
  .landing-glow { animation: pfGlow 5s ease-in-out infinite; }
  .dashboard-preview { animation: pfFloat 5s ease-in-out infinite; }
  .preview-status i { animation: pfDotPulse 1.8s ease-in-out infinite; }
  .landing-section-heading { animation: pfHeroIn .8s ease both; }
  .landing-feature-card { animation: pfCardIn .7s ease both; }
  .landing-feature-card:nth-child(2) { animation-delay: .12s; }
  .landing-feature-card:nth-child(3) { animation-delay: .24s; }
  .landing-cta { animation: pfHeroIn .8s ease both; }
  .landing-orb-one { animation: pfOrbOne 9s ease-in-out infinite; }
  .landing-orb-two { animation: pfOrbTwo 11s ease-in-out infinite; }
  .landing-primary-button:hover { animation: pfButtonGlow .8s ease-in-out infinite alternate; }
  .landing-feature-card:hover { transform: translateY(-7px); transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }

  @keyframes pfNavIn { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pfHeroIn { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pfVisualIn { from { opacity: 0; transform: translateX(38px) scale(.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
  @keyframes pfBadgeIn { from { opacity: 0; transform: scale(.9) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes pfBadgePulse { 0%,100% { box-shadow: 0 8px 24px rgba(20,83,120,.06); } 50% { box-shadow: 0 8px 32px rgba(21,151,220,.15); } }
  @keyframes pfDotPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .42; transform: scale(.72); } }
  @keyframes pfGlow { 0%,100% { opacity: .45; transform: scale(.92); } 50% { opacity: .9; transform: scale(1.1); } }
  @keyframes pfFloat { 0%,100% { transform: perspective(1000px) rotateY(-3deg) rotateX(2deg) translateY(0); } 50% { transform: perspective(1000px) rotateY(-3deg) rotateX(2deg) translateY(-11px); } }
  @keyframes pfCardIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pfOrbOne { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-38px,32px); } }
  @keyframes pfOrbTwo { 0%,100% { transform: translate(0,0); } 50% { transform: translate(34px,-28px); } }
  @keyframes pfButtonGlow { from { box-shadow: 0 14px 30px rgba(21,151,220,.2); } to { box-shadow: 0 18px 40px rgba(21,151,220,.36); } }

  @media (max-width: 700px) {
    .dashboard-preview { animation: pfFloatMobile 5s ease-in-out infinite; }
    @keyframes pfFloatMobile { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
  }

  @media (prefers-reduced-motion: reduce) {
    .landing-page *, .landing-page *::before, .landing-page *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  }
`

export default function Home() {
  return (
    <main className="landing-page">
      <style dangerouslySetInnerHTML={{ __html: landingAnimationStyles }} />
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
            <div className="hero-widget hero-widget-gps">
              <span className="widget-pulse" />
              <div><b>GPS ACTIF</b><small>Position vérifiée · 50 m</small></div>
            </div>
            <div className="hero-widget hero-widget-users">
              <b>124</b><div><span>PERSONNES</span><small>+8% ce mois</small></div>
            </div>
            <div className="hero-widget hero-widget-presence">
              <span className="widget-mini-icon">✓</span>
              <div><b>Présence enregistrée</b><small>Aujourd’hui · 08:02</small></div>
            </div>
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
