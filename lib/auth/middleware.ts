// FILE: lib/auth/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "./jwt";
import { AuthUser } from "@/types";

export async function authenticate(
  request: NextRequest
): Promise<{ user: AuthUser | null; error: NextResponse | null }> {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

export function requireAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticate(request);

    if (error) return error;
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}
