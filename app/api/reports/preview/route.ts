// FILE: app/api/reports/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("report:view", user.role);
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch event with all related data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          orderBy: {
            createdAt: "asc",
          },
        },
        expenses: {
          include: {
            addedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Calculate summary
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
    const distributedCount = event.participants.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.distributionStatus === "DISTRIBUTED"
    ).length;

    return NextResponse.json({
      success: true,
      event,
      participants: event.participants,
      expenses: event.expenses,
      summary: {
        totalParticipants,
        totalMlkbanko,
        totalRegistrationFees,
        totalExpenses,
        distributedCount,
        netAmount: totalRegistrationFees - totalExpenses,
      },
    });
  } catch (error) {
    console.error("Report preview error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
