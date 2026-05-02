// FILE: components/modals/ParticipantViewModal.tsx
"use client";

import { Participant } from "@/types";
import { parseFullname } from "@/lib/nameUtils";
import Image from "next/image";

interface ParticipantViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
}

export default function ParticipantViewModal({
  isOpen,
  onClose,
  participant,
}: ParticipantViewModalProps) {
  if (!isOpen || !participant) return null;

  const { lastname, firstname, middlename, suffix } = parseFullname(
    participant.fullname
  );

  const getStatusColor = (status: string) => {
    const colors = {
      DISTRIBUTED: "bg-green-100 text-green-700 border-green-200",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      FAILED: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const getSourceColor = (source: string) => {
    const colors = {
      PRE_REGISTRATION: "bg-blue-100 text-blue-700 border-blue-200",
      ONSITE: "bg-green-100 text-green-700 border-green-200",
      MOBILE_APP: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[source as keyof typeof colors] || colors.ONSITE;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Participant Details
              </h2>
              <p className="text-sm text-gray-600">
                Complete participant information
              </p>
            </div>
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

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
                <p className="text-xs font-semibold text-indigo-600 mb-1">
                  Last Name
                </p>
                <p className="font-semibold text-gray-900">{lastname}</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <p className="text-xs font-semibold text-purple-600 mb-1">
                  First Name
                </p>
                <p className="font-semibold text-gray-900">{firstname}</p>
              </div>

              {middlename && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                  <p className="text-xs font-semibold text-blue-600 mb-1">
                    Middle Name
                  </p>
                  <p className="font-semibold text-gray-900">{middlename}</p>
                </div>
              )}

              {suffix && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
                  <p className="text-xs font-semibold text-green-600 mb-1">
                    Suffix
                  </p>
                  <p className="font-semibold text-gray-900">{suffix}</p>
                </div>
              )}

              {participant.email && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Email
                  </p>
                  <p className="font-medium text-gray-900 break-all text-sm">
                    {participant.email}
                  </p>
                </div>
              )}

              {participant.phoneNumber && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Phone Number
                  </p>
                  <p className="font-medium text-gray-900">
                    {participant.phoneNumber}
                  </p>
                </div>
              )}

              {participant.birthday && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Birthday
                  </p>
                  <p className="font-medium text-gray-900">
                    {new Date(participant.birthday).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              {participant.homeAddress && (
                <div className="md:col-span-3 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Home Address
                  </p>
                  <p className="font-medium text-gray-900">
                    {participant.homeAddress}
                  </p>
                </div>
              )}

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <p className="text-xs font-semibold text-green-600 mb-1">
                  Registration Source
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getSourceColor(
                    participant.registrationSource
                  )}`}
                >
                  {participant.registrationSource === "PRE_REGISTRATION"
                    ? "Pre-Registration"
                    : participant.registrationSource === "ONSITE"
                    ? "Onsite"
                    : "Mobile App"}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-600"
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
              Wallet Information
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Yoroi Address
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-white p-3 rounded-lg break-all flex-1 border border-gray-200">
                    {participant.yoroiAddress}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(participant.yoroiAddress);
                    }}
                    className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                    title="Copy address"
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {participant.qrCodeUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    QR Code
                  </p>
                  <div className="relative w-64 h-64 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 mx-auto">
                    <Image
                      src={participant.qrCodeUrl}
                      alt="Yoroi QR Code"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-600"
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
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200">
                <p className="text-sm text-indigo-600 font-semibold mb-1">
                  MLKBANKO Amount
                </p>
                <p className="text-3xl font-bold text-indigo-700">
                  ₱{participant.mlkbankoAmount.toLocaleString()}
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                <p className="text-sm text-green-600 font-semibold mb-1">
                  Registration Fee
                </p>
                <p className="text-3xl font-bold text-green-700">
                  ₱{participant.registrationFee.toLocaleString()}
                </p>
              </div>

              <div className="md:col-span-2 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-300">
                <p className="text-sm text-gray-600 font-semibold mb-1">
                  Total Amount
                </p>
                <p className="text-4xl font-bold text-gray-900">
                  ₱
                  {(
                    participant.mlkbankoAmount + participant.registrationFee
                  ).toLocaleString()}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Distribution Status
                </p>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 ${getStatusColor(
                    participant.distributionStatus
                  )}`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      participant.distributionStatus === "DISTRIBUTED"
                        ? "bg-green-600"
                        : participant.distributionStatus === "PENDING"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                    }`}
                  />
                  {participant.distributionStatus}
                </span>
              </div>

              {participant.paymentProofUrl && (
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Payment Proof
                  </p>
                  <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image
                      src={participant.paymentProofUrl}
                      alt="Payment Proof"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Created At</p>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(participant.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Participant ID</p>
                <p className="font-mono text-xs text-gray-900 break-all">
                  {participant.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
