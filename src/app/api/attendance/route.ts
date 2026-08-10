import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser, toApiError } from "@/lib/permissions";

// GET historique des présences.
// - EMPLOYEE / STUDENT : toujours limité à lui-même, quels que soient les filtres envoyés.
// - SUPER_ADMIN ou ADMIN avec VIEW_ATTENDANCE : historique global, avec filtres.
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search"); // nom ou matricule
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    const where: any = {};
    const isPrivileged = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

    if (isPrivileged) {
      await requirePermission("VIEW_ATTENDANCE");

      if (search) {
        where.user = {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { matricule: { contains: search, mode: "insensitive" } },
          ],
        };
      }
    } else {
      // Ne jamais faire confiance à un userId envoyé par le client.
      where.userId = user.id;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, matricule: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Historique récupéré avec succès",
      data: attendances,
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
