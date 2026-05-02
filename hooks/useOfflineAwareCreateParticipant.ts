// FILE: hooks/useOfflineAwareCreateParticipant.ts
"use client";

import { useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import { useCreateParticipant } from "@/hooks/useParticipants";
import { queueParticipant } from "@/lib/offline/offlineQueue";
import { RegistrationSource } from "@/types";

interface CreateParticipantFormData {
  fullname: string;
  email?: string;
  phoneNumber?: string;
  homeAddress?: string;
  birthday?: string;
  yoroiAddress: string;
  mlkbankoAmount: number;
  registrationFee: number;
  registrationSource: RegistrationSource;
  eventId: string;
  qrCodeUrl?: string;
  paymentProofUrl?: string;
}

interface ImageFiles {
  qrCode: File | null;
}

export function useOfflineAwareCreateParticipant(eventId: string) {
  const dispatch = useAppDispatch();
  const createParticipant = useCreateParticipant();

  const mutate = async (
    data: CreateParticipantFormData,
    imageFiles: ImageFiles,
    callbacks?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    if (navigator.onLine) {
      // Online path — normal mutation
      createParticipant.mutate(data, {
        onSuccess: callbacks?.onSuccess,
        onError: callbacks?.onError,
      });
    } else {
      // Offline path — queue to IDB
      try {
        const { eventId: _eventId, qrCodeUrl: _qrUrl, paymentProofUrl: _ppUrl, ...formFields } = data;
        void _eventId; void _qrUrl; void _ppUrl;

        await queueParticipant(eventId, formFields, imageFiles);

        dispatch(
          showToast({
            message: "Saved offline. Will sync when connected.",
            type: "success",
          })
        );
        callbacks?.onSuccess?.();
      } catch {
        dispatch(
          showToast({
            message: "Failed to save offline. Please try again.",
            type: "error",
          })
        );
        callbacks?.onError?.();
      }
    }
  };

  return {
    mutate,
    isPending: createParticipant.isPending,
  };
}
