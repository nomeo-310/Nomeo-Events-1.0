import { AdminDashboardLayout, AdminRole } from "@/components/dashboard/dashboard-layout/dashboard-layout";
import EventsPage from "@/components/dashboard/events/events-page";
import { getCurrentUser, requireAdminUser } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Events',
}

const Events = async () => {
  await requireAdminUser();

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/login')
  }
 
  const admin = {
    id: loggedInUser?.id,
    name: loggedInUser?.name,
    email: loggedInUser?.email,
    role: loggedInUser?.role as AdminRole,
    status: loggedInUser?.adminStatus
  };
  
  return (
    <AdminDashboardLayout admin={admin}>
      <EventsPage/>
    </AdminDashboardLayout>
  )
}

export default Events;