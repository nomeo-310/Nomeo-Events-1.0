"use client";

import { useState } from "react";
import { useFormContext, useFieldArray, FieldError } from "react-hook-form";
import { PlusIcon, Trash2Icon, CheckIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function SpeakerCard({
  index,
  onRemove,
  onAddAnother,
  isLast,
}: {
  index: number;
  onRemove: (i: number) => void;
  onAddAnother: () => void;
  isLast: boolean;
}) {
  const { register, watch, formState: { errors } } = useFormContext();
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  type SpeakerFieldError = { name?: FieldError; email?: FieldError; bio?: FieldError; company?: FieldError };
  const speakerErrors = (errors.speakers as SpeakerFieldError[] | undefined) ?? [];

  const name = watch(`speakers.${index}.name`);
  const company = watch(`speakers.${index}.company`);
  const email = watch(`speakers.${index}.email`);

  const handleSave = () => {
    setSaved(true);
    setCollapsed(true);
  };

  const handleEdit = () => {
    setSaved(false);
    setCollapsed(false);
  };

  if (collapsed && saved) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{name || `Speaker ${index + 1}`}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[company, email].filter(Boolean).join(" · ") || "No details added"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleEdit}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 dark:border-indigo-800">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">
            {name ? name : `Speaker ${index + 1}`}
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <Trash2Icon className="w-4 h-4 text-red-500" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name *</Label>
            <Input {...register(`speakers.${index}.name`)} className="mt-1.5" />
            {speakerErrors[index]?.name && (
              <p className="text-sm text-red-500 mt-1">
                {speakerErrors[index].name?.message}
              </p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              {...register(`speakers.${index}.email`)}
              className="mt-1.5"
            />
            {speakerErrors[index]?.email && (
              <p className="text-sm text-red-500 mt-1">
                {speakerErrors[index].email?.message}
              </p>
            )}
          </div>

          <div>
            <Label>Company/Organization</Label>
            <Input {...register(`speakers.${index}.company`)} className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea
            {...register(`speakers.${index}.bio`)}
            rows={3}
            className="mt-1.5"
          />
        </div>

        <Separator />
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Fill in the details above then save this speaker.
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
              Save Speaker
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SpeakersStep() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "speakers" });

  const addNewSpeaker = () => {
    append({ name: "", email: "", bio: "", company: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Speakers</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fill in each speaker and save before adding another.
          </p>
        </div>
        <Button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 px-5 h-10 lg:h-11"
          onClick={addNewSpeaker}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Speaker
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">No speakers added yet.</p>
          <button
            type="button"
            onClick={addNewSpeaker}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1"
          >
            Add your first speaker
          </button>
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <SpeakerCard
            key={field.id}
            index={index}
            onRemove={remove}
            onAddAnother={addNewSpeaker}
            isLast={index === fields.length - 1}
          />
        ))}
      </div>
    </div>
  );
}