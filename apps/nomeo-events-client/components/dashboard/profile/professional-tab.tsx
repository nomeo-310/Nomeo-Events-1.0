"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ProfessionalTabProps {
  specialties: string[];
  yearsOfExperience: number;
  onSpecialtiesChange: (specialties: string[]) => void;
  onYearsChange: (years: number) => void;
}

export const ProfessionalTab = ({
  specialties,
  yearsOfExperience,
  onSpecialtiesChange,
  onYearsChange,
}: ProfessionalTabProps) => {
  const [newSpecialty, setNewSpecialty] = useState("");
  const [localSpecialties, setLocalSpecialties] = useState<string[]>(specialties || []);

  useEffect(() => {
    setLocalSpecialties(specialties || []);
  }, [specialties]);

  const handleAddSpecialty = () => {
    if (newSpecialty.trim()) {
      const updated = [...localSpecialties, newSpecialty.trim()];
      setLocalSpecialties(updated);
      onSpecialtiesChange(updated);
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (indexToRemove: number) => {
    const updated = localSpecialties.filter((_, i) => i !== indexToRemove);
    setLocalSpecialties(updated);
    onSpecialtiesChange(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSpecialty();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1.5">
        <Label>Specialties</Label>

        <div className="flex gap-2 mb-3">
          <Input
            type="text"
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Wedding Planning"
            className="flex-1"
          />
          <Button type="button" onClick={handleAddSpecialty} variant="default" className={'h-10 lg:h-11 rounded-lg px-6 bg-indigo-600 hover:bg-indigo-500'}>
            Add
          </Button>
        </div>

        {localSpecialties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {localSpecialties.map((specialty, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 rounded-full text-sm border border-violet-200 dark:border-violet-800"
              >
                <span>{specialty}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(index)}
                  className="hover:text-violet-900 dark:hover:text-violet-100 ml-1"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No specialties added yet. Add your first specialty above.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Add your areas of expertise one at a time. Press Enter or click Add to save each specialty.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
        <Input
          id="yearsOfExperience"
          type="number"
          value={yearsOfExperience || ""}
          onChange={(e) => onYearsChange(parseInt(e.target.value) || 0)}
          min="0"
          className="max-w-[160px]"
        />
      </div>
    </div>
  );
};