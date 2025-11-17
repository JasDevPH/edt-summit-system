// FILE: components/modals/ExpenseViewModal.tsx
"use client";

import { Expense } from "@/types";
import { format } from "date-fns";
import Image from "next/image";

interface ExpenseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense:
    | (Expense & {
        addedBy: {
          id: string;
          name: string;
        };
      })
    | null;
}

export default function ExpenseViewModal({
  isOpen,
  onClose,
  expense,
}: ExpenseViewModalProps) {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
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
          {/* Expense Info */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Description
            </label>
            <p className="text-gray-900">{expense.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Amount
            </label>
            <p className="text-3xl font-bold text-red-600">
              ₱{expense.amount.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Added By
              </label>
              <p className="text-gray-900">{expense.addedBy.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Date
              </label>
              <p className="text-gray-900">
                {format(new Date(expense.createdAt), "MMM dd, yyyy h:mm a")}
              </p>
            </div>
          </div>

          {/* Receipt Image */}
          {expense.receiptUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Receipt
              </label>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={expense.receiptUrl}
                  alt="Receipt"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700"
              >
                Open in new tab →
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
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
