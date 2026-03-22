"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SettingsDialog } from "@/components/dashboard/settings-dialog"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">{children}</div>

        {/* Settings Dialog */}
        <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  )
}
