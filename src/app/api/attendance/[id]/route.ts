import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission, toApiError } from "@/lib/permissions";

// GET une présence — le propriétaire, ou SUPER_ADMIN/ADMIN avec VIEW_ATTENDANCE.
// Volontairement en lecture seule : les présences ne sont jamais modifiées à la main.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, matricule: true } },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: "Présence introuvable" },
        { status: 404 }
      );
    }

    const isOwner = attendance.userId === user.id;
    if (!isOwner) {
      await requirePermission("VIEW_ATTENDANCE");
    }

    return NextResponse.json({
      success: true,
      message: "Présence récupérée avec succès",
      data: attendance,
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}
