"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const handlePaymentMethodChange = (value: string | null) => {
    if (value) {
      onPaymentMethodChange(value);
    }
  };

  const handleCurrencyChange = (value: string | null) => {
    if (value) {
      onCurrencyChange(value);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-yellow-800">
          Payment details are required for receiving payouts from events.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <Select
          value={paymentMethod || "manual"}
          onValueChange={handlePaymentMethodChange}
        >
          <SelectTrigger className="w-full h-10 lg:h-11">
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

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name
          </label>
          <input
            type="text"
            value={bankName || ""}
            onChange={(e) => onBankNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Name
          </label>
          <input
            type="text"
            value={accountName || ""}
            onChange={(e) => onAccountNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number
          </label>
          <input
            type="text"
            value={accountNumber || ""}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Code
          </label>
          <input
            type="text"
            value={bankCode || ""}
            onChange={(e) => onBankCodeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Routing Number
          </label>
          <input
            type="text"
            value={routingNumber || ""}
            onChange={(e) => onRoutingNumberChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SWIFT Code
          </label>
          <input
            type="text"
            value={swiftCode || ""}
            onChange={(e) => onSwiftCodeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <Select
            value={currency || "NGN"}
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger className="w-full h-10 lg:h-11">
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
    </div>
  );
};