"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  File01Icon,
  FilterHorizontalIcon,
  MoreHorizontalCircle01Icon,
  RefreshIcon,
  Search01Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
  Delete01Icon,
  AddCircleIcon,
  SentIcon as SendIcon,
  UploadIcon,
  DownloadIcon,
  UserMultiple02Icon as UsersIcon,
  Mail01Icon as EnvelopeIcon,
  ImageIcon,
  FileSpreadsheetIcon,
  UserAddIcon,
  TextBoldIcon as Bold01Icon,
  TextItalicIcon as Italic01Icon,
  TextUnderlineIcon as Underline01Icon,
  TextAlignLeftIcon as AlignLeft01Icon,
  TextAlignCenterIcon as AlignCenter01Icon,
  TextAlignRightIcon as AlignRight01Icon,
  LeftToRightListNumberIcon as ListOrderedIcon,
  LeftToRightListDashIcon as ListUnorderedIcon,
  Link02Icon,
  Image01Icon,
  CodeIcon,
  QuoteDownIcon as QuoteIcon,
  EraserIcon,
  RedoIcon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { ReusableModal, ConfirmModal, ActionModal } from "@/components/ui/reusable-modal";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Import hooks
import {
  useSubscribers,
  useDeleteSubscriber,
  useBulkSubscriberAction,
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useSendCampaign,
  useExportSubscribers,
  useImportSubscribers,
  useNewsletterStats,
} from "@/hooks/use-newsletter";

// Import WYSIWYG Editor
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Blockquote } from '@tiptap/extension-blockquote';
import { HardBreak } from '@tiptap/extension-hard-break';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';

import { useQueryClient } from "@tanstack/react-query";
import { Campaign, NewsletterSubscriber } from "@/types/newsletter";
import axios from "axios";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type HugeIcon = typeof ViewIcon;

interface DropdownItem {
  label: string;
  icon: HugeIcon;
  onClick: () => void;
  danger?: boolean;
}

interface BulkEmailRecipient {
  email: string;
  name?: string;
}

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipient: BulkEmailRecipient) => void;
  currentCount: number;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy");
}

function formatDateTime(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

function getInitials(name?: string, fallback = "S") {
  if (!name) return fallback;
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  return (
    trimmed
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || fallback
  );
}

// ─── BADGE CONFIGS ────────────────────────────────────────────────────────────

const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  unsubscribed: "secondary",
  bounced: "destructive",
  complained: "outline",
};

const campaignStatusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  completed: "default",
  failed: "destructive",
  cancelled: "secondary",
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
        className
      )}
    />
  );
}

function NewsletterSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-6">
        <SkeletonLine className="h-10 flex-1" />
        <SkeletonLine className="h-10 w-36" />
        <SkeletonLine className="h-10 w-36" />
      </div>
      <div className="flex gap-4 px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <SkeletonLine className="h-3 w-3" />
        <SkeletonLine className="h-3 w-32" />
        <SkeletonLine className="h-3 w-40" />
        <SkeletonLine className="h-3 w-28" />
        <SkeletonLine className="h-3 w-24 ml-auto" />
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <SkeletonLine className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1">
            <SkeletonLine className="h-3 w-48" />
            <SkeletonLine className="h-2 w-32" />
          </div>
          <SkeletonLine className="h-5 w-20 rounded-full" />
          <SkeletonLine className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="mt-2 h-7 w-32" />
          <SkeletonLine className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── TAB BUTTON ──────────────────────────────────────────────────────────────

function TabButton({ label, count, isActive, onClick }: { label: string; count?: number; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn("ml-2 px-2 py-0.5 text-xs rounded-full", isActive ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400")}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── ACTION DROPDOWN ─────────────────────────────────────────────────────────

function ActionDropdown({ items, trigger }: { items: (DropdownItem | { divider: true; section?: string })[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuWidth = 224;

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= 300 || spaceBelow >= rect.top ? rect.bottom + 6 : rect.top - 300 - 6;
    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} onClick={(e) => { e.stopPropagation(); if (!open) updateCoords(); setOpen((p) => !p); }}>
        {trigger}
      </div>
      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
          style={{ top: coords.top, left: coords.left, width: menuWidth, boxShadow: "0 4px 24px -4px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08)" }}
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          {items.map((item, i) => {
            if ("divider" in item && item.divider) {
              return item.section
                ? <p key={i} className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{item.section}</p>
                : <div key={i} className="my-1 border-t border-gray-100 dark:border-gray-800" />;
            }
            const { label, icon: Icon, onClick, danger } = item as DropdownItem;
            return (
              <button key={i} type="button" onClick={onClick}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  danger ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                         : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800")}
              >
                <HugeiconsIcon icon={Icon} className={cn("h-3.5 w-3.5 flex-shrink-0", danger ? "text-red-500" : "text-gray-400 dark:text-gray-500")} />
                {label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("mt-1 text-xl font-bold", accent ?? "text-gray-900 dark:text-white")}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── ADD RECIPIENT MODAL ──────────────────────────────────────────────────────

function AddRecipientModal({ isOpen, onClose, onAdd, currentCount }: AddRecipientModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address");
      return;
    }
    onAdd({ email, name: name || undefined });
    setEmail("");
    setName("");
    onClose();
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={() => {
        setEmail("");
        setName("");
        onClose();
      }}
      onAction={handleSubmit}
      title="Add Recipient"
      description={`Add a single recipient (${currentCount}/5 max before using CSV)`}
      actionLabel="Add Recipient"
      cancelLabel="Cancel"
      actionVariant="primary"
      size="md"
    >
      <div className="space-y-4">
        {currentCount >= 5 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              You've reached the maximum of 5 manual entries. Please use CSV upload for more recipients.
            </p>
          </div>
        )}
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address *</Label>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            disabled={currentCount >= 5}
          />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name (Optional)</Label>
          <Input
            placeholder="Recipient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            disabled={currentCount >= 5}
          />
        </div>
      </div>
    </ActionModal>
  );
}

// ─── IMAGE URL MODAL ─────────────────────────────────────────────────────────

function ImageUrlModal({ isOpen, onClose, onInsert }: { isOpen: boolean; onClose: () => void; onInsert: (url: string) => void }) {
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
      // First, download the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "image-from-url.jpg", { type: blob.type });

      // Upload to your server
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

// ─── ENHANCED WYSIWYG EDITOR ─────────────────────────────────────────────────

function RichTextEditor({ content, onChange, placeholder, onImageGalleryOpen }: { 
  content: string; 
  onChange: (content: string) => void; 
  placeholder?: string;
  onImageGalleryOpen?: () => void;
}) {
  const [isImageUrlModalOpen, setIsImageUrlModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlock,
      Blockquote,
      HardBreak,
      HorizontalRule,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-2',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your email content here...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none min-h-[300px] p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white [&_.is-editor-empty]:text-gray-400 [&_.is-editor-empty]:dark:text-gray-600',
      },
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      toast.loading('Uploading image...');
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('/api/admin/newsletter/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success && editor) {
          editor.chain().focus().setImage({ 
            src: response.data.image.url,
            alt: response.data.image.alt 
          }).run();
          toast.dismiss();
          toast.success('Image uploaded successfully');
        } else {
          toast.dismiss();
          toast.error('Failed to upload image');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.dismiss();
        toast.error('Failed to upload image');
      }
    };
    input.click();
  };

  if (!editor) {
    return <div className="h-[300px] border rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />;
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 p-2 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
          {/* Undo/Redo */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="text-sm">
            <HugeiconsIcon icon={UndoIcon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="text-sm">
            <HugeiconsIcon icon={RedoIcon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Text Formatting */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={Bold01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={Italic01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={Underline01Icon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Headings */}
          <Select onValueChange={(value) => {
            if (value === 'paragraph') editor.chain().focus().setParagraph().run();
            else if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
          }} value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' : 'paragraph'
          }>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Lists */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={ListUnorderedIcon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={ListOrderedIcon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Alignment */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={AlignLeft01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={AlignCenter01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={AlignRight01Icon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Blocks */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={QuoteIcon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''}>
            <HugeiconsIcon icon={CodeIcon} className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Links & Images */}
          <Button type="button" size="sm" variant="ghost" onClick={() => {
            const url = prompt('Enter URL:');
            if (url && editor) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}>
            <HugeiconsIcon icon={Link02Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleImageUpload}>
            <HugeiconsIcon icon={Image01Icon} className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsImageUrlModalOpen(true)}>
            <HugeiconsIcon icon={Image01Icon} className="h-4 w-4" />
            <span className="text-xs ml-1">URL</span>
          </Button>
          {onImageGalleryOpen && (
            <Button type="button" size="sm" variant="ghost" onClick={onImageGalleryOpen}>
              <HugeiconsIcon icon={ImageIcon} className="h-4 w-4" />
              <span className="text-xs ml-1">Gallery</span>
            </Button>
          )}
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Clear Formatting */}
          <Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <HugeiconsIcon icon={EraserIcon} className="h-4 w-4" />
          </Button>
        </div>
        <EditorContent editor={editor} />
      </div>
      
      <ImageUrlModal
        isOpen={isImageUrlModalOpen}
        onClose={() => setIsImageUrlModalOpen(false)}
        onInsert={(url) => {
          if (editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
      />
    </>
  );
}

// ─── SUBSCRIBERS TABLE ────────────────────────────────────────────────────────

function SubscribersTable({ subscribers, selectedSubscribers, onSelectAll, onToggleSelect, onView, onUnsubscribe, onDelete }: {
  subscribers: NewsletterSubscriber[];
  selectedSubscribers: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onView: (subscriber: NewsletterSubscriber) => void;
  onUnsubscribe: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-12 pl-4">
            <Checkbox checked={selectedSubscribers.size === subscribers.length && subscribers.length > 0} onCheckedChange={onSelectAll} />
          </TableHead>
          <TableHead className="w-[35%]">Subscriber</TableHead>
          <TableHead className="w-[30%]">Email</TableHead>
          <TableHead className="w-[15%]">Status</TableHead>
          <TableHead className="w-[15%]">Subscribed</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscribers.map((subscriber) => (
          <TableRow key={subscriber._id} className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
            <TableCell className="pl-4">
              <Checkbox checked={selectedSubscribers.has(subscriber._id)} onCheckedChange={() => onToggleSelect(subscriber._id)} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 rounded-full bg-blue-600">
                  <AvatarFallback className="text-white text-xs font-bold bg-blue-600">
                    {getInitials(subscriber.name || subscriber.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {subscriber.name || 'Anonymous Subscriber'}
                  </p>
                  {subscriber.userId && (
                    <p className="text-xs text-gray-400">Registered User</p>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{subscriber.email}</p>
            </TableCell>
            <TableCell>
              <Badge variant={statusTone[subscriber.status] ?? "secondary"} className="gap-1 capitalize">
                {subscriber.status}
              </Badge>
            </TableCell>
            <TableCell>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(subscriber.subscribedAt)}</p>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => onView(subscriber)} className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" title="View">
                  <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                <ActionDropdown
                  trigger={
                    <button className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                      <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  }
                  items={[
                    { label: "View Details", icon: ViewIcon, onClick: () => onView(subscriber) },
                    { divider: true } as const,
                    subscriber.status === "active"
                      ? { label: "Unsubscribe", icon: BanIcon, onClick: () => onUnsubscribe(subscriber._id) }
                      : { label: "Resubscribe", icon: CheckCircleIcon, onClick: () => onUnsubscribe(subscriber._id) },
                    { divider: true, section: "Danger" } as const,
                    { label: "Delete Permanently", icon: Delete01Icon, onClick: () => onDelete(subscriber._id), danger: true },
                  ]}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── BULK RECIPIENTS TABLE ────────────────────────────────────────────────────

function BulkRecipientsTable({ recipients, onRemove }: {
  recipients: BulkEmailRecipient[];
  onRemove: (index: number) => void;
}) {
  if (recipients.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
          <TableRow>
            <TableHead className="w-[40%]">Email</TableHead>
            <TableHead className="w-[55%]">Name</TableHead>
            <TableHead className="w-16 text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((recipient, index) => (
            <TableRow key={index}>
              <TableCell className="text-sm">{recipient.email}</TableCell>
              <TableCell className="text-sm">{recipient.name || '-'}</TableCell>
              <TableCell className="text-center">
                <button
                  onClick={() => onRemove(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── CAMPAIGNS TABLE ──────────────────────────────────────────────────────────

function CampaignsTable({ campaigns, onView, onDelete, onSend }: {
  campaigns: Campaign[];
  onView: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-[40%]">Campaign</TableHead>
          <TableHead className="w-[15%]">Type</TableHead>
          <TableHead className="w-[15%]">Status</TableHead>
          <TableHead className="w-[10%]">Recipients</TableHead>
          <TableHead className="w-[15%]">Sent</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign._id} className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
            <TableCell>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{campaign.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">{campaign.subject}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">{campaign.type}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={campaignStatusTone[campaign.status] ?? "secondary"} className="capitalize">
                {campaign.status}
              </Badge>
            </TableCell>
            <TableCell>
              <p className="text-sm text-gray-600 dark:text-gray-400">{campaign.recipients.total}</p>
            </TableCell>
            <TableCell>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {campaign.sentAt ? formatDate(campaign.sentAt) : 'Not sent'}
              </p>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => onView(campaign)} className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" title="View">
                  <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                <ActionDropdown
                  trigger={
                    <button className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                      <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  }
                  items={[
                    { label: "View Details", icon: ViewIcon, onClick: () => onView(campaign) },
                    ...(campaign.status === "draft" ? [
                      { label: "Send Now", icon: SendIcon, onClick: () => onSend(campaign._id) }
                    ] : []),
                    { divider: true, section: "Danger" } as const,
                    { label: "Delete", icon: Delete01Icon, onClick: () => onDelete(campaign._id), danger: true },
                  ]}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── IMAGE GALLERY MODAL ─────────────────────────────────────────────────────

function ImageGalleryModal({ isOpen, onClose, onSelectImage }: {
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

// ─── SEND TO SELECTED MODAL ──────────────────────────────────────────────────

function SendToSelectedModal({ isOpen, onClose, onSend, selectedCount, isLoading }: {
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

type MainTab = "subscribers" | "bulk-email" | "campaigns" | "analytics";
type SubscriberTab = "active" | "unsubscribed";

export default function NewsletterPage() {
  const queryClient = useQueryClient();

  // UI State
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("subscribers");
  const [activeSubTab, setActiveSubTab] = useState<SubscriberTab>("active");
  
  // Subscribers state
  const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Bulk email state
  const [bulkRecipients, setBulkRecipients] = useState<BulkEmailRecipient[]>([]);
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailContent, setBulkEmailContent] = useState("");
  const [bulkEmailType, setBulkEmailType] = useState<"newsletter" | "announcement" | "promotion">("announcement");
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [isAddRecipientModalOpen, setIsAddRecipientModalOpen] = useState(false);
  
  // Send to selected state
  const [isSendToSelectedModalOpen, setIsSendToSelectedModalOpen] = useState(false);
  const [isSendingToSelected, setIsSendingToSelected] = useState(false);
  
  // Campaigns state
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("all");
  
  // Modal states
  const [selectedSubscriber, setSelectedSubscriber] = useState<NewsletterSubscriber | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isViewSubscriberModalOpen, setIsViewSubscriberModalOpen] = useState(false);
  const [isViewCampaignModalOpen, setIsViewCampaignModalOpen] = useState(false);
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'subscriber' | 'campaign' } | null>(null);
  
  // Campaign form state
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [campaignType, setCampaignType] = useState<"newsletter" | "announcement" | "promotion">("newsletter");
  const [campaignScheduledFor, setCampaignScheduledFor] = useState<Date | undefined>();
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on tab change
  useEffect(() => {
    setCurrentPage(1);
    setCampaignsPage(1);
    setSelectedSubscribers(new Set());
  }, [activeMainTab, activeSubTab, campaignStatusFilter]);

  // Query params
  const statusFilter = activeSubTab === "active" ? "active" : "unsubscribed";

  const { data: subscribersData, isLoading: subscribersLoading, refetch: refetchSubscribers, isFetching: isSubscribersFetching } = useSubscribers({
    page: currentPage,
    limit: 20,
    status: statusFilter,
    search: debouncedSearch || undefined,
  });

  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns, isFetching: isCampaignsFetching } = useCampaigns({
    page: campaignsPage,
    limit: 20,
    status: campaignStatusFilter !== "all" ? campaignStatusFilter : undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useNewsletterStats(30);

  const subscribers: NewsletterSubscriber[] = subscribersData?.subscribers || [];
  const pagination = subscribersData?.pagination;
  const campaigns = campaignsData?.campaigns || [];
  const campaignsPagination = campaignsData?.pagination;
  const stats = statsData;

  // Mutations
  const deleteSubscriber = useDeleteSubscriber();
  const bulkAction = useBulkSubscriberAction();
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();
  const importSubscribers = useImportSubscribers();
  const exportSubscribers = useExportSubscribers();

  const hasFilters = !!(debouncedSearch);

  // Bulk email handlers
  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].toLowerCase().split(',');
    
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const nameIndex = headers.findIndex(h => h.includes('name'));
    
    if (emailIndex === -1) {
      toast.error('CSV must have an email column');
      return;
    }

    const recipients: BulkEmailRecipient[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values[emailIndex] && values[emailIndex].trim()) {
        recipients.push({
          email: values[emailIndex].trim(),
          name: nameIndex !== -1 ? values[nameIndex]?.trim() : undefined,
        });
      }
    }
    
    setBulkRecipients(recipients);
    toast.success(`Loaded ${recipients.length} recipients`);
  };

  const handleAddSingleRecipient = (recipient: BulkEmailRecipient) => {
    if (bulkRecipients.length >= 5) {
      toast.warning("Maximum 5 manual entries. Please use CSV upload for more.");
      return;
    }
    setBulkRecipients([...bulkRecipients, recipient]);
    toast.success('Recipient added');
  };

  const handleRemoveRecipient = (index: number) => {
    setBulkRecipients(bulkRecipients.filter((_, i) => i !== index));
  };

  const handleSendBulkEmail = async () => {
    if (bulkRecipients.length === 0) {
      toast.error('No recipients added');
      return;
    }
    if (!bulkEmailSubject) {
      toast.error('Please enter a subject');
      return;
    }
    if (!bulkEmailContent) {
      toast.error('Please enter email content');
      return;
    }

    setIsSendingBulk(true);
    
    try {
      await createCampaign.mutateAsync({
        title: `Bulk Email - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        subject: bulkEmailSubject,
        content: bulkEmailContent,
        type: bulkEmailType,
        externalRecipients: bulkRecipients,
      });
      
      toast.success(`Campaign created! Sending to ${bulkRecipients.length} recipients`);
      
      setBulkRecipients([]);
      setBulkEmailSubject('');
      setBulkEmailContent('');

      refetchCampaigns();
    } catch (error) {
      toast.error('Failed to send bulk email');
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleSendToSelected = async (subject: string, content: string, type: "bulk_email" | "newsletter" | "announcement" | "promotion" | undefined) => {
    if (selectedSubscribers.size === 0) {
      toast.error('No subscribers selected');
      return;
    }

    setIsSendingToSelected(true);
    
    try {
      await createCampaign.mutateAsync({
        title: `Email to ${selectedSubscribers.size} subscribers - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        subject,
        content,
        type,
      });
      
      toast.success(`Sending to ${selectedSubscribers.size} subscribers`);
      setSelectedSubscribers(new Set());
      setIsSendToSelectedModalOpen(false);
    } catch (error) {
      toast.error('Failed to send emails');
    } finally {
      setIsSendingToSelected(false);
    }
  };

  // Subscriber handlers
  const handleSelectAll = () => {
    setSelectedSubscribers(
      selectedSubscribers.size === subscribers.length && subscribers.length > 0
        ? new Set()
        : new Set(subscribers.map((s) => s._id))
    );
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedSubscribers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSubscribers(next);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
    setSelectedSubscribers(new Set());
  };

  const handleRefresh = () => {
    refetchSubscribers();
    refetchCampaigns();
    toast.success("Refreshed");
  };

  const handleBulkUnsubscribe = async () => {
    if (selectedSubscribers.size === 0) return;
    await bulkAction.mutateAsync({ ids: Array.from(selectedSubscribers), action: "unsubscribe" });
    setSelectedSubscribers(new Set());
    refetchSubscribers();
    toast.success(`Unsubscribed ${selectedSubscribers.size} subscribers`);
  };

  const handleBulkDelete = async () => {
    if (selectedSubscribers.size === 0) return;
    await bulkAction.mutateAsync({ ids: Array.from(selectedSubscribers), action: "delete" });
    setSelectedSubscribers(new Set());
    refetchSubscribers();
    toast.success(`Deleted ${selectedSubscribers.size} subscribers`);
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    await exportSubscribers.mutateAsync({ format, status: activeSubTab });
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    const result = await importSubscribers.mutateAsync(importFile);
    setImporting(false);
    setIsImportModalOpen(false);
    setImportFile(null);
    refetchSubscribers();
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(`Imported ${result.imported} subscribers`);
  };

  const handleCreateCampaign = async () => {
    if (!campaignTitle || !campaignSubject || !campaignContent) {
      toast.error("Please fill in all fields");
      return;
    }

    await createCampaign.mutateAsync({
      title: campaignTitle,
      subject: campaignSubject,
      content: campaignContent,
      type: campaignType,
      scheduledFor: campaignScheduledFor?.toISOString(),
    });

    setIsCreateCampaignModalOpen(false);
    setCampaignTitle("");
    setCampaignSubject("");
    setCampaignContent("");
    setCampaignType("newsletter");
    setCampaignScheduledFor(undefined);
    refetchCampaigns();
    toast.success("Campaign created successfully");
  };

  const handleSendCampaign = async (id: string) => {
    await sendCampaign.mutateAsync(id);
    refetchCampaigns();
    toast.success("Campaign sending started");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "subscriber") {
      await deleteSubscriber.mutateAsync(deleteTarget.id);
      refetchSubscribers();
    } else {
      await deleteCampaign.mutateAsync(deleteTarget.id);
      refetchCampaigns();
    }
    setIsDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleInsertImageFromGallery = (imageUrl: string) => {
    // This will be handled by the editor instance
    const event = new CustomEvent('insertImageFromGallery', { detail: { url: imageUrl } });
    window.dispatchEvent(event);
  };

  const getSubscriberCount = (status: string) => {
    if (!subscribersData?.stats) return 0;
    if (status === "active") return subscribersData.stats.active;
    if (status === "unsubscribed") return subscribersData.stats.unsubscribed;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="px-4">

        {/* Page header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Newsletter Management</h1>
            {stats?.subscribers?.active && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {stats.subscribers.active} active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage newsletter subscribers, send bulk emails, create campaigns, and track engagement metrics.
          </p>
        </div>

        {/* Stats Overview - Only show on analytics tab */}
        {activeMainTab === "analytics" && (
          <div className="mb-6">
            {statsLoading ? (
              <StatsSkeleton />
            ) : stats ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Subscribers" value={stats.subscribers?.total ?? 0}
                  sub={`${stats.subscribers?.active ?? 0} active`} />
                <StatCard label="Total Campaigns" value={stats.campaigns?.total ?? 0}
                  sub={`${stats.campaigns?.sent ?? 0} sent`} />
                <StatCard label="Open Rate" value={`${stats.engagement?.openRate || 0}%`}
                  sub={`${stats.engagement?.totalOpens || 0} total opens`} accent="text-emerald-600 dark:text-emerald-400" />
                <StatCard label="Click Rate" value={`${stats.engagement?.clickRate || 0}%`}
                  sub={`${stats.engagement?.totalClicks || 0} total clicks`} accent="text-blue-600 dark:text-blue-400" />
              </div>
            ) : null}
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={handleRefresh} variant="outline" className="h-10 px-4 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" disabled={subscribersLoading || campaignsLoading}>
            <HugeiconsIcon icon={RefreshIcon} className={cn("mr-2 h-4 w-4", (subscribersLoading || campaignsLoading) && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Main Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <TabButton 
            label="Subscribers" 
            count={getSubscriberCount("active") + getSubscriberCount("unsubscribed")} 
            isActive={activeMainTab === "subscribers"} 
            onClick={() => setActiveMainTab("subscribers")} 
          />
          <TabButton 
            label="Bulk Email" 
            isActive={activeMainTab === "bulk-email"} 
            onClick={() => setActiveMainTab("bulk-email")} 
          />
          <TabButton 
            label="Campaigns" 
            count={stats?.campaigns?.total} 
            isActive={activeMainTab === "campaigns"} 
            onClick={() => setActiveMainTab("campaigns")} 
          />
          <TabButton 
            label="Analytics" 
            isActive={activeMainTab === "analytics"} 
            onClick={() => setActiveMainTab("analytics")} 
          />
          {(subscribersLoading || campaignsLoading) && !subscribersLoading && (
            <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>

        {/* Subscribers Tab */}
        {activeMainTab === "subscribers" && (
          <>
            {/* Sub Tabs - Only Active and Unsubscribed */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <TabButton 
                label="Active" 
                count={getSubscriberCount("active")} 
                isActive={activeSubTab === "active"} 
                onClick={() => { setActiveSubTab("active"); setCurrentPage(1); }} 
              />
              <TabButton 
                label="Unsubscribed" 
                count={getSubscriberCount("unsubscribed")} 
                isActive={activeSubTab === "unsubscribed"} 
                onClick={() => { setActiveSubTab("unsubscribed"); setCurrentPage(1); }} 
              />
            </div>

            {/* Filters */}
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <div className="relative h-10 min-w-[220px] flex-1 lg:h-11">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input 
                  placeholder="Search by email or name..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" 
                />
              </div>
              
              <ActionDropdown
                trigger={
                  <Button type="button" variant="outline" className="h-10 lg:h-11 px-4 dark:border-gray-700">
                    <HugeiconsIcon icon={DownloadIcon} className="h-3.5 w-3.5 mr-2" />
                    Export
                  </Button>
                }
                items={[
                  { label: "Export as CSV", icon: File01Icon, onClick: () => handleExport("csv") },
                  { label: "Export as Excel", icon: FileSpreadsheetIcon, onClick: () => handleExport("xlsx") },
                ]}
              />
              
              <Button type="button" variant="outline" className="h-10 lg:h-11 px-4 dark:border-gray-700" onClick={() => setIsImportModalOpen(true)}>
                <HugeiconsIcon icon={UploadIcon} className="h-3.5 w-3.5 mr-2" />
                Import
              </Button>
            </div>

            {/* Selection Bar with Send to Selected Button */}
            {selectedSubscribers.size > 0 && (
              <div className="mb-5 flex flex-col items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/50 sm:flex-row">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{selectedSubscribers.size}</span>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-200">subscribers selected</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsSendToSelectedModalOpen(true)}>
                    <HugeiconsIcon icon={SendIcon} className="h-3.5 w-3.5 mr-1.5" /> Send Email
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300" onClick={handleBulkUnsubscribe}>
                    <HugeiconsIcon icon={BanIcon} className="h-3.5 w-3.5 mr-1.5" /> Bulk Unsubscribe
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-300" onClick={handleBulkDelete}>
                    <HugeiconsIcon icon={Delete01Icon} className="h-3.5 w-3.5 mr-1.5" /> Bulk Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Subscribers Table with proper loading states */}
            <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
              <div className="relative">
                {/* Overlay loading - shows when fetching but data exists */}
                {isSubscribersFetching && subscribers.length > 0 && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-20 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}
                
                {/* Full skeleton - shows when loading and no data */}
                {subscribersLoading && subscribers.length === 0 ? (
                  <div className="p-6"><NewsletterSkeleton /></div>
                ) : subscribers.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <HugeiconsIcon icon={UsersIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No {activeSubTab} subscribers found</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{hasFilters ? "No subscribers match your filters" : `No ${activeSubTab} subscribers yet`}</p>
                    {hasFilters && (
                      <button type="button" onClick={clearFilters} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                        <HugeiconsIcon icon={FilterHorizontalIcon} className="mr-2 h-4 w-4" /> Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <SubscribersTable
                    subscribers={subscribers}
                    selectedSubscribers={selectedSubscribers}
                    onSelectAll={handleSelectAll}
                    onToggleSelect={toggleSelect}
                    onView={(sub) => { setSelectedSubscriber(sub); setIsViewSubscriberModalOpen(true); }}
                    onUnsubscribe={(id) => bulkAction.mutateAsync({ ids: [id], action: "unsubscribe" }).then(() => refetchSubscribers())}
                    onDelete={(id) => { setDeleteTarget({ id, type: "subscriber" }); setIsDeleteConfirmOpen(true); }}
                  />
                )}
              </div>
              
              {pagination && pagination.totalPages > 1 && !subscribersLoading && subscribers.length > 0 && (
                <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
                  <PaginationWithInfo currentPage={currentPage} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(p) => setCurrentPage(p)} showInfo showPageNumbers maxVisiblePages={5} />
                </div>
              )}
            </div>

            {/* Mobile View */}
            <div className="space-y-3 md:hidden">
              {subscribersLoading && subscribers.length === 0 ? (
                <NewsletterSkeleton />
              ) : subscribers.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
                  <HugeiconsIcon icon={UsersIcon} className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500">No subscribers found</p>
                </div>
              ) : (
                subscribers.map((subscriber) => (
                  <div key={subscriber._id} className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-3 p-4">
                      <Checkbox checked={selectedSubscribers.has(subscriber._id)} onCheckedChange={() => toggleSelect(subscriber._id)} />
                      <Avatar className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                        <AvatarFallback className="text-white text-xs font-bold">
                          {getInitials(subscriber.name || subscriber.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {subscriber.name || "Anonymous Subscriber"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subscriber.email}</p>
                      </div>
                      <Badge variant={statusTone[subscriber.status] ?? "secondary"} className="gap-1 capitalize">
                        {subscriber.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              {pagination && pagination.totalPages > 1 && !subscribersLoading && (
                <div className="mt-4">
                  <PaginationWithInfo currentPage={currentPage} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(p) => setCurrentPage(p)} showInfo showPageNumbers={false} maxVisiblePages={3} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Bulk Email Tab */}
        {activeMainTab === "bulk-email" && (
          <div className="space-y-6">
            {/* Recipient Import Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Recipients</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1">
                  <input
                    type="file"
                    ref={bulkFileInputRef}
                    accept=".csv"
                    onChange={handleBulkFileUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={() => bulkFileInputRef.current?.click()} className="w-full h-10 lg:h-11 rounded-lg">
                    <HugeiconsIcon icon={UploadIcon} className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsAddRecipientModalOpen(true)} disabled={bulkRecipients.length >= 5} className={'px-5 h-10 lg:h-11 rounded-lg'}>
                  <HugeiconsIcon icon={UserAddIcon} className="h-4 w-4 mr-2" />
                  Add Single Recipient {bulkRecipients.length >= 5 && "(Max 5)"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">CSV should have columns: email, name (optional). Max 5 manual entries, use CSV for more.</p>
            </div>

            {/* Recipients List */}
            {bulkRecipients.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recipients ({bulkRecipients.length})</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setBulkRecipients([])} className="text-red-500">
                      Clear All
                    </Button>
                  </div>
                </div>
                <BulkRecipientsTable recipients={bulkRecipients} onRemove={handleRemoveRecipient} />
              </div>
            )}

            {/* Email Content Section */}
            {(bulkRecipients.length > 0 || bulkEmailSubject || bulkEmailContent) && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Subject</Label>
                    <Input
                      placeholder="Enter email subject"
                      value={bulkEmailSubject}
                      onChange={(e) => setBulkEmailSubject(e.target.value)}
                      className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Type</Label>
                    <Select value={bulkEmailType} onValueChange={(v: any) => setBulkEmailType(v)}>
                      <SelectTrigger className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white h-10 lg:h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="p-1">
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
                        content={bulkEmailContent}
                        onChange={setBulkEmailContent}
                        placeholder="Write your email content here..."
                        onImageGalleryOpen={() => setIsImageGalleryOpen(true)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSendBulkEmail} 
                      disabled={bulkRecipients.length === 0 || !bulkEmailSubject || !bulkEmailContent || isSendingBulk}
                      className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-5"
                    >
                      <HugeiconsIcon icon={SendIcon} className="h-4 w-4 mr-2" />
                      {isSendingBulk ? `Sending to ${bulkRecipients.length}...` : `Send to ${bulkRecipients.length} Recipients`}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeMainTab === "campaigns" && (
          <>
            {/* Filters */}
            <div className="mb-5 flex flex-wrap items-center gap-2.5 justify-between">
              <Select value={campaignStatusFilter} onValueChange={(v) => { setCampaignStatusFilter(v ?? "all"); setCampaignsPage(1); }}>
                <SelectTrigger className="h-10 lg:h-11 w-36 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="p-1 dark:border-gray-800 dark:bg-gray-900">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-10 lg:h-11" onClick={() => setIsCreateCampaignModalOpen(true)}>
                <HugeiconsIcon icon={AddCircleIcon} className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>

            {/* Campaigns Table with proper loading states */}
            <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
              <div className="relative">
                {/* Overlay loading - shows when fetching but data exists */}
                {isCampaignsFetching && campaigns.length > 0 && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-20 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}
                
                {/* Full skeleton - shows when loading and no data */}
                {campaignsLoading && campaigns.length === 0 ? (
                  <div className="p-6"><NewsletterSkeleton /></div>
                ) : campaigns.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <HugeiconsIcon icon={EnvelopeIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No campaigns found</h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Create your first newsletter campaign</p>
                  </div>
                ) : (
                  <CampaignsTable
                    campaigns={campaigns}
                    onView={(camp) => { setSelectedCampaign(camp); setIsViewCampaignModalOpen(true); }}
                    onDelete={(id) => { setDeleteTarget({ id, type: "campaign" }); setIsDeleteConfirmOpen(true); }}
                    onSend={handleSendCampaign}
                  />
                )}
              </div>
              
              {campaignsPagination && campaignsPagination.totalPages > 1 && !campaignsLoading && campaigns.length > 0 && (
                <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
                  <PaginationWithInfo currentPage={campaignsPage} totalPages={campaignsPagination.totalPages} totalItems={campaignsPagination.total} itemsPerPage={campaignsPagination.limit} onPageChange={(p) => setCampaignsPage(p)} showInfo showPageNumbers maxVisiblePages={5} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeMainTab === "analytics" && statsLoading ? (
          <StatsSkeleton />
        ) : activeMainTab === "analytics" && stats ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Growth Chart Placeholder */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Subscriber Growth (Last 30 Days)</h3>
              <div className="h-64 flex items-end gap-2">
                {stats.subscribers?.growthOverTime?.slice(-30).map((point: any, idx: number) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600" style={{ height: `${Math.max(20, (point.count / Math.max(...stats.subscribers.growthOverTime.map((p: any) => p.count), 1)) * 200)}px` }} />
                    <span className="text-[10px] text-gray-500">{point._id.day}/{point._id.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Campaign Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600">Draft</span>
                  <span className="text-sm font-semibold">{stats.campaigns?.draft || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600">Sent / Completed</span>
                  <span className="text-sm font-semibold text-green-600">{stats.campaigns?.sent || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="text-sm font-semibold text-red-600">{stats.campaigns?.failed || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* View Subscriber Modal */}
      <ReusableModal
        isOpen={isViewSubscriberModalOpen}
        onClose={() => setIsViewSubscriberModalOpen(false)}
        title="Subscriber Details"
        description="Complete information about the subscriber"
        size="md"
        actions={[{ label: "Close", onClick: () => setIsViewSubscriberModalOpen(false), variant: "outline" }]}
      >
        {selectedSubscriber && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <Avatar className="h-12 w-12 rounded-full bg-blue-600">
                <AvatarFallback className="text-white font-bold bg-blue-600">
                  {getInitials(selectedSubscriber.name || selectedSubscriber.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSubscriber.name || "Anonymous Subscriber"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSubscriber.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <Badge variant={statusTone[selectedSubscriber.status] ?? "secondary"} className="mt-1 capitalize">{selectedSubscriber.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Subscribed At</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(selectedSubscriber.subscribedAt)}</p>
              </div>
              {selectedSubscriber.unsubscribedAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Unsubscribed At</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(selectedSubscriber.unsubscribedAt)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ReusableModal>

      {/* View Campaign Modal */}
      <ReusableModal
        isOpen={isViewCampaignModalOpen}
        onClose={() => setIsViewCampaignModalOpen(false)}
        title="Campaign Details"
        description="Complete information about the email campaign"
        size="xxl"
        actions={[{ label: "Close", onClick: () => setIsViewCampaignModalOpen(false), variant: "outline" }]}
      >
        {selectedCampaign && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCampaign.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedCampaign.subject}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={campaignStatusTone[selectedCampaign.status] ?? "secondary"} className="capitalize">{selectedCampaign.status}</Badge>
                <Badge variant="secondary" className="capitalize">{selectedCampaign.type}</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Recipients</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCampaign.recipients.total}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                <p className="text-xl font-bold text-green-600">{selectedCampaign.recipients.successful}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Opened</p>
                <p className="text-xl font-bold text-blue-600">{selectedCampaign.recipients.opened}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Clicked</p>
                <p className="text-xl font-bold text-amber-600">{selectedCampaign.recipients.clicked}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Email Content</h4>
              <div className="prose prose-sm max-w-none dark:prose-invert p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div dangerouslySetInnerHTML={{ __html: selectedCampaign.content }} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-gray-900 dark:text-white">{formatDateTime(selectedCampaign.createdAt)}</p>
              </div>
              {selectedCampaign.sentAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sent At</p>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(selectedCampaign.sentAt)}</p>
                </div>
              )}
              {selectedCampaign.scheduledFor && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled For</p>
                  <p className="text-gray-900 dark:text-white">{formatDateTime(selectedCampaign.scheduledFor)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ReusableModal>

      {/* Create Campaign Modal */}
      <ReusableModal
        isOpen={isCreateCampaignModalOpen}
        onClose={() => setIsCreateCampaignModalOpen(false)}
        title="Create Campaign"
        description="Create a new email campaign"
        size="xxl"
        actions={[
          { label: "Cancel", onClick: () => setIsCreateCampaignModalOpen(false), variant: "outline" },
          { label: "Save Campaign", onClick: handleCreateCampaign, variant: "primary", loading: createCampaign.isPending },
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
                onImageGalleryOpen={() => setIsImageGalleryOpen(true)}
              />
            </div>
          </div>
        </div>
      </ReusableModal>

      {/* Import Modal */}
      <ActionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onAction={handleImport}
        title="Import Subscribers"
        description="Upload a CSV or Excel file with subscriber data"
        actionLabel="Import"
        cancelLabel="Cancel"
        actionVariant="primary"
        isLoading={importing}
        disabled={!importFile}
        size="md"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <HugeiconsIcon icon={UploadIcon} className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {importFile ? importFile.name : "Click to select a file"}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Select File
            </Button>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              File should have columns: email (required), name (optional)
            </p>
          </div>
        </div>
      </ActionModal>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        onSelectImage={handleInsertImageFromGallery}
      />

      {/* Add Recipient Modal */}
      <AddRecipientModal
        isOpen={isAddRecipientModalOpen}
        onClose={() => setIsAddRecipientModalOpen(false)}
        onAdd={handleAddSingleRecipient}
        currentCount={bulkRecipients.length}
      />

      {/* Send to Selected Modal */}
      <SendToSelectedModal
        isOpen={isSendToSelectedModalOpen}
        onClose={() => setIsSendToSelectedModalOpen(false)}
        onSend={handleSendToSelected}
        selectedCount={selectedSubscribers.size}
        isLoading={isSendingToSelected}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteTarget?.type === "subscriber" ? "Subscriber" : "Campaign"}`}
        description={`Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteSubscriber.isPending || deleteCampaign.isPending}
        size="md"
      />
    </div>
  );
}