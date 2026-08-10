import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceDTO, CreateAttendanceInput, PaginatedResponse } from "@/lib/types";

// GET all attendances with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Attendances retrieved successfully",
      data: attendances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    } as PaginatedResponse<AttendanceDTO>);
  } catch (error) {
    console.error("Error fetching attendances:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendances",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST create new attendance
export async function POST(request: NextRequest) {
  try {
    const body: CreateAttendanceInput = await request.json();

    // Validate input
    if (!body.userId || !body.date) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
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

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: body.userId,
        date: {
          gte: new Date(new Date(body.date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(body.date).setHours(24, 0, 0, 0)),
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance already recorded for this date",
        },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: body.userId,
        date: new Date(body.date),
        arrivalTime: body.arrivalTime ? new Date(body.arrivalTime) : null,
        departureTime: body.departureTime ? new Date(body.departureTime) : null,
        arrivalStatus: body.arrivalStatus || "PRESENT",
        arrivalLat: body.arrivalLat,
        arrivalLon: body.arrivalLon,
        arrivalDistance: body.arrivalDistance,
        departureLat: body.departureLat,
        departureLon: body.departureLon,
        departureDistance: body.departureDistance,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance recorded successfully",
        data: attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to record attendance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
