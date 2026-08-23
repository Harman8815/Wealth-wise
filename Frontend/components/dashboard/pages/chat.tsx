"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  AlertCircle,
  Square,
  Plus,
  Trash2,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  sendChatMessageStream,
  sendChatMessage,
  sendAgentMessage,
  type ChatMessage,
  type AgentMessageRequest,
} from "@/api/services/chat";
import {
  createConversation,
  deleteConversation,
  listConversations,
  type Conversation,
} from "@/api/services/conversations";
import {
  agents,
  getAgentName,
  type Agent,
} from "@/api/services/agents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm WealthWise AI. Ask me anything about your finances — budgets, goals, transactions, or savings.",
};

const PROCESSING_MESSAGES = [
  "Understanding your question...",
  "Searching your financial data...",
  "Checking your budget...",
  "Analyzing spending patterns...",
  "Generating insights...",
  "Preparing your response...",
];

type MessageMeta = {
  agentId?: string;
};

export function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation") || undefined;
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [messageMeta, setMessageMeta] = useState<Record<number, MessageMeta>>({});
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [slashQuery, setSlashQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageIndexRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, processingTime]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProcessingTime(0);
    setProcessingMessage("");
    messageIndexRef.current = 0;
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setProcessingTime(0);
    setProcessingMessage(PROCESSING_MESSAGES[0]);
    messageIndexRef.current = 0;
    timerRef.current = setInterval(() => {
      setProcessingTime((prev) => {
        const next = prev + 1;
        if (next % 3 === 0 && messageIndexRef.current < PROCESSING_MESSAGES.length - 1) {
          messageIndexRef.current += 1;
          setProcessingMessage(PROCESSING_MESSAGES[messageIndexRef.current]);
        }
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  const appendMessage = (role: "user" | "assistant", content: string, agentId?: string) => {
    const idx = messages.length;
    setMessages((prev) => [...prev, { role, content }]);
    if (agentId) {
      setMessageMeta((prev) => ({ ...prev, [idx]: { agentId } }));
    }
  };

  const updateLastAssistant = (content: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last.role === "assistant") {
        next[next.length - 1] = { ...last, content };
      }
      return next;
    });
  };

  const handleSendWithAgent = async (text: string, agent?: Agent) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    setSlashQuery("");
    setError(null);
    const agentId = agent?.id;
    appendMessage("user", trimmed, agentId);

    try {
      setIsStreaming(true);
      startTimer();
      abortControllerRef.current = new AbortController();
      let fullReply = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (agentId) {
        const payload: AgentMessageRequest = {
          message: trimmed,
          agent: agentId,
          conversation_id: conversationId,
        };
        await sendAgentMessage(
          payload,
          (token) => {
            fullReply += token;
            updateLastAssistant(fullReply);
          },
          (err) => {
            if (err.message === "Request cancelled by user.") {
              updateLastAssistant(fullReply ? fullReply + " [cancelled]" : "[cancelled]");
              toast.info("Generation stopped");
            } else {
              setError(err.message);
              toast({ title: err.message, variant: "destructive" });
            }
          },
          abortControllerRef.current.signal,
        );
      } else {
        await sendChatMessageStream(
          { message: trimmed, conversation_id: conversationId },
          (token) => {
            fullReply += token;
            updateLastAssistant(fullReply);
          },
          (err) => {
            if (err.message === "Request cancelled by user.") {
              updateLastAssistant(fullReply ? fullReply + " [cancelled]" : "[cancelled]");
              toast.info("Generation stopped");
            } else {
              setError(err.message);
              toast({ title: err.message, variant: "destructive" });
            }
          },
          abortControllerRef.current.signal,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
      toast({ title: message, variant: "destructive" });
    } finally {
      clearTimer();
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const matchedAgent = text.startsWith("/") ? agents.find((a) => a.slashCommand === text.split(" ")[0]) : undefined;
    handleSendWithAgent(text, matchedAgent);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewChat = async () => {
    try {
      const created = await createConversation("New Chat");
      window.location.href = `/dashboard/chat?conversation=${created.id}`;
      toast.success("New chat created");
    } catch {
      toast.error("Failed to create chat");
    }
  };

  const handleDeleteChat = async () => {
    if (!conversationId) return;
    try {
      await deleteConversation(conversationId);
      window.location.href = "/dashboard/chat";
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const filteredAgents = input.startsWith("/")
    ? agents.filter((a) =>
        a.slashCommand.toLowerCase().startsWith(input.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-blue-500" />
            WealthWise AI Chat
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Agents"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => setInput(agent.slashCommand + " ")}
                      className="cursor-pointer"
                    >
                      <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{agent.name}</span>
                        <span className="text-[11px] text-muted-foreground">{agent.description}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleNewChat}
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {conversationId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this conversation and all its messages.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => {
              const meta = messageMeta[idx];
              const agent = meta?.agentId ? agents.find((a) => a.id === meta.agentId) : undefined;
              return (
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
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    {agent && msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 px-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">
                          <agent.icon className="h-3 w-3 mr-1" />
                          {agent.name}
                        </Badge>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-slate-700 text-slate-200">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  {processingMessage && (
                    <span className="text-xs text-slate-400">
                      {processingMessage} {formatTime(processingTime)}
                    </span>
                  )}
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
          {isStreaming && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-muted-foreground">
                Thinking... {formatTime(processingTime)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Stop
              </Button>
            </div>
          )}
          <div className="relative">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask WealthWise AI anything... or type / for agents"
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
            {filteredAgents.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-xl overflow-hidden z-10">
                <div className="p-1">
                  {filteredAgents.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setInput(agent.slashCommand + " ")}
                        className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left hover:bg-muted/60 transition-colors cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{agent.slashCommand}</span>
                          <span className="text-[11px] text-muted-foreground">{agent.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  );
};
