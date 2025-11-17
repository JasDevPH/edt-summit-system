// FILE: app/api/expenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
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
    const permissionError = requirePermission("expense:view", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;

    // Fetch expense
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            facilitator: true,
            date: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        expense,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get expense error:", error);
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
    const permissionError = requirePermission("expense:edit", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;
    const body = await request.json();

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense not found",
        },
        { status: 404 }
      );
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.receiptUrl !== undefined)
      updateData.receiptUrl = body.receiptUrl || null;

    // Update expense
    const updatedExpense = await prisma.expense.update({
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
        message: "Expense updated successfully",
        expense: updatedExpense,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update expense error:", error);
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

    // Check permission (only ADMIN and IT can delete)
    const permissionError = requirePermission("expense:delete", user.role);
    if (permissionError) return permissionError;

    // Await params
    const { id } = await context.params;

    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense not found",
        },
        { status: 404 }
      );
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
