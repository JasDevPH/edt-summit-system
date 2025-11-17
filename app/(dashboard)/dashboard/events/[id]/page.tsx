// FILE: app/(dashboard)/dashboard/events/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEvent, useTogglePreReg } from "@/hooks/useEvents";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import { format } from "date-fns";
import { useState } from "react";
import EventFormModal from "@/components/forms/EventFormModal";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const eventId = params.id as string;
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading } = useEvent(eventId);
  const togglePreReg = useTogglePreReg(eventId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "IT" ||
    user?.role === "FACILITATOR";
  const canTogglePreReg =
    user?.role === "ADMIN" ||
    user?.role === "IT" ||
    user?.role === "FACILITATOR";

  const copyPreRegLink = () => {
    if (data?.event) {
      const fullUrl = `${window.location.origin}/prereg/${data.event.preRegLink}`;
      navigator.clipboard.writeText(fullUrl);
      dispatch(
        showToast({ message: "Pre-registration link copied!", type: "success" })
      );
    }
  };

  const handleTogglePreReg = () => {
    togglePreReg.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!data?.event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Event not found</p>
        <button
          onClick={() => router.push("/dashboard/events")}
          className="mt-4 text-indigo-600 hover:text-indigo-700"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const { event, summary } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/events")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Events
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {event.facilitator}
            </h1>
            <p className="text-gray-600 mt-2">
              {format(new Date(event.date), "EEEE, MMMM dd, yyyy - h:mm a")}
            </p>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Edit Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
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
              <p className="text-sm text-gray-600">Participants</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.totalParticipants || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
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
              <p className="text-sm text-gray-600">MLKBANKO Total</p>
              <p className="text-2xl font-bold text-gray-900">
                €{summary?.totalMlkbanko?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
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
              <p className="text-sm text-gray-600">Registration Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                ₱{summary?.totalRegistrationFees?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
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
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                ₱{summary?.totalExpenses?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Registration Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Pre-Registration
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Status:{" "}
              <span
                className={
                  event.isPreRegOpen
                    ? "text-green-600 font-medium"
                    : "text-gray-600"
                }
              >
                {event.isPreRegOpen ? "Open" : "Closed"}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyPreRegLink}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Link
            </button>
            {canTogglePreReg && (
              <button
                onClick={handleTogglePreReg}
                disabled={togglePreReg.isPending}
                className={`px-4 py-2 rounded-lg font-medium ${
                  event.isPreRegOpen
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                } disabled:bg-gray-400`}
              >
                {togglePreReg.isPending
                  ? "Updating..."
                  : event.isPreRegOpen
                  ? "Close Registration"
                  : "Open Registration"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() =>
            router.push(`/dashboard/events/${eventId}/participants`)
          }
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Participants
            </h3>
          </div>
          <p className="text-gray-600 text-sm">
            View and manage event participants
          </p>
        </button>

        <button
          onClick={() => router.push(`/dashboard/events/${eventId}/expenses`)}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Expenses
            </h3>
          </div>
          <p className="text-gray-600 text-sm">
            Track and manage event expenses
          </p>
        </button>

        <button
          onClick={() => router.push(`/dashboard/reports?eventId=${eventId}`)}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
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
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Generate Report
            </h3>
          </div>
          <p className="text-gray-600 text-sm">Export financial reports</p>
        </button>
      </div>

      <EventFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={event}
      />
    </div>
  );
}
