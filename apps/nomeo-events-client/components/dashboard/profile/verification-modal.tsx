"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const VerificationModal = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: VerificationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl max-w-md w-full p-4 sm:p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Request Verification
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
          To verify your account, please provide a valid government-issued ID or business
          registration document.
        </p>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="space-y-1.5">
            <Label>Document Type</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id_card">ID Card</SelectItem>
                <SelectItem value="passport">International Passport</SelectItem>
                <SelectItem value="drivers_license">Driver's License</SelectItem>
                <SelectItem value="cac_document">CAC Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-upload">Upload Document</Label>
            <input
              id="doc-upload"
              type="file"
              accept="image/*,.pdf"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 dark:file:bg-violet-950 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: JPG, PNG, PDF (Max 5MB)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isPending}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};