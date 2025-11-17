// FILE: app/(dashboard)/dashboard/events/[id]/expenses/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEvent } from "@/hooks/useEvents";
import { useExpenses, useDeleteExpense } from "@/hooks/useExpenses";
import { useAppSelector } from "@/store/store";
import { format } from "date-fns";
import ExpenseFormModal from "@/components/forms/ExpenseFormModal";
import ExpenseViewModal from "@/components/modals/ExpenseViewModal";
import { Expense } from "@/types";

type ExpenseWithUser = Expense & {
  addedBy: {
    id: string;
    name: string;
  };
};

export default function ExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAppSelector((state) => state.auth);

  const { data: eventData } = useEvent(eventId);
  const { data: expensesData, isLoading } = useExpenses({ eventId });
  const deleteExpense = useDeleteExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithUser | null>(null);
  const [viewExpense, setViewExpense] = useState<ExpenseWithUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const canAdd =
    user?.role === "ADMIN" || user?.role === "IT" || user?.role === "FINANCE";
  const canEdit =
    user?.role === "ADMIN" || user?.role === "IT" || user?.role === "FINANCE";
  const canDelete = user?.role === "ADMIN" || user?.role === "IT";

  const handleView = (expense: ExpenseWithUser) => {
    setViewExpense(expense);
    setIsViewModalOpen(true);
  };

  const handleEdit = (expense: ExpenseWithUser) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteExpense.mutate(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewExpense(null);
  };

  const handleAddNew = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const filteredExpenses = expensesData?.expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/events/${eventId}`)}
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
          Back to Event
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-2">
              {eventData?.event.facilitator} -{" "}
              {eventData?.event.date &&
                format(new Date(eventData.event.date), "MMM dd, yyyy")}
            </p>
          </div>
          {canAdd && (
            <button
              onClick={handleAddNew}
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
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-gray-900">
            {expensesData?.count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-red-600">
            ₱{expensesData?.totalAmount?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Search by description
          </label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Search expenses..."
          />
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses && filteredExpenses.length === 0 ? (
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No expenses yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first expense
          </p>
          {canAdd && (
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Add Expense
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses?.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {expense.description}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(
                        new Date(expense.createdAt),
                        "MMM dd, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                  {expense.receiptUrl && (
                    <div className="ml-2 shrink-0">
                      <svg
                        className="w-5 h-5 text-green-600"
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
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₱{expense.amount.toLocaleString()}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Added by {expense.addedBy.name}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(expense)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                  >
                    View
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(expense)}
                      className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                        deleteConfirm === expense.id
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {deleteConfirm === expense.id ? "Confirm?" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        eventId={eventId}
        expense={selectedExpense}
      />

      <ExpenseViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        expense={viewExpense}
      />
    </div>
  );
}
