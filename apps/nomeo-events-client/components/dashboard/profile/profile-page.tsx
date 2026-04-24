"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMyProfile, useUpdateProfile, useUpdateProfileSlug, useRequestVerification, useProfileCompletion, useProfileHeader, useProfileVerificationStatus } from "@/hooks/use-profile";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon, UserGroup03Icon, SaveIcon, CheckmarkCircle02Icon, CancelCircleIcon, AlertCircleIcon, Globe02Icon, Calendar03Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { BaseProfile } from "@/types/profile-type";
import { uploadImage } from "@/lib/upload-image";
import { BasicInfoTab } from "./basic-info-tab";
import { OrganizationTab } from "./organization-tab";
import { ProfessionalTab } from "./professional-tab";
import { ContactTab } from "./contact-tab";
import { SocialTab } from "./social-tab";
import { PaymentTab } from "./payment-tab";
import { VisibilityTab } from "./visibility-tab";
import { ImageGuidanceNote } from "./image-guidance-note";
import { CoverImageUpload } from "./cover-image-upload";
import { ProfileImageUpload } from "./profile-image-upload";
import { MobileAccordion } from "./mobile-accordion";
import { MobileTabBar } from "./mobile-tab-bar";
import { VerificationModal } from "./verification-modal";
import { VerificationTab } from "./verification-tab";

const TABS = [
  { id: "basic", label: "Basic Information", mobileLabel: "Basic" },
  { id: "organization", label: "Organization", mobileLabel: "Org" },
  { id: "professional", label: "Professional", mobileLabel: "Pro" },
  { id: "contact", label: "Contact & Location", mobileLabel: "Contact" },
  { id: "social", label: "Social Media", mobileLabel: "Social" },
  { id: "payment", label: "Payment Details", mobileLabel: "Payment" },
  { id: "visibility", label: "Visibility", mobileLabel: "Visibility" },
  { id: "verification", label: "Verification", mobileLabel: "Verify" },
] as const;

type TabId = typeof TABS[number]["id"];

const ProfilePage = () => {
  const router = useRouter();
  
  const { data: profile, isLoading: profileLoading, refetch } = useMyProfile();
  const { percentage: completionPercentage, incompleteItems } = useProfileCompletion();
  const { isVerified, isPending: verificationPending, isRejected: verificationRejected } = useProfileVerificationStatus();
  const { name, avatar, coverImage } = useProfileHeader();
  
  const updateProfile = useUpdateProfile();
  const updateSlug = useUpdateProfileSlug();
  const requestVerification = useRequestVerification();
  
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [formData, setFormData] = useState<Partial<BaseProfile>>({});
  const [uploadingImage, setUploadingImage] = useState<"profile" | "cover" | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [slugEditMode, setSlugEditMode] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [openAccordions, setOpenAccordions] = useState<Record<TabId, boolean>>({
    basic: true,
    organization: false,
    professional: false,
    contact: false,
    social: false,
    payment: false,
    visibility: false,
    verification: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        ...profile,
        contact: profile.contact || { phoneNumber: '', email: '' },
        location: profile.location || { state: '', city: '', address: '', country: 'Nigeria' },
        publicProfile: profile.publicProfile || { slug: '', showEmail: false, showPhone: false, showLocation: true },
        accountDetails: profile.accountDetails || {},
      });
      setNewSlug(profile.publicProfile?.slug || "");
    }
  }, [profile]);

  const handleImageUploadToCloudinary = async (file: File, type: "profile" | "cover") => {
    const cloudinaryData = await uploadImage({
      image: file,
      uploadPreset: type === "profile" ? "nomeo_events_profile" : "nomeo_events_cover",
    });

    if (!cloudinaryData?.secure_url || !cloudinaryData?.public_id) {
      throw new Error('Failed to upload image: Missing Cloudinary data');
    }

    return cloudinaryData;
  };

  const handleImageUpload = async (file: File, type: "profile" | "cover") => {
    try {
      setUploadingImage(type);
      
      const cloudinaryData = await handleImageUploadToCloudinary(file, type);
      
      if (type === "profile") {
        await updateProfile.mutateAsync({
          profilePicture: {
            secure_url: cloudinaryData.secure_url,
            public_id: cloudinaryData.public_id,
          }
        });
      } else {
        await updateProfile.mutateAsync({
          coverPicture: {
            secure_url: cloudinaryData.secure_url,
            public_id: cloudinaryData.public_id,
          }
        });
      }
      
      await refetch();
      toast.success(`${type === "profile" ? "Profile picture" : "Cover picture"} updated successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type} picture`);
      throw error;
    } finally {
      setUploadingImage(null);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof BaseProfile] as any),
        [field]: value,
      },
    }));
  };

  const handleDeepNestedChange = (parent: string, child: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof BaseProfile] as any),
        [child]: {
          ...((prev[parent as keyof BaseProfile] as any)?.[child] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      await refetch();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to update profile");
    }
  };

  const handleSlugUpdate = async () => {
    if (!newSlug.trim()) {
      toast.error("Slug cannot be empty");
      return;
    }
    
    try {
      await updateSlug.mutateAsync(newSlug);
      setSlugEditMode(false);
      await refetch();
      toast.success("Profile URL updated successfully");
    } catch (error: any) {
      // Error is already handled in the hook
    }
  };

  const handleVerificationRequest = async () => {
    try {
      await requestVerification.mutateAsync();
      setShowVerificationModal(false);
      await refetch();
      toast.success("Verification request submitted");
    } catch (error: any) {
      // Error is already handled in the hook
    }
  };

  const toggleAccordion = (tabId: TabId) => {
    setOpenAccordions(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const handleMobileTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setOpenAccordions(prev => ({
      basic: false,
      organization: false,
      professional: false,
      contact: false,
      social: false,
      payment: false,
      visibility: false,
      verification: false,
      [tabId]: true
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        ...profile,
        contact: profile.contact || { phoneNumber: '', email: '' },
        location: profile.location || { state: '', city: '', address: '', country: 'Nigeria' },
        publicProfile: profile.publicProfile || { slug: '', showEmail: false, showPhone: false, showLocation: true },
        accountDetails: profile.accountDetails || {},
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HugeiconsIcon icon={Loading03Icon} className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
        <div className="text-center">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">No Profile Found</h2>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">Please complete your registration to set up your profile.</p>
          <button
            onClick={() => router.push("/profile/setup")}
            className="px-4 sm:px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition text-sm sm:text-base"
          >
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = (tabId: TabId) => {
    switch(tabId) {
      case "basic":
        return (
          <BasicInfoTab
            fullName={formData.fullName || ""}
            displayName={formData.displayName || ""}
            bio={formData.bio || ""}
            shortBio={formData.shortBio || ""}
            onFullNameChange={(value) => handleInputChange("fullName", value)}
            onDisplayNameChange={(value) => handleInputChange("displayName", value)}
            onBioChange={(value) => handleInputChange("bio", value)}
            onShortBioChange={(value) => handleInputChange("shortBio", value)}
          />
        );
      case "organization":
        return (
          <OrganizationTab
            accountType={formData.accountType || "individual"}
            organizationName={formData.organizationName || ""}
            organizationType={formData.organizationType || ""}
            organizationRegistrationNumber={formData.organizationRegistrationNumber || ""}
            taxId={formData.taxId || ""}
            onAccountTypeChange={(value) => handleInputChange("accountType", value)}
            onOrganizationNameChange={(value) => handleInputChange("organizationName", value)}
            onOrganizationTypeChange={(value) => handleInputChange("organizationType", value)}
            onRegistrationNumberChange={(value) => handleInputChange("organizationRegistrationNumber", value)}
            onTaxIdChange={(value) => handleInputChange("taxId", value)}
          />
        );
      case "professional":
        return (
          <ProfessionalTab
            specialties={formData.specialties || []}
            yearsOfExperience={formData.yearsOfExperience || 0}
            onSpecialtiesChange={(value) => handleInputChange("specialties", value)}
            onYearsChange={(value) => handleInputChange("yearsOfExperience", value)}
          />
        );
      case "contact":
        return (
          <ContactTab
            phoneNumber={formData.contact?.phoneNumber || ""}
            email={formData.contact?.email || ""}
            officeNumber={formData.contact?.officeNumber || ""}
            supportEmail={formData.contact?.supportEmail || ""}
            address={formData.location?.address || ""}
            city={formData.location?.city || ""}
            state={formData.location?.state || ""}
            postalCode={formData.location?.postalCode || ""}
            country={formData.location?.country || "Nigeria"}
            onPhoneChange={(value) => handleNestedChange("contact", "phoneNumber", value)}
            onEmailChange={(value) => handleNestedChange("contact", "email", value)}
            onOfficeNumberChange={(value) => handleNestedChange("contact", "officeNumber", value)}
            onSupportEmailChange={(value) => handleNestedChange("contact", "supportEmail", value)}
            onAddressChange={(value) => handleNestedChange("location", "address", value)}
            onCityChange={(value) => handleNestedChange("location", "city", value)}
            onStateChange={(value) => handleNestedChange("location", "state", value)}
            onPostalCodeChange={(value) => handleNestedChange("location", "postalCode", value)}
            onCountryChange={(value) => handleNestedChange("location", "country", value)}
          />
        );
      case "social":
        return (
          <SocialTab
            website={formData.contact?.website || ""}
            facebook={formData.contact?.socialMedia?.facebook || ""}
            instagram={formData.contact?.socialMedia?.instagram || ""}
            twitter={formData.contact?.socialMedia?.twitter || ""}
            linkedin={formData.contact?.socialMedia?.linkedin || ""}
            youtube={formData.contact?.socialMedia?.youtube || ""}
            tiktok={formData.contact?.socialMedia?.tiktok || ""}
            threads={formData.contact?.socialMedia?.threads || ""}
            whatsApp={formData.contact?.socialMedia?.whatsApp || ""}
            onWebsiteChange={(value) => handleNestedChange("contact", "website", value)}
            onFacebookChange={(value) => handleDeepNestedChange("contact", "socialMedia", "facebook", value)}
            onInstagramChange={(value) => handleDeepNestedChange("contact", "socialMedia", "instagram", value)}
            onTwitterChange={(value) => handleDeepNestedChange("contact", "socialMedia", "twitter", value)}
            onLinkedinChange={(value) => handleDeepNestedChange("contact", "socialMedia", "linkedin", value)}
            onYoutubeChange={(value) => handleDeepNestedChange("contact", "socialMedia", "youtube", value)}
            onTiktokChange={(value) => handleDeepNestedChange("contact", "socialMedia", "tiktok", value)}
            onThreadsChange={(value) => handleDeepNestedChange("contact", "socialMedia", "threads", value)}
            onWhatsAppChange={(value) => handleDeepNestedChange("contact", "socialMedia", "whatsApp", value)}
          />
        );
      case "payment":
        return (
          <PaymentTab
            paymentMethod={formData.paymentMethod || "manual"}
            bankName={formData.accountDetails?.bankName || ""}
            accountName={formData.accountDetails?.accountName || ""}
            accountNumber={formData.accountDetails?.accountNumber || ""}
            bankCode={formData.accountDetails?.bankCode || ""}
            routingNumber={formData.accountDetails?.routingNumber || ""}
            swiftCode={formData.accountDetails?.swiftCode || ""}
            currency={formData.accountDetails?.currency || "NGN"}
            onPaymentMethodChange={(value) => handleInputChange("paymentMethod", value)}
            onBankNameChange={(value) => handleNestedChange("accountDetails", "bankName", value)}
            onAccountNameChange={(value) => handleNestedChange("accountDetails", "accountName", value)}
            onAccountNumberChange={(value) => handleNestedChange("accountDetails", "accountNumber", value)}
            onBankCodeChange={(value) => handleNestedChange("accountDetails", "bankCode", value)}
            onRoutingNumberChange={(value) => handleNestedChange("accountDetails", "routingNumber", value)}
            onSwiftCodeChange={(value) => handleNestedChange("accountDetails", "swiftCode", value)}
            onCurrencyChange={(value) => handleNestedChange("accountDetails", "currency", value)}
          />
        );
      case "visibility":
        return (
          <VisibilityTab
            seoTitle={formData.publicProfile?.seoTitle || ""}
            seoDescription={formData.publicProfile?.seoDescription || ""}
            showEmail={formData.publicProfile?.showEmail || false}
            showPhone={formData.publicProfile?.showPhone || false}
            showLocation={formData.publicProfile?.showLocation !== false}
            onSeoTitleChange={(value) => handleNestedChange("publicProfile", "seoTitle", value)}
            onSeoDescriptionChange={(value) => handleNestedChange("publicProfile", "seoDescription", value)}
            onShowEmailChange={(value) => handleNestedChange("publicProfile", "showEmail", value)}
            onShowPhoneChange={(value) => handleNestedChange("publicProfile", "showPhone", value)}
            onShowLocationChange={(value) => handleNestedChange("publicProfile", "showLocation", value)}
          />
        );
      case "verification":
        return (
          <VerificationTab
            isVerified={isVerified}
            isPending={verificationPending}
            isRejected={verificationRejected}
            onStartVerification={() => setShowVerificationModal(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="w-full pt-4">
        <ImageGuidanceNote />
      </div>

      <CoverImageUpload
        currentImage={coverImage}
        onImageUpload={(file) => handleImageUpload(file, "cover")}
        isUploading={uploadingImage === "cover"}
        canUpload={true}
      />

      <div className="w-full">
        <div className="relative">
          <div className="absolute -translate-y-1/2 left-0 md:left-10 z-20">
            <ProfileImageUpload
              currentImage={avatar}
              onImageUpload={(file) => handleImageUpload(file, "profile")}
              isUploading={uploadingImage === "profile"}
              label={name?.charAt(0) || "P"}
              canUpload={true}
            />
          </div>
        </div>
      </div>

      <div className="w-full pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="bg-background rounded-xl border border-border p-4 sm:p-6 mb-4 sm:mb-6 mt-6 sm:mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{name}</h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 text-xs font-medium rounded-full">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3 h-3" />
                    Verified
                  </span>
                ) : verificationPending ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                    <HugeiconsIcon icon={AlertCircleIcon} className="w-3 h-3" />
                    Pending
                  </span>
                ) : verificationRejected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                    <HugeiconsIcon icon={CancelCircleIcon} className="w-3 h-3" />
                    Rejected
                  </span>
                ) : null}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                  profile.accountType === "organization" 
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200" 
                    : "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                }`}>
                  {profile.accountType === "organization" ? "Organization" : "Individual"}
                </span>
                {profile.organizationType && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-foreground">
                    {profile.organizationType}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <HugeiconsIcon icon={Globe02Icon} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                {slugEditMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="px-2 py-1 border border-border rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-background text-foreground"
                      placeholder="your-profile-slug"
                    />
                    <button
                      onClick={handleSlugUpdate}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setSlugEditMode(false);
                        setNewSlug(profile.publicProfile?.slug || "");
                      }}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="break-all">yourdomain.com/@{profile.publicProfile?.slug || "not-set"}</span>
                    <button
                      onClick={() => setSlugEditMode(true)}
                      className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-xs flex-shrink-0"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar03Icon} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{profile.totalEvents || 0} Events</span>
                </div>
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={UserGroup03Icon} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{profile.totalAttendees || 0} Attendees</span>
                </div>
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={StarIcon} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{profile.averageRating?.toFixed(1) || 0} ★ ({profile.totalReviews || 0})</span>
                </div>
              </div>
            </div>

            <div className="bg-violet-50 dark:bg-violet-950 rounded-lg p-3 sm:p-4 text-center w-full md:w-auto min-w-[120px] sm:min-w-[150px]">
              <div className="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400">{completionPercentage}%</div>
              <div className="text-xs text-muted-foreground">Profile Complete</div>
              {incompleteItems.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {incompleteItems.length} items remaining
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="border-b border-border overflow-x-auto">
              <nav className="flex px-4 gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap
                      ${activeTab === tab.id
                        ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {renderTabContent(activeTab)}
              
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {updateProfile.isPending ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={SaveIcon} className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden w-full">
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            {TABS.map((tab) => (
              <MobileAccordion
                key={tab.id}
                tab={tab}
                isOpen={openAccordions[tab.id]}
                onToggle={() => toggleAccordion(tab.id)}
              >
                {renderTabContent(tab.id)}
              </MobileAccordion>
            ))}
            
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-foreground bg-background border border-border rounded-lg hover:bg-muted transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="px-4 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {updateProfile.isPending ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={SaveIcon} className="w-3 h-3" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileTabBar 
        activeTab={activeTab}
        onTabChange={handleMobileTabChange}
      />

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationRequest}
        isPending={requestVerification.isPending}
      />
    </div>
  );
};

export default ProfilePage;