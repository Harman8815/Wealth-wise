"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { listConversations, createConversation, deleteConversation, renameConversation, type Conversation } from "@/api/services/conversations"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  conversationId?: string
}

export function ChatSidebar({ conversationId }: ChatSidebarProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)

  const loadConversations = async () => {
    setLoading(true)
    try {
      const data = await listConversations()
      setConversations(data.results ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const handleNewChat = async () => {
    try {
      const created = await createConversation("New Chat")
      router.push(`/dashboard/chat?conversation=${created.id}`)
      toast.success("New chat created")
    } catch {
      toast.error("Failed to create chat")
    }
  }

  const handleSelectChat = (id: string) => {
    router.push(`/dashboard/chat?conversation=${id}`)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (conversationId === id) {
        router.push("/dashboard/chat")
      }
      toast.success("Chat deleted")
    } catch {
      toast.error("Failed to delete chat")
    }
  }

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id)
    setEditTitle(title || "")
  }

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) {
      try {
        const updated = await renameConversation(id, editTitle.trim())
        setConversations((prev) => prev.map((c) => c.id === id ? updated : c))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to rename chat"
        toast.error(message)
      }
    }
    setEditingId(null)
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#020617]/80 backdrop-blur-md text-slate-200 border-r border-slate-800 transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
              WealthWise
            </span>
          )}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white shrink-0"
            onClick={handleNewChat}
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-white shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="px-3 pt-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Conversations
          </span>
        </div>
      )}

      <ScrollArea className={cn("flex-1", isCollapsed ? "px-2 pt-2 pb-3" : "px-3 pt-2 pb-3")}>
        <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
          {loading ? (
            <div className={cn("space-y-2", isCollapsed ? "px-0" : "px-2")}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={cn("rounded-md bg-slate-800/50 animate-pulse", isCollapsed ? "h-10 w-10" : "h-10 w-full")} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className={cn("text-xs text-slate-500 py-4 text-center", isCollapsed && "hidden")}>
              No chats yet. Start a new conversation!
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors",
                  isCollapsed ? "justify-center px-2" : "",
                  conversationId === conv.id
                    ? "bg-slate-800/60 text-white"
                    : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
                )}
                onClick={() => handleSelectChat(conv.id)}
              >
                <MessageSquare className={cn("h-3.5 w-3.5 shrink-0 text-slate-400", isCollapsed && "mx-auto")} />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{conv.title || "New Chat"}</span>
                )}
                {!isCollapsed && (
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-white"
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
                      className="h-6 w-6 text-slate-400 hover:text-red-400"
                      onClick={(e) => handleDelete(conv.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 text-center">
            Use the three-dot menu to discover AI agents
          </p>
        </div>
      )}
    </div>
  )
}
