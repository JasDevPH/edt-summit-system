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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {participant ? "Edit Participant" : "Add Participant"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {participant
                ? "Update participant information"
                : "Register a new participant for this event"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all duration-150"
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
          className="p-6 space-y-5 max-h-[70vh] overflow-y-auto"
        >
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="lastname"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                required
                value={formData.lastname}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                placeholder="Dela Cruz"
              />
            </div>

            <div>
              <label
                htmlFor="firstname"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                required
                value={formData.firstname}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                placeholder="Juan"
              />
            </div>

            <div>
              <label
                htmlFor="middlename"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Middle Name
              </label>
              <input
                id="middlename"
                name="middlename"
                type="text"
                value={formData.middlename}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                placeholder="Santos"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                  placeholder="juan@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                  placeholder="09123456789"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="homeAddress"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Home Address
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <input
                  id="homeAddress"
                  name="homeAddress"
                  type="text"
                  value={formData.homeAddress}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                  placeholder="123 Main St, City"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="birthday"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Birthday
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                />
              </div>
            </div>
          </div>

          {/* Yoroi Address & Registration Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="yoroiAddress"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Yoroi Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="yoroiAddress"
                  name="yoroiAddress"
                  type="text"
                  required
                  value={formData.yoroiAddress}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                  placeholder="addr1..."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="registrationSource"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Registration Source <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <select
                  id="registrationSource"
                  name="registrationSource"
                  required
                  value={formData.registrationSource}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 appearance-none bg-white"
                >
                  <option value="ONSITE">Onsite</option>
                  <option value="PRE_REGISTRATION">Pre-Registration</option>
                  <option value="MOBILE_APP">Mobile App</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="mlkbankoAmount"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                MLKBANKO Amount (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <input
                  id="mlkbankoAmount"
                  name="mlkbankoAmount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.mlkbankoAmount}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="registrationFee"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Registration Fee (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <input
                  id="registrationFee"
                  name="registrationFee"
                  type="number"
                  step="0.01"
                  required
                  value={formData.registrationFee}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Image Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* QR Code Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                QR Code Image{" "}
                {imageFiles.qrCode && (
                  <span className="text-indigo-600 font-bold">(New)</span>
                )}
              </label>
              {imagePreviews.qrCode ? (
                <div className="relative w-full h-40">
                  <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
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
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-lg transition-all duration-150"
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
                <label className="cursor-pointer block">
                  <div className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 text-center transition-all duration-150">
                    <svg
                      className="w-10 h-10 mx-auto text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">QR Code</p>
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

            {/* Payment Proof Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Proof{" "}
                {imageFiles.paymentProof && (
                  <span className="text-indigo-600 font-bold">(New)</span>
                )}
              </label>
              {imagePreviews.paymentProof ? (
                <div className="relative w-full h-40">
                  <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
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
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-lg transition-all duration-150"
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
                <label className="cursor-pointer block">
                  <div className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 text-center transition-all duration-150">
                    <svg
                      className="w-10 h-10 mx-auto text-gray-400 mb-2"
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
                    <p className="text-sm text-gray-600 font-medium">
                      Payment Proof
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-indigo-500/30"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading images...
                </span>
              ) : createParticipant.isPending || updateParticipant.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : participant ? (
                "Update Participant"
              ) : (
                "Add Participant"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
