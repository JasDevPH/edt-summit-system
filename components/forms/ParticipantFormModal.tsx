// FILE: components/forms/ParticipantFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  useCreateParticipant,
  useUpdateParticipant,
} from "@/hooks/useParticipants";
import { useEvent } from "@/hooks/useEvents";
import { useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import { Participant, RegistrationSource } from "@/types";
import Image from "next/image";

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  participant?: Participant | null;
}

export default function ParticipantFormModal({
  isOpen,
  onClose,
  eventId,
  participant,
}: ParticipantFormModalProps) {
  const dispatch = useAppDispatch();
  const createParticipant = useCreateParticipant();
  const updateParticipant = useUpdateParticipant(participant?.id || "");
  const { data: eventData } = useEvent(eventId);

  const [formData, setFormData] = useState({
    lastname: "",
    firstname: "",
    middlename: "",
    email: "",
    phoneNumber: "",
    homeAddress: "",
    birthday: "",
    yoroiAddress: "",
    qrCodeUrl: "",
    mlkbankoAmount: "",
    registrationFee: "",
    paymentProofUrl: "",
    registrationSource: "ONSITE" as RegistrationSource,
  });

  const [imageFiles, setImageFiles] = useState<{
    qrCode: File | null;
    paymentProof: File | null;
  }>({
    qrCode: null,
    paymentProof: null,
  });

  const [imagePreviews, setImagePreviews] = useState<{
    qrCode: string | null;
    paymentProof: string | null;
  }>({
    qrCode: null,
    paymentProof: null,
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUploading(false);

    if (participant) {
      // Split fullname into parts (assuming format: "Lastname, Firstname Middlename")
      const nameParts = participant.fullname.split(",");
      const lastname = nameParts[0]?.trim() || "";
      const firstAndMiddle = nameParts[1]?.trim().split(" ") || [];
      const firstname = firstAndMiddle[0] || "";
      const middlename = firstAndMiddle.slice(1).join(" ") || "";

      setFormData({
        lastname,
        firstname,
        middlename,
        email: participant.email || "",
        phoneNumber: participant.phoneNumber || "",
        homeAddress: participant.homeAddress || "",
        birthday: participant.birthday
          ? new Date(participant.birthday).toISOString().slice(0, 10)
          : "",
        yoroiAddress: participant.yoroiAddress,
        qrCodeUrl: participant.qrCodeUrl || "",
        mlkbankoAmount: participant.mlkbankoAmount.toString(),
        registrationFee: participant.registrationFee.toString(),
        paymentProofUrl: participant.paymentProofUrl || "",
        registrationSource: participant.registrationSource,
      });
      setImagePreviews({
        qrCode: participant.qrCodeUrl || null,
        paymentProof: participant.paymentProofUrl || null,
      });
      setImageFiles({
        qrCode: null,
        paymentProof: null,
      });
    } else if (eventData?.event) {
      setFormData({
        lastname: "",
        firstname: "",
        middlename: "",
        email: "",
        phoneNumber: "",
        homeAddress: "",
        birthday: "",
        yoroiAddress: "",
        qrCodeUrl: "",
        mlkbankoAmount: eventData.event.defaultMlkbankoAmount.toString(),
        registrationFee: eventData.event.defaultRegistrationFee.toString(),
        paymentProofUrl: "",
        registrationSource: "ONSITE",
      });
      setImagePreviews({
        qrCode: null,
        paymentProof: null,
      });
      setImageFiles({
        qrCode: null,
        paymentProof: null,
      });
    }
  }, [participant, eventData, isOpen]);

  const handleFileSelect = (file: File, type: "qrCode" | "paymentProof") => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      dispatch(
        showToast({
          message: "File size must be less than 10MB",
          type: "error",
        })
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      dispatch(
        showToast({
          message: "Only JPEG, PNG, WEBP, and GIF images are allowed",
          type: "error",
        })
      );
      return;
    }

    setImageFiles((prev) => ({ ...prev, [type]: file }));
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews((prev) => ({ ...prev, [type]: previewUrl }));
  };

  const removeImage = (type: "qrCode" | "paymentProof") => {
    setImageFiles((prev) => ({ ...prev, [type]: null }));

    if (participant) {
      const originalUrl =
        type === "qrCode" ? participant.qrCodeUrl : participant.paymentProofUrl;
      setImagePreviews((prev) => ({ ...prev, [type]: originalUrl || null }));
      setFormData((prev) => ({
        ...prev,
        [type === "qrCode" ? "qrCodeUrl" : "paymentProofUrl"]:
          originalUrl || "",
      }));
    } else {
      setImagePreviews((prev) => ({ ...prev, [type]: null }));
      if (type === "qrCode") {
        setFormData((prev) => ({ ...prev, qrCodeUrl: "" }));
      } else {
        setFormData((prev) => ({ ...prev, paymentProofUrl: "" }));
      }
    }
  };

  const uploadImage = async (
    file: File,
    type: "qrCode" | "paymentProof"
  ): Promise<string | null> => {
    try {
      const token = localStorage.getItem("token");

      const formDataToUpload = new FormData();
      formDataToUpload.append("file", file);
      formDataToUpload.append(
        "folder",
        type === "qrCode" ? "qr-codes" : "payment-proofs"
      );
      formDataToUpload.append("resourceType", "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToUpload,
      });

      const data = await response.json();

      if (data.success) {
        return data.url;
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.lastname ||
      !formData.firstname ||
      !formData.yoroiAddress ||
      !formData.mlkbankoAmount ||
      !formData.registrationFee
    ) {
      dispatch(
        showToast({
          message: "Please fill in all required fields",
          type: "error",
        })
      );
      return;
    }

    setUploading(true);

    try {
      let qrCodeUrl = formData.qrCodeUrl;
      let paymentProofUrl = formData.paymentProofUrl;

      if (imageFiles.qrCode) {
        qrCodeUrl = (await uploadImage(imageFiles.qrCode, "qrCode")) || "";
      }

      if (imageFiles.paymentProof) {
        paymentProofUrl =
          (await uploadImage(imageFiles.paymentProof, "paymentProof")) || "";
      }

      // Combine name fields into fullname
      const fullname = formData.middlename
        ? `${formData.lastname}, ${formData.firstname} ${formData.middlename}`
        : `${formData.lastname}, ${formData.firstname}`;

      const submitData = {
        fullname,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        homeAddress: formData.homeAddress,
        birthday: formData.birthday,
        yoroiAddress: formData.yoroiAddress,
        qrCodeUrl,
        paymentProofUrl,
        mlkbankoAmount: parseFloat(formData.mlkbankoAmount),
        registrationFee: parseFloat(formData.registrationFee),
        registrationSource: formData.registrationSource,
        eventId,
      };

      console.log("Submitting participant data:", submitData);

      const mutation = participant ? updateParticipant : createParticipant;

      mutation.mutate(submitData, {
        onSuccess: () => {
          setUploading(false);
          onClose();
          setImageFiles({ qrCode: null, paymentProof: null });
          setImagePreviews({ qrCode: null, paymentProof: null });

          if (!participant && eventData?.event) {
            setFormData({
              lastname: "",
              firstname: "",
              middlename: "",
              email: "",
              phoneNumber: "",
              homeAddress: "",
              birthday: "",
              yoroiAddress: "",
              qrCodeUrl: "",
              mlkbankoAmount: eventData.event.defaultMlkbankoAmount.toString(),
              registrationFee:
                eventData.event.defaultRegistrationFee.toString(),
              paymentProofUrl: "",
              registrationSource: "ONSITE",
            });
          }
        },
        onError: () => {
          setUploading(false);
        },
      });
    } catch (error) {
      dispatch(
        showToast({ message: "Failed to upload images", type: "error" })
      );
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  const isSubmitting =
    createParticipant.isPending || updateParticipant.isPending || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {participant ? "Edit Participant" : "Add Participant"}
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

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lastname */}
            <div>
              <label
                htmlFor="lastname"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last Name *
              </label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                required
                value={formData.lastname}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Dela Cruz"
              />
            </div>

            {/* Firstname */}
            <div>
              <label
                htmlFor="firstname"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First Name *
              </label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                required
                value={formData.firstname}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Juan"
              />
            </div>

            {/* Middlename */}
            <div>
              <label
                htmlFor="middlename"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Middle Name
              </label>
              <input
                id="middlename"
                name="middlename"
                type="text"
                value={formData.middlename}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Santos"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="juan@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="09123456789"
              />
            </div>

            <div>
              <label
                htmlFor="birthday"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Birthday
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="homeAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Home Address
              </label>
              <input
                id="homeAddress"
                name="homeAddress"
                type="text"
                value={formData.homeAddress}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="123 Main St, City"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="yoroiAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Yoroi Address *
              </label>
              <input
                id="yoroiAddress"
                name="yoroiAddress"
                type="text"
                required
                value={formData.yoroiAddress}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="addr1..."
              />
            </div>

            <div>
              <label
                htmlFor="registrationSource"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Registration Source *
              </label>
              <select
                id="registrationSource"
                name="registrationSource"
                required
                value={formData.registrationSource}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ONSITE">Onsite</option>
                <option value="PRE_REGISTRATION">Pre-Registration</option>
                <option value="MOBILE_APP">Mobile App</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="mlkbankoAmount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                MLKBANKO Amount (₱) *
              </label>
              <input
                id="mlkbankoAmount"
                name="mlkbankoAmount"
                type="number"
                step="0.01"
                required
                value={formData.mlkbankoAmount}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="500"
              />
            </div>

            <div>
              <label
                htmlFor="registrationFee"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Registration Fee (₱) *
              </label>
              <input
                id="registrationFee"
                name="registrationFee"
                type="number"
                step="0.01"
                required
                value={formData.registrationFee}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Image{" "}
                {imageFiles.qrCode && (
                  <span className="text-indigo-600">(New)</span>
                )}
              </label>
              {imagePreviews.qrCode ? (
                <div className="relative">
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreviews.qrCode}
                      alt="QR Code Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage("qrCode")}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <svg
                      className="w-4 h-4"
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
              ) : (
                <label className="cursor-pointer">
                  <div className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-center">
                    <svg
                      className="w-8 h-8 mx-auto text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600">
                      Click to upload QR code
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file, "qrCode");
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Proof Image{" "}
                {imageFiles.paymentProof && (
                  <span className="text-indigo-600">(New)</span>
                )}
              </label>
              {imagePreviews.paymentProof ? (
                <div className="relative">
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreviews.paymentProof}
                      alt="Payment Proof Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage("paymentProof")}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <svg
                      className="w-4 h-4"
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
              ) : (
                <label className="cursor-pointer">
                  <div className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-center">
                    <svg
                      className="w-8 h-8 mx-auto text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600">
                      Click to upload payment proof
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file, "paymentProof");
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {uploading
                ? "Uploading images..."
                : createParticipant.isPending || updateParticipant.isPending
                ? "Saving..."
                : participant
                ? "Update Participant"
                : "Add Participant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
