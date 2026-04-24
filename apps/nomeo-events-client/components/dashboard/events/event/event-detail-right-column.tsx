import type { JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroup03Icon as UsersIcon,
  Calendar03Icon as CalendarIcon,
  Settings01Icon as SettingsIcon,
  MoneyBagIcon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons";
import { Section, SettingRow } from "./event-detail-primitives";
import { formatDate, formatTime, getLowestPrice } from "./event-detail-helpers";

interface EventDetailRightColumnProps {
  event:           any;
  seatsUsed:       number;
  seatPct:         number;
  waitlistEnabled: boolean;
  requiresApproval: boolean;
  regDeadline:     string | undefined;
  ageReq:          any;
}

export function EventDetailRightColumn({
  event, seatsUsed, seatPct, waitlistEnabled, requiresApproval, regDeadline, ageReq,
}: EventDetailRightColumnProps): JSX.Element {
  return (
    <div className="space-y-5">

      {/* Capacity */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={UsersIcon} size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Capacity</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">Seats filled</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {seatsUsed} / {event.totalSeats}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${seatPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{seatPct}% full</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: event.totalSeats,                       label: "Total",     color: "text-indigo-600 dark:text-indigo-400" },
              { value: event.availableSeats ?? event.totalSeats, label: "Available", color: "text-green-600 dark:text-green-400"  },
            ].map(({ value, label, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {waitlistEnabled && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <HugeiconsIcon icon={UsersIcon} size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Waitlist enabled</p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing */}
      <Section icon={MoneyBagIcon} title="Pricing">
        <div className="text-center py-2">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{getLowestPrice(event.plans ?? [])}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Starting price</p>
        </div>
        {(event.plans?.length ?? 0) > 1 && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
            {event.plans!.length} ticket plans available
          </p>
        )}
      </Section>

      {/* Settings */}
      <Section icon={SettingsIcon} title="Settings">
        <SettingRow label="Visibility" value={event.isPublic ? "Public" : "Private"}                   active={event.isPublic}      />
        <SettingRow label="Approval"   value={requiresApproval ? "Requires approval" : "Auto-approve"} active={requiresApproval}    />
        <SettingRow label="Featured"   value={event.featured ? "Featured event" : "Not featured"}      active={event.featured}      />
        <SettingRow label="Waitlist"   value={waitlistEnabled ? "Enabled" : "Disabled"}                active={waitlistEnabled}     />
      </Section>

      {/* Registration deadline */}
      {regDeadline && (
        <Section icon={CalendarIcon} title="Registration Deadline">
          <div className="text-center py-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(regDeadline)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">at {formatTime(regDeadline)}</p>
          </div>
        </Section>
      )}

      {/* Age gate quick view */}
      {ageReq?.required && (
        <Section icon={ShieldUserIcon} title="Age Gate">
          <div className="text-center py-2 space-y-1">
            {ageReq.minAge && (
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{ageReq.minAge}+</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">Minimum age required</p>
            {ageReq.requiresParentalConsent && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2">Parental consent required</p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}