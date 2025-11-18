/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { User, Role } from "@/types";
import { useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";

// Fetch all users
export function useUsers(filters?: { role?: Role; search?: string }) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.role) params.append("role", filters.role);
      if (filters?.search) params.append("search", filters.search);

      const response = await apiClient.get<{
        success: boolean;
        users: User[];
        count: number;
      }>(`/api/users?${params.toString()}`);
      return response.data;
    },
  });
}

// Create user (register)
export function useCreateUser() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      role: Role;
    }) => {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        user: User;
      }>("/api/auth/register", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      dispatch(
        showToast({ message: "User created successfully", type: "success" })
      );
    },
    onError: (error: any) => {
      dispatch(
        showToast({
          message: error.response?.data?.message || "Failed to create user",
          type: "error",
        })
      );
    },
  });
}

// Update user
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      email?: string;
      role?: Role;
      password?: string;
    }) => {
      const response = await apiClient.put<{
        success: boolean;
        message: string;
        user: User;
      }>(`/api/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      dispatch(
        showToast({ message: "User updated successfully", type: "success" })
      );
    },
    onError: (error: any) => {
      dispatch(
        showToast({
          message: error.response?.data?.message || "Failed to update user",
          type: "error",
        })
      );
    },
  });
}

// Delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/api/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      dispatch(
        showToast({ message: "User deleted successfully", type: "success" })
      );
    },
    onError: (error: any) => {
      dispatch(
        showToast({
          message: error.response?.data?.message || "Failed to delete user",
          type: "error",
        })
      );
    },
  });
}
