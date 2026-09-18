"use client"

import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark")
  }, [])

  function toggle() {
    const next = document.documentElement.dataset.theme !== "dark"
    document.documentElement.dataset.theme = next ? "dark" : "light"
    localStorage.setItem("presence-flow-theme", next ? "dark" : "light")
    setDark(next)
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"} title={dark ? "Mode clair" : "Mode sombre"}>
      <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
      <b>{dark ? "Clair" : "Sombre"}</b>
    </button>
  )
}
