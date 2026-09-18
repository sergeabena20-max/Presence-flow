"use client"

import { useEffect, useState } from "react"

const translations: Record<string, string> = {
  "Navigation principale":"Main navigation","Se connecter":"Log in","Gestion intelligente des présences":"Smart attendance management",
  "Gérez les présences.":"Manage attendance.","Simplement.":"Simply.","Accéder à mon espace":"Access my space","Découvrir la plateforme":"Discover the platform",
  "Entreprises · Écoles · Hôpitaux · Administrations":"Companies · Schools · Hospitals · Administrations",
  "Pointage GPS":"GPS attendance","Suivi en temps réel":"Real-time tracking","Gestion du personnel":"Personnel management",
  "Enregistrez les arrivées et départs avec une vérification de la position.":"Record arrivals and departures with location verification.",
  "Visualisez rapidement les présences, retards et absences de votre organisation.":"Quickly view attendance, lateness and absences in your organization.",
  "Centralisez les collaborateurs, matricules, fonctions et départements au même endroit.":"Centralize employees, IDs, roles and departments in one place.",
  "Tableau de bord":"Dashboard","Vue d’ensemble de votre gestion des présences.":"Overview of your attendance management.",
  "Session active":"Active session","Super Administrateur":"Super Administrator","Organisations":"Organizations",
  "Administrateurs actifs":"Active administrators","Pointages aujourd’hui":"Today's check-ins","Accès rapides":"Quick access",
  "Créer, superviser et supprimer les organisations.":"Create, supervise and delete organizations.",
  "Gérer les comptes administrateurs.":"Manage administrator accounts.","Consulter les pointages.":"View attendance records.",
  "Paramètres":"Settings","Configurer le GPS et les horaires.":"Configure GPS and schedules.",
  "Personnel actif":"Active personnel","Présents":"Present","Retards":"Late","Absents":"Absent",
  "employés / utilisateurs":"employees / users","pointages à l’heure":"on-time check-ins","pointages en retard":"late check-ins","sans pointage aujourd’hui":"no check-in today",
  "Suivi des présences":"Attendance tracking","personne(s) ont déjà pointé aujourd’hui.":"person(s) have already checked in today.",
  "Déconnexion":"Log out","Présence enregistrée":"Attendance recorded","GPS ACTIF":"GPS ACTIVE","Position vérifiée · 50 m":"Location verified · 50 m",
  "PERSONNES":"PEOPLE","Aujourd’hui · 08:02":"Today · 08:02","Activité du jour":"Today's activity","Voir tout →":"View all →",
  "Bonjour, Administrateur":"Hello, Administrator","Présent":"Present","En retard":"Late",
  "Bienvenue":"Welcome","Chargement…":"Loading…","Créer mon compte":"Create my account",
  "Type d’organisation *":"Organization type *","Nom de l’organisation *":"Organization name *","Prénom *":"First name *","Nom *":"Last name *",
  "E-mail *":"Email *","Téléphone":"Phone","Matricule / identifiant":"ID / identifier","Classe *":"Class *","Fonction / profil":"Role / profile",
  "Mot de passe *":"Password *","Confirmer le mot de passe *":"Confirm password *","Créer l’administrateur":"Create administrator",
  "Modifier":"Edit","Supprimer":"Delete","Actif":"Active","Inactif":"Inactive","Désactiver":"Deactivate","Activer":"Activate",
  "Aucun administrateur pour cette sélection.":"No administrator for this selection.",
  "Filtrer par organisation":"Filter by organization","Toutes les organisations":"All organizations",
  "Ajouter un administrateur":"Add an administrator","NOUVEL ADMINISTRATEUR":"NEW ADMINISTRATOR","MODIFICATION":"EDIT",
  "Comptes administrateurs":"Administrator accounts","SUPERVISION":"SUPERVISION",
  "Entreprise":"Company","École":"School","Hôpital":"Hospital","Administration":"Administration","Autre":"Other",
  "Élève / étudiant : indiquez votre classe et votre matricule.":"Student: enter your class and ID.",
  "Indiquez votre fonction ou votre poste dans l’entreprise.":"Enter your role or position in the company.",
  "Indiquez votre fonction et, si utile, votre service.":"Enter your role and, if useful, your department.",
  "Indiquez votre fonction, service ou profil.":"Enter your role, department or profile.",
  "Saisissez le nom de votre organisation. Sa validation sera effectuée par un administrateur.":"Enter your organization's name. It will be validated by an administrator.",
  "Votre demande sera vérifiée avant l’activation de votre compte.":"Your request will be reviewed before your account is activated.",
  "Annuler":"Cancel","Enregistrement…":"Saving…","Envoi de la demande…":"Sending request…",
  "Le Super Administrateur gère les comptes administrateurs de toutes les organisations. Un administrateur gère uniquement son organisation.":"The Super Administrator manages administrator accounts for all organizations. An administrator only manages their own organization.",
  "Gérer les utilisateurs inscrits.":"Manage registered users.","Administrateurs":"Administrators","Présences":"Attendance",
}

const reverse = Object.fromEntries(Object.entries(translations).map(([fr,en]) => [en,fr]))

function translate(root: ParentNode, toEnglish: boolean) {
  const map = toEnglish ? translations : reverse
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) nodes.push(node as Text)
  for (const text of nodes) {
    const value = text.nodeValue?.trim()
    if (!value) continue
    const translated = map[value]
    if (translated) text.nodeValue = text.nodeValue!.replace(value, translated)
  }
  document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((el) => {
    const value = el.getAttribute("placeholder")
    if (value && map[value]) el.setAttribute("placeholder", map[value])
  })
}

export default function LanguageToggle() {
  const [english, setEnglish] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("presence-flow-language")
    const isEnglish = saved === "en"
    setEnglish(isEnglish)
    document.documentElement.lang = isEnglish ? "en" : "fr"
    if (isEnglish) translate(document.body, true)

    const observer = new MutationObserver(() => {
      if (document.documentElement.lang === "en") translate(document.body, true)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  function toggle() {
    const next = !english
    setEnglish(next)
    localStorage.setItem("presence-flow-language", next ? "en" : "fr")
    document.documentElement.lang = next ? "en" : "fr"
    translate(document.body, next)
  }

  return (
    <button type="button" className="language-toggle" onClick={toggle} aria-label={nextLabel(english)}>
      <span>{english ? "EN" : "FR"}</span>
      <span>{english ? "English" : "Français"}</span>
    </button>
  )
}

function nextLabel(english: boolean) {
  return english ? "Passer en français" : "Switch to English"
}
