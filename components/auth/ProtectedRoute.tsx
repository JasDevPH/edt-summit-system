// FILE: components/auth/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/store";
import { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push("/dashboard/events");
      }
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or role not allowed
  if (
    !isAuthenticated ||
    (allowedRoles && user && !allowedRoles.includes(user.role))
  ) {
    return null;
  }

  return <>{children}</>;
}
