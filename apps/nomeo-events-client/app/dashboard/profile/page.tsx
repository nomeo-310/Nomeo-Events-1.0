import { DashboardLayout } from "@/components/dashboard/layout/main-layout";
import ProfilePage from "@/components/dashboard/profile/profile-page";
import { getCurrentUser } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Don't prerender this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Profile = async () => {

  const loggedInUser = await getCurrentUser();

  if (!loggedInUser) {
    redirect('/');
  }
  
  return (
    <DashboardLayout user={loggedInUser}>
      <ProfilePage/>
    </DashboardLayout>
  )
}

export default Profile;