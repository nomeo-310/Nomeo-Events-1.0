import type { JSX, ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import type { SectionProps, InfoRowProps, SettingRowProps } from "./event-detail-helpers";

export function ExternalLink({ href, label }: { href: string; label: string }): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
    >
      {label}
    </a>
  );
}

export function Section({ icon, title, children, className }: SectionProps): JSX.Element {
  return (
    <div className={cn(
      "bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden",
      className
    )}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          <HugeiconsIcon icon={icon} size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function InfoRow({ label, value }: InfoRowProps): JSX.Element | null {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide sm:w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white flex-1 break-words">{value}</span>
    </div>
  );
}

export function SettingRow({ label, value, active }: SettingRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full",
        active
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
      )}>
        {value}
      </span>
    </div>
  );
}