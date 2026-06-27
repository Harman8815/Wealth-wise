"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

interface DashboardSidebarContextValue {
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
}

const DashboardSidebarContext = React.createContext<DashboardSidebarContextValue | null>(null)

export function DashboardSidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  // Auto-close sidebar on route change
  React.useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  const openSidebar = React.useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = React.useCallback(() => setIsSidebarOpen(false), [])
  const toggleSidebar = React.useCallback(() => setIsSidebarOpen((open) => !open), [])

  return (
    <DashboardSidebarContext.Provider
      value={{ isSidebarOpen, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </DashboardSidebarContext.Provider>
  )
}

export function useDashboardSidebar() {
  const context = React.useContext(DashboardSidebarContext)
  if (!context) {
    throw new Error("useDashboardSidebar must be used within DashboardSidebarProvider")
  }
  return context
}
