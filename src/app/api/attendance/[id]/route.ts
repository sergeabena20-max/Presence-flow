import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceDTO, UpdateAttendanceInput } from "@/lib/types";

// GET attendance by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance record not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT update attendance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateAttendanceInput = await request.json();

    // Check if attendance exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance record not found",
        },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.arrivalTime !== undefined) {
      updateData.arrivalTime = body.arrivalTime ? new Date(body.arrivalTime) : null;
    }

    if (body.departureTime !== undefined) {
      updateData.departureTime = body.departureTime ? new Date(body.departureTime) : null;
    }

    if (body.arrivalStatus) {
      updateData.arrivalStatus = body.arrivalStatus;
    }

    if (body.arrivalLat !== undefined) {
      updateData.arrivalLat = body.arrivalLat;
    }

    if (body.arrivalLon !== undefined) {
      updateData.arrivalLon = body.arrivalLon;
    }

    if (body.arrivalDistance !== undefined) {
      updateData.arrivalDistance = body.arrivalDistance;
    }

    if (body.departureLat !== undefined) {
      updateData.departureLat = body.departureLat;
    }

    if (body.departureLon !== undefined) {
      updateData.departureLon = body.departureLon;
    }

    if (body.departureDistance !== undefined) {
      updateData.departureDistance = body.departureDistance;
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Attendance updated successfully",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update attendance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE attendance
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance record not found",
        },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete attendance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
