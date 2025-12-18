import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/contexts/AuthContext";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function Chatbot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm your Business Coach AI. How can I help you today?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    if (!user) {
        return null;
    }



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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end print:hidden pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto w-[350px] h-[500px] mb-4 flex flex-col shadow-2xl bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-zinc-100 dark:bg-zinc-800">
                        <div className="flex items-center gap-2">
                            {/* Replaced Bot icon with text to be safe */}
                            <div className="font-bold">Business Coach</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>X</Button>
                    </div>

                    {/* Messages - Replaced ScrollArea with div */}
                    <div className="flex-1 p-4 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                        <div className="flex flex-col gap-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`p-3 text-sm max-w-[80%] rounded-lg ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black dark:bg-zinc-800 dark:text-white'}`}>
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && <div className="text-xs text-muted-foreground">Thinking...</div>}
                            <div ref={scrollRef} />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t bg-background">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex gap-2"
                        >
                            <input
                                placeholder="Ask..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="flex-1 p-2 border rounded-md"
                            />
                            <Button type="submit" size="sm" disabled={isLoading || !inputValue.trim()}>
                                Send
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <div className="pointer-events-auto">
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-2xl"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </Button>
            </div>
        </div>
    );
}
