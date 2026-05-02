import EventRegistrations from "@/components/dashboard/events/registrations/event-registrations";
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

const Registrations = async () => {

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/');
  }
  
  return (
    <DashboardLayout user={loggedInUser}>
      <EventRegistrations/>
    </DashboardLayout>
  )
}

export default Registrations;