/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: hooks/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import apiClient from "@/lib/api/client";
import { Expense } from "@/types";

interface CreateExpenseData {
  description: string;
  amount: number;
  receiptUrl?: string;
  eventId: string;
}

interface ExpensesResponse {
  success: boolean;
  expenses: (Expense & {
    addedBy: {
      id: string;
      name: string;
    };
  })[];
  totalAmount: number;
  count: number;
}

interface ExpenseResponse {
  success: boolean;
  expense: Expense;
  message?: string;
}

// Get all expenses
export function useExpenses(filters?: { eventId?: string; search?: string }) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.eventId) params.append("eventId", filters.eventId);
      if (filters?.search) params.append("search", filters.search);

      const response = await apiClient.get<ExpensesResponse>(
        `/api/expenses?${params.toString()}`
      );
      return response.data;
    },
  });
}

// Get single expense
export function useExpense(id: string) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      const response = await apiClient.get<ExpenseResponse>(
        `/api/expenses/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Create expense
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const response = await apiClient.post<ExpenseResponse>(
        "/api/expenses",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({ message: "Expense added successfully!", type: "success" })
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to add expense";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Update expense
export function useUpdateExpense(id: string) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: Partial<CreateExpenseData>) => {
      const response = await apiClient.put<ExpenseResponse>(
        `/api/expenses/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({ message: "Expense updated successfully!", type: "success" })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update expense";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Delete expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/expenses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({ message: "Expense deleted successfully!", type: "success" })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete expense";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}
