// components/verification-modal.tsx
"use client";

import { useState, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Cancel01Icon, 
  Loading03Icon, 
  Delete02Icon,
  Tick02Icon,
  FileRemoveIcon 
} from "@hugeicons/core-free-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequestVerification, type VerificationDocument } from "@/hooks/use-profile";
import { uploadSignedImage, deleteImage } from "@/actions/resource.action";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: "individual" | "organization";
  userId: string;
  onSuccess?: () => void;
}

export const VerificationModal = ({ isOpen, onClose, accountType, userId, onSuccess }: VerificationModalProps) => {
  const { mutate: requestVerification, isPending } = useRequestVerification();
  
  const [identityDocType, setIdentityDocType] = useState<"id_card" | "passport" | "drivers_license" | "voters_card">("id_card");
  const [uploadedDocs, setUploadedDocs] = useState<VerificationDocument[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  
  // Track which files have been uploaded to Cloudinary
  const uploadedToCloudinary = useRef<Set<string>>(new Set());

  const handleFileUpload = async (file: File, docType: VerificationDocument['documentType'], label: string) => {
    try {
      setUploadProgress(prev => ({ ...prev, [label]: true }));
      setErrors(prev => ({ ...prev, [label]: "" }));
      
      const result = await uploadSignedImage({ 
        image: file, 
        userId: userId 
      });
      
      const doc: VerificationDocument = {
        documentType: docType,
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
      
      setUploadedDocs(prev => [...prev, doc]);
      
      // Mark as uploaded to Cloudinary
      if (result.public_id) {
        uploadedToCloudinary.current.add(docType);
      }
      
    } catch (error: any) {
      console.error(`Error uploading ${label}:`, error);
      
      // Check if it's an API key error or network error (file not uploaded)
      if (error?.message?.includes('api key') || error?.message?.includes('network')) {
        setErrors(prev => ({ 
          ...prev, 
          [label]: "Upload service unavailable. Please try again later." 
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          [label]: "Failed to upload document. Please try again." 
        }));
      }
    } finally {
      setUploadProgress(prev => ({ ...prev, [label]: false }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: VerificationDocument['documentType'], label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    e.target.value = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [label]: "Only JPG, PNG, WEBP or PDF files are allowed" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [label]: "File size must be under 5MB" }));
      return;
    }

    handleFileUpload(file, docType, label);
  };

  // ✅ Updated: Deletes from Cloudinary only if it was actually uploaded
  const removeDocument = async (docType: string) => {
    const docToRemove = uploadedDocs.find(doc => doc.documentType === docType);
    
    if (!docToRemove) return;

    try {
      setDeletingDoc(docType);
      
      // Only attempt Cloudinary deletion if:
      // 1. Document has a public_id (was successfully uploaded)
      // 2. We've tracked it as uploaded to Cloudinary
      const wasUploadedToCloudinary = docToRemove.public_id && 
        uploadedToCloudinary.current.has(docType);

      if (wasUploadedToCloudinary) {
        try {
          await deleteImage(docToRemove.public_id!);
          console.log(`✅ Successfully deleted ${docType} from Cloudinary`);
          uploadedToCloudinary.current.delete(docType);
        } catch (deleteError) {
          console.error(`⚠️ Failed to delete ${docType} from Cloudinary:`, deleteError);
          // Continue to remove from state even if Cloudinary delete fails
        }
      } else {
        console.log(`ℹ️ ${docType} was not uploaded to Cloudinary, skipping deletion`);
      }
      
      // Remove from local state regardless
      setUploadedDocs(prev => prev.filter(doc => doc.documentType !== docType));
      setErrors(prev => ({ ...prev, [getErrorKey(docType)]: "" }));
      
    } catch (error) {
      console.error(`Error removing ${docType}:`, error);
      // Still remove from state
      setUploadedDocs(prev => prev.filter(doc => doc.documentType !== docType));
    } finally {
      setDeletingDoc(null);
    }
  };

  // Helper to get error key name
  const getErrorKey = (docType: string) => {
    if (['id_card', 'passport', 'drivers_license', 'voters_card'].includes(docType)) {
      return 'identityDoc';
    }
    if (docType === 'proof_of_address') return 'proofOfAddress';
    if (docType === 'cac_document') return 'cacDoc';
    return docType;
  };

  // Clear all uploaded documents
  const clearAllDocuments = async () => {
    try {
      setDeletingDoc('all');
      
      // Separate docs that were uploaded to Cloudinary vs local-only
      const cloudinaryDocs = uploadedDocs.filter(doc => 
        doc.public_id && uploadedToCloudinary.current.has(doc.documentType)
      );
      const localDocs = uploadedDocs.filter(doc => 
        !doc.public_id || !uploadedToCloudinary.current.has(doc.documentType)
      );

      console.log(`Deleting ${cloudinaryDocs.length} from Cloudinary, ${localDocs.length} local-only`);
      
      // Delete from Cloudinary in parallel
      if (cloudinaryDocs.length > 0) {
        const deletePromises = cloudinaryDocs.map(doc => 
          deleteImage(doc.public_id!)
            .then(() => {
              console.log(`✅ Deleted ${doc.documentType} from Cloudinary`);
              return { success: true, docType: doc.documentType };
            })
            .catch(error => {
              console.error(`⚠️ Failed to delete ${doc.documentType}:`, error);
              return { success: false, docType: doc.documentType, error };
            })
        );
        
        const results = await Promise.allSettled(deletePromises);
        
        // Log results
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const docType = cloudinaryDocs[index].documentType;
            if (result.value.success) {
              uploadedToCloudinary.current.delete(docType);
            }
          }
        });
      }
      
      // Clear all state regardless of Cloudinary deletion success
      setUploadedDocs([]);
      setErrors({});
      setIdentityDocType("id_card");
      uploadedToCloudinary.current.clear();
      
    } catch (error) {
      console.error('Error clearing documents:', error);
      // Still clear state even if some deletions fail
      setUploadedDocs([]);
      setErrors({});
      uploadedToCloudinary.current.clear();
    } finally {
      setDeletingDoc(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const hasIdentityDoc = uploadedDocs.some(doc => 
      ['id_card', 'passport', 'drivers_license', 'voters_card'].includes(doc.documentType)
    );
    
    const hasProofOfAddress = uploadedDocs.some(doc => doc.documentType === 'proof_of_address');
    const hasCacDoc = uploadedDocs.some(doc => doc.documentType === 'cac_document');
    
    if (!hasIdentityDoc) {
      newErrors.identityDoc = "Please upload an identity document";
    }
    
    if (!hasProofOfAddress) {
      newErrors.proofOfAddress = "Please upload proof of address";
    }
    
    if (accountType === 'organization' && !hasCacDoc) {
      newErrors.cacDoc = "Please upload CAC registration document";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Verify all required docs are uploaded to Cloudinary
    const notUploaded = uploadedDocs.filter(doc => !uploadedToCloudinary.current.has(doc.documentType));
    if (notUploaded.length > 0) {
      setErrors(prev => ({
        ...prev,
        general: "Some documents failed to upload. Please re-upload them."
      }));
      return;
    }
    
    requestVerification(uploadedDocs, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
        // Reset everything
        setUploadedDocs([]);
        setIdentityDocType("id_card");
        setErrors({});
        uploadedToCloudinary.current.clear();
      },
    });
  };

  const isDocUploaded = (type: string) => {
    return uploadedDocs.some(doc => doc.documentType === type);
  };

  const getUploadStatus = (docType: string) => {
    if (!isDocUploaded(docType)) return null;
    return uploadedToCloudinary.current.has(docType) ? 'cloudinary' : 'local';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background border border-border rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Request Account Verification
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
          Please provide the following documents to verify your account. All documents will be securely stored and reviewed by our team.
        </p>

        {/* ✅ Clear All Button */}
        {uploadedDocs.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllDocuments}
              disabled={deletingDoc === 'all'}
              className="text-xs h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50"
            >
              {deletingDoc === 'all' ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Clearing...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={FileRemoveIcon} className="w-3.5 h-3.5 mr-1.5" />
                  Clear All Documents
                </>
              )}
            </Button>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        <div className="space-y-6 mb-6">
          {/* Identity Document Upload */}
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Identity Document *</Label>
              {isDocUploaded(identityDocType) && (
                <button
                  onClick={() => removeDocument(identityDocType)}
                  disabled={deletingDoc === identityDocType || deletingDoc === 'all'}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {deletingDoc === identityDocType ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Delete02Icon} className="w-3 h-3" />
                      Remove
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <Select 
                value={identityDocType} 
                onValueChange={(value: any) => {
                  setIdentityDocType(value);
                  // Remove old identity doc if exists
                  const oldIdentity = uploadedDocs.find(doc => 
                    ['id_card', 'passport', 'drivers_license', 'voters_card'].includes(doc.documentType)
                  );
                  if (oldIdentity) {
                    removeDocument(oldIdentity.documentType);
                  }
                }}
                disabled={isDocUploaded(identityDocType)}
              >
                <SelectTrigger className="w-full h-10 lg:h-11">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_card">National ID Card</SelectItem>
                  <SelectItem value="passport">International Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="voters_card">Voter's Card</SelectItem>
                </SelectContent>
              </Select>

              {!isDocUploaded(identityDocType) ? (
                <>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileSelect(e, identityDocType, 'identityDoc')}
                      disabled={uploadProgress.identityDoc}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your selected ID document (JPG, PNG, PDF, max 5MB)
                  </p>
                  {uploadProgress.identityDoc && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </>
              ) : (
                <div className={`text-sm flex items-center gap-2 p-3 rounded-lg ${
                  getUploadStatus(identityDocType) === 'cloudinary'
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
                    : 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
                }`}>
                  <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4" />
                  <div>
                    <span className="font-medium">
                      {identityDocType.replace('_', ' ').toUpperCase()} uploaded
                    </span>
                    {getUploadStatus(identityDocType) === 'local' && (
                      <span className="text-xs block opacity-75">
                        File selected locally - will be uploaded on submit
                      </span>
                    )}
                  </div>
                </div>
              )}
              {errors.identityDoc && <p className="text-xs text-red-500">{errors.identityDoc}</p>}
            </div>
          </div>

          {/* Proof of Address Upload */}
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Proof of Address *</Label>
              {isDocUploaded('proof_of_address') && (
                <button
                  onClick={() => removeDocument('proof_of_address')}
                  disabled={deletingDoc === 'proof_of_address' || deletingDoc === 'all'}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {deletingDoc === 'proof_of_address' ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Delete02Icon} className="w-3 h-3" />
                      Remove
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {!isDocUploaded('proof_of_address') ? (
                <>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect(e, 'proof_of_address', 'proofOfAddress')}
                    disabled={uploadProgress.proofOfAddress}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload recent utility bill, bank statement, or government letter (issued within last 3 months)
                  </p>
                  {uploadProgress.proofOfAddress && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </>
              ) : (
                <div className={`text-sm flex items-center gap-2 p-3 rounded-lg ${
                  getUploadStatus('proof_of_address') === 'cloudinary'
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
                    : 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
                }`}>
                  <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4" />
                  <div>
                    <span className="font-medium">Proof of address uploaded</span>
                    {getUploadStatus('proof_of_address') === 'local' && (
                      <span className="text-xs block opacity-75">
                        File selected locally - will be uploaded on submit
                      </span>
                    )}
                  </div>
                </div>
              )}
              {errors.proofOfAddress && <p className="text-xs text-red-500">{errors.proofOfAddress}</p>}
            </div>
          </div>

          {/* CAC Document for Organizations */}
          {accountType === 'organization' && (
            <div className="space-y-3 p-4 border border-border rounded-lg">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">CAC Registration Document *</Label>
                {isDocUploaded('cac_document') && (
                  <button
                    onClick={() => removeDocument('cac_document')}
                    disabled={deletingDoc === 'cac_document' || deletingDoc === 'all'}
                    className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {deletingDoc === 'cac_document' ? (
                      <>
                        <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Delete02Icon} className="w-3 h-3" />
                        Remove
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {!isDocUploaded('cac_document') ? (
                  <>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileSelect(e, 'cac_document', 'cacDoc')}
                      disabled={uploadProgress.cacDoc}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your CAC registration certificate (JPG, PNG, PDF, max 5MB)
                    </p>
                    {uploadProgress.cacDoc && (
                      <div className="text-xs text-blue-600 flex items-center gap-1">
                        <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`text-sm flex items-center gap-2 p-3 rounded-lg ${
                    getUploadStatus('cac_document') === 'cloudinary'
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
                      : 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
                  }`}>
                    <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4" />
                    <div>
                      <span className="font-medium">CAC document uploaded</span>
                      {getUploadStatus('cac_document') === 'local' && (
                        <span className="text-xs block opacity-75">
                          File selected locally - will be uploaded on submit
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {errors.cacDoc && <p className="text-xs text-red-500">{errors.cacDoc}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending || deletingDoc !== null}
            className="flex-1 h-10 lg:h-11"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || Object.values(uploadProgress).some(Boolean) || deletingDoc !== null}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-10 lg:h-11"
          >
            {isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Verification Request"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};