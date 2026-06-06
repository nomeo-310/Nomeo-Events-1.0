// newsletter-modals.tsx
import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  RefreshIcon,
  ImageIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ReusableModal, ActionModal, ConfirmModal } from "@/components/ui/reusable-modal";
import axios from "axios";
import { toast } from "sonner";

import { RichTextEditor } from "./newsletter-editor";
import { statusTone, campaignStatusTone, getInitials, formatDateTime, formatDate } from "./newsletter-types";
import type { Campaign, NewsletterSubscriber } from "@/types/newsletter";

// ─── Image URL Modal ─────────────────────────────────────────────────────────
export function ImageUrlModal({ isOpen, onClose, onInsert }: { isOpen: boolean; onClose: () => void; onInsert: (url: string) => void }) {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleDownloadAndUpload = async () => {
    if (!imageUrl) {
      toast.error("Please enter an image URL");
      return;
    }

    setUploading(true);
    toast.loading("Downloading and uploading image...");

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "image-from-url.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await axios.post("/api/admin/newsletter/images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (uploadResponse.data.success) {
        onInsert(uploadResponse.data.image.url);
        toast.dismiss();
        toast.success("Image uploaded and inserted");
        setImageUrl("");
        onClose();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Failed to process image URL:", error);
      toast.dismiss();
      toast.error("Failed to process image URL. Please try uploading the file directly.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={() => {
        setImageUrl("");
        onClose();
      }}
      onAction={handleDownloadAndUpload}
      title="Insert Image from URL"
      description="Enter the URL of an image to download and upload it to our server"
      actionLabel={uploading ? "Processing..." : "Upload & Insert"}
      cancelLabel="Cancel"
      actionVariant="primary"
      isLoading={uploading}
      size="md"
    >
      <div>
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Image URL</Label>
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <p className="text-xs text-gray-500 mt-2">
          The image will be downloaded and uploaded to our CDN for better performance and tracking.
        </p>
      </div>
    </ActionModal>
  );
}

// ─── Image Gallery Modal ─────────────────────────────────────────────────────
export function ImageGalleryModal({ isOpen, onClose, onSelectImage }: {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}) {
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/admin/newsletter/images');
      setImages(response.data.images);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/admin/newsletter/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        toast.success('Image uploaded successfully');
        fetchImages();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const SkeletonLine = ({ className }: { className?: string }) => (
    <div className={cn("rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800", className)} />
  );

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Image Gallery"
      description="Upload and manage images for your emails"
      size="xxl"
      actions={[
        { label: "Close", onClick: onClose, variant: "outline" },
        { 
          label: "Upload Image", 
          onClick: () => fileInputRef.current?.click(), 
          variant: "primary",
        },
      ]}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
      
      {uploading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
            <span>Uploading...</span>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonLine key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="py-20 text-center">
          <HugeiconsIcon icon={ImageIcon} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No images uploaded yet</p>
          <p className="text-sm text-gray-400 mt-2">Click "Upload Image" to add images</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-2">
          {images.map((image) => (
            <div
              key={image._id}
              className="relative group border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => {
                onSelectImage(image.url);
                onClose();
              }}
            >
              <img
                src={image.url}
                alt={image.alt || image.originalName}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm">Click to insert</span>
              </div>
              <div className="p-2 text-xs truncate bg-gray-50 dark:bg-gray-800">
                {image.originalName}
              </div>
            </div>
          ))}
        </div>
      )}
    </ReusableModal>
  );
}

// ─── Send to Selected Modal ──────────────────────────────────────────────────
export function SendToSelectedModal({ isOpen, onClose, onSend, selectedCount, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, content: string, type: "bulk_email" | "newsletter" | "announcement" | "promotion" | undefined) => void;
  selectedCount: number;
  isLoading: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"newsletter" | "announcement" | "promotion">("announcement");
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  const handleSend = () => {
    if (!subject) {
      toast.error("Please enter a subject");
      return;
    }
    if (!content) {
      toast.error("Please enter email content");
      return;
    }
    onSend(subject, content, type);
  };

  const handleInsertImageFromGallery = (imageUrl: string) => {
    setContent(prev => prev + `<img src="${imageUrl}" alt="Image" style="max-width:100%; height:auto; margin: 16px 0;" />`);
  };

  return (
    <>
      <ReusableModal
        isOpen={isOpen}
        onClose={onClose}
        title="Send Email to Selected Subscribers"
        description={`Send an email to ${selectedCount} selected subscriber${selectedCount !== 1 ? 's' : ''}`}
        size="xl"
        actions={[
          { label: "Cancel", onClick: onClose, variant: "outline" },
          { label: `Send to ${selectedCount} Subscriber${selectedCount !== 1 ? 's' : ''}`, onClick: handleSend, variant: "primary", loading: isLoading },
        ]}
      >
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Subject</Label>
            <Input
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Type</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white h-10 lg:h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Content</Label>
            <div className="mt-2">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your email content here..."
                onImageGalleryOpen={() => setIsImageGalleryOpen(true)}
              />
            </div>
          </div>
        </div>
      </ReusableModal>
      
      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        onSelectImage={handleInsertImageFromGallery}
      />
    </>
  );
}

