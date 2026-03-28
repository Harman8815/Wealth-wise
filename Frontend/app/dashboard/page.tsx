"use client";

import { MainContent } from "@/components/dashboard/main-content";
import { useState } from "react";

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return <MainContent onMenuClick={() => setIsSidebarOpen(true)} />;
}
