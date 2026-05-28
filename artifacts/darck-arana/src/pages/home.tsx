import { useGetOpenaiStats, useListOpenaiConversations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { MessageSquare, ImageIcon, Zap, Activity, BrainCircuit } from "lucide-react";
import { Link } from "wouter";

export function HomePage() {
  const { data: stats } = useGetOpenaiStats();
  const { data: conversations } = useListOpenaiConversations();

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-4">
            Command Center <Activity className="w-8 h-8 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-lg">System nominal. All intelligence nodes online.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/40 border-primary/20 hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats?.totalConversations || 0}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Sessions</p>
            </div>
          </Card>

          <Card className="p-6 bg-card/40 border-secondary/20 hover:border-secondary/50 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors" />
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats?.totalMessages || 0}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Messages Exchanged</p>
            </div>
          </Card>

          <Card className="p-6 bg-card/40 border-accent/20 hover:border-accent/50 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors" />
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-accent" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats?.totalImagesGenerated || 0}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Images Synthesized</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-muted-foreground" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/chat/new">
              <div className="p-6 rounded-xl border border-border bg-card/30 hover:bg-card/60 transition-all flex items-center gap-4 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Initialize Communication</h3>
                  <p className="text-sm text-muted-foreground">Start a new text-based intelligence session</p>
                </div>
              </div>
            </Link>
            
            <Link href="/image">
              <div className="p-6 rounded-xl border border-border bg-card/30 hover:bg-card/60 transition-all flex items-center gap-4 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Image Synthesis</h3>
                  <p className="text-sm text-muted-foreground">Generate high-fidelity visual assets</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}