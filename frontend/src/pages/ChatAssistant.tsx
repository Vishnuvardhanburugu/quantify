import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Send,
    Bot,
    User as UserIcon,
    Loader2,
    Brain,
    Sparkles,
    RefreshCw,
    MessageSquarePlus,
    Zap,
    TrendingUp,
    PieChart,
    HelpCircle,
    ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Message {
    role: "user" | "assistant";
    content: string;
    createdAt?: string;
}

const QUICK_PROMPTS = [
    { icon: PieChart, label: "Portfolio analysis", prompt: "How is my portfolio doing?" },
    { icon: TrendingUp, label: "Stock recommendation", prompt: "Should I buy RELIANCE.NS?" },
    { icon: HelpCircle, label: "Learn concepts", prompt: "Explain bearish divergence" },
    { icon: Zap, label: "Trade psychology", prompt: "How to avoid emotional trading?" },
];

const ChatAssistant = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<any>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);
    // Local optimistic messages for instant UI feedback
    const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/signin");
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    // Fetch session messages if we have a sessionId
    const { data: sessionData, isLoading: historyLoading } = useQuery({
        queryKey: ["chatHistory", sessionId],
        queryFn: async () => {
            if (!sessionId) return { messages: [] };
            try {
                const response = await api.get(`/chat/sessions/${sessionId}`);
                return response.data;
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
                return { messages: [] };
            }
        },
        enabled: !!sessionId,
        retry: 1,
        staleTime: 30000,
    });

    const serverMessages: Message[] = sessionData?.messages || [];
    // Merge: show server messages + any optimistic messages not yet in server data
    const displayMessages = sessionId && serverMessages.length > 0
        ? serverMessages
        : optimisticMessages;

    const sendMessageMutation = useMutation({
        mutationFn: async (message: string) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            try {
                const response = await api.post("/chat",
                    { message, sessionId },
                    { signal: controller.signal, timeout: 30000 }
                );
                clearTimeout(timeoutId);
                return response.data;
            } catch (error: any) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
                    throw new Error('Request timeout - AI is taking too long to respond');
                }
                throw error;
            }
        },
        onSuccess: (data) => {
            if (!sessionId && data.sessionId) {
                setSessionId(data.sessionId);
            }

            // Add assistant response to optimistic messages
            const aiContent = data.assistantMessage?.content || data.response || 'No response received';
            setOptimisticMessages(prev => [...prev, {
                role: "assistant",
                content: aiContent,
                createdAt: new Date().toISOString(),
            }]);

            queryClient.invalidateQueries({
                queryKey: ["chatHistory", sessionId || data.sessionId]
            });
            setInput("");
            // Refocus input for seamless conversation
            setTimeout(() => inputRef.current?.focus(), 100);
        },
        onError: (error: any) => {
            // Remove the optimistic user message on error
            setOptimisticMessages(prev => prev.slice(0, -1));

            let errorMessage = "Failed to get AI response.";
            if (error.message?.includes('timeout')) {
                errorMessage = "Request timeout - please try again with a shorter message";
            } else if (error.response?.status === 500) {
                errorMessage = "Server error - the AI service might be down";
            } else if (error.response?.status === 401) {
                errorMessage = "Authentication error - please sign in again";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast({
                variant: "destructive",
                title: "AI Error",
                description: errorMessage,
            });
        },
    });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [displayMessages, sendMessageMutation.isPending]);

    const handleSend = (messageText?: string) => {
        const text = (messageText || input).trim();
        if (!text || sendMessageMutation.isPending) return;

        // Optimistically add user message
        setOptimisticMessages(prev => [...prev, {
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        }]);

        setInput("");
        sendMessageMutation.mutate(text);
    };

    const handleNewChat = () => {
        setSessionId(null);
        setOptimisticMessages([]);
        queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
        inputRef.current?.focus();
    };

    if (!user) return null;

    const hasMessages = displayMessages.length > 0;

    return (
        <div className="container py-8 max-w-4xl h-[calc(100vh-8rem)] flex flex-col gap-5 animate-fade-in relative z-10">
            {/* Background Animations */}
            <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden rounded-3xl">
                <div className="chat-bg-mesh absolute inset-0" />
                <div className="chat-orb chat-orb-1" />
                <div className="chat-orb chat-orb-2" />
                <div className="chat-orb chat-orb-3" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 px-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-2.5 rounded-xl border border-primary/20 shadow-sm shadow-primary/10">
                            <Brain className="h-6 w-6 text-primary" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            Quantify AI
                            <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0 border-primary/20 bg-primary/10 text-primary">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Beta
                            </Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                            Your intelligent trading companion
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewChat}
                    className="gap-1.5 text-xs bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                    <MessageSquarePlus className="h-3.5 w-3.5" /> New Session
                </Button>
            </div>

            {/* Chat Area - Premium Card */}
            <Card className="flex-1 flex flex-col chat-card-glow border-white/10 bg-black/40 shadow-2xl overflow-hidden relative">
                {/* Transparent Favicon Background */}
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.04] pointer-events-none mix-blend-screen">
                    <img 
                        src="/favicon.png" 
                        alt="Background Watermark" 
                        className="w-3/4 h-3/4 object-contain"
                    />
                </div>

                <CardContent className="flex-1 overflow-hidden p-0 relative bg-transparent z-10 backdrop-blur-sm">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-6 min-h-full flex flex-col justify-end">
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 h-full m-auto">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Brain className="h-5 w-5 text-primary/60" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground animate-pulse">Syncing neural pathways...</span>
                                </div>
                            ) : !hasMessages ? (
                                /* Empty State — Welcome Screen */
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-10 m-auto mt-8 w-full">
                                    {/* AI Avatar Character */}
                                    <div className="welcome-glow relative">
                                        <div className="h-28 w-28 bg-gradient-to-br from-primary/20 via-primary/5 to-background/50 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.15)] transition-transform duration-500 hover:scale-105 ai-avatar-ring backdrop-blur-md overflow-hidden">
                                            <img 
                                                src="https://api.dicebear.com/7.x/bottts/svg?seed=QuantifyAgent&backgroundColor=transparent&primaryColor=3b82f6" 
                                                alt="AI Agent"
                                                className="w-20 h-20 drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                            />
                                        </div>
                                        <div className="absolute -top-1 -right-1 flex items-center justify-center bg-background rounded-full p-1.5 shadow-lg border border-primary/20">
                                            <Sparkles className="h-5 w-5 text-primary animate-bounce delay-150" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-w-lg relative z-10">
                                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary/80 to-foreground/80">
                                            Welcome back, {user.name?.split(' ')[0]}
                                        </h3>
                                        <p className="text-[16px] text-muted-foreground leading-relaxed font-medium">
                                            I'm your intelligent trading agent. I can analyze your portfolio, track market sentiment, and provide technical insights.
                                        </p>
                                    </div>

                                    {/* Quick Prompt Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl px-4">
                                        {QUICK_PROMPTS.map((item, idx) => (
                                            <button
                                                key={item.prompt}
                                                onClick={() => handleSend(item.prompt)}
                                                className="prompt-card group flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-background/50 text-left"
                                                style={{ animationDelay: `${idx * 100}ms`, animation: 'fadeIn 0.5s ease-out forwards', opacity: 0 }}
                                            >
                                                <div className="prompt-icon-shimmer shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center border border-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                                                    <item.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                                                </div>
                                                <div className="min-w-0 flex-1 pt-0.5">
                                                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.prompt}</div>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/70 transition-colors shrink-0 mt-1 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Message List */
                                <div className="space-y-6">
                                    {displayMessages.map((msg: Message, i: number) => (
                                        <div
                                            key={i}
                                            className={`flex items-end gap-3 w-full ${msg.role === "user" ? "flex-row-reverse msg-enter-right" : "flex-row msg-enter-left"}`}
                                        >
                                            {/* Avatar */}
                                            <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-bold z-10 ${
                                                msg.role === "assistant"
                                                    ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary-foreground shadow-md shadow-primary/10 relative overflow-hidden"
                                                    : "bg-secondary border border-border/50 text-secondary-foreground shadow-sm"
                                            }`}>
                                                {msg.role === "assistant" ? (
                                                    <>
                                                        <img 
                                                            src="https://api.dicebear.com/7.x/bottts/svg?seed=QuantifyAgent&backgroundColor=transparent&primaryColor=3b82f6" 
                                                            alt="AI"
                                                            className="h-6 w-6 drop-shadow-sm"
                                                        />
                                                        <div className="absolute inset-0 bg-primary rounded-xl animate-pulse opacity-0" />
                                                    </>
                                                ) : (
                                                    <UserIcon className="h-4 w-4" />
                                                )}
                                            </div>

                                            {/* Bubble */}
                                            <div className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                                <div className={`px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap relative overflow-hidden ${
                                                    msg.role === "user"
                                                        ? "user-bubble rounded-2xl rounded-br-sm"
                                                        : "ai-bubble rounded-2xl rounded-bl-sm"
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                {msg.createdAt && (
                                                    <span className="text-[10px] font-medium text-muted-foreground/70 px-1 opacity-0 animate-fade-in [animation-delay:0.3s]">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing Indicator */}
                                    {sendMessageMutation.isPending && (
                                        <div className="flex items-end gap-3 msg-enter-left z-10">
                                            <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary-foreground border border-primary/20 flex items-center justify-center shadow-md shadow-primary/10 ai-avatar-ring overflow-hidden">
                                                <img 
                                                    src="https://api.dicebear.com/7.x/bottts/svg?seed=QuantifyAgent&backgroundColor=transparent&primaryColor=3b82f6" 
                                                    alt="AI"
                                                    className="h-6 w-6"
                                                />
                                            </div>
                                            <div className="ai-bubble rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3">
                                                <div className="flex gap-1.5 items-center">
                                                    <div className="typing-dot" />
                                                    <div className="typing-dot" />
                                                    <div className="typing-dot" />
                                                </div>
                                                <span className="text-xs font-medium text-primary/70 ml-1">Computing outcome...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div ref={scrollRef} className="h-px w-full" />
                        </div>
                    </ScrollArea>
                </CardContent>

                {/* Input Area */}
                <CardFooter className="p-4 border-t border-border/40 bg-background/60 backdrop-blur-xl relative z-20">
                    <form
                        className="flex w-full items-end gap-3 chat-input transition-all duration-300 rounded-2xl bg-secondary/30 border border-border/50 p-1.5 focus-within:bg-background/80"
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    >
                        <div className="relative flex-1 flex items-center">
                            <Input
                                ref={inputRef}
                                placeholder={sendMessageMutation.isPending ? "Quantify is analyzing..." : "Ask about a stock, your portfolio, or market trends..."}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[15px] px-4 py-6 placeholder:text-muted-foreground/60"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={sendMessageMutation.isPending}
                                autoFocus
                            />
                        </div>
                        <Button
                            size="icon"
                            disabled={!input.trim() || sendMessageMutation.isPending}
                            type="submit"
                            className="shrink-0 h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground send-btn m-1 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:box-shadow-none"
                        >
                            {sendMessageMutation.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5 ml-0.5" />
                            )}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ChatAssistant;
