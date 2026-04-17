'use client';

import { NotificationPanel } from "./notification-panel";
import { ProfileCard } from "./profile-card";
import { StatsRow } from "./stats-row";
import { UpcomingEvents } from "./upcoming-events";


export interface DashboardPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    avatar: string;
    createdAt: Date;
  };
}

const DashboardPage = ({ user }: DashboardPageProps) => {
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-6 md:gap-5">
          <ProfileCard user={user} />
          <StatsRow />
          <UpcomingEvents />
        </div>

        {/* Right column — notifications */}
        <div className="flex flex-col min-h-[600px] lg:min-h-0">
          <NotificationPanel />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;