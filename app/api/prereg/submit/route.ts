// FILE: app/api/prereg/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ParticipantType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, participants } = body;

    if (
      !eventId ||
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Event ID and participants array are required",
        },
        { status: 400 }
      );
    }

    // Verify event exists and pre-registration is open
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

    if (!event.isPreRegOpen) {
      return NextResponse.json(
        {
          success: false,
          message: "Pre-registration is closed for this event",
        },
        { status: 403 }
      );
    }

    // Validate and create participants
    const createdParticipants = [];

    for (const participant of participants) {
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
      } = participant;

      // Validate required fields
      if (!fullname || !participantType) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Fullname and participant type are required for all participants",
          },
          { status: 400 }
        );
      }

      // Validate participant type
      const validTypes: ParticipantType[] = ["NEW", "OLD"];
      if (!validTypes.includes(participantType)) {
        return NextResponse.json(
          {
            success: false,
            message: "Participant type must be either NEW or OLD",
          },
          { status: 400 }
        );
      }

      // For OLD participants, yoroiAddress is required
      if (participantType === "OLD" && !yoroiAddress) {
        return NextResponse.json(
          {
            success: false,
            message: `Yoroi address is required for returning participant: ${fullname}`,
          },
          { status: 400 }
        );
      }

      // For NEW participants, yoroiAddress defaults to empty or placeholder
      const finalYoroiAddress = yoroiAddress || "PENDING";

      const newParticipant = await prisma.participant.create({
        data: {
          fullname,
          email: email || null,
          phoneNumber: phoneNumber || null,
          homeAddress: homeAddress || null,
          birthday: birthday ? new Date(birthday) : null,
          participantType: participantType as ParticipantType,
          yoroiAddress: finalYoroiAddress,
          qrCodeUrl: qrCodeUrl || null,
          mlkbankoAmount: mlkbankoAmount
            ? parseFloat(mlkbankoAmount)
            : event.defaultMlkbankoAmount,
          registrationFee: registrationFee
            ? parseFloat(registrationFee)
            : event.defaultRegistrationFee,
          paymentProofUrl: paymentProofUrl || null,
          registrationSource: "PRE_REGISTRATION",
          eventId,
        },
      });

      createdParticipants.push(newParticipant);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully registered ${createdParticipants.length} participant(s)`,
        participants: createdParticipants,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Pre-registration submit error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
