"use client";

import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, User, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendChatMessage, sendChatMessageStream, type ChatMessage } from "@/api/services/chat";

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm WealthWise AI. Ask me anything about your finances — budgets, goals, transactions, or savings.",
};

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const appendMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setError(null);
    appendMessage("user", text);

    try {
      setIsStreaming(true);
      let fullReply = "";
      await sendChatMessageStream(
        { message: text },
        (token) => {
          fullReply += token;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant") {
              next[next.length - 1] = { ...last, content: fullReply };
            } else {
              next.push({ role: "assistant", content: fullReply });
            }
            return next;
          });
        },
        (err) => {
          setError(err.message);
          toast({ title: err.message, variant: "destructive" });
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden border-border/60">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-blue-500" />
            WealthWise AI Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-800 text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-slate-700 text-slate-200">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-red-600 text-white">
                      <AlertCircle className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-red-950/50 text-red-200 border border-red-800/50">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t border-border/60 p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask WealthWise AI anything..."
                disabled={isStreaming}
                className="flex-1 bg-slate-900 border-border focus-visible:ring-blue-500"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
