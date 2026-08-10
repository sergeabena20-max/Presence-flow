import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateLeaveInput } from "@/lib/types";

// GET leave by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leave = await prisma.leave.findUnique({
      where: { id: params.id },
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

    if (!leave) {
      return NextResponse.json(
        {
          success: false,
          message: "Leave request not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Leave retrieved successfully",
      data: leave,
    });
  } catch (error) {
    console.error("Error fetching leave:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leave",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT update leave
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateLeaveInput = await request.json();

    // Check if leave exists
    const existingLeave = await prisma.leave.findUnique({
      where: { id: params.id },
    });

    if (!existingLeave) {
      return NextResponse.json(
        {
          success: false,
          message: "Leave request not found",
        },
        { status: 404 }
      );
    }

    // Prevent updating approved/rejected leaves unless it's for approval
    if (
      existingLeave.status === "APPROVED" ||
      existingLeave.status === "REJECTED"
    ) {
      if (
        body.leaveType ||
        body.startDate ||
        body.endDate ||
        body.reason
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Cannot modify finalized leave requests",
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (body.leaveType) {
      updateData.leaveType = body.leaveType;
    }

    if (body.startDate) {
      updateData.startDate = new Date(body.startDate);
    }

    if (body.endDate) {
      updateData.endDate = new Date(body.endDate);
    }

    if (body.reason !== undefined) {
      updateData.reason = body.reason;
    }

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.approverEmail) {
      updateData.approverEmail = body.approverEmail;
    }

    // Validate date range if updating dates
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate > updateData.endDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Start date must be before end date",
          },
          { status: 400 }
        );
      }
    }

    const updatedLeave = await prisma.leave.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      message: "Leave updated successfully",
      data: updatedLeave,
    });
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update leave",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE leave
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leave = await prisma.leave.findUnique({
      where: { id: params.id },
    });

    if (!leave) {
      return NextResponse.json(
        {
          success: false,
          message: "Leave request not found",
        },
        { status: 404 }
      );
    }

    // Prevent deleting approved/rejected leaves
    if (leave.status === "APPROVED" || leave.status === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete finalized leave requests",
        },
        { status: 400 }
      );
    }

    await prisma.leave.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Leave deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting leave:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete leave",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
