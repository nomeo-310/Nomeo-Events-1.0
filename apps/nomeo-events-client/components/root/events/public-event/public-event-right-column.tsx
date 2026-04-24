import type { JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroup03Icon as UsersIcon,
  Calendar03Icon as CalendarIcon,
  ShieldUserIcon,
  MoneyBagIcon,
  TicketIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Section } from "./public-event-primitives";
import { formatDate, formatTime, getLowestPrice } from "./public-event-helpers";
import { cn } from "@/lib/utils";

interface PublicEventRightColumnProps {
  event:           any;
  seatsUsed:       number;
  seatPct:         number;
  waitlistEnabled: boolean;
  regDeadline:     string | undefined;
  ageReq:          any;
  onRegister:      () => void;
  registrationOpen: boolean;
}

export function PublicEventRightColumn({
  event, seatsUsed, seatPct, waitlistEnabled,
  regDeadline, ageReq, onRegister, registrationOpen,
}: PublicEventRightColumnProps): JSX.Element {
  const price    = getLowestPrice(event.plans ?? []);
  const isFree   = price === "Free";
  const seatsLeft = event.availableSeats ?? event.totalSeats;
  const soldOut   = event.totalSeats > 0 && seatsLeft <= 0;

  return (
    <div className="space-y-5">

      {/* Sticky register CTA card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Starting from</p>
            <p className={cn(
              "text-3xl font-bold",
              isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
            )}>{price}</p>
          </div>

          {/* Seat bar */}
          {event.totalSeats > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <span>{seatsLeft} seats available</span>
                <span>{seatPct}% filled</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    seatPct >= 90 ? "bg-red-500" : seatPct >= 70 ? "bg-amber-500" : "bg-indigo-600"
                  )}
                  style={{ width: `${seatPct}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onRegister}
            disabled={!registrationOpen || soldOut}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              soldOut || !registrationOpen
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-95"
            )}
          >
            <HugeiconsIcon icon={TicketIcon} size={16} />
            {soldOut ? "Sold Out" : !registrationOpen ? "Registration Closed" : "Register Now"}
          </button>

          {waitlistEnabled && soldOut && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 font-medium">
              Waitlist available — register to join the queue
            </p>
          )}

          {regDeadline && (
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              Register by {formatDate(regDeadline)} at {formatTime(regDeadline)}
            </p>
          )}
        </div>
      </div>

      {/* Capacity */}
      {event.totalSeats > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UsersIcon} size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Capacity</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: event.totalSeats, label: "Total",     color: "text-indigo-600 dark:text-indigo-400" },
                { value: seatsLeft,        label: "Available", color: seatsLeft <= 0 ? "text-red-500" : "text-green-600 dark:text-green-400" },
              ].map(({ value, label, color }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Organizer */}
      {event.organizerId && (
        <Section icon={UserIcon} title="Organiser">
          <div className="flex items-center gap-3">
            {event.organizerId.image ? (
              <img src={event.organizerId.image} alt={event.organizerId.name}
                className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {String(event.organizerId.name ?? "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{event.organizerId.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{event.organizerId.email}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Age gate quick info */}
      {ageReq?.required && ageReq.minAge && (
        <Section icon={ShieldUserIcon} title="Age Restriction">
          <div className="text-center py-2 space-y-1">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{ageReq.minAge}+</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Minimum age required</p>
            {ageReq.requiresParentalConsent && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                Under-18s need parental consent
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Registration deadline */}
      {regDeadline && (
        <Section icon={CalendarIcon} title="Registration Deadline">
          <div className="text-center py-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(regDeadline)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">at {formatTime(regDeadline)}</p>
          </div>
        </Section>
      )}
    </div>
  );
}