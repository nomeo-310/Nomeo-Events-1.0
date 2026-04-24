"use client";

import { useState, type JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as XIcon,
  TicketIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Calendar03Icon as CalendarIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PaystackButton } from "react-paystack";

// ── shadcn/ui form controls ────────────────────────────────────────────────────
import { Input }      from "@/components/ui/input";
import { Label }      from "@/components/ui/label";
import { Textarea }   from "@/components/ui/textarea";
import { Checkbox }   from "@/components/ui/checkbox";
import { Badge }      from "@/components/ui/badge";
import { Separator }  from "@/components/ui/separator";
import { Button }     from "@/components/ui/button";
import { Calendar }   from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

import { formatDate, formatDateTime, formatTime, toTitleCase } from "./public-event-helpers";
import { toast } from "sonner";
import { RegistrationConfirmModal } from "./registration-confirm-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  type: string;
  name: string;
  price: number;
  currency: string;
  benefits: string[];
  maxSeats?: number;
  availableSeats?: number;
  earlyBirdDeadline?: string;
}

interface AgeRequirement {
  required: boolean;
  minAge?: number;
  maxAge?: number;
  requiresParentalConsent?: boolean;
  parentalConsentMessage?: string;
}

export interface RegistrationModalProps {
  isVirtual: boolean;
  eventVenue?: string
  event:   any;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

type Step = "plan" | "attendee" | "payment" | "success";
const STEPS: Step[] = ["plan", "attendee", "payment", "success"];

const STEP_META: Record<Step, { label: string }> = {
  plan:     { label: "Choose Plan"  },
  attendee: { label: "Your Details" },
  payment:  { label: "Review & Pay" },
  success:  { label: "Confirmed"    },
};

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Halal", "Kosher",
  "Gluten-free", "Nut-free", "Dairy-free",
];

