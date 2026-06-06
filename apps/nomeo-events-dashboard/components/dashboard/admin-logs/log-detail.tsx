import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type AdminLog } from '@/hooks/use-admin-logs';
import { SeverityBadge, StatusBadge } from './log-badges';
import { formatDate, formatDuration, labelForAction, labelForCategory } from './log-types';

// ─── DetailBox ────────────────────────────────────────────────────────────────

export function DetailBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── LogDetail ────────────────────────────────────────────────────────────────

export function LogDetail({ log }: { log: AdminLog }) {
  return (
    <div className="space-y-5">
      {/* ID + badges */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Log ID</p>
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{log._id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <SeverityBadge severity={log.severity} />
          <StatusBadge status={log.status} />
        </div>
      </div>

      {/* Grid: admin + timing + action + endpoint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DetailBox label="Admin">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.adminName}</p>
          <p className="text-xs text-gray-500">{log.adminEmail}</p>
          <Badge variant="outline" className="mt-1.5 capitalize text-[10px] dark:border-gray-700">
            {log.adminRole.replace(/_/g, ' ')}
          </Badge>
        </DetailBox>

        <DetailBox label="Time & Network">
          <p className="text-sm text-gray-900 dark:text-white">{formatDate(log.createdAt)}</p>
          <p className="text-xs text-gray-500 mt-0.5">IP: {log.ipAddress}</p>
          {log.duration && (
            <p className="text-xs text-gray-500 mt-0.5">Duration: {formatDuration(log.duration)}</p>
          )}
        </DetailBox>

        <DetailBox label="Action">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {labelForAction(log.action)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Category: {labelForCategory(log.actionCategory ?? '')}
          </p>
        </DetailBox>

        <DetailBox label="Endpoint">
          <p className="text-sm text-gray-900 dark:text-white break-all">{log.endpoint ?? 'N/A'}</p>
          {log.method && (
            <Badge variant="outline" className="mt-1.5 text-[10px] dark:border-gray-700">
              {log.method}
            </Badge>
          )}
        </DetailBox>
      </div>

      {/* Details */}
      <DetailBox label="Details">
        <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{log.details}</p>
      </DetailBox>

      {/* Reason */}
      {log.reason && (
        <DetailBox label="Reason">
          <p className="text-sm text-gray-900 dark:text-white">{log.reason}</p>
        </DetailBox>
      )}

      {/* Target */}
      {log.targetType && (
        <DetailBox label="Target">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-gray-500">Type:</span>{' '}
              <span className="font-medium dark:text-white">{log.targetType}</span>
            </span>
            {log.targetName && (
              <span>
                <span className="text-gray-500">Name:</span>{' '}
                <span className="font-medium dark:text-white">{log.targetName}</span>
              </span>
            )}
            {log.targetId && (
              <span className="text-xs text-gray-400">ID: {log.targetId}</span>
            )}
          </div>
        </DetailBox>
      )}

      {/* Changes */}
      {log.changes && log.changes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Changes ({log.changes.length})
          </p>
          <div className="space-y-2">
            {log.changes.map((change, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {change.field}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Before</p>
                    <p className="bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-300 text-xs break-all">
                      {change.oldValue !== undefined ? String(change.oldValue) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">After</p>
                    <p className="bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-300 text-xs break-all">
                      {change.newValue !== undefined ? String(change.newValue) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {log.errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Error Message</p>
          <p className="text-sm text-red-700 dark:text-red-400">{log.errorMessage}</p>
        </div>
      )}

      {/* Reversion */}
      {log.reversible && (
        <div className={cn(
          'rounded-lg p-4 border',
          log.revertedAt
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50',
        )}>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            {log.revertedAt ? 'Reverted Action' : 'Reversible Action'}
          </p>
          {log.revertedAt ? (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reverted at {formatDate(log.revertedAt)}
              </p>
              {log.reversionReason && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Reason: {log.reversionReason}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              This action can be reverted
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Metadata
          </p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 overflow-x-auto">
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* User agent */}
      {log.userAgent && (
        <DetailBox label="User Agent">
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{log.userAgent}</p>
        </DetailBox>
      )}
    </div>
  );
}