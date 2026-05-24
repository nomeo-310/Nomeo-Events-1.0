'use client';

import React, { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlusSignIcon as PlusIcon,
  RefreshIcon,
  Search01Icon,
  EditIcon,
  DeleteIcon,
  Tick02Icon,
  Cancel01Icon,
  MoreHorizontalIcon,
  TagIcon,
  CalendarIcon,
  Building02Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  LayersIcon,
  Money01Icon,
  ViewIcon,
  CopyIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReusableModal, ConfirmModal, ActionModal } from '@/components/ui/reusable-modal';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useGetPlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useActivatePlan,
  useDeactivatePlan,
  useGetCoupons,
  useAddCoupon,
  useRemoveCoupon,
  useBulkAction,
  useBulkDelete,
  usePlanStats,
  PlanTier,
  PlanInterval,
  DiscountType,
  type IPlan,
  type CreatePlanParams,
} from '@/hooks/use-plans';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth/auth-client';

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const TIER_ORDER = Object.values(PlanTier);
const TIER_LABELS: Record<PlanTier, string> = {
  [PlanTier.FREE]: 'Free',
  [PlanTier.STARTER]: 'Starter',
  [PlanTier.BASIC]: 'Basic',
  [PlanTier.PRO]: 'Pro',
  [PlanTier.BUSINESS]: 'Business',
  [PlanTier.ENTERPRISE]: 'Enterprise',
};

const INTERVAL_LABELS: Record<PlanInterval, string> = {
  [PlanInterval.MONTHLY]: 'Monthly',
  [PlanInterval.QUARTERLY]: 'Quarterly',
  [PlanInterval.BIANNUAL]: 'Biannual',
  [PlanInterval.ANNUAL]: 'Annual',
  [PlanInterval.LIFETIME]: 'Lifetime',
};

const TIER_COLORS: Record<PlanTier, string> = {
  [PlanTier.FREE]: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  [PlanTier.STARTER]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  [PlanTier.BASIC]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [PlanTier.PRO]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  [PlanTier.BUSINESS]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  [PlanTier.ENTERPRISE]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP'];

// ─────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────

const formatPrice = (priceKobo: number, currency: string = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceKobo / 100);
};

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

// ─────────────────────────────────────────────────────────
// SKELETON COMPONENT
// ─────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`}
    />
  );
}

function PlansSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-4">
            <SkeletonLine className="h-6 w-32" />
            <SkeletonLine className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <SkeletonLine className="h-6 w-24 rounded-full" />
                    <SkeletonLine className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <SkeletonLine className="h-5 w-40" />
                    <SkeletonLine className="h-8 w-32" />
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <SkeletonLine className="h-10 w-full" />
                      <SkeletonLine className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB BUTTON COMPONENT
// ─────────────────────────────────────────────────────────

interface TabButtonProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, count, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2 text-sm font-medium rounded-md transition-all h-10 lg:h-11",
        isActive 
          ? "bg-blue-600 text-white shadow-sm" 
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-2 px-2 py-0.5 text-xs rounded-full",
          isActive 
            ? "bg-blue-500 text-white" 
            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// ACCORDION SECTION COMPONENT
// ─────────────────────────────────────────────────────────

