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
    // Validate file size (10MB)
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

    // Validate file type
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

      // Only upload if NEW file is selected
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {expense ? "Edit Expense" : "Add Expense"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="e.g., Venue rental, Food catering, Transportation"
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Amount (₱) *
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="1000.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Image{" "}
              {receiptFile && <span className="text-indigo-600">(New)</span>}
            </label>
            {receiptPreview ? (
              <div className="relative">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
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
                    Click to upload receipt
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {uploading
                ? "Uploading receipt..."
                : createExpense.isPending || updateExpense.isPending
                ? "Saving..."
                : expense
                ? "Update Expense"
                : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
