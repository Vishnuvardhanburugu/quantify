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
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Message {
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}

const ChatAssistant = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<any>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);

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
            const response = await api.get(`/chat/sessions/${sessionId}`);
            return response.data;
        },
        enabled: !!sessionId,
    });

    const history = sessionData?.messages || [];

    const sendMessageMutation = useMutation({
        mutationFn: async (message: string) => {
            const response = await api.post("/chat", { message, sessionId });
            return response.data;
        },
        onSuccess: (data) => {
            if (!sessionId && data.sessionId) {
                setSessionId(data.sessionId);
            }
            queryClient.invalidateQueries({ queryKey: ["chatHistory", sessionId || data.sessionId] });
            setInput("");
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "AI Error",
                description: error.response?.data?.message || "Failed to get AI response.",
            });
        },
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [history, sendMessageMutation.isPending]);

    const handleSend = () => {
        if (!input.trim() || sendMessageMutation.isPending) return;
        sendMessageMutation.mutate(input.trim());
    };

    if (!user) return null;

    return (
        <div className="container py-8 max-w-4xl h-[calc(100vh-8rem)] flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Trading Assistant</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Powered by Quantify Intelligence <Sparkles className="h-3 w-3" />
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                    setSessionId(null);
                    queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
                }}>
                    <RefreshCw className="h-4 w-4 mr-2" /> New Chat
                </Button>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden glass-card">
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-6">
                        <div className="space-y-6">
                            {historyLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : history?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center">
                                        <Bot className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium">Hello there!</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                            I'm your AI assistant. Ask me anything about your portfolio, trade psychology, or market analysis.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                                        {["How is my portfolio doing?", "Should I buy RELIANCE.NS?", "Explain bearish divergence"].map(q => (
                                            <Button key={q} variant="secondary" size="sm" onClick={() => setInput(q)}>
                                                {q}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                history?.map((msg: Message, i: number) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                                            {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                                        </div>
                                        <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                            <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-secondary text-foreground"
                                                }`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            {sendMessageMutation.isPending && (
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div className="bg-secondary rounded-2xl px-4 py-2.5 flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" />
                                            <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t border-border">
                    <form
                        className="flex w-full items-center gap-3"
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    >
                        <Input
                            placeholder="Type your message here..."
                            className="flex-1"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={sendMessageMutation.isPending}
                        />
                        <Button size="icon" disabled={!input.trim() || sendMessageMutation.isPending}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ChatAssistant;
