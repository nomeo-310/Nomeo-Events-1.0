"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const VerificationModal = ({ isOpen, onClose, onSubmit, isPending }: VerificationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">Request Verification</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4 sm:mb-6">
          To verify your account, please provide a valid government-issued ID or business registration document.
        </p>
        
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document
            </label>
            <input type="file" accept="image/*,.pdf" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: JPG, PNG, PDF (Max 5MB)
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};