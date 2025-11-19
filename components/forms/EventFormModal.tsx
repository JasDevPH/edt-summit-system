// FILE: components/forms/EventFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { Event } from "@/types";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
}

export default function EventFormModal({
  isOpen,
  onClose,
  event,
}: EventFormModalProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(event?.id || "");

  const [formData, setFormData] = useState({
    facilitator: "",
    date: "",
    defaultMlkbankoAmount: "500",
    defaultRegistrationFee: "100",
    totalCryptoReceived: "0",
  });

  useEffect(() => {
    if (event) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        facilitator: event.facilitator,
        date: new Date(event.date).toISOString().slice(0, 16),
        defaultMlkbankoAmount: event.defaultMlkbankoAmount.toString(),
        defaultRegistrationFee: event.defaultRegistrationFee.toString(),
        totalCryptoReceived: event.totalCryptoReceived.toString(),
      });
    } else {
      setFormData({
        facilitator: "",
        date: "",
        defaultMlkbankoAmount: "500",
        defaultRegistrationFee: "100",
        totalCryptoReceived: "0",
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      facilitator: formData.facilitator,
      date: formData.date,
      defaultMlkbankoAmount: parseFloat(formData.defaultMlkbankoAmount),
      defaultRegistrationFee: parseFloat(formData.defaultRegistrationFee),
      totalCryptoReceived: parseFloat(formData.totalCryptoReceived),
    };

    const mutation = event ? updateEvent : createEvent;

    mutation.mutate(submitData, {
      onSuccess: () => {
        onClose();
        setFormData({
          facilitator: "",
          date: "",
          defaultMlkbankoAmount: "500",
          defaultRegistrationFee: "100",
          totalCryptoReceived: "0",
        });
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 my-8 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {event ? "Edit Event" : "Create New Event"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {event
                ? "Update event information"
                : "Set up a new EDT Summit event"}
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
          {/* Facilitator Field */}
          <div>
            <label
              htmlFor="facilitator"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Facilitator Name <span className="text-red-500">*</span>
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                id="facilitator"
                name="facilitator"
                type="text"
                required
                value={formData.facilitator}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 text-black"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Date Field */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Event Date & Time <span className="text-red-500">*</span>
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
                id="date"
                name="date"
                type="datetime-local"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 text-black"
              />
            </div>
          </div>

          {/* Total Crypto Received Field */}
          <div>
            <label
              htmlFor="totalCryptoReceived"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Total Crypto Received (₱) <span className="text-red-500">*</span>
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <input
                id="totalCryptoReceived"
                name="totalCryptoReceived"
                type="number"
                step="0.01"
                required
                value={formData.totalCryptoReceived}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 text-black"
                placeholder="20000000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Total amount of crypto received for this event
            </p>
          </div>

          {/* Default MLKBANKO Amount Field */}
          <div>
            <label
              htmlFor="defaultMlkbankoAmount"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Default MLKBANKO Amount (₱){" "}
              <span className="text-red-500">*</span>
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
                id="defaultMlkbankoAmount"
                name="defaultMlkbankoAmount"
                type="number"
                step="0.01"
                required
                value={formData.defaultMlkbankoAmount}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 text-black"
                placeholder="500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              This amount will be pre-filled when adding participants
            </p>
          </div>

          {/* Default Registration Fee Field */}
          <div>
            <label
              htmlFor="defaultRegistrationFee"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Default Registration Fee (₱){" "}
              <span className="text-red-500">*</span>
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
                id="defaultRegistrationFee"
                name="defaultRegistrationFee"
                type="number"
                step="0.01"
                required
                value={formData.defaultRegistrationFee}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 text-black"
                placeholder="100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              This amount will be pre-filled when adding participants
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEvent.isPending || updateEvent.isPending}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-indigo-500/30"
            >
              {createEvent.isPending || updateEvent.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : event ? (
                "Update Event"
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
