"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCategory, EventTypesByCategory } from "@/types/create-event-type";

export function BasicInfoStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedCategory = watch("category");
  const selectedType = watch("type");
  const availableTypes = selectedCategory ? EventTypesByCategory[selectedCategory as EventCategory] || []
    : [];

  useEffect(() => {
    // When category changes: default to the first available type for the new
    // category, or clear if none exist. shouldValidate:false avoids premature
    // error flash before the user has interacted with the type field.
    const types = selectedCategory
      ? EventTypesByCategory[selectedCategory as EventCategory] || []
      : [];
    setValue("type", types.length > 0 ? types[0] : "", { shouldValidate: false });
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="e.g., Tech Innovation Summit 2024"
          className="mt-1.5"
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description *</Label>
        <Textarea
          id="shortDescription"
          {...register("shortDescription")}
          placeholder="A brief summary of your event..."
          rows={4}
          className="mt-1.5 resize-none"
        />
        {errors.shortDescription && (
          <p className="text-sm text-red-500 mt-1">{errors.shortDescription.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe your event in detail..."
          rows={6}
          className="mt-1.5 h-40 resize-none"
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message as string}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              if (value) setValue("category", value, { shouldValidate: true });
              // type resets automatically via the useEffect above
            }}
          >
            <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(EventCategory).map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500 mt-1">{errors.category.message as string}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Event Type *</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => {
              if (value) setValue("type", value, { shouldValidate: true });
            }}
          >
            <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type.message as string}</p>
          )}
        </div>
      </div>
    </div>
  );
}