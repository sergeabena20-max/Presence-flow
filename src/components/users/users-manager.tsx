"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { createUser, updateUser, setUserActive } from "@/actions/users";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  matricule: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricule: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: UserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  matricule: "",
  password: "",
  role: "EMPLOYEE",
};

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  EMPLOYEE: "Employé",
  STUDENT: "Étudiant",
};

export function UsersManager({
  initialUsers,
  currentUserRole,
}: {
  initialUsers: UserRow[];
  currentUserRole: UserRole;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"none" | "create" | "edit">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canAssignAdmin = currentUserRole === "SUPER_ADMIN";

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage(null);
    setMode("create");
  }

  function openEdit(user: UserRow) {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "",
      matricule: user.matricule,
      password: "",
      role: user.role,
    });
    setEditingId(user.id);
    setMessage(null);
    setMode("edit");
  }

  function closeForm() {
    setMode("none");
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createUser({
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              phone: form.phone || undefined,
              matricule: form.matricule,
              password: form.password,
              role: form.role,
            })
          : await updateUser(editingId as string, {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              phone: form.phone || undefined,
              matricule: form.matricule,
              role: form.role,
              ...(form.password ? { password: form.password } : {}),
            });

      setMessage({ type: result.success ? "success" : "error", text: result.message });

      if (result.success) {
        router.refresh();
        closeForm();
      }
    });
  }

  function handleToggleActive(user: UserRow) {
    setMessage(null);
    startTransition(async () => {
      const result = await setUserActive(user.id, !user.isActive);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) router.refresh();
    });
  }

  const assignableRoles: UserRole[] = canAssignAdmin
    ? ["ADMIN", "EMPLOYEE", "STUDENT"]
    : ["EMPLOYEE", "STUDENT"];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <div className="flex items-center gap-2">
          {canAssignAdmin && (
            <Link
              href="/users/permissions"
              className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Gérer les permissions
            </Link>
          )}
          <button
            onClick={openCreate}
            className="rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:opacity-90"
          >
            + Nouvel utilisateur
          </button>
        </div>
      </div>

      {message && (
        <div
          className={
            message.type === "success"
              ? "mt-4 rounded-md bg-green-50 dark:bg-green-950 px-3 py-2 text-sm text-green-700 dark:text-green-400"
              : "mt-4 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-400"
          }
        >
          {message.text}
        </div>
      )}

      {mode !== "none" && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 max-w-xl"
        >
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Prénom</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nom</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Téléphone (optionnel)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Matricule</label>
              <input
                required
                value={form.matricule}
                onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Mot de passe {mode === "edit" && "(laisser vide pour ne pas changer)"}
            </label>
            <input
              type="password"
              required={mode === "create"}
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Rôle</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-left text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Matricule</th>
              <th className="px-4 py-2 font-medium">Rôle</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {initialUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Aucun utilisateur.
                </td>
              </tr>
            )}
            {initialUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.matricule}</td>
                <td className="px-4 py-2">{ROLE_LABELS[user.role]}</td>
                <td className="px-4 py-2">
                  {user.isActive ? (
                    <span className="rounded-full bg-green-100 dark:bg-green-950 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      Actif
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {user.role === "SUPER_ADMIN" ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={isPending}
                        className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline disabled:opacity-50"
                      >
                        {user.isActive ? "Désactiver" : "Réactiver"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
