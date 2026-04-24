"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function mergeDateAndTime(existing: Date | null | undefined, timeStr: string): Date {
  const base = existing ? new Date(existing) : new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  base.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return base;
}

export function AdvancedSettingsStep() {
  const { register, watch, setValue } = useFormContext();
  const [tagInput, setTagInput] = useState("");

  const registrationDeadline = watch("registrationDeadline");
  const isPublic = watch("isPublic");
  const requiresApproval = watch("requiresApproval");
  const featured = watch("featured");
  const tags = watch("tags") || [];

  const toTimeString = (date: Date | null | undefined) =>
    date ? format(date, "HH:mm") : "";

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setValue("tags", tags.filter((t: string) => t !== tag));
  };

  return (
    <div className="space-y-6">
      {/* Registration Deadline */}
      <div>
        <Label>Registration Deadline</Label>
        <div className="space-y-2 mt-1.5">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger className={cn("flex h-10 lg:h-11 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm justify-start text-left font-normal",
                  !registrationDeadline && "text-muted-foreground"
                )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {registrationDeadline ? format(registrationDeadline, "PPP") : "Set registration deadline date (optional)"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={registrationDeadline ?? undefined}
                onSelect={(date) => {
                  if (!date) {
                    setValue("registrationDeadline", null);
                    return;
                  }
                  // Preserve existing time when changing date
                  const merged = mergeDateAndTime(
                    registrationDeadline,
                    toTimeString(registrationDeadline) || "00:00"
                  );
                  merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setValue("registrationDeadline", merged);
                }}
                initialFocus
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          {/* Time input — only shown once a date is selected */}
          {registrationDeadline && (
            <div className="flex items-center gap-3">
              <Input
                type="time"
                value={toTimeString(registrationDeadline)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setValue(
                    "registrationDeadline",
                    mergeDateAndTime(registrationDeadline, e.target.value)
                  );
                }}
                className="h-10 lg:h-11 w-40"
              />
              <span className="text-sm text-muted-foreground">
                Deadline time
              </span>
              <button
                type="button"
                onClick={() => setValue("registrationDeadline", null)}
                className="ml-auto text-xs text-muted-foreground hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Make Event Public</Label>
          <Switch
            checked={isPublic}
            onCheckedChange={(checked) => setValue("isPublic", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Require Approval for Registrations</Label>
          <Switch
            checked={requiresApproval}
            onCheckedChange={(checked) => setValue("requiresApproval", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Feature this Event</Label>
          <Switch
            checked={featured}
            onCheckedChange={(checked) => setValue("featured", checked)}
          />
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mt-1.5">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags (e.g., technology, workshop)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button
            type="button"
            onClick={addTag}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11 rounded-lg"
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg bg-muted/50 border border-border">
            {tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 px-3 py-1.5 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 hover:text-red-500 transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* SEO */}
      <div>
        <Label>SEO Title</Label>
        <Input
          {...register("seoTitle")}
          placeholder="Custom SEO title (optional)"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>SEO Description</Label>
        <Textarea
          {...register("seoDescription")}
          placeholder="Custom SEO description (optional)"
          rows={3}
          className="mt-1.5"
        />
      </div>
    </div>
  );
}