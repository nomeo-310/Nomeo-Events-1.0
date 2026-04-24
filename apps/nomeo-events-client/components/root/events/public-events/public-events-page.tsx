'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FilterIcon,
  GridViewIcon,
  ListViewIcon,
  Calendar03Icon as CalendarIcon,
  Search01Icon as SearchIcon,
  Cancel01Icon as XIcon,
  Clock01Icon as ClockIcon,
  PlayCircleIcon,
  CheckmarkCircle01Icon as CheckCircleIcon,
  StarIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useEventsQuery } from '@/hooks/use-events-api';
import { EventCategory, EventTypesByCategory } from '@/types/create-event-type';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PaginationWithInfo } from '@/components/ui/pagination';
import { GridCardSkeleton, ListCardSkeleton } from '../../home/events/event-skeletons';
import { UpcomingEventGridCard } from '../../home/events/event-card-grid';
import { UpcomingEventListCard } from '../../home/events/event-card-list';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<EventCategory, string> = {
  [EventCategory.WEBINAR]:           'Webinar',
  [EventCategory.SEMINAR]:           'Seminar',
  [EventCategory.ENTERTAINMENT]:     'Entertainment',
  [EventCategory.FILM_SHOW]:         'Film & Show',
  [EventCategory.SCIENCE_TECH]:      'Science & Tech',
  [EventCategory.SCHOOL_ACTIVITIES]: 'School Activities',
  [EventCategory.SPIRITUALITY]:      'Spirituality',
  [EventCategory.FASHION]:           'Fashion',
  [EventCategory.BUSINESS]:          'Business',
  [EventCategory.SPORTS]:            'Sports',
  [EventCategory.HEALTH_WELLNESS]:   'Health & Wellness',
  [EventCategory.ART_CULTURE]:       'Art & Culture',
  [EventCategory.FOOD_DRINK]:        'Food & Drink',
  [EventCategory.NETWORKING]:        'Networking',
  [EventCategory.CHARITY]:           'Charity',
};

const ALL_CATEGORIES = Object.values(EventCategory);
const formatTypeLabel = (t: string) =>
  t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

type EventStatus = 'upcoming' | 'ongoing' | 'completed';
type ViewMode    = 'grid' | 'list';

// ─── Status pill ──────────────────────────────────────────────────────────────

const StatusPill = ({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-150',
      active
        ? 'bg-indigo-600 text-white dark:bg-white dark:text-gray-900'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200',
    )}
  >
    {icon}
    {label}
  </button>
);

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  selectedCategory, selectedType, showFeaturedOnly, startDate, endDate,
  availableTypes, onCategoryChange, onTypeChange, onFeaturedToggle,
  onStartDateChange, onEndDateChange, onApply, onReset,
}: {
  selectedCategory: string; selectedType: string; showFeaturedOnly: boolean;
  startDate?: Date; endDate?: Date; availableTypes: string[];
  onCategoryChange: (v: string | null) => void;
  onTypeChange:     (v: string | null) => void;
  onFeaturedToggle: () => void;
  onStartDateChange: (d?: Date) => void;
  onEndDateChange:   (d?: Date) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Category
        </label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full h-9 lg:h-10 text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Event Type
        </label>
        <Select
          value={selectedType}
          onValueChange={onTypeChange}
          disabled={!selectedCategory || availableTypes.length === 0}
        >
          <SelectTrigger className="w-full h-9 lg:h-10 text-sm">
            <SelectValue placeholder={selectedCategory ? 'All Types' : 'Pick category first'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>{formatTypeLabel(type)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* Start */}
          <Popover>
            <PopoverTrigger>
              <div
                role="button"
                className="flex items-center gap-1.5 w-full h-10 px-2.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-gray-600 dark:text-gray-300"
              >
                <HugeiconsIcon icon={CalendarIcon} size={12} className="shrink-0 text-gray-400" />
                {startDate ? format(startDate, 'MMM d') : 'From'}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus />
            </PopoverContent>
          </Popover>
          {/* End */}
          <Popover>
            <PopoverTrigger>
              <div
                role="button"
                className="flex items-center gap-1.5 w-full h-10 px-2.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-gray-600 dark:text-gray-300"
              >
                <HugeiconsIcon icon={CalendarIcon} size={12} className="shrink-0 text-gray-400" />
                {endDate ? format(endDate, 'MMM d') : 'To'}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Featured */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Featured Only
        </span>
        <button
          type="button"
          onClick={onFeaturedToggle}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none',
            showFeaturedOnly ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-lg transition duration-200',
              showFeaturedOnly
                ? 'translate-x-4 bg-white dark:bg-gray-900'
                : 'translate-x-0 bg-white dark:bg-gray-400',
            )}
          />
        </button>
      </div>

      <div className="pt-1 flex gap-2">
        <Button
          onClick={onApply}
          size="sm"
          className="flex-1 h-8 lg:h-10 text-xs bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Apply
        </Button>
        <Button onClick={onReset} size="sm" variant="outline" className="flex-1 h-8 lg:h-10 text-xs">
          Reset
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

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

  const availableTypes = useMemo<string[]>(() => {
    if (!selectedCategory) return [];
    return EventTypesByCategory[selectedCategory as EventCategory] ?? [];
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedType && selectedCategory) {
      const valid = EventTypesByCategory[selectedCategory as EventCategory] ?? [];
      if (!valid.includes(selectedType)) setSelectedType('');
    }
  }, [selectedCategory, selectedType]);

  const apiFilters = {
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
    limit:     12,
  };

  const { data: eventsData, isLoading, isError, error, refetch } = useEventsQuery(apiFilters);

  const events      = eventsData?.data                   ?? [];
  const totalPages  = eventsData?.pagination?.totalPages ?? 1;
  const totalEvents = eventsData?.pagination?.totalCount ?? 0;

  const handleStatusChange = useCallback((s: EventStatus) => {
    setActiveStatus(s);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = (v: string | null) => {
    setSelectedCategory(v ?? '');
    setSelectedType('');
    setCurrentPage(1);
  };

  const handleTypeChange = (v: string | null) => {
    setSelectedType(v ?? '');
    setCurrentPage(1);
  };

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

  const hasActiveFilters =
    selectedCategory || selectedType || showFeaturedOnly || startDate || endDate || searchQuery;

  const activeFilterCount =
    [selectedCategory, selectedType, showFeaturedOnly, startDate, endDate, searchQuery].filter(Boolean).length;

  const renderSkeletons = () =>
    Array.from({ length: viewMode === 'grid' ? 6 : 4 }).map((_, i) =>
      viewMode === 'grid' ? <GridCardSkeleton key={i} /> : <ListCardSkeleton key={i} />,
    );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Page Header — clean, no gradient ──────────────────────────────── */}
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

          {/* Search bar — part of the header, not sticky */}
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

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 p-4">
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
              <FilterPanel
                selectedCategory={selectedCategory}
                selectedType={selectedType}
                showFeaturedOnly={showFeaturedOnly}
                startDate={startDate}
                endDate={endDate}
                availableTypes={availableTypes}
                onCategoryChange={handleCategoryChange}
                onTypeChange={handleTypeChange}
                onFeaturedToggle={() => setShowFeaturedOnly((p) => !p)}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApply={updateUrl}
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">

            {/* Toolbar row */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                {/* Status pills */}
                <div className="flex items-center gap-1.5">
                  <StatusPill
                    active={activeStatus === 'upcoming'}
                    onClick={() => handleStatusChange('upcoming')}
                    icon={<HugeiconsIcon icon={ClockIcon} size={11} />}
                    label="Upcoming"
                  />
                  <StatusPill
                    active={activeStatus === 'ongoing'}
                    onClick={() => handleStatusChange('ongoing')}
                    icon={<HugeiconsIcon icon={PlayCircleIcon} size={11} />}
                    label="Ongoing"
                  />
                  <StatusPill
                    active={activeStatus === 'completed'}
                    onClick={() => handleStatusChange('completed')}
                    icon={<HugeiconsIcon icon={CheckCircleIcon} size={11} />}
                    label="Completed"
                  />
                </div>

                {/* Mobile filter button */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className={cn(
                    'lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    hasActiveFilters
                      ? 'border-gray-900 text-gray-900 bg-gray-50 dark:border-white dark:text-white dark:bg-gray-800'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400',
                  )}
                >
                  <HugeiconsIcon icon={FilterIcon} size={11} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white dark:bg-white dark:text-gray-900 text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-white dark:bg-gray-900">
                {(['grid', 'list'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      viewMode === mode
                        ? 'bg-indigo-600 text-white dark:bg-white dark:text-gray-900'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                    )}
                  >
                    <HugeiconsIcon icon={mode === 'grid' ? GridViewIcon : ListViewIcon} size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    "{searchQuery}"
                    <button type="button" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                      <HugeiconsIcon icon={XIcon} size={10} className="text-gray-400 hover:text-gray-700" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {CATEGORY_LABELS[selectedCategory as EventCategory]}
                    <button type="button" onClick={() => handleCategoryChange('')}>
                      <HugeiconsIcon icon={XIcon} size={10} className="opacity-60 hover:opacity-100" />
                    </button>
                  </span>
                )}
                {selectedType && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {formatTypeLabel(selectedType)}
                    <button type="button" onClick={() => setSelectedType('')}>
                      <HugeiconsIcon icon={XIcon} size={10} className="text-gray-400 hover:text-gray-700" />
                    </button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    From {format(startDate, 'MMM d')}
                    <button type="button" onClick={() => setStartDate(undefined)}>
                      <HugeiconsIcon icon={XIcon} size={10} className="opacity-60 hover:opacity-100" />
                    </button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    To {format(endDate, 'MMM d')}
                    <button type="button" onClick={() => setEndDate(undefined)}>
                      <HugeiconsIcon icon={XIcon} size={10} className="opacity-60 hover:opacity-100" />
                    </button>
                  </span>
                )}
                {showFeaturedOnly && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    <HugeiconsIcon icon={StarIcon} size={10} /> Featured
                    <button type="button" onClick={() => setShowFeaturedOnly(false)}>
                      <HugeiconsIcon icon={XIcon} size={10} className="opacity-60 hover:opacity-100" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Events grid / list */}
            {isLoading ? (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'space-y-3',
              )}>
                {renderSkeletons()}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <HugeiconsIcon icon={CalendarIcon} size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed to load events</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">{error?.message}</p>
                <Button onClick={() => refetch()} size="sm" variant="outline">Try Again</Button>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <HugeiconsIcon icon={CalendarIcon} size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No events found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search</p>
                {hasActiveFilters && (
                  <Button onClick={resetFilters} size="sm" variant="outline" className="mt-4">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                    : 'space-y-3',
                )}>
                  {events.map((event) =>
                    viewMode === 'grid'
                      ? <UpcomingEventGridCard key={event._id} event={event} />
                      : <UpcomingEventListCard key={event._id} event={event} />,
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8">
                    <PaginationWithInfo
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalEvents}
                      itemsPerPage={12}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[88vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Filters</span>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <HugeiconsIcon icon={XIcon} size={16} />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel
                selectedCategory={selectedCategory}
                selectedType={selectedType}
                showFeaturedOnly={showFeaturedOnly}
                startDate={startDate}
                endDate={endDate}
                availableTypes={availableTypes}
                onCategoryChange={handleCategoryChange}
                onTypeChange={handleTypeChange}
                onFeaturedToggle={() => setShowFeaturedOnly((p) => !p)}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApply={() => { updateUrl(); setIsMobileFilterOpen(false); }}
                onReset={resetFilters}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}