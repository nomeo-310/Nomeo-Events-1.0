'use client'

import { cn } from "@/lib/utils";
import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export interface LoadingStateProps {
  iconStyle?: string;
  className?: string;
}

const LoadingState = ({ iconStyle, className }: LoadingStateProps) => {
  return (
    <div className={cn('w-full h-screen flex items-center justify-center bg-transparent', className)}>
      <HugeiconsIcon icon={Loading02Icon} className={cn('size-8 lg:size-9 xl:size-10 animate-spin text-primary', iconStyle)}/>
    </div>
  )
}

export default LoadingState;

