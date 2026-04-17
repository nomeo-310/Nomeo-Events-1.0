"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

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
  onYearsChange 
}: ProfessionalTabProps) => {
  const [newSpecialty, setNewSpecialty] = useState("");
  const [localSpecialties, setLocalSpecialties] = useState<string[]>(specialties || []);

  useEffect(() => {
    setLocalSpecialties(specialties || []);
  }, [specialties]);

  const handleAddSpecialty = () => {
    if (newSpecialty.trim()) {
      const updatedSpecialties = [...localSpecialties, newSpecialty.trim()];
      setLocalSpecialties(updatedSpecialties);
      onSpecialtiesChange(updatedSpecialties);
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (indexToRemove: number) => {
    const updatedSpecialties = localSpecialties.filter((_, index) => index !== indexToRemove);
    setLocalSpecialties(updatedSpecialties);
    onSpecialtiesChange(updatedSpecialties);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSpecialty();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specialties
        </label>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="e.g., Wedding Planning"
          />
          <button
            type="button"
            onClick={handleAddSpecialty}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            Add
          </button>
        </div>
        
        {localSpecialties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {localSpecialties.map((specialty, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm"
              >
                <span>{specialty}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(index)}
                  className="hover:text-indigo-900 ml-1"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No specialties added yet. Add your first specialty above.</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Add your areas of expertise one at a time. Press Enter or click Add to save each specialty.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience
        </label>
        <input
          type="number"
          value={yearsOfExperience || ""}
          onChange={(e) => onYearsChange(parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          min="0"
        />
      </div>
    </div>
  );
};