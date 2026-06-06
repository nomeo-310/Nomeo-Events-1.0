// newsletter-page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  FilterHorizontalIcon,
  RefreshIcon,
  Search01Icon,
  UnavailableIcon as BanIcon,
  Delete01Icon,
  AddCircleIcon,
  SentIcon as SendIcon,
  UploadIcon,
  DownloadIcon,
  UserMultiple02Icon as UsersIcon,
  Mail01Icon as EnvelopeIcon,
  FileSpreadsheetIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { ConfirmModal } from "@/components/ui/reusable-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionModal } from "@/components/ui/reusable-modal";
import { Label } from "@/components/ui/label";

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

import { MainTab, SubscriberTab, BulkEmailRecipient, getInitials, statusTone, formatDate } from "./newsletter-types";
import { NewsletterSkeleton, StatsSkeleton } from "./newsletter-skeletons";
import { TabButton, ActionDropdown, StatCard, AddRecipientModal } from "./newsletter-components";
import { RichTextEditor } from "./newsletter-editor";
import { SubscribersTable, CampaignsTable, BulkRecipientsTable } from "./newsletter-tables";
import {
  ImageGalleryModal,
  SendToSelectedModal,
  ViewSubscriberModal,
  ViewCampaignModal,
  CreateCampaignModal,
} from "./newsletter-modals";

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
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
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
  
  // File input refs
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

  const subscribers: any[] = subscribersData?.subscribers || [];
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

  const handleSendToSelected = async (subject: string, content: string, type: any) => {
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
        : new Set(subscribers.map((s: any) => s._id))
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

        {/* Stats Overview */}
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
        </div>

        {/* Subscribers Tab */}
        {activeMainTab === "subscribers" && (
          <>
            {/* Sub Tabs */}
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

            {/* Selection Bar */}
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

            {/* Subscribers Table */}
            <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
              <div className="relative">
                {isSubscribersFetching && subscribers.length > 0 && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-20 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}
                
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
                subscribers.map((subscriber: any) => (
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
                  <HugeiconsIcon icon={AddCircleIcon} className="h-4 w-4 mr-2" />
                  Add Single Recipient {bulkRecipients.length >= 5 && "(Max 5)"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">CSV should have columns: email, name (optional). Max 5 manual entries, use CSV for more.</p>
            </div>

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

            <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
              <div className="relative">
                {isCampaignsFetching && campaigns.length > 0 && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-20 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}
                
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

      {/* Modals */}
      <ViewSubscriberModal
        isOpen={isViewSubscriberModalOpen}
        onClose={() => setIsViewSubscriberModalOpen(false)}
        subscriber={selectedSubscriber}
      />

      <ViewCampaignModal
        isOpen={isViewCampaignModalOpen}
        onClose={() => setIsViewCampaignModalOpen(false)}
        campaign={selectedCampaign}
      />

      <CreateCampaignModal
        isOpen={isCreateCampaignModalOpen}
        onClose={() => setIsCreateCampaignModalOpen(false)}
        onSubmit={handleCreateCampaign}
        isLoading={createCampaign.isPending}
        campaignTitle={campaignTitle}
        setCampaignTitle={setCampaignTitle}
        campaignSubject={campaignSubject}
        setCampaignSubject={setCampaignSubject}
        campaignContent={campaignContent}
        setCampaignContent={setCampaignContent}
        campaignType={campaignType}
        setCampaignType={setCampaignType}
        campaignScheduledFor={campaignScheduledFor}
        setCampaignScheduledFor={setCampaignScheduledFor}
        onImageGalleryOpen={() => setIsImageGalleryOpen(true)}
      />

      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        onSelectImage={(url) => {
          // Will be handled by the editor instance
          const event = new CustomEvent('insertImageFromGallery', { detail: { url } });
          window.dispatchEvent(event);
        }}
      />

      <AddRecipientModal
        isOpen={isAddRecipientModalOpen}
        onClose={() => setIsAddRecipientModalOpen(false)}
        onAdd={handleAddSingleRecipient}
        currentCount={bulkRecipients.length}
      />

      <SendToSelectedModal
        isOpen={isSendToSelectedModalOpen}
        onClose={() => setIsSendToSelectedModalOpen(false)}
        onSend={handleSendToSelected}
        selectedCount={selectedSubscribers.size}
        isLoading={isSendingToSelected}
      />

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
    </div>
  );
}