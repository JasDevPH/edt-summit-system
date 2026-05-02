// FILE: app/(dashboard)/dashboard/events/[id]/participants/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEvent } from "@/hooks/useEvents";
import {
  useParticipants,
  useDeleteParticipant,
  useUpdateDistributionStatus,
} from "@/hooks/useParticipants";
import { useAppSelector } from "@/store/store";
import { format } from "date-fns";
import ParticipantFormModal from "@/components/forms/ParticipantFormModal";
import ParticipantViewModal from "@/components/modals/ParticipantViewModal";
import { Participant, DistributionStatus, RegistrationSource } from "@/types";
import { formatFullname } from "@/lib/nameUtils";

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAppSelector((state) => state.auth);

  const { data: eventData } = useEvent(eventId);
  const { data: participantsData, isLoading } = useParticipants({ eventId });
  const deleteParticipant = useDeleteParticipant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [viewParticipant, setViewParticipant] = useState<Participant | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "IT" ||
    user?.role === "FACILITATOR" ||
    user?.role === "FINANCE" ||
    user?.role === "STAFF";
  const canDelete =
    user?.role === "ADMIN" ||
    user?.role === "IT" ||
    user?.role === "FACILITATOR";
  const canUpdateStatus = user?.role === "ADMIN" || user?.role === "IT";

  const handleView = (participant: Participant) => {
    setViewParticipant(participant);
    setIsViewModalOpen(true);
  };

  const handleEdit = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteParticipant.mutate(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParticipant(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewParticipant(null);
  };

  const handleAddNew = () => {
    setSelectedParticipant(null);
    setIsModalOpen(true);
  };

  const filteredParticipants = participantsData?.participants.filter((p) => {
    const matchesSearch = p.fullname
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      !statusFilter || p.distributionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-medium">
            Loading participants...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/dashboard/events/${eventId}`)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 font-medium"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Event
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Participants
            </h1>
            <p className="text-gray-600 mt-2">
              {eventData?.event.facilitator} -{" "}
              {eventData?.event.date &&
                format(new Date(eventData.event.date), "MMM dd, yyyy")}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all hover:shadow-md"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Participant
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Participants</p>
              <p className="text-2xl font-bold text-gray-900">
                {participantsData?.count || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total MLKBANKO</p>
              <p className="text-2xl font-bold text-gray-900">
                ₱{participantsData?.totals.mlkbanko?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Registration Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                ₱
                {participantsData?.totals.registrationFees?.toLocaleString() ||
                  0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search by name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
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
              </div>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Search participants..."
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filter by status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="DISTRIBUTED">Distributed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      {filteredParticipants && filteredParticipants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No participants yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first participant
          </p>
          {canEdit && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Participant
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MLKBANKO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants?.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canUpdateStatus={canUpdateStatus}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    deleteConfirm={deleteConfirm}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ParticipantFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        eventId={eventId}
        participant={selectedParticipant}
      />

      <ParticipantViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        participant={viewParticipant}
      />
    </div>
  );
}

// Separate component for participant row
function ParticipantRow({
  participant,
  canEdit,
  canDelete,
  canUpdateStatus,
  onView,
  onEdit,
  onDelete,
  deleteConfirm,
}: {
  participant: Participant;
  canEdit: boolean;
  canDelete: boolean;
  canUpdateStatus: boolean;
  onView: (p: Participant) => void;
  onEdit: (p: Participant) => void;
  onDelete: (id: string) => void;
  deleteConfirm: string | null;
}) {
  const updateStatus = useUpdateDistributionStatus(participant.id);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleStatusChange = (status: DistributionStatus) => {
    updateStatus.mutate(status);
    setShowStatusMenu(false);
  };

  const statusColors: Record<DistributionStatus, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    DISTRIBUTED: "bg-green-50 text-green-700 border-green-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
  };

  const sourceColors: Record<RegistrationSource, string> = {
    PRE_REGISTRATION: "bg-blue-50 text-blue-700 border-blue-200",
    ONSITE: "bg-purple-50 text-purple-700 border-purple-200",
    MOBILE_APP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {formatFullname(participant.fullname).charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {formatFullname(participant.fullname)}
            </div>
            <div className="text-sm text-gray-500 font-mono">
              {participant.yoroiAddress.slice(0, 20)}...
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
            sourceColors[participant.registrationSource]
          }`}
        >
          {participant.registrationSource.replace("_", " ")}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ₱{participant.mlkbankoAmount.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ₱{participant.registrationFee.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap relative">
        {canUpdateStatus ? (
          <div>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
                statusColors[participant.distributionStatus]
              } hover:opacity-80 transition-opacity`}
            >
              {participant.distributionStatus}
              <svg
                className="w-3 h-3 ml-1"
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
            </button>
            {showStatusMenu && (
              <div className="absolute z-10 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={() => handleStatusChange("PENDING")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg transition-colors"
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusChange("DISTRIBUTED")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  Distributed
                </button>
                <button
                  onClick={() => handleStatusChange("FAILED")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg transition-colors"
                >
                  Failed
                </button>
              </div>
            )}
          </div>
        ) : (
          <span
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
              statusColors[participant.distributionStatus]
            }`}
          >
            {participant.distributionStatus}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {format(new Date(participant.createdAt), "MMM dd, yyyy")}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onView(participant)}
            className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors"
          >
            View
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(participant)}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(participant.id)}
              className={`font-medium transition-colors ${
                deleteConfirm === participant.id
                  ? "text-red-600 hover:text-red-700"
                  : "text-red-600 hover:text-red-900"
              }`}
            >
              {deleteConfirm === participant.id ? "Confirm?" : "Delete"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
