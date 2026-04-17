import { useMyProfile } from "@/hooks/use-profile";

export function StatsRow() {
  const { data: profile } = useMyProfile();

  const stats = [
    { label: "Total events", value: profile?.totalEvents ?? "—" },
    { 
      label: "Total attendees", 
      value: profile?.totalAttendees != null
        ? profile.totalAttendees >= 1000
          ? (profile.totalAttendees / 1000).toFixed(1) + "k"
          : profile.totalAttendees
        : "—" 
    },
    { 
      label: "Avg rating", 
      value: profile?.averageRating != null
        ? profile.averageRating.toFixed(1) + " ★"
        : "—" 
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-muted/50 rounded-lg p-4 md:p-3 text-center">
          <p className="text-xl md:text-lg font-semibold">{s.value}</p>
          <p className="text-xs md:text-[10px] text-muted-foreground mt-1 md:mt-0.5 font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}