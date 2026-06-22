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
  BarChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "@/contexts/sidebar-context"

interface SidebarProps {
  onSettingsClick: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: PiggyBank, label: "Budget Planner", href: "/dashboard/budget" },
  { icon: CreditCard, label: "Transactions", href: "/dashboard/transactions" },
  { icon: BarChart3, label: "Reports & Insights", href: "/dashboard/reports" },
  { icon: Target, label: "Goals", href: "/dashboard/goals" },
  { icon: Bell, label: "Alerts & Notifications", href: "/dashboard/alerts" },
]

function SidebarContent({ 
  onSettingsClick, 
  isCollapsed, 
  onToggleCollapse 
}: { 
  onSettingsClick: () => void
  isCollapsed: boolean
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex flex-col h-full bg-[#020617]/80 backdrop-blur-md text-slate-200 border-r border-slate-800 transition-all duration-300">
      {/* Header */}
      <div className={cn("p-4 border-b border-slate-800 flex items-center justify-between transition-all duration-300", isCollapsed ? "justify-center" : "")}>
        <div className={cn("flex items-center space-x-2 overflow-hidden", isCollapsed ? "w-0 hidden" : "w-auto flex")}>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <BarChart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
            WealthWise
          </span>
        </div>
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 mb-2 mt-1">
            <BarChart className="w-5 h-5 text-white" />
          </div>
        )}
        
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.label}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full transition-all duration-300",
                isCollapsed ? "justify-center px-2" : "justify-start px-4",
                isActive 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              )}
              onClick={() => router.push(item.href)}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5", isCollapsed ? "mr-0" : "mr-3 shrink-0")} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Button>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-slate-800">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-800/50",
            isCollapsed ? "justify-center px-2" : "justify-start px-4"
          )} 
          onClick={onSettingsClick}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className={cn("w-5 h-5", isCollapsed ? "mr-0" : "mr-3 shrink-0")} />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ onSettingsClick, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar()

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden lg:block h-screen fixed left-0 top-0 z-40 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent 
          onSettingsClick={onSettingsClick} 
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0 bg-transparent">
          <SidebarContent 
            onSettingsClick={onSettingsClick} 
            isCollapsed={false} 
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
