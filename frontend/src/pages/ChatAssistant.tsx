// SIMPLIFIED TEST VERSION - Replace your ChatAssistant component with this temporarily

import { useState } from "react";
import api from "@/lib/api";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const ChatAssistant = () => {
    const { toast } = useToast();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        // TEST: Add console log to see if this function is even called
        console.log("🔥 HANDLE SEND CALLED!");
        console.log("📝 Input value:", input);
        
        if (!input.trim()) {
            console.log("❌ Input is empty, returning");
            return;
        }

        try {
            setIsLoading(true);
            
            // Add user message immediately
            const userMessage = { role: 'user', content: input };
            setMessages(prev => [...prev, userMessage]);
            
            console.log("📤 Sending to API:", input);
            
            // Call backend
            const response = await api.post("/chat", { 
                message: input,
                sessionId: null 
            });
            
            console.log("✅ Got response:", response.data);
            
            // Add AI response
            const aiMessage = { 
                role: 'assistant', 
                content: response.data.assistantMessage?.content || response.data.response || 'No response received'
            };
            setMessages(prev => [...prev, aiMessage]);
            
            // Clear input
            setInput("");
            
        } catch (error) {
            console.error("❌ Error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container py-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">AI Chat (Debug Version)</h1>
            
            {/* Messages */}
            <div className="space-y-4 mb-6 min-h-[400px] bg-secondary/20 p-4 rounded-lg">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        Send a message to start chatting
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${
                                msg.role === 'user' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-secondary'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-2">
                        <div className="bg-secondary rounded-lg p-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form 
                onSubmit={(e) => {
                    console.log("📝 FORM SUBMITTED!");
                    e.preventDefault();
                    handleSend();
                }}
                className="flex gap-2"
            >
                <Input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => {
                        console.log("✏️ Input changed:", e.target.value);
                        setInput(e.target.value);
                    }}
                    disabled={isLoading}
                    className="flex-1"
                />
                <Button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    onClick={() => console.log("🖱️ BUTTON CLICKED!")}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>

            {/* Debug Info */}
            <div className="mt-4 p-4 bg-secondary/30 rounded text-xs font-mono">
                <div>Input value: "{input}"</div>
                <div>Input length: {input.length}</div>
                <div>Is loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>Button disabled: {(!input.trim() || isLoading) ? 'Yes' : 'No'}</div>
                <div>Messages count: {messages.length}</div>
            </div>
        </div>
    );
};

export default ChatAssistant;
