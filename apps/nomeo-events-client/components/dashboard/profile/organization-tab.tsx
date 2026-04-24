"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="space-y-1.5">
          <Label htmlFor="account-type">Account Type *</Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="organization-name">Organization Name</Label>
              <Input
                id="organization-name"
                type="text"
                value={organizationName || ""}
                onChange={(e) => onOrganizationNameChange(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

<           div className="space-y-1.5">
              <Label htmlFor="organization-type">Organization Type</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="registration-number">Registration Number</Label>
              <Input
                id="registration-number"
                type="text"
                value={organizationRegistrationNumber || ""}
                onChange={(e) => onRegistrationNumberChange(e.target.value)}
                placeholder="CAC, RC, or Business Registration Number"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax-id">Tax ID / TIN</Label>
              <Input
                id="tax-id"
                type="text"
                value={taxId || ""}
                onChange={(e) => onTaxIdChange(e.target.value)}
                placeholder="Tax Identification Number"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};