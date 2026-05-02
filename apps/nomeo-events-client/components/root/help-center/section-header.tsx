import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export const SectionHeader = ({ 
  badge, 
  title, 
  description, 
  centered = true 
}: SectionHeaderProps) => (
  <div className={cn('space-y-4 mb-12', centered && 'text-center')}>
    {badge && (
      <Badge variant="secondary" className="text-xs font-bold px-4 py-3 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 tracking-wide">
        {badge}
      </Badge>
    )}
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
      {title}
    </h2>
    {description && (
      <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        {description}
      </p>
    )}
  </div>
);