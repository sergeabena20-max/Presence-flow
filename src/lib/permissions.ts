import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PermissionName, SessionUser } from "@/lib/types";

/**
 * Levée quand une requête doit être rejetée. Les route handlers l'attrapent
 * et la transforment en NextResponse appropriée.
 */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Retourne l'utilisateur authentifié et actif courant, ou lève une erreur.
 * TOUJOURS dériver l'utilisateur courant depuis la session serveur — ne
 * jamais faire confiance à un id envoyé par le client.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user) {
    throw new AuthError("Non authentifié", 401);
  }

  if (!session.user.isActive) {
    throw new AuthError("Compte désactivé", 403);
  }

  return session.user;
}

/**
 * Exige que l'utilisateur courant ait l'un des rôles donnés.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    throw new AuthError("Accès refusé : rôle insuffisant", 403);
  }

  return user;
}

/**
 * Exige que l'utilisateur courant soit SUPER_ADMIN, ou un ADMIN possédant
 * la permission donnée. SUPER_ADMIN passe toujours. Les permissions sont
 * vérifiées en base, jamais depuis le client.
 */
export async function requirePermission(
  permission: PermissionName
): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  if (user.role !== "ADMIN") {
    throw new AuthError("Accès refusé : rôle insuffisant", 403);
  }

  const hasPermission = await prisma.permission.findUnique({
    where: {
      userId_name: {
        userId: user.id,
        name: permission,
      },
    },
  });

  if (!hasPermission) {
    throw new AuthError(
      `Accès refusé : permission ${permission} requise`,
      403
    );
  }

  return user;
}

/**
 * Exige que l'utilisateur courant soit exactement l'utilisateur ciblé, ou
 * SUPER_ADMIN. Utilisé pour qu'un utilisateur ne puisse signer sa présence
 * ou modifier son profil que pour lui-même.
 */
export async function requireSelfOrSuperAdmin(
  targetUserId: string
): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN" || user.id === targetUserId) {
    return user;
  }

  throw new AuthError("Accès refusé", 403);
}

/**
 * Convertit une AuthError (ou une erreur inconnue) en réponse JSON pour les
 * route handlers :
 *
 *   try {
 *     const user = await requireRole("SUPER_ADMIN");
 *     ...
 *   } catch (error) {
 *     const { status, body } = toApiError(error);
 *     return NextResponse.json(body, { status });
 *   }
 */
export function toApiError(error: unknown): {
  status: number;
  body: { success: false; message: string };
} {
  if (error instanceof AuthError) {
    return { status: error.status, body: { success: false, message: error.message } };
  }

  console.error("Unexpected error:", error);
  return {
    status: 500,
    body: { success: false, message: "Une erreur interne est survenue" },
  };
}
