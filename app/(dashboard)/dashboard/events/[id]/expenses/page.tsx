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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-medium">
            Loading expenses...
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
              Expenses
            </h1>
            <p className="text-gray-600 mt-2">
              {eventData?.event.facilitator} -{" "}
              {eventData?.event.date &&
                format(new Date(eventData.event.date), "MMM dd, yyyy")}
            </p>
          </div>
          {canAdd && (
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
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                  d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {expensesData?.count || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
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
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-red-600">
                ₱{expensesData?.totalAmount?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <label
          htmlFor="search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search by description
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
            placeholder="Search expenses..."
          />
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses && filteredExpenses.length === 0 ? (
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No expenses yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first expense
          </p>
          {canAdd && (
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
              Add Expense
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses?.map((expense) => (
            <div
              key={expense.id}
              className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                      {expense.description}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        {format(new Date(expense.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                  {expense.receiptUrl && (
                    <div className="ml-2 shrink-0 p-2 bg-green-50 rounded-lg">
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

                {/* Amount */}
                <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs text-red-600 font-medium mb-1">
                    Amount
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    ₱{expense.amount.toLocaleString()}
                  </p>
                </div>

                {/* Added By */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {expense.addedBy.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">Added by</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {expense.addedBy.name}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleView(expense)}
                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    View
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(expense)}
                      className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
