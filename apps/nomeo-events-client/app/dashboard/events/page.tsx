import EventsPage from "@/components/dashboard/events/all-events/events-page";
import { DashboardLayout } from "@/components/dashboard/layout/main-layout";
import { getCurrentUser } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Don't prerender this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Events = async () => {

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/');
  }
  
  return (
    <DashboardLayout user={loggedInUser}>
      <EventsPage/>
    </DashboardLayout>
  )
}

export default Events;