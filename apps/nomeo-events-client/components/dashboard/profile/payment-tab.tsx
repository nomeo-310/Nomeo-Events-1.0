"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentTabProps {
  paymentMethod: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  routingNumber: string;
  swiftCode: string;
  currency: string;
  onPaymentMethodChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onAccountNameChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onBankCodeChange: (value: string) => void;
  onRoutingNumberChange: (value: string) => void;
  onSwiftCodeChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
}

export const PaymentTab = ({
  paymentMethod,
  bankName,
  accountName,
  accountNumber,
  bankCode,
  routingNumber,
  swiftCode,
  currency,
  onPaymentMethodChange,
  onBankNameChange,
  onAccountNameChange,
  onAccountNumberChange,
  onBankCodeChange,
  onRoutingNumberChange,
  onSwiftCodeChange,
  onCurrencyChange,
}: PaymentTabProps) => {
  return (
    <div className="space-y-6">
      {/* Warning Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Payment details are required for receiving payouts from events.
        </p>
      </div>

      {/* Payment Method & Currency - Side by side on md and above */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Method */}
        <div className="space-y-1.5">
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select
            value={paymentMethod || "manual"}
            onValueChange={(value) => onPaymentMethodChange(value || "manual")}
          >
            <SelectTrigger id="payment-method" className="h-11 w-full">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={currency || "NGN"}
            onValueChange={(value) => onCurrencyChange(value || "NGN")}
          >
            <SelectTrigger id="currency" className="h-11 w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="GBP">British Pound (GBP)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Other Bank Fields - Full width on all screens */}
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="bank-name">Bank Name</Label>
          <Input
            id="bank-name"
            type="text"
            value={bankName || ""}
            onChange={(e) => onBankNameChange(e.target.value)}
            placeholder="e.g. GTBank, Zenith Bank"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account-name">Account Name</Label>
          <Input
            id="account-name"
            type="text"
            value={accountName || ""}
            onChange={(e) => onAccountNameChange(e.target.value)}
            placeholder="Account holder full name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account-number">Account Number</Label>
          <Input
            id="account-number"
            type="text"
            value={accountNumber || ""}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            placeholder="0123456789"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="bank-code">Bank Code</Label>
            <Input
              id="bank-code"
              type="text"
              value={bankCode || ""}
              onChange={(e) => onBankCodeChange(e.target.value)}
              placeholder="e.g. 058"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="routing-number">Routing Number</Label>
            <Input
              id="routing-number"
              type="text"
              value={routingNumber || ""}
              onChange={(e) => onRoutingNumberChange(e.target.value)}
              placeholder="Routing number (if applicable)"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="swift-code">SWIFT Code</Label>
          <Input
            id="swift-code"
            type="text"
            value={swiftCode || ""}
            onChange={(e) => onSwiftCodeChange(e.target.value)}
            placeholder="e.g. GTBINGLA"
          />
        </div>
      </div>
    </div>
  );
};