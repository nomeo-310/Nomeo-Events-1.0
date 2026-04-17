"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon, Facebook02Icon, InstagramIcon, NewTwitterIcon, Linkedin02Icon, YoutubeIcon, TiktokIcon, ThreadsIcon, WhatsappIcon } from "@hugeicons/core-free-icons";

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
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={Globe02Icon} className="w-4 h-4 inline mr-2" />
            Website
          </label>
          <input
            type="url"
            value={website || ""}
            onChange={(e) => onWebsiteChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://your-website.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={Facebook02Icon} className="w-4 h-4 inline mr-2" />
            Facebook
          </label>
          <input
            type="url"
            value={facebook || ""}
            onChange={(e) => onFacebookChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://facebook.com/username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={InstagramIcon} className="w-4 h-4 inline mr-2" />
            Instagram
          </label>
          <input
            type="url"
            value={instagram || ""}
            onChange={(e) => onInstagramChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://instagram.com/username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={NewTwitterIcon} className="w-4 h-4 inline mr-2" />
            X (Twitter)
          </label>
          <input
            type="url"
            value={twitter || ""}
            onChange={(e) => onTwitterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://twitter.com/username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={Linkedin02Icon} className="w-4 h-4 inline mr-2" />
            LinkedIn
          </label>
          <input
            type="url"
            value={linkedin || ""}
            onChange={(e) => onLinkedinChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={YoutubeIcon} className="w-4 h-4 inline mr-2" />
            YouTube
          </label>
          <input
            type="url"
            value={youtube || ""}
            onChange={(e) => onYoutubeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://youtube.com/@username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={TiktokIcon} className="w-4 h-4 inline mr-2" />
            TikTok
          </label>
          <input
            type="url"
            value={tiktok || ""}
            onChange={(e) => onTiktokChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://tiktok.com/@username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={ThreadsIcon} className="w-4 h-4 inline mr-2" />
            Threads
          </label>
          <input
            type="url"
            value={threads || ""}
            onChange={(e) => onThreadsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://threads.net/@username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HugeiconsIcon icon={WhatsappIcon} className="w-4 h-4 inline mr-2" />
            WhatsApp
          </label>
          <input
            type="url"
            value={whatsApp || ""}
            onChange={(e) => onWhatsAppChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="https://wa.me/1234567890"
          />
        </div>
      </div>
    </div>
  );
};