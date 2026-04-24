"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName || ""}
            onChange={(e) => onFullNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName || ""}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="How you want to be seen publicly"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={4}
            value={bio || ""}
            onChange={(e) => onBioChange(e.target.value)}
            placeholder="Tell the world about yourself..."
          />
          <p className="text-xs text-muted-foreground">
            {bio?.length || 0}/500 characters
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shortBio">Short Bio</Label>
          <Input
            id="shortBio"
            type="text"
            value={shortBio || ""}
            onChange={(e) => onShortBioChange(e.target.value)}
            placeholder="A short tagline or one-liner"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {shortBio?.length || 0}/100 characters
          </p>
        </div>
      </div>
    </div>
  );
};