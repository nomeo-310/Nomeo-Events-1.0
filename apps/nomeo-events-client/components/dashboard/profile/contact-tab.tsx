"use client";

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
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={phoneNumber || ""}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={email || ""}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Office Number
          </label>
          <input
            type="tel"
            value={officeNumber || ""}
            onChange={(e) => onOfficeNumberChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={supportEmail || ""}
            onChange={(e) => onSupportEmailChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            value={address || ""}
            onChange={(e) => onAddressChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={city || ""}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={state || ""}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postal Code
          </label>
          <input
            type="text"
            value={postalCode || ""}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            value={country || "Nigeria"}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>
      </div>
    </div>
  );
};