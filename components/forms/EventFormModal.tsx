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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {event ? "Edit Event" : "Create New Event"}
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
          <div>
            <label
              htmlFor="facilitator"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Facilitator Name *
            </label>
            <input
              id="facilitator"
              name="facilitator"
              type="text"
              required
              value={formData.facilitator}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Event Date & Time *
            </label>
            <input
              id="date"
              name="date"
              type="datetime-local"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="totalCryptoReceived"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Total Crypto Received (₱) *
            </label>
            <input
              id="totalCryptoReceived"
              name="totalCryptoReceived"
              type="number"
              step="0.01"
              required
              value={formData.totalCryptoReceived}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="20000000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total amount of crypto received for this event
            </p>
          </div>

          <div>
            <label
              htmlFor="defaultMlkbankoAmount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Default MLKBANKO Amount (₱) *
            </label>
            <input
              id="defaultMlkbankoAmount"
              name="defaultMlkbankoAmount"
              type="number"
              step="0.01"
              required
              value={formData.defaultMlkbankoAmount}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This amount will be pre-filled when adding participants
            </p>
          </div>

          <div>
            <label
              htmlFor="defaultRegistrationFee"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Default Registration Fee (₱) *
            </label>
            <input
              id="defaultRegistrationFee"
              name="defaultRegistrationFee"
              type="number"
              step="0.01"
              required
              value={formData.defaultRegistrationFee}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              This amount will be pre-filled when adding participants
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEvent.isPending || updateEvent.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {createEvent.isPending || updateEvent.isPending
                ? "Saving..."
                : event
                ? "Update Event"
                : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
