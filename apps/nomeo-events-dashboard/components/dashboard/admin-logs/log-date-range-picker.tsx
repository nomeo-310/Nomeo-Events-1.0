import { useState } from 'react';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { CalendarIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: DateRangePickerProps) {
  const [startObj, setStartObj] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined,
  );
  const [endObj, setEndObj] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined,
  );
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const pickStart = (date: Date | undefined) => {
    setStartObj(date);
    onStartDateChange(date ? format(date, 'yyyy-MM-dd') : '');
    setStartOpen(false);
  };

  const pickEnd = (date: Date | undefined) => {
    setEndObj(date);
    onEndDateChange(date ? format(date, 'yyyy-MM-dd') : '');
    setEndOpen(false);
  };

  const clear = () => {
    setStartObj(undefined);
    setEndObj(undefined);
    onClear();
  };

  const triggerCls = cn(
    'flex h-10 lg:h-11 w-[155px] items-center gap-2 rounded-md border border-input',
    'bg-transparent px-3 text-sm font-normal shadow-xs transition-colors cursor-pointer',
    'hover:bg-accent hover:text-accent-foreground focus:outline-none',
    'dark:border-gray-800 dark:bg-gray-900 dark:text-white',
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger>
          <div className={cn(triggerCls, !startObj && 'text-muted-foreground')}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {startObj ? format(startObj, 'dd MMM yyyy') : 'Start date'}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800"
          align="start"
        >
          <Calendar
            mode="single"
            selected={startObj}
            onSelect={pickStart}
            disabled={(d) => (endObj ? d > endObj : false)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      <span className="text-gray-400 text-xs">to</span>

      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger>
          <div className={cn(triggerCls, !endObj && 'text-muted-foreground')}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {endObj ? format(endObj, 'dd MMM yyyy') : 'End date'}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800"
          align="start"
        >
          <Calendar
            mode="single"
            selected={endObj}
            onSelect={pickEnd}
            disabled={(d) => (startObj ? d < startObj : false)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}