"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface NavItem {
  label: string;
  href: string;
}

function getNavItems(role: UserRole): NavItem[] {
  if (role === "SUPER_ADMIN") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Utilisateurs", href: "/users" },
      { label: "Présences", href: "/attendance" },
      { label: "Paramètres", href: "/settings" },
    ];
  }

  if (role === "ADMIN") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Utilisateurs", href: "/users" },
      { label: "Présences", href: "/attendance" },
    ];
  }

  return [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Ma présence", href: "/dashboard" },
    { label: "Mon historique", href: "/attendance" },
  ];
}

export function Sidebar({
  role,
  firstName,
  lastName,
}: {
  role: UserRole;
  firstName: string;
  lastName: string;
}) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="px-5 py-5">
        <p className="text-lg font-semibold tracking-tight">Presence-Flow</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4">
        <p className="text-sm font-medium">
          {firstName} {lastName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{role}</p>
      </div>
    </aside>
  );
}
