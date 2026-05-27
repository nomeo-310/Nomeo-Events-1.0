import { DashboardLayout } from "@/components/dashboard/layout/main-layout";
import SubscriptionPage from "@/components/dashboard/subscriptions/subscription-page";
import { getCurrentUser } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Don't prerender this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Payments = async () => {

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/');
  }
  
  return (
    <DashboardLayout user={loggedInUser}>
      <SubscriptionPage />
    </DashboardLayout>
  )
}

export default Payments;