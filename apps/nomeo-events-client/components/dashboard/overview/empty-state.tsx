import { cn } from "@/lib/utils";

interface EmptyStateProps {
  status: string;
}

export function EmptyState({ status }: EmptyStateProps) {
  const config = {
    unread: {
      icon: (
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
        </svg>
      ),
      title: "No unread notifications",
      description: "You're all caught up! New notifications will appear here.",
      gradient: "from-orange-500/10 to-transparent",
    },
    read: {
      icon: (
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      title: "No read notifications",
      description: "Notifications you've read will appear here for reference.",
      gradient: "from-blue-500/10 to-transparent",
    },
    archived: {
      icon: (
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 8v13H3V8" />
          <path d="M1 3h22v5H1z" />
          <path d="M10 12h4" />
          <path d="M12 8v8" />
        </svg>
      ),
      title: "No archived notifications",
      description: "Archived notifications will live here. They're never truly gone.",
      gradient: "from-purple-500/10 to-transparent",
    },
  };

  const current = config[status as keyof typeof config];

  return (
    <div className="py-20 md:py-16 text-center relative overflow-hidden">
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b opacity-30",
        current.gradient
      )} />
      <div className="relative">
        <div className="w-24 h-24 md:w-20 md:h-20 mx-auto mb-5 md:mb-4 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
          {current.icon}
        </div>
        <p className="text-base md:text-sm font-semibold text-foreground">{current.title}</p>
        <p className="text-sm md:text-xs text-muted-foreground mt-2 md:mt-1 max-w-[280px] md:max-w-[200px] mx-auto">
          {current.description}
        </p>
      </div>
    </div>
  );
}