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
  FolderKanban,
  ArrowDownUp,
  Repeat,
  MessageSquare,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { ProjectSwitcher } from "@/components/dashboard/project-switcher"
import { useActiveProject } from "@/components/project/project-context"
import { useUnreadCount } from "@/lib/notifications"
import { useState, useEffect } from "react"
import { listConversations, deleteConversation, renameConversation, type Conversation } from "@/api/services/conversations"

interface SidebarProps {
  onSettingsClick: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FolderKanban, label: "Projects", href: "/dashboard/projects", badge: "projects" },
  { icon: PiggyBank, label: "Budget Planner", href: "/dashboard/budget" },
  { icon: CreditCard, label: "Transactions", href: "/dashboard/transactions" },
  { icon: BarChart3, label: "Reports & Insights", href: "/dashboard/reports" },
  { icon: Sparkles, label: "AI Insights", href: "/dashboard/ai-insights" },
  { icon: ArrowDownUp, label: "Import & Export", href: "/dashboard/import-export" },
  { icon: Target, label: "Goals", href: "/dashboard/goals" },
  { icon: Repeat, label: "Recurring", href: "/dashboard/recurring" },
  { icon: Bell, label: "Alerts", href: "/dashboard/alerts", badge: "alerts" },
  { icon: MessageSquare, label: "AI Chat", href: "/dashboard/chat" },
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
  const { projects } = useActiveProject()
  const unreadCount = useUnreadCount()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const badgeValue = (kind?: string): number => {
    if (kind === "projects") return projects.length
    if (kind === "alerts") return unreadCount
    return 0
  }

  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      const data = await listConversations()
      setConversations(data.results)
    } catch {
      // ignore
    } finally {
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    if (pathname === "/dashboard/chat") {
      loadConversations()
    }
  }, [pathname])

  const handleNewChat = async () => {
    router.push("/dashboard/chat")
    await loadConversations()
  }

  const handleSelectChat = (id: string) => {
    router.push(`/dashboard/chat?conversation=${id}`)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteConversation(id)
    await loadConversations()
  }

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id)
    setEditTitle(title || "")
  }

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim())
      await loadConversations()
    }
    setEditingId(null)
  }

  const showConversations = pathname === "/dashboard/chat" && !isCollapsed

  return (
    <div className="flex flex-col h-full bg-[#020617]/80 backdrop-blur-md text-slate-200 border-r border-slate-800 transition-all duration-300">
      {/* Header */}
      <div className={cn("p-4 border-b border-slate-800 flex items-center justify-between transition-all duration-300", isCollapsed ? "justify-center" : "")}>
        <div className={cn("flex items-center space-x-2 overflow-hidden", isCollapsed ? "w-0 hidden" : "w-auto flex")}>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
            WealthWise
          </span>
        </div>
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 mb-2 mt-1">
            <BarChart3 className="w-5 h-5 text-white" />
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

      {/* Project switcher */}
      <div className={cn("px-3 pt-3", isCollapsed && "hidden")}>
        <ProjectSwitcher />
      </div>

      {/* Conversations */}
      {showConversations && (
        <div className="px-3 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chats</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-white"
              onClick={handleNewChat}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {loadingConversations ? (
              <p className="text-xs text-slate-500 px-2">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-slate-500 px-2">No chats yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                    pathname === "/dashboard/chat" && conv.title
                      ? "bg-slate-800/50 text-white"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  )}
                  onClick={() => handleSelectChat(conv.id)}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {editingId === conv.id ? (
                    <input
                      className="flex-1 bg-transparent text-sm outline-none border-b border-blue-500"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveEdit(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(conv.id)
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="truncate flex-1 text-left">{conv.title || "New Chat"}</span>
                  )}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-slate-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(conv.id, conv.title || "")
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-slate-400 hover:text-red-400"
                      onClick={(e) => handleDelete(conv.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.label}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full transition-all duration-300 relative",
                isCollapsed ? "justify-center px-2" : "justify-start px-4",
                isActive 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              )}
              onClick={() => router.push(item.href)}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5", isCollapsed ? "mr-0" : "mr-3 shrink-0")} />
              {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              {item.badge && badgeValue(item.badge) > 0 && (
                isCollapsed ? (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white min-w-[14px] h-[14px] px-1">
                    {badgeValue(item.badge) > 99 ? "99+" : badgeValue(item.badge)}
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px] h-[18px]">
                    {badgeValue(item.badge) > 99 ? "99+" : badgeValue(item.badge)}
                  </span>
                )
              )}
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
  const { isSidebarOpen, openSidebar, closeSidebar } = useDashboardSidebar()

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
      <Sheet
        open={isSidebarOpen}
        onOpenChange={(open) => {
          if (open) {
            openSidebar()
          } else {
            closeSidebar()
          }
        }}
      >
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
