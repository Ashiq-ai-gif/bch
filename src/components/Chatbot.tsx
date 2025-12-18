import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

import { useAuth } from "@/contexts/AuthContext";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function Chatbot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) {
        console.log("Chatbot: No user found, not rendering");
        return null;
    }

    console.log("Chatbot: User found, rendering", user.id);

    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm your Business Coach AI. How can I help you today?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const newMessages = [...messages, { role: 'user', content: inputValue } as Message];
        setMessages(newMessages);
        setInputValue("");
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('chat', {
                body: {
                    message: inputValue,
                    history: newMessages.slice(0, -1).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }
            });

            if (error) throw error;

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            console.error('Chat error:', error);
            toast({
                title: "Error",
                description: "Failed to get response from AI.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end print:hidden">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[350px] h-[500px] mb-4 flex flex-col shadow-2xl border-primary/20 backdrop-blur-md bg-background/95 animate-in slide-in-from-bottom-5 fade-in duration-300 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-primary/5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Business Coach</h3>
                                <p className="text-xs text-muted-foreground">Always here to help</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setIsOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-primary/5">
                        <div className="flex flex-col gap-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${message.role === 'user' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-primary'}`}>
                                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`rounded-2xl p-3 text-sm max-w-[80%] shadow-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border border-border/50 text-card-foreground rounded-tl-none'}`}>
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-background border border-border text-primary flex items-center justify-center shrink-0 animate-pulse">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-card border border-border/50 rounded-2xl p-3 px-4 rounded-tl-none text-sm flex items-center gap-1.5 h-10 w-16 justify-center">
                                        <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                placeholder="Ask about your business..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="bg-background focus-visible:ring-primary/30 rounded-full pl-4"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="shrink-0 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full transition-all duration-300">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="icon"
                className="h-14 w-14 rounded-full shadow-2xl bg-primary foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-primary/30"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </Button>
        </div>
    );
}
