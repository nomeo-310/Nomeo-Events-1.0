import { DashboardLayout } from "@/components/dashboard/layout/main-layout";
import DashboardPage from "@/components/dashboard/overview/dashboard-page";
import { getCurrentUser } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Don't prerender this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Dashboard = async () => {

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/');
  }
  
  return (
    <DashboardLayout user={loggedInUser}>
      <DashboardPage user={loggedInUser}/>
    </DashboardLayout>
  )
}

export default Dashboard;