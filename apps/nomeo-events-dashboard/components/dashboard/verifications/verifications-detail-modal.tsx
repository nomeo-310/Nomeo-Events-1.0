// verifications-detail-modal.tsx
import { useState, useEffect } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  Tick02Icon,
  Cancel01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReusableModal } from "@/components/ui/reusable-modal";

import { getInitials, hasValidValue, DOCUMENT_COLORS } from './verifications-types';
import { ImageViewerModal } from "./image-viewer-modal";

interface VerificationDetailModalProps {
  profile: any | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  onReject: (reason: string) => void;
  isVerifying: boolean;
  isRejecting: boolean;
  detailsData: any;
  isLoadingDetails: boolean;
  refetchDetails: () => void;
}

export const VerificationDetailModal = ({
  profile,
  isOpen,
  onClose,
  onVerify,
  onReject,
  isVerifying,
  isRejecting,
  detailsData,
  isLoadingDetails,
  refetchDetails,
}: VerificationDetailModalProps) => {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "profile">("documents");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const details = detailsData?.data;

  useEffect(() => {
    if (!isOpen) {
      setRejectReason("");
      setShowRejectForm(false);
      setActiveTab("documents");
      setImageViewerOpen(false);
    } else if (profile?._id) {
      refetchDetails();
    }
  }, [isOpen, profile?._id, refetchDetails]);

  const documents = details?.profile?.verificationDocuments || [];
  const hasDocuments = documents.length > 0;

  if (!profile) return null;

  const displayProfile = details?.profile || profile;
  const displayContact = details?.contact;
  const displayLocation = details?.location;
  const displayUserAccount = details?.userAccount;
  const verificationRequest = details?.verificationRequest;

  const openImageViewer = (index: number) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  return (
    <>
      <ReusableModal
        isOpen={isOpen}
        onClose={onClose}
        title="Verification Review"
        description={`Reviewing submission from ${displayProfile.fullName}`}
        size="xl"
        maxHeight="85vh"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-700">
              Close
            </Button>
            <div className="flex gap-2">
              {!showRejectForm ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    disabled={isVerifying || isRejecting}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-1.5" />
                    Reject
                  </Button>
                  <Button
                    onClick={onVerify}
                    disabled={isVerifying || isRejecting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isVerifying ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    ) : (
                      <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4 mr-1.5" />
                    )}
                    Verify Account
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    className="dark:border-gray-700"
                  >
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onReject(rejectReason)}
                    disabled={!rejectReason.trim() || isRejecting}
                  >
                    {isRejecting ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    ) : (
                      <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-1.5" />
                    )}
                    Confirm Rejection
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {isLoadingDetails && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading verification details...</p>
              </div>
            </div>
          )}

          {!isLoadingDetails && (
            <>
              <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab("documents")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all relative",
                    activeTab === "documents"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Documents ({documents.length})
                  {activeTab === "documents" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all relative",
                    activeTab === "profile"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Profile Details
                  {activeTab === "profile" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
              </div>

              {activeTab === "documents" && (
                <div>
                  {hasDocuments ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map((doc: any, idx: number) => (
                        <div
                          key={idx}
                          className="group relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                          onClick={() => openImageViewer(idx)}
                        >
                          <div className="relative bg-gray-100 dark:bg-gray-800 aspect-[4/3] overflow-hidden">
                            {doc.thumbnail_url || doc.secure_url ? (
                              <>
                                <img
                                  src={doc.thumbnail_url || doc.secure_url}
                                  alt={doc.documentTypeLabel}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <div className="absolute top-2 right-2">
                                  <span className={cn(
                                    "px-2 py-1 text-[10px] rounded-full font-medium shadow-md",
                                    DOCUMENT_COLORS[doc.documentType]
                                  )}>
                                    {doc.documentTypeLabel}
                                  </span>
                                </div>
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-black/70 backdrop-blur-sm rounded-full p-2">
                                    <HugeiconsIcon icon={ViewIcon} className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-gray-400">No preview available</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 bg-white dark:bg-gray-900">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              {doc.documentTypeLabel}
                            </p>
                            {doc.verified && (
                              <Badge variant="outline" className="mt-1 text-[10px] bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200">
                                <HugeiconsIcon icon={CheckCircleIcon} className="h-3 w-3 mr-0.5" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                      <HugeiconsIcon icon={File01Icon} className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No documents found for this verification request</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
                    <Avatar className="h-16 w-16 rounded-xl flex-shrink-0 ring-2 ring-white dark:ring-gray-900 shadow-md">
                      {displayProfile.profilePicture?.secure_url && (
                        <AvatarImage src={displayProfile.profilePicture.secure_url} alt={displayProfile.fullName} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-lg font-bold rounded-xl">
                        {getInitials(displayProfile.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {displayProfile.fullName}
                        </h3>
                        <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium capitalize", 
                          displayProfile.accountType === "organization"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        )}>
                          {displayProfile.accountType}
                        </span>
                      </div>
                      {displayUserAccount?.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{displayUserAccount.email}</p>
                      )}
                      {hasValidValue(displayProfile.organizationName) && (
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                          {displayProfile.organizationName}
                        </p>
                      )}
                      {verificationRequest && verificationRequest.daysPending && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                          <HugeiconsIcon icon={ClockIcon} className="h-3.5 w-3.5" />
                          <span>Pending for {verificationRequest.daysPending} days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {showRejectForm && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Provide a rejection reason</p>
                      </div>
                      <Textarea
                        placeholder="Explain why this verification is being rejected (required)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-red-500 dark:text-red-400">
                        This reason will be sent to the user via email and notification.
                      </p>
                    </div>
                  )}

                  {/* Profile details sections... */}
                </div>
              )}
            </>
          )}
        </div>
      </ReusableModal>

      <ImageViewerModal
        images={documents.map((doc: any, idx: number) => ({
          url: doc.secure_url,
          alt: doc.documentTypeLabel,
          label: `${doc.documentTypeLabel} (${idx + 1}/${documents.length})`,
        }))}
        currentIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        onNavigate={(newIndex) => setImageViewerIndex(newIndex)}
      />
    </>
  );
};