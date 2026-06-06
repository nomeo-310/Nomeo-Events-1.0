// subscriptions-modals.tsx
import { useState } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RefreshIcon, 
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReusableModal, ConfirmModal } from '@/components/ui/reusable-modal';

import { SubscriptionDetailsSkeleton } from './subscriptions-skeletons';
import { getInitials, getStatusLabel, STATUS_ICONS, STATUS_COLORS, TIER_ICONS, TIER_COLORS, formatCurrency, formatDate, type ExpiryPreviewData } from './subscriptions-types';
import type { ISubscription } from '@/hooks/use-subscriptions';

// ─── Subscription Details Content ────────────────────────────────────────────
export const SubscriptionDetailsContent = ({ subscriptionId, useGetSubscription }: { 
  subscriptionId: string; 
  useGetSubscription: any;
}) => {
  const { data: detail, isLoading } = useGetSubscription(subscriptionId);
  
  if (isLoading) {
    return <SubscriptionDetailsSkeleton />;
  }
  
  if (!detail) {
    return (
      <div className="py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load subscription details</p>
      </div>
    );
  }
  
  const sub = detail.subscription as ISubscription;
  const userName = typeof sub.userId === 'object' ? sub.userId.name : 'Unknown';
  const userEmail = typeof sub.userId === 'object' ? sub.userId.email : 'Unknown';
  const userAvatar = typeof sub.userId === 'object' ? sub.userId.avatar : undefined;
  
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <Avatar className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-gray-900 flex-shrink-0">
          {userAvatar ? <AvatarImage src={userAvatar} alt={userName} /> : null}
          <AvatarFallback className="bg-transparent text-white text-lg font-bold">{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
          <div className="flex gap-2 mt-2">
            <Badge className={cn("gap-1 border", STATUS_COLORS[sub.status])}>
              <HugeiconsIcon icon={STATUS_ICONS[sub.status]} className="h-3 w-3" />
              {getStatusLabel(sub.status)}
            </Badge>
            <Badge className={cn("gap-1", TIER_COLORS[sub.planTier])}>
              <HugeiconsIcon icon={TIER_ICONS[sub.planTier]} className="h-3 w-3" />
              {sub.planName}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Plan</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{sub.planName} ({sub.planTier})</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Interval</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{sub.interval}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sub.finalPriceKobo)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Period End</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(sub.currentPeriodEnd)}</p>
        </div>
      </div>
      
      {detail.analytics && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Payment Analytics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Payments</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{detail.analytics.totalPayments}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(detail.analytics.totalRevenue * 100)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Avg Payment</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(detail.analytics.averagePaymentAmount * 100)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">LTV</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(detail.analytics.lifetimeValue * 100)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Manual Expiry Modal ─────────────────────────────────────────────────────
export const ManualExpiryModal = ({ 
  isOpen, 
  onClose, 
  onRefresh,
  fetchApi,
  postApi,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onRefresh: () => void;
  fetchApi: typeof fetch;
  postApi: typeof fetch;
}) => {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [preview, setPreview] = useState<ExpiryPreviewData | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState<'preview' | 'confirm'>('preview');

  const handlePreview = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const response = await fetchApi(`/api/admin/subscriptions/expire-manual?type=${selectedType ?? 'all'}`);
      const data = await response.json();
      if (data.success) {
        setPreview(data);
        toast.success(`Found ${data.affectedCount} subscriptions ready for expiry`);
      } else {
        toast.error(data.error || 'Failed to fetch preview');
      }
    } catch (error) {
      toast.error('Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const response = await postApi('/api/admin/subscriptions/expire-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false, type: selectedType ?? 'all', sendNotifications: true })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setPreview(null);
        setConfirmationStep('preview');
        onClose();
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to execute expiry');
      }
    } catch (error) {
      toast.error('Failed to execute expiry');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      <ReusableModal
        isOpen={isOpen && confirmationStep === 'preview'}
        onClose={() => {
          onClose();
          setConfirmationStep('preview');
          setPreview(null);
        }}
        title="Manual Expiry Tool"
        description="Emergency backup tool for expiring subscriptions when automated cron job fails"
        size="xl"
        className="!max-w-5xl"
        actions={[
          { label: 'Close', onClick: () => { onClose(); setConfirmationStep('preview'); setPreview(null); }, variant: 'outline', disabled: loading || executing }
        ]}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Emergency Action Required</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Use this only when the automated cron job has failed. All actions are logged and users will receive notification emails.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Subscription Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Select subscription type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700 p-1">
                  <SelectItem value="all">All Expirable Subscriptions</SelectItem>
                  <SelectItem value="trial">Expired Trials Only</SelectItem>
                  <SelectItem value="past_due">Past Due Only</SelectItem>
                  <SelectItem value="free">Free Plans Only</SelectItem>
                  <SelectItem value="cancelled_pending">Pending Cancellations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-end">
              <Button onClick={handlePreview} disabled={loading || executing} variant="outline">
                <HugeiconsIcon icon={RefreshIcon} className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Preview
              </Button>
              
              {preview && preview.affectedCount > 0 && (
                <Button onClick={() => setConfirmationStep('confirm')} disabled={executing} variant="destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 mr-2" />
                  Expire {preview.affectedCount} Subscription{preview.affectedCount !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </div>

          {preview && preview.affectedCount > 0 && !loading && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border">
                  <p className="text-xl font-bold text-blue-600">{preview.byType?.trial || 0}</p>
                  <p className="text-xs text-gray-500">Expired Trials</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border">
                  <p className="text-xl font-bold text-red-600">{preview.byType?.pastDue || 0}</p>
                  <p className="text-xs text-gray-500">Past Due</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border">
                  <p className="text-xl font-bold text-green-600">{preview.byType?.free || 0}</p>
                  <p className="text-xs text-gray-500">Free Plans</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border">
                  <p className="text-xl font-bold text-orange-600">{preview.byType?.pendingCancel || 0}</p>
                  <p className="text-xs text-gray-500">Pending Cancel</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ReusableModal>

      <ConfirmModal
        isOpen={isOpen && confirmationStep === 'confirm'}
        onClose={() => setConfirmationStep('preview')}
        onConfirm={handleExecute}
        title="Emergency Expiry Confirmation"
        description={`Are you sure you want to expire ${preview?.affectedCount} subscription${preview?.affectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel={`Expire ${preview?.affectedCount} Subscription${preview?.affectedCount !== 1 ? 's' : ''}`}
        cancelLabel="Back"
        confirmVariant="danger"
        isLoading={executing}
      />
    </>
  );
};