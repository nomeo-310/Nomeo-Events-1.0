import { DashboardLayout } from "@/components/dashboard/layout/main-layout";
import ProfilePage from "@/components/dashboard/profile/profile-page";
import SettingsPage from "@/components/dashboard/settings/settings-page";
import { getCurrentUser } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Don't prerender this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Settings = async () => {

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/');
  }
  
  return (
    <DashboardLayout user={loggedInUser}>
      <SettingsPage user={loggedInUser}/>
    </DashboardLayout>
  )
}

export default Settings;