"use client"

import { useGetNotifications } from "@/hooks/use-notification";
import { useMyProfile } from "@/hooks/use-profile";

interface DashboardPageProps {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    role: string
    avatar: string
    createdAt: Date
  }
}

const DashboardPage = ({user}:DashboardPageProps) => {

  const { data:profile } = useMyProfile();
  const { data:notifications } = useGetNotifications();
  console.log(user)


  console.log(profile)
  console.log(notifications);

  return (
    <div>
      dashboard page
    </div>
  )
}

export default DashboardPage;