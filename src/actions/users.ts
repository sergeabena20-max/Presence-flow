"use server";

import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import type { CreateUserInput, UpdateUserInput } from "@/lib/types";

export interface ActionResult {
  success: boolean;
  message: string;
}

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  matricule: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers(params: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) {
  await requirePermission("MANAGE_USERS");

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, params.limit ?? 10);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.role) where.role = params.role;
  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { matricule: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  try {
    const currentUser = await requirePermission("MANAGE_USERS");

    if (!input.firstName || !input.lastName || !input.email || !input.password || !input.matricule) {
      return { success: false, message: "Champs requis manquants" };
    }

    if (input.password.length < 8) {
      return { success: false, message: "Le mot de passe doit contenir au moins 8 caractères" };
    }

    const requestedRole = input.role || "EMPLOYEE";

    if (requestedRole === "SUPER_ADMIN") {
      return { success: false, message: "Impossible de créer un second Super Administrateur" };
    }

    if (requestedRole === "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return { success: false, message: "Seul le Super Administrateur peut créer un compte Administrateur" };
    }

    const [existingEmail, existingMatricule] = await Promise.all([
      prisma.user.findUnique({ where: { email: input.email } }),
      prisma.user.findUnique({ where: { matricule: input.matricule } }),
    ]);

    if (existingEmail) return { success: false, message: "Cet email est déjà utilisé" };
    if (existingMatricule) return { success: false, message: "Ce matricule est déjà utilisé" };

    const hashedPassword = await bcrypt.hash(input.password, 10);

    await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        matricule: input.matricule,
        password: hashedPassword,
        role: requestedRole,
        isActive: true,
      },
    });

    revalidatePath("/users");
    return { success: true, message: "Utilisateur créé avec succès" };
  } catch (error) {
    console.error("createUser error:", error);
    return { success: false, message: "Une erreur est survenue" };
  }
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<ActionResult> {
  try {
    const currentUser = await requirePermission("MANAGE_USERS");

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return { success: false, message: "Utilisateur introuvable" };

    if (existingUser.role === "SUPER_ADMIN") {
      return { success: false, message: "Le Super Administrateur ne peut pas être modifié" };
    }

    if (input.role === "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return { success: false, message: "Seul le Super Administrateur peut attribuer le rôle Administrateur" };
    }

    if (input.role === "SUPER_ADMIN") {
      return { success: false, message: "Attribution du rôle Super Administrateur interdite" };
    }

    if (input.email && input.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: input.email } });
      if (emailExists) return { success: false, message: "Cet email est déjà utilisé" };
    }

    if (input.matricule && input.matricule !== existingUser.matricule) {
      const matriculeExists = await prisma.user.findUnique({ where: { matricule: input.matricule } });
      if (matriculeExists) return { success: false, message: "Ce matricule est déjà utilisé" };
    }

    const updateData: any = {
      firstName: input.firstName ?? existingUser.firstName,
      lastName: input.lastName ?? existingUser.lastName,
      email: input.email ?? existingUser.email,
      phone: input.phone !== undefined ? input.phone : existingUser.phone,
      matricule: input.matricule ?? existingUser.matricule,
      role: input.role ?? existingUser.role,
    };

    if (input.password) {
      if (input.password.length < 8) {
        return { success: false, message: "Le mot de passe doit contenir au moins 8 caractères" };
      }
      updateData.password = await bcrypt.hash(input.password, 10);
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });

    revalidatePath("/users");
    return { success: true, message: "Utilisateur mis à jour avec succès" };
  } catch (error) {
    console.error("updateUser error:", error);
    return { success: false, message: "Une erreur est survenue" };
  }
}

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requirePermission("MANAGE_USERS");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Utilisateur introuvable" };

    if (user.role === "SUPER_ADMIN") {
      return { success: false, message: "Le Super Administrateur ne peut pas être désactivé" };
    }

    await prisma.user.update({ where: { id: userId }, data: { isActive } });

    revalidatePath("/users");
    return {
      success: true,
      message: isActive ? "Utilisateur réactivé avec succès" : "Utilisateur désactivé avec succès",
    };
  } catch (error) {
    console.error("setUserActive error:", error);
    return { success: false, message: "Une erreur est survenue" };
  }
}

export async function canManageUsers(): Promise<boolean> {
  try {
    await requirePermission("MANAGE_USERS");
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentUserRole() {
  const user = await requireUser();
  return user.role;
}
