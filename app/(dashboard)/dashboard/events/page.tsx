/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: app/(dashboard)/dashboard/events/page.tsx
"use client";

import { useState } from "react";
import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import { useRouter } from "next/navigation";
import EventFormModal from "@/components/forms/EventFormModal";
import { Event } from "@/types";
import { format } from "date-fns";

export default function EventsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const canCreateEvent =
    user?.role === "ADMIN" ||
    user?.role === "IT" ||
    user?.role === "FACILITATOR";
  const canDelete = user?.role === "ADMIN" || user?.role === "IT";

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteEvent.mutate(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const copyPreRegLink = (preRegLink: string) => {
    const fullUrl = `${window.location.origin}/prereg/${preRegLink}`;
    navigator.clipboard.writeText(fullUrl);
    dispatch(
      showToast({ message: "Pre-registration link copied!", type: "success" })
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">
            Manage EDT(Economic Development Training) Summits.
          </p>
        </div>
        {canCreateEvent && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
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
            Create Event
          </button>
        )}
      </div>

      {data?.events && data.events.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first event
          </p>
          {canCreateEvent && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Create Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.events.map((event: any) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {event.facilitator}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(event.date), "MMM dd, yyyy h:mm a")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      event.isPreRegOpen
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {event.isPreRegOpen ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>{event._count?.participants || 0} Participants</span>
                  </div>
                  <div className="flex items-center gap-2">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{event._count?.expenses || 0} Expenses</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/events/${event.id}`)}
                    className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => copyPreRegLink(event.preRegLink)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                    title="Copy pre-registration link"
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
                  </button>
                </div>

                {(canCreateEvent || canDelete) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    {canCreateEvent && (
                      <button
                        onClick={() => handleEdit(event)}
                        className="flex-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                          deleteConfirm === event.id
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {deleteConfirm === event.id
                          ? "Confirm Delete?"
                          : "Delete"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
      />
    </div>
  );
}
