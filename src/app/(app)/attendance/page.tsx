import Link from "next/link";
import { getAttendanceHistory } from "@/actions/attendance";

function formatTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR");
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; date?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const { attendances, total, totalPages, canSeeAll } = await getAttendanceHistory({
    page,
    search: params.search,
    date: params.date,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">
        {canSeeAll ? "Historique des présences" : "Mon historique"}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {total} enregistrement{total > 1 ? "s" : ""}
      </p>

      {canSeeAll && (
        <form method="get" className="mt-6 flex flex-wrap gap-3">
          <input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="Nom ou matricule"
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
          <input
            type="date"
            name="date"
            defaultValue={params.date}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:opacity-90"
          >
            Filtrer
          </button>
          {(params.search || params.date) && (
            <Link href="/attendance" className="flex items-center text-sm text-slate-500 hover:underline">
              Réinitialiser
            </Link>
          )}
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-left text-slate-500 dark:text-slate-400">
            <tr>
              {canSeeAll && <th className="px-4 py-2 font-medium">Nom</th>}
              {canSeeAll && <th className="px-4 py-2 font-medium">Matricule</th>}
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Arrivée</th>
              <th className="px-4 py-2 font-medium">Départ</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {attendances.length === 0 && (
              <tr>
                <td colSpan={canSeeAll ? 6 : 4} className="px-4 py-6 text-center text-slate-500">
                  Aucun enregistrement.
                </td>
              </tr>
            )}
            {attendances.map((a: any) => (
              <tr key={a.id}>
                {canSeeAll && <td className="px-4 py-2">{a.user.firstName} {a.user.lastName}</td>}
                {canSeeAll && <td className="px-4 py-2">{a.user.matricule}</td>}
                <td className="px-4 py-2">{formatDate(a.date)}</td>
                <td className="px-4 py-2">{formatTime(a.arrivalTime)}</td>
                <td className="px-4 py-2">{formatTime(a.departureTime)}</td>
                <td className="px-4 py-2">
                  {a.arrivalStatus === "PRESENT" && "Présent"}
                  {a.arrivalStatus === "LATE" && "Retard"}
                  {!a.arrivalStatus && "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const qs = new URLSearchParams();
            if (params.search) qs.set("search", params.search);
            if (params.date) qs.set("date", params.date);
            qs.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/attendance?${qs.toString()}`}
                className={`rounded-md px-3 py-1 ${
                  p === page
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
