// FILE: app/api/prereg/event/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preRegLink = searchParams.get("link");

    if (!preRegLink) {
      return NextResponse.json(
        {
          success: false,
          message: "Pre-registration link is required",
        },
        { status: 400 }
      );
    }

    // Find event by pre-registration link
    const event = await prisma.event.findUnique({
      where: {
        preRegLink: preRegLink,
      },
      select: {
        id: true,
        facilitator: true,
        date: true,
        isPreRegOpen: true,
        defaultMlkbankoAmount: true,
        defaultRegistrationFee: true,
      },
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

    return NextResponse.json(
      {
        success: true,
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
