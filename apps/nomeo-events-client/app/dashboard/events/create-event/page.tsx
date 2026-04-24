import CreateEventPage from "@/components/dashboard/events/create-event/create-event-page";
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

const CreateEvent = async () => {

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/');
  }
  
  return (
    <DashboardLayout user={loggedInUser}>
      <CreateEventPage/>
    </DashboardLayout>
  )
}

export default CreateEvent;