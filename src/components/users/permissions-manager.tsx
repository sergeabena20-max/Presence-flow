"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAdminPermissions } from "@/actions/permissions";
import type { PermissionName } from "@/lib/types";

interface AdminRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  permissions: PermissionName[];
}

const PERMISSION_LABELS: Record<PermissionName, string> = {
  MANAGE_USERS: "Gérer les utilisateurs",
  VIEW_ATTENDANCE: "Consulter l'historique des présences",
  MANAGE_SETTINGS: "Gérer les paramètres de l'établissement",
  VIEW_STATISTICS: "Consulter les statistiques",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionName[];

export function PermissionsManager({ initialAdmins }: { initialAdmins: AdminRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, Set<PermissionName>>>(
    Object.fromEntries(
      initialAdmins.map((a) => [a.id, new Set(a.permissions)])
    )
  );
  const [savedId, setSavedId] = useState<string | null>(null);

  function toggle(adminId: string, permission: PermissionName) {
    setDrafts((prev) => {
      const next = new Set(prev[adminId]);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return { ...prev, [adminId]: next };
    });
  }

  function save(adminId: string) {
    setSavedId(null);
    startTransition(async () => {
      const result = await setAdminPermissions(adminId, Array.from(drafts[adminId]));
      if (result.success) {
        setSavedId(adminId);
        router.refresh();
      }
    });
  }

  if (initialAdmins.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Permissions</h1>
        <p className="mt-4 text-sm text-slate-500">
          Aucun compte Administrateur pour le moment. Crée un administrateur
          depuis la page Utilisateurs pour pouvoir lui attribuer des
          permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Permissions des administrateurs</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ces permissions sont vérifiées côté serveur sur chaque action —
        décocher une case ici révoque immédiatement l&apos;accès correspondant.
      </p>

      <div className="mt-6 space-y-4">
        {initialAdmins.map((admin) => (
          <div
            key={admin.id}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {admin.firstName} {admin.lastName}
                </p>
                <p className="text-xs text-slate-500">{admin.email}</p>
              </div>
              {!admin.isActive && (
                <span className="rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-xs text-red-700 dark:text-red-400">
                  Inactif
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={drafts[admin.id]?.has(permission) ?? false}
                    onChange={() => toggle(admin.id, permission)}
                    className="h-4 w-4"
                  />
                  {PERMISSION_LABELS[permission]}
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => save(admin.id)}
                disabled={isPending}
                className="rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
              {savedId === admin.id && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Permissions mises à jour
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
