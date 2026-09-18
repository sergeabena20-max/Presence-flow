import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import AdministrateursClient from "./administrateurs-client"

export default async function AdministrateursPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") redirect("/dashboard")
  return <AdministrateursClient />
}
