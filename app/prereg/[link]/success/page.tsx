// FILE: app/prereg/[link]/success/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const params = useParams();
  const link = params.link as string;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Registration Successful!
        </h1>

        <p className="text-gray-600 mb-2">
          Thank you for pre-registering for the EDT(Economic Development
          Training) Summit.
        </p>

        <p className="text-gray-600 mb-8">
          Your registration has been submitted successfully.
        </p>

        <div className="space-y-4">
          <Link
            href={`/prereg/${link}`}
            className="block w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Register Another Participant
          </Link>

          <p className="text-sm text-gray-500">
            Please save your registration details. If you have any questions,
            please contact the event organizer.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            What&apos;s Next?
          </h3>
          <ul className="text-sm text-gray-600 text-left space-y-2">
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Your payment will be verified by the organizers</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                You will be added to the event&apos;s group chat for news and
                updates before or during the event.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Please arrive on time on the event day</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
