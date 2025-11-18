// FILE: components/forms/UserFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { User, Role } from "@/types";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
}: UserFormModalProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id || "");

  // Initialize form data based on whether we're editing or creating
  const getInitialFormData = () => ({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: (user?.role || "STAFF") as Role,
  });

  const [formData, setFormData] = useState(getInitialFormData());

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (user) {
        // Update - only send password if it's filled
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUser.mutateAsync(updateData);
      } else {
        // Create - password required
        await createUser.mutateAsync(formData);
      }

      onClose();
    } catch (error) {
      // Error handling is done in the hooks
      console.error("Form submission error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black opacity-30"
          onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {user ? "Edit User" : "Create User"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!user && "*"}
                </label>
                <input
                  type="password"
                  required={!user}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={
                    user ? "Leave blank to keep current password" : "••••••••"
                  }
                />
                {user && (
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to keep current password
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as Role })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="IT">IT</option>
                  <option value="FACILITATOR">Facilitator</option>
                  <option value="FINANCE">Finance</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                {createUser.isPending || updateUser.isPending
                  ? "Saving..."
                  : user
                  ? "Update User"
                  : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
