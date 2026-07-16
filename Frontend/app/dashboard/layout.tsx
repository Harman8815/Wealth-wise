"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SettingsDialog } from "@/components/dashboard/settings-dialog"
import { DashboardSidebarProvider } from "@/components/dashboard/sidebar-context"
import { NotificationToasts } from "@/components/dashboard/notification-toasts"
import { useIsAuthenticated } from "@/hooks/use-auth"
import { useActiveProject } from "@/components/project/project-context"
import { cn } from "@/lib/utils"
import { NotificationProvider } from "@/lib/notifications"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useIsAuthenticated()
  const { isSwitchingProject } = useActiveProject()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <NotificationProvider>
      <DashboardSidebarProvider>
        {isSwitchingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Switching project...</p>
            </div>
          </div>
        )}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex">
            {/* Sidebar */}
            <Sidebar
              onSettingsClick={() => setIsSettingsOpen(true)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content */}
            <div
              className={cn(
                "flex-1 transition-all duration-300",
                isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
              )}
            >
              {children}
            </div>

            {/* Notification Toasts */}
            <NotificationToasts />

            {/* Settings Dialog */}
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          </div>
        </div>
      </DashboardSidebarProvider>
    </NotificationProvider>
  )
}
