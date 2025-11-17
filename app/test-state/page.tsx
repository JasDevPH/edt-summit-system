// FILE: app/test-state/page.tsx
"use client";

import { useAppSelector, useAppDispatch } from "@/store/store";
import { toggleSidebar, showToast } from "@/store/slices/uiSlice";
import { useLogin } from "@/hooks/useAuth";
import { useState } from "react";

export default function TestStatePage() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { isSidebarOpen, toast } = useAppSelector((state) => state.ui);
  const loginMutation = useLogin();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("admin123");

  const handleLogin = () => {
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Redux & React Query Test</h1>

          {/* Auth State */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Auth State</h2>
            <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
            {user && (
              <pre className="bg-gray-100 p-2 rounded mt-2">
                {JSON.stringify(user, null, 2)}
              </pre>
            )}
          </div>

          {/* UI State */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">UI State</h2>
            <p>Sidebar Open: {isSidebarOpen ? "Yes" : "No"}</p>
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Toggle Sidebar
            </button>
          </div>

          {/* Toast Test */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Toast Test</h2>
            <button
              onClick={() =>
                dispatch(showToast({ message: "Test toast!", type: "success" }))
              }
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Show Toast
            </button>
            {toast.show && (
              <div
                className={`mt-2 p-3 rounded ${
                  toast.type === "success"
                    ? "bg-green-100 text-green-800"
                    : toast.type === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {toast.message}
              </div>
            )}
          </div>

          {/* Login Test */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              Login Test (React Query)
            </h2>
            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 border rounded"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-2 border rounded"
              />
              <button
                onClick={handleLogin}
                disabled={loginMutation.isPending}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
