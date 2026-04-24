"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, TelephoneIcon, MapsLocation01Icon } from "@hugeicons/core-free-icons";

interface VisibilityTabProps {
  seoTitle: string;
  seoDescription: string;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onShowEmailChange: (value: boolean) => void;
  onShowPhoneChange: (value: boolean) => void;
  onShowLocationChange: (value: boolean) => void;
}

export const VisibilityTab = ({
  seoTitle,
  seoDescription,
  showEmail,
  showPhone,
  showLocation,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onShowEmailChange,
  onShowPhoneChange,
  onShowLocationChange,
}: VisibilityTabProps) => {
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <p className="text-sm text-indigo-800 dark:text-indigo-300">
          Control what information is visible on your public profile.
        </p>
      </div>

      <div className="space-y-6">
        {/* SEO Section */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="seo-title">SEO Title</Label>
            <Input
              id="seo-title"
              type="text"
              value={seoTitle || ""}
              onChange={(e) => onSeoTitleChange(e.target.value)}
              placeholder="Your profile SEO title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seo-description">SEO Description</Label>
            <Textarea
              id="seo-description"
              rows={4}
              value={seoDescription || ""}
              onChange={(e) => onSeoDescriptionChange(e.target.value)}
              placeholder="Write a short description for SEO..."
              className="resize-y min-h-[100px]"
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Privacy Settings
          </h3>

          <div className="space-y-3">
            {/* Show Email */}
            <div className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <HugeiconsIcon 
                  icon={Mail01Icon} 
                  className="w-5 h-5 text-muted-foreground" 
                />
                <div>
                  <div className="font-medium text-foreground">Show Email</div>
                  <div className="text-sm text-muted-foreground">
                    Display email on public profile
                  </div>
                </div>
              </div>
              <Switch
                checked={showEmail}
                onCheckedChange={onShowEmailChange}
              />
            </div>

            {/* Show Phone */}
            <div className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <HugeiconsIcon 
                  icon={TelephoneIcon} 
                  className="w-5 h-5 text-muted-foreground" 
                />
                <div>
                  <div className="font-medium text-foreground">Show Phone</div>
                  <div className="text-sm text-muted-foreground">
                    Display phone number on public profile
                  </div>
                </div>
              </div>
              <Switch
                checked={showPhone}
                onCheckedChange={onShowPhoneChange}
              />
            </div>

            {/* Show Location */}
            <div className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <HugeiconsIcon 
                  icon={MapsLocation01Icon} 
                  className="w-5 h-5 text-muted-foreground" 
                />
                <div>
                  <div className="font-medium text-foreground">Show Location</div>
                  <div className="text-sm text-muted-foreground">
                    Display location on public profile
                  </div>
                </div>
              </div>
              <Switch
                checked={showLocation}
                onCheckedChange={onShowLocationChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};