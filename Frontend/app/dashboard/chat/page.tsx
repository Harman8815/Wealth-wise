"use client"

import { useState } from "react";
import { ChatPageContent } from "@/components/dashboard/pages/chat-content"
import { ChatSidebar } from "@/components/dashboard/chat-sidebar"
import { CapabilitiesSidebar } from "@/components/dashboard/pages/capabilities-sidebar"
import { useSearchParams } from "next/navigation"

export default function ChatRoute() {
  return <ChatPageWithSidebar />
}

function ChatPageWithSidebar() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversation") || undefined
  const [externalAgentId, setExternalAgentId] = useState<string | null>(null)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0B0F19]">
      <ChatSidebar conversationId={conversationId} />
      <div className="flex-1 min-w-0 flex">
        <ChatPageContent 
          conversationId={conversationId} 
          externalAgentId={externalAgentId ?? undefined}
          onAgentHandled={() => setExternalAgentId(null)}
        />
        <CapabilitiesSidebar onCardClick={(agentId) => setExternalAgentId(agentId)} />
      </div>
    </div>
  )
}