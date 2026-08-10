import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaveDTO, CreateLeaveInput, PaginatedResponse } from "@/lib/types";

// GET all leaves with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const leaveType = searchParams.get("leaveType");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.leave.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Leaves retrieved successfully",
      data: leaves,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    } as PaginatedResponse<any>);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leaves",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST create new leave request
export async function POST(request: NextRequest) {
  try {
    const body: CreateLeaveInput = await request.json();

    // Validate input
    if (!body.userId || !body.leaveType || !body.startDate || !body.endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);

    if (start > end) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date must be before end date",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Check for overlapping leaves
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        userId: body.userId,
        status: { in: ["APPROVED", "PENDING"] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlappingLeave) {
      return NextResponse.json(
        {
          success: false,
          message: "Leave request overlaps with existing leave",
        },
        { status: 409 }
      );
    }

    const leave = await prisma.leave.create({
      data: {
        userId: body.userId,
        leaveType: body.leaveType,
        startDate: start,
        endDate: end,
        reason: body.reason,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave request created successfully",
        data: leave,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating leave:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create leave request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
