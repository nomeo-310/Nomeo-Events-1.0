import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { requireAdminUser } from "@/lib/session";

const Dashboard = async () => {
  requireAdminUser();
  
  return (
    <DashboardLayout>
      Dashboard
    </DashboardLayout>
  )
}

export default Dashboard;