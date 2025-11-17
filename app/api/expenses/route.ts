// FILE: app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("expense:view", user.role);
    if (permissionError) return permissionError;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const search = searchParams.get("search");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where,
      include: {
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
    });

    // Calculate total amount
    const totalAmount = expenses.reduce(
      (sum: number, expense: { amount: number }) => sum + expense.amount,
      0
    );

    return NextResponse.json(
      {
        success: true,
        expenses,
        totalAmount,
        count: expenses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("expense:create", user.role);
    if (permissionError) return permissionError;

    const body = await request.json();
    const { description, amount, receiptUrl, eventId } = body;

    // Validate required fields
    if (!description || !amount || !eventId) {
      return NextResponse.json(
        {
          success: false,
          message: "Description, amount, and eventId are required",
        },
        { status: 400 }
      );
    }

    // Validate amount
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be a positive number",
        },
        { status: 400 }
      );
    }

    // Check if event exists
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

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        description,
        amount: expenseAmount,
        receiptUrl: receiptUrl || null,
        eventId,
        addedById: user.id,
      },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense added successfully",
        expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});
