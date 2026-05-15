"use client"

import { useSession } from "@/lib/auth/auth-client";
import React from "react";

const DashboardLayout = ({children}:{children: React.ReactNode}) => {
  const { data: session, isPending } = useSession();
  console.log(session?.user)
  
  return (
    <div>
      {children}
    </div>
  )
}

export default DashboardLayout;