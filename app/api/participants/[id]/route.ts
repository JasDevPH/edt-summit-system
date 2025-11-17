// FILE: app/api/participants/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ParticipantType } from "@/types";

export async function GET(
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

    // Check permission
    const permissionError = requirePermission("participant:view", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;

    // Fetch participant
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            facilitator: true,
            date: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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

    return NextResponse.json(
      {
        success: true,
        participant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get participant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check permission
    const permissionError = requirePermission("participant:edit", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;
    const body = await request.json();

    // Log the incoming data for debugging
    console.log("Update participant request body:", body);

    // Check if participant exists
    const existingParticipant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!existingParticipant) {
      return NextResponse.json(
        {
          success: false,
          message: "Participant not found",
        },
        { status: 404 }
      );
    }

    // Build update data - explicitly handle each field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (body.fullname !== undefined) updateData.fullname = body.fullname;

    // Handle email - convert empty string to null
    if (body.email !== undefined) {
      updateData.email =
        body.email && body.email.trim() !== "" ? body.email : null;
    }

    // Handle phoneNumber - convert empty string to null
    if (body.phoneNumber !== undefined) {
      updateData.phoneNumber =
        body.phoneNumber && body.phoneNumber.trim() !== ""
          ? body.phoneNumber
          : null;
    }

    if (body.homeAddress !== undefined) {
      updateData.homeAddress =
        body.homeAddress && body.homeAddress.trim() !== ""
          ? body.homeAddress
          : null;
    }

    if (body.birthday !== undefined) {
      updateData.birthday = body.birthday ? new Date(body.birthday) : null;
    }

    if (body.participantType !== undefined) {
      const validTypes: ParticipantType[] = ["NEW", "OLD"];
      if (validTypes.includes(body.participantType)) {
        updateData.participantType = body.participantType;
      }
    }

    if (body.yoroiAddress !== undefined)
      updateData.yoroiAddress = body.yoroiAddress;

    if (body.qrCodeUrl !== undefined) {
      updateData.qrCodeUrl =
        body.qrCodeUrl && body.qrCodeUrl.trim() !== "" ? body.qrCodeUrl : null;
    }

    if (body.mlkbankoAmount !== undefined)
      updateData.mlkbankoAmount = parseFloat(body.mlkbankoAmount);

    if (body.registrationFee !== undefined)
      updateData.registrationFee = parseFloat(body.registrationFee);

    if (body.paymentProofUrl !== undefined) {
      updateData.paymentProofUrl =
        body.paymentProofUrl && body.paymentProofUrl.trim() !== ""
          ? body.paymentProofUrl
          : null;
    }

    if (body.registrationSource !== undefined)
      updateData.registrationSource = body.registrationSource;

    console.log("Update data being sent to Prisma:", updateData);

    // Update participant
    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: updateData,
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

    console.log("Updated participant result:", updatedParticipant);

    return NextResponse.json(
      {
        success: true,
        message: "Participant updated successfully",
        participant: updatedParticipant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update participant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check permission
    const permissionError = requirePermission("participant:delete", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;

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

    // Delete participant
    await prisma.participant.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Participant deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete participant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
