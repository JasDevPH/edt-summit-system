/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import apiClient from "@/lib/api/client";
import { Event } from "@/types";

interface CreateEventData {
  facilitator: string;
  date: string;
}

interface UpdateEventData {
  facilitator?: string;
  date?: string;
}

interface EventResponse {
  success: boolean;
  event: Event;
  message?: string;
}

interface EventsResponse {
  success: boolean;
  events: Event[];
  count: number;
}

// Get all events
export function useEvents(filters?: {
  facilitator?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.facilitator)
        params.append("facilitator", filters.facilitator);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);

      const response = await apiClient.get<EventsResponse>(
        `/api/events?${params.toString()}`
      );
      return response.data;
    },
  });
}

// Get single event
export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const response = await apiClient.get<EventResponse & { summary: any }>(
        `/api/events/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await apiClient.post<EventResponse>("/api/events", data);
      return response.data;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      dispatch(
        showToast({ message: "Event created successfully!", type: "success" })
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create event";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Update event
export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: UpdateEventData) => {
      const response = await apiClient.put<EventResponse>(
        `/api/events/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      dispatch(
        showToast({ message: "Event updated successfully!", type: "success" })
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update event";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/events/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      dispatch(
        showToast({ message: "Event deleted successfully!", type: "success" })
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete event";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}

// Toggle pre-registration
export function useTogglePreReg(id: string) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch<EventResponse>(
        `/api/events/${id}/toggle-prereg`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      dispatch(
        showToast({
          message: data.message || "Pre-registration status updated",
          type: "success",
        })
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to toggle pre-registration";
      dispatch(showToast({ message, type: "error" }));
    },
  });
}
