"use client";

import { memo, useRef, useState } from "react";
import { useFormContext, useFieldArray, FieldError } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, PlusIcon, Trash2Icon, XIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
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

const PlanCard = memo(function PlanCard({
  index,
  onRemove,
  onSave,
  onAddAnother,
  canRemove,
  isLast,
}: {
  index: number;
  onRemove: (i: number) => void;
  onSave: (i: number) => void;
  onAddAnother: () => void;
  canRemove: boolean;
  isLast: boolean;
}) {
  const { register, watch, setValue, getValues, formState: { errors } } = useFormContext();
  const benefitInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  type PlanFieldError = { type?: FieldError; name?: FieldError; price?: FieldError; currency?: FieldError };
  const planErrors = (errors.plans as PlanFieldError[] | undefined) ?? [];

  const planType = watch(`plans.${index}.type`);
  const planName = watch(`plans.${index}.name`);
  const planPrice = watch(`plans.${index}.price`);
  const planCurrency = watch(`plans.${index}.currency`);
  const benefits = watch(`plans.${index}.benefits`) || [];
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

  // Collapsed / saved state — shows a summary row
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
              >
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
                <Badge
                  key={bi}
                  variant="secondary"
                  className="gap-1 px-3 py-1.5 text-sm"
                >
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

        {/* Card actions */}
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
                onClick={() => {
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

export function TicketsStep() {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "plans" });

  const waitlistEnabled = watch("waitlistEnabled");

  const addNewPlan = () => {
    append({
      type: PlanType.REGULAR,
      name: "",
      price: 0,
      currency: "NGN",
      benefits: [],
      maxSeats: null,
      earlyBirdDeadline: null,
    });
  };

  return (
    <div className="space-y-6">
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

      <div className="flex items-center justify-between">
        <Label htmlFor="waitlistEnabled">Enable Waitlist</Label>
        <Switch
          id="waitlistEnabled"
          checked={waitlistEnabled}
          onCheckedChange={(checked) => setValue("waitlistEnabled", checked)}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Ticket Plans</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in each plan and save it before adding another.
            </p>
          </div>
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 px-5 h-10 lg:h-11 rounded-lg"
            onClick={addNewPlan}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Plan
          </Button>
        </div>

        {errors.plans && typeof errors.plans.message === "string" && (
          <p className="text-sm text-red-500">{errors.plans.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <PlanCard
              key={field.id}
              index={index}
              onRemove={remove}
              onSave={(i) => {
                // saving is handled internally by the card's local state
              }}
              onAddAnother={addNewPlan}
              canRemove={fields.length > 1}
              isLast={index === fields.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}