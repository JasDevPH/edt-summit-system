/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: hooks/useAuth.ts
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/store";
import {
  setCredentials,
  logout as logoutAction,
} from "@/store/slices/authSlice";
import { showToast } from "@/store/slices/uiSlice";
import apiClient from "@/lib/api/client";
import { LoginCredentials, RegisterData, AuthUser } from "@/types";

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<LoginResponse>(
        "/api/auth/login",
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(showToast({ message: "Login successful!", type: "success" }));
      router.push("/dashboard/events");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Login failed";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

export function useRegister() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.post<RegisterResponse>(
        "/api/auth/register",
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(
        showToast({
          message: `User ${data.user.name} created successfully!`,
          type: "success",
        })
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Registration failed";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return () => {
    dispatch(logoutAction());
    dispatch(
      showToast({ message: "Logged out successfully", type: "success" })
    );
    router.push("/login");
  };
}
