// plans-modals.tsx
import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  PlusSignIcon as PlusIcon,
  Delete03Icon as TrashIcon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReusableModal, ActionModal } from '@/components/ui/reusable-modal';

import { formatPrice, CURRENCY_OPTIONS } from './plans-types';
import type { IPlan, IPlanTier, IPlanInterval, CreatePlanParams, CreateTierParams, CreateIntervalParams, IPlanFeature } from '@/hooks/use-plans';

// ─── Plan Form Modal ─────────────────────────────────────────────────────────
interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: IPlan | null;
  tiers: IPlanTier[];
  intervals: IPlanInterval[];
  onSubmit: (data: CreatePlanParams) => Promise<void>;
  isLoading: boolean;
  totalPlans?: number;
}

export function PlanFormModal({ isOpen, onClose, plan, tiers, intervals, onSubmit, isLoading, totalPlans = 0 }: PlanFormModalProps) {

  const isEdit = !!plan;

  // Basic fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [selectedIntervalId, setSelectedIntervalId] = useState('');
  const [priceKobo, setPriceKobo] = useState('0');
  const [currency, setCurrency] = useState('NGN');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [trialDays, setTrialDays] = useState('0');
  const [sortOrder, setSortOrder] = useState('0');

  // Limit fields
  const [maxEvents, setMaxEvents] = useState('');
  const [maxAttendeesPerEvent, setMaxAttendeesPerEvent] = useState('');
  const [maxTeamMembers, setMaxTeamMembers] = useState('');
  const [storageGb, setStorageGb] = useState('');

  // Features
  const [features, setFeatures] = useState<IPlanFeature[]>([]);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');
  const [newFeatureLimit, setNewFeatureLimit] = useState('');
  const [newFeatureUnit, setNewFeatureUnit] = useState('');
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);

  // Discounts
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountInterval, setDiscountInterval] = useState('');
  const [discountStartsAt, setDiscountStartsAt] = useState('');
  const [discountEndsAt, setDiscountEndsAt] = useState('');
  const [discounts, setDiscounts] = useState<any[]>([]);

  // ── Populate / reset on open ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (plan) {
      setName(plan.name);
      setSlug(plan.slug);
      setSelectedTierId(plan.tierId?._id || '');
      setSelectedIntervalId(plan.intervalId?._id || '');
      setPriceKobo(String(plan.priceKobo));
      setCurrency(plan.currency || 'NGN');
      setDescription(plan.description || '');
      setIsActive(plan.isActive);
      setIsPublic(plan.isPublic);
      setTrialDays(String(plan.trialDays || 0));
      setSortOrder(String(plan.sortOrder || 0));
      setMaxEvents(plan.maxEvents !== undefined && plan.maxEvents !== null ? String(plan.maxEvents) : '');
      setMaxAttendeesPerEvent(plan.maxAttendeesPerEvent !== undefined && plan.maxAttendeesPerEvent !== null ? String(plan.maxAttendeesPerEvent) : '');
      setMaxTeamMembers(plan.maxTeamMembers !== undefined && plan.maxTeamMembers !== null ? String(plan.maxTeamMembers) : '');
      setStorageGb(plan.storageGb !== undefined && plan.storageGb !== null ? String(plan.storageGb) : '');
      setFeatures(plan.features || []);
      setDiscounts(plan.discounts || []);
    } else {
      setName('');
      setSlug('');
      setSelectedTierId('');
      setSelectedIntervalId('');
      setPriceKobo('0');
      setCurrency('NGN');
      setDescription('');
      setIsActive(true);
      setIsPublic(true);
      setTrialDays('0');
      setSortOrder(String(Math.max(0, totalPlans - 1)));
      setMaxEvents('');
      setMaxAttendeesPerEvent('');
      setMaxTeamMembers('');
      setStorageGb('');
      setFeatures([]);
      setDiscounts([]);
    }
  }, [isOpen, plan, tiers, intervals]);

  // ── Auto-generate name & slug from tier + interval (create mode only) ──────
  useEffect(() => {
    if (isEdit) return;
    if (!selectedTierId) return;

    const tier = tiers.find(t => t._id === selectedTierId);
    if (!tier) return;

    const isFree = tier.name.toLowerCase() === 'free';

    if (isFree) {
      // Free plans: name is always just "Free", interval doesn't affect it
      setName('Free');
      setSlug('free');
    } else {
      const interval = intervals.find(i => i._id === selectedIntervalId);
      if (interval) {
        const generatedName = `${tier.name} ${interval.name}`;
        setName(generatedName);
        setSlug(generateSlug(generatedName));
      } else {
        // Interval not yet selected — use tier name only as placeholder
        setName(tier.name);
        setSlug(generateSlug(tier.name));
      }
    }
  }, [selectedTierId, selectedIntervalId, isEdit]);

  const generateSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (n: string) => {
    setName(n);
    if (!isEdit) setSlug(generateSlug(n));
  };

  // ── Feature management ─────────────────────────────────────────────────────
  const addFeature = () => {
    if (!newFeatureName.trim()) {
      toast.error('Feature name is required');
      return;
    }

    const newFeature: IPlanFeature = {
      name: newFeatureName.trim(),
      description: newFeatureDescription || undefined,
      included: true,
      limit: newFeatureLimit ? parseFloat(newFeatureLimit) : undefined,
      unit: newFeatureUnit || undefined,
    };

    if (editingFeatureIndex !== null) {
      const updated = [...features];
      updated[editingFeatureIndex] = newFeature;
      setFeatures(updated);
      setEditingFeatureIndex(null);
    } else {
      setFeatures([...features, newFeature]);
    }

    setNewFeatureName('');
    setNewFeatureDescription('');
    setNewFeatureLimit('');
    setNewFeatureUnit('');
  };

  const editFeature = (index: number) => {
    const feature = features[index];
    setNewFeatureName(feature.name);
    setNewFeatureDescription(feature.description || '');
    setNewFeatureLimit(feature.limit !== undefined ? String(feature.limit) : '');
    setNewFeatureUnit(feature.unit || '');
    setEditingFeatureIndex(index);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
    if (editingFeatureIndex === index) {
      setEditingFeatureIndex(null);
      setNewFeatureName('');
      setNewFeatureDescription('');
      setNewFeatureLimit('');
      setNewFeatureUnit('');
    }
  };

  // ── Discount management ────────────────────────────────────────────────────
  const addDiscount = () => {
    if (!discountName.trim()) {
      toast.error('Discount name is required');
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    const newDiscount = {
      name: discountName.trim(),
      description: undefined,
      discountType: discountType,
      discountValue: parseFloat(discountValue),
      interval: discountInterval || undefined,
      startsAt: discountStartsAt ? new Date(discountStartsAt) : undefined,
      endsAt: discountEndsAt ? new Date(discountEndsAt) : undefined,
      isActive: true,
    };

    setDiscounts([...discounts, newDiscount]);
    setDiscountName('');
    setDiscountValue('');
    setDiscountInterval('');
    setDiscountStartsAt('');
    setDiscountEndsAt('');
  };

  const removeDiscount = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    if (!selectedTierId) {
      toast.error('Please select a tier');
      return;
    }

    if (!selectedIntervalId) {
      toast.error('Please select a billing interval');
      return;
    }

    const parseLimit = (value: string): number | undefined => {
      if (!value || value === '') return undefined;
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    };

    const payload: CreatePlanParams = {
      name: name.trim(),
      slug: slug.trim(),
      tierId: selectedTierId,
      intervalId: selectedIntervalId,
      priceKobo: Math.max(0, parseInt(priceKobo) || 0),
      currency: currency || 'NGN',
      description: description || undefined,
      isActive,
      isPublic,
      trialDays: Math.max(0, parseInt(trialDays) || 0),
      sortOrder: parseInt(sortOrder) || 0,
      maxEvents: parseLimit(maxEvents),
      maxAttendeesPerEvent: parseLimit(maxAttendeesPerEvent),
      maxTeamMembers: parseLimit(maxTeamMembers),
      storageGb: parseLimit(storageGb),
      features: features.filter(f => f.name.trim()),
      discounts: discounts,
    };

    await onSubmit(payload);
    onClose();
  };

  const selectedTierObj = tiers.find(t => t._id === selectedTierId);
  const selectedIntervalObj = intervals.find(i => i._id === selectedIntervalId);
  const isEditingFeature = editingFeatureIndex !== null;

  return (
    <ReusableModal
      closeOnOutsideClick={false}
      closeOnEscape={false}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit — ${plan!.name}` : 'Create New Plan'}
      description={isEdit ? 'Update plan details' : 'Configure a new subscription plan'}
      size="xl"
      maxHeight="85vh"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline', disabled: isLoading },
        { label: isEdit ? 'Save Changes' : 'Create Plan', onClick: handleSubmit, variant: 'primary', loading: isLoading },
      ]}
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto px-2">

        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Basic Information
          </h3>

          {/* ── Tier & Interval FIRST ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Tier *</Label>
              <Select value={selectedTierId} onValueChange={(v) => setSelectedTierId(v ?? '')}>
                <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                  <SelectValue placeholder="Select tier">
                    {selectedTierObj && selectedTierObj.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-1">
                  {tiers.filter(t => t.isActive).map(tier => (
                    <SelectItem key={tier._id} value={tier._id}>
                      {tier.name} {tier.planCount !== undefined && tier.planCount > 0 ? `(${tier.planCount} plans)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">
                Billing Interval {selectedTierObj?.name?.toLowerCase() !== 'free' ? '*' : '(optional for free)'}
              </Label>
              <Select
                value={selectedIntervalId}
                onValueChange={(v) => setSelectedIntervalId(v ?? '')}
              >
                <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                  <SelectValue placeholder="Select interval">
                    {selectedIntervalObj && selectedIntervalObj.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-1">
                  {intervals.filter(i => i.isActive).map(interval => (
                    <SelectItem key={interval._id} value={interval._id}>
                      {interval.name} ({interval.monthsCount} months, {interval.multiplier}x)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTierObj?.name?.toLowerCase() === 'free' && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Interval won't appear in the plan name or slug for free plans
                </p>
              )}
            </div>
          </div>

          {/* ── Name & Slug SECOND — auto-filled, editable ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Plan Name *</Label>
              <Input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Select tier and interval above…"
                className="mt-1.5"
              />
              {!isEdit && (
                <p className="text-[10px] text-gray-400 mt-1">Auto-filled from tier + interval, editable</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold">Slug *</Label>
              <Input
                value={slug}
                onChange={e => setSlug(generateSlug(e.target.value))}
                placeholder="e.g. pro-monthly"
                className="mt-1.5"
                disabled={isEdit}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the plan's value proposition…" className="mt-1.5" rows={2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold">Price (Kobo)</Label>
              <Input type="number" min={0} value={priceKobo}
                onChange={e => setPriceKobo(e.target.value)} className="mt-1.5" />
              <p className="text-[10px] text-gray-400 mt-1">
                = {formatPrice(parseInt(priceKobo) || 0, currency)}
              </p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v ?? 'NGN')}>
                <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-1">
                  {CURRENCY_OPTIONS.map(curr => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Trial Days</Label>
              <Input type="number" min={0} value={trialDays}
                onChange={e => setTrialDays(e.target.value)} className="mt-1.5" />
              <p className="text-[10px] text-gray-400 mt-1">0 = no trial period</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Sort Order</Label>
              <Input type="number" min={0} value={sortOrder}
                onChange={e => setSortOrder(e.target.value)} className="mt-1.5" />
              <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
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

        {/* Limits Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Plan Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Max Events</Label>
              <Input
                type="number"
                min={0}
                value={maxEvents}
                onChange={e => setMaxEvents(e.target.value)}
                placeholder="Leave empty for unlimited"
                className="mt-1.5"
              />
              <p className="text-[10px] text-gray-400 mt-1">Maximum number of events allowed</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Max Attendees Per Event</Label>
              <Input
                type="number"
                min={0}
                value={maxAttendeesPerEvent}
                onChange={e => setMaxAttendeesPerEvent(e.target.value)}
                placeholder="Leave empty for unlimited"
                className="mt-1.5"
              />
              <p className="text-[10px] text-gray-400 mt-1">Maximum attendees per single event</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Max Team Members</Label>
              <Input
                type="number"
                min={0}
                value={maxTeamMembers}
                onChange={e => setMaxTeamMembers(e.target.value)}
                placeholder="Leave empty for unlimited"
                className="mt-1.5"
              />
              <p className="text-[10px] text-gray-400 mt-1">Number of team members allowed</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Storage (GB)</Label>
              <Input
                type="number"
                min={0}
                step={'any'}
                value={storageGb}
                onChange={e => setStorageGb(e.target.value)}
                placeholder="Leave empty for unlimited"
                className="mt-1.5"
              />
              <p className="text-[10px] text-gray-400 mt-1">Storage space in gigabytes</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Plan Features
          </h3>

          {features.length > 0 && (
            <div className="space-y-2 mb-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{feature.name}</span>
                      {feature.limit !== undefined && feature.limit > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          Limit: {feature.limit} {feature.unit || ''}
                        </Badge>
                      )}
                    </div>
                    {feature.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{feature.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => editFeature(idx)}
                      className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-xs text-blue-600 dark:text-blue-400">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <HugeiconsIcon icon={TrashIcon} className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {isEditingFeature ? 'Edit Feature' : 'Add New Feature'}
            </p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Feature Name</Label>
                <Input
                  value={newFeatureName}
                  onChange={e => setNewFeatureName(e.target.value)}
                  placeholder="e.g., Custom Domain, API Access"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Description (Optional)</Label>
                <Input
                  value={newFeatureDescription}
                  onChange={e => setNewFeatureDescription(e.target.value)}
                  placeholder="Brief description of this feature"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Limit (Optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={'any'}
                    value={newFeatureLimit}
                    onChange={e => setNewFeatureLimit(e.target.value)}
                    placeholder="e.g., 5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Unit (Optional)</Label>
                  <Input
                    value={newFeatureUnit}
                    onChange={e => setNewFeatureUnit(e.target.value)}
                    placeholder="e.g., GB, seats, domains"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={addFeature}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <HugeiconsIcon icon={PlusIcon} className="h-3.5 w-3.5 mr-1" />
                  {isEditingFeature ? 'Update Feature' : 'Add Feature'}
                </Button>
                {isEditingFeature && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingFeatureIndex(null);
                      setNewFeatureName('');
                      setNewFeatureDescription('');
                      setNewFeatureLimit('');
                      setNewFeatureUnit('');
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Discounts Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            Discounts
          </h3>

          {discounts.length > 0 && (
            <div className="space-y-2 mb-4">
              {discounts.map((discount, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{discount.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {discount.discountType === 'percentage' ? `${discount.discountValue}% off` : `${formatPrice(discount.discountValue * 100)} off`}
                      {discount.interval && ` • ${discount.interval}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDiscount(idx)}
                    className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <HugeiconsIcon icon={TrashIcon} className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Add Discount</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Discount Name</Label>
                <Input
                  value={discountName}
                  onChange={e => setDiscountName(e.target.value)}
                  placeholder="e.g., Early Bird Special"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Discount Type</Label>
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Discount Value</Label>
                <Input
                  type="number"
                  min={0}
                  step={discountType === 'percentage' ? 1 : 100}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 5000'}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Applicable Interval (Optional)</Label>
                <Input
                  value={discountInterval}
                  onChange={e => setDiscountInterval(e.target.value)}
                  placeholder="e.g., monthly, annual"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                onClick={addDiscount}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!discountName || !discountValue}
              >
                <HugeiconsIcon icon={PlusIcon} className="h-3.5 w-3.5 mr-1" />
                Add Discount
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ReusableModal>
  );
}

// ─── Tier Form Modal ─────────────────────────────────────────────────────────
interface TierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier?: IPlanTier | null;
  onSubmit: (data: CreateTierParams) => Promise<void>;
  isLoading: boolean;
}

export function TierFormModal({ isOpen, onClose, tier, onSubmit, isLoading }: TierFormModalProps) {
  const isEdit = !!tier;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (tier) {
      setName(tier.name);
      setDescription(tier.description || '');
      setSortOrder(String(tier.sortOrder));
      setIsActive(tier.isActive);
    } else {
      setName('');
      setDescription('');
      setSortOrder('0');
      setIsActive(true);
    }
  }, [isOpen, tier]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Tier name is required');
      return;
    }
    await onSubmit({
      name: name.trim(),
      description: description || undefined,
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
    });
    onClose();
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Tier — ${tier!.name}` : 'Create New Tier'}
      description="Tiers represent different plan levels (Free, Pro, Enterprise, etc.)"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline', disabled: isLoading },
        { label: isEdit ? 'Save Changes' : 'Create Tier', onClick: handleSubmit, variant: 'primary', loading: isLoading },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold">Tier Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Premium, Ultimate, Gold" className="mt-1.5" />
          <p className="text-[10px] text-gray-400 mt-1">Examples: Free, Basic, Pro, Premium, Platinum, Enterprise</p>
        </div>
        <div>
          <Label className="text-xs font-semibold">Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe this tier..." className="mt-1.5" rows={2} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Sort Order</Label>
          <Input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            placeholder="0" className="mt-1.5" />
          <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first (e.g., Free=1, Basic=2, Pro=3)</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="tier-active" />
          <Label htmlFor="tier-active" className="text-sm cursor-pointer">Active</Label>
        </div>
      </div>
    </ReusableModal>
  );
}

// ─── Interval Form Modal ─────────────────────────────────────────────────────
interface IntervalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  interval?: IPlanInterval | null;
  onSubmit: (data: CreateIntervalParams) => Promise<void>;
  isLoading: boolean;
}

export function IntervalFormModal({ isOpen, onClose, interval, onSubmit, isLoading }: IntervalFormModalProps) {
  const isEdit = !!interval;
  const [name, setName] = useState('');
  const [monthsCount, setMonthsCount] = useState('1');
  const [multiplier, setMultiplier] = useState('1');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (interval) {
      setName(interval.name);
      setMonthsCount(String(interval.monthsCount));
      setMultiplier(String(interval.multiplier));
      setSortOrder(String(interval.sortOrder));
      setIsActive(interval.isActive);
    } else {
      setName('');
      setMonthsCount('1');
      setMultiplier('1');
      setSortOrder('0');
      setIsActive(true);
    }
  }, [isOpen, interval]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Interval name is required');
      return;
    }
    const months = parseFloat(monthsCount);
    const mult = parseFloat(multiplier);
    if (isNaN(months) || months < 0) {
      toast.error('Months count must be a valid number');
      return;
    }
    if (isNaN(mult) || mult < 0) {
      toast.error('Multiplier must be a valid number');
      return;
    }
    await onSubmit({
      name: name.trim(),
      monthsCount: months,
      multiplier: mult,
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
    });
    onClose();
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Interval — ${interval!.name}` : 'Create New Interval'}
      description="Intervals represent billing cycles (Monthly, Quarterly, Annual, etc.)"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline', disabled: isLoading },
        { label: isEdit ? 'Save Changes' : 'Create Interval', onClick: handleSubmit, variant: 'primary', loading: isLoading },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold">Interval Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Weekly, Monthly, Quarterly, Annual" className="mt-1.5" />
          <p className="text-[10px] text-gray-400 mt-1">Examples: Monthly, Quarterly, Biannual, Annual, Lifetime</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Months Count *</Label>
            <Input type="number" step="0.01" min={0} value={monthsCount} onChange={e => setMonthsCount(e.target.value)}
              placeholder="1" className="mt-1.5" />
            <p className="text-[10px] text-gray-400 mt-1">e.g., 1 for monthly, 3 for quarterly, 12 for annual</p>
          </div>
          <div>
            <Label className="text-xs font-semibold">Price Multiplier *</Label>
            <Input type="number" step="0.01" min={0} value={multiplier} onChange={e => setMultiplier(e.target.value)}
              placeholder="1" className="mt-1.5" />
            <p className="text-[10px] text-gray-400 mt-1">Price relative to monthly base (e.g., annual = 9.6 for 20% savings)</p>
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Sort Order</Label>
          <Input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            placeholder="0" className="mt-1.5" />
          <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first (monthly should be first)</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="interval-active" />
          <Label htmlFor="interval-active" className="text-sm cursor-pointer">Active</Label>
        </div>
      </div>
    </ReusableModal>
  );
}

// ─── Bulk Actions Modal ──────────────────────────────────────────────────────
interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (action: 'activate' | 'deactivate' | 'delete') => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
}

export function BulkActionsModal({ isOpen, onClose, selectedCount, onConfirm, isLoading, isSuperAdmin }: BulkActionsModalProps) {
  const [action, setAction] = useState<'activate' | 'deactivate' | 'delete'>('activate');

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      onAction={() => onConfirm(action)}
      title={`Bulk ${action === 'activate' ? 'Activate' : action === 'deactivate' ? 'Deactivate' : 'Delete'} Plans`}
      description={`You are about to ${action} ${selectedCount} plan${selectedCount !== 1 ? 's' : ''}.`}
      actionLabel={`${action === 'activate' ? 'Activate' : action === 'deactivate' ? 'Deactivate' : 'Delete'} ${selectedCount} Plan${selectedCount !== 1 ? 's' : ''}`}
      actionVariant={action === 'delete' ? 'danger' : 'primary'}
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