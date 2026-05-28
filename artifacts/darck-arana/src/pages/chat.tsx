import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetOpenaiConversation, useDeleteOpenaiConversation } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Trash2, StopCircle, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export function ChatPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const convId = Number(id);
  const { data: conversation, isLoading } = useGetOpenaiConversation(convId);
  const deleteMutation = useDeleteOpenaiConversation();
  const { sendMessage, isStreaming, streamedContent, stopStream } = useChatStream(convId);
  
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamedContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const userMsg = input;
    setInput("");
    await sendMessage(userMsg);
  };

  const handleDelete = async () => {
    if (confirm("Erase this session from memory?")) {
      await deleteMutation.mutateAsync({ id: convId });
      setLocation("/");
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-primary animate-pulse">Initializing Data Stream...</div>;
  }

  if (!conversation) {
    return <div className="flex-1 flex items-center justify-center text-destructive">Session Not Found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{conversation.title}</h2>
          <p className="text-xs text-muted-foreground font-mono">ID: {conversation.id} • STATUS: ACTIVE</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-5 h-5" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          {conversation.messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <Card className={`max-w-[80%] p-4 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary/10 border-primary/30 text-white" : "bg-card border-border text-foreground"}`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </Card>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-white/70" />
                </div>
              )}
            </div>
          ))}
          {isStreaming && streamedContent && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <Card className="max-w-[80%] p-4 text-sm leading-relaxed bg-card border-primary/50 text-foreground shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <div className="whitespace-pre-wrap">{streamedContent}<span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" /></div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Awaiting command..."
            className="w-full bg-card border-primary/30 focus-visible:ring-primary h-14 pl-6 pr-24 rounded-xl text-white placeholder:text-muted-foreground/50 shadow-inner"
            disabled={isStreaming}
          />
          <div className="absolute right-2 flex items-center">
            {isStreaming ? (
              <Button type="button" size="icon" variant="ghost" onClick={stopStream} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
                <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg h-10 w-10 shadow-[0_0_10px_rgba(139,92,246,0.4)] disabled:opacity-50" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}