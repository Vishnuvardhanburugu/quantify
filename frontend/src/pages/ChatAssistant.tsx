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
        <div className="container py-8 max-w-4xl h-[calc(100vh-8rem)] flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2.5 rounded-xl border border-primary/20">
                            <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            Quantify AI
                            <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Beta
                            </Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Your personal trading intelligence
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewChat}
                    className="gap-1.5 text-xs"
                >
                    <MessageSquarePlus className="h-3.5 w-3.5" /> New Chat
                </Button>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden glass-card">
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full">
                        <div className="p-5 space-y-5 min-h-full">
                            {historyLoading ? (
                                <div className="flex justify-center py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                                        <span className="text-xs text-muted-foreground">Loading conversation...</span>
                                    </div>
                                </div>
                            ) : !hasMessages ? (
                                /* Empty State — Welcome Screen */
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
                                    {/* AI Avatar */}
                                    <div className="relative">
                                        <div className="h-20 w-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                                            <Bot className="h-10 w-10 text-primary" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 flex items-center justify-center">
                                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-w-md">
                                        <h3 className="text-lg font-semibold">Hey {user.name?.split(' ')[0]}! 👋</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            I'm your AI trading assistant. I can analyze your portfolio, provide market insights,
                                            and help you make smarter trading decisions.
                                        </p>
                                    </div>

                                    {/* Quick Prompt Cards */}
                                    <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
                                        {QUICK_PROMPTS.map((item) => (
                                            <button
                                                key={item.prompt}
                                                onClick={() => handleSend(item.prompt)}
                                                className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-background/40 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 text-left"
                                            >
                                                <div className="shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                    <item.icon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-medium text-foreground">{item.label}</div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.prompt}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Message List */
                                displayMessages.map((msg: Message, i: number) => (
                                    <div
                                        key={i}
                                        className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
                                    >
                                        {/* Avatar */}
                                        <div className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                            msg.role === "assistant"
                                                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20"
                                                : "bg-secondary text-secondary-foreground"
                                        }`}>
                                            {msg.role === "assistant"
                                                ? <Bot className="h-3.5 w-3.5" />
                                                : <UserIcon className="h-3.5 w-3.5" />
                                            }
                                        </div>

                                        {/* Bubble */}
                                        <div className={`flex flex-col gap-1 max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                            <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                                msg.role === "user"
                                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                                    : "bg-secondary/80 text-foreground rounded-bl-md border border-border/40"
                                            }`}>
                                                {msg.content}
                                            </div>
                                            {msg.createdAt && (
                                                <span className="text-[10px] text-muted-foreground/60 px-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Typing Indicator */}
                            {sendMessageMutation.isPending && (
                                <div className="flex items-end gap-2.5 animate-fade-in">
                                    <div className="shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/20">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="bg-secondary/80 border border-border/40 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2.5">
                                        <div className="flex gap-1">
                                            <div className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" />
                                            <div className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.15s]" />
                                            <div className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.3s]" />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Analyzing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </CardContent>

                {/* Input Area */}
                <CardFooter className="p-3 border-t border-border/60 bg-background/40 backdrop-blur-sm">
                    <form
                        className="flex w-full items-center gap-2"
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    >
                        <div className="relative flex-1">
                            <Input
                                ref={inputRef}
                                placeholder={sendMessageMutation.isPending ? "Waiting for response..." : "Ask about your portfolio, stocks, or strategy..."}
                                className="pr-4 bg-secondary/40 border-border/60 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-colors"
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
                            className="shrink-0 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all duration-200 disabled:opacity-40"
                        >
                            {sendMessageMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ChatAssistant;
