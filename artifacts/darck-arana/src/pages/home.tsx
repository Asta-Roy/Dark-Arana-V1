import { useGetOpenaiStats, useListOpenaiConversations } from "@workspace/api-client-react";
import { MessageSquare, ImageIcon, Zap, Activity, BrainCircuit, PlusCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function HomePage() {
  const { data: stats } = useGetOpenaiStats();
  const { data: conversations } = useListOpenaiConversations();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">النظام نشط</span>
          </div>
          <h1 className="text-3xl font-bold text-white">مرحباً بك في دارك أرانا</h1>
          <p className="text-muted-foreground text-base">مساعدك الذكي للمحادثة، التحليل، الكتابة، والأكواد البرمجية.</p>
        </header>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "المحادثات", value: stats?.totalConversations ?? 0, icon: <MessageSquare className="w-5 h-5 text-primary" />, color: "primary" },
            { label: "الرسائل", value: stats?.totalMessages ?? 0, icon: <Zap className="w-5 h-5 text-secondary" />, color: "secondary" },
            { label: "الصور", value: stats?.totalImagesGenerated ?? 0, icon: <ImageIcon className="w-5 h-5 text-accent" />, color: "accent" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-card/30 border border-border/50 p-5 flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value.toLocaleString("ar")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/chat/new">
            <div className="group rounded-2xl bg-primary/8 border border-primary/25 hover:border-primary/50 hover:bg-primary/12 p-5 flex items-center gap-4 cursor-pointer transition-all duration-200">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <PlusCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">محادثة جديدة</h3>
                <p className="text-sm text-muted-foreground mt-0.5">ابدأ جلسة جديدة مع دارك أرانا</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </Link>

          <Link href="/image">
            <div className="group rounded-2xl bg-secondary/8 border border-secondary/25 hover:border-secondary/50 hover:bg-secondary/12 p-5 flex items-center gap-4 cursor-pointer transition-all duration-200">
              <div className="w-11 h-11 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ImageIcon className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">توليد صور</h3>
                <p className="text-sm text-muted-foreground mt-0.5">أنشئ صوراً بالذكاء الاصطناعي</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors shrink-0" />
            </div>
          </Link>
        </div>

        {conversations && conversations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">آخر المحادثات</h2>
            </div>
            <div className="space-y-2">
              {conversations.slice(0, 5).map((conv) => (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <div className="group flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 hover:border-border/70 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {new Date(conv.createdAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
