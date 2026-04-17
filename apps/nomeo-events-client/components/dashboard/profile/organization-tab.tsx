"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrganizationTabProps {
  accountType: "individual" | "organization";
  organizationName: string;
  organizationType: string;
  organizationRegistrationNumber: string;
  taxId: string;
  onAccountTypeChange: (value: "individual" | "organization") => void;
  onOrganizationNameChange: (value: string) => void;
  onOrganizationTypeChange: (value: string) => void;
  onRegistrationNumberChange: (value: string) => void;
  onTaxIdChange: (value: string) => void;
}

export const OrganizationTab = ({
  accountType,
  organizationName,
  organizationType,
  organizationRegistrationNumber,
  taxId,
  onAccountTypeChange,
  onOrganizationNameChange,
  onOrganizationTypeChange,
  onRegistrationNumberChange,
  onTaxIdChange,
}: OrganizationTabProps) => {
  const handleAccountTypeChange = (value: string | null) => {
    if (value === "individual" || value === "organization") {
      onAccountTypeChange(value);
    }
  };

  const handleOrganizationTypeChange = (value: string | null) => {
    if (value) {
      onOrganizationTypeChange(value);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type *
          </label>
          <Select
            value={accountType || "individual"}
            onValueChange={handleAccountTypeChange}
          >
            <SelectTrigger className="w-full h-10 lg:h-11">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {accountType === "organization" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={organizationName || ""}
                onChange={(e) => onOrganizationNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Type
              </label>
              <Select
                value={organizationType || ""}
                onValueChange={handleOrganizationTypeChange}
              >
                <SelectTrigger className="w-full h-10 lg:h-11">
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                value={organizationRegistrationNumber || ""}
                onChange={(e) => onRegistrationNumberChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                placeholder="CAC, RC, or Business Registration Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / TIN
              </label>
              <input
                type="text"
                value={taxId || ""}
                onChange={(e) => onTaxIdChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                placeholder="Tax Identification Number"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};