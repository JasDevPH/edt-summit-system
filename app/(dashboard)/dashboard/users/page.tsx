// FILE: app/(dashboard)/dashboard/users/page.tsx
"use client";

import { useState } from "react";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { useAppSelector } from "@/store/store";
import { User, Role } from "@/types";
import { format } from "date-fns";
import UserFormModal from "@/components/modals/UserFormModal";

const roleColors = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  IT: "bg-blue-100 text-blue-700 border-blue-200",
  FACILITATOR: "bg-green-100 text-green-700 border-green-200",
  FINANCE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  STAFF: "bg-gray-100 text-gray-700 border-gray-200",
};

const avatarColors = {
  ADMIN: "bg-gradient-to-br from-purple-500 to-purple-600",
  IT: "bg-gradient-to-br from-blue-500 to-blue-600",
  FACILITATOR: "bg-gradient-to-br from-green-500 to-green-600",
  FINANCE: "bg-gradient-to-br from-yellow-500 to-yellow-600",
  STAFF: "bg-gradient-to-br from-gray-500 to-gray-600",
};

export default function UsersPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useUsers({
    search: searchQuery || undefined,
    role: roleFilter || undefined,
  });
  const deleteUser = useDeleteUser();

  const canCreate = currentUser?.role === "ADMIN" || currentUser?.role === "IT";
  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "IT";
  const canDelete = currentUser?.role === "ADMIN" || currentUser?.role === "IT";

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteUser.mutate(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCreateNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const getRoleBadgeColor = (role: Role) => {
    const colors: Record<Role, string> = {
      ADMIN: "bg-red-100 text-red-800",
      IT: "bg-blue-100 text-blue-800",
      FACILITATOR: "bg-green-100 text-green-800",
      FINANCE: "bg-yellow-100 text-yellow-800",
      STAFF: "bg-gray-100 text-gray-800",
    };
    return colors[role];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600 mt-1">
                Manage system users and roles
              </p>
            </div>
            {canCreate && (
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-150 shadow-sm hover:shadow-md font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add User
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by name or email
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                  placeholder="Search users..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | "")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="IT">IT</option>
                <option value="FACILITATOR">Facilitator</option>
                <option value="FINANCE">Finance</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {data?.users && data.users.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || roleFilter
                ? "Try adjusting your filters"
                : "Get started by adding your first user"}
            </p>
            {canCreate && !searchQuery && !roleFilter && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-150"
              >
                Add User
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data?.users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ${
                              avatarColors[user.role]
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {user.name}
                            </div>
                            {user.id === currentUser?.id && (
                              <div className="text-xs text-indigo-600 font-medium">
                                (You)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${
                            roleColors[user.role]
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(user)}
                              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-150 font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className={`px-4 py-2 rounded-lg transition-all duration-150 font-medium ${
                                deleteConfirm === user.id
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              {deleteConfirm === user.id
                                ? "Confirm?"
                                : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      </div>
    </div>
  );
}
