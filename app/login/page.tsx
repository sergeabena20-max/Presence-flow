import { Suspense } from "react"
import LoginForm from "./login-form"

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page"><section className="login-card"><div className="brand-mark">PF</div><p className="eyebrow">PRESENCE-FLOW</p><h1>Bienvenue</h1><p className="subtitle">Chargement…</p></section></main>}>
      <LoginForm />
    </Suspense>
  )
}
