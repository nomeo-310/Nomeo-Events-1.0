"use client"

import { ReactNode } from "react";

export interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children}: DashboardLayoutProps) => {
  
  return (
    <div>
      layout-first
      {children}
    </div>
  )
}

export default DashboardLayout;