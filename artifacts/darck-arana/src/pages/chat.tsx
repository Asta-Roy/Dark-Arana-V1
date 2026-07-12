import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useGetOpenaiConversation, useDeleteOpenaiConversation } from "@workspace/api-client-react";
import { useChatStream, ChatMode } from "@/hooks/use-chat-stream";
import { Button } from "@/components/ui/button";
import { Send, Trash2, StopCircle, Bot, User, ChevronDown, Brain, Zap, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

const MODE_OPTIONS: { key: ChatMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "normal", label: "عادي", icon: null, desc: "الوضع الاعتيادي" },
  { key: "thinking", label: "تفكير عميق", icon: <Brain className="w-3.5 h-3.5" />, desc: "تحليل معمّق خطوة بخطوة" },
  { key: "speed", label: "سريع", icon: <Zap className="w-3.5 h-3.5" />, desc: "إجابة موجزة ومباشرة" },
  { key: "article", label: "مقال", icon: <FileText className="w-3.5 h-3.5" />, desc: "أسلوب صحفي احترافي" },
];

function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      className="prose prose-invert prose-sm max-w-none leading-relaxed"
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            {children}
          </a>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="bg-black/40 border border-border rounded-lg p-3 overflow-x-auto my-2">
                <code className="text-xs font-mono text-green-300">{children}</code>
              </pre>
            );
          }
          return <code className="bg-black/40 px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>;
        },
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary pl-3 text-muted-foreground italic my-2">{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ChatPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const convId = Number(id);
  const { data: conversation, isLoading } = useGetOpenaiConversation(convId);
  const deleteMutation = useDeleteOpenaiConversation();
  const { sendMessage, isStreaming, streamedContent, stopStream } = useChatStream(convId);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("normal");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?.messages]);

  useEffect(() => {
    if (isStreaming) scrollToBottom(true);
  }, [streamedContent, isStreaming]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 150);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const userMsg = input;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(userMsg, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const handleDelete = async () => {
    if (confirm("حذف هذه المحادثة نهائياً؟")) {
      await deleteMutation.mutateAsync({ id: convId });
      setLocation("/");
    }
  };

  const activeMode = MODE_OPTIONS.find((m) => m.key === mode)!;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  if (!conversation) {
    return <div className="flex-1 flex items-center justify-center text-destructive">المحادثة غير موجودة</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 py-3.5 border-b border-border/60 bg-card/20 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{conversation.title}</h2>
          <p className="text-xs text-muted-foreground/60 font-mono">{conversation.messages.length} رسالة</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <ScrollArea
          ref={scrollRef}
          className="h-full"
          onScrollCapture={handleScroll}
        >
          <div className="px-4 py-6 max-w-3xl mx-auto space-y-5 pb-4">
            {conversation.messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary opacity-60" />
                </div>
                <div>
                  <p className="text-white font-medium">كيف يمكنني مساعدتك؟</p>
                  <p className="text-muted-foreground text-sm mt-1">اكتب رسالتك أدناه للبدء</p>
                </div>
              </div>
            )}

            {conversation.messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary/15 border border-primary/25 text-white rounded-tr-sm"
                      : "bg-card/70 border border-border/60 text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  ) : (
                    <MessageContent content={msg.content} />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white/60" />
                  </div>
                )}
              </div>
            ))}

            {isStreaming && streamedContent && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                  <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                </div>
                <div className="max-w-[82%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm bg-card/70 border border-primary/30 text-foreground">
                  <MessageContent content={streamedContent} />
                  <span className="inline-block w-1 h-3.5 ml-0.5 bg-primary animate-pulse align-middle rounded-sm" />
                </div>
              </div>
            )}

            {isStreaming && !streamedContent && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-card/70 border border-border/60 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all shadow-lg backdrop-blur-md"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="shrink-0 p-3 bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModeMenu((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  mode !== "normal"
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-white/5 border-border/50 text-muted-foreground hover:text-white hover:bg-white/8"
                }`}
              >
                {activeMode.icon}
                {activeMode.label}
              </button>
              {showModeMenu && (
                <div className="absolute bottom-full mb-2 left-0 z-20 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden w-52 backdrop-blur-xl">
                  {MODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setMode(opt.key); setShowModeMenu(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                        mode === opt.key
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="shrink-0">{opt.icon ?? <span className="w-3.5 h-3.5 block" />}</span>
                      <div>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs opacity-60">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground/40">Enter للإرسال • Shift+Enter للسطر الجديد</span>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك هنا..."
                rows={1}
                className="w-full bg-card/60 border border-border/60 focus:border-primary/50 focus:outline-none rounded-xl text-white placeholder:text-muted-foreground/40 text-sm resize-none py-3.5 px-4 pr-12 transition-all leading-relaxed min-h-[52px] max-h-[180px] overflow-y-auto"
                disabled={isStreaming}
                style={{ direction: "rtl" }}
              />
            </div>
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={stopStream}
                className="h-[52px] w-[52px] text-destructive hover:bg-destructive/15 shrink-0 rounded-xl border border-destructive/30"
              >
                <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="h-[52px] w-[52px] bg-primary hover:bg-primary/85 text-primary-foreground rounded-xl shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.35)] disabled:opacity-40 disabled:shadow-none transition-all"
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
