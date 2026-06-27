
'use client';

import { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlusSignIcon as PlusIcon,
  RefreshIcon,
  Search01Icon,
  CalendarIcon,
  CheckmarkCircle02Icon,
  LayersIcon,
  Money01Icon,
  ArrangeIcon as CategoryIcon,
  ClockIcon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmModal } from '@/components/ui/reusable-modal';
import { authClient } from '@/lib/auth/auth-client';

import {
  useGetPlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useGetTiers,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
  useGetIntervals,
  useCreateInterval,
  useUpdateInterval,
  useDeleteInterval,
  useBulkAction,
  useBulkDelete,
} from '@/hooks/use-plans';

import { ManagementTab } from './plans-types';
import { formatPrice } from './plans-types';
import { PlansSkeleton, TiersSkeleton, IntervalsSkeleton } from './plans-skeletons';
import { TabButton, StatCard, PlanCard } from './plans-components';
import { TierCard, IntervalCard } from './plans-card-components';
import { PlanFormModal, TierFormModal, IntervalFormModal, BulkActionsModal } from './plans-modals';
import { getEmptyStateGuidance, PlansEmptyState } from './plans-empty-state';

export default function PlansManagementPage() {
  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role;
  const canManage = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  const [activeTab, setActiveTab] = useState<ManagementTab>('plans');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInterval, setSelectedInterval] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());

  // Modal states
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isCreateTierModalOpen, setIsCreateTierModalOpen] = useState(false);
  const [isEditTierModalOpen, setIsEditTierModalOpen] = useState(false);
  const [isCreateIntervalModalOpen, setIsCreateIntervalModalOpen] = useState(false);
  const [isEditIntervalModalOpen, setIsEditIntervalModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [selectedIntervalItem, setSelectedIntervalItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'plan' | 'tier' | 'interval'; id: string; name: string } | null>(null);

  // Query hooks
  const { data: plansData, isLoading: plansLoading, isFetching, refetch: refetchPlans } = useGetPlans({
    ...(showActiveOnly && { isActive: true }),
    includeInactive: !showActiveOnly,
  });
  
  const { data: tiersData, isLoading: tiersLoading, refetch: refetchTiers } = useGetTiers();
  const { data: intervalsData, isLoading: intervalsLoading, refetch: refetchIntervals } = useGetIntervals();
  
  // Mutation hooks
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const createTier = useCreateTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();
  const createInterval = useCreateInterval();
  const updateInterval = useUpdateInterval();
  const deleteInterval = useDeleteInterval();
  const bulkAction = useBulkAction();
  const bulkDelete = useBulkDelete();

  const plans = plansData?.plans || [];
  const tiers = tiersData || [];
  const intervals = intervalsData || [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter plans by search
  const filteredPlans = plans.filter((plan: any) =>
    debouncedSearch
      ? plan.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        plan.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true
  );

  // Filter by interval
  const displayPlans = selectedInterval === 'all' 
    ? filteredPlans 
    : filteredPlans.filter((p: any) => p.interval === selectedInterval);

  const handleSelectPlan = (planId: string, checked: boolean) => {
    const newSet = new Set(selectedPlans);
    if (checked) newSet.add(planId);
    else newSet.delete(planId);
    setSelectedPlans(newSet);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const planIds = Array.from(selectedPlans);
    const slugs = displayPlans.filter((p: any) => planIds.includes(p._id)).map((p: any) => p.slug);

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
    refetchPlans();
  };

  const handleTogglePlanActive = async (plan: any) => {
    if (plan.isActive) {
      await updatePlan.mutateAsync({ id: plan._id, updates: { isActive: false } });
    } else {
      await updatePlan.mutateAsync({ id: plan._id, updates: { isActive: true } });
    }
    refetchPlans();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'plan') {
      await deletePlan.mutateAsync(deleteTarget.id);
      refetchPlans();
    } else if (deleteTarget.type === 'tier') {
      await deleteTier.mutateAsync(deleteTarget.id);
      refetchTiers();
      refetchPlans();
    } else if (deleteTarget.type === 'interval') {
      await deleteInterval.mutateAsync(deleteTarget.id);
      refetchIntervals();
      refetchPlans();
    }
    
    setIsDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleToggleTierActive = async (tier: any) => {
    await updateTier.mutateAsync({ id: tier._id, isActive: !tier.isActive });
    refetchTiers();
    refetchPlans();
  };

  const handleToggleIntervalActive = async (interval: any) => {
    await updateInterval.mutateAsync({ id: interval._id, isActive: !interval.isActive });
    refetchIntervals();
    refetchPlans();
  };

  const selectedCount = selectedPlans.size;
  const showPlansSkeleton = plansLoading || (isFetching && plans.length === 0);
  const showTiersSkeleton = tiersLoading;
  const showIntervalsSkeleton = intervalsLoading;

  // Get unique intervals for filter
  const uniqueIntervals = [...new Set(plans.map((p: any) => p.interval))];

  // Empty state guidance
  const plansGuidance = getEmptyStateGuidance('plans', plans.length, tiers.length, intervals.length, canManage);
  const tiersGuidance = getEmptyStateGuidance('tiers', plans.length, tiers.length, intervals.length, canManage);
  const intervalsGuidance = getEmptyStateGuidance('intervals', plans.length, tiers.length, intervals.length, canManage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plans Management</h1>
              {plans.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {plans.length} plans
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage subscription plans, tiers, billing intervals, and pricing
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                refetchPlans();
                refetchTiers();
                refetchIntervals();
              }}
              disabled={isFetching}
              className="dark:border-gray-700 h-10 lg:h-11"
            >
              <HugeiconsIcon icon={RefreshIcon} className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
              Refresh
            </Button>
            {canManage && activeTab === 'plans' && plans.length > 0 && (
              <Button onClick={() => setIsCreatePlanModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-4">
                <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            )}
            {canManage && activeTab === 'tiers' && (
              <Button onClick={() => setIsCreateTierModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-4">
                <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                Create Tier
              </Button>
            )}
            {canManage && activeTab === 'intervals' && (
              <Button onClick={() => setIsCreateIntervalModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-4">
                <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                Create Interval
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards - Only for Plans Tab */}
        {activeTab === 'plans' && plans.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Total Plans" value={plans.length} icon={LayersIcon} color="blue" />
            <StatCard label="Active Plans" value={plans.filter((p: any) => p.isActive).length} icon={CheckmarkCircle02Icon} color="green" />
            <StatCard label="Free Plans" value={plans.filter((p: any) => p.isFree).length} icon={Money01Icon} color="emerald" />
            <StatCard label="Paid Plans" value={plans.filter((p: any) => !p.isFree).length} icon={Money01Icon} color="purple" />
            <StatCard label="Tiers" value={tiers.length} icon={CategoryIcon} color="orange" />
            <StatCard label="Intervals" value={intervals.length} icon={ClockIcon} color="teal" />
          </div>
        )}

        {/* Main Tabs */}
        <div className="flex flex-wrap gap-3 items-center">
          <TabButton
            label="Plans"
            count={plans.length}
            isActive={activeTab === 'plans'}
            onClick={() => setActiveTab('plans')}
          />
          <TabButton
            label="Tiers"
            count={tiers.length}
            isActive={activeTab === 'tiers'}
            onClick={() => setActiveTab('tiers')}
          />
          <TabButton
            label="Intervals"
            count={intervals.length}
            isActive={activeTab === 'intervals'}
            onClick={() => setActiveTab('intervals')}
          />
        </div>

        {/* ==================== PLANS TAB ==================== */}
        {activeTab === 'plans' && (
          <>
            {/* Filters - Only show if plans exist */}
            {plans.length > 0 && (
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

                {uniqueIntervals.length > 0 && (
                  <Select value={selectedInterval} onValueChange={(value) => setSelectedInterval(value || 'all')}>
                    <SelectTrigger className="w-36 h-10 lg:h-11">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5" />
                        <SelectValue placeholder="Interval" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="p-1">
                      <SelectItem value="all">All Intervals</SelectItem>
                      {uniqueIntervals.map((interval) => (
                        <SelectItem key={interval as string} value={interval}>
                          {intervals.find((i: any) => i.slug === interval)?.name || interval}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

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
            )}

            {/* Bulk Actions Bar */}
            {selectedCount > 0 && !showPlansSkeleton && canManage && plans.length > 0 && (
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

            {/* Plans Grid or Empty State */}
            <div className="relative">
              {showPlansSkeleton ? (
                <PlansSkeleton />
              ) : displayPlans.length === 0 ? (
                <PlansEmptyState
                  tab="plans"
                  guidance={plansGuidance}
                  canManage={canManage}
                  onAction={() => setIsCreatePlanModalOpen(true)}
                  onOpenTiersModal={() => setIsCreateTierModalOpen(true)}
                  onOpenIntervalsModal={() => setIsCreateIntervalModalOpen(true)}
                />
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
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {displayPlans.map((plan: any) => (
                      <PlanCard
                        key={plan._id}
                        plan={plan}
                        tiers={tiers}
                        intervals={intervals}
                        isSelected={selectedPlans.has(plan._id)}
                        onSelect={(checked) => handleSelectPlan(plan._id, checked)}
                        onEdit={() => {
                          setSelectedPlan(plan);
                          setIsEditPlanModalOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteTarget({ type: 'plan', id: plan._id, name: plan.name });
                          setIsDeleteConfirmOpen(true);
                        }}
                        onToggleActive={() => handleTogglePlanActive(plan)}
                        onManageCoupons={() => {
                          toast.info('Coupon management coming soon');
                        }}
                        canManage={canManage}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ==================== TIERS TAB ==================== */}
        {activeTab === 'tiers' && (
          <div className="relative">
            {showTiersSkeleton ? (
              <TiersSkeleton />
            ) : tiers.length === 0 ? (
              <PlansEmptyState
                tab="tiers"
                guidance={tiersGuidance}
                canManage={canManage}
                onAction={() => setIsCreateTierModalOpen(true)}
                onOpenIntervalsModal={() => setIsCreateIntervalModalOpen(true)}
                onOpenTiersModal={() => setIsCreateTierModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tiers.map((tier: any) => (
                  <TierCard
                    key={tier._id}
                    tier={tier}
                    onEdit={() => {
                      setSelectedTier(tier);
                      setIsEditTierModalOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteTarget({ type: 'tier', id: tier._id, name: tier.name });
                      setIsDeleteConfirmOpen(true);
                    }}
                    onToggleActive={() => handleToggleTierActive(tier)}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== INTERVALS TAB ==================== */}
        {activeTab === 'intervals' && (
          <div className="relative">
            {showIntervalsSkeleton ? (
              <IntervalsSkeleton />
            ) : intervals.length === 0 ? (
              <PlansEmptyState
                tab="intervals"
                guidance={intervalsGuidance}
                canManage={canManage}
                onAction={() => setIsCreateIntervalModalOpen(true)}
                onOpenIntervalsModal={() =>setIsCreateIntervalModalOpen(true)}
                onOpenTiersModal={() =>setIsCreateTierModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-3">
                {intervals.map((interval: any) => (
                  <IntervalCard
                    key={interval._id}
                    interval={interval}
                    onEdit={() => {
                      setSelectedIntervalItem(interval);
                      setIsEditIntervalModalOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteTarget({ type: 'interval', id: interval._id, name: interval.name });
                      setIsDeleteConfirmOpen(true);
                    }}
                    onToggleActive={() => handleToggleIntervalActive(interval)}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Plan Modals */}
      <PlanFormModal
        isOpen={isCreatePlanModalOpen}
        onClose={() => setIsCreatePlanModalOpen(false)}
        tiers={tiers.filter((t: any) => t.isActive)}
        intervals={intervals.filter((i: any) => i.isActive)}
        onSubmit={createPlan.mutateAsync}
        isLoading={createPlan.isPending}
        totalPlans={plans.length} 
      />

      <PlanFormModal
        isOpen={isEditPlanModalOpen}
        onClose={() => {
          setIsEditPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        tiers={tiers.filter((t: any) => t.isActive)}
        intervals={intervals.filter((i: any) => i.isActive)}
        onSubmit={async (data) => {
          if (selectedPlan) {
            await updatePlan.mutateAsync({ id: selectedPlan._id, updates: data });
            refetchPlans();
          }
        }}
        isLoading={updatePlan.isPending}
      />

      {/* Tier Modals */}
      <TierFormModal
        isOpen={isCreateTierModalOpen}
        onClose={() => setIsCreateTierModalOpen(false)}
        onSubmit={createTier.mutateAsync}
        isLoading={createTier.isPending}
      />

      <TierFormModal
        isOpen={isEditTierModalOpen}
        onClose={() => {
          setIsEditTierModalOpen(false);
          setSelectedTier(null);
        }}
        tier={selectedTier}
        onSubmit={async (data) => {
          if (selectedTier) {
            await updateTier.mutateAsync({ id: selectedTier._id, ...data });
            refetchTiers();
            refetchPlans();
          }
        }}
        isLoading={updateTier.isPending}
      />

      {/* Interval Modals */}
      <IntervalFormModal
        isOpen={isCreateIntervalModalOpen}
        onClose={() => setIsCreateIntervalModalOpen(false)}
        onSubmit={createInterval.mutateAsync}
        isLoading={createInterval.isPending}
      />

      <IntervalFormModal
        isOpen={isEditIntervalModalOpen}
        onClose={() => {
          setIsEditIntervalModalOpen(false);
          setSelectedIntervalItem(null);
        }}
        interval={selectedIntervalItem}
        onSubmit={async (data) => {
          if (selectedIntervalItem) {
            await updateInterval.mutateAsync({ id: selectedIntervalItem._id, ...data });
            refetchIntervals();
            refetchPlans();
          }
        }}
        isLoading={updateInterval.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'plan' ? 'Plan' : deleteTarget?.type === 'tier' ? 'Tier' : 'Interval'}`}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? ${deleteTarget?.type !== 'plan' ? 'This will not affect existing plans using this item.' : 'This action cannot be undone.'}`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deletePlan.isPending || deleteTier.isPending || deleteInterval.isPending}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={isBulkActionsModalOpen}
        onClose={() => setIsBulkActionsModalOpen(false)}
        selectedCount={selectedCount}
        onConfirm={handleBulkAction}
        isLoading={bulkAction.isPending || bulkDelete.isPending}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}