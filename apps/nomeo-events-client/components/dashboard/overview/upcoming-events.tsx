const MOCK_EVENTS = [
  { id: "1", title: "Lagos Tech Summit 2025", date: "2025-05-18", city: "Lagos", attendees: 420 },
  { id: "2", title: "Afrobeats Night Live", date: "2025-06-02", city: "Abuja", attendees: 900 },
  { id: "3", title: "SME Business Fair", date: "2025-06-14", city: "Port Harcourt", attendees: 250 },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function UpcomingEvents() {
  return (
    <div className="rounded-xl border border-border bg-background p-6 md:p-5">
      <p className="text-xs md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 md:mb-3">
        Upcoming events
      </p>
      <div className="flex flex-col divide-y divide-border">
        {MOCK_EVENTS.map((ev) => {
          const d = new Date(ev.date);
          return (
            <div key={ev.id} className="flex items-center gap-4 md:gap-3 py-3 md:py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-[44px] md:min-w-[38px] text-center bg-muted rounded-md py-2 md:py-1 px-2 md:px-1.5">
                <p className="text-lg md:text-base font-semibold leading-none">{d.getDate()}</p>
                <p className="text-xs md:text-[10px] text-muted-foreground mt-1 md:mt-0.5 font-medium">{MONTHS[d.getMonth()]}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-xs font-semibold truncate">{ev.title}</p>
                <p className="text-xs md:text-[11px] text-muted-foreground mt-0.5">{ev.city}</p>
              </div>
              <div className="text-right">
                <p className="text-sm md:text-xs font-semibold">{ev.attendees.toLocaleString()}</p>
                <p className="text-xs md:text-[10px] text-muted-foreground font-medium">registered</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}