'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon as SearchIcon, Cancel01Icon as XIcon } from '@hugeicons/core-free-icons';

import { Input } from '@/components/ui/input';
import { useEventsQuery } from '@/hooks/use-events-api';
import { EventCategory, EventTypesByCategory } from '@/types/create-event-type';
import { EVENTS_PAGE_SIZE, EventStatus, ViewMode } from './constant';
import { FilterPanel } from './filter-panel';
import { EventsToolbar } from './events-toolbar';
import { FilterChips } from './filter-chips';
import { EventsGrid } from './events-grid';
import { MobileFilterSheet } from './mobile-filter-sheet';

export default function PublicEventsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedCategory,   setSelectedCategory]   = useState('');
  const [selectedType,       setSelectedType]       = useState('');
  const [showFeaturedOnly,   setShowFeaturedOnly]   = useState(false);
  const [startDate,          setStartDate]          = useState<Date | undefined>(undefined);
  const [endDate,            setEndDate]            = useState<Date | undefined>(undefined);
  const [currentPage,        setCurrentPage]        = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode,           setViewMode]           = useState<ViewMode>('grid');
  const [activeStatus,       setActiveStatus]       = useState<EventStatus>('upcoming');

  // ── Derived ────────────────────────────────────────────────────────────────
  const availableTypes = useMemo<string[]>(() => {
    if (!selectedCategory) return [];
    return EventTypesByCategory[selectedCategory as EventCategory] ?? [];
  }, [selectedCategory]);

  const hasActiveFilters = Boolean(
    selectedCategory || selectedType || showFeaturedOnly || startDate || endDate || searchQuery,
  );

  const activeFilterCount = [
    selectedCategory, selectedType, showFeaturedOnly, startDate, endDate, searchQuery,
  ].filter(Boolean).length;

  // Reset invalid type when category changes
  useEffect(() => {
    if (selectedType && selectedCategory) {
      const valid = EventTypesByCategory[selectedCategory as EventCategory] ?? [];
      if (!valid.includes(selectedType)) setSelectedType('');
    }
  }, [selectedCategory, selectedType]);

  // Sync from URL on mount / navigation
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') ?? '');
    setSelectedType(searchParams.get('type')         ?? '');
    setSearchQuery(searchParams.get('search')        ?? '');
    setShowFeaturedOnly(searchParams.get('featured') === 'true');
    setStartDate(searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined);
    setEndDate(searchParams.get('endDate')     ? new Date(searchParams.get('endDate')!)   : undefined);
    const s = searchParams.get('status');
    setActiveStatus(s === 'ongoing' || s === 'completed' ? s : 'upcoming');
    setCurrentPage(parseInt(searchParams.get('page') ?? '1', 10));
  }, [searchParams]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: eventsData, isLoading, isError, error, refetch } = useEventsQuery({
    category:  selectedCategory || undefined,
    type:      selectedType     || undefined,
    search:    searchQuery      || undefined,
    startDate,
    endDate,
    upcoming:  activeStatus === 'upcoming',
    ongoing:   activeStatus === 'ongoing',
    completed: activeStatus === 'completed',
    featured:  showFeaturedOnly || undefined,
    page:      currentPage,
    limit:     EVENTS_PAGE_SIZE,
  });

  const events      = eventsData?.data                   ?? [];
  const totalPages  = eventsData?.pagination?.totalPages ?? 1;
  const totalEvents = eventsData?.pagination?.totalCount ?? 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const updateUrl = useCallback(() => {
    const p = new URLSearchParams();
    if (selectedCategory) p.set('category',  selectedCategory);
    if (selectedType)     p.set('type',       selectedType);
    if (searchQuery)      p.set('search',     searchQuery);
    if (showFeaturedOnly) p.set('featured',   'true');
    if (startDate)        p.set('startDate',  format(startDate, 'yyyy-MM-dd'));
    if (endDate)          p.set('endDate',    format(endDate,   'yyyy-MM-dd'));
    p.set('status', activeStatus);
    if (currentPage !== 1) p.set('page', String(currentPage));
    router.push(`/events?${p.toString()}`);
  }, [selectedCategory, selectedType, searchQuery, showFeaturedOnly, startDate, endDate, activeStatus, currentPage, router]);

  const resetFilters = useCallback(() => {
    setSearchQuery(''); setSelectedCategory(''); setSelectedType('');
    setShowFeaturedOnly(false); setStartDate(undefined); setEndDate(undefined);
    setActiveStatus('upcoming'); setCurrentPage(1);
    router.push('/events');
  }, [router]);

  const handleCategoryChange = (v: string | null) => {
    setSelectedCategory(v ?? '');
    setSelectedType('');
    setCurrentPage(1);
  };

  const handleTypeChange = (v: string | null) => {
    setSelectedType(v ?? '');
    setCurrentPage(1);
  };

  const handleStatusChange = useCallback((s: EventStatus) => {
    setActiveStatus(s);
    setCurrentPage(1);
  }, []);

  // Shared filter panel props (reused by sidebar + mobile sheet)
  const filterPanelProps = {
    selectedCategory,
    selectedType,
    showFeaturedOnly,
    startDate,
    endDate,
    availableTypes,
    onCategoryChange:  handleCategoryChange,
    onTypeChange:      handleTypeChange,
    onFeaturedToggle:  () => setShowFeaturedOnly((p) => !p),
    onStartDateChange: setStartDate,
    onEndDateChange:   setEndDate,
    onApply:           updateUrl,
    onReset:           resetFilters,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Page Header */}
      <div className="border-b border-gray-100 dark:border-gray-800/60 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 pt-10 pb-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Discover Events
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Find and join events happening near you — concerts, workshops, sports, and more.
            </p>
          </div>

          {/* Search */}
          <div className="mt-5 relative max-w-xl">
            <HugeiconsIcon
              icon={SearchIcon}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                if (!e.target.value) updateUrl();
              }}
              onKeyDown={(e) => e.key === 'Enter' && updateUrl()}
              placeholder="Search by title, description, or location..."
              className="pl-9 h-10 lg:h-11 text-sm w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); updateUrl(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <HugeiconsIcon icon={XIcon} size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Filters</span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel {...filterPanelProps} />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <EventsToolbar
              activeStatus={activeStatus}
              viewMode={viewMode}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              onStatusChange={handleStatusChange}
              onViewModeChange={setViewMode}
              onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            />

            <FilterChips
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedType={selectedType}
              showFeaturedOnly={showFeaturedOnly}
              startDate={startDate}
              endDate={endDate}
              onClearSearch={() => { setSearchQuery(''); setCurrentPage(1); }}
              onClearCategory={() => handleCategoryChange('')}
              onClearType={() => setSelectedType('')}
              onClearStartDate={() => setStartDate(undefined)}
              onClearEndDate={() => setEndDate(undefined)}
              onClearFeatured={() => setShowFeaturedOnly(false)}
            />

            <EventsGrid
              events={events}
              isLoading={isLoading}
              isError={isError}
              error={error}
              viewMode={viewMode}
              hasActiveFilters={hasActiveFilters}
              currentPage={currentPage}
              totalPages={totalPages}
              totalEvents={totalEvents}
              itemsPerPage={EVENTS_PAGE_SIZE}
              onRefetch={refetch}
              onResetFilters={resetFilters}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        {...filterPanelProps}
      />
    </div>
  );
}