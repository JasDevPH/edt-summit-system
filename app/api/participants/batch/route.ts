// FILE: app/api/participants/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { RegistrationSource } from "@/types";

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("participant:create", user.role);
    if (permissionError) return permissionError;

    const body = await request.json();
    const { participants, eventId } = body;

    // Validate required fields
    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Participants array is required and must not be empty",
        },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          message: "EventId is required",
        },
        { status: 400 }
      );
    }

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

    // Validate registration sources
    const validSources: RegistrationSource[] = [
      "PRE_REGISTRATION",
      "ONSITE",
      "MOBILE_APP",
    ];

    // Validate each participant
    const errors: string[] = [];
    participants.forEach((p, index) => {
      if (!p.fullname)
        errors.push(`Participant ${index + 1}: fullname is required`);
      if (!p.yoroiAddress)
        errors.push(`Participant ${index + 1}: yoroiAddress is required`);
      if (p.mlkbankoAmount === undefined)
        errors.push(`Participant ${index + 1}: mlkbankoAmount is required`);
      if (p.registrationFee === undefined)
        errors.push(`Participant ${index + 1}: registrationFee is required`);
      if (!p.registrationSource)
        errors.push(`Participant ${index + 1}: registrationSource is required`);
      if (
        p.registrationSource &&
        !validSources.includes(p.registrationSource)
      ) {
        errors.push(`Participant ${index + 1}: invalid registrationSource`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation errors",
          errors,
        },
        { status: 400 }
      );
    }

    // Create participants in batch
    const createdParticipants = await prisma.participant.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: participants.map((p: any) => ({
        fullname: p.fullname,
        homeAddress: p.homeAddress || null,
        birthday: p.birthday ? new Date(p.birthday) : null,
        yoroiAddress: p.yoroiAddress,
        qrCodeUrl: p.qrCodeUrl || null,
        mlkbankoAmount: parseFloat(p.mlkbankoAmount),
        registrationFee: parseFloat(p.registrationFee),
        paymentProofUrl: p.paymentProofUrl || null,
        registrationSource: p.registrationSource,
        eventId,
        createdById: user.id,
      })),
    });

    return NextResponse.json(
      {
        success: true,
        message: `${createdParticipants.count} participants added successfully`,
        count: createdParticipants.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Batch create participants error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});
