"use client";

import { useState, useEffect, useRef, type JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as XIcon,
  TicketIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Calendar03Icon as CalendarIcon,
  UserAdd01Icon as UserAddIcon,
  Delete02Icon as DeleteIcon,
  UserGroupIcon,
  Building04Icon as BuildingIcon,
  ArrowDown01Icon as ChevronDownIcon,
  ArrowUp01Icon as ChevronUpIcon,
  Edit02Icon as EditIcon,
  InformationCircleIcon as InfoCircleIcon,
  Alert02Icon as AlertIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// react-paystack accesses `window` at module load time so it cannot be
// statically imported — doing so crashes Next.js SSR with
// "ReferenceError: window is not defined".
// We lazy-load it inside the component with useState + useEffect instead.

// ── shadcn/ui form controls ────────────────────────────────────────────────────
import { Input }      from "@/components/ui/input";
import { Label }      from "@/components/ui/label";
import { Textarea }   from "@/components/ui/textarea";
import { Badge }      from "@/components/ui/badge";
import { Separator }  from "@/components/ui/separator";
import { Button }     from "@/components/ui/button";
import { Calendar }   from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";

import { formatDate, formatDateTime, formatTime, toTitleCase } from "./public-event-helpers";
import { toast } from "sonner";
import { RegistrationConfirmModal } from "./registration-confirm-modal";
import { useRegistration, type RegisterInput } from "@/hooks/use-registration";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

// ── Payment hooks ──────────────────────────────────────────────────────────────
import { useInitiatePayment, useVerifyPayment } from "@/hooks/use-payments";

export enum PaymentPurpose {
  EVENT_REGISTRATION = 'event_registration',
  SUBSCRIPTION = 'subscription'
}

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
  allowedAgeGroups?: string[];
  requiresParentalConsent?: boolean;
  parentalConsentMessage?: string;
  ageVerificationRequired?: boolean;
  ageVerificationMethod?: string;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  age?: number;
  phone?: string;
  dob?: Date;
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

function generateMemberId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, isFree }: { current: Step; isFree?: boolean }): JSX.Element {
  const visibleSteps = STEPS.filter((s) => s !== "success");
  const currentIdx   = STEPS.indexOf(current);

  return (
    <div className="flex items-center mb-7">
      {visibleSteps.map((step, i) => {
        const stepIdx = STEPS.indexOf(step);
        const done    = stepIdx < currentIdx;
        const active  = step === current;
        const label = step === "payment" && isFree ? "Review & Confirm" : STEP_META[step].label;

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
                {label}
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

// ─── Collapsible Member Card ────────────────────────────────────────────────────

function MemberCard({ member, index, onEdit, onRemove, isExpanded, onToggle, isPrimary = false }: {
  member: GroupMember;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  isPrimary?: boolean;
}): JSX.Element {
  const age = member.age || (member.dob ? getAgeFromDob(member.dob) : null);
  
  return (
    <Card className={cn(
      "border overflow-hidden",
      isPrimary 
        ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20"
        : "border-gray-200 dark:border-gray-700"
    )}>
      <div 
        className="px-4 py-3 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
            isPrimary
              ? "bg-indigo-600 text-white"
              : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
          )}>
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {member.name || (isPrimary ? "Primary Contact" : "Unnamed Member")}
              </p>
              {isPrimary && (
                <Badge variant="secondary" className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  Primary
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{member.email || "No email"}</p>
          </div>
          {age && (
            <Badge variant="secondary" className="text-xs">
              Age: {age}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isPrimary && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1 rounded-md text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
              >
                <HugeiconsIcon icon={EditIcon} size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-1 rounded-md text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
              >
                <HugeiconsIcon icon={DeleteIcon} size={16} />
              </button>
            </>
          )}
          <HugeiconsIcon 
            icon={isExpanded ? ChevronUpIcon : ChevronDownIcon} 
            size={16} 
            className="text-gray-400"
          />
        </div>
      </div>
      
      {isExpanded && (
        <CardContent className="px-4 py-3 space-y-2 border-t border-gray-100 dark:border-gray-800">
          {member.phone && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 text-xs min-w-[70px]">Phone:</span>
              <span className="text-gray-700 dark:text-gray-300 text-xs">{member.phone}</span>
            </div>
          )}
          {member.dob && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 text-xs min-w-[70px]">Date of Birth:</span>
              <span className="text-gray-700 dark:text-gray-300 text-xs">{format(member.dob, "PPP")}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Add Member Form ───────────────────────────────────────────────────────────

function AddMemberForm({ onAdd, onCancel, needsAge }: {
  onAdd: (member: Omit<GroupMember, 'id'>) => void;
  onCancel: () => void;
  needsAge: boolean;
}): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const age = getAgeFromDob(dob);
  
  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) { toast.error("Please fill in name and email"); return; }
    if (needsAge && !dob) { toast.error("Please provide date of birth"); return; }
    onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, dob, age: age || undefined });
    setName(""); setEmail(""); setPhone(""); setDob(undefined);
  };
  
  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Add New Member</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full Name" required>
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Email Address" required>
            <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone Number">
            <Input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          {needsAge && (
            <Field label="Date of Birth" required hint={age !== null ? `Age: ${age} years old` : undefined}>
              <Popover>
                <PopoverTrigger className={cn("w-full justify-start text-left font-normal flex items-center border h-10 lg:h-11 px-3 rounded-lg", !dob && "text-muted-foreground")}>
                  <HugeiconsIcon icon={CalendarIcon} size={16} className="mr-2 text-gray-400 shrink-0" />
                  {dob ? format(dob, "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dob} onSelect={setDob} disabled={(date) => date > new Date()} captionLayout="dropdown" fromYear={1920} toYear={new Date().getFullYear()} initialFocus />
                </PopoverContent>
              </Popover>
            </Field>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSubmit} size="sm" className="gap-1">
            <HugeiconsIcon icon={UserAddIcon} size={14} /> Add Member
          </Button>
          <Button onClick={onCancel} variant="ghost" size="sm">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Registration Type Selector ───────────────────────────────────────────────

type RegistrationType = "individual" | "group" | "corporate";

function RegistrationTypeSelector({ value, onChange }: { value: RegistrationType; onChange: (type: RegistrationType) => void }): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { type: "individual" as const, label: "Individual", icon: UserAddIcon, description: "Single attendee" },
        { type: "group" as const, label: "Group", icon: UserGroupIcon, description: "Multiple attendees (you + members)" },
        { type: "corporate" as const, label: "Corporate", icon: BuildingIcon, description: "Company registration (you + team)" },
      ].map(({ type, label, icon: Icon, description }) => (
        <button key={type} type="button" onClick={() => onChange(type)} className={cn("p-3 rounded-lg border-2 text-left transition-all", value === type ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700")}>
          <HugeiconsIcon icon={Icon} size={20} className={cn("mb-2", value === type ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400")} />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Step 1 — Plan selection ──────────────────────────────────────────────────

function PlanStep({ plans, selected, onSelect }: { plans: Plan[]; selected: Plan | null; onSelect: (p: Plan) => void }): JSX.Element {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select the ticket plan that works best for you.</p>
      {plans.map((plan) => {
        const isSel = selected?.type === plan.type;
        const isFree = plan.price === 0;
        const price = isFree ? "Free" : `${plan.currency ?? "USD"} ${plan.price.toLocaleString()}`;
        const earlyLabel = plan.earlyBirdDeadline ? formatDateTime(plan.earlyBirdDeadline) : null;
        const seatsLeft = plan.availableSeats;
        const soldOut = seatsLeft !== undefined && seatsLeft <= 0;
        const almostGone = seatsLeft !== undefined && seatsLeft > 0 && seatsLeft <= 20;
        return (
          <button key={plan.type} type="button" disabled={soldOut} onClick={() => onSelect(plan)} className={cn("w-full text-left rounded-xl border-2 p-4 transition-all duration-200", soldOut ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700" : isSel ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-4 ring-indigo-100 dark:ring-indigo-900/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-indigo-300 dark:hover:border-indigo-700")}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{plan.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-normal">{toTitleCase(plan.type)}</Badge>
                  {soldOut && <Badge variant="destructive" className="text-[10px] px-1.5 h-4">Sold out</Badge>}
                  {almostGone && !soldOut && <Badge className="text-[10px] px-1.5 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">Only {seatsLeft} left!</Badge>}
                </div>
                {plan.benefits?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {plan.benefits.map((b, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={9} className="text-green-500 shrink-0" />{b}
                      </span>
                    ))}
                  </div>
                )}
                {earlyLabel && <p className="text-[11px] text-amber-600 dark:text-amber-400">🕐 Early bird until {earlyLabel}</p>}
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span className={cn("text-xl font-bold", isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white")}>{price}</span>
                {plan.maxSeats && <span className="text-[10px] text-gray-400">{plan.maxSeats} max seats</span>}
                {isSel && !soldOut && <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center mt-1"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="text-white" /></div>}
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
  name: string; email: string; phone: string; dob: Date | undefined;
  gender: string; company: string; title: string; specialRequests: string;
  dietary: string[]; accessibility: string; registrationType: RegistrationType;
  groupName: string; groupMembers: GroupMember[]; showingAddMember: boolean;
  corporateName: string; corporateMembers: GroupMember[]; showingAddCorporateMember: boolean;
  parentalConsentByName: string; parentalConsentByEmail: string;
}

function AttendeeStep({ form, onChange, ageRequirement, needsAge }: {
  form: AttendeeForm;
  onChange: <K extends keyof AttendeeForm>(k: K, v: AttendeeForm[K]) => void;
  ageRequirement: AgeRequirement | null;
  needsAge: boolean;
}): JSX.Element {
  const age = getAgeFromDob(form.dob);
  const minAge = ageRequirement?.minAge;
  const maxAge = ageRequirement?.maxAge;
  const isUnderMinAge = minAge !== undefined && age !== null && age < minAge;
  const isOverMaxAge = maxAge !== undefined && age !== null && age > maxAge;
  const isAgeInvalid = isUnderMinAge || isOverMaxAge;
  const requiresParentalConsent = ageRequirement?.requiresParentalConsent === true;
  const showParentalConsent = requiresParentalConsent && age !== null && !isAgeInvalid;
  const isGroup = form.registrationType === "group";
  const isCorporate = form.registrationType === "corporate";
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const toggleMemberExpand = (id: string) => setExpandedMembers(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const handleAddMember = (memberData: Omit<GroupMember, 'id'>) => {
    const m = { ...memberData, id: generateMemberId() };
    if (isGroup) { onChange("groupMembers", [...form.groupMembers, m]); onChange("showingAddMember", false); }
    else if (isCorporate) { onChange("corporateMembers", [...form.corporateMembers, m]); onChange("showingAddCorporateMember", false); }
  };
  const handleRemoveMember = (id: string) => {
    if (isGroup) onChange("groupMembers", form.groupMembers.filter(m => m.id !== id));
    else if (isCorporate) onChange("corporateMembers", form.corporateMembers.filter(m => m.id !== id));
    setExpandedMembers(prev => { const s = new Set(prev); s.delete(id); return s; });
  };
  const handleEditMember = (id: string) => {
    handleRemoveMember(id);
    if (isGroup) onChange("showingAddMember", true);
    else if (isCorporate) onChange("showingAddCorporateMember", true);
  };

  const getMembers = () => isGroup ? form.groupMembers : isCorporate ? form.corporateMembers : [];
  const showingAddForm = isGroup ? form.showingAddMember : isCorporate ? form.showingAddCorporateMember : false;
  const startAddMember = () => { if (isGroup) onChange("showingAddMember", true); else if (isCorporate) onChange("showingAddCorporateMember", true); };
  const cancelAddMember = () => { if (isGroup) onChange("showingAddMember", false); else if (isCorporate) onChange("showingAddCorporateMember", false); };
  const additionalMembersCount = getMembers().length;
  const totalPeopleCount = 1 + additionalMembersCount;
  const getAgeErrorMessage = () => { if (!age) return null; if (minAge && age < minAge) return `Minimum age requirement is ${minAge} years old.`; if (maxAge && age > maxAge) return `Maximum age allowed is ${maxAge} years old.`; return null; };

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>Registration Type</SectionHeading>
        <RegistrationTypeSelector value={form.registrationType} onChange={(type) => {
          onChange("registrationType", type);
          if (type === "individual") { onChange("groupMembers", []); onChange("corporateMembers", []); onChange("showingAddMember", false); onChange("showingAddCorporateMember", false); }
          else if (type === "group") { onChange("corporateMembers", []); onChange("showingAddCorporateMember", false); }
          else if (type === "corporate") { onChange("groupMembers", []); onChange("showingAddMember", false); }
        }} />
      </div>
      <Separator />
      <div>
        <SectionHeading>{isGroup ? "Primary Contact (Group Organizer)" : isCorporate ? "Primary Contact (Company Representative)" : "Your Information"}</SectionHeading>
        {(isGroup || isCorporate) && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <HugeiconsIcon icon={InfoCircleIcon} size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Important Note:</p>
                <p>You are registering as the {isGroup ? "group organizer" : "company representative"}. Your ticket is included in the total count. Add additional {isGroup ? "group members" : "team members"} below.</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required><Input placeholder="Jane Doe" value={form.name} onChange={(e) => onChange("name", e.target.value)} /></Field>
          <Field label="Email Address" required><Input type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => onChange("email", e.target.value)} /></Field>
          <Field label="Phone Number"><Input type="tel" placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} /></Field>
          <Field label="Gender">
            <Select value={form.gender} onValueChange={(v) => onChange("gender", v ?? "")}>
              <SelectTrigger className="w-full h-10 lg:h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>{GENDER_OPTIONS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {needsAge && (
            <Field label="Date of Birth" required hint={age !== null ? `Age: ${age} years old` : undefined}>
              <Popover>
                <PopoverTrigger className={cn("w-full justify-start text-left font-normal flex items-center border h-10 lg:h-11 px-3 rounded-lg", !form.dob && "text-muted-foreground")}>
                  <HugeiconsIcon icon={CalendarIcon} size={16} className="mr-2 text-gray-400 shrink-0" />
                  {form.dob ? format(form.dob, "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.dob} onSelect={(d) => onChange("dob", d)} disabled={(date) => date > new Date()} captionLayout="dropdown" fromYear={1920} toYear={new Date().getFullYear()} initialFocus />
                </PopoverContent>
              </Popover>
            </Field>
          )}
        </div>
        {needsAge && age !== null && isAgeInvalid && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <HugeiconsIcon icon={AlertIcon} size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{getAgeErrorMessage()}</p>
            </div>
          </div>
        )}
      </div>
      <Separator />
      <div>
        <SectionHeading>Professional (Optional)</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company / Organisation"><Input placeholder="Acme Inc." value={form.company} onChange={(e) => onChange("company", e.target.value)} /></Field>
          <Field label="Job Title"><Input placeholder="Product Manager" value={form.title} onChange={(e) => onChange("title", e.target.value)} /></Field>
        </div>
      </div>
      {(isGroup || isCorporate) && (
        <>
          <Separator />
          <div>
            <SectionHeading>{isGroup ? "Additional Group Members" : "Additional Team Members"}</SectionHeading>
            {isGroup && <div className="mb-4"><Field label="Group Name" required><Input placeholder="Team Acme" value={form.groupName} onChange={(e) => onChange("groupName", e.target.value)} /></Field></div>}
            {isCorporate && <div className="mb-4"><Field label="Company Name" required><Input placeholder="Acme Corporation" value={form.corporateName} onChange={(e) => onChange("corporateName", e.target.value)} /></Field></div>}
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <HugeiconsIcon icon={TicketIcon} size={16} className="text-green-500 mt-0.5 shrink-0" />
                <div className="text-xs text-green-700 dark:text-green-300">
                  <p className="font-medium">Total Tickets: {totalPeopleCount}</p>
                  <p>Total includes you + {additionalMembersCount} {additionalMembersCount === 1 ? 'member' : 'members'}</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Contact (You)</p>
              <MemberCard member={{ id: "primary", name: form.name || "Not provided", email: form.email || "Not provided", phone: form.phone, dob: form.dob, age: age || undefined }} index={0} onEdit={() => {}} onRemove={() => {}} isExpanded={false} onToggle={() => {}} isPrimary />
            </div>
            {getMembers().length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional {isGroup ? "Group Members" : "Team Members"} ({getMembers().length})</p>
                {getMembers().map((member, idx) => (
                  <MemberCard key={member.id} member={member} index={idx + 1} onEdit={() => handleEditMember(member.id)} onRemove={() => handleRemoveMember(member.id)} isExpanded={expandedMembers.has(member.id)} onToggle={() => toggleMemberExpand(member.id)} />
                ))}
              </div>
            )}
            {showingAddForm
              ? <AddMemberForm onAdd={handleAddMember} onCancel={cancelAddMember} needsAge={needsAge} />
              : <Button type="button" variant="outline" onClick={startAddMember} className="w-full gap-2"><HugeiconsIcon icon={UserAddIcon} size={16} />Add {isGroup ? "Group Member" : "Team Member"}</Button>
            }
          </div>
        </>
      )}
      {showParentalConsent && (
        <>
          <Separator />
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 text-base mt-0.5">⚠</span>
              <div className="space-y-1">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">{ageRequirement?.parentalConsentMessage || "Parental consent is required for this registration."}</p>
                {age !== null && age < 18 && <p className="text-xs text-amber-600 dark:text-amber-400">You are {age} years old. Please have a parent or guardian complete this section.</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Parent / Guardian Name" required><Input placeholder="Parent name" value={form.parentalConsentByName} onChange={(e) => onChange("parentalConsentByName", e.target.value)} /></Field>
              <Field label="Parent / Guardian Email" required><Input type="email" placeholder="parent@example.com" value={form.parentalConsentByEmail} onChange={(e) => onChange("parentalConsentByEmail", e.target.value)} /></Field>
            </div>
            {(isGroup || isCorporate) && <div className="mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/30"><p className="text-xs text-amber-700 dark:text-amber-400">Note: This parental consent applies to both you and all members in your {isGroup ? "group" : "corporate"} registration.</p></div>}
          </div>
        </>
      )}
      <Separator />
      <div>
        <SectionHeading>Preferences &amp; Needs</SectionHeading>
        <div className="space-y-4">
          <Field label="Dietary Restrictions">
            <div className="flex flex-wrap gap-2 pt-1">
              {DIETARY_OPTIONS.map((d) => {
                const active = form.dietary.includes(d);
                return (
                  <button key={d} type="button" onClick={() => onChange("dietary", active ? form.dietary.filter((x) => x !== d) : [...form.dietary, d])} className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150", active ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600")}>{d}</button>
                );
              })}
            </div>
          </Field>
          <Field label="Accessibility Needs"><Input placeholder="e.g. Wheelchair access, hearing loop…" value={form.accessibility} onChange={(e) => onChange("accessibility", e.target.value)} /></Field>
          <Field label="Special Requests"><Textarea rows={3} placeholder="Any other requests or notes…" value={form.specialRequests} onChange={(e) => onChange("specialRequests", e.target.value)} className="resize-none" /></Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Payment / Review ────────────────────────────────────────────────

interface PaymentStepProps {
  plan: Plan; form: AttendeeForm; event: any;
  onRegistrationComplete: (paymentData?: any) => Promise<void>;
  isLoading: boolean; needsAge: boolean;
}

function PaymentStep({ plan, form, event, onRegistrationComplete, isLoading, needsAge }: PaymentStepProps): JSX.Element {
  const additionalMembersCount = form.registrationType === "group" ? form.groupMembers.length : form.registrationType === "corporate" ? form.corporateMembers.length : 0;
  const numberOfTickets = 1 + additionalMembersCount;
  const totalPrice = plan.price * numberOfTickets;
  const isFree = totalPrice === 0;
  const priceDisplay = isFree ? "Free" : `${plan.currency ?? "NGN"} ${totalPrice.toLocaleString()}`;
  const amountInKobo = totalPrice * 100;
  const age = getAgeFromDob(form.dob);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const hasCompletedRef = useRef(false);
  const prevReferenceRef = useRef<string | null>(null);

  // Polling only starts after the user interacts with the Paystack modal.
  // This prevents the 200+ payments problem: polling was starting on mount
  // and hitting /api/payments/verify every 3s before the user clicked anything.
  const [userHasPaid, setUserHasPaid] = useState(false);

  // Incrementing this re-triggers the initiatePayment useEffect so the user
  // gets a fresh Paystack reference after abandoning or a failed payment.
  // Paystack references are single-use — they cannot be reused.
  const [retryCount, setRetryCount] = useState(0);

  const queryClient = useQueryClient();
  const { mutate: initiatePayment, isPending: isInitiating } = useInitiatePayment();

  useEffect(() => {
    if (isFree || !form.email || !event._id) return;

    // Reset all guards so polling and state work cleanly on each retry
    hasCompletedRef.current = false;
    setUserHasPaid(false);

    initiatePayment(
      {
        purpose: PaymentPurpose.EVENT_REGISTRATION,
        email: form.email,
        amount: amountInKobo,
        eventId: event._id,
        // registrationId intentionally omitted — webhook links it after confirmation
      },
      {
        onSuccess: ({ data }) => {
          prevReferenceRef.current = data.reference;
          setPaymentReference(data.reference);
        },
        onError: () => toast.error("Could not prepare payment. Please try again."),
      }
    );
  // retryCount is the trigger — incrementing it re-runs this effect for retries
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // Poll verify every 3s once we have a reference.
  // Pass the reference directly — never fall back to "" which could match
  // stale cache entries and fire the effect before the user does anything.
  const verifyQuery = useVerifyPayment(paymentReference ?? "", {
    enabled: !!paymentReference && userHasPaid && !hasCompletedRef.current,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.gatewayStatus;
      if (status === "success" || status === "failed" || status === "abandoned") return false;
      return 3000;
    },
  });

  useEffect(() => {
    if (!verifyQuery.data || hasCompletedRef.current) return;

    const responseRef = verifyQuery.data.data?.reference;
    const status      = verifyQuery.data.data?.gatewayStatus;

    // ── CRITICAL GUARD ──────────────────────────────────────────────────────
    // Only act on data that belongs to the CURRENT reference.
    // Without this, stale cached data from a previous (abandoned) attempt
    // fires this effect immediately when the component re-renders after retry,
    // before the new reference is even set — causing the toast to fire and
    // the button to stay disabled before the user clicks anything.
    if (!paymentReference || responseRef !== paymentReference) return;
    if (!status) return;

    if (status === "success") {
      hasCompletedRef.current = true;
      setIsConfirming(true);
      onRegistrationComplete({ reference: responseRef, status: "success" })
        .finally(() => setIsConfirming(false));
    } else if (status === "failed" || status === "abandoned") {
      // Evict from cache so this block can never re-trigger with stale data
      queryClient.removeQueries({ queryKey: ["payments", "verify", responseRef] });
      prevReferenceRef.current = null;
      setUserHasPaid(false);
      setPaymentReference(null);
      setRetryCount((c) => c + 1);
      toast.error(
        status === "abandoned"
          ? "Payment was not completed. Click Pay to try again."
          : "Payment failed. Please try again."
      );
    }
  // paymentReference is intentionally included so the guard re-evaluates
  // when the reference changes after retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyQuery.data, paymentReference]);

  // onSuccess: payment completed — start polling to confirm on the server
  const handlePaystackSuccess = (response: any) => {
    setUserHasPaid(true);
    if (response.reference && response.reference !== paymentReference) {
      setPaymentReference(response.reference);
    }
  };

  // onClose: modal closed (paid or dismissed) — start polling either way.
  // If they paid, verify returns success. If dismissed, returns pending then abandoned.
  const handlePaystackClose = () => {
    setUserHasPaid(true);
  };

  const formatMembersList = (members: GroupMember[], startIndex: number): string =>
    members.map((member, idx) => {
      const details = [`${startIndex + idx + 1}. ${member.name} (${member.email})`];
      if (needsAge && member.age) details.push(`Age: ${member.age}`);
      if (member.phone) details.push(`Phone: ${member.phone}`);
      return details.join(' | ');
    }).join('\n');

  const customFields = [
    { display_name: "Event ID", variable_name: "event_id", value: event._id },
    { display_name: "Event Name", variable_name: "event_name", value: event.title },
    { display_name: "Event Start", variable_name: "event_start", value: `${formatDate(event.startDate)} - ${formatTime(event.startDate)}` },
    { display_name: "Event End", variable_name: "event_end", value: `${formatDate(event.endDate)} - ${formatTime(event.endDate)}` },
    { display_name: "Plan Type", variable_name: "plan_type", value: plan.type },
    { display_name: "Plan Name", variable_name: "plan_name", value: plan.name },
    { display_name: "Primary Contact Name", variable_name: "primary_name", value: form.name },
    { display_name: "Primary Contact Email", variable_name: "primary_email", value: form.email },
    { display_name: "Primary Contact Phone", variable_name: "primary_phone", value: form.phone || "Not provided" },
  ];
  if (needsAge && age !== null) customFields.push({ display_name: "Primary Contact Age", variable_name: "primary_age", value: age.toString() });
  customFields.push(
    { display_name: "Registration Type", variable_name: "registration_type", value: form.registrationType === "group" ? "Group Registration" : form.registrationType === "corporate" ? "Corporate Registration" : "Individual" },
    { display_name: "Number of Tickets", variable_name: "ticket_count", value: numberOfTickets.toString() },
    { display_name: "Additional Members Count", variable_name: "additional_members_count", value: additionalMembersCount.toString() },
    { display_name: "Total Amount", variable_name: "total_amount", value: totalPrice.toString() },
    { display_name: "Currency", variable_name: "currency", value: plan.currency || "NGN" }
  );
  if (form.registrationType === "group") {
    customFields.push({ display_name: "Group Name", variable_name: "group_name", value: form.groupName || "Not provided" });
    form.groupMembers.forEach((member, idx) => {
      customFields.push({ display_name: `Group Member ${idx + 1} Name`, variable_name: `group_member_${idx + 1}_name`, value: member.name });
      customFields.push({ display_name: `Group Member ${idx + 1} Email`, variable_name: `group_member_${idx + 1}_email`, value: member.email });
      if (needsAge && member.age) customFields.push({ display_name: `Group Member ${idx + 1} Age`, variable_name: `group_member_${idx + 1}_age`, value: member.age.toString() });
      if (member.phone) customFields.push({ display_name: `Group Member ${idx + 1} Phone`, variable_name: `group_member_${idx + 1}_phone`, value: member.phone });
    });
  }
  if (form.registrationType === "corporate") {
    customFields.push({ display_name: "Company Name", variable_name: "company_name", value: form.corporateName || "Not provided" });
    form.corporateMembers.forEach((member, idx) => {
      customFields.push({ display_name: `Team Member ${idx + 1} Name`, variable_name: `team_member_${idx + 1}_name`, value: member.name });
      customFields.push({ display_name: `Team Member ${idx + 1} Email`, variable_name: `team_member_${idx + 1}_email`, value: member.email });
      if (needsAge && member.age) customFields.push({ display_name: `Team Member ${idx + 1} Age`, variable_name: `team_member_${idx + 1}_age`, value: member.age.toString() });
      if (member.phone) customFields.push({ display_name: `Team Member ${idx + 1} Phone`, variable_name: `team_member_${idx + 1}_phone`, value: member.phone });
    });
  }
  if (form.dietary.length > 0) customFields.push({ display_name: "Dietary Restrictions", variable_name: "dietary_restrictions", value: form.dietary.join(", ") });
  if (form.specialRequests) customFields.push({ display_name: "Special Requests", variable_name: "special_requests", value: form.specialRequests });
  if (form.accessibility) customFields.push({ display_name: "Accessibility Needs", variable_name: "accessibility_needs", value: form.accessibility });
  if (form.parentalConsentByName && form.parentalConsentByEmail) {
    customFields.push({ display_name: "Parental Consent By", variable_name: "parental_consent_by_name", value: form.parentalConsentByName });
    customFields.push({ display_name: "Parental Consent Email", variable_name: "parental_consent_by_email", value: form.parentalConsentByEmail });
  }

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
            {form.registrationType === "group" && <p className="text-xs text-gray-400 mt-1">Group: {form.groupName || "Unnamed"} · {numberOfTickets} tickets total</p>}
            {form.registrationType === "corporate" && <p className="text-xs text-gray-400 mt-1">Corporate: {form.corporateName || "Unnamed"} · {numberOfTickets} tickets total</p>}
            {numberOfTickets > 1 && (
              <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                <p>{plan.price} × {numberOfTickets} tickets</p>
                <p className="text-[10px] text-gray-400">(Includes primary contact + {additionalMembersCount} {additionalMembersCount === 1 ? 'member' : 'members'})</p>
              </div>
            )}
          </div>
          <span className={cn("text-xl font-bold shrink-0", isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white")}>{priceDisplay}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
          <span className={cn("text-sm font-bold", isFree ? "text-green-600 dark:text-green-400" : "text-indigo-600 dark:text-indigo-400")}>{priceDisplay}</span>
        </div>
      </div>
    </div>
  );

  const AttendeeSummary = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{form.registrationType === "group" ? "Group Registration Details" : form.registrationType === "corporate" ? "Corporate Registration Details" : "Attendee Details"}</p>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Primary Contact (You)</p>
          {[
            { label: "Name", value: form.name },
            { label: "Email", value: form.email },
            { label: "Phone", value: form.phone },
            { label: "Age", value: age !== null ? `${age} years old` : undefined },
            { label: "Gender", value: GENDER_OPTIONS.find((g) => g.value === form.gender)?.label },
          ].filter((r) => r.value).map(({ label, value }) => (
            <div key={label} className="flex gap-4 text-sm">
              <span className="text-gray-400 text-xs w-14 shrink-0 pt-px">{label}</span>
              <span className="text-gray-800 dark:text-gray-200 text-xs">{value}</span>
            </div>
          ))}
        </div>
        {additionalMembersCount > 0 && (
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Additional {form.registrationType === "group" ? "Group Members" : "Team Members"} ({additionalMembersCount})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(form.registrationType === "group" ? form.groupMembers : form.corporateMembers).map((member) => {
                const memberAge = member.age || (member.dob ? getAgeFromDob(member.dob) : null);
                return (
                  <div key={member.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white text-xs">{member.name}</p>
                    <p className="text-gray-500 text-xs">{member.email}</p>
                    {memberAge && <p className="text-gray-400 text-xs">Age: {memberAge}</p>}
                    {member.phone && <p className="text-gray-400 text-xs">Phone: {member.phone}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {form.dietary.length > 0 && <div className="pt-2"><p className="text-gray-400 text-xs">Dietary: <span className="text-gray-600 dark:text-gray-300">{form.dietary.join(", ")}</span></p></div>}
      </div>
    </div>
  );

  // Lazy-load usePaystackPayment to avoid the SSR window crash.
  // The hook is stored in state and only called once the module is loaded.
  const [usePaystackPaymentHook, setUsePaystackPaymentHook] = useState<
    typeof import('react-paystack')['usePaystackPayment'] | null
  >(null);

  useEffect(() => {
    import('react-paystack').then((mod) => {
      setUsePaystackPaymentHook(() => mod.usePaystackPayment);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // onSuccess and onClose are passed as an object to initializePayment() — not in the config.
  const paystackConfig = {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email:     form.email,
    amount:    amountInKobo,
    currency:  "NGN",
    reference: paymentReference ?? "",
    metadata:  { custom_fields: customFields },
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const initializePayment = usePaystackPaymentHook?.(paystackConfig) ?? null;

  const isPreparingReference   = (isInitiating || !usePaystackPaymentHook) && !paymentReference;
  const isAwaitingConfirmation = !!paymentReference && isConfirming;
  const canPay = !!paymentReference && !!initializePayment && !isLoading && !isInitiating && !isConfirming;

  const handlePayClick = () => {
    if (!canPay || !initializePayment) return;
    // onSuccess is the single argument — onClose is in the config above.
    initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose });
  };

  // ── Free plan ─────────────────────────────────────────────────────────────
  if (isFree) {
    return (
      <div className="space-y-5">
        <OrderSummary />
        <AttendeeSummary />
        <Button type="button" onClick={() => onRegistrationComplete()} disabled={isLoading} className="w-full h-11 font-semibold gap-2 bg-green-600 hover:bg-green-700">
          {isLoading ? <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" /> : <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />}
          {isLoading ? "Processing…" : "Confirm Registration"}
        </Button>
      </div>
    );
  }

  // ── Paid plan ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <OrderSummary />
      <AttendeeSummary />

      {isAwaitingConfirmation && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
          <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-700 dark:text-indigo-300">Confirming your payment… please don't close this window.</p>
        </div>
      )}

      {isPreparingReference && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
          <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {retryCount > 0 ? "Preparing a new payment session…" : "Preparing your payment session…"}
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={handlePayClick}
        disabled={!canPay}
        className="w-full h-11 font-semibold gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white"
      >
        {isPreparingReference
          ? <><HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" /> Preparing payment…</>
          : isConfirming
          ? <><HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" /> Confirming payment…</>
          : isLoading
          ? <><HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" /> Processing…</>
          : retryCount > 0
          ? `Try Again — Pay ${priceDisplay}`
          : `Pay ${priceDisplay}`
        }
      </Button>
    </div>
  );
}

// ─── Step 4 — Success ─────────────────────────────────────────────────────────

function SuccessStep({ form, plan, onClose }: { form: AttendeeForm; plan: Plan; onClose: () => void }): JSX.Element {
  const additionalMembersCount = form.registrationType === "group" ? form.groupMembers.length : form.registrationType === "corporate" ? form.corporateMembers.length : 0;
  const numberOfTickets = 1 + additionalMembersCount;
  const totalPrice = plan.price * numberOfTickets;
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

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
          { label: "Registration Type", value: form.registrationType === "group" ? "Group Registration" : form.registrationType === "corporate" ? "Corporate Registration" : "Individual", highlight: false },
          { label: "Total Tickets", value: `${numberOfTickets} ticket${numberOfTickets > 1 ? "s" : ""}`, highlight: false },
          { label: "Primary Contact", value: form.name, highlight: false },
          { label: "Total Amount", value: totalPrice === 0 ? "Free" : `${plan.currency} ${totalPrice.toLocaleString()}`, highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={cn("font-semibold", highlight && totalPrice === 0 ? "text-green-600 dark:text-green-400" : highlight ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white")}>{value}</span>
          </div>
        ))}
      </div>
      <Button onClick={() => { queryClient.invalidateQueries({ queryKey: ["events", 'slug', slug] }); onClose(); }} className="w-full h-10 font-semibold">
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

  const { useRegister } = useRegistration();
  const registerMutation = useRegister();

  const ageRequirement = event?.ageRequirement;
  const needsAge = ageRequirement?.required === true;
  const minAge = ageRequirement?.minAge;
  const maxAge = ageRequirement?.maxAge;
  const requiresParentalConsent = ageRequirement?.requiresParentalConsent === true;

  const [form, setForm] = useState<AttendeeForm>({
    name: "", email: "", phone: "", dob: undefined, gender: "", company: "", title: "",
    specialRequests: "", dietary: [], accessibility: "", registrationType: "individual",
    groupName: "", groupMembers: [], showingAddMember: false,
    corporateName: "", corporateMembers: [], showingAddCorporateMember: false,
    parentalConsentByName: "", parentalConsentByEmail: "",
  });

  const updateForm = <K extends keyof AttendeeForm>(k: K, v: AttendeeForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const validateAge = (dob: Date | undefined) => {
    if (!needsAge || !dob) return { isValid: true };
    const age = getAgeFromDob(dob);
    if (age === null) return { isValid: true };
    if (minAge !== undefined && age < minAge) return { isValid: false, error: `Minimum age requirement is ${minAge} years old.` };
    if (maxAge !== undefined && age > maxAge) return { isValid: false, error: `Maximum age allowed is ${maxAge} years old.` };
    return { isValid: true };
  };

  const canAdvancePlan = Boolean(plan);

  const canAdvanceAttendee = (): boolean => {
    if (!form.name.trim() || !form.email.trim()) return false;
    if (needsAge) {
      if (!form.dob) return false;
      if (!validateAge(form.dob).isValid) return false;
    }
    const age = getAgeFromDob(form.dob);
    const needsConsent = requiresParentalConsent && age !== null;
    if (needsConsent && (!form.parentalConsentByName.trim() || !form.parentalConsentByEmail.trim())) return false;
    if (form.registrationType === "group") {
      if (!form.groupName.trim()) return false;
      for (const m of form.groupMembers) { if (!m.name.trim() || !m.email.trim()) return false; if (needsAge && !m.dob && !m.age) return false; }
    }
    if (form.registrationType === "corporate") {
      if (!form.corporateName.trim()) return false;
      for (const m of form.corporateMembers) { if (!m.name.trim() || !m.email.trim()) return false; if (needsAge && !m.dob && !m.age) return false; }
    }
    return true;
  };

  const next = () => { const i = STEPS.indexOf(step); if (i < STEPS.length - 1) setStep(STEPS[i + 1]); };
  const back = () => { const i = STEPS.indexOf(step); if (i > 0) setStep(STEPS[i - 1]); };

  const completeRegistration = async (paymentData?: any) => {
    setIsLoading(true);
    try {
      const additionalMembersCount = form.registrationType === "group" ? form.groupMembers.length : form.registrationType === "corporate" ? form.corporateMembers.length : 0;
      const totalTickets = 1 + additionalMembersCount;
      const totalPrice = (plan?.price || 0) * totalTickets;
      const age = getAgeFromDob(form.dob);
      const needsConsent = requiresParentalConsent && age !== null;

      const registrationData: RegisterInput = {
        eventId: event._id, planType: plan?.type || '', planName: plan?.name || '', price: totalPrice,
        attendeeName: form.name, attendeeEmail: form.email,
        attendeePhone: form.phone || undefined, attendeeGender: form.gender || undefined,
        attendeeCompany: form.company || undefined, attendeeTitle: form.title || undefined,
        specialRequests: form.specialRequests || undefined,
        dietaryRestrictions: form.dietary.length > 0 ? form.dietary : undefined,
        accessibilityNeeds: form.accessibility ? [form.accessibility] : undefined,
        ...(paymentData && { paymentReference: paymentData.reference, paymentStatus: paymentData.status }),
        ...(needsAge && form.dob && { attendeeAge: age || undefined }),
        ...(needsConsent && form.parentalConsentByName && form.parentalConsentByEmail && {
          parentalConsentProvided: true,
          parentalConsentByName: form.parentalConsentByName,
          parentalConsentByEmail: form.parentalConsentByEmail,
        }),
        isGroupRegistration: form.registrationType === "group",
        isCorporateRegistration: form.registrationType === "corporate",
        ...(form.registrationType === "group" && {
          groupSize: totalTickets, groupName: form.groupName,
          groupMembers: [
            { name: form.name, email: form.email, age: age ?? undefined, phone: form.phone || undefined },
            ...form.groupMembers.map(m => ({ name: m.name, email: m.email, age: m.age ?? (m.dob ? getAgeFromDob(m.dob) ?? undefined : undefined), phone: m.phone || undefined }))
          ],
        }),
        ...(form.registrationType === "corporate" && {
          companyName: form.corporateName, companySize: totalTickets,
          companyMembers: [
            { name: form.name, email: form.email, age: age ?? undefined, phone: form.phone || undefined },
            ...form.corporateMembers.map(m => ({ name: m.name, email: m.email, age: m.age ?? (m.dob ? getAgeFromDob(m.dob) ?? undefined : undefined), phone: m.phone || undefined }))
          ],
        }),
      };

      const result = await registerMutation.mutateAsync(registrationData);
      setStep("success");
      onSuccess?.(result);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLocation = () => {
    if (isVirtual) return "Online";
    if (eventVenue) return eventVenue;
    if (event.location?.address) return event.location.address;
    return "To Be Announced";
  };

  const getTotalPrice = () => {
    if (!plan) return 0;
    const additionalCount = form.registrationType === "group" ? form.groupMembers.length : form.registrationType === "corporate" ? form.corporateMembers.length : 0;
    return plan.price * (1 + additionalCount);
  };

  const isFreePlan = plan?.price === 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-4xl bg-white dark:bg-gray-900 sm:rounded-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={TicketIcon} size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{step === "success" ? "Registration Confirmed" : "Register for Event"}</p>
                <p className="text-xs text-gray-400 truncate mt-1">{event.title}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
              <HugeiconsIcon icon={XIcon} size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-5 py-5">
              {step !== "success" && <StepIndicator current={step} isFree={isFreePlan} />}
              {step === "plan" && <PlanStep plans={event.plans ?? []} selected={plan} onSelect={setPlan} />}
              {step === "attendee" && <AttendeeStep form={form} onChange={updateForm} ageRequirement={ageRequirement} needsAge={needsAge} />}
              {step === "payment" && plan && <PaymentStep plan={plan} form={form} event={event} onRegistrationComplete={completeRegistration} isLoading={isLoading || registerMutation.isPending} needsAge={needsAge} />}
              {step === "success" && plan && <SuccessStep form={form} plan={plan} onClose={onClose} />}
            </div>
          </div>

          {step !== "success" && step !== "payment" && (
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 shrink-0">
              {step !== "plan"
                ? <Button variant="ghost" onClick={back} className="gap-1.5 text-gray-600 dark:text-gray-400"><HugeiconsIcon icon={ArrowLeftIcon} size={14} /> Back</Button>
                : <div />
              }
              <Button
                onClick={step === "attendee" ? () => setConfirmOpen(true) : next}
                disabled={step === "plan" ? !canAdvancePlan : step === "attendee" ? !canAdvanceAttendee() : false}
                className="gap-1.5 px-6 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {step === "attendee" && isFreePlan ? "Review & Confirm" : step === "attendee" ? "Review & Pay" : "Continue"}
                <HugeiconsIcon icon={ArrowRightIcon} size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <RegistrationConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); setStep("payment"); }}
        event={{
          title: event.title, startDate: event.startDate, endDate: event.endDate,
          location: getLocation(), price: getTotalPrice(), isFree: getTotalPrice() === 0,
        }}
      />
    </>
  );
}