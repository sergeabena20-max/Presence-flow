import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET attendance statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const reportType = searchParams.get("reportType") || "summary"; // summary, detailed, monthly

    const where: any = {};
    const dateFilter: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }

    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    if (reportType === "summary") {
      // Get summary statistics
      const totalRecords = await prisma.attendance.count({ where });

      const statusDistribution = await prisma.attendance.groupBy({
        by: ["arrivalStatus"],
        where,
        _count: true,
      });

      const userAttendance = await prisma.attendance.findMany({
        where,
        select: {
          userId: true,
          arrivalStatus: true,
          arrivalTime: true,
        },
        orderBy: { date: "desc" },
        take: 100,
      });

      const stats = {
        totalRecords,
        statusDistribution: statusDistribution.map((item) => ({
          status: item.arrivalStatus,
          count: item._count,
        })),
        averageArrivalTime: calculateAverageArrivalTime(userAttendance),
      };

      return NextResponse.json({
        success: true,
        message: "Attendance summary retrieved successfully",
        data: stats,
      });
    }

    if (reportType === "detailed") {
      // Get detailed attendance records
      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              matricule: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: 1000,
      });

      return NextResponse.json({
        success: true,
        message: "Detailed attendance report retrieved successfully",
        data: attendances,
      });
    }

    if (reportType === "monthly") {
      // Get monthly statistics
      const monthlyData = await prisma.attendance.groupBy({
        by: ["date"],
        where,
        _count: true,
      });

      const monthlyStats = monthlyData.reduce(
        (acc: any, item: any) => {
          const month = new Date(item.date).toISOString().split("T")[0];
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += item._count;
          return acc;
        },
        {}
      );

      return NextResponse.json({
        success: true,
        message: "Monthly attendance statistics retrieved successfully",
        data: monthlyStats,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid report type",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error generating attendance report:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate report",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate average arrival time
function calculateAverageArrivalTime(
  attendances: any[]
): string | null {
  const validTimes = attendances
    .filter((a) => a.arrivalTime)
    .map((a) => {
      const time = new Date(a.arrivalTime);
      return time.getHours() * 60 + time.getMinutes();
    });

  if (validTimes.length === 0) return null;

  const average =
    validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
  const hours = Math.floor(average / 60);
  const minutes = Math.floor(average % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}
