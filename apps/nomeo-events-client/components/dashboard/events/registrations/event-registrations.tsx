
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useRegistration } from '@/hooks/use-registration';
import type { RegistrationStatus, PaymentStatus } from '@/hooks/use-registration';
import { format } from 'date-fns';
import { PaginationWithInfo } from '@/components/ui/pagination';
import { RefreshCw } from 'lucide-react';
import {
  Search01Icon,
  FilterHorizontalIcon,
  Download01Icon,
  UserMultiple02Icon,
  MoneyBag01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  MoreHorizontalCircle01Icon,
  UserCheck01Icon,
  ChampionIcon,
  CreditCardIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ViewIcon,
  Delete03Icon,
  Building03Icon,
  AlertCircleIcon,
  Cancel01Icon,
  File01Icon,
  FileSpreadsheetIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { EventTabs } from '../event-tabs';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupMember {
  name: string;
  email: string;
  phone?: string;
  _id?: string;
}

interface EventReference {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: { venue: string; city: string; address: string };
  banner?: { secure_url: string };
  slug: string;
  ageRequirement?: Record<string, unknown>;
  organizerId?: string;
}

interface Registration {
  _id: string;
  eventId: string | EventReference;
  status: RegistrationStatus;
  planType: string;
  planName: string;
  price: number;
  currency: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeGender?: string;
  ageVerified: boolean;
  parentalConsentProvided: boolean;
  ageGroup?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  isGroupRegistration: boolean;
  groupName?: string;
  groupSize?: number;
  groupMembers?: GroupMember[];
  isCorporateRegistration: boolean;
  companyName?: string;
  companySize?: number;
  companyMembers?: { name: string; email: string; phone?: string; age?: number }[];
  paymentStatus: PaymentStatus;
  certificateIssued: boolean;
  feedbackSubmitted: boolean;
  feedback?: string;
  rating?: number;
  specialRequests?: string;
  registrationNumber: string;
  ticketId?: string;
  registeredAt: string;
  createdAt?: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

interface RegistrationStats {
  total?: number;
  confirmed?: number;
  attended?: number;
  totalRevenue?: number;
  paymentStats?: { pending?: number };
  certificatesIssued?: number;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

// ─── PDF Styles ───────────────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#1e40af', paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  headerSubtitle: { fontSize: 10, color: '#64748b' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  headerInfo: { fontSize: 8, color: '#94a3b8' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '30%', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 10, alignItems: 'center' },
  statLabel: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 10, marginTop: 5, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  table: { width: '100%' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e40af', paddingVertical: 7, paddingHorizontal: 6, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableHeaderCell: { color: '#ffffff', fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 6 },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  tableCell: { fontSize: 7, color: '#334155' },
  tableCellBold: { fontSize: 7, fontWeight: 'bold', color: '#1e293b' },
  colRegNum: { width: '12%', paddingRight: 6 },
  colName: { width: '14%', paddingRight: 6 },
  colEmail: { width: '22%', paddingRight: 6 },
  colType: { width: '9%', paddingRight: 6 },
  colPlan: { width: '11%', paddingRight: 6 },
  colPrice: { width: '8%', paddingRight: 6 },
  colStatus: { width: '12%', paddingRight: 6 },
  colPayment: { width: '12%', paddingRight: 6 },
  colDate: { flexGrow: 1 },
  statusBadge: { fontSize: 6, paddingVertical: 2, paddingHorizontal: 4, borderRadius: 4, fontWeight: 'bold', textAlign: 'center' },
  statusConfirmed: { backgroundColor: '#e0e7ff', color: '#4338ca' },
  statusPending: { backgroundColor: '#fef3c7', color: '#92400e' },
  statusAttended: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusCancelled: { backgroundColor: '#fee2e2', color: '#991b1b' },
  statusWaitlisted: { backgroundColor: '#fff7ed', color: '#9a3412' },
  statusRefunded: { backgroundColor: '#f3e8ff', color: '#6b21a8' },
  paymentCompleted: { color: '#065f46', fontWeight: 'bold' },
  paymentPending: { color: '#92400e', fontWeight: 'bold' },
  paymentFailed: { color: '#991b1b', fontWeight: 'bold' },
  paymentRefunded: { color: '#6b21a8', fontWeight: 'bold' },
  paymentPartial: { color: '#9a3412', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, fontSize: 7, color: '#94a3b8' },
  pageNumber: { position: 'absolute', bottom: 20, right: 30, fontSize: 7, color: '#94a3b8' },
  summaryRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  summaryLabel: { fontSize: 8, fontWeight: 'bold', color: '#64748b', marginRight: 8 },
  summaryValue: { fontSize: 8, fontWeight: 'bold', color: '#1e293b' },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────

const RegistrationsPDF = ({
  registrations,
  stats,
  eventName = 'Event',
}: {
  registrations: Registration[];
  stats: RegistrationStats;
  eventName?: string;
}) => {
  const totalRevenue = registrations.reduce((sum, r) => sum + r.price, 0);
  const confirmedCount = registrations.filter((r) => r.status === 'confirmed').length;
  const attendedCount = registrations.filter((r) => r.status === 'attended').length;
  const cancelledCount = registrations.filter((r) => r.status === 'cancelled').length;
  const certsCount = registrations.filter((r) => r.certificateIssued).length;
  const pendingPaymentCount = registrations.filter((r) => r.paymentStatus === 'pending').length;

  const getStatusStyle = (status: RegistrationStatus) => {
    const map: Record<string, any> = {
      confirmed: pdfStyles.statusConfirmed,
      pending: pdfStyles.statusPending,
      attended: pdfStyles.statusAttended,
      cancelled: pdfStyles.statusCancelled,
      waitlisted: pdfStyles.statusWaitlisted,
      refunded: pdfStyles.statusRefunded,
    };
    return map[status] || pdfStyles.statusPending;
  };

  const getPaymentStyle = (status: PaymentStatus) => {
    const map: Record<string, any> = {
      completed: pdfStyles.paymentCompleted,
      pending: pdfStyles.paymentPending,
      failed: pdfStyles.paymentFailed,
      refunded: pdfStyles.paymentRefunded,
      partial: pdfStyles.paymentPartial,
    };
    return map[status] || pdfStyles.paymentPending;
  };

  const itemsPerPage = 20;
  const pages: Registration[][] = [];
  for (let i = 0; i < registrations.length; i += itemsPerPage) {
    pages.push(registrations.slice(i, i + itemsPerPage));
  }

  return (
    <Document>
      {pages.map((pageRegistrations, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={pdfStyles.page}>
          {pageIndex === 0 && (
            <View style={pdfStyles.header}>
              <Text style={pdfStyles.headerTitle}>{eventName} - Registration Report</Text>
              <Text style={pdfStyles.headerSubtitle}>Official Attendee Registry</Text>
              <View style={pdfStyles.headerRow}>
                <Text style={pdfStyles.headerInfo}>Generated: {format(new Date(), 'PPpp')}</Text>
                <Text style={pdfStyles.headerInfo}>Total Registrations: {registrations.length}</Text>
              </View>
            </View>
          )}

          {pageIndex === 0 && (
            <View style={pdfStyles.statsGrid}>
              {[
                { label: 'Total', value: registrations.length },
                { label: 'Confirmed', value: confirmedCount },
                { label: 'Attended', value: attendedCount },
                { label: 'Cancelled', value: cancelledCount },
                { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}` },
                { label: 'Pending Pay', value: pendingPaymentCount },
              ].map(({ label, value }) => (
                <View key={label} style={pdfStyles.statCard}>
                  <Text style={pdfStyles.statLabel}>{label}</Text>
                  <Text style={pdfStyles.statValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={pdfStyles.sectionTitle}>
            {pageIndex === 0 ? 'Registration List' : `Registration List (Continued - Page ${pageIndex + 1})`}
          </Text>

          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colRegNum]}>Reg. #</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colName]}>Name</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colEmail]}>Email</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colType]}>Type</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPlan]}>Plan</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPrice]}>Price</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colStatus]}>Status</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPayment]}>Payment</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDate]}>Date</Text>
          </View>

          {pageRegistrations.map((reg, index) => (
            <View key={reg._id} style={[pdfStyles.tableRow, index % 2 === 1 ? pdfStyles.tableRowAlt : {}]}>
              <Text style={[pdfStyles.tableCell, pdfStyles.colRegNum]}>{reg.registrationNumber}</Text>
              <Text style={[pdfStyles.tableCellBold, pdfStyles.colName]}>{reg.attendeeName}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colEmail]}>{reg.attendeeEmail}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colType]}>
                {reg.isGroupRegistration ? 'Group' : reg.isCorporateRegistration ? 'Corp.' : 'Indiv.'}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colPlan]}>{reg.planName}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colPrice]}>₦{reg.price.toLocaleString()}</Text>
              <View style={pdfStyles.colStatus}>
                <Text style={[pdfStyles.statusBadge, getStatusStyle(reg.status)]}>
                  {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                </Text>
              </View>
              <View style={pdfStyles.colPayment}>
                <Text style={[pdfStyles.tableCell, getPaymentStyle(reg.paymentStatus)]}>
                  {reg.paymentStatus.charAt(0).toUpperCase() + reg.paymentStatus.slice(1)}
                </Text>
              </View>
              <Text style={[pdfStyles.tableCell, pdfStyles.colDate]}>
                {format(new Date(reg.registeredAt), 'dd/MM/yy')}
              </Text>
            </View>
          ))}

          {pageIndex === pages.length - 1 && (
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Total Registrations:</Text>
              <Text style={pdfStyles.summaryValue}>{registrations.length}</Text>
              <Text style={[pdfStyles.summaryLabel, { marginLeft: 20 }]}>Total Revenue:</Text>
              <Text style={pdfStyles.summaryValue}>₦{totalRevenue.toLocaleString()}</Text>
              <Text style={[pdfStyles.summaryLabel, { marginLeft: 20 }]}>Certificates Issued:</Text>
              <Text style={pdfStyles.summaryValue}>{certsCount}</Text>
            </View>
          )}

          <Text style={pdfStyles.footer}>
            This is an official registration report. Generated from the Event Management System.
          </Text>
          <Text style={pdfStyles.pageNumber}>
            Page {pageIndex + 1} of {pages.length}
          </Text>
        </Page>
      ))}
    </Document>
  );
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

const exportToCSV = (registrations: Registration[], filename: string) => {
  const headers = [
    'Registration Number', 'Attendee Name', 'Email', 'Phone', 'Gender',
    'Age Group', 'Plan', 'Price', 'Currency', 'Status', 'Payment Status',
    'Registration Type', 'Group Name', 'Group Size', 'Certificate Issued',
    'Feedback Submitted', 'Rating', 'Registered At', 'Ticket ID',
  ];

  const rows = registrations.map((reg) => [
    reg.registrationNumber, reg.attendeeName, reg.attendeeEmail,
    reg.attendeePhone || '', reg.attendeeGender || '', reg.ageGroup || '',
    reg.planName, reg.price, reg.currency || 'NGN', reg.status, reg.paymentStatus,
    reg.isGroupRegistration ? 'Group' : reg.isCorporateRegistration ? 'Corporate' : 'Individual',
    reg.groupName || '', reg.groupSize || '',
    reg.certificateIssued ? 'Yes' : 'No',
    reg.feedbackSubmitted ? 'Yes' : 'No',
    reg.rating || '',
    format(new Date(reg.registeredAt), 'yyyy-MM-dd HH:mm:ss'),
    reg.ticketId || '',
  ]);

  const escapeCSV = (value: string | number): string => {
    const s = String(value);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />
  );
}

const RegistrationsSkeleton = () => (
  <div className="space-y-3">
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    <div className="flex gap-3 mb-6">
      <SkeletonLine className="h-10 flex-1" />
      <SkeletonLine className="h-10 w-36" />
      <SkeletonLine className="h-10 w-36" />
    </div>
    <div className="flex gap-4 px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
      <SkeletonLine className="h-3 w-3" />
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="h-3 w-32" />
      <SkeletonLine className="h-3 w-16 ml-auto" />
    </div>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800" style={{ opacity: 1 - i * 0.1 }}>
        <SkeletonLine className="h-4 w-4 rounded" />
        <SkeletonLine className="h-3 w-24" />
        <div className="flex-1 space-y-1.5">
          <SkeletonLine className="h-3.5 w-40" />
          <SkeletonLine className="h-3 w-56" />
        </div>
        <SkeletonLine className="h-5 w-14 rounded-full" />
        <SkeletonLine className="h-5 w-18 rounded-full" />
        <SkeletonLine className="h-3 w-16" />
        <SkeletonLine className="h-7 w-7 rounded-lg" />
      </div>
    ))}
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <SkeletonLine className="h-3 w-16 mb-2" />
        <SkeletonLine className="h-7 w-20" />
      </div>
    ))}
  </div>
);

// ─── Stats Cards ──────────────────────────────────────────────────────────────

const STAT_ITEMS = [
  { label: 'Total',       key: 'total',               icon: UserMultiple02Icon,    color: 'text-indigo-600 dark:text-indigo-400',  dot: 'bg-indigo-500'  },
  { label: 'Confirmed',   key: 'confirmed',            icon: CheckmarkCircle02Icon, color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { label: 'Attended',    key: 'attended',             icon: UserCheck01Icon,       color: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'    },
  { label: 'Revenue',     key: 'totalRevenue',         icon: MoneyBag01Icon,        color: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'   },
  { label: 'Pending Pay', key: 'paymentStats.pending', icon: Clock01Icon,           color: 'text-orange-600 dark:text-orange-400',   dot: 'bg-orange-500'  },
  { label: 'Certs',       key: 'certificatesIssued',   icon: ChampionIcon,          color: 'text-purple-600 dark:text-purple-400',   dot: 'bg-purple-500'  },
];

function getStatValue(stats: RegistrationStats, key: string): string | number {
  if (key === 'paymentStats.pending') return stats.paymentStats?.pending ?? 0;
  if (key === 'totalRevenue') return `₦${(stats.totalRevenue ?? 0).toLocaleString()}`;
  return (stats as Record<string, unknown>)[key] as number ?? 0;
}

const StatsCards = ({ stats }: { stats: RegistrationStats }) => (
  <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
    {STAT_ITEMS.map(({ label, key, icon: Icon, color, dot }) => (
      <div key={key} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3.5 transition-colors hover:border-gray-200 dark:hover:border-gray-700 group">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{label}</p>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
            {getStatValue(stats, key)}
          </p>
          <HugeiconsIcon icon={Icon} className={`h-4 w-4 ${color} opacity-60 group-hover:opacity-100 transition-opacity dark:opacity-80`} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<RegistrationStatus, { label: string; cls: string }> = {
  confirmed:  { label: 'Confirmed',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800' },
  pending:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  cancelled:  { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800' },
  attended:   { label: 'Attended',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' },
  waitlisted: { label: 'Waitlisted',cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800' },
  refunded:   { label: 'Refunded',   cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' },
};

const PAYMENT_MAP: Record<PaymentStatus, { label: string; cls: string; Icon: any }> = {
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', Icon: CheckmarkCircle02Icon },
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',             Icon: Clock01Icon },
  failed:    { label: 'Failed',    cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',                         Icon: CancelCircleIcon },
  refunded:  { label: 'Refunded',  cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',       Icon: RefreshCw },
  partial:   { label: 'Partial',   cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',       Icon: CreditCardIcon },
};

const StatusBadge = ({ status }: { status: RegistrationStatus }) => {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{label}</span>;
};

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const { label, cls, Icon } = PAYMENT_MAP[status] ?? PAYMENT_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <HugeiconsIcon icon={Icon} className="h-3 w-3" />
      {label}
    </span>
  );
};

// ─── ActionDropdown — portal-based so it never gets clipped ──────────────────

interface DropdownItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  section?: string;
}

const ActionDropdown = ({
  items,
  trigger,
}: {
  items: (DropdownItem | { divider: true; section?: string })[];
  trigger: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 224; // w-56

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const MENU_WIDTH = 224;
    const MENU_HEIGHT = 320; // generous estimate — real height varies by items
    const OFFSET = 6;

    // ── Horizontal: prefer aligning right edge of menu to right edge of trigger
    let left = rect.right - MENU_WIDTH;
    // If that would clip the left edge, pin to a safe margin instead
    if (left < 8) left = 8;
    // If it clips the right edge (shouldn't happen with right-align, but just in case)
    if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;

    // ── Vertical: open downward by default, flip upward if not enough space below
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= MENU_HEIGHT || spaceBelow >= rect.top
      ? rect.bottom + OFFSET        // enough space below — open down
      : rect.top - MENU_HEIGHT - OFFSET; // not enough — flip up

    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => updateCoords();

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) updateCoords();
    setOpen((p) => !p);
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>

      {open && typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden z-[9999]"
            style={{
              top: coords.top,
              left: coords.left,
              width: MENU_WIDTH,
              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08)',
            }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          >
            {items.map((item, i) => {
              if ('divider' in item && item.divider) {
                return (
                  <div key={i}>
                    {item.section ? (
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {item.section}
                      </p>
                    ) : (
                      <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                    )}
                  </div>
                );
              }
              const { label, icon: Icon, onClick, danger } = item as DropdownItem;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={onClick}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <HugeiconsIcon
                    icon={Icon}
                    className={`h-3.5 w-3.5 flex-shrink-0 ${danger ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                  />
                  {label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

// ─── Accordion ────────────────────────────────────────────────────────────────

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

const AccordionItem = ({ children, isOpen, onToggle }: AccordionItemProps) => {
  const [header, content] = React.Children.toArray(children);
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden mb-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">{header}</div>
        {isOpen
          ? <HugeiconsIcon icon={ArrowUp01Icon} className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />
          : <HugeiconsIcon icon={ArrowDown01Icon} className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40">
          {content}
        </div>
      )}
    </div>
  );
};

const Accordion = ({ children, defaultValue }: { children: React.ReactNode; defaultValue?: string }) => {
  const [openItem, setOpenItem] = useState<string | null>(defaultValue ?? null);
  const toggle = (value: string) => setOpenItem((prev) => (prev === value ? null : value));

  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const props = child.props as any;
    const value = props.value || props.registration?._id;
    if (!value) return child;
    return React.cloneElement(child as React.ReactElement<any>, {
      isOpen: openItem === value,
      onToggle: () => toggle(value),
    });
  });

  return <div>{enhancedChildren}</div>;
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

const Modal = ({ isOpen, onClose, title, description, children, footer, size = 'lg' }: ModalProps) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', esc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxW = size === 'md' ? 'max-w-xl' : 'max-w-3xl';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative bg-white dark:bg-gray-900 w-full ${maxW} rounded-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800`}
        style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{title}</h3>
            {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{description}</p>}
          </div>
          <Button type="button" onClick={onClose} variant="ghost" size="icon" className="w-7 h-7 rounded-lg flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 dark:text-gray-300">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Mobile Card ──────────────────────────────────────────────────────────────

const MobileCard = ({
  registration, isSelected, onSelect, onViewDetails,
  onCheckIn, onCancel, onIssueCertificate, isOpen, onToggle,
}: {
  registration: Registration;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onViewDetails: (r: Registration) => void;
  onCheckIn: (id: string) => void;
  onCancel: (id: string) => void;
  onIssueCertificate: (id: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}) => {
  const groupMembersCount = registration.groupMembers?.length ?? 0;
  const groupMembersList = registration.groupMembers ?? [];

  return (
    <AccordionItem value={registration._id} isOpen={isOpen} onToggle={onToggle}>
      <div className="flex items-center gap-3">
        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(registration._id)} onClick={(e) => e.stopPropagation()} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{registration.attendeeName}</p>
            <StatusBadge status={registration.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-gray-600 dark:text-gray-400">
              {registration.registrationNumber}
            </span>
            {registration.isGroupRegistration && (
              <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
                <HugeiconsIcon icon={UserMultiple02Icon} className="h-3 w-3" /> Group
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-3">
        {registration.isGroupRegistration && (
          <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
              {registration.groupName || 'Group'} · {groupMembersCount} members
            </p>
            <div className="space-y-1">
              {groupMembersList.slice(0, 3).map((m, i) => (
                <p key={m._id || i} className="text-xs text-indigo-600 dark:text-indigo-400 truncate">· {m.name}</p>
              ))}
              {groupMembersCount > 3 && <p className="text-xs text-indigo-400 dark:text-indigo-500">+{groupMembersCount - 3} more</p>}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Payment</p>
            <PaymentStatusBadge status={registration.paymentStatus} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Registered</p>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              {format(new Date(registration.registeredAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button type="button" onClick={(e) => { e.stopPropagation(); onViewDetails(registration); }} variant="outline" size="sm" className="h-7 px-3 text-xs dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <HugeiconsIcon icon={ViewIcon} className="h-3 w-3 mr-1" /> View
          </Button>
          {registration.status !== 'attended' && registration.status !== 'cancelled' && (
            <Button type="button" onClick={(e) => { e.stopPropagation(); onCheckIn(registration._id); }} size="sm" className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white">
              <HugeiconsIcon icon={UserCheck01Icon} className="h-3 w-3 mr-1" /> Check In
            </Button>
          )}
          {!registration.certificateIssued && registration.status === 'attended' && (
            <Button type="button" onClick={(e) => { e.stopPropagation(); onIssueCertificate(registration._id); }} variant="outline" size="sm" className="h-7 px-3 text-xs dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <HugeiconsIcon icon={ChampionIcon} className="h-3 w-3 mr-1" /> Cert
            </Button>
          )}
          {registration.status !== 'cancelled' && (
            <Button type="button" onClick={(e) => { e.stopPropagation(); onCancel(registration._id); }} variant="outline" size="sm" className="h-7 px-3 text-xs border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50">
              <HugeiconsIcon icon={Delete03Icon} className="h-3 w-3 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </div>
    </AccordionItem>
  );
};

// ─── Detail field ─────────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
    <div className="text-sm font-medium text-gray-900 dark:text-white">{children}</div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventRegistrations() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const [filters, setFilters] = useState({
    status: undefined as RegistrationStatus | undefined,
    paymentStatus: undefined as PaymentStatus | undefined,
    search: '',
    page: 1,
    limit: 20,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedReg, setFocusedReg] = useState<Registration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [bulkDialog, setBulkDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });

  const {
    useEventRegistrations,
    useCheckIn,
    useCancelRegistration,
    useBulkOperation,
    useIssueCertificate,
    useUpdatePaymentStatus,
  } = useRegistration();

  const { data, isLoading, error, refetch } = useEventRegistrations(eventId, {
    ...filters,
    page: filters.page,
    limit: filters.limit,
  });

  const checkInMutation       = useCheckIn();
  const cancelMutation        = useCancelRegistration();
  const bulkMutation          = useBulkOperation();
  const issueCertMutation     = useIssueCertificate();
  const updatePaymentMutation = useUpdatePaymentStatus();

  const registrations: Registration[] = (data?.data ?? []).map((reg) => ({
    ...reg,
    ticketId: reg.ticketId ?? '',
    groupMembers: reg.groupMembers?.map((member: any, index: number) => ({
      ...member,
      _id: member._id || `group-member-${index}`,
    })) as GroupMember[] | undefined,
    companyMembers: reg.companyMembers || [],
  }));

  const stats: RegistrationStats | undefined = data?.stats;
  const pagination: Pagination | undefined = data?.pagination;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSearch = (value: string) => setFilters((f) => ({ ...f, search: value, page: 1 }));
  const handleStatusChange = (value: string | null) =>
    setFilters((f) => ({ ...f, status: value === 'all' || value === null ? undefined : (value as RegistrationStatus), page: 1 }));
  const handlePaymentStatusChange = (value: string | null) =>
    setFilters((f) => ({ ...f, paymentStatus: value === 'all' || value === null ? undefined : (value as PaymentStatus), page: 1 }));
  const handlePageChange = (page: number) => setFilters((f) => ({ ...f, page }));

  const handleSelectAll = () => {
    setSelected(
      selected.size === registrations.length && registrations.length > 0
        ? new Set()
        : new Set(registrations.map((r) => r._id))
    );
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleCheckIn = async (id: string) => {
    try {
      await checkInMutation.mutateAsync(id);
      toast.success('Check-in successful');
      refetch();
    } catch { toast.error('Check-in failed'); }
  };

  const handleCancel = async (id: string, reason?: string) => {
    try {
      await cancelMutation.mutateAsync({ registrationId: id, reason });
      toast.success('Registration cancelled');
      refetch();
      setCancelOpen(false);
      setDetailsOpen(false);
      setCancelReason('');
    } catch { toast.error('Failed to cancel'); }
  };

  const handleIssueCertificate = async (id: string) => {
    try {
      await issueCertMutation.mutateAsync(id);
      toast.success('Certificate issued');
      refetch();
      setDetailsOpen(false);
    } catch { toast.error('Failed to issue certificate'); }
  };

  const handleUpdatePayment = async (id: string, status: PaymentStatus) => {
    try {
      await updatePaymentMutation.mutateAsync({ registrationId: id, paymentStatus: status });
      toast.success('Payment updated');
      refetch();
    } catch { toast.error('Payment update failed'); }
  };

  const handleBulkAction = async () => {
    try {
      await bulkMutation.mutateAsync({
        action: bulkDialog.action as 'checkin' | 'cancel' | 'issue-certificate',
        eventId,
        registrationIds: Array.from(selected),
        data: bulkDialog.action === 'cancel' ? { reason: 'Bulk action by organizer' } : undefined,
      });
      toast.success('Bulk action completed');
      setSelected(new Set());
      setBulkDialog({ open: false, action: '' });
      refetch();
    } catch { toast.error('Bulk action failed'); }
  };

  const getExportData = () =>
    selected.size > 0 ? registrations.filter((r) => selected.has(r._id)) : registrations;

  const handleExportCSV = () => {
    const data = getExportData();
    if (data.length === 0) { toast.error('No registrations to export'); return; }
    exportToCSV(data, `registrations-${eventId}-${format(new Date(), 'yyyy-MM-dd-HHmm')}`);
    toast.success(`Exported ${data.length} registrations to CSV`);
  };

  const handleGeneratePDF = async () => {
    const data = getExportData();
    if (data.length === 0) { toast.error('No registrations to export'); return; }
    setPdfGenerating(true);
    try {
      const blob = await pdf(
        <RegistrationsPDF registrations={data} stats={stats || {}} eventName={`Event #${eventId}`} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `registrations-${eventId}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Generated PDF with ${data.length} registrations`);
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (error) {
    return (
      <>
        <EventTabs />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-sm w-full border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
              <HugeiconsIcon icon={CancelCircleIcon} className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Error Loading Registrations</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{(error as Error)?.message ?? 'Unknown error'}</p>
            <Button type="button" onClick={handleRefresh} variant="outline" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  const hasFilters = filters.search || filters.status || filters.paymentStatus;

  return (
    <>
      <EventTabs />
      <div className="min-h-screen bg-gray-50 dark:bg-inherit">
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

        <div className="container mx-auto pb-5 md:pb-8 px-4">

          {/* ── Header ── */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Event Registrations
                </h1>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  Manage and track all registrations for this event
                </p>
              </div>
              <div className="flex gap-2">
                <ActionDropdown
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                      <HugeiconsIcon icon={Download01Icon} className="h-3.5 w-3.5 mr-2" />
                      Export
                    </Button>
                  }
                  items={[
                    { label: 'Export as CSV', icon: FileSpreadsheetIcon, onClick: handleExportCSV },
                    { divider: true } as const,
                    { label: pdfGenerating ? 'Generating PDF…' : 'Export as PDF', icon: File01Icon, onClick: handleGeneratePDF },
                    ...(selected.size > 0 ? [{ divider: true, section: `Selected (${selected.size})` } as const] : []),
                  ]}
                />
                <Button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </div>

            {isLoading && !stats ? <StatsSkeleton /> : stats && <StatsCards stats={stats} />}
          </div>

          {/* ── Filters ── */}
          <div className="mb-5 flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative h-10 lg:h-11">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by name or email…"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-44 dark:bg-gray-900 dark:border-gray-800 dark:text-white">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <HugeiconsIcon icon={FilterHorizontalIcon} className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.paymentStatus ?? 'all'} onValueChange={handlePaymentStatusChange}>
              <SelectTrigger className="w-full sm:w-44 dark:bg-gray-900 dark:border-gray-800 dark:text-white">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <HugeiconsIcon icon={CreditCardIcon} className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Payment" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Bulk Actions ── */}
          {selected.size > 0 && (
            <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {selected.size}
                </span>
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">selected</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => setBulkDialog({ open: true, action: 'checkin' })} variant="outline" size="sm" className="border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                  <HugeiconsIcon icon={UserCheck01Icon} className="h-3 w-3 mr-1.5" /> Check-in
                </Button>
                <Button type="button" onClick={() => setBulkDialog({ open: true, action: 'issue-certificate' })} variant="outline" size="sm" className="border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                  <HugeiconsIcon icon={ChampionIcon} className="h-3 w-3 mr-1.5" /> Certificates
                </Button>
                <Button type="button" onClick={() => setBulkDialog({ open: true, action: 'cancel' })} variant="outline" size="sm" className="border-red-100 dark:border-red-900/50 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50">
                  <HugeiconsIcon icon={Delete03Icon} className="h-3 w-3 mr-1.5" /> Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── Desktop Table ── */}
          {/*
            KEY FIX:
            1. Removed `overflow-hidden` from the outer card wrapper — this was clipping portalled dropdowns
            2. Removed the constrained `max-h-[calc(...)]` scroll wrapper — the page itself now scrolls naturally
            3. Changed to `overflow-x-auto` only, for narrow viewport horizontal scroll
            4. ActionDropdown uses createPortal + position:fixed so it's never clipped by any ancestor
          */}
          <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {isLoading ? (
              <div className="pb-6"><RegistrationsSkeleton /></div>
            ) : registrations.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={UserMultiple02Icon} className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Registrations Found</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                  {hasFilters ? 'No registrations match your filters' : 'No one has registered for this event yet'}
                </p>
                {hasFilters && (
                  <Button
                    type="button"
                    onClick={() => setFilters({ status: undefined, paymentStatus: undefined, search: '', page: 1, limit: 20 })}
                    variant="outline"
                    size="sm"
                    className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <HugeiconsIcon icon={FilterHorizontalIcon} className="h-3.5 w-3.5 mr-2" /> Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* overflow-x-auto for horizontal scroll on narrow screens only — no height constraint */}
                <div className="overflow-x-auto rounded-2xl">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
                      <TableRow className="bg-gray-50/90 dark:bg-gray-800/90 hover:bg-gray-50/90 dark:hover:bg-gray-800/90 border-gray-100 dark:border-gray-800">
                        <TableHead className="w-12 pl-5">
                          <Checkbox
                            checked={selected.size === registrations.length && registrations.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Reg. #</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Attendee</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Type</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Plan</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Payment</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Date</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg) => (
                        <TableRow
                          key={reg._id}
                          className="border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <TableCell className="pl-5">
                            <Checkbox checked={selected.has(reg._id)} onCheckedChange={() => toggleSelect(reg._id)} />
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                              {reg.registrationNumber}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{reg.attendeeName}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{reg.attendeeEmail}</p>
                          </TableCell>
                          <TableCell>
                            {reg.isGroupRegistration ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                                <HugeiconsIcon icon={UserMultiple02Icon} className="h-3 w-3" /> Group
                              </span>
                            ) : reg.isCorporateRegistration ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                                <HugeiconsIcon icon={Building03Icon} className="h-3 w-3" /> Corporate
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">Individual</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-700 dark:text-gray-300">{reg.planName}</TableCell>
                          <TableCell><StatusBadge status={reg.status} /></TableCell>
                          <TableCell><PaymentStatusBadge status={reg.paymentStatus} /></TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(reg.registeredAt), 'dd MMM yy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 dark:hover:bg-gray-800"
                                onClick={() => { setFocusedReg(reg); setDetailsOpen(true); }}
                              >
                                <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5 dark:text-gray-400" />
                              </Button>
                              <ActionDropdown
                                trigger={
                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 dark:hover:bg-gray-800">
                                    <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-3.5 w-3.5 dark:text-gray-400" />
                                  </Button>
                                }
                                items={[
                                  { label: 'View Details', icon: ViewIcon, onClick: () => { setFocusedReg(reg); setDetailsOpen(true); } },
                                  ...(reg.status !== 'attended' && reg.status !== 'cancelled'
                                    ? [{ label: 'Check In', icon: UserCheck01Icon, onClick: () => handleCheckIn(reg._id) }]
                                    : []),
                                  ...(!reg.certificateIssued && reg.status === 'attended'
                                    ? [{ label: 'Issue Certificate', icon: ChampionIcon, onClick: () => handleIssueCertificate(reg._id) }]
                                    : []),
                                  ...(reg.paymentStatus !== 'completed'
                                    ? [
                                        { divider: true, section: 'Payment' } as const,
                                        { label: 'Mark Completed', icon: CheckmarkCircle02Icon, onClick: () => handleUpdatePayment(reg._id, 'completed') },
                                        { label: 'Mark Failed', icon: CancelCircleIcon, onClick: () => handleUpdatePayment(reg._id, 'failed') },
                                      ]
                                    : []),
                                  ...(reg.status !== 'cancelled'
                                    ? [
                                        { divider: true } as const,
                                        { label: 'Cancel Registration', icon: Delete03Icon, onClick: () => { setFocusedReg(reg); setCancelOpen(true); }, danger: true },
                                      ]
                                    : []),
                                ]}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
                    <PaginationWithInfo
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      totalItems={pagination.total}
                      itemsPerPage={filters.limit}
                      onPageChange={handlePageChange}
                      showInfo
                      showPageNumbers
                      maxVisiblePages={5}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Mobile ── */}
          <div className="md:hidden">
            {isLoading ? (
              <RegistrationsSkeleton />
            ) : registrations.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-3">
                  <HugeiconsIcon icon={UserMultiple02Icon} className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Registrations Found</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{hasFilters ? 'No matches for your filters' : 'No one has registered yet'}</p>
              </div>
            ) : (
              <>
                <Accordion>
                  {registrations.map((reg) => (
                    <MobileCard
                      key={reg._id}
                      registration={reg}
                      isSelected={selected.has(reg._id)}
                      onSelect={toggleSelect}
                      onViewDetails={(r) => { setFocusedReg(r); setDetailsOpen(true); }}
                      onCheckIn={handleCheckIn}
                      onCancel={(id) => { setFocusedReg(reg); setCancelOpen(true); }}
                      onIssueCertificate={handleIssueCertificate}
                    />
                  ))}
                </Accordion>
                {pagination && pagination.pages > 1 && (
                  <div className="mt-4">
                    <PaginationWithInfo
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      totalItems={pagination.total}
                      itemsPerPage={filters.limit}
                      onPageChange={handlePageChange}
                      showInfo
                      showPageNumbers={false}
                      maxVisiblePages={3}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Details Modal ── */}
        <Modal
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title="Registration Details"
          description={focusedReg ? `#${focusedReg.registrationNumber}` : undefined}
          footer={
            <div className="flex flex-wrap gap-2 justify-end">
              <Button type="button" onClick={() => setDetailsOpen(false)} variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                Close
              </Button>
              {focusedReg?.status !== 'attended' && focusedReg?.status !== 'cancelled' && (
                <Button type="button" onClick={() => { if (focusedReg) handleCheckIn(focusedReg._id); setDetailsOpen(false); }} size="sm" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white">
                  <HugeiconsIcon icon={UserCheck01Icon} className="h-3.5 w-3.5 mr-1.5" /> Check In
                </Button>
              )}
              {!focusedReg?.certificateIssued && focusedReg?.status === 'attended' && (
                <Button type="button" onClick={() => focusedReg && handleIssueCertificate(focusedReg._id)} variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  <HugeiconsIcon icon={ChampionIcon} className="h-3.5 w-3.5 mr-1.5" /> Issue Certificate
                </Button>
              )}
              {focusedReg?.status !== 'cancelled' && (
                <Button type="button" onClick={() => { setDetailsOpen(false); setCancelOpen(true); }} variant="outline" size="sm" className="border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50">
                  <HugeiconsIcon icon={Delete03Icon} className="h-3.5 w-3.5 mr-1.5" /> Cancel
                </Button>
              )}
            </div>
          }
        >
          {focusedReg && (
            <div className="space-y-6">
              {focusedReg.isGroupRegistration && (
                <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HugeiconsIcon icon={UserMultiple02Icon} className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Group Registration</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {focusedReg.groupName && (
                      <div>
                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wide font-semibold mb-0.5">Group Name</p>
                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{focusedReg.groupName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wide font-semibold mb-0.5">Members</p>
                      <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{focusedReg.groupMembers?.length ?? 0}</p>
                    </div>
                  </div>
                  {(focusedReg.groupMembers?.length ?? 0) > 0 && (
                    <div className="border-t border-indigo-100 dark:border-indigo-900 pt-3 space-y-1.5 max-h-36 overflow-y-auto">
                      {focusedReg.groupMembers?.map((m, i) => (
                        <div key={m._id || i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-xs">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">{m.name}</span>
                            <span className="text-gray-400 dark:text-gray-500 ml-2">{m.email}</span>
                          </div>
                          {m.phone && <span className="text-gray-400 dark:text-gray-500">{m.phone}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {focusedReg.isCorporateRegistration && (
                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HugeiconsIcon icon={Building03Icon} className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">Corporate Registration</span>
                  </div>
                  {focusedReg.companyName && (
                    <p className="text-xs text-blue-600 dark:text-blue-300">Company: {focusedReg.companyName}</p>
                  )}
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{focusedReg.companyMembers?.length ?? 0} company members</p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field label="Name">{focusedReg.attendeeName}</Field>
                  <Field label="Email"><span className="break-all">{focusedReg.attendeeEmail}</span></Field>
                  {focusedReg.attendeePhone && <Field label="Phone">{focusedReg.attendeePhone}</Field>}
                  {focusedReg.attendeeGender && <Field label="Gender"><span className="capitalize">{focusedReg.attendeeGender}</span></Field>}
                  {focusedReg.ageGroup && <Field label="Age Group">{focusedReg.ageGroup}</Field>}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Registration Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field label="Plan">{focusedReg.planName}</Field>
                  <Field label="Price">₦{focusedReg.price.toLocaleString()}</Field>
                  <Field label="Status"><StatusBadge status={focusedReg.status} /></Field>
                  <Field label="Payment"><PaymentStatusBadge status={focusedReg.paymentStatus} /></Field>
                  <Field label="Reg. Number"><span className="font-mono text-xs">{focusedReg.registrationNumber}</span></Field>
                  <Field label="Ticket ID"><span className="font-mono text-xs">{focusedReg.ticketId || 'N/A'}</span></Field>
                  <Field label="Registered At"><span className="text-xs">{format(new Date(focusedReg.registeredAt), 'PPP p')}</span></Field>
                  <Field label="Certificate">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      focusedReg.certificateIssued
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}>
                      {focusedReg.certificateIssued ? 'Issued' : 'Not Issued'}
                    </span>
                  </Field>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Cancel Modal ── */}
        <Modal
          isOpen={cancelOpen}
          onClose={() => { setCancelOpen(false); setCancelReason(''); }}
          title="Cancel Registration"
          description="This action cannot be undone"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={() => { setCancelOpen(false); setCancelReason(''); }} variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                Keep Registration
              </Button>
              <Button type="button" onClick={() => focusedReg && handleCancel(focusedReg._id, cancelReason)} size="sm" className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white">
                <HugeiconsIcon icon={Delete03Icon} className="h-3.5 w-3.5 mr-1.5" /> Confirm Cancel
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl">
              <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1.5">This will:</p>
                <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
                  <li>· Mark the registration as cancelled</li>
                  <li>· Release the seat back to the event</li>
                  <li>· Cancel the associated ticket</li>
                  <li>· Send a cancellation notification</li>
                </ul>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Reason <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <Input
                placeholder="Reason for cancellation…"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>
        </Modal>

        {/* ── Bulk Action Modal ── */}
        <Modal
          isOpen={bulkDialog.open}
          onClose={() => setBulkDialog({ open: false, action: '' })}
          title={
            bulkDialog.action === 'checkin' ? 'Bulk Check-in'
            : bulkDialog.action === 'cancel' ? 'Bulk Cancellation'
            : 'Bulk Action'
          }
          description={`Affects ${selected.size} registration${selected.size !== 1 ? 's' : ''}`}
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={() => setBulkDialog({ open: false, action: '' })} variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBulkAction}
                size="sm"
                className={
                  bulkDialog.action === 'cancel'
                    ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white'
                }
              >
                Confirm
              </Button>
            </div>
          }
        >
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Are you sure you want to proceed with this bulk action on{' '}
              <strong>{selected.size} registration{selected.size !== 1 ? 's' : ''}</strong>?
              This cannot be undone.
            </p>
          </div>
        </Modal>
      </div>
    </>
  );
}