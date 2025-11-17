// FILE: lib/auth/rbac.ts
import { Role } from "@/types";
import { NextResponse } from "next/server";

export const permissions: Record<string, Role[]> = {
  // Event Management
  "event:create": ["ADMIN", "IT", "FACILITATOR"],
  "event:edit": ["ADMIN", "IT", "FACILITATOR"],
  "event:delete": ["ADMIN", "IT"],
  "event:view": ["ADMIN", "IT", "FACILITATOR", "FINANCE", "STAFF"],
  "event:toggle-prereg": ["ADMIN", "IT", "FACILITATOR"],

  // Participant Management
  "participant:create": ["ADMIN", "IT", "FACILITATOR", "FINANCE", "STAFF"],
  "participant:edit": ["ADMIN", "IT", "FACILITATOR", "FINANCE", "STAFF"],
  "participant:delete": ["ADMIN", "IT", "FACILITATOR"],
  "participant:view": ["ADMIN", "IT", "FACILITATOR", "FINANCE", "STAFF"],
  "participant:update-distribution": ["ADMIN", "IT"],

  // Expense Management
  "expense:create": ["ADMIN", "IT", "FINANCE"],
  "expense:edit": ["ADMIN", "IT", "FINANCE"],
  "expense:delete": ["ADMIN", "IT", "FINANCE"],
  "expense:view": ["ADMIN", "IT", "FINANCE"],

  // Reports
  "report:generate": ["ADMIN", "IT", "FACILITATOR", "FINANCE"],
  "report:view": ["ADMIN", "IT", "FACILITATOR", "FINANCE"],

  // User Management
  "user:create": ["ADMIN", "IT"],
  "user:edit": ["ADMIN", "IT"],
  "user:delete": ["ADMIN"],
  "user:view": ["ADMIN", "IT"],
};

export function hasPermission(userRole: Role, permission: string): boolean {
  const allowedRoles = permissions[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
}

export function requirePermission(
  permission: string,
  userRole: Role
): NextResponse | null {
  if (!hasPermission(userRole, permission)) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to perform this action",
      },
      { status: 403 }
    );
  }
  return null;
}

export function canAccessEvent(
  userRole: Role,
  eventCreatorId: string,
  userId: string
): boolean {
  // Admin and IT can access all events
  if (userRole === "ADMIN" || userRole === "IT") return true;

  // Facilitator can only access their own events
  if (userRole === "FACILITATOR") return eventCreatorId === userId;

  // Finance and Staff can view all events
  if (userRole === "FINANCE" || userRole === "STAFF") return true;

  return false;
}
