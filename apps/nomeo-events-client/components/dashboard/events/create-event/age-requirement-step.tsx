"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Split the verification method select into its own component so the watch()
// for ageVerificationMethod only subscribes when the block is actually rendered.
function VerificationMethodSelect() {
  const { watch, setValue } = useFormContext();
  const ageVerificationMethod = watch("ageRequirement.ageVerificationMethod");

  return (
    <div>
      <Label>Verification Method</Label>
      <Select
        value={ageVerificationMethod}
        onValueChange={(value) => {
          if (value)
            setValue(
              "ageRequirement.ageVerificationMethod",
              value as "id_check" | "self_declaration" | "guardian_confirmation"
            );
        }}
      >
        <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id_check">ID Check</SelectItem>
          <SelectItem value="self_declaration">Self Declaration</SelectItem>
          <SelectItem value="guardian_confirmation">Guardian Confirmation</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function AgeRequirementStep() {
  const { register, watch, setValue } = useFormContext();

  // Each watch() only covers what this level of the tree actually renders
  const required = watch("ageRequirement.required");
  const requiresParentalConsent = watch("ageRequirement.requiresParentalConsent");
  const ageVerificationRequired = watch("ageRequirement.ageVerificationRequired");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="ageRequired">Enable Age Restrictions</Label>
        <Switch
          id="ageRequired"
          checked={required}
          onCheckedChange={(checked) => setValue("ageRequirement.required", checked)}
        />
      </div>

      {required && (
        <div className="space-y-4 pl-4 border-l-2 border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Minimum Age</Label>
              <Input
                type="number"
                {...register("ageRequirement.minAge", { valueAsNumber: true })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Maximum Age</Label>
              <Input
                type="number"
                {...register("ageRequirement.maxAge", { valueAsNumber: true })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Require Parental Consent</Label>
            <Switch
              checked={requiresParentalConsent}
              onCheckedChange={(checked) =>
                setValue("ageRequirement.requiresParentalConsent", checked)
              }
            />
          </div>

          {requiresParentalConsent && (
            <div>
              <Label>Parental Consent Message</Label>
              <Textarea
                {...register("ageRequirement.parentalConsentMessage")}
                placeholder="Message to display for parental consent..."
                rows={3}
                className="mt-1.5"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Require Age Verification</Label>
            <Switch
              checked={ageVerificationRequired}
              onCheckedChange={(checked) =>
                setValue("ageRequirement.ageVerificationRequired", checked)
              }
            />
          </div>

          {/* VerificationMethodSelect only mounts — and only subscribes to
              ageVerificationMethod — when ageVerificationRequired is true */}
          {ageVerificationRequired && <VerificationMethodSelect />}
        </div>
      )}
    </div>
  );
}