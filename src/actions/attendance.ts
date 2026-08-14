"use server";

import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/permissions";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

const ATTENDANCE_USER_SELECT = {
  select: { id: true, firstName: true, lastName: true, matricule: true },
} as const;

/**
 * Stats + listes pour le dashboard SUPER_ADMIN / ADMIN (section 11).
 * Réservé aux utilisateurs ayant VIEW_STATISTICS (SUPER_ADMIN l'a
 * toujours via requirePermission).
 */
export async function getDashboardStats() {
  await requirePermission("VIEW_STATISTICS");

  const today = startOfDay(new Date());

  const [relevantUsersCount, todaysAttendances, recentSignatures] = await Promise.all([
    prisma.user.count({
      where: { isActive: true, role: { in: ["EMPLOYEE", "STUDENT"] } },
    }),
    prisma.attendance.findMany({
      where: { date: today },
      include: { user: ATTENDANCE_USER_SELECT },
      orderBy: { arrivalTime: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        OR: [{ arrivalTime: { not: null } }, { departureTime: { not: null } }],
      },
      include: { user: ATTENDANCE_USER_SELECT },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const present = todaysAttendances.filter((a) => a.arrivalStatus === "PRESENT").length;
  const late = todaysAttendances.filter((a) => a.arrivalStatus === "LATE").length;
  const departures = todaysAttendances.filter((a) => a.departureTime).length;
  const signedIn = todaysAttendances.filter((a) => a.arrivalTime).length;
  // Absents = actifs (EMPLOYEE/STUDENT) sans présence aujourd'hui — jamais
  // stocké en base, calculé à la volée (section 10).
  const absent = Math.max(0, relevantUsersCount - signedIn);

  const signatures = recentSignatures.map((a) => {
    const isDeparture =
      !!a.departureTime && (!a.arrivalTime || a.departureTime > a.arrivalTime);
    return {
      id: a.id + (isDeparture ? "-dep" : "-arr"),
      user: a.user,
      type: isDeparture ? ("DEPART" as const) : ("ARRIVEE" as const),
      date: a.date,
      time: (isDeparture ? a.departureTime : a.arrivalTime) as Date,
    };
  });

  return {
    stats: { present, late, absent, departures, totalActive: relevantUsersCount },
    todaysAttendances,
    recentSignatures: signatures,
  };
}

/** Etat du jour pour l'utilisateur EMPLOYEE/STUDENT connecté. */
export async function getMyTodayAttendance() {
  const user = await requireUser();
  const today = startOfDay(new Date());

  return prisma.attendance.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });
}

/** Historique personnel récent (widget dashboard). */
export async function getMyRecentHistory(limit = 5) {
  const user = await requireUser();

  return prisma.attendance.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: limit,
  });
}

/**
 * Historique filtrable pour /attendance (section 12).
 * - EMPLOYEE / STUDENT : toujours limité à lui-même.
 * - SUPER_ADMIN ou ADMIN avec VIEW_ATTENDANCE : historique global.
 */
export async function getAttendanceHistory(params: {
  page?: number;
  search?: string;
  date?: string; // yyyy-mm-dd
}) {
  const user = await requireUser();

  const page = Math.max(1, params.page ?? 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  const isPrivileged = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  if (isPrivileged) {
    await requirePermission("VIEW_ATTENDANCE");

    if (params.search) {
      where.user = {
        OR: [
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
          { matricule: { contains: params.search, mode: "insensitive" } },
        ],
      };
    }
  } else {
    where.userId = user.id;
  }

  if (params.date) {
    where.date = startOfDay(new Date(params.date));
  }

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: { user: ATTENDANCE_USER_SELECT },
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    attendances,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    canSeeAll: isPrivileged,
  };
}
