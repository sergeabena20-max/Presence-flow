import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { firstName, lastName, role } = session.user;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Bonjour, {firstName} {lastName}
          </h1>
          <p className="text-sm text-slate-500">Rôle : {role}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Se déconnecter
          </button>
        </form>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Tableau de bord en construction — statistiques à venir.
      </p>
    </div>
  );
}
