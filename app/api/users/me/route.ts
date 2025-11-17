// FILE: app/api/users/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, validatePassword } from "@/lib/auth/password";

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Fetch full user details
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: userData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});

export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { name, email, password, currentPassword } = body;

    // Build update data object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Update name if provided
    if (name) {
      updateData.name = name;
    }

    // Update email if provided
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email format",
          },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          {
            success: false,
            message: "Email is already taken",
          },
          { status: 409 }
        );
      }

      updateData.email = email;
    }

    // Update password if provided
    if (password) {
      // Require current password for password change
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            message: "Current password is required to change password",
          },
          { status: 400 }
        );
      }

      // Verify current password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!currentUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
          },
          { status: 404 }
        );
      }

      const { comparePassword } = await import("@/lib/auth/password");
      const isPasswordValid = await comparePassword(
        currentPassword,
        currentUser.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Current password is incorrect",
          },
          { status: 401 }
        );
      }

      // Validate new password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: passwordValidation.message,
          },
          { status: 400 }
        );
      }

      // Hash new password
      updateData.password = await hashPassword(password);
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

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
});
