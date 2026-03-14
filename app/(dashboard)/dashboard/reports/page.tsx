// FILE: app/(dashboard)/dashboard/reports/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useAppSelector } from "@/store/store";
import { useSearchParams } from "next/navigation";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");

  const { user } = useAppSelector((state) => state.auth);
  const { data: eventsData } = useEvents();

  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventIdParam || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventIdParam) {
      setSelectedEventId(eventIdParam);
    }
  }, [eventIdParam]);

  const canViewReports =
    user?.role === "ADMIN" ||
    user?.role === "IT" ||
    user?.role === "FACILITATOR" ||
    user?.role === "FINANCE";

  if (!canViewReports) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          You do not have permission to view reports
        </p>
      </div>
    );
  }

  const handleExport = async (format: "xlsx" | "csv") => {
    if (!selectedEventId) {
      alert("Please select an event first");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/reports/export?eventId=${selectedEventId}&format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `event_report_${selectedEventId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export report");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Export</h1>
        <p className="text-gray-600 mt-2">Generate and export event reports</p>
      </div>

      {/* Event Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="event"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Event *
            </label>
            <select
              id="event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- Select Event --</option>
              {eventsData?.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.facilitator} -{" "}
                  {new Date(event.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => handleExport("xlsx")}
              disabled={!selectedEventId || loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Excel
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={!selectedEventId || loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {selectedEventId && <ReportPreview eventId={selectedEventId} />}
    </div>
  );
}

// Report Preview Component
function ReportPreview({ eventId }: { eventId: string }) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/reports/preview?eventId=${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setReportData(data);
        }
      } catch (error) {
        console.error("Fetch report error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading report preview...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600">No data available for this event</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Facilitator Summary Report */}
      <FacilitatorSummarySection data={reportData} />

      {/* Section 2: Detailed Participant Report */}
      <DetailedParticipantSection data={reportData} />

      {/* Section 3: Financial Report */}
      <FinancialReportSection data={reportData} />
    </div>
  );
}

// Section 1: Facilitator Summary
function FacilitatorSummarySection({ data }: { data: any }) {
  // Use totalCryptoReceived from event, fallback to calculated total if 0
  const totalCryptoReceived =
    data.event.totalCryptoReceived > 0
      ? data.event.totalCryptoReceived
      : data.summary.totalMlkbanko;

  // Check if using remaining balance
  const useRemainingBalance = data.event.useRemainingBalance || false;

  // Calculate personal 20% - if using remaining balance, it's 0
  const personalAmount = useRemainingBalance ? 0 : totalCryptoReceived * 0.2;
  
  // Calculate for distribution - if using remaining balance, all goes to distribution
  const forDistribution = useRemainingBalance
    ? totalCryptoReceived
    : totalCryptoReceived * 0.8;

  // Calculate total distributed amount
  const totalDistributed = data.participants
    .filter((p: any) => p.distributionStatus === "DISTRIBUTED")
    .reduce((sum: number, p: any) => sum + p.mlkbankoAmount, 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          Table 1: FACILITATOR&apos;S SUMMARY REPORT
        </h2>
      </div>
      <div className="p-6">
        {/* Facilitator Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Facilitator&apos;s Name:</p>
            <p className="font-semibold">{data.event.facilitator}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">EDT Conducted Date:</p>
            <p className="font-semibold">
              {new Date(data.event.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Summary Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300">
                  Total Crypto Received
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300">
                  Personal (20%)
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300">
                  For Distribution (80%)
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300">
                  Total Recipients
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300">
                  Total Distributed
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 border border-gray-300">
                  €{totalCryptoReceived.toLocaleString()}
                </td>
                <td className="px-4 py-2 border border-gray-300">
                  €{personalAmount.toLocaleString()}
                  {useRemainingBalance && (
                    <span className="ml-1 text-xs text-amber-600">(From Remaining)</span>
                  )}
                </td>
                <td className="px-4 py-2 border border-gray-300">
                  €{forDistribution.toLocaleString()}
                </td>
                <td className="px-4 py-2 border border-gray-300">
                  {data.summary.totalParticipants}
                </td>
                <td className="px-4 py-2 border border-gray-300">
                  €{totalDistributed.toLocaleString()}
                </td>
                <td className="px-4 py-2 border border-gray-300">
                  €
                  {(
                    forDistribution -
                    totalDistributed
                  ).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Section 2: Detailed Participants
function DetailedParticipantSection({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          Table 2: DETAILED EDT REPORT
        </h2>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  Full Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  Phone Number
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  Home Address
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  Birthday
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  Yoroi Address
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  MLKBANKO Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.participants.map((participant: any, index: number) => (
                <tr key={participant.id}>
                  <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                    {participant.fullname}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                    {participant.email || "-"}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                    {participant.phoneNumber || "-"}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 max-w-xs">
                    {participant.homeAddress || "-"}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                    {participant.birthday
                      ? new Date(participant.birthday).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 font-mono text-xs max-w-md truncate">
                    {participant.yoroiAddress}
                  </td>
                  <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                    €{participant.mlkbankoAmount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <span
                      className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                        participant.distributionStatus === "DISTRIBUTED"
                          ? "bg-green-100 text-green-800"
                          : participant.distributionStatus === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {participant.distributionStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Section 3: Financial Report
function FinancialReportSection({ data }: { data: any }) {
  const totalReceipts = data.summary.totalRegistrationFees;
  const totalExpenses = data.summary.totalExpenses;
  const certificateFees = data.summary.totalParticipants * 200; // 200 per certificate

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          Table 3: SUMMARY OF FINANCIAL REPORT FOR EDT CONDUCTED
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Side - Receipts */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Facilitator&apos;s Name:</p>
              <p className="font-semibold">{data.event.facilitator}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">EDT Conducted Date:</p>
              <p className="font-semibold">
                {new Date(data.event.date).toLocaleDateString()}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">
                  Total Number of Delegates:
                </span>
                <span className="font-semibold">
                  {data.summary.totalParticipants}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">
                  Received Registration Fees:
                </span>
                <span className="font-semibold">
                  ₱{totalReceipts.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Certificate Fees to BML:</span>
                <span className="font-semibold">
                  ₱{certificateFees.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Expenses */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">EXPENSES:</h3>
            {data.expenses.map((expense: any) => (
              <div key={expense.id} className="flex justify-between">
                <span className="text-gray-700">{expense.description}:</span>
                <span className="font-semibold">
                  ₱{expense.amount.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-gray-300">
              <span className="font-semibold text-gray-900">
                TOTAL EXPENSES:
              </span>
              <span className="font-bold">
                ₱{totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cash Balance Section */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <h3 className="font-semibold text-gray-900 mb-4">
            SIMPLE CASH BALANCE
          </h3>
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Receipts:</span>
              <span className="font-semibold">
                ₱{totalReceipts.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Less: Certificate Fees:</span>
              <span className="font-semibold">
                ₱{certificateFees.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Less: Total Expenses:</span>
              <span className="font-semibold">
                ₱{totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-gray-900">
              <span className="font-bold text-gray-900">
                ENDING CASH BALANCE:
              </span>
              <span className="font-bold text-lg">
                ₱
                {(
                  totalReceipts -
                  certificateFees -
                  totalExpenses
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
