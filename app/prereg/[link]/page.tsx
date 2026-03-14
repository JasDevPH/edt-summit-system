// FILE: app/prereg/[link]/page.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

const QrScannerModal = dynamic(
  () => import("@/components/prereg/QrScannerModal"),
  { ssr: false }
);

type EventData = {
  id: string;
  facilitator: string;
  date: string;
  isPreRegOpen: boolean;
  defaultMlkbankoAmount: number;
  defaultRegistrationFee: number;
};

type ParticipantForm = {
  lastname: string;
  firstname: string;
  middlename: string;
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
      lastname: "",
      firstname: "",
      middlename: "",
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

  const [groupPaymentProofFile, setGroupPaymentProofFile] =
    useState<File | null>(null);
  const [groupPaymentProofPreview, setGroupPaymentProofPreview] = useState<
    string | null
  >(null);

  const [scannerOpen, setScannerOpen] = useState<{
    index: number;
    mode: "scan" | "capture";
  } | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/prereg/event?link=${link}`);
        const data = await response.json();

        if (data.success) {
          setEvent(data.event);
          setParticipants([
            {
              lastname: "",
              firstname: "",
              middlename: "",
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

  const parseFullname = (fullname: string) => {
    const parts = fullname.split(",");
    const lastname = parts[0]?.trim() || "";
    const firstAndMiddle = parts[1]?.trim().split(" ") || [];
    const firstname = firstAndMiddle[0] || "";
    const middlename = firstAndMiddle.slice(1).join(" ") || "";
    return { lastname, firstname, middlename };
  };

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
    const { lastname, firstname, middlename } = parseFullname(
      participant.fullname
    );

    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
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
        lastname: "",
        firstname: "",
        middlename: "",
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

    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];

      if (!participant.lastname || !participant.firstname) {
        alert(`Participant ${i + 1}: Last name and first name are required`);
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

    if (isBatchMode && paymentProofMode === "GROUP") {
      if (!groupPaymentProofFile) {
        alert("Please upload a group payment proof for all participants");
        return;
      }
    } else {
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

      if (
        isBatchMode &&
        paymentProofMode === "GROUP" &&
        groupPaymentProofFile
      ) {
        groupPaymentProofUrl =
          (await uploadImage(groupPaymentProofFile, "payment-proofs")) || "";
      }

      const participantsWithUrls = await Promise.all(
        participants.map(async (participant, index) => {
          let qrCodeUrl = participant.qrCodeUrl;
          let paymentProofUrl = participant.paymentProofUrl;

          if (qrCodeFiles[index]) {
            qrCodeUrl =
              (await uploadImage(qrCodeFiles[index]!, "qr-codes")) || "";
          }

          if (paymentProofMode === "GROUP" && groupPaymentProofUrl) {
            paymentProofUrl = groupPaymentProofUrl;
          } else if (paymentProofFiles[index]) {
            paymentProofUrl =
              (await uploadImage(
                paymentProofFiles[index]!,
                "payment-proofs"
              )) || "";
          }

          const fullname = participant.middlename
            ? `${participant.lastname}, ${participant.firstname} ${participant.middlename}`
            : `${participant.lastname}, ${participant.firstname}`;

          return {
            fullname,
            email: participant.email,
            phoneNumber: participant.phoneNumber,
            homeAddress: participant.homeAddress,
            birthday: participant.birthday,
            participantType: participant.participantType,
            yoroiAddress: participant.yoroiAddress,
            qrCodeUrl,
            mlkbankoAmount: participant.mlkbankoAmount,
            registrationFee: participant.registrationFee,
            paymentProofUrl,
          };
        })
      );

      setUploadingImages(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-600"
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
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-t-4 border-indigo-600">
          <div className="flex items-center gap-3 mb-4">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              EDT / Mini Summit Pre-Registration
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
              <p className="text-sm text-indigo-600 font-medium mb-1">
                Facilitator
              </p>
              <p className="font-semibold text-gray-900">{event.facilitator}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <p className="text-sm text-purple-600 font-medium mb-1">
                Event Date
              </p>
              <p className="font-semibold text-gray-900">
                {new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Registration Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Registration Mode
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Switch between single and batch registration
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-150 shadow-md ${
                isBatchMode
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isBatchMode ? "✓ Batch Mode" : "Single Mode"}
            </button>
          </div>

          {/* Payment Proof Mode */}
          {isBatchMode && (
            <div className="pt-4 border-t-2 border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-indigo-600"
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
                Payment Proof Mode
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentProofMode("SEPARATE")}
                  className={`px-4 py-4 border-2 rounded-xl font-medium transition-all duration-150 ${
                    paymentProofMode === "SEPARATE"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-bold text-lg">Separate</p>
                    <p className="text-xs mt-1">
                      Each participant uploads their own
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentProofMode("GROUP")}
                  className={`px-4 py-4 border-2 rounded-xl font-medium transition-all duration-150 ${
                    paymentProofMode === "GROUP"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-bold text-lg">Group</p>
                    <p className="text-xs mt-1">One payment proof for all</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Group Payment Proof Upload */}
        {isBatchMode && paymentProofMode === "GROUP" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-2 border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
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
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Group Payment Proof <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-gray-600">
                  Upload one payment proof for all participants in this batch
                </p>
              </div>
            </div>

            {groupPaymentProofPreview ? (
              <div className="relative w-full h-64">
                <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
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
                  className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-lg transition-all duration-150"
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
              <label className="cursor-pointer block">
                <div className="w-full px-4 py-12 border-2 border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50 text-center transition-all duration-150">
                  <svg
                    className="w-16 h-16 mx-auto text-indigo-400 mb-3"
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
                  <p className="text-indigo-700 font-semibold text-lg mb-2">
                    Click to upload group payment proof
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    This will be used for all participants below
                  </p>
                  <p className="text-xs text-gray-500">
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
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-l-4 border-indigo-600"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                    {participants.length > 1 ? (
                      index + 1
                    ) : (
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Participant{" "}
                    {participants.length > 1 ? `#${index + 1}` : "Information"}
                  </h2>
                </div>
                {participants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-all duration-150"
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Participant Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleParticipantChange(index, "participantType", "NEW")
                    }
                    className={`px-4 py-4 border-2 rounded-xl font-semibold transition-all duration-150 ${
                      participant.participantType === "NEW"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    ✨ New Member
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleParticipantChange(index, "participantType", "OLD")
                    }
                    className={`px-4 py-4 border-2 rounded-xl font-semibold transition-all duration-150 ${
                      participant.participantType === "OLD"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    🔄 Returning Member
                  </button>
                </div>
              </div>

              {/* Search for OLD participants */}
              {participant.participantType === "OLD" && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
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
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter at least 3 characters..."
                    />
                    <button
                      type="button"
                      onClick={() => handleSearch(index)}
                      disabled={searching[index]}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-all duration-150 shadow-md"
                    >
                      {searching[index] ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Searching...
                        </span>
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults[index] && searchResults[index].length > 0 && (
                    <div className="mt-4 max-h-48 overflow-y-auto border-2 border-indigo-200 rounded-xl bg-white">
                      {searchResults[index].map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleSelectParticipant(index, result)}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-200 last:border-b-0 transition-all duration-150"
                        >
                          <p className="font-semibold text-gray-900">
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
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor={`lastname-${index}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`lastname-${index}`}
                      type="text"
                      required
                      value={participant.lastname}
                      onChange={(e) =>
                        handleParticipantChange(
                          index,
                          "lastname",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                      placeholder="Dela Cruz"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`firstname-${index}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`firstname-${index}`}
                      type="text"
                      required
                      value={participant.firstname}
                      onChange={(e) =>
                        handleParticipantChange(
                          index,
                          "firstname",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                      placeholder="Juan"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`middlename-${index}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Middle Name
                    </label>
                    <input
                      id={`middlename-${index}`}
                      type="text"
                      value={participant.middlename}
                      onChange={(e) =>
                        handleParticipantChange(
                          index,
                          "middlename",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                      placeholder="Santos (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`email-${index}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                      placeholder="juan@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`phoneNumber-${index}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                      placeholder="09123456789"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor={`homeAddress-${index}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                      placeholder="123 Main St, City"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`birthday-${index}`}
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Birthday
                    </label>
                    <input
                      id={`birthday-${index}`}
                      type="date"
                      value={participant.birthday}
                      onChange={(e) =>
                        handleParticipantChange(
                          index,
                          "birthday",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                    />
                  </div>

                  {participant.participantType === "OLD" && (
                    <div>
                      <label
                        htmlFor={`yoroiAddress-${index}`}
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Yoroi Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
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
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                          placeholder="addr1..."
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setScannerOpen({ index, mode: "scan" })
                          }
                          className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-150 shadow-md flex items-center gap-1"
                          title="Scan QR Code"
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
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                            />
                          </svg>
                          <span className="hidden sm:inline text-sm font-semibold">Scan</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QR Code Upload for OLD participants */}
                  {participant.participantType === "OLD" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        QR Code Image{" "}
                        {qrCodeFiles[index] && (
                          <span className="text-indigo-600 font-bold">
                            (New)
                          </span>
                        )}
                      </label>
                      {qrCodePreviews[index] ? (
                        <div className="relative w-48 h-48">
                          <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
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
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setScannerOpen({ index, mode: "capture" })
                            }
                            className="w-full px-4 py-8 border-2 border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50 text-center transition-all duration-150"
                          >
                            <svg
                              className="w-10 h-10 mx-auto text-indigo-400 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <p className="text-sm text-indigo-600 font-medium">
                              Take Photo
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Use camera
                            </p>
                          </button>
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
                                Upload Image
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Max 10MB
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleFileSelect(index, file, "qrCode");
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual Payment Proof */}
                  {(!isBatchMode || paymentProofMode === "SEPARATE") && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Payment Proof <span className="text-red-500">*</span>{" "}
                        {paymentProofFiles[index] && (
                          <span className="text-indigo-600 font-bold">
                            (New)
                          </span>
                        )}
                      </label>
                      {paymentProofPreviews[index] ? (
                        <div className="relative w-full h-48">
                          <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
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
                              Click to upload payment proof
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Max 10MB
                            </p>
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
            </div>
          ))}

          {/* Add Participant Button */}
          {isBatchMode && (
            <button
              type="button"
              onClick={addParticipant}
              className="w-full py-4 border-2 border-dashed border-indigo-400 rounded-2xl text-indigo-700 font-bold text-lg hover:bg-indigo-50 mb-6 transition-all duration-150 flex items-center justify-center gap-2"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Another Participant
            </button>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-indigo-600">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-150 shadow-lg shadow-indigo-500/30"
            >
              {uploadingImages ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading images...
                </span>
              ) : submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting Registration...
                </span>
              ) : (
                `Submit Registration (${participants.length} participant${
                  participants.length > 1 ? "s" : ""
                })`
              )}
            </button>
          </div>
        </form>

        {scannerOpen && (
          <QrScannerModal
            isOpen={true}
            onClose={() => setScannerOpen(null)}
            mode={scannerOpen.mode}
            onScanSuccess={(address) => {
              handleParticipantChange(
                scannerOpen.index,
                "yoroiAddress",
                address
              );
              setScannerOpen(null);
            }}
            onCaptureSuccess={(file) => {
              handleFileSelect(scannerOpen.index, file, "qrCode");
              setScannerOpen(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
