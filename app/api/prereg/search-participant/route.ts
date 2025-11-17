// FILE: app/api/prereg/search-participant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Search query must be at least 3 characters",
        },
        { status: 400 }
      );
    }

    // Search for participants by name or email
    const participants = await prisma.participant.findMany({
      where: {
        OR: [
          {
            fullname: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        phoneNumber: true,
        homeAddress: true,
        birthday: true,
        yoroiAddress: true,
        qrCodeUrl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 results
    });

    return NextResponse.json(
      {
        success: true,
        participants,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search participant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
