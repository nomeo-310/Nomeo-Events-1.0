"use client";

interface BasicInfoTabProps {
  fullName: string;
  displayName: string;
  bio: string;
  shortBio: string;
  onFullNameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onShortBioChange: (value: string) => void;
}

export const BasicInfoTab = ({
  fullName,
  displayName,
  bio,
  shortBio,
  onFullNameChange,
  onDisplayNameChange,
  onBioChange,
  onShortBioChange,
}: BasicInfoTabProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={fullName || ""}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName || ""}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="How you want to be seen publicly"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            value={bio || ""}
            onChange={(e) => onBioChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="Tell the world about yourself..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio?.length || 0}/500 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Bio
          </label>
          <input
            type="text"
            value={shortBio || ""}
            onChange={(e) => onShortBioChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="A short tagline or one-liner"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {shortBio?.length || 0}/100 characters
          </p>
        </div>
      </div>
    </div>
  );
};