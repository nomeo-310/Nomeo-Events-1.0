import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SEVERITY_CONFIG, STATUS_CONFIG } from './log-types';

export function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  if (!cfg) return <Badge variant="outline">{severity}</Badge>;
  return (
    <Badge className={cn('gap-1 text-[11px]', cfg.color)}>
      <HugeiconsIcon icon={cfg.icon} className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge className={cn('gap-1 text-[11px]', cfg.color)}>
      <HugeiconsIcon icon={cfg.icon} className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}