"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import type { PermissionName } from "@/lib/types";

export interface ActionResult {
  success: boolean;
  message: string;
}

const ALL_PERMISSIONS: PermissionName[] = [
  "MANAGE_USERS",
  "VIEW_ATTENDANCE",
  "MANAGE_SETTINGS",
  "VIEW_STATISTICS",
];

/**
 * Liste tous les comptes ADMIN avec leurs permissions actuelles.
 * Réservé au SUPER_ADMIN.
 */
export async function listAdminsWithPermissions() {
  await requireRole("SUPER_ADMIN");

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      permissions: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return admins.map((admin: (typeof admins)[number]) => ({
    ...admin,
    permissions: admin.permissions.map((p: { name: string }) => p.name) as PermissionName[],
  }));
}

/**
 * Remplace entièrement l'ensemble des permissions d'un administrateur par
 * la liste fournie. Réservé au SUPER_ADMIN. Vérifie que la cible est bien
 * un ADMIN (jamais un SUPER_ADMIN, EMPLOYEE ou STUDENT).
 */
export async function setAdminPermissions(
  targetUserId: string,
  permissions: PermissionName[]
): Promise<ActionResult> {
  try {
    await requireRole("SUPER_ADMIN");

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });

    if (!target) {
      return { success: false, message: "Utilisateur introuvable" };
    }

    if (target.role !== "ADMIN") {
      return {
        success: false,
        message: "Les permissions ne s'appliquent qu'aux comptes Administrateur",
      };
    }

    const validPermissions = permissions.filter((p) => ALL_PERMISSIONS.includes(p));

    await prisma.$transaction([
      prisma.permission.deleteMany({ where: { userId: targetUserId } }),
      prisma.permission.createMany({
        data: validPermissions.map((name) => ({ userId: targetUserId, name })),
      }),
    ]);

    revalidatePath("/users");
    return { success: true, message: "Permissions mises à jour avec succès" };
  } catch (error) {
    console.error("setAdminPermissions error:", error);
    return { success: false, message: "Une erreur est survenue" };
  }
}
