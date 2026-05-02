"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as XIcon,
  MailIcon,
  TelephoneIcon as PhoneIcon,
  BuildingIcon,
  LocationIcon,
  GlobeIcon,
  StarIcon,
  BriefcaseIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  AlertIcon,
} from "@hugeicons/core-free-icons";
import { usePublicProfile } from "@/hooks/use-profile";
import { format } from "date-fns";

interface OrganizerProfileModalProps {
  open: boolean;
  onClose: () => void;
  organizerSlug: string;
}

// Skeleton components
function AvatarSkeleton() {
  return (
    <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 animate-pulse" />
  );
}

function TextSkeleton({ width = "w-full", className = "" }) {
  return (
    <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${width} ${className}`} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
      <div className="h-6 w-8 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
      <div className="h-2 w-10 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  );
}

function InfoRowSkeleton() {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

// Fallback Cover Image Component
function CoverImageFallback() {
  return (
    <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/30">
          <HugeiconsIcon icon={BuildingIcon} size={48} strokeWidth={1} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}

// Fallback Profile Image Component
function ProfileImageFallback({ name, size = "w-20 h-20" }: { name: string; size?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`${size} rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold text-xl">
        {initials || "?"}
      </span>
    </div>
  );
}

export function OrganizerProfileModal({ open, onClose, organizerSlug }: OrganizerProfileModalProps): JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const { data: profile, isLoading, error, refetch } = usePublicProfile(organizerSlug);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch data when modal opens
  useEffect(() => {
    if (open && organizerSlug) {
      refetch();
    }
  }, [open, organizerSlug, refetch]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open || !mounted) return null;

  const formatDate = (date: string | Date) => {
    if (!date) return "Not specified";
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch {
      return "Not specified";
    }
  };

  const getVerificationBadge = () => {
    const status = profile?.verificationStatus;
    switch (status) {
      case "verified":
        return {
          label: "Verified Organizer",
          className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
          icon: CheckCircleIcon,
        };
      case "pending":
        return {
          label: "Verification Pending",
          className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
          icon: ClockIcon,
        };
      case "rejected":
        return {
          label: "Verification Failed",
          className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
          icon: AlertIcon,
        };
      default:
        return null;
    }
  };

  const verificationBadge = getVerificationBadge();

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading state with skeleton */}
        {isLoading && (
          <>
            {/* Header with Cover Image Skeleton */}
            <div className="relative shrink-0">
              <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse" />
              
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/30 transition-colors backdrop-blur-sm z-10"
              >
                <HugeiconsIcon icon={XIcon} size={18} />
              </button>
              
              {/* Avatar Skeleton */}
              <div className="absolute -bottom-10 left-5">
                <AvatarSkeleton />
              </div>
            </div>

            {/* Content - scrollable with skeleton */}
            <div className="flex-1 overflow-y-auto pt-14 px-5 pb-6 min-h-0">
              {/* Name Skeleton */}
              <div className="mb-4">
                <TextSkeleton width="w-48" className="h-6 mb-2" />
                <TextSkeleton width="w-32" className="h-3" />
              </div>

              {/* Stats Cards Skeleton */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>

              {/* Bio Skeleton */}
              <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                <TextSkeleton width="w-full" />
                <TextSkeleton width="w-5/6" />
                <TextSkeleton width="w-4/6" />
              </div>

              {/* Contact Information Skeleton */}
              <div className="space-y-3 mb-5">
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="space-y-3">
                  <InfoRowSkeleton />
                  <InfoRowSkeleton />
                  <InfoRowSkeleton />
                </div>
              </div>

              {/* Location Skeleton */}
              <div className="space-y-2 mb-5">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <InfoRowSkeleton />
              </div>

              {/* Social Media Skeleton */}
              <div className="space-y-3">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error state */}
        {(error || (!isLoading && !profile)) && (
          <>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/30 transition-colors z-10"
            >
              <HugeiconsIcon icon={XIcon} size={18} />
            </button>
            <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600" />
            <div className="pt-14 px-5 pb-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <HugeiconsIcon icon={AlertIcon} size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Unable to Load Profile
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                The organizer's profile could not be loaded at this time.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* Success state with actual data */}
        {!isLoading && !error && profile && (
          <>
            {/* Header with Cover Image */}
            <div className="relative shrink-0">
              {profile.coverPicture?.secure_url ? (
                <img
                  src={profile.coverPicture.secure_url}
                  alt={`${profile.fullName}'s cover`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling;
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              
              {/* Fallback cover image - shown when no cover URL or image fails */}
              {(!profile.coverPicture?.secure_url) && <CoverImageFallback />}
              
              {/* Hidden fallback for when image fails to load */}
              {profile.coverPicture?.secure_url && (
                <div className="hidden h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/30">
                      <HugeiconsIcon icon={BuildingIcon} size={48} strokeWidth={1} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}
              
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/30 transition-colors backdrop-blur-sm z-10"
              >
                <HugeiconsIcon icon={XIcon} size={18} />
              </button>
              
              {/* Avatar */}
              <div className="absolute -bottom-10 left-5">
                {profile.profilePicture?.secure_url ? (
                  <img
                    src={profile.profilePicture.secure_url}
                    alt={profile.fullName}
                    className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 object-cover bg-white dark:bg-gray-900 shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling;
                      if (fallback) {
                        (fallback as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                
                {/* Fallback profile image */}
                {(!profile.profilePicture?.secure_url) && (
                  <ProfileImageFallback name={profile.fullName} />
                )}
                
                {/* Hidden fallback for when profile image fails to load */}
                {profile.profilePicture?.secure_url && (
                  <div className="hidden">
                    <ProfileImageFallback name={profile.fullName} />
                  </div>
                )}
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto pt-14 px-5 pb-6 min-h-0">
              {/* Name and Badges */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile.displayName || profile.fullName}
                </h2>
                
                {profile.accountType && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {profile.accountType === "organization" ? "Organization" : "Individual"}
                    </span>
                    {profile.organizationType && profile.accountType === "organization" && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {profile.organizationType}
                        </span>
                      </>
                    )}
                  </div>
                )}
                
                {verificationBadge && (
                  <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full ${verificationBadge.className}`}>
                    <HugeiconsIcon icon={verificationBadge.icon} size={12} />
                    <span className="text-[10px] font-medium">{verificationBadge.label}</span>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{profile.totalEvents || 0}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Events</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{profile.totalAttendees || 0}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Attendees</p>
                </div>
                {profile.averageRating !== undefined && profile.averageRating !== null && (
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                    <div className="flex items-center justify-center gap-0.5">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{profile.averageRating.toFixed(1)}</p>
                      <HugeiconsIcon icon={StarIcon} size={12} className="text-amber-500" />
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Rating</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-3 mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  Contact Information
                </h3>
                
                <div className="space-y-2">
                  {profile.contact?.email && (
                    <div className="flex items-start gap-3 text-sm">
                      <HugeiconsIcon icon={MailIcon} size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <a 
                          href={`mailto:${profile.contact.email}`} 
                          className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all"
                        >
                          {profile.contact.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {profile.contact?.phoneNumber && (
                    <div className="flex items-start gap-3 text-sm">
                      <HugeiconsIcon icon={PhoneIcon} size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <a 
                          href={`tel:${profile.contact.phoneNumber}`} 
                          className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {profile.contact.phoneNumber}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {profile.contact?.website && (
                    <div className="flex items-start gap-3 text-sm">
                      <HugeiconsIcon icon={GlobeIcon} size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                        <a 
                          href={profile.contact.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                        >
                          {profile.contact.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {profile.location && (profile.location.address || profile.location.city || profile.location.state) && (
                <div className="space-y-2 mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    Location
                  </h3>
                  <div className="flex items-start gap-3 text-sm">
                    <HugeiconsIcon icon={LocationIcon} size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-600 dark:text-gray-300">
                        {[profile.location.address, profile.location.city, profile.location.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {profile.location.country && (
                        <p className="text-xs text-gray-400 mt-0.5">{profile.location.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Organization Details */}
              {profile.accountType === "organization" && (
                <div className="space-y-3 mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    Organization Details
                  </h3>
                  
                  <div className="space-y-2">
                    {profile.organizationName && (
                      <div className="flex items-start gap-3 text-sm">
                        <HugeiconsIcon icon={BuildingIcon} size={16} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Organization Name</p>
                          <p className="text-gray-600 dark:text-gray-300">{profile.organizationName}</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.organizationRegistrationNumber && (
                      <div className="flex items-start gap-3 text-sm">
                        <HugeiconsIcon icon={BriefcaseIcon} size={16} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Registration Number</p>
                          <p className="text-gray-600 dark:text-gray-300">{profile.organizationRegistrationNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Specialties */}
              {profile.specialties && profile.specialties.length > 0 && (
                <div className="space-y-2 mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specialties.map((specialty: string, index: number) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {profile.contact?.socialMedia && 
                Object.values(profile.contact.socialMedia).some(platform => platform) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Social Media
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {profile.contact.socialMedia.instagram && (
                      <a
                        href={profile.contact.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-600 transition-colors text-xs flex items-center gap-1.5"
                      >
                        Instagram
                      </a>
                    )}
                    
                    {profile.contact.socialMedia.facebook && (
                      <a
                        href={profile.contact.socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors text-xs flex items-center gap-1.5"
                      >
                        Facebook
                      </a>
                    )}
                    
                    {profile.contact.socialMedia.twitter && (
                      <a
                        href={profile.contact.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 transition-colors text-xs flex items-center gap-1.5"
                      >
                        Twitter/X
                      </a>
                    )}
                    
                    {profile.contact.socialMedia.linkedin && (
                      <a
                        href={profile.contact.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 transition-colors text-xs flex items-center gap-1.5"
                      >
                        LinkedIn
                      </a>
                    )}
                    
                    {profile.contact.socialMedia.youtube && (
                      <a
                        href={profile.contact.socialMedia.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors text-xs flex items-center gap-1.5"
                      >
                        YouTube
                      </a>
                    )}

                    {profile.contact.socialMedia.tiktok && (
                      <a
                        href={profile.contact.socialMedia.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs flex items-center gap-1.5"
                      >
                        TikTok
                      </a>
                    )}

                    {profile.contact.socialMedia.whatsApp && (
                      <a
                        href={profile.contact.socialMedia.whatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 transition-colors text-xs flex items-center gap-1.5"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Member Since */}
              {profile.createdAt && (
                <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                    Member since {formatDate(profile.createdAt)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Use portal to render modal at the root level
  return createPortal(modalContent, document.body);
}