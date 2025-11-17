/* eslint-disable @typescript-eslint/no-unused-vars */
// FILE: app/prereg/[link]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

type EventData = {
  id: string;
  facilitator: string;
  date: string;
  isPreRegOpen: boolean;
  defaultMlkbankoAmount: number;
  defaultRegistrationFee: number;
};

type ParticipantForm = {
  fullname: string;
  email: string;
  phoneNumber: string;
  homeAddress: string;
  birthday: string;
  participantType: "NEW" | "OLD";
  yoroiAddress: string;
  qrCodeUrl: string;
  mlkbankoAmount: string;
  registrationFee: string;
  paymentProofUrl: string;
};

type SearchResult = {
  id: string;
  fullname: string;
  email: string | null;
  phoneNumber: string | null;
  homeAddress: string | null;
  birthday: Date | null;
  yoroiAddress: string;
  qrCodeUrl: string | null;
};

export default function PreRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const link = params.link as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [paymentProofMode, setPaymentProofMode] = useState<
    "SEPARATE" | "GROUP"
  >("SEPARATE");

  const [participants, setParticipants] = useState<ParticipantForm[]>([
    {
      fullname: "",
      email: "",
      phoneNumber: "",
      homeAddress: "",
      birthday: "",
      participantType: "NEW",
      yoroiAddress: "",
      qrCodeUrl: "",
      mlkbankoAmount: "",
      registrationFee: "",
      paymentProofUrl: "",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState<string[]>([""]);
  const [searchResults, setSearchResults] = useState<SearchResult[][]>([[]]);
  const [searching, setSearching] = useState<boolean[]>([false]);

  const [qrCodeFiles, setQrCodeFiles] = useState<(File | null)[]>([null]);
  const [qrCodePreviews, setQrCodePreviews] = useState<(string | null)[]>([
    null,
  ]);
  const [paymentProofFiles, setPaymentProofFiles] = useState<(File | null)[]>([
    null,
  ]);
  const [paymentProofPreviews, setPaymentProofPreviews] = useState<
    (string | null)[]
  >([null]);

  // Group payment proof (single file for all participants)
  const [groupPaymentProofFile, setGroupPaymentProofFile] =
    useState<File | null>(null);
  const [groupPaymentProofPreview, setGroupPaymentProofPreview] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/prereg/event?link=${link}`);
        const data = await response.json();

        if (data.success) {
          setEvent(data.event);
          setParticipants([
            {
              fullname: "",
              email: "",
              phoneNumber: "",
              homeAddress: "",
              birthday: "",
              participantType: "NEW",
              yoroiAddress: "",
              qrCodeUrl: "",
              mlkbankoAmount: data.event.defaultMlkbankoAmount.toString(),
              registrationFee: data.event.defaultRegistrationFee.toString(),
              paymentProofUrl: "",
            },
          ]);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [link]);

  const handleSearch = async (index: number) => {
    const query = searchQuery[index];
    if (!query || query.trim().length < 3) {
      alert("Please enter at least 3 characters to search");
      return;
    }

    const newSearching = [...searching];
    newSearching[index] = true;
    setSearching(newSearching);

    try {
      const response = await fetch(
        `/api/prereg/search-participant?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.success) {
        const newResults = [...searchResults];
        newResults[index] = data.participants;
        setSearchResults(newResults);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Failed to search participants");
    } finally {
      const newSearching = [...searching];
      newSearching[index] = false;
      setSearching(newSearching);
    }
  };

  const handleSelectParticipant = (
    index: number,
    participant: SearchResult
  ) => {
    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
      fullname: participant.fullname,
      email: participant.email || "",
      phoneNumber: participant.phoneNumber || "",
      homeAddress: participant.homeAddress || "",
      birthday: participant.birthday
        ? new Date(participant.birthday).toISOString().slice(0, 10)
        : "",
      yoroiAddress: participant.yoroiAddress,
      qrCodeUrl: participant.qrCodeUrl || "",
    };
    setParticipants(newParticipants);

    if (participant.qrCodeUrl) {
      const newPreviews = [...qrCodePreviews];
      newPreviews[index] = participant.qrCodeUrl;
      setQrCodePreviews(newPreviews);
    }

    const newResults = [...searchResults];
    newResults[index] = [];
    setSearchResults(newResults);

    const newSearchQuery = [...searchQuery];
    newSearchQuery[index] = "";
    setSearchQuery(newSearchQuery);
  };

  const handleParticipantChange = (
    index: number,
    field: keyof ParticipantForm,
    value: string
  ) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value as never;
    setParticipants(newParticipants);

    if (field === "participantType") {
      if (value === "NEW") {
        newParticipants[index].yoroiAddress = "";
        newParticipants[index].qrCodeUrl = "";
        const newPreviews = [...qrCodePreviews];
        newPreviews[index] = null;
        setQrCodePreviews(newPreviews);
        const newFiles = [...qrCodeFiles];
        newFiles[index] = null;
        setQrCodeFiles(newFiles);
      }
    }
  };

  const handleFileSelect = (
    index: number,
    file: File,
    type: "qrCode" | "paymentProof"
  ) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
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
      alert("Only JPEG, PNG, WEBP, and GIF images are allowed");
      return;
    }

    if (type === "qrCode") {
      const newFiles = [...qrCodeFiles];
      newFiles[index] = file;
      setQrCodeFiles(newFiles);

      const newPreviews = [...qrCodePreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setQrCodePreviews(newPreviews);
    } else {
      const newFiles = [...paymentProofFiles];
      newFiles[index] = file;
      setPaymentProofFiles(newFiles);

      const newPreviews = [...paymentProofPreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setPaymentProofPreviews(newPreviews);
    }
  };

  const handleGroupPaymentProofSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
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
      alert("Only JPEG, PNG, WEBP, and GIF images are allowed");
      return;
    }

    setGroupPaymentProofFile(file);
    setGroupPaymentProofPreview(URL.createObjectURL(file));
  };

  const removeImage = (index: number, type: "qrCode" | "paymentProof") => {
    if (type === "qrCode") {
      const newFiles = [...qrCodeFiles];
      newFiles[index] = null;
      setQrCodeFiles(newFiles);

      const newPreviews = [...qrCodePreviews];
      newPreviews[index] = null;
      setQrCodePreviews(newPreviews);

      const newParticipants = [...participants];
      newParticipants[index].qrCodeUrl = "";
      setParticipants(newParticipants);
    } else {
      const newFiles = [...paymentProofFiles];
      newFiles[index] = null;
      setPaymentProofFiles(newFiles);

      const newPreviews = [...paymentProofPreviews];
      newPreviews[index] = null;
      setPaymentProofPreviews(newPreviews);

      const newParticipants = [...participants];
      newParticipants[index].paymentProofUrl = "";
      setParticipants(newParticipants);
    }
  };

  const removeGroupPaymentProof = () => {
    setGroupPaymentProofFile(null);
    setGroupPaymentProofPreview(null);
  };

  const uploadImage = async (
    file: File,
    folder: string
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("resourceType", "image");

      // Use the public prereg upload endpoint (no auth required)
      const response = await fetch("/api/prereg/upload", {
        method: "POST",
        body: formData,
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

  const addParticipant = () => {
    if (!event) return;

    setParticipants([
      ...participants,
      {
        fullname: "",
        email: "",
        phoneNumber: "",
        homeAddress: "",
        birthday: "",
        participantType: "NEW",
        yoroiAddress: "",
        qrCodeUrl: "",
        mlkbankoAmount: event.defaultMlkbankoAmount.toString(),
        registrationFee: event.defaultRegistrationFee.toString(),
        paymentProofUrl: "",
      },
    ]);
    setSearchQuery([...searchQuery, ""]);
    setSearchResults([...searchResults, []]);
    setSearching([...searching, false]);
    setQrCodeFiles([...qrCodeFiles, null]);
    setQrCodePreviews([...qrCodePreviews, null]);
    setPaymentProofFiles([...paymentProofFiles, null]);
    setPaymentProofPreviews([...paymentProofPreviews, null]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length === 1) {
      alert("You must have at least one participant");
      return;
    }

    setParticipants(participants.filter((_, i) => i !== index));
    setSearchQuery(searchQuery.filter((_, i) => i !== index));
    setSearchResults(searchResults.filter((_, i) => i !== index));
    setSearching(searching.filter((_, i) => i !== index));
    setQrCodeFiles(qrCodeFiles.filter((_, i) => i !== index));
    setQrCodePreviews(qrCodePreviews.filter((_, i) => i !== index));
    setPaymentProofFiles(paymentProofFiles.filter((_, i) => i !== index));
    setPaymentProofPreviews(paymentProofPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all participants
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];

      if (!participant.fullname) {
        alert(`Participant ${i + 1}: Full name is required`);
        return;
      }

      if (participant.participantType === "OLD" && !participant.yoroiAddress) {
        alert(
          `Participant ${
            i + 1
          }: Yoroi address is required for returning participants`
        );
        return;
      }
    }

    // Validate payment proofs
    if (isBatchMode && paymentProofMode === "GROUP") {
      if (!groupPaymentProofFile) {
        alert("Please upload a group payment proof for all participants");
        return;
      }
    } else {
      // Separate mode - each participant needs their own
      for (let i = 0; i < participants.length; i++) {
        if (!paymentProofFiles[i] && !participants[i].paymentProofUrl) {
          alert(`Participant ${i + 1}: Payment proof is required`);
          return;
        }
      }
    }

    setUploadingImages(true);
    setSubmitting(true);

    try {
      let groupPaymentProofUrl = "";

      // Upload group payment proof if in GROUP mode
      if (
        isBatchMode &&
        paymentProofMode === "GROUP" &&
        groupPaymentProofFile
      ) {
        groupPaymentProofUrl =
          (await uploadImage(groupPaymentProofFile, "payment-proofs")) || "";
      }

      // Upload all images
      const participantsWithUrls = await Promise.all(
        participants.map(async (participant, index) => {
          let qrCodeUrl = participant.qrCodeUrl;
          let paymentProofUrl = participant.paymentProofUrl;

          if (qrCodeFiles[index]) {
            qrCodeUrl =
              (await uploadImage(qrCodeFiles[index]!, "qr-codes")) || "";
          }

          // Use group payment proof URL if in GROUP mode, otherwise upload individual
          if (paymentProofMode === "GROUP" && groupPaymentProofUrl) {
            paymentProofUrl = groupPaymentProofUrl;
          } else if (paymentProofFiles[index]) {
            paymentProofUrl =
              (await uploadImage(
                paymentProofFiles[index]!,
                "payment-proofs"
              )) || "";
          }

          return {
            ...participant,
            qrCodeUrl,
            paymentProofUrl,
          };
        })
      );

      setUploadingImages(false);

      // Submit registration
      const response = await fetch("/api/prereg/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event!.id,
          participants: participantsWithUrls,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/prereg/${link}/success`);
      } else {
        alert(data.message);
        setSubmitting(false);
      }
    } catch (error) {
      alert("Failed to submit registration");
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto text-red-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-600">
            {error ||
              "The event you are looking for does not exist or pre-registration is closed."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            EDT / Mini Summit Pre-Registration
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Facilitator</p>
              <p className="font-semibold text-gray-900">{event.facilitator}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Event Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(event.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Registration Mode Toggle */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Registration Mode
              </h2>
              <p className="text-sm text-gray-600">
                Switch between single and batch registration
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isBatchMode
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {isBatchMode ? "Batch Mode" : "Single Mode"}
            </button>
          </div>

          {/* Payment Proof Mode (only in batch mode) */}
          {isBatchMode && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Payment Proof Mode
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentProofMode("SEPARATE")}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    paymentProofMode === "SEPARATE"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-semibold">Separate</p>
                    <p className="text-xs mt-1">
                      Each participant uploads their own
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentProofMode("GROUP")}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    paymentProofMode === "GROUP"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-semibold">Group</p>
                    <p className="text-xs mt-1">One payment proof for all</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Group Payment Proof Upload (only in batch mode with GROUP option) */}
        {isBatchMode && paymentProofMode === "GROUP" && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Group Payment Proof *
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload one payment proof for all participants in this batch
            </p>

            {groupPaymentProofPreview ? (
              <div className="relative w-full h-64">
                <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={groupPaymentProofPreview}
                    alt="Group Payment Proof Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={removeGroupPaymentProof}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-3"
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
                  <p className="text-gray-600 font-medium">
                    Click to upload group payment proof
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will be used for all participants below
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max 10MB • JPEG, PNG, WEBP, GIF
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleGroupPaymentProofSelect(file);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {participants.map((participant, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Participant {participants.length > 1 ? `#${index + 1}` : ""}
                </h2>
                {participants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    className="text-red-600 hover:text-red-800"
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
                )}
              </div>

              {/* Participant Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleParticipantChange(index, "participantType", "NEW")
                    }
                    className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                      participant.participantType === "NEW"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    New Member
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleParticipantChange(index, "participantType", "OLD")
                    }
                    className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                      participant.participantType === "OLD"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    Returning Member
                  </button>
                </div>
              </div>

              {/* Search for OLD participants */}
              {participant.participantType === "OLD" && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Your Name or Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery[index]}
                      onChange={(e) => {
                        const newQuery = [...searchQuery];
                        newQuery[index] = e.target.value;
                        setSearchQuery(newQuery);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter at least 3 characters..."
                    />
                    <button
                      type="button"
                      onClick={() => handleSearch(index)}
                      disabled={searching[index]}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {searching[index] ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults[index] && searchResults[index].length > 0 && (
                    <div className="mt-4 max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                      {searchResults[index].map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleSelectParticipant(index, result)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                        >
                          <p className="font-medium text-gray-900">
                            {result.fullname}
                          </p>
                          {result.email && (
                            <p className="text-sm text-gray-600">
                              {result.email}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor={`fullname-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    id={`fullname-${index}`}
                    type="text"
                    required
                    value={participant.fullname}
                    onChange={(e) =>
                      handleParticipantChange(index, "fullname", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`email-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id={`email-${index}`}
                    type="email"
                    value={participant.email}
                    onChange={(e) =>
                      handleParticipantChange(index, "email", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="juan@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`phoneNumber-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    id={`phoneNumber-${index}`}
                    type="text"
                    value={participant.phoneNumber}
                    onChange={(e) =>
                      handleParticipantChange(
                        index,
                        "phoneNumber",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="09123456789"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor={`homeAddress-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Home Address
                  </label>
                  <input
                    id={`homeAddress-${index}`}
                    type="text"
                    value={participant.homeAddress}
                    onChange={(e) =>
                      handleParticipantChange(
                        index,
                        "homeAddress",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="123 Main St, City"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`birthday-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Birthday
                  </label>
                  <input
                    id={`birthday-${index}`}
                    type="date"
                    value={participant.birthday}
                    onChange={(e) =>
                      handleParticipantChange(index, "birthday", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {participant.participantType === "OLD" && (
                  <div>
                    <label
                      htmlFor={`yoroiAddress-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Yoroi Address *
                    </label>
                    <input
                      id={`yoroiAddress-${index}`}
                      type="text"
                      required={participant.participantType === "OLD"}
                      value={participant.yoroiAddress}
                      onChange={(e) =>
                        handleParticipantChange(
                          index,
                          "yoroiAddress",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="addr1..."
                    />
                  </div>
                )}

                {participant.participantType === "OLD" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code Image{" "}
                      {qrCodeFiles[index] && (
                        <span className="text-indigo-600">(New)</span>
                      )}
                    </label>
                    {qrCodePreviews[index] ? (
                      <div className="relative w-48 h-48">
                        <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={qrCodePreviews[index]!}
                            alt="QR Code Preview"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index, "qrCode")}
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
                            if (file) handleFileSelect(index, file, "qrCode");
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* Individual Payment Proof (only if SEPARATE mode or not in batch) */}
                {(!isBatchMode || paymentProofMode === "SEPARATE") && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Proof *{" "}
                      {paymentProofFiles[index] && (
                        <span className="text-indigo-600">(New)</span>
                      )}
                    </label>
                    {paymentProofPreviews[index] ? (
                      <div className="relative w-full h-48">
                        <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={paymentProofPreviews[index]!}
                            alt="Payment Proof Preview"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index, "paymentProof")}
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
                          required={!participant.paymentProofUrl}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              handleFileSelect(index, file, "paymentProof");
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Participant Button */}
          {isBatchMode && (
            <button
              type="button"
              onClick={addParticipant}
              className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 mb-6"
            >
              + Add Another Participant
            </button>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {uploadingImages
                ? "Uploading images..."
                : submitting
                ? "Submitting..."
                : `Register ${participants.length} Participant${
                    participants.length > 1 ? "s" : ""
                  }`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