const GENDER_OPTIONS = [
  { value: "male",       label: "Male"              },
  { value: "female",     label: "Female"            },
  { value: "non-binary", label: "Non-binary"        },
  { value: "prefer-not", label: "Prefer not to say" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAgeFromDob(dob: Date | undefined): number | null {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }): JSX.Element {
  const visibleSteps = STEPS.filter((s) => s !== "success");
  const currentIdx   = STEPS.indexOf(current);

  return (
    <div className="flex items-center mb-7">
      {visibleSteps.map((step, i) => {
        const stepIdx = STEPS.indexOf(step);
        const done    = stepIdx < currentIdx;
        const active  = step === current;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                done    ? "bg-green-500 border-green-500 text-white"
                : active ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
                         : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400"
              )}>
                {done ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} /> : i + 1}
              </div>
              <span className={cn(
                "text-[10px] font-medium hidden sm:block",
                active  ? "text-indigo-600 dark:text-indigo-400"
                : done  ? "text-green-500"
                        : "text-gray-400"
              )}>
                {STEP_META[step].label}
              </span>
            </div>
            {i < visibleSteps.length - 1 && (
              <div className={cn(
                "h-px flex-1 mx-3 transition-all duration-500 mb-4",
                done ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
      {children}
    </p>
  );
}

// ─── Step 1 — Plan selection ──────────────────────────────────────────────────

function PlanStep({ plans, selected, onSelect }: {
  plans: Plan[]; selected: Plan | null; onSelect: (p: Plan) => void;
}): JSX.Element {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Select the ticket plan that works best for you.
      </p>

      {plans.map((plan) => {
        const isSel      = selected?.type === plan.type;
        const isFree     = plan.price === 0;
        const price      = isFree ? "Free" : `${plan.currency ?? "USD"} ${plan.price.toLocaleString()}`;
        const earlyLabel = plan.earlyBirdDeadline ? formatDateTime(plan.earlyBirdDeadline) : null;
        const seatsLeft  = plan.availableSeats;
        const soldOut    = seatsLeft !== undefined && seatsLeft <= 0;
        const almostGone = seatsLeft !== undefined && seatsLeft > 0 && seatsLeft <= 20;

        return (
          <button
            key={plan.type}
            type="button"
            disabled={soldOut}
            onClick={() => onSelect(plan)}
            className={cn(
              "w-full text-left rounded-xl border-2 p-4 transition-all duration-200",
              soldOut
                ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                : isSel
                ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-4 ring-indigo-100 dark:ring-indigo-900/30"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-indigo-300 dark:hover:border-indigo-700"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{plan.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-normal">
                    {toTitleCase(plan.type)}
                  </Badge>
                  {soldOut && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 h-4">Sold out</Badge>
                  )}
                  {almostGone && !soldOut && (
                    <Badge className="text-[10px] px-1.5 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
                      Only {seatsLeft} left!
                    </Badge>
                  )}
                </div>

                {plan.benefits?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {plan.benefits.map((b, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={9} className="text-green-500 shrink-0" />
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                {earlyLabel && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    🕐 Early bird until {earlyLabel}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span className={cn(
                  "text-xl font-bold",
                  isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                )}>
                  {price}
                </span>
                {plan.maxSeats && (
                  <span className="text-[10px] text-gray-400">{plan.maxSeats} max seats</span>
                )}
                {isSel && !soldOut && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center mt-1">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 2 — Attendee details ────────────────────────────────────────────────

interface AttendeeForm {
  name: string;
  email: string;
  phone: string;
  dob: Date | undefined;
  gender: string;
  company: string;
  title: string;
  specialRequests: string;
  dietary: string[];
  accessibility: string;
  isGroup: boolean;
  groupSize: string;
  groupName: string;
  parentalConsentByName: string;
  parentalConsentByEmail: string;
}

function AttendeeStep({ form, onChange, ageReq, needsAge }: {
  form: AttendeeForm;
  onChange: <K extends keyof AttendeeForm>(k: K, v: AttendeeForm[K]) => void;
  ageReq: AgeRequirement | null;
  needsAge: boolean;
}): JSX.Element {
  const age = getAgeFromDob(form.dob);
  const requiresConsent = ageReq?.requiresParentalConsent && age !== null && age < 18;

  return (
    <div className="space-y-6">

      {/* Personal */}
      <div>
        <SectionHeading>Personal Information</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <Input
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </Field>

          <Field label="Email Address" required>
            <Input
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </Field>

          <Field label="Phone Number">
            <Input
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </Field>

          <Field label="Gender">
            <Select value={form.gender} onValueChange={(v) => onChange("gender", v ?? "")}>
              <SelectTrigger className="w-full h-10 lg:h-11">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {needsAge && (
            <Field
              label="Date of Birth"
              required
              hint={age !== null ? `Age: ${age} years old` : undefined}
            >
              <Popover>
                <PopoverTrigger className={cn("w-full justify-start text-left font-normal flex items-center border h-10 lg:h-11 px-3 rounded-lg", !form.dob && "text-muted-foreground")}>
                  <HugeiconsIcon icon={CalendarIcon} size={16} className="mr-2 text-gray-400 shrink-0" />
                  {form.dob ? format(form.dob, "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.dob}
                    onSelect={(d) => onChange("dob", d)}
                    disabled={(date) => date > new Date()}
                    captionLayout="dropdown"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
          )}
        </div>
      </div>

      <Separator />

      {/* Professional */}
      <div>
        <SectionHeading>Professional (Optional)</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company / Organisation">
            <Input
              placeholder="Acme Inc."
              value={form.company}
              onChange={(e) => onChange("company", e.target.value)}
            />
          </Field>
          <Field label="Job Title">
            <Input
              placeholder="Product Manager"
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Parental consent */}
      {requiresConsent && (
        <>
          <Separator />
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 text-base mt-0.5">⚠</span>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                {ageReq?.parentalConsentMessage ??
                  "Parental consent is required for attendees under 18."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Parent / Guardian Name" required>
                <Input
                  placeholder="Parent name"
                  value={form.parentalConsentByName}
                  onChange={(e) => onChange("parentalConsentByName", e.target.value)}
                />
              </Field>
              <Field label="Parent / Guardian Email" required>
                <Input
                  type="email"
                  placeholder="parent@example.com"
                  value={form.parentalConsentByEmail}
                  onChange={(e) => onChange("parentalConsentByEmail", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Preferences */}
      <div>
        <SectionHeading>Preferences &amp; Needs</SectionHeading>
        <div className="space-y-4">
          <Field label="Dietary Restrictions">
            <div className="flex flex-wrap gap-2 pt-1">
              {DIETARY_OPTIONS.map((d) => {
                const active = form.dietary.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      onChange(
                        "dietary",
                        active
                          ? form.dietary.filter((x) => x !== d)
                          : [...form.dietary, d]
                      )
                    }
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150",
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Accessibility Needs">
            <Input
              placeholder="e.g. Wheelchair access, hearing loop…"
              value={form.accessibility}
              onChange={(e) => onChange("accessibility", e.target.value)}
            />
          </Field>

          <Field label="Special Requests">
            <Textarea
              rows={3}
              placeholder="Any other requests or notes…"
              value={form.specialRequests}
              onChange={(e) => onChange("specialRequests", e.target.value)}
              className="resize-none"
            />
          </Field>
        </div>
      </div>

      <Separator />

      {/* Group */}
      <div>
        <SectionHeading>Group Registration</SectionHeading>
        <div className="flex items-center gap-3 mb-4">
          <Checkbox
            id="isGroup"
            checked={form.isGroup}
            onCheckedChange={(v) => onChange("isGroup", Boolean(v))}
          />
          <Label htmlFor="isGroup" className="text-sm cursor-pointer font-normal text-gray-700 dark:text-gray-300">
            Register as a group
          </Label>
        </div>
        {form.isGroup && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Group Name">
              <Input
                placeholder="Team Acme"
                value={form.groupName}
                onChange={(e) => onChange("groupName", e.target.value)}
              />
            </Field>
            <Field label="Group Size">
              <Input
                type="number"
                min={2}
                placeholder="e.g. 5"
                value={form.groupSize}
                onChange={(e) => onChange("groupSize", e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3 — Payment / Review ────────────────────────────────────────────────

interface PaymentStepProps {
  plan: Plan;
  form: AttendeeForm;
  event: any;
  onRegistrationComplete: (paymentData?: any) => Promise<void>;
  isLoading: boolean;
}

function PaymentStep({ plan, form, event, onRegistrationComplete, isLoading }: PaymentStepProps): JSX.Element {
  const isFree = plan.price === 0;
  const price = isFree ? "Free" : `${plan.currency ?? "USD"} ${plan.price.toLocaleString()}`;
  const amountInKobo = plan.price * 100;
  const age = getAgeFromDob(form.dob);

  const handleFreeRegistration = async () => {
    await onRegistrationComplete();
  };

  const handlePaystackSuccess = async (response: any) => {
    await onRegistrationComplete({
      reference: response.reference,
      transactionId: response.transaction,
      status: "success",
    });
  };

  const handlePaystackClose = () => {
    console.log("Paystack modal closed");
  };

  const OrderSummary = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Summary</p>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{toTitleCase(plan.type)}</p>
            {form.isGroup && form.groupSize && (
              <p className="text-xs text-gray-400 mt-1">
                Group: {form.groupName || "Unnamed"} · {form.groupSize} attendees
              </p>
            )}
          </div>
          <span className={cn(
            "text-xl font-bold shrink-0",
            isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
          )}>
            {price}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
          <span className={cn(
            "text-sm font-bold",
            isFree ? "text-green-600 dark:text-green-400" : "text-indigo-600 dark:text-indigo-400"
          )}>
            {price}
          </span>
        </div>
      </div>
    </div>
  );

  const AttendeeSummary = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Attendee Details</p>
      </div>
      <div className="px-4 py-4 space-y-2.5">
        {[
          { label: "Name", value: form.name },
          { label: "Email", value: form.email },
          { label: "Phone", value: form.phone },
          { label: "Age", value: age !== null ? `${age} years old` : undefined },
          { label: "Gender", value: GENDER_OPTIONS.find((g) => g.value === form.gender)?.label },
          { label: "Dietary", value: form.dietary.length ? form.dietary.join(", ") : undefined },
        ]
          .filter((r) => r.value)
          .map(({ label, value }) => (
            <div key={label} className="flex gap-4 text-sm">
              <span className="text-gray-400 text-xs w-14 shrink-0 pt-px">{label}</span>
              <span className="text-gray-800 dark:text-gray-200 text-xs">{value}</span>
            </div>
          ))}
      </div>
    </div>
  );

  if (isFree) {
    return (
      <div className="space-y-5">
        <OrderSummary />
        <AttendeeSummary />
        <Button
          type="button"
          onClick={handleFreeRegistration}
          disabled={isLoading}
          className="w-full h-11 font-semibold gap-2"
        >
          {isLoading ? (
            <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
          ) : (
            <HugeiconsIcon icon={TicketIcon} size={16} />
          )}
          {isLoading ? "Processing…" : "Complete Registration"}
        </Button>
      </div>
    );
  }

  const customFields = [
    {
      display_name: "Event ID",
      variable_name: "event_id",
      value: event._id,
    },
    {
      display_name: "Event Name",
      variable_name: "event_name",
      value: event.title,
    },
    {
      display_name: "Event Start",
      variable_name: "event_start",
      value: `${formatDate(event.startDate)} - ${formatTime(event.startDate)}`,
    },
    {
      display_name: "Event End",
      variable_name: "event_end",
      value: `${formatDate(event.endDate)} - ${formatTime(event.endDate)}`,
    },
    {
      display_name: "Plan Type",
      variable_name: "plan_type",
      value: plan.type,
    },
    {
      display_name: "Plan Name",
      variable_name: "plan_name",
      value: plan.name,
    },
    {
      display_name: "Attendee Name",
      variable_name: "attendee_name",
      value: form.name,
    },
    {
      display_name: "Is Group Registration",
      variable_name: "is_group",
      value: String(form.isGroup),
    },
    ...(form.isGroup && form.groupSize ? [{
      display_name: "Group Size",
      variable_name: "group_size",
      value: form.groupSize,
    }] : []),
    ...(form.isGroup && form.groupName ? [{
      display_name: "Group Name",
      variable_name: "group_name",
      value: form.groupName,
    }] : []),
  ];

  const paystackConfig = {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email: form.email,
    amount: amountInKobo,
    currency: "NGN",
    reference: `REG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    metadata: {
      custom_fields: customFields,
    },
    onSuccess: handlePaystackSuccess,
    onClose: handlePaystackClose,
  };

  return (
    <div className="space-y-5">
      <OrderSummary />
      <AttendeeSummary />
      
      <PaystackButton
        {...paystackConfig}
        text={isLoading ? "Processing…" : `Pay ${price}`}
        className="w-full h-11 font-semibold gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={isLoading}
      />
    </div>
  );
}

// ─── Step 4 — Success ─────────────────────────────────────────────────────────

function SuccessStep({ form, plan, onClose }: {
  form: AttendeeForm; plan: Plan; onClose: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={40} className="text-green-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
          <HugeiconsIcon icon={TicketIcon} size={12} className="text-white" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">You're registered!</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">A confirmation has been sent to</p>
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-6">{form.email}</p>

      <div className="w-full rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 mb-6 text-left space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Your Ticket</p>
        {[
          { label: "Plan", value: plan.name, highlight: false },
          { label: "Name", value: form.name, highlight: false },
          { label: "Amount", value: plan.price === 0 ? "Free" : `${plan.currency} ${plan.price.toLocaleString()}`, highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={cn(
              "font-semibold",
              highlight && plan.price === 0 ? "text-green-600 dark:text-green-400"
              : highlight ? "text-indigo-600 dark:text-indigo-400"
              : "text-gray-900 dark:text-white"
            )}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <Button onClick={onClose} className="w-full h-10 font-semibold">
        Done — Close
      </Button>
    </div>
  );
}

// ─── Modal root ───────────────────────────────────────────────────────────────

export function RegistrationModal({ event, onClose, onSuccess, isVirtual, eventVenue }: RegistrationModalProps): JSX.Element {
  const [step, setStep] = useState<Step>("plan");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ageReq: AgeRequirement | null = (event as any).ageRequirement ?? null;
  const needsAge = Boolean(ageReq?.required);

  const [form, setForm] = useState<AttendeeForm>({
    name: "", email: "", phone: "", dob: undefined,
    gender: "", company: "", title: "",
    specialRequests: "", dietary: [], accessibility: "",
    isGroup: false, groupSize: "", groupName: "",
    parentalConsentByName: "", parentalConsentByEmail: "",
  });

  const updateForm = <K extends keyof AttendeeForm>(k: K, v: AttendeeForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const canAdvancePlan = Boolean(plan);
  const canAdvanceAttendee = form.name.trim() !== "" && form.email.trim() !== "" &&
    (!needsAge || form.dob !== undefined);

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };
  
  const back = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  };

  // Handle "Review & Pay" button click - opens confirmation modal
  const handleReviewAndPay = () => {
    setConfirmOpen(true);
  };

  // Handle confirmation - closes modal and proceeds to payment
  const handleConfirmProceed = () => {
    setConfirmOpen(false);
    setStep("payment");
  };

  const completeRegistration = async (paymentData?: any) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event._id,
          plan: plan,
          attendee: form,
          payment: paymentData,
        }),
      });

      if (!response.ok) throw new Error("Registration failed");
      
      const data = await response.json();
      setStep("success");
      onSuccess?.(data);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full sm:max-w-4xl bg-white dark:bg-gray-900 sm:rounded-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={TicketIcon} size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                  {step === "success" ? "Registration Confirmed" : "Register for Event"}
                </p>
                <p className="text-xs text-gray-400 truncate mt-1">{event.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            >
              <HugeiconsIcon icon={XIcon} size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-5 py-5">
              {step !== "success" && <StepIndicator current={step} />}

              {step === "plan" && (
                <PlanStep plans={event.plans ?? []} selected={plan} onSelect={setPlan} />
              )}
              {step === "attendee" && (
                <AttendeeStep form={form} onChange={updateForm} ageReq={ageReq} needsAge={needsAge} />
              )}
              {step === "payment" && plan && (
                <PaymentStep 
                  plan={plan} 
                  form={form}
                  event={event}
                  onRegistrationComplete={completeRegistration}
                  isLoading={isLoading}
                />
              )}
              {step === "success" && plan && (
                <SuccessStep form={form} plan={plan} onClose={onClose} />
              )}
            </div>
          </div>

          {/* Footer nav - only show for plan and attendee steps */}
          {step !== "success" && step !== "payment" && (
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 shrink-0">
              {step !== "plan" ? (
                <Button
                  variant="ghost"
                  onClick={back}
                  className="gap-1.5 text-gray-600 dark:text-gray-400"
                >
                  <HugeiconsIcon icon={ArrowLeftIcon} size={14} /> Back
                </Button>
              ) : <div />}
              <Button 
                onClick={step === "attendee" ? handleReviewAndPay : next} 
                disabled={step === "plan" ? !canAdvancePlan : !canAdvanceAttendee} 
                className="gap-1.5 px-6 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {step === "attendee" ? "Review & Pay" : "Continue"}
                <HugeiconsIcon icon={ArrowRightIcon} size={14} />
              </Button>
            </div>
          )}
        </div> 
      </div>

      {/* Registration Confirmation Modal - Anchored here */}
      <RegistrationConfirmModal 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleConfirmProceed}
        event={{
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: isVirtual ? "Online" : eventVenue ?? "To Be Announced",
          price: plan?.price ?? 0,
          isFree: !plan?.price || plan?.price === 0,
        }}
      />
    </>
  );
}