// FILE: app/api/events/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/middleware";
import { requirePermission, canAccessEvent } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

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
    const permissionError = requirePermission("event:view", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        participants: {
          select: {
            id: true,
            fullname: true,
            mlkbankoAmount: true,
            registrationFee: true,
            distributionStatus: true,
            registrationSource: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        expenses: {
          select: {
            id: true,
            description: true,
            amount: true,
            createdAt: true,
            addedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
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

    // Check if user can access this event
    if (!canAccessEvent(user.role, event.createdById, user.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view this event",
        },
        { status: 403 }
      );
    }

    // Calculate totals
    const totalParticipants = event.participants.length;
    const totalMlkbanko = event.participants.reduce(
      (sum: number, p: { mlkbankoAmount: number }) => sum + p.mlkbankoAmount,
      0
    );
    const totalRegistrationFees = event.participants.reduce(
      (sum: number, p: { registrationFee: number }) => sum + p.registrationFee,
      0
    );
    const totalExpenses = event.expenses.reduce(
      (sum: number, e: { amount: number }) => sum + e.amount,
      0
    );

    return NextResponse.json(
      {
        success: true,
        event,
        summary: {
          totalParticipants,
          totalMlkbanko,
          totalRegistrationFees,
          totalExpenses,
          netAmount: totalRegistrationFees - totalExpenses,
        },
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
    const permissionError = requirePermission("event:edit", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;
    const body = await request.json();
    const {
      facilitator,
      date,
      defaultMlkbankoAmount,
      defaultRegistrationFee,
      totalCryptoReceived,
    } = body;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        { status: 404 }
      );
    }

    // Check if user can edit this event
    if (!canAccessEvent(user.role, existingEvent.createdById, user.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to edit this event",
        },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (facilitator) {
      updateData.facilitator = facilitator;
    }

    if (date) {
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
      updateData.date = eventDate;
    }

    if (defaultMlkbankoAmount !== undefined) {
      updateData.defaultMlkbankoAmount = parseFloat(defaultMlkbankoAmount);
    }

    if (defaultRegistrationFee !== undefined) {
      updateData.defaultRegistrationFee = parseFloat(defaultRegistrationFee);
    }

    if (totalCryptoReceived !== undefined) {
      updateData.totalCryptoReceived = parseFloat(totalCryptoReceived);
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields to update",
        },
        { status: 400 }
      );
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
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
        message: "Event updated successfully",
        event: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update event error:", error);
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

    // Check permission (Admin/IT only)
    const permissionError = requirePermission("event:delete", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
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

    // Delete event (participants and expenses will cascade delete)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
