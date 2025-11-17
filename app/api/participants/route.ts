// FILE: app/api/participants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { RegistrationSource, ParticipantType } from "@/types";

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("participant:create", user.role);
    if (permissionError) return permissionError;

    const body = await request.json();
    const {
      fullname,
      email,
      phoneNumber,
      homeAddress,
      birthday,
      participantType,
      yoroiAddress,
      qrCodeUrl,
      mlkbankoAmount,
      registrationFee,
      paymentProofUrl,
      registrationSource,
      eventId,
    } = body;

    // Validate required fields
    if (
      !fullname ||
      !yoroiAddress ||
      mlkbankoAmount === undefined ||
      registrationFee === undefined ||
      !registrationSource ||
      !eventId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Fullname, yoroiAddress, mlkbankoAmount, registrationFee, registrationSource, and eventId are required",
        },
        { status: 400 }
      );
    }

    // Validate registration source
    const validSources: RegistrationSource[] = [
      "PRE_REGISTRATION",
      "ONSITE",
      "MOBILE_APP",
    ];
    if (!validSources.includes(registrationSource)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration source",
        },
        { status: 400 }
      );
    }

    // Validate participant type
    const validTypes: ParticipantType[] = ["NEW", "OLD"];
    const finalParticipantType =
      participantType && validTypes.includes(participantType)
        ? participantType
        : "NEW";

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        { status: 404 }
      );
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        fullname,
        email: email || null,
        phoneNumber: phoneNumber || null,
        homeAddress: homeAddress || null,
        birthday: birthday ? new Date(birthday) : null,
        participantType: finalParticipantType,
        yoroiAddress,
        qrCodeUrl: qrCodeUrl || null,
        mlkbankoAmount: parseFloat(mlkbankoAmount),
        registrationFee: parseFloat(registrationFee),
        paymentProofUrl: paymentProofUrl || null,
        registrationSource,
        eventId,
        createdById: user.id,
      },
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
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Participant added successfully",
        participant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create participant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("participant:view", user.role);
    if (permissionError) return permissionError;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const search = searchParams.get("search");
    const distributionStatus = searchParams.get("distributionStatus");
    const registrationSource = searchParams.get("registrationSource");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (search) {
      where.fullname = { contains: search, mode: "insensitive" };
    }

    if (distributionStatus) {
      where.distributionStatus = distributionStatus;
    }

    if (registrationSource) {
      where.registrationSource = registrationSource;
    }

    // Fetch participants
    const participants = await prisma.participant.findMany({
      where,
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
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate totals
    const totalMlkbanko = participants.reduce(
      (sum, p) => sum + p.mlkbankoAmount,
      0
    );
    const totalRegistrationFees = participants.reduce(
      (sum, p) => sum + p.registrationFee,
      0
    );

    return NextResponse.json(
      {
        success: true,
        participants,
        count: participants.length,
        totals: {
          mlkbanko: totalMlkbanko,
          registrationFees: totalRegistrationFees,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get participants error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});
