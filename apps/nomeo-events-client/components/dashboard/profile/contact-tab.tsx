"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactTabProps {
  phoneNumber: string;
  email: string;
  officeNumber: string;
  supportEmail: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onOfficeNumberChange: (value: string) => void;
  onSupportEmailChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCountryChange: (value: string) => void;
}

export const ContactTab = ({
  phoneNumber,
  email,
  officeNumber,
  supportEmail,
  address,
  city,
  state,
  postalCode,
  country,
  onPhoneChange,
  onEmailChange,
  onOfficeNumberChange,
  onSupportEmailChange,
  onAddressChange,
  onCityChange,
  onStateChange,
  onPostalCodeChange,
  onCountryChange,
}: ContactTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Phone Number */}
        <div className="space-y-1.5">
          <Label htmlFor="phone-number">Phone Number *</Label>
          <Input
            id="phone-number"
            type="tel"
            value={phoneNumber || ""}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+234 801 234 5678"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email || ""}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        {/* Office Number */}
        <div className="space-y-1.5">
          <Label htmlFor="office-number">Office Number</Label>
          <Input
            id="office-number"
            type="tel"
            value={officeNumber || ""}
            onChange={(e) => onOfficeNumberChange(e.target.value)}
            placeholder="+234 809 876 5432"
          />
        </div>

        {/* Support Email */}
        <div className="space-y-1.5">
          <Label htmlFor="support-email">Support Email</Label>
          <Input
            id="support-email"
            type="email"
            value={supportEmail || ""}
            onChange={(e) => onSupportEmailChange(e.target.value)}
            placeholder="support@yourcompany.com"
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            type="text"
            value={address || ""}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="123 Business Street"
          />
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            type="text"
            value={city || ""}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Lagos"
          />
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            type="text"
            value={state || ""}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="Lagos State"
          />
        </div>

        {/* Postal Code */}
        <div className="space-y-1.5">
          <Label htmlFor="postal-code">Postal Code</Label>
          <Input
            id="postal-code"
            type="text"
            value={postalCode || ""}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            placeholder="100001"
          />
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            type="text"
            value={country || "Nigeria"}
            onChange={(e) => onCountryChange(e.target.value)}
            placeholder="Nigeria"
          />
        </div>
      </div>
    </div>
  );
};