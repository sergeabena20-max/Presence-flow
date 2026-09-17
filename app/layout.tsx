import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Presence-Flow",
  description: "Système de gestion des présences",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