// ─── View Subscriber Modal ───────────────────────────────────────────────────
export function ViewSubscriberModal({ isOpen, onClose, subscriber }: {
  isOpen: boolean;
  onClose: () => void;
  subscriber: NewsletterSubscriber | null;
}) {
  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscriber Details"
      description="Complete information about the subscriber"
      size="md"
      actions={[{ label: "Close", onClick: onClose, variant: "outline" }]}
    >
      {subscriber && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <Avatar className="h-12 w-12 rounded-full bg-blue-600">
              <AvatarFallback className="text-white font-bold bg-blue-600">
                {getInitials(subscriber.name || subscriber.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subscriber.name || "Anonymous Subscriber"}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{subscriber.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <Badge variant={statusTone[subscriber.status] ?? "secondary"} className="mt-1 capitalize">{subscriber.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Subscribed At</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(subscriber.subscribedAt)}</p>
            </div>
            {subscriber.unsubscribedAt && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unsubscribed At</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(subscriber.unsubscribedAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </ReusableModal>
  );
}

// ─── View Campaign Modal ─────────────────────────────────────────────────────
export function ViewCampaignModal({ isOpen, onClose, campaign }: {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}) {
  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Details"
      description="Complete information about the email campaign"
      size="xxl"
      actions={[{ label: "Close", onClick: onClose, variant: "outline" }]}
    >
      {campaign && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{campaign.subject}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={campaignStatusTone[campaign.status] ?? "secondary"} className="capitalize">{campaign.status}</Badge>
              <Badge variant="secondary" className="capitalize">{campaign.type}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Recipients</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{campaign.recipients.total}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
              <p className="text-xl font-bold text-green-600">{campaign.recipients.successful}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Opened</p>
              <p className="text-xl font-bold text-blue-600">{campaign.recipients.opened}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Clicked</p>
              <p className="text-xl font-bold text-amber-600">{campaign.recipients.clicked}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Email Content</h4>
            <div className="prose prose-sm max-w-none dark:prose-invert p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Created At</p>
              <p className="text-gray-900 dark:text-white">{formatDateTime(campaign.createdAt)}</p>
            </div>
            {campaign.sentAt && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sent At</p>
                <p className="text-gray-900 dark:text-white">{formatDateTime(campaign.sentAt)}</p>
              </div>
            )}
            {campaign.scheduledFor && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled For</p>
                <p className="text-gray-900 dark:text-white">{formatDateTime(campaign.scheduledFor)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </ReusableModal>
  );
}

// ─── Create Campaign Modal ───────────────────────────────────────────────────
export function CreateCampaignModal({ isOpen, onClose, onSubmit, isLoading, campaignTitle, setCampaignTitle, campaignSubject, setCampaignSubject, campaignContent, setCampaignContent, campaignType, setCampaignType, campaignScheduledFor, setCampaignScheduledFor, onImageGalleryOpen }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  campaignTitle: string;
  setCampaignTitle: (v: string) => void;
  campaignSubject: string;
  setCampaignSubject: (v: string) => void;
  campaignContent: string;
  setCampaignContent: (v: string) => void;
  campaignType: "newsletter" | "announcement" | "promotion";
  setCampaignType: (v: any) => void;
  campaignScheduledFor: Date | undefined;
  setCampaignScheduledFor: (v: Date | undefined) => void;
  onImageGalleryOpen: () => void;
}) {
  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Campaign"
      description="Create a new email campaign"
      size="xxl"
      actions={[
        { label: "Cancel", onClick: onClose, variant: "outline" },
        { label: "Save Campaign", onClick: onSubmit, variant: "primary", loading: isLoading },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Campaign Title</Label>
          <Input
            placeholder="e.g., Summer Newsletter 2024"
            value={campaignTitle}
            onChange={(e) => setCampaignTitle(e.target.value)}
            className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Subject</Label>
          <Input
            placeholder="e.g., Don't miss our summer specials!"
            value={campaignSubject}
            onChange={(e) => setCampaignSubject(e.target.value)}
            className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Campaign Type</Label>
          <Select value={campaignType} onValueChange={(v: any) => setCampaignType(v)}>
            <SelectTrigger className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={'p-1'}>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="promotion">Promotion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Schedule (Optional)</Label>
          <Popover>
            <PopoverTrigger className="w-full">
              <Button variant="outline" className="mt-1 w-full justify-start dark:border-gray-700">
                <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4" />
                {campaignScheduledFor ? format(campaignScheduledFor, "PPP p") : "Schedule for later"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={campaignScheduledFor}
                onSelect={setCampaignScheduledFor}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Content</Label>
          <div className="mt-2">
            <RichTextEditor
              content={campaignContent}
              onChange={setCampaignContent}
              placeholder="Write your email content here..."
              onImageGalleryOpen={onImageGalleryOpen}
            />
          </div>
        </div>
      </div>
    </ReusableModal>
  );
}