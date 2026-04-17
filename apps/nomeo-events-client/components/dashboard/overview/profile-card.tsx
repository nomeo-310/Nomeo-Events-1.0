import { useMyProfile, useProfileCompletion, useProfileVerificationStatus } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { DashboardPageProps } from "./dashboard-page";
import { Avatar } from "./avatar";

export function ProfileCard({ user }: DashboardPageProps) {
  const { data: profile, isLoading } = useMyProfile();
  const { checklist, percentage: completionPercentage } = useProfileCompletion();
  const { isVerified, isPending } = useProfileVerificationStatus();

  const displayName = profile?.fullName || user.name;
  const avatarSrc = profile?.profilePicture?.secure_url || user.avatar || undefined;

  const pctHint =
    completionPercentage < 50
      ? "Complete your profile to get discovered by attendees."
      : completionPercentage < 80
      ? "Almost there — a few more details will boost your visibility."
      : completionPercentage < 100
      ? "Nearly complete! Verify your account to build trust."
      : "Your profile is fully complete!";

  return (
    <div className="rounded-xl border border-border bg-background p-6 md:p-5 flex flex-col gap-5 md:gap-4">
      {/* Header */}
      <div className="flex items-center gap-4 md:gap-3">
        {isLoading ? (
          <div className="w-[80px] h-[80px] md:w-[72px] md:h-[72px] rounded-full bg-muted animate-pulse flex-shrink-0" />
        ) : (
          <Avatar src={avatarSrc} name={displayName} size={80} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-lg md:text-sm font-semibold truncate">
            {isLoading ? <span className="inline-block h-5 md:h-4 w-36 md:w-32 bg-muted rounded animate-pulse" /> : displayName}
          </p>
          <p className="text-sm md:text-xs text-muted-foreground mt-1 md:mt-0.5">
            {user.role === "admin" ? "Administrator" : "Event Organizer"}
          </p>
          {!isLoading && (
            <span
              className={cn(
                "inline-block mt-2 md:mt-1.5 text-xs md:text-[10px] font-semibold px-2.5 md:px-2 py-1 md:py-0.5 rounded-full",
                isVerified
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : isPending
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              )}
            >
              {isVerified ? "Verified" : isPending ? "Pending verification" : "Unverified"}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 md:space-y-1.5">
        <div className="flex justify-between text-sm md:text-xs text-muted-foreground">
          <span>Profile completion</span>
          <span className="font-semibold text-foreground">{completionPercentage}%</span>
        </div>
        <div className="h-2 md:h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs md:text-[11px] text-muted-foreground leading-relaxed">{pctHint}</p>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-2 md:gap-1.5">
        {checklist &&
          [...checklist]
            .sort((a, b) => Number(b.completed) - Number(a.completed))
            .slice(0, 7)
            .map((item) => (
              <a
                key={item.key}
                href={item.completed ? undefined : '/dashboard/profile'}
                className={cn(
                  "flex items-center gap-2 md:gap-2 text-sm md:text-xs group",
                  item.completed ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 md:w-3.5 md:h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center",
                    item.completed
                      ? "bg-green-500 border-green-500"
                      : "border-border group-hover:border-muted-foreground"
                  )}
                >
                  {item.completed && (
                    <svg viewBox="0 0 10 8" width="8" height="8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="flex-1">{item.label}</span>
                {!item.completed && (
                  <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" width="12" height="12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </a>
            ))}
      </div>
    </div>
  );
}