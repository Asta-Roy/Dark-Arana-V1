import { Link, useLocation } from "wouter";
import { MessageSquare, PlusCircle, Image as ImageIcon, Home, Settings, Cpu } from "lucide-react";
import { useListOpenaiConversations } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: conversations } = useListOpenaiConversations();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <aside className="w-72 border-r border-border bg-card/50 flex flex-col backdrop-blur-xl">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Darck Arana</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Core System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            <Link href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location === "/" ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(139,92,246,0.3)]" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
              <Home className="w-4 h-4" /> Dashboard
            </Link>
            <Link href="/chat/new" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location === "/chat/new" ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(139,92,246,0.3)]" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
              <PlusCircle className="w-4 h-4" /> New Session
            </Link>
            <Link href="/image" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location === "/image" ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(139,92,246,0.3)]" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
              <ImageIcon className="w-4 h-4" /> Generator
            </Link>
          </div>

          <div>
            <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Sessions</h2>
            <div className="space-y-0.5">
              {conversations?.map((conv) => (
                <Link key={conv.id} href={`/chat/${conv.id}`} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${location === `/chat/${conv.id}` ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
                  <MessageSquare className="w-4 h-4 opacity-50" />
                  <span className="truncate">{conv.title}</span>
                </Link>
              ))}
              {conversations?.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground/50 italic">No recent sessions</div>
              )}
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-border mt-auto">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
            <Settings className="w-4 h-4" /> System Settings
          </button>
        </div>
      </aside>
      
      <main className="flex-1 relative flex flex-col bg-background/95">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}