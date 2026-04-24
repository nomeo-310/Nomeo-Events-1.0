import type { JSX } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function PageSkeleton(): JSX.Element {
  return (
    <div className="container w-full mx-auto py-8 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-6" />
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-6" />
      <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventNotFound(): JSX.Element {
  const router = useRouter();
  return (
    <div className="container mx-auto w-full py-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <HugeiconsIcon icon={InformationCircleIcon} size={28} className="text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Event not found</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        This event could not be loaded. It may have been deleted.
      </p>
      <Button type="button" variant="outline" onClick={() => router.push("/dashboard/events")}>
        Back to Events
      </Button>
    </div>
  );
}