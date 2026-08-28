"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  Square,
  Plus,
  Trash2,
  MessageSquare,
  MoreHorizontal,
  BarChart3,
  Target,
  Search,
  FileText,
  AlertTriangle,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import {
  sendChatMessageStream,
  sendChatMessage,
  sendAgentMessage,
  type ChatMessage,
  type AgentMessageRequest,
  type StructuredResponse,
} from "@/api/services/chat";
import { AIResponseRenderer } from "@/components/dashboard/ai-response-renderer";
import ReactMarkdown from "react-markdown";
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
  structured: undefined,
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

export function ChatPageContent({ conversationId, externalAgentId, onAgentHandled }: { conversationId?: string; externalAgentId?: string; onAgentHandled?: () => void }) {
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("conversation") || undefined;
  const activeConversationId = conversationId || urlConversationId;
  
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [messageMeta, setMessageMeta] = useState<Record<number, MessageMeta>>({});
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
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

  const handleSendWithAgentRef = useRef(handleSendWithAgent);
  handleSendWithAgentRef.current = handleSendWithAgent;

  useEffect(() => {
    if (!externalAgentId) return;
    handleSendWithAgentRef.current(
      agents.find((a) => a.id === externalAgentId)?.slashCommand ?? externalAgentId,
      agents.find((a) => a.id === externalAgentId),
    );
    onAgentHandled?.();
  }, [externalAgentId, onAgentHandled]);

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
    const agentId = agent?.id;
    appendMessage("user", trimmed, agentId);

    try {
      setIsStreaming(true);
      startTimer();
      abortControllerRef.current = new AbortController();
      let fullReply = "";
      const structuredRef = { current: undefined as StructuredResponse | undefined };
      setMessages((prev) => [...prev, { role: "assistant", content: "", structured: undefined }]);

      if (agentId) {
        const payload: AgentMessageRequest = {
          message: trimmed,
          agent: agentId,
          conversation_id: activeConversationId,
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
              updateLastAssistant(`Sorry, something went wrong: ${err.message}`);
              toast.error(err.message);
            }
          },
          abortControllerRef.current.signal,
        );
      } else {
        await sendChatMessageStream(
          { message: trimmed, conversation_id: activeConversationId },
          (token) => {
            fullReply += token;
            updateLastAssistant(fullReply);
          },
          (err) => {
            if (err.message === "Request cancelled by user.") {
              updateLastAssistant(fullReply ? fullReply + " [cancelled]" : "[cancelled]");
              toast.info("Generation stopped");
            } else {
              updateLastAssistant(`Sorry, something went wrong: ${err.message}`);
              toast.error(err.message);
            }
          },
          (structured) => {
            structuredRef.current = structured;
          },
          abortControllerRef.current.signal,
        );
        if (structuredRef.current) {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant") {
              next[next.length - 1] = { ...last, structured: structuredRef.current };
            }
            return next;
          });
        }
      }
      if (!fullReply && !structuredRef.current) {
        updateLastAssistant("I couldn't generate a response. Please try rephrasing your question.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      updateLastAssistant(`Sorry, something went wrong: ${message}`);
      toast.error(message);
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
    if (!activeConversationId) return;
    try {
      await deleteConversation(activeConversationId);
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
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0F19]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-white">WealthWise AI</h1>
              <p className="text-[11px] sm:text-xs text-slate-400">Online & ready</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-white"
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
                      <Icon className="h-4 w-4 mr-2 text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{agent.name}</span>
                        <span className="text-[11px] text-slate-400">{agent.description}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={handleNewChat}
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {activeConversationId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-400"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0B0F19] border-white/10 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      This action cannot be undone. This will permanently delete this conversation and all its messages.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 sm:px-6 py-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
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
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col gap-1 max-w-[80%]">
                  {agent && msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 px-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-blue-500/10 text-blue-400 border-0">
                        <agent.icon className="h-3 w-3 mr-1" />
                        {agent.name}
                      </Badge>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white/5 text-slate-200 rounded-bl-sm border border-white/10"
                    }`}
                  >
                    {msg.role === "assistant" && msg.structured ? (
                      <AIResponseRenderer response={msg.structured} />
                    ) : msg.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          code: ({ children }) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                          pre: ({ children }) => <pre className="bg-white/10 rounded p-2 mb-2 overflow-x-auto text-xs font-mono">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-white/20 pl-2 italic mb-2">{children}</blockquote>,
                          a: ({ href, children }) => <a href={href} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
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
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white/5 text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3 border border-white/10">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                {processingMessage && (
                  <span className="text-xs text-slate-400">
                    {processingMessage} {formatTime(processingTime)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="shrink-0 border-t border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          {isStreaming && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-slate-400">
                Thinking... {formatTime(processingTime)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                className="h-7 text-red-400 hover:text-red-300 hover:bg-red-950/30"
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
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
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
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-10">
                <div className="p-1">
                  {filteredAgents.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setInput(agent.slashCommand + " ")}
                        className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{agent.slashCommand}</span>
                          <span className="text-[11px] text-slate-400">{agent.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
