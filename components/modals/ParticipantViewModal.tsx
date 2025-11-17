// FILE: components/modals/ParticipantViewModal.tsx
"use client";

import { Participant } from "@/types";
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

  // Parse fullname into components (assuming format: "Lastname, Firstname Middlename")
  const parseFullname = (fullname: string) => {
    const parts = fullname.split(",");
    const lastname = parts[0]?.trim() || "";
    const firstAndMiddle = parts[1]?.trim().split(" ") || [];
    const firstname = firstAndMiddle[0] || "";
    const middlename = firstAndMiddle.slice(1).join(" ") || "";

    return { lastname, firstname, middlename };
  };

  const { lastname, firstname, middlename } = parseFullname(
    participant.fullname
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Participant Details
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

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Last Name</p>
                <p className="font-medium text-gray-900">{lastname}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">First Name</p>
                <p className="font-medium text-gray-900">{firstname}</p>
              </div>

              {middlename && (
                <div>
                  <p className="text-sm text-gray-600">Middle Name</p>
                  <p className="font-medium text-gray-900">{middlename}</p>
                </div>
              )}

              {participant.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {participant.email}
                  </p>
                </div>
              )}

              {participant.phoneNumber && (
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium text-gray-900">
                    {participant.phoneNumber}
                  </p>
                </div>
              )}

              {participant.birthday && (
                <div>
                  <p className="text-sm text-gray-600">Birthday</p>
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
                <div className="md:col-span-3">
                  <p className="text-sm text-gray-600">Home Address</p>
                  <p className="font-medium text-gray-900">
                    {participant.homeAddress}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Registration Source</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    participant.registrationSource === "PRE_REGISTRATION"
                      ? "bg-blue-100 text-blue-800"
                      : participant.registrationSource === "ONSITE"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Wallet Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Yoroi Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-gray-100 p-3 rounded break-all flex-1">
                    {participant.yoroiAddress}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(participant.yoroiAddress);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
                  <p className="text-sm text-gray-600 mb-2">QR Code</p>
                  <div className="relative w-64 h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 mb-1">MLKBANKO Amount</p>
                <p className="text-2xl font-bold text-indigo-700">
                  ₱{participant.mlkbankoAmount.toLocaleString()}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Registration Fee</p>
                <p className="text-2xl font-bold text-green-700">
                  ₱{participant.registrationFee.toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₱
                  {(
                    participant.mlkbankoAmount + participant.registrationFee
                  ).toLocaleString()}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">
                  Distribution Status
                </p>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    participant.distributionStatus === "DISTRIBUTED"
                      ? "bg-green-100 text-green-800"
                      : participant.distributionStatus === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
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
                  <p className="text-sm text-gray-600 mb-2">Payment Proof</p>
                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="font-medium text-gray-900">
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
                <p className="text-sm text-gray-600">Participant ID</p>
                <p className="font-mono text-xs text-gray-900 break-all">
                  {participant.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
