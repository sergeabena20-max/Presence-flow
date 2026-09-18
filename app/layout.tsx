import type { Metadata } from "next"
import "./globals.css"
import ThemeToggle from "./theme-toggle"
import LanguageToggle from "./language-toggle"

export const metadata: Metadata = {
  title: "Presence-Flow",
  description: "Système de gestion des présences",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("presence-flow-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}})()` }} />
      </head>
      <body>
        <ThemeToggle />
        <LanguageToggle />
        {children}
      </body>
    </html>
  )
}
