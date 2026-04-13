
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DashboardPage from "@/components/dashboard/dashboard-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard',
}

const Dashboard = async () => {
  
  return (
    <DashboardLayout>
      <DashboardPage/>
    </DashboardLayout>
  )
}

export default Dashboard;