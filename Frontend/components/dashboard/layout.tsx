"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { MainContent } from "./main-content"
import { SettingsDialog } from "./settings-dialog"

export function DashboardLayout() {
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
        <MainContent onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Settings Dialog */}
        <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  )
}
