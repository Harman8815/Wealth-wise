"use client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  PiggyBank,
  CreditCard,
  BarChart3,
  Target,
  Bell,
  Settings,
  ArrowLeft,
  BarChart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onSettingsClick: () => void
}

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: PiggyBank, label: "Budget Planner", href: "/dashboard/budget" },
  { icon: CreditCard, label: "Transactions", href: "/dashboard/transactions" },
  { icon: BarChart3, label: "Reports & Insights", href: "/dashboard/reports" },
  { icon: Target, label: "Goals", href: "/dashboard/goals" },
  { icon: Bell, label: "Alerts & Notifications", href: "/dashboard/alerts" },
]

function SidebarContent({ onSettingsClick }: { onSettingsClick: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            WealthWise
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start bg-transparent"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.label}
              variant={isActive ? "default" : "ghost"}
              className={cn("w-full justify-start", isActive && "bg-blue-600 text-white hover:bg-blue-700")}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" className="w-full justify-start" onClick={onSettingsClick}>
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ isOpen, onClose, onSettingsClick }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-40">
        <SidebarContent onSettingsClick={onSettingsClick} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onSettingsClick={onSettingsClick} />
        </SheetContent>
      </Sheet>
    </>
  )
}
