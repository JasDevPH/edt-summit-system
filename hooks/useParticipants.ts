/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: hooks/useParticipants.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import apiClient from "@/lib/api/client";
import { Participant, RegistrationSource, DistributionStatus } from "@/types";

interface CreateParticipantData {
  fullname: string;
  homeAddress?: string;
  birthday?: string;
  yoroiAddress: string;
  qrCodeUrl?: string;
  mlkbankoAmount: number;
  registrationFee: number;
  paymentProofUrl?: string;
  registrationSource: RegistrationSource;
  eventId: string;
}

interface BatchCreateData {
  participants: Omit<CreateParticipantData, "eventId">[];
  eventId: string;
}

interface ParticipantsResponse {
  success: boolean;
  participants: Participant[];
  count: number;
  totals: {
    mlkbanko: number;
    registrationFees: number;
  };
}

interface ParticipantResponse {
  success: boolean;
  participant: Participant;
  message?: string;
}

// Get all participants
export function useParticipants(filters?: {
  eventId?: string;
  search?: string;
  distributionStatus?: string;
  registrationSource?: string;
}) {
  return useQuery({
    queryKey: ["participants", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.eventId) params.append("eventId", filters.eventId);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.distributionStatus)
        params.append("distributionStatus", filters.distributionStatus);
      if (filters?.registrationSource)
        params.append("registrationSource", filters.registrationSource);

      const response = await apiClient.get<ParticipantsResponse>(
        `/api/participants?${params.toString()}`
      );
      return response.data;
    },
  });
}

// Get single participant
export function useParticipant(id: string) {
  return useQuery({
    queryKey: ["participant", id],
    queryFn: async () => {
      const response = await apiClient.get<ParticipantResponse>(
        `/api/participants/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Create participant
export function useCreateParticipant() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: CreateParticipantData) => {
      const response = await apiClient.post<ParticipantResponse>(
        "/api/participants",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({
          message: "Participant added successfully!",
          type: "success",
        })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to add participant";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Batch create participants
export function useBatchCreateParticipants() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: BatchCreateData) => {
      const response = await apiClient.post("/api/participants/batch", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({
          message: data.message || "Participants added successfully!",
          type: "success",
        })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to add participants";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Update participant
export function useUpdateParticipant(id: string) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: Partial<CreateParticipantData>) => {
      const response = await apiClient.put<ParticipantResponse>(
        `/api/participants/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participant", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({
          message: "Participant updated successfully!",
          type: "success",
        })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update participant";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Delete participant
export function useDeleteParticipant() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/participants/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({
          message: "Participant deleted successfully!",
          type: "success",
        })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete participant";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Update distribution status
export function useUpdateDistributionStatus(id: string) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (distributionStatus: DistributionStatus) => {
      const response = await apiClient.patch<ParticipantResponse>(
        `/api/participants/${id}/distribution`,
        { distributionStatus }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participant", id] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      dispatch(
        showToast({
          message: data.message || "Distribution status updated",
          type: "success",
        })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update distribution status";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}
