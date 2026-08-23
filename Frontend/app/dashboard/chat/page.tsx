"use client"

import { ChatPage } from "@/components/dashboard/pages/chat"
import { ChatSidebar } from "@/components/dashboard/chat-sidebar"
import { useSearchParams } from "next/navigation"

export default function ChatRoute() {
  return <ChatPageWithSidebar />
}

function ChatPageWithSidebar() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversation") || undefined

  return (
    <div className="flex h-full">
      <ChatSidebar conversationId={conversationId} />
      <div className="flex-1 min-w-0">
        <ChatPage />
      </div>
    </div>
  )
}