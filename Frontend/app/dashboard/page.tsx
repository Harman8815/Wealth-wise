"use client";

import { MainContent } from "@/components/dashboard/main-content";
import { useSidebar } from "@/contexts/sidebar-context";

export default function DashboardPage() {
  const { setIsSidebarOpen } = useSidebar();

  return <MainContent onMenuClick={() => setIsSidebarOpen(true)} />;
}
