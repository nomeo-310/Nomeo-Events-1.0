"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Globe02Icon, 
  Facebook02Icon, 
  InstagramIcon, 
  NewTwitterIcon, 
  Linkedin02Icon, 
  YoutubeIcon, 
  TiktokIcon, 
  ThreadsIcon, 
  WhatsappIcon 
} from "@hugeicons/core-free-icons";

interface SocialTabProps {
  website: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  threads: string;
  whatsApp: string;
  onWebsiteChange: (value: string) => void;
  onFacebookChange: (value: string) => void;
  onInstagramChange: (value: string) => void;
  onTwitterChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onYoutubeChange: (value: string) => void;
  onTiktokChange: (value: string) => void;
  onThreadsChange: (value: string) => void;
  onWhatsAppChange: (value: string) => void;
}

export const SocialTab = ({
  website,
  facebook,
  instagram,
  twitter,
  linkedin,
  youtube,
  tiktok,
  threads,
  whatsApp,
  onWebsiteChange,
  onFacebookChange,
  onInstagramChange,
  onTwitterChange,
  onLinkedinChange,
  onYoutubeChange,
  onTiktokChange,
  onThreadsChange,
  onWhatsAppChange,
}: SocialTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        
        {/* Website */}
        <div className="space-y-1.5">
          <Label htmlFor="website" className="flex items-center gap-2">
            <HugeiconsIcon icon={Globe02Icon} className="w-4 h-4 text-muted-foreground" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={website || ""}
            onChange={(e) => onWebsiteChange(e.target.value)}
            placeholder="https://your-website.com"
          />
        </div>

        {/* Facebook */}
        <div className="space-y-1.5">
          <Label htmlFor="facebook" className="flex items-center gap-2">
            <HugeiconsIcon icon={Facebook02Icon} className="w-4 h-4 text-muted-foreground" />
            Facebook
          </Label>
          <Input
            id="facebook"
            type="url"
            value={facebook || ""}
            onChange={(e) => onFacebookChange(e.target.value)}
            placeholder="https://facebook.com/username"
          />
        </div>

        {/* Instagram */}
        <div className="space-y-1.5">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <HugeiconsIcon icon={InstagramIcon} className="w-4 h-4 text-muted-foreground" />
            Instagram
          </Label>
          <Input
            id="instagram"
            type="url"
            value={instagram || ""}
            onChange={(e) => onInstagramChange(e.target.value)}
            placeholder="https://instagram.com/username"
          />
        </div>

        {/* X (Twitter) */}
        <div className="space-y-1.5">
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <HugeiconsIcon icon={NewTwitterIcon} className="w-4 h-4 text-muted-foreground" />
            X (Twitter)
          </Label>
          <Input
            id="twitter"
            type="url"
            value={twitter || ""}
            onChange={(e) => onTwitterChange(e.target.value)}
            placeholder="https://twitter.com/username"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1.5">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <HugeiconsIcon icon={Linkedin02Icon} className="w-4 h-4 text-muted-foreground" />
            LinkedIn
          </Label>
          <Input
            id="linkedin"
            type="url"
            value={linkedin || ""}
            onChange={(e) => onLinkedinChange(e.target.value)}
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        {/* YouTube */}
        <div className="space-y-1.5">
          <Label htmlFor="youtube" className="flex items-center gap-2">
            <HugeiconsIcon icon={YoutubeIcon} className="w-4 h-4 text-muted-foreground" />
            YouTube
          </Label>
          <Input
            id="youtube"
            type="url"
            value={youtube || ""}
            onChange={(e) => onYoutubeChange(e.target.value)}
            placeholder="https://youtube.com/@username"
          />
        </div>

        {/* TikTok */}
        <div className="space-y-1.5">
          <Label htmlFor="tiktok" className="flex items-center gap-2">
            <HugeiconsIcon icon={TiktokIcon} className="w-4 h-4 text-muted-foreground" />
            TikTok
          </Label>
          <Input
            id="tiktok"
            type="url"
            value={tiktok || ""}
            onChange={(e) => onTiktokChange(e.target.value)}
            placeholder="https://tiktok.com/@username"
          />
        </div>

        {/* Threads */}
        <div className="space-y-1.5">
          <Label htmlFor="threads" className="flex items-center gap-2">
            <HugeiconsIcon icon={ThreadsIcon} className="w-4 h-4 text-muted-foreground" />
            Threads
          </Label>
          <Input
            id="threads"
            type="url"
            value={threads || ""}
            onChange={(e) => onThreadsChange(e.target.value)}
            placeholder="https://threads.net/@username"
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp" className="flex items-center gap-2">
            <HugeiconsIcon icon={WhatsappIcon} className="w-4 h-4 text-muted-foreground" />
            WhatsApp
          </Label>
          <Input
            id="whatsapp"
            type="url"
            value={whatsApp || ""}
            onChange={(e) => onWhatsAppChange(e.target.value)}
            placeholder="https://wa.me/1234567890"
          />
        </div>

      </div>
    </div>
  );
};