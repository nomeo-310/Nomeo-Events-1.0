// newsletter-tables.tsx
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon as CheckCircleIcon,
  MoreHorizontalCircle01Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
  Delete01Icon,
  SentIcon as SendIcon,
} from "@hugeicons/core-free-icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { ActionDropdown } from "./newsletter-components";
import { statusTone, campaignStatusTone, getInitials, formatDate } from "./newsletter-types";
import type { Campaign, NewsletterSubscriber } from "@/types/newsletter";

interface SubscribersTableProps {
  subscribers: NewsletterSubscriber[];
  selectedSubscribers: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onView: (subscriber: NewsletterSubscriber) => void;
  onUnsubscribe: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SubscribersTable({
  subscribers,
  selectedSubscribers,
  onSelectAll,
  onToggleSelect,
  onView,
  onUnsubscribe,
  onDelete,
}: SubscribersTableProps) {
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

interface CampaignsTableProps {
  campaigns: Campaign[];
  onView: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
}

export function CampaignsTable({ campaigns, onView, onDelete, onSend }: CampaignsTableProps) {
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

interface BulkRecipientsTableProps {
  recipients: { email: string; name?: string }[];
  onRemove: (index: number) => void;
}

export function BulkRecipientsTable({ recipients, onRemove }: BulkRecipientsTableProps) {
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