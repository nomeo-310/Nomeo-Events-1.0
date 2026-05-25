"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Something went wrong during sign-in.");

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description") ?? "";
    const combined = `${error ?? ""} ${errorDescription}`.toLowerCase();

    if (combined.includes("scheduled for deletion") || combined.includes("deactivated")) {
      setMessage(
        "This account has been deactivated or is scheduled for deletion. Please contact support if you believe this is a mistake."
      );
    } else if (combined.includes("suspended")) {
      setMessage(
        "Your account has been suspended. Please contact support for more information."
      );
    }

    // Sign out silently in case a partial session was created
    authClient.signOut().catch(() => {});
  }, [searchParams]);

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Sign-in Blocked
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
        <button
          onClick={handleBack}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}