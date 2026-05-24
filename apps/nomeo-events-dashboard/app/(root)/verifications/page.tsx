import { AdminDashboardLayout, AdminRole } from "@/components/dashboard/dashboard-layout/dashboard-layout";
import VerificationsPage from "@/components/dashboard/verifications/verifications-page";
import { getCurrentUser, requireAdminUser } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: 'Verifications',
}

const Verifications = async () => {
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
      <VerificationsPage/>
    </AdminDashboardLayout>
  )
}

export default Verifications;