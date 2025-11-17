// FILE: app/api/participants/[id]/distribution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { DistributionStatus } from "@/types";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error) return error;
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission (Admin/IT only)
    const permissionError = requirePermission(
      "participant:update-distribution",
      user.role
    );
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;
    const body = await request.json();
    const { distributionStatus } = body;

    // Validate required field
    if (!distributionStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Distribution status is required",
        },
        { status: 400 }
      );
    }

    // Validate distribution status
    const validStatuses: DistributionStatus[] = [
      "PENDING",
      "DISTRIBUTED",
      "FAILED",
    ];
    if (!validStatuses.includes(distributionStatus)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid distribution status. Must be PENDING, DISTRIBUTED, or FAILED",
        },
        { status: 400 }
      );
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          message: "Participant not found",
        },
        { status: 404 }
      );
    }

    // Update distribution status
    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: {
        distributionStatus,
      },
      include: {
        event: {
          select: {
            id: true,
            facilitator: true,
            date: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Distribution status updated to ${distributionStatus}`,
        participant: updatedParticipant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update distribution status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
