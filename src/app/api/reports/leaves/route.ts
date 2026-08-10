import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET leave statistics and reports
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const reportType = searchParams.get("reportType") || "summary"; // summary, detailed, byType, byStatus

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
      where.startDate = dateFilter;
    }

    if (reportType === "summary") {
      // Get summary statistics
      const totalLeaves = await prisma.leave.count({ where });

      const statusDistribution = await prisma.leave.groupBy({
        by: ["status"],
        where,
        _count: true,
      });

      const typeDistribution = await prisma.leave.groupBy({
        by: ["leaveType"],
        where,
        _count: true,
      });

      const totalDays = await prisma.leave.findMany({
        where,
        select: {
          startDate: true,
          endDate: true,
        },
      });

      const totalLeavesDays = totalDays.reduce((sum, leave) => {
        const days = Math.ceil(
          (new Date(leave.endDate).getTime() -
            new Date(leave.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);

      const stats = {
        totalLeaves,
        totalLeavesDays,
        statusDistribution: statusDistribution.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        typeDistribution: typeDistribution.map((item) => ({
          type: item.leaveType,
          count: item._count,
        })),
      };

      return NextResponse.json({
        success: true,
        message: "Leave summary retrieved successfully",
        data: stats,
      });
    }

    if (reportType === "detailed") {
      // Get detailed leave records
      const leaves = await prisma.leave.findMany({
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
        orderBy: { startDate: "desc" },
        take: 1000,
      });

      const leavesWithDays = leaves.map((leave) => ({
        ...leave,
        durationDays: Math.ceil(
          (new Date(leave.endDate).getTime() -
            new Date(leave.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }));

      return NextResponse.json({
        success: true,
        message: "Detailed leave report retrieved successfully",
        data: leavesWithDays,
      });
    }

    if (reportType === "byType") {
      // Get statistics by leave type
      const leavesByType = await prisma.leave.groupBy({
        by: ["leaveType", "status"],
        where,
        _count: true,
        _sum: {
          id: true,
        },
      });

      const leaves = await prisma.leave.findMany({
        where,
        select: {
          leaveType: true,
          startDate: true,
          endDate: true,
        },
      });

      const leavesByTypeWithDays = leaves.reduce(
        (acc: any, leave) => {
          if (!acc[leave.leaveType]) {
            acc[leave.leaveType] = {
              type: leave.leaveType,
              count: 0,
              totalDays: 0,
              leaves: [],
            };
          }
          const days = Math.ceil(
            (new Date(leave.endDate).getTime() -
              new Date(leave.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          acc[leave.leaveType].count += 1;
          acc[leave.leaveType].totalDays += days;
          return acc;
        },
        {}
      );

      return NextResponse.json({
        success: true,
        message: "Leave statistics by type retrieved successfully",
        data: Object.values(leavesByTypeWithDays),
      });
    }

    if (reportType === "byStatus") {
      // Get statistics by status
      const leavesByStatus = await prisma.leave.groupBy({
        by: ["status"],
        where,
        _count: true,
      });

      const statusStats = await Promise.all(
        leavesByStatus.map(async (status) => {
          const leaves = await prisma.leave.findMany({
            where: {
              ...where,
              status: status.status,
            },
            select: {
              startDate: true,
              endDate: true,
            },
          });

          const totalDays = leaves.reduce((sum, leave) => {
            const days = Math.ceil(
              (new Date(leave.endDate).getTime() -
                new Date(leave.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0);

          return {
            status: status.status,
            count: status._count,
            totalDays,
          };
        })
      );

      return NextResponse.json({
        success: true,
        message: "Leave statistics by status retrieved successfully",
        data: statusStats,
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
    console.error("Error generating leave report:", error);
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
