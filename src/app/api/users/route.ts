import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { CreateUserInput } from "@/lib/types";
import { requirePermission, toApiError } from "@/lib/permissions";

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

// GET tous les utilisateurs — SUPER_ADMIN ou ADMIN avec MANAGE_USERS
export async function GET(request: NextRequest) {
  try {
    await requirePermission("MANAGE_USERS");

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "10"));
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { matricule: { contains: search, mode: "insensitive" } },
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

    return NextResponse.json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}

// POST créer un utilisateur — SUPER_ADMIN ou ADMIN avec MANAGE_USERS
// Impossible de créer un SUPER_ADMIN via cet endpoint.
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission("MANAGE_USERS");

    const body: CreateUserInput = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.password || !body.matricule) {
      return NextResponse.json(
        { success: false, message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const requestedRole = body.role || "EMPLOYEE";

    if (requestedRole === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Impossible de créer un second Super Administrateur" },
        { status: 403 }
      );
    }

    // Seul le SUPER_ADMIN peut créer des comptes ADMIN.
    if (requestedRole === "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Seul le Super Administrateur peut créer un compte Administrateur" },
        { status: 403 }
      );
    }

    const [existingEmail, existingMatricule] = await Promise.all([
      prisma.user.findUnique({ where: { email: body.email } }),
      prisma.user.findUnique({ where: { matricule: body.matricule } }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    if (existingMatricule) {
      return NextResponse.json(
        { success: false, message: "Ce matricule est déjà utilisé" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        matricule: body.matricule,
        password: hashedPassword,
        role: requestedRole,
        isActive: true,
      },
      select: USER_SELECT,
    });

    return NextResponse.json(
      { success: true, message: "Utilisateur créé avec succès", data: user },
      { status: 201 }
    );
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}
