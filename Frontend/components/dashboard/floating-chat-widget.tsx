"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare, X, Plus, ExternalLink, MessageCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { listConversations, createConversation, deleteConversation } from "@/api/services/conversations"
import type { Conversation } from "@/api/services/conversations"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function FloatingChatWidget() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleNewChat = async () => {
    try {
      const created = await createConversation(newChatTitle || "New Chat")
      setNewChatTitle("")
      setIsOpen(false)
      router.push(`/dashboard/chat?conversation=${created.id}`)
      toast.success("Chat created")
    } catch {
      toast.error("Failed to create chat")
    }
  }

  const handleSelectChat = (id: string) => {
    setIsOpen(false)
    router.push(`/dashboard/chat?conversation=${id}`)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      setDeleteConfirmId(null)
      toast.success("Chat deleted")
    } catch {
      toast.error("Failed to delete chat")
    }
  }

  if (pathname === "/dashboard/chat") {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-3 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">AI Chat</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-3 border-b border-border/60">
            <div className="flex gap-2">
              <Input
                placeholder="New chat title..."
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewChat()}
                className="h-8 text-xs"
              />
              <Button size="sm" onClick={handleNewChat} className="shrink-0 h-8">
                <Plus className="h-3.5 w-3.5 mr-1" />
                New
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64 sm:h-80">
            <div className="p-2">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No chats yet
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    Start a new conversation to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted/60 transition-colors cursor-pointer"
                      onClick={() => handleSelectChat(conv.id)}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs">
                          {conv.title?.[0]?.toUpperCase() ?? "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">
                          {conv.title || "New Chat"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      {deleteConfirmId === conv.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(conv.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirmId(null)
                            }}
                          >
                            <span className="text-[10px] font-medium">ESC</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(conv.id)
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-2 border-t border-border/60 bg-muted/20">
            <Button
              variant="ghost"
              className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsOpen(false)
                router.push("/dashboard/chat")
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Open Full Chat
            </Button>
          </div>
        </div>
      )}

      <Button
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
          isOpen
            ? "bg-slate-700 hover:bg-slate-800 text-white rotate-90"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}
