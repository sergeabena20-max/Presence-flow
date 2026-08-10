import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { UpdateUserInput } from "@/lib/types";
import { requirePermission, requireSelfOrSuperAdmin, toApiError } from "@/lib/permissions";

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

// GET un utilisateur par ID — lui-même, ou SUPER_ADMIN/ADMIN avec MANAGE_USERS
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      await requireSelfOrSuperAdmin(params.id);
    } catch {
      await requirePermission("MANAGE_USERS");
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: USER_SELECT,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur récupéré avec succès",
      data: user,
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}

// PUT modifier un utilisateur — SUPER_ADMIN ou ADMIN avec MANAGE_USERS.
// Le Super Administrateur ne peut jamais être modifié via cette route.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requirePermission("MANAGE_USERS");

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (existingUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Le Super Administrateur ne peut pas être modifié" },
        { status: 403 }
      );
    }

    const body: UpdateUserInput = await request.json();

    if (body.role === "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Seul le Super Administrateur peut attribuer le rôle Administrateur" },
        { status: 403 }
      );
    }

    if (body.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Attribution du rôle Super Administrateur interdite" },
        { status: 403 }
      );
    }

    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: body.email } });
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: "Cet email est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    if (body.matricule && body.matricule !== existingUser.matricule) {
      const matriculeExists = await prisma.user.findUnique({ where: { matricule: body.matricule } });
      if (matriculeExists) {
        return NextResponse.json(
          { success: false, message: "Ce matricule est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {
      firstName: body.firstName ?? existingUser.firstName,
      lastName: body.lastName ?? existingUser.lastName,
      email: body.email ?? existingUser.email,
      phone: body.phone !== undefined ? body.phone : existingUser.phone,
      matricule: body.matricule ?? existingUser.matricule,
      role: body.role ?? existingUser.role,
      isActive: body.isActive !== undefined ? body.isActive : existingUser.isActive,
    };

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json(
          { success: false, message: "Le mot de passe doit contenir au moins 8 caractères" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: USER_SELECT,
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: updatedUser,
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}

// DELETE (soft delete: isActive = false) — SUPER_ADMIN ou ADMIN avec MANAGE_USERS
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("MANAGE_USERS");

    const user = await prisma.user.findUnique({ where: { id: params.id } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Le Super Administrateur ne peut pas être désactivé" },
        { status: 403 }
      );
    }

    const deletedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
      select: USER_SELECT,
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur désactivé avec succès",
      data: deletedUser,
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}
