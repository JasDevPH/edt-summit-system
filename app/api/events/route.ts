// FILE: app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { nanoid } from "nanoid";

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("event:create", user.role);
    if (permissionError) return permissionError;

    const body = await request.json();
    const {
      facilitator,
      date,
      defaultMlkbankoAmount,
      defaultRegistrationFee,
      totalCryptoReceived,
    } = body;

    // Validate required fields
    if (!facilitator || !date) {
      return NextResponse.json(
        {
          success: false,
          message: "Facilitator and date are required",
        },
        { status: 400 }
      );
    }

    // Validate date format
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format",
        },
        { status: 400 }
      );
    }

    // Generate unique pre-registration link
    const preRegLink = nanoid(10);

    // Create event
    const event = await prisma.event.create({
      data: {
        facilitator,
        date: eventDate,
        preRegLink,
        isPreRegOpen: true,
        defaultMlkbankoAmount: defaultMlkbankoAmount
          ? parseFloat(defaultMlkbankoAmount)
          : 500,
        defaultRegistrationFee: defaultRegistrationFee
          ? parseFloat(defaultRegistrationFee)
          : 100,
        totalCryptoReceived: totalCryptoReceived
          ? parseFloat(totalCryptoReceived)
          : 0,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create event error:", error);
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
    const permissionError = requirePermission("event:view", user.role);
    if (permissionError) return permissionError;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const facilitator = searchParams.get("facilitator");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Facilitators can only see their own events
    if (user.role === "FACILITATOR") {
      where.createdById = user.id;
    }

    // Filter by facilitator name
    if (facilitator) {
      where.facilitator = { contains: facilitator, mode: "insensitive" };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Fetch events with participant and expense counts
    const events = await prisma.event.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            participants: true,
            expenses: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        events,
        count: events.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});
