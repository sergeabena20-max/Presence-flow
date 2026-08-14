import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getDashboardStats, getMyTodayAttendance, getMyRecentHistory } from "@/actions/attendance";
import { AttendanceSigner } from "@/components/attendance/attendance-signer";

function formatTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR");
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { firstName, lastName, role } = session.user;
  const isPrivileged = role === "SUPER_ADMIN" || role === "ADMIN";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bonjour, {firstName} {lastName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(new Date())} · Rôle : {role}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Se déconnecter
          </button>
        </form>
      </div>

      <div className="mt-8">
        {isPrivileged ? <AdminDashboard /> : <PersonalDashboard />}
      </div>
    </div>
  );
}

async function AdminDashboard() {
  let data;
  try {
    data = await getDashboardStats();
  } catch {
    return (
      <div className="rounded-md bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Vous n'avez pas la permission de consulter les statistiques (VIEW_STATISTICS).
      </div>
    );
  }

  const { stats, todaysAttendances, recentSignatures } = data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Présents" value={stats.present} accent="text-green-600 dark:text-green-400" />
        <StatCard label="Retardataires" value={stats.late} accent="text-amber-600 dark:text-amber-400" />
        <StatCard label="Absents" value={stats.absent} accent="text-red-600 dark:text-red-400" />
        <StatCard label="Départs enregistrés" value={stats.departures} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Présences du jour</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-left text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Utilisateur</th>
                <th className="px-4 py-2 font-medium">Matricule</th>
                <th className="px-4 py-2 font-medium">Arrivée</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Départ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {todaysAttendances.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Aucune présence signée aujourd'hui.
                  </td>
                </tr>
              )}
              {todaysAttendances.map((a: any) => (
                <tr key={a.id}>
                  <td className="px-4 py-2">{a.user.firstName} {a.user.lastName}</td>
                  <td className="px-4 py-2">{a.user.matricule}</td>
                  <td className="px-4 py-2">{formatTime(a.arrivalTime)}</td>
                  <td className="px-4 py-2">
                    {a.arrivalStatus === "PRESENT" && (
                      <span className="rounded-full bg-green-100 dark:bg-green-950 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">Présent</span>
                    )}
                    {a.arrivalStatus === "LATE" && (
                      <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">Retard</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{formatTime(a.departureTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Dernières signatures</h2>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
          {recentSignatures.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Aucune signature récente.</p>
          )}
          {recentSignatures.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{s.user.firstName} {s.user.lastName}</p>
                <p className="text-xs text-slate-500">{s.user.matricule}</p>
              </div>
              <div className="text-right">
                <p className={s.type === "ARRIVEE" ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"}>
                  {s.type === "ARRIVEE" ? "Arrivée" : "Départ"}
                </p>
                <p className="text-xs text-slate-500">{formatDate(s.date)} · {formatTime(s.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function PersonalDashboard() {
  const [today, history] = await Promise.all([
    getMyTodayAttendance(),
    getMyRecentHistory(5),
  ]);

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Statut du jour</p>
          <p className="mt-1 font-medium">
            {today?.arrivalStatus === "PRESENT" && "Présent"}
            {today?.arrivalStatus === "LATE" && "Retard"}
            {!today?.arrivalStatus && "Non signé"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Heure d'arrivée</p>
          <p className="mt-1 font-medium">{formatTime(today?.arrivalTime)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Heure de départ</p>
          <p className="mt-1 font-medium">{formatTime(today?.departureTime)}</p>
        </div>
      </div>

      <AttendanceSigner initialAttendance={today} />

      <div>
        <h2 className="text-lg font-semibold mb-3">Historique personnel récent</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-left text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Arrivée</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Départ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Aucun historique.</td>
                </tr>
              )}
              {history.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2">{formatDate(a.date)}</td>
                  <td className="px-4 py-2">{formatTime(a.arrivalTime)}</td>
                  <td className="px-4 py-2">
                    {a.arrivalStatus === "PRESENT" && "Présent"}
                    {a.arrivalStatus === "LATE" && "Retard"}
                    {!a.arrivalStatus && "—"}
                  </td>
                  <td className="px-4 py-2">{formatTime(a.departureTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