interface AccordionSectionProps {
  tier: PlanTier;
  plans: IPlan[];
  isOpen: boolean;
  onToggle: () => void;
  selectedPlans: Set<string>;
  onSelectPlan: (planId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (plan: IPlan) => void;
  onDelete: (plan: IPlan) => void;
  onToggleActive: (plan: IPlan) => void;
  onManageCoupons: (plan: IPlan) => void;
  canManage: boolean;
}

function AccordionSection({
  tier,
  plans,
  isOpen,
  onToggle,
  selectedPlans,
  onSelectPlan,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleActive,
  onManageCoupons,
  canManage,
}: AccordionSectionProps) {
  const allSelectedInTier = plans.every((p) => selectedPlans.has(p._id));
  const someSelectedInTier = plans.some((p) => selectedPlans.has(p._id));

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
          isOpen && "border-b border-gray-200 dark:border-gray-800"
        )}
      >
        <div className="flex items-center gap-3">
          {canManage && (
            <Checkbox
              checked={allSelectedInTier}
              className={cn(someSelectedInTier && "data-[state=checked]:bg-blue-600")}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className={cn("w-3 h-3 rounded-full", TIER_COLORS[tier].split(' ')[0])} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {TIER_LABELS[tier]}
          </h2>
          <Badge className={TIER_COLORS[tier]}>
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
          </Badge>
        </div>
        <HugeiconsIcon 
          icon={isOpen ? ArrowUp01Icon : ArrowDown01Icon} 
          className="h-5 w-5 text-gray-500 dark:text-gray-400"
        />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                isSelected={selectedPlans.has(plan._id)}
                onSelect={(checked) => onSelectPlan(plan._id, checked)}
                onEdit={() => onEdit(plan)}
                onDelete={() => onDelete(plan)}
                onToggleActive={() => onToggleActive(plan)}
                onManageCoupons={() => onManageCoupons(plan)}
                canManage={canManage}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PLAN CARD COMPONENT
// ─────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: IPlan;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onManageCoupons: () => void;
  canManage: boolean;
}

function PlanCard({ plan, isSelected, onSelect, onEdit, onDelete, onToggleActive, onManageCoupons, canManage }: PlanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow relative">
      {canManage && (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </div>
      )}

      <div className="p-4 pt-12 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("capitalize", TIER_COLORS[plan.tier])}>
              {TIER_LABELS[plan.tier]}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {INTERVAL_LABELS[plan.interval]}
            </Badge>
            {plan.isFree && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Free
              </Badge>
            )}
            {plan.trialDays > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-800">
                {plan.trialDays}-day trial
              </Badge>
            )}
          </div>
          
          {canManage && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowMenu(!showMenu)}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full p-1 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-10 py-1">
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <HugeiconsIcon icon={EditIcon} className="h-3.5 w-3.5" />
                    Edit Plan
                  </button>
                  <button
                    onClick={() => { onManageCoupons(); setShowMenu(false); }}
                    className="rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <HugeiconsIcon icon={TagIcon} className="h-3.5 w-3.5" />
                    Manage Coupons
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                  <button
                    onClick={() => { onToggleActive(); setShowMenu(false); }}
                    className={`rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      plan.isActive
                        ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <HugeiconsIcon icon={plan.isActive ? Cancel01Icon : Tick02Icon} className="h-3.5 w-3.5" />
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <HugeiconsIcon icon={DeleteIcon} className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Slug: {plan.slug}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(plan.priceKobo, plan.currency)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              per {plan.interval}
            </p>
          </div>
        </div>

        {plan.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {plan.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Events</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.maxEvents ? `${plan.maxEvents.toLocaleString()}+` : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Attendees</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.maxAttendeesPerEvent ? `${plan.maxAttendeesPerEvent.toLocaleString()}+` : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Team Members</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.maxTeamMembers ? `${plan.maxTeamMembers}+` : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Storage</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.storageGb ? `${plan.storageGb} GB` : 'Unlimited'}
            </p>
          </div>
        </div>

        {plan.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap gap-1.5">
              {plan.features.slice(0, 3).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px]">
                  {feature.name}
                </Badge>
              ))}
              {plan.features.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{plan.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {plan.discounts && plan.discounts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Active Discounts</p>
            <div className="flex flex-wrap gap-1.5">
              {plan.discounts.slice(0, 2).map((discount, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] text-green-600 dark:text-green-400">
                  {discount.discountType === DiscountType.PERCENTAGE ? `${discount.discountValue}% OFF` : `${formatPrice(discount.discountValue)} OFF`}
                </Badge>
              ))}
              {plan.discounts.length > 2 && (
                <Badge variant="outline" className="text-[10px]">
                  +{plan.discounts.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CREATE/EDIT PLAN MODAL
// ─────────────────────────────────────────────────────────

type FormFeature = {
  name: string;
  description: string;
  included: boolean;
  limit: string;
  unit: string;
};

type FormDiscount = {
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  interval: string;      // '' means no interval restriction
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type FormMetadata = { key: string; value: string }[];

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: IPlan | null;
  onSubmit: (data: CreatePlanParams) => Promise<void>;
  isLoading: boolean;
}

function PlanFormModal({ isOpen, onClose, plan, onSubmit, isLoading }: PlanFormModalProps) {
  const isEdit = !!plan;

  // ── Core fields ───────────────────────────────────────
  const [name, setName]                     = useState('');
  const [slug, setSlug]                     = useState('');
  const [tier, setTier]                     = useState<PlanTier>(PlanTier.STARTER);
  const [interval, setInterval]             = useState<PlanInterval>(PlanInterval.MONTHLY);
  const [priceKobo, setPriceKobo]           = useState('0');
  const [currency, setCurrency]             = useState('NGN');
  const [description, setDescription]       = useState('');
  const [isActive, setIsActive]             = useState(true);
  const [isPublic, setIsPublic]             = useState(true);
  const [paystackPlanCode, setPaystackCode] = useState('');
  const [trialDays, setTrialDays]           = useState('0');
  const [sortOrder, setSortOrder]           = useState('0');

  // ── Limits ────────────────────────────────────────────
  const [maxEvents, setMaxEvents]                       = useState('');
  const [maxAttendeesPerEvent, setMaxAttendees]         = useState('');
  const [maxTeamMembers, setMaxTeamMembers]             = useState('');
  const [storageGb, setStorageGb]                       = useState('');

  // ── Sub-document lists ────────────────────────────────
  const [features, setFeatures]   = useState<FormFeature[]>([]);
  const [discounts, setDiscounts] = useState<FormDiscount[]>([]);
  const [metadata, setMetadata]   = useState<FormMetadata>([]);

  // ── New-item drafts ───────────────────────────────────
  const [newFeature, setNewFeature]   = useState<FormFeature>({
    name: '', description: '', included: true, limit: '', unit: '',
  });
  const [newDiscount, setNewDiscount] = useState<FormDiscount>({
    name: '', description: '', discountType: DiscountType.PERCENTAGE,
    discountValue: '', interval: '', startsAt: '', endsAt: '', isActive: true,
  });
  const [newMetaKey, setNewMetaKey]     = useState('');
  const [newMetaValue, setNewMetaValue] = useState('');

  // ── Tab ───────────────────────────────────────────────
  const [tab, setTab] = useState<'basic' | 'limits' | 'features' | 'discounts' | 'metadata'>('basic');

  // ── Populate on open / plan change ───────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (plan) {
      setName(plan.name);
      setSlug(plan.slug);
      setTier(plan.tier);
      setInterval(plan.interval);
      setPriceKobo(String(plan.priceKobo));
      setCurrency(plan.currency ?? 'NGN');
      setDescription(plan.description ?? '');
      setIsActive(plan.isActive);
      setIsPublic(plan.isPublic);
      setPaystackCode(plan.paystackPlanCode ?? '');
      setTrialDays(String(plan.trialDays ?? 0));
      setSortOrder(String(plan.sortOrder ?? 0));
      setMaxEvents(plan.maxEvents != null ? String(plan.maxEvents) : '');
      setMaxAttendees(plan.maxAttendeesPerEvent != null ? String(plan.maxAttendeesPerEvent) : '');
      setMaxTeamMembers(plan.maxTeamMembers != null ? String(plan.maxTeamMembers) : '');
      setStorageGb(plan.storageGb != null ? String(plan.storageGb) : '');
      setFeatures(plan.features.map(f => ({
        name: f.name,
        description: f.description ?? '',
        included: f.included,
        limit: f.limit != null ? String(f.limit) : '',
        unit: f.unit ?? '',
      })));
      setDiscounts(plan.discounts.map(d => ({
        name: d.name,
        description: d.description ?? '',
        discountType: d.discountType,
        discountValue: String(d.discountValue),
        interval: d.interval ?? '',
        startsAt: d.startsAt ? new Date(d.startsAt).toISOString().substring(0, 10) : '',
        endsAt: d.endsAt ? new Date(d.endsAt).toISOString().substring(0, 10) : '',
        isActive: d.isActive,
      })));
      // metadata is a Map on the server but comes back as Record from JSON
      const meta = plan.metadata as unknown as Record<string, any>;
      setMetadata(Object.entries(meta ?? {}).map(([key, value]) => ({
        key, value: String(value),
      })));
    } else {
      // Reset to defaults
      setName(''); setSlug(''); setTier(PlanTier.STARTER);
      setInterval(PlanInterval.MONTHLY); setPriceKobo('0'); setCurrency('NGN');
      setDescription(''); setIsActive(true); setIsPublic(true);
      setPaystackCode(''); setTrialDays('0'); setSortOrder('0');
      setMaxEvents(''); setMaxAttendees(''); setMaxTeamMembers(''); setStorageGb('');
      setFeatures([]); setDiscounts([]); setMetadata([]);
    }

    setTab('basic');
  }, [isOpen, plan]);

  const generateSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (n: string) => {
    setName(n);
    if (!isEdit) setSlug(generateSlug(n));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    const metadataObj: Record<string, any> = {};
    metadata.forEach(({ key, value }) => {
      if (key.trim()) metadataObj[key.trim()] = value;
    });

    const payload: CreatePlanParams = {
      name:             name.trim(),
      slug:             slug.trim(),
      tier,
      interval,
      priceKobo:        Math.max(0, parseInt(priceKobo) || 0),
      currency:         currency || 'NGN',
      description:      description || undefined,
      isActive,
      isPublic,
      paystackPlanCode: paystackPlanCode.trim() || undefined,
      trialDays:        Math.max(0, parseInt(trialDays) || 0),
      sortOrder:        parseInt(sortOrder) || 0,
      maxEvents:             maxEvents        ? parseInt(maxEvents)        : undefined,
      maxAttendeesPerEvent:  maxAttendeesPerEvent ? parseInt(maxAttendeesPerEvent) : undefined,
      maxTeamMembers:        maxTeamMembers   ? parseInt(maxTeamMembers)   : undefined,
      storageGb:             storageGb        ? parseFloat(storageGb)      : undefined,
      features: features.map(f => ({
        name:        f.name,
        description: f.description || undefined,
        included:    f.included,
        limit:       f.limit ? parseInt(f.limit) : undefined,
        unit:        f.unit  || undefined,
      })),
      discounts: discounts.map(d => ({
        name:          d.name,
        description:   d.description || undefined,
        discountType:  d.discountType,
        discountValue: parseFloat(d.discountValue) || 0,
        interval:      d.interval as PlanInterval || undefined,
        startsAt:      d.startsAt || undefined,
        endsAt:        d.endsAt   || undefined,
        isActive:      d.isActive,
      })),
      metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
    };

    await onSubmit(payload);
    onClose();
  };

  // Tab labels for the modal - matching the main component's style
  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'limits', label: 'Limits' },
    { id: 'features', label: 'Features' },
    { id: 'discounts', label: 'Discounts' },
    { id: 'metadata', label: 'Metadata' },
  ] as const;

  // Helper to update features
  const updateFeature = (i: number, patch: Partial<FormFeature>) =>
    setFeatures(prev => prev.map((f, idx) => idx === i ? { ...f, ...patch } : f));

  // Helper to update discounts
  const updateDiscount = (i: number, patch: Partial<FormDiscount>) =>
    setDiscounts(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));

  // Shadcn calendar integration for discount dates
  const [startsAtCalendarOpen, setStartsAtCalendarOpen] = useState(false);
  const [endsAtCalendarOpen, setEndsAtCalendarOpen] = useState(false);
  const [newStartsAtCalendarOpen, setNewStartsAtCalendarOpen] = useState(false);
  const [newEndsAtCalendarOpen, setNewEndsAtCalendarOpen] = useState(false);

  const triggerClass = cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer",
    "dark:border-gray-800 dark:bg-gray-900 dark:text-white"
  );

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit — ${plan!.name}` : 'Create New Plan'}
      description={isEdit ? 'Update plan details, features, discounts and metadata' : 'Configure a new subscription plan'}
      size="xl"
      maxHeight="85vh"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline', disabled: isLoading },
        { label: isEdit ? 'Save Changes' : 'Create Plan', onClick: handleSubmit, variant: 'primary', loading: isLoading },
      ]}
    >
      {/* Tab strip - redesigned to match the main component's TabButton style */}
      <div className="flex gap-2 flex-wrap border-gray-200 dark:border-gray-800 mb-6 pb-4">
        {tabs.map((t) => (
          <TabButton
            key={t.id}
            label={t.label}
            isActive={tab === t.id}
            onClick={() => setTab(t.id as any)}
          />
        ))}
      </div>

      <div className="space-y-4">

        {/* ── BASIC ─────────────────────────────────────── */}
        {tab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Plan Name *</Label>
                <Input value={name} onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Pro Monthly" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Slug *</Label>
                <Input value={slug}
                  onChange={e => setSlug(generateSlug(e.target.value))}
                  placeholder="e.g. pro-monthly" className="mt-1.5"
                  disabled={isEdit} // slug is the primary key — prevent changing it
                />
                {isEdit && (
                  <p className="text-[10px] text-gray-400 mt-1">Slug cannot be changed after creation</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold">Tier</Label>
                <Select value={tier} onValueChange={v => v && setTier(v as PlanTier)}>
                  <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    {TIER_ORDER.map(t => (
                      <SelectItem key={t} value={t}>{TIER_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Billing Interval</Label>
                <Select value={interval} onValueChange={v => v && setInterval(v as PlanInterval)}>
                  <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    {Object.values(PlanInterval).map(i => (
                      <SelectItem key={i} value={i}>{INTERVAL_LABELS[i]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Currency</Label>
                <Select value={currency} onValueChange={v => v && setCurrency(v)}>
                  <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Price (Kobo / smallest unit)</Label>
                <Input type="number" min={0} value={priceKobo}
                  onChange={e => setPriceKobo(e.target.value)} className="mt-1.5" />
                <p className="text-[10px] text-gray-400 mt-1">
                  = {formatPrice(parseInt(priceKobo) || 0, currency)}
                  {parseInt(priceKobo) === 0 && ' — this will be marked as a free plan'}
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold">Paystack Plan Code</Label>
                <Input value={paystackPlanCode}
                  onChange={e => setPaystackCode(e.target.value)}
                  placeholder="PLN_xxxxxxxxxx" className="mt-1.5" />
                <p className="text-[10px] text-gray-400 mt-1">From your Paystack dashboard</p>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe the plan's value proposition…" className="mt-1.5" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Trial Days</Label>
                <Input type="number" min={0} value={trialDays}
                  onChange={e => setTrialDays(e.target.value)} className="mt-1.5" />
                <p className="text-[10px] text-gray-400 mt-1">0 = no trial period</p>
              </div>
              <div>
                <Label className="text-xs font-semibold">Sort Order</Label>
                <Input type="number" min={0} value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)} className="mt-1.5" />
                <p className="text-[10px] text-gray-400 mt-1">Lower = shown first</p>
              </div>
            </div>

            <div className="flex items-center gap-8 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} id="isActive" />
                <Label htmlFor="isActive" className="text-sm cursor-pointer">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isPublic} onCheckedChange={setIsPublic} id="isPublic" />
                <Label htmlFor="isPublic" className="text-sm cursor-pointer">Public</Label>
              </div>
            </div>
          </div>
        )}

        {/* ── LIMITS ────────────────────────────────────── */}
        {tab === 'limits' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Leave blank for unlimited.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Max Events</Label>
                <Input type="number" min={0} placeholder="Unlimited"
                  value={maxEvents} onChange={e => setMaxEvents(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Max Attendees / Event</Label>
                <Input type="number" min={0} placeholder="Unlimited"
                  value={maxAttendeesPerEvent} onChange={e => setMaxAttendees(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Max Team Members</Label>
                <Input type="number" min={0} placeholder="Unlimited"
                  value={maxTeamMembers} onChange={e => setMaxTeamMembers(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Storage (GB)</Label>
                <Input type="number" min={0} step={0.5} placeholder="Unlimited"
                  value={storageGb} onChange={e => setStorageGb(e.target.value)} className="mt-1.5" />
                <p className="text-[10px] text-gray-400 mt-1">Supports decimals e.g. 0.5</p>
              </div>
            </div>
          </div>
        )}

        {/* ── FEATURES ──────────────────────────────────── */}
        {tab === 'features' && (
          <div className="space-y-3">
            {/* Existing features */}
            {features.map((f, i) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <Input value={f.name} onChange={e => updateFeature(i, { name: e.target.value })}
                    placeholder="Feature name" className="flex-1 text-sm" />
                  <Input value={f.limit} onChange={e => updateFeature(i, { limit: e.target.value })}
                    placeholder="Limit" className="w-24 text-sm" type="number" />
                  <Input value={f.unit} onChange={e => updateFeature(i, { unit: e.target.value })}
                    placeholder="Unit" className="w-24 text-sm" />
                </div>
                <div className="flex items-center justify-between">
                  <Input value={f.description}
                    onChange={e => updateFeature(i, { description: e.target.value })}
                    placeholder="Description (optional)" className="flex-1 text-sm mr-2" />
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={f.included} onCheckedChange={v => updateFeature(i, { included: v })} />
                    <Label className="text-xs">Included</Label>
                    <Button variant="ghost" size="sm"
                      onClick={() => setFeatures(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-600 px-2">
                      <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new feature */}
            <div className="p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-gray-500">Add Feature</p>
              <div className="flex gap-2">
                <Input value={newFeature.name}
                  onChange={e => setNewFeature(p => ({ ...p, name: e.target.value }))}
                  placeholder="Feature name *" className="flex-1 text-sm" />
                <Input value={newFeature.limit}
                  onChange={e => setNewFeature(p => ({ ...p, limit: e.target.value }))}
                  placeholder="Limit" className="w-24 text-sm" type="number" />
                <Input value={newFeature.unit}
                  onChange={e => setNewFeature(p => ({ ...p, unit: e.target.value }))}
                  placeholder="Unit" className="w-24 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Input value={newFeature.description}
                  onChange={e => setNewFeature(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)" className="flex-1 text-sm" />
                <Switch checked={newFeature.included}
                  onCheckedChange={v => setNewFeature(p => ({ ...p, included: v }))} />
                <Label className="text-xs shrink-0">Included</Label>
                <Button size="sm" onClick={() => {
                  if (!newFeature.name.trim()) return;
                  setFeatures(prev => [...prev, newFeature]);
                  setNewFeature({ name: '', description: '', included: true, limit: '', unit: '' });
                }} className="px-6 h-10 lg:h-11 bg-blue-600 hover:bg-blue-700 text-white">
                  Add
                </Button>
              </div>
            </div>

            {features.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No features added yet</p>
            )}
          </div>
        )}

        {/* ── DISCOUNTS ─────────────────────────────────── */}
        {tab === 'discounts' && (
          <div className="space-y-3">
            {discounts.map((d, i) => {
              // Local state for this discount's calendar popovers
              const [localStartOpen, setLocalStartOpen] = useState(false);
              const [localEndOpen, setLocalEndOpen] = useState(false);
              
              return (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Input value={d.name} onChange={e => updateDiscount(i, { name: e.target.value })}
                      placeholder="Discount name *" className="flex-1 text-sm" />
                    <Select value={d.discountType}
                      onValueChange={v => v && updateDiscount(i, { discountType: v as DiscountType })}>
                      <SelectTrigger className="w-36 text-sm h-10 lg:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="p-1">
                        <SelectItem value={DiscountType.PERCENTAGE}>Percentage %</SelectItem>
                        <SelectItem value={DiscountType.FIXED}>Fixed ₦</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={d.discountValue}
                      onChange={e => updateDiscount(i, { discountValue: e.target.value })}
                      placeholder="Value" className="w-24 text-sm" type="number" />
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Select value={d.interval || 'all'}
                      onValueChange={v => v && updateDiscount(i, { interval: v === 'all' ? '' : v })}>
                      <SelectTrigger className="w-36 text-sm h-10 lg:h-11">
                        <SelectValue placeholder="All intervals" />
                      </SelectTrigger>
                      <SelectContent className="p-1">
                        <SelectItem value="all">All Intervals</SelectItem>
                        {Object.values(PlanInterval).map(iv => (
                          <SelectItem key={iv} value={iv}>{INTERVAL_LABELS[iv]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Start Date with Shadcn Calendar - Fixed asChild issue */}
                    <Popover open={localStartOpen} onOpenChange={setLocalStartOpen}>
                      <PopoverTrigger>
                        <Button variant="outline" className={cn("flex-1 text-sm font-normal justify-start", !d.startsAt && "text-gray-500")}>
                          <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4" />
                          {d.startsAt ? format(new Date(d.startsAt), "dd MMM yyyy") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={d.startsAt ? new Date(d.startsAt) : undefined}
                          onSelect={(date) => {
                            updateDiscount(i, { startsAt: date ? format(date, 'yyyy-MM-dd') : '' });
                            setLocalStartOpen(false);
                          }}
                          className="dark:bg-gray-900"
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>

                    {/* End Date with Shadcn Calendar - Fixed asChild issue */}
                    <Popover open={localEndOpen} onOpenChange={setLocalEndOpen}>
                      <PopoverTrigger>
                        <Button variant="outline" className={cn("flex-1 text-sm font-normal justify-start", !d.endsAt && "text-gray-500")}>
                          <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4" />
                          {d.endsAt ? format(new Date(d.endsAt), "dd MMM yyyy") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={d.endsAt ? new Date(d.endsAt) : undefined}
                          onSelect={(date) => {
                            updateDiscount(i, { endsAt: date ? format(date, 'yyyy-MM-dd') : '' });
                            setLocalEndOpen(false);
                          }}
                          className="dark:bg-gray-900"
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>

                    <Switch checked={d.isActive} onCheckedChange={v => updateDiscount(i, { isActive: v })} />
                    <Label className="text-xs shrink-0">Active</Label>
                    <Button variant="ghost" size="sm"
                      onClick={() => setDiscounts(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-600 px-2">
                      <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input value={d.description}
                    onChange={e => updateDiscount(i, { description: e.target.value })}
                    placeholder="Description (optional)" className="text-sm" />
                </div>
              );
            })}

            {/* Add new discount */}
            <div className="p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-gray-500">Add Discount</p>
              <div className="flex gap-2">
                <Input value={newDiscount.name}
                  onChange={e => setNewDiscount(p => ({ ...p, name: e.target.value }))}
                  placeholder="Name *" className="flex-1 text-sm" />
                <Select value={newDiscount.discountType}
                  onValueChange={v => v && setNewDiscount(p => ({ ...p, discountType: v as DiscountType }))}>
                  <SelectTrigger className="w-36 text-sm h-10 lg:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    <SelectItem value={DiscountType.PERCENTAGE}>Percentage %</SelectItem>
                    <SelectItem value={DiscountType.FIXED}>Fixed ₦</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={newDiscount.discountValue}
                  onChange={e => setNewDiscount(p => ({ ...p, discountValue: e.target.value }))}
                  placeholder="Value *" className="w-24 text-sm" type="number" />
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Select value={newDiscount.interval || 'all'}
                  onValueChange={v => v && setNewDiscount(p => ({ ...p, interval: v === 'all' ? '' : v }))}>
                  <SelectTrigger className="w-36 text-sm h-10 lg:h-11">
                    <SelectValue placeholder="All intervals" />
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    <SelectItem value="all">All Intervals</SelectItem>
                    {Object.values(PlanInterval).map(iv => (
                      <SelectItem key={iv} value={iv}>{INTERVAL_LABELS[iv]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* New Discount Start Date - Fixed asChild issue */}
                <Popover open={newStartsAtCalendarOpen} onOpenChange={setNewStartsAtCalendarOpen}>
                  <PopoverTrigger>
                    <Button variant="outline" className={cn("flex-1 text-sm font-normal justify-start h-10 lg:h-11 rounded-lg", !newDiscount.startsAt && "text-gray-500")}>
                      <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4" />
                      {newDiscount.startsAt ? format(new Date(newDiscount.startsAt), "dd MMM yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDiscount.startsAt ? new Date(newDiscount.startsAt) : undefined}
                      onSelect={(date) => setNewDiscount(p => ({ ...p, startsAt: date ? format(date, 'yyyy-MM-dd') : '' }))}
                      className="dark:bg-gray-900"
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>

                {/* New Discount End Date - Fixed asChild issue */}
                <Popover open={newEndsAtCalendarOpen} onOpenChange={setNewEndsAtCalendarOpen}>
                  <PopoverTrigger>
                    <Button variant="outline" className={cn("flex-1 text-sm font-normal justify-start h-10 lg:h-11 rounded-lg", !newDiscount.endsAt && "text-gray-500")}>
                      <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4" />
                      {newDiscount.endsAt ? format(new Date(newDiscount.endsAt), "dd MMM yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDiscount.endsAt ? new Date(newDiscount.endsAt) : undefined}
                      onSelect={(date) => setNewDiscount(p => ({ ...p, endsAt: date ? format(date, 'yyyy-MM-dd') : '' }))}
                      className="dark:bg-gray-900"
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>

                <Switch checked={newDiscount.isActive}
                  onCheckedChange={v => setNewDiscount(p => ({ ...p, isActive: v }))} />
                <Label className="text-xs shrink-0">Active</Label>
                <Button size="sm" onClick={() => {
                  if (!newDiscount.name.trim() || !newDiscount.discountValue) return;
                  setDiscounts(prev => [...prev, newDiscount]);
                  setNewDiscount({
                    name: '', description: '', discountType: DiscountType.PERCENTAGE,
                    discountValue: '', interval: '', startsAt: '', endsAt: '', isActive: true,
                  });
                }} className="px-6 h-10 lg:h-11 bg-blue-600 hover:bg-blue-700 text-white">
                  Add
                </Button>
              </div>
            </div>

            {discounts.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No discounts added yet</p>
            )}
          </div>
        )}

        {/* ── METADATA ──────────────────────────────────── */}
        {tab === 'metadata' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Arbitrary key-value data stored with the plan. Values are always stored as strings.
            </p>
            {metadata.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={m.key}
                  onChange={e => setMetadata(prev => prev.map((x, idx) => idx === i ? { ...x, key: e.target.value } : x))}
                  placeholder="Key" className="w-40 text-sm font-mono" />
                <Input value={m.value}
                  onChange={e => setMetadata(prev => prev.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                  placeholder="Value" className="flex-1 text-sm" />
                <Button variant="ghost" size="sm"
                  onClick={() => setMetadata(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-red-500 hover:text-red-600 px-2">
                  <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newMetaKey} onChange={e => setNewMetaKey(e.target.value)}
                placeholder="Key" className="w-40 text-sm font-mono" />
              <Input value={newMetaValue} onChange={e => setNewMetaValue(e.target.value)}
                placeholder="Value" className="flex-1 text-sm" />
              <Button size="sm" onClick={() => {
                if (!newMetaKey.trim()) return;
                setMetadata(prev => [...prev, { key: newMetaKey.trim(), value: newMetaValue }]);
                setNewMetaKey(''); setNewMetaValue('');
              }} className="px-6 h-10 lg:h-11 bg-blue-600 hover:bg-blue-700 text-white">
                Add
              </Button>
            </div>
            {metadata.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No metadata entries yet</p>
            )}
          </div>
        )}
      </div>
    </ReusableModal>
  );
}

// ─────────────────────────────────────────────────────────
// COUPON MANAGER MODAL
// ─────────────────────────────────────────────────────────

interface CouponManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  planSlug: string;
  planName: string;
}

function CouponManagerModal({ isOpen, onClose, planSlug, planName }: CouponManagerModalProps) {
  const { data: coupons, isLoading, refetch } = useGetCoupons(isOpen ? planSlug : null);
  const addCoupon = useAddCoupon();
  const removeCoupon = useRemoveCoupon();

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxRedemptions: undefined as number | undefined,
    minAmountKobo: undefined as number | undefined,
    applicableIntervals: [] as string[],
    expiresAt: '',
  });

  const [isAdding, setIsAdding] = useState(false);
  const [isExpiryCalendarOpen, setIsExpiryCalendarOpen] = useState(false);

  const handleAddCoupon = async () => {
    if (!newCoupon.code) {
      toast.error('Coupon code is required');
      return;
    }

    setIsAdding(true);
    try {
      await addCoupon.mutateAsync({
        slug: planSlug,
        coupon: {
          code: newCoupon.code,
          discountType: newCoupon.discountType,
          discountValue: newCoupon.discountValue,
          maxRedemptions: newCoupon.maxRedemptions,
          minAmountKobo: newCoupon.minAmountKobo,
          applicableIntervals: newCoupon.applicableIntervals as any[],
          expiresAt: newCoupon.expiresAt || undefined,
        },
      });
      setNewCoupon({
        code: '',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        maxRedemptions: undefined,
        minAmountKobo: undefined,
        applicableIntervals: [],
        expiresAt: '',
      });
      refetch();
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCoupon = async (code: string) => {
    await removeCoupon.mutateAsync({ slug: planSlug, couponCode: code });
    refetch();
  };

  const triggerClass = cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer",
    "dark:border-gray-800 dark:bg-gray-900 dark:text-white"
  );

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Coupons - ${planName}`}
      description="Manage discount coupons for this plan"
      size="lg"
      maxHeight="80vh"
    >
      <div className="space-y-6">
        <div className="space-y-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Add New Coupon</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Code *</Label>
              <Input
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Discount Type</Label>
              <Select
                value={newCoupon.discountType}
                onValueChange={(v) => setNewCoupon({ ...newCoupon, discountType: v as DiscountType })}
              >
                <SelectTrigger className="mt-1 w-full h-10 lg:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-1">
                  <SelectItem value={DiscountType.PERCENTAGE}>Percentage (%)</SelectItem>
                  <SelectItem value={DiscountType.FIXED}>Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Discount Value</Label>
              <Input
                type="number"
                value={newCoupon.discountValue}
                onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Max Redemptions</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                value={newCoupon.maxRedemptions || ''}
                onChange={(e) => setNewCoupon({ ...newCoupon, maxRedemptions: e.target.value ? parseInt(e.target.value) : undefined })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Min Order (Kobo)</Label>
              <Input
                type="number"
                placeholder="No minimum"
                value={newCoupon.minAmountKobo || ''}
                onChange={(e) => setNewCoupon({ ...newCoupon, minAmountKobo: e.target.value ? parseInt(e.target.value) : undefined })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Expires At</Label>
              <Popover open={isExpiryCalendarOpen} onOpenChange={setIsExpiryCalendarOpen}>
                <PopoverTrigger className={'w-full'}>
                  <Button variant="outline" className={cn("justify-start font-normal rounded-lg h-10 lg:h-11 mt-1 w-full", !newCoupon.expiresAt && "text-gray-500")}>
                    <HugeiconsIcon icon={CalendarIcon} className="mr-2 h-4 w-4" />
                    {newCoupon.expiresAt ? format(new Date(newCoupon.expiresAt), "dd MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
                  <Calendar
                    mode="single"
                    selected={newCoupon.expiresAt ? new Date(newCoupon.expiresAt) : undefined}
                    onSelect={(date) => {
                      setNewCoupon({ ...newCoupon, expiresAt: date ? format(date, 'yyyy-MM-dd') : '' });
                      setIsExpiryCalendarOpen(false);
                    }}
                    className="dark:bg-gray-900"
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button onClick={handleAddCoupon} disabled={isAdding || addCoupon.isPending} className="w-full bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 mt-2 rounded-lg">
            {isAdding && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
            Add Coupon
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Active Coupons ({coupons?.length || 0})
          </h4>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonLine key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : coupons?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HugeiconsIcon icon={TagIcon} className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No coupons yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {coupons?.map((coupon) => (
                <div key={coupon.code} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                        {coupon.code}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {coupon.discountType === DiscountType.PERCENTAGE ? `${coupon.discountValue}% OFF` : `${formatPrice(coupon.discountValue)} OFF`}
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      {coupon.maxRedemptions && (
                        <span>Used: {coupon.redemptionCount}/{coupon.maxRedemptions}</span>
                      )}
                      {coupon.expiresAt && (
                        <span>Expires: {formatDate(coupon.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCoupon(coupon.code)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ReusableModal>
  );
}

// ─────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <HugeiconsIcon icon={icon} className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BULK ACTIONS MODAL
// ─────────────────────────────────────────────────────────

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (action: 'activate' | 'deactivate' | 'delete') => void;
  isLoading: boolean;
}

function BulkActionsModal({ isOpen, onClose, selectedCount, onConfirm, isLoading }: BulkActionsModalProps) {
  const [action, setAction] = useState<'activate' | 'deactivate' | 'delete'>('activate');
  const { data: session } = authClient.useSession();
  const isSuperAdmin = session?.user?.role === 'superadmin';

  const getActionDetails = () => {
    switch (action) {
      case 'activate':
        return { label: 'Activate', variant: 'primary' as const, color: 'emerald' };
      case 'deactivate':
        return { label: 'Deactivate', variant: 'secondary' as const, color: 'amber' };
      case 'delete':
        return { label: 'Delete', variant: 'danger' as const, color: 'red' };
    }
  };

  const details = getActionDetails();

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      onAction={() => onConfirm(action)}
      title={`Bulk ${details.label} Plans`}
      description={`You are about to ${details.label.toLowerCase()} ${selectedCount} plan${selectedCount !== 1 ? 's' : ''}.`}
      actionLabel={`${details.label} ${selectedCount} Plan${selectedCount !== 1 ? 's' : ''}`}
      actionVariant={details.variant}
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold">Select Action</Label>
          <Select value={action} onValueChange={(v) => setAction(v as any)}>
            <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-1">
              <SelectItem value="activate">Activate Plans</SelectItem>
              <SelectItem value="deactivate">Deactivate Plans</SelectItem>
              {isSuperAdmin && (
                <SelectItem value="delete">Delete Plans (Superadmin only)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {action === 'delete' && (
          <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">
              Deleting plans is permanent and cannot be undone. This action requires superadmin privileges.
            </p>
          </div>
        )}
      </div>
    </ActionModal>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────

const PlansPage = () => {
  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role;
  const canManage = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  const [activeTab, setActiveTab] = useState<PlanTier>(PlanTier.FREE);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInterval, setSelectedInterval] = useState<PlanInterval | 'all'>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<IPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<IPlan | null>(null);

  // Query hooks
  const { 
    data, 
    isLoading, 
    isFetching,
    refetch 
  } = useGetPlans({
    ...(activeTab && { tier: activeTab }),
    ...(selectedInterval !== 'all' && { interval: selectedInterval }),
    ...(showActiveOnly && { isActive: true }),
    includeInactive: !showActiveOnly,
  });
  
  const { stats: planStats, isLoading: statsLoading } = usePlanStats();
  
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const activatePlan = useActivatePlan();
  const deactivatePlan = useDeactivatePlan();
  const bulkAction = useBulkAction();
  const bulkDelete = useBulkDelete();

  const plans = data?.plans || [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter plans by search
  const filteredPlans = plans.filter((plan) =>
    debouncedSearch
      ? plan.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        plan.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true
  );

  const displayPlans = filteredPlans;

  // Tab counts - only for the selected tier (since we removed "all")
  const tabCounts = {
    free: plans.filter(p => p.tier === PlanTier.FREE).length,
    starter: plans.filter(p => p.tier === PlanTier.STARTER).length,
    basic: plans.filter(p => p.tier === PlanTier.BASIC).length,
    pro: plans.filter(p => p.tier === PlanTier.PRO).length,
    business: plans.filter(p => p.tier === PlanTier.BUSINESS).length,
    enterprise: plans.filter(p => p.tier === PlanTier.ENTERPRISE).length,
  };

  const handleSelectPlan = (planId: string, checked: boolean) => {
    const newSet = new Set(selectedPlans);
    if (checked) {
      newSet.add(planId);
    } else {
      newSet.delete(planId);
    }
    setSelectedPlans(newSet);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const planIds = Array.from(selectedPlans);
    const slugs = displayPlans.filter(p => planIds.includes(p._id)).map(p => p.slug);

    if (action === 'delete') {
      if (!isSuperAdmin) {
        toast.error('Only superadmins can delete plans');
        return;
      }
      await bulkDelete.mutateAsync({ slugs });
    } else {
      await bulkAction.mutateAsync({ action, slugs });
    }

    setSelectedPlans(new Set());
    setIsBulkActionsModalOpen(false);
    refetch();
  };

  const handleTogglePlanActive = async (plan: IPlan) => {
    if (plan.isActive) {
      await deactivatePlan.mutateAsync(plan.slug);
    } else {
      await activatePlan.mutateAsync(plan.slug);
    }
    refetch();
  };

  const handleDeletePlan = async () => {
    if (planToDelete) {
      if (!isSuperAdmin) {
        toast.error('Only superadmins can delete plans');
        return;
      }
      await deletePlan.mutateAsync(planToDelete.slug);
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
      refetch();
    }
  };

  const selectedCount = selectedPlans.size;
  const showSkeleton = isLoading || (isFetching && plans.length === 0);
  const showEmpty = !isLoading && !isFetching && displayPlans.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plans Management</h1>
              {planStats.total > 0 && !statsLoading && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {planStats.total} total
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage subscription plans, pricing, features, and discounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="dark:border-gray-700 h-10 lg:h-11"
            >
              <HugeiconsIcon icon={RefreshIcon} className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
              Refresh
            </Button>
            {canManage && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-4">
                <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {planStats.total > 0 && !statsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Total Plans" value={planStats.total} icon={LayersIcon} />
            <StatCard label="Active Plans" value={planStats.active} icon={CheckmarkCircle02Icon} />
            <StatCard label="Free Plans" value={planStats.free} icon={Money01Icon} />
            <StatCard label="Paid Plans" value={planStats.paid} icon={Money01Icon} />
            <StatCard label="Monthly Plans" value={planStats.byInterval.monthly} icon={CalendarIcon} />
            <StatCard label="Annual Plans" value={planStats.byInterval.annual} icon={CalendarIcon} />
          </div>
        )}

        {/* Tabs - Starting from Free, no "All" tab */}
        <div className="flex flex-wrap gap-3 items-center">
          {TIER_ORDER.map((tier) => (
            <TabButton
              key={tier}
              label={TIER_LABELS[tier]}
              count={tabCounts[tier]}
              isActive={activeTab === tier}
              onClick={() => setActiveTab(tier)}
            />
          ))}
          {isFetching && !isLoading && (
            <div className="flex items-center gap-1.5 ml-2">
              <HugeiconsIcon icon={RefreshIcon} className="h-3.5 w-3.5 animate-spin text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search plans by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 dark:bg-gray-900 dark:border-gray-800"
            />
          </div>

          <Select 
            value={selectedInterval === 'all' ? 'all' : selectedInterval} 
            onValueChange={(v) => setSelectedInterval(v === 'all' ? 'all' : v as PlanInterval)}
          >
            <SelectTrigger className="w-36 h-10 lg:h-11">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5" />
                <SelectValue placeholder="Interval" />
              </div>
            </SelectTrigger>
            <SelectContent className="p-1">
              <SelectItem value="all">All Intervals</SelectItem>
              {Object.values(PlanInterval).map((interval) => (
                <SelectItem key={interval} value={interval}>
                  {INTERVAL_LABELS[interval]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
              id="show-active"
            />
            <Label htmlFor="show-active" className="text-sm cursor-pointer">
              Active only
            </Label>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && !showSkeleton && canManage && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                {selectedCount}
              </span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                plan{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlans(new Set())}
                className="border-blue-200 dark:border-blue-800"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsBulkActionsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Bulk Actions
              </Button>
            </div>
          </div>
        )}

        {/* Plans Grid - Simple grid view since we're always on a single tier */}
        <div className="relative">
          {showSkeleton ? (
            <PlansSkeleton />
          ) : showEmpty ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={LayersIcon} className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No plans found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {search || selectedInterval !== 'all'
                  ? 'Try adjusting your filters'
                  : `No ${TIER_LABELS[activeTab]} plans available`}
              </p>
              {canManage && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 p-3">
                  <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              )}
            </div>
          ) : (
            <>
              {isFetching && plans.length > 0 && (
                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading plans...</span>
                  </div>
                </div>
              )}
              
              {/* Grid view for the selected tier */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayPlans.map((plan) => (
                  <PlanCard
                    key={plan._id}
                    plan={plan}
                    isSelected={selectedPlans.has(plan._id)}
                    onSelect={(checked) => handleSelectPlan(plan._id, checked)}
                    onEdit={() => {
                      setSelectedPlan(plan);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={() => {
                      setPlanToDelete(plan);
                      setIsDeleteModalOpen(true);
                    }}
                    onToggleActive={() => handleTogglePlanActive(plan)}
                    onManageCoupons={() => {
                      setSelectedPlan(plan);
                      setIsCouponModalOpen(true);
                    }}
                    canManage={canManage}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {canManage && (
        <>
          <PlanFormModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={async (data) => {
              await createPlan.mutateAsync(data);
              refetch();
            }}
            isLoading={createPlan.isPending}
          />

          <PlanFormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
            onSubmit={async (data) => {
              if (selectedPlan) {
                await updatePlan.mutateAsync({ slug: selectedPlan.slug, updates: data });
                refetch();
              }
            }}
            isLoading={updatePlan.isPending}
          />

          {selectedPlan && (
            <CouponManagerModal
              isOpen={isCouponModalOpen}
              onClose={() => {
                setIsCouponModalOpen(false);
                setSelectedPlan(null);
              }}
              planSlug={selectedPlan.slug}
              planName={selectedPlan.name}
            />
          )}

          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setPlanToDelete(null);
            }}
            onConfirm={handleDeletePlan}
            title="Delete Plan"
            description={`Are you sure you want to delete "${planToDelete?.name}"? This action cannot be undone.`}
            confirmLabel="Delete Plan"
            confirmVariant="danger"
            isLoading={deletePlan.isPending}
          />

          <BulkActionsModal
            isOpen={isBulkActionsModalOpen}
            onClose={() => setIsBulkActionsModalOpen(false)}
            selectedCount={selectedCount}
            onConfirm={handleBulkAction}
            isLoading={bulkAction.isPending || bulkDelete.isPending}
          />
        </>
      )}
    </div>
  );
};

export default PlansPage;