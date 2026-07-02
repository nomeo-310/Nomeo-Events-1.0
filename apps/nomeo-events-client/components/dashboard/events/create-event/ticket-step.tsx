"use client";

import { memo, useRef, useState } from "react";
import { useFormContext, useFieldArray, FieldError } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, PlusIcon, Trash2Icon, XIcon, CheckIcon, ChevronUpIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlanType } from "@/types/create-event-type";
import { cn } from "@/lib/utils";
import { usePlanLimits } from "@/hooks/use-plan-limits";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, SparklesIcon, InformationCircleIcon, Ticket01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

// ─── Plan Card ────────────────────────────────────────────────────────────────

const PlanCard = memo(function PlanCard({
  index,
  onRemove,
  onSave,
  onAddAnother,
  canRemove,
  isLast,
  canAddAnother,
}: {
  index: number;
  onRemove: (i: number) => void;
  onSave: (i: number) => void;
  onAddAnother: () => void;
  canRemove: boolean;
  isLast: boolean;
  canAddAnother: boolean;
}) {
  const { register, watch, setValue, getValues, formState: { errors } } = useFormContext();
  const benefitInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  type PlanFieldError = { type?: FieldError; name?: FieldError; price?: FieldError; currency?: FieldError };
  const planErrors = (errors.plans as PlanFieldError[] | undefined) ?? [];

  const planType         = watch(`plans.${index}.type`);
  const planName         = watch(`plans.${index}.name`);
  const planPrice        = watch(`plans.${index}.price`);
  const planCurrency     = watch(`plans.${index}.currency`);
  const benefits         = watch(`plans.${index}.benefits`) || [];
  const earlyBirdDeadline = watch(`plans.${index}.earlyBirdDeadline`);

  const addBenefit = () => {
    const val = benefitInputRef.current?.value?.trim();
    if (!val) return;
    const current = getValues(`plans.${index}.benefits`) || [];
    setValue(`plans.${index}.benefits`, [...current, val]);
    if (benefitInputRef.current) benefitInputRef.current.value = "";
  };

  const removeBenefit = (bi: number) => {
    const current = getValues(`plans.${index}.benefits`) || [];
    setValue(`plans.${index}.benefits`, current.filter((_: any, i: any) => i !== bi));
  };

  const handleSave = () => {
    onSave(index);
    setSaved(true);
    setCollapsed(true);
  };

  const handleEdit = () => {
    setSaved(false);
    setCollapsed(false);
  };

  // ── Collapsed / saved summary row ──────────────────────────────────────────
  if (collapsed && saved) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{planName || `Plan ${index + 1}`}</p>
                <p className="text-xs text-muted-foreground">
                  {planPrice === 0 ? "Free" : `${planCurrency} ${planPrice}`}
                  {benefits.length > 0 ? ` · ${benefits.length} benefit${benefits.length > 1 ? "s" : ""}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleEdit}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Edit
              </button>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 dark:border-indigo-800">
      <CardContent className="pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">
            {planName ? planName : `Plan ${index + 1}`}
          </h4>
          <div className="flex items-center gap-2">
            {saved && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronUpIcon className="w-4 h-4" />
              </button>
            )}
            {canRemove && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
                <Trash2Icon className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Plan Type</Label>
            <Select
              value={planType}
              onValueChange={(v) => v && setValue(`plans.${index}.type`, v, { shouldValidate: true })}
            >
              <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PlanType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Plan Name</Label>
            <Input
              {...register(`plans.${index}.name`)}
              placeholder="e.g., VIP Pass"
              className="mt-1.5"
            />
            {planErrors[index]?.name && (
              <p className="text-sm text-red-500 mt-1">{planErrors[index].name?.message}</p>
            )}
          </div>

          <div>
            <Label>Price</Label>
            <Input
              type="number"
              step="0.01"
              {...register(`plans.${index}.price`, { valueAsNumber: true })}
              className="mt-1.5"
            />
            {planErrors[index]?.price && (
              <p className="text-sm text-red-500 mt-1">{planErrors[index].price?.message}</p>
            )}
          </div>

          <div>
            <Label>Currency</Label>
            <Input
              {...register(`plans.${index}.currency`)}
              placeholder="NGN"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Max Seats (Optional)</Label>
            <Input
              type="number"
              {...register(`plans.${index}.maxSeats`, { valueAsNumber: true })}
              className="mt-1.5"
            />
          </div>

          {planType === PlanType.EARLY_BIRD && (
            <div>
              <Label>Early Bird Deadline</Label>
              <Popover>
                <PopoverTrigger className="flex h-10 lg:h-11 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1.5 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {earlyBirdDeadline ? format(earlyBirdDeadline, "PPP") : "Select deadline"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={earlyBirdDeadline ?? undefined}
                    onSelect={(date) => setValue(`plans.${index}.earlyBirdDeadline`, date)}
                    initialFocus
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div>
          <Label>Benefits</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              ref={benefitInputRef}
              placeholder="Add a benefit and press Enter or click Add"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBenefit();
                }
              }}
            />
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11 rounded-lg shrink-0"
              onClick={addBenefit}
            >
              Add
            </Button>
          </div>
          {benefits.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-muted/50 border border-border">
              {benefits.map((benefit: string, bi: number) => (
                <Badge key={bi} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(bi)}
                    className="ml-1.5 hover:text-red-500 transition-colors"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Fill in the details above then save this plan.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {isLast && (
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 text-sm"
                disabled={!canAddAnother}
                onClick={() => {
                  if (!canAddAnother) return;
                  handleSave();
                  onAddAnother();
                }}
              >
                <PlusIcon className="w-3.5 h-3.5 mr-1.5" />
                Save & Add Another
              </Button>
            )}
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 h-9 px-5 text-sm"
              onClick={handleSave}
            >
              <CheckIcon className="w-3.5 h-3.5 mr-1.5" />
              Save Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ─── Banners ──────────────────────────────────────────────────────────────────

function TicketTypeRestrictionBanner({ planName }: { planName?: string }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-5">
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <HugeiconsIcon icon={Alert01Icon} className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Ticket types not available on your current plan
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Your <span className="font-medium">{planName ?? 'current'}</span> plan does not include
            the ability to create custom ticket types for events. This means all attendees will
            register under a single general admission type.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            If you need multiple ticket types — such as VIP, Early Bird, or Student tickets —
            please upgrade your subscription to a plan that includes this feature.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Link href="/pricing">
              <Button
                type="button"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 text-xs gap-1.5"
              >
                <HugeiconsIcon icon={SparklesIcon} className="w-3.5 h-3.5" />
                Upgrade Plan
              </Button>
            </Link>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              You can still continue to the next step.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketLimitBanner({ current, max, planName }: { current: number; max: number; planName?: string }) {
  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 flex items-start gap-2.5">
      <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-800 dark:text-blue-300">
        You've used <span className="font-semibold">{current} of {max}</span> ticket types allowed
        on your <span className="font-medium">{planName ?? 'current'}</span> plan.{' '}
        <Link href="/pricing" className="underline font-medium hover:text-blue-600">
          Upgrade
        </Link>{' '}
        to add more.
      </p>
    </div>
  );
}

// ─── Empty state — no plans added yet ────────────────────────────────────────

function NoPlansEmptyState({ onAdd, canAdd }: { onAdd: () => void; canAdd: boolean }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
        <HugeiconsIcon icon={Ticket01Icon} className="w-6 h-6 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No ticket plans</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
        Leaving this empty means your event is free and open to all — attendees can register
        without selecting a ticket type. Add plans only if you want paid or categorised tickets.
      </p>
      {canAdd && (
        <Button
          type="button"
          onClick={onAdd}
          variant="outline"
          className="h-9 px-5 text-sm"
        >
          <PlusIcon className="w-4 h-4 mr-1.5" />
          Add Ticket Plan (Optional)
        </Button>
      )}
    </div>
  );
}

// ─── Main step ────────────────────────────────────────────────────────────────

export function TicketsStep() {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "plans" });

  const { limits, plan: activePlan, isLoading: limitsLoading } = usePlanLimits();

  const waitlistEnabled = watch("waitlistEnabled");

  // ── Edit mode detection ────────────────────────────────────────────────────
  // If plans already exist when the step first mounts, we're editing an existing
  // event. In this case we always allow editing existing plans regardless of the
  // current subscription — only adding new ones is restricted.
  const [hadPlansOnMount] = useState(() => fields.length > 0);

  // ── Derived limit state ────────────────────────────────────────────────────
  const hasTicketTypes = limits?.hasTicketTypes ?? true;  // optimistic until loaded
  const maxTicketTypes = limits?.maxTicketTypes ?? null;  // null = unlimited
  const currentCount   = fields.length;

  // Show the full restriction banner only in create mode (no pre-existing plans)
  const showRestrictionBanner = !limitsLoading && !hasTicketTypes && !hadPlansOnMount;

  // Show a softer info banner in edit mode when the user has downgraded
  const showDowngradedBanner = !limitsLoading && !hasTicketTypes && hadPlansOnMount;

  const canAddMore = limitsLoading
    ? false
    : !hasTicketTypes
    ? false  // feature not on plan — can edit existing but not add new
    : limits
    ? limits.canCreateTicketType(currentCount)
    : true;

  const limitReached = !limitsLoading && hasTicketTypes && !canAddMore && maxTicketTypes !== null;

  const addNewPlan = () => {
    if (!canAddMore) return;
    append({
      type:              PlanType.REGULAR,
      name:              "",
      price:             0,
      currency:          "NGN",
      benefits:          [],
      maxSeats:          null,
      earlyBirdDeadline: null,
    });
  };

  return (
    <div className="space-y-6">

      {/* Total seats */}
      <div>
        <Label htmlFor="totalSeats">Total Seats Available *</Label>
        <Input
          id="totalSeats"
          type="number"
          {...register("totalSeats", { valueAsNumber: true })}
          className="mt-1.5"
        />
        {errors.totalSeats && (
          <p className="text-sm text-red-500 mt-1">{errors.totalSeats.message as string}</p>
        )}
      </div>

      {/* Waitlist */}
      <div className="flex items-center justify-between">
        <Label htmlFor="waitlistEnabled">Enable Waitlist</Label>
        <Switch
          id="waitlistEnabled"
          checked={waitlistEnabled}
          onCheckedChange={(checked) => setValue("waitlistEnabled", checked)}
        />
      </div>

      <Separator />

      {/* ── Create mode: ticket types not on plan at all ── */}
      {showRestrictionBanner ? (
        <TicketTypeRestrictionBanner planName={activePlan?.name} />
      ) : (
        <div className="space-y-3">

          {/* ── Edit mode: user has downgraded but has existing plans ── */}
          {showDowngradedBanner && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 flex items-start gap-2.5">
              <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Your current plan doesn't include ticket types, but you can still edit your existing ones.
                You won't be able to add new ticket types without{' '}
                <Link href="/pricing" className="underline font-medium">upgrading your plan</Link>.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Ticket Plans</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fill in each plan and save it before adding another.
              </p>
              {/* Usage indicator — only show when there's a cap and plans exist */}
              {!limitsLoading && maxTicketTypes !== null && hasTicketTypes && currentCount > 0 && (
                <p className={cn(
                  "text-xs mt-1 font-medium",
                  limitReached ? "text-red-500" : "text-muted-foreground"
                )}>
                  {currentCount} of {maxTicketTypes} ticket type{maxTicketTypes !== 1 ? "s" : ""} used
                </p>
              )}
            </div>

            {/* Add Plan button — only visible when plans already exist */}
            {currentCount > 0 && (
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 px-5 h-10 lg:h-11 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={addNewPlan}
                disabled={!canAddMore || limitsLoading}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Plan
              </Button>
            )}
          </div>

          {/* Limit reached banner */}
          {limitReached && maxTicketTypes !== null && (
            <TicketLimitBanner
              current={currentCount}
              max={maxTicketTypes}
              planName={activePlan?.name}
            />
          )}

          {errors.plans && typeof errors.plans.message === "string" && (
            <p className="text-sm text-red-500">{errors.plans.message}</p>
          )}

          {/* Empty state — no plans = free/general admission, perfectly valid */}
          {currentCount === 0 ? (
            <NoPlansEmptyState onAdd={addNewPlan} canAdd={canAddMore && !limitsLoading} />
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <PlanCard
                  key={field.id}
                  index={index}
                  onRemove={remove}
                  onSave={(i) => {}}
                  onAddAnother={addNewPlan}
                  canRemove={true}
                  isLast={index === fields.length - 1}
                  canAddAnother={canAddMore}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}