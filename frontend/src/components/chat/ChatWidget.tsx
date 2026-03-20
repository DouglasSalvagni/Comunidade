"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

interface ChatWidgetProps {
  courseId?: string;
}

export function ChatWidget({ courseId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.aiChatGetHistory(courseId, 20);
      setMessages(res || []);
    } catch (err) {
      console.error("Erro ao carregar histórico do chat:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = 
      date.getDate() === now.getDate() && 
      date.getMonth() === now.getMonth() && 
      date.getFullYear() === now.getFullYear();
                    
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return timeStr;
    } else {
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `${dateStr} às ${timeStr}`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.aiChatSendMessage(userMessage.content, courseId);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua dúvida. Tente novamente mais tarde.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 p-0"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] shadow-2xl flex flex-col z-50 border-primary/20 animate-in slide-in-from-bottom-10 fade-in-0 duration-300">
          <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between sticky top-0 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-md font-bold">Assistente IA</CardTitle>
                <p className="text-xs text-muted-foreground">Tire dúvidas sobre a aula</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-70">
                <Bot className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Olá! Sou o assistente de IA. Como posso ajudar com a aula de hoje?
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-2 max-w-[85%]",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm flex flex-col",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm border"
                      )}
                    >
                      <span>{msg.content}</span>
                      {msg.createdAt && (
                        <span className={cn(
                          "text-[10px] mt-1 text-right",
                          msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatTime(msg.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex w-full justify-start">
                <div className="flex gap-2 max-w-[85%] flex-row">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 text-sm bg-muted text-foreground rounded-tl-sm border flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-3 border-t bg-background rounded-b-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full items-center gap-2"
            >
              <Input
                placeholder="Faça uma pergunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:bg-background"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || loading}
                className="rounded-full h-10 w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
