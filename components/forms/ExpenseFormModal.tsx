// FILE: components/forms/ExpenseFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useCreateExpense, useUpdateExpense } from "@/hooks/useExpenses";
import { useAppDispatch } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import { Expense } from "@/types";
import Image from "next/image";

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  expense?: (Expense & { addedBy: { id: string; name: string } }) | null;
}

export default function ExpenseFormModal({
  isOpen,
  onClose,
  eventId,
  expense,
}: ExpenseFormModalProps) {
  const dispatch = useAppDispatch();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense(expense?.id || "");

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    receiptUrl: "",
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUploading(false);

    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        receiptUrl: expense.receiptUrl || "",
      });
      setReceiptPreview(expense.receiptUrl || null);
      setReceiptFile(null);
    } else {
      setFormData({
        description: "",
        amount: "",
        receiptUrl: "",
      });
      setReceiptPreview(null);
      setReceiptFile(null);
    }
  }, [expense, isOpen]);

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      dispatch(
        showToast({
          message: "File size must be less than 10MB",
          type: "error",
        })
      );
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
      dispatch(
        showToast({
          message: "Only JPEG, PNG, WEBP, and GIF images are allowed",
          type: "error",
        })
      );
      return;
    }

    setReceiptFile(file);
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);
  };

  const removeReceipt = () => {
    setReceiptFile(null);

    if (expense) {
      const originalUrl = expense.receiptUrl;
      setReceiptPreview(originalUrl || null);
      setFormData((prev) => ({ ...prev, receiptUrl: originalUrl || "" }));
    } else {
      setReceiptPreview(null);
      setFormData((prev) => ({ ...prev, receiptUrl: "" }));
    }
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      const token = localStorage.getItem("token");

      const formDataToUpload = new FormData();
      formDataToUpload.append("file", file);
      formDataToUpload.append("folder", "receipts");
      formDataToUpload.append("resourceType", "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToUpload,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      dispatch(
        showToast({
          message: "Please fill in all required fields",
          type: "error",
        })
      );
      return;
    }

    setUploading(true);

    try {
      let receiptUrl = formData.receiptUrl;

      if (receiptFile) {
        receiptUrl = (await uploadReceipt(receiptFile)) || "";
      }

      const submitData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        receiptUrl,
        eventId,
      };

      const mutation = expense ? updateExpense : createExpense;

      mutation.mutate(submitData, {
        onSuccess: () => {
          setUploading(false);
          onClose();
          setReceiptFile(null);
          setReceiptPreview(null);

          if (!expense) {
            setFormData({
              description: "",
              amount: "",
              receiptUrl: "",
            });
          }
        },
        onError: () => {
          setUploading(false);
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      dispatch(
        showToast({ message: "Failed to upload receipt", type: "error" })
      );
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  const isSubmitting =
    createExpense.isPending || updateExpense.isPending || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 my-8 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {expense ? "Edit Expense" : "Add Expense"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {expense
                ? "Update expense details"
                : "Record a new expense for this event"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-150"
                placeholder="e.g., Venue rental, Food catering, Transportation"
              />
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Amount (₱) <span className="text-red-500">*</span>
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
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150"
                placeholder="1000.00"
              />
            </div>
          </div>

          {/* Receipt Upload Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Receipt Image{" "}
              {receiptFile && (
                <span className="text-indigo-600 font-bold">(New)</span>
              )}
            </label>
            {receiptPreview ? (
              <div className="relative">
                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                  <Image
                    src={receiptPreview}
                    alt="Receipt Preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-lg transition-all duration-150"
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
                <div className="w-full px-4 py-10 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 text-center transition-all duration-150">
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
                  <p className="text-gray-600 font-medium mb-1">
                    Click to upload receipt
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
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-indigo-500/30"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading receipt...
                </span>
              ) : createExpense.isPending || updateExpense.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : expense ? (
                "Update Expense"
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
