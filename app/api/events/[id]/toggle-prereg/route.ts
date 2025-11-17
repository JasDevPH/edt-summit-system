// FILE: app/api/events/[id]/toggle-prereg/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/middleware";
import { requirePermission, canAccessEvent } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

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

    // Check permission
    const permissionError = requirePermission("event:toggle-prereg", user.role);
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

    // Check if user can edit this event
    if (!canAccessEvent(user.role, event.createdById, user.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to edit this event",
        },
        { status: 403 }
      );
    }

    // Toggle pre-registration status
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        isPreRegOpen: !event.isPreRegOpen,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pre-registration ${
          updatedEvent.isPreRegOpen ? "opened" : "closed"
        } successfully`,
        event: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Toggle pre-reg error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
