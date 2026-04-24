"use client";

import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Merges a time string "HH:mm" into an existing Date, preserving the date part
function mergeDateAndTime(existing: Date | null | undefined, timeStr: string): Date {
  const base = existing ? new Date(existing) : new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  base.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return base;
}

export function DateTimeStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // Extract HH:mm string from a Date for the time input's value
  const toTimeString = (date: Date | null | undefined) =>
    date ? format(date, "HH:mm") : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Start ── */}
        <div className="space-y-2">
          <Label>Start Date & Time *</Label>

          {/* Date picker */}
          <Popover>
            <PopoverTrigger
              type="button"
              className={cn(
                "flex h-10 lg:h-11 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Select start date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate ?? undefined}
                onSelect={(date) => {
                  if (!date) return;
                  // Preserve existing time when changing the date
                  const merged = mergeDateAndTime(startDate, toTimeString(startDate) || "00:00");
                  merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setValue("startDate", merged, { shouldValidate: true });
                }}
                initialFocus
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          {/* Time input */}
          <Input
            type="time"
            value={toTimeString(startDate)}
            onChange={(e) => {
              if (!e.target.value) return;
              setValue("startDate", mergeDateAndTime(startDate, e.target.value), {
                shouldValidate: true,
              });
            }}
            className="h-10 lg:h-11"
          />

          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate.message as string}</p>
          )}
        </div>

        {/* ── End ── */}
        <div className="space-y-2">
          <Label>End Date & Time *</Label>

          {/* Date picker */}
          <Popover>
            <PopoverTrigger
              type="button"
              className={cn(
                "flex h-10 lg:h-11 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "Select end date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate ?? undefined}
                onSelect={(date) => {
                  if (!date) return;
                  const merged = mergeDateAndTime(endDate, toTimeString(endDate) || "00:00");
                  merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setValue("endDate", merged, { shouldValidate: true });
                }}
                initialFocus
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          {/* Time input */}
          <Input
            type="time"
            value={toTimeString(endDate)}
            onChange={(e) => {
              if (!e.target.value) return;
              setValue("endDate", mergeDateAndTime(endDate, e.target.value), {
                shouldValidate: true,
              });
            }}
            className="h-10 lg:h-11"
          />

          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" {...register("timezone")} className="mt-1.5" />
      </div>
    </div>
  );
}