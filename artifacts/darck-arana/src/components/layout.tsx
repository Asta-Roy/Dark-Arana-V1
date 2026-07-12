import { Link, useLocation } from "wouter";
import { MessageSquare, PlusCircle, Image as ImageIcon, Home, Settings, Cpu, Menu, X, ChevronRight } from "lucide-react";
import { useListOpenaiConversations } from "@workspace/api-client-react";
import { useState, useEffect, useRef, useCallback } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: conversations } = useListOpenaiConversations();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartOpen = useRef(false);
  const isDragging = useRef(false);
  const currentX = useRef(0);

  const closeSidebar = useCallback(() => setIsOpen(false), []);
  const openSidebar = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    closeSidebar();
  }, [location, closeSidebar]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [closeSidebar]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragStartOpen.current = isOpen;
    isDragging.current = false;
    currentX.current = e.touches[0].clientX;
  }, [isOpen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.touches[0].clientX - dragStartX.current;
    currentX.current = e.touches[0].clientX;
    isDragging.current = Math.abs(dx) > 8;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragStartX.current === null || !isDragging.current) {
      dragStartX.current = null;
      return;
    }
    const dx = currentX.current - dragStartX.current;
    if (!dragStartOpen.current && dx > 60) {
      openSidebar();
    } else if (dragStartOpen.current && dx < -60) {
      closeSidebar();
    }
    dragStartX.current = null;
    isDragging.current = false;
  }, [openSidebar, closeSidebar]);

  const handleMouseStart = useCallback((e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    dragStartOpen.current = isOpen;
    isDragging.current = false;
    currentX.current = e.clientX;
  }, [isOpen]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragStartX.current === null || e.buttons === 0) {
      dragStartX.current = null;
      return;
    }
    const dx = e.clientX - dragStartX.current;
    currentX.current = e.clientX;
    isDragging.current = Math.abs(dx) > 8;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragStartX.current === null || !isDragging.current) {
      dragStartX.current = null;
      return;
    }
    const dx = currentX.current - dragStartX.current;
    if (!dragStartOpen.current && dx > 60) openSidebar();
    else if (dragStartOpen.current && dx < -60) closeSidebar();
    dragStartX.current = null;
    isDragging.current = false;
  }, [openSidebar, closeSidebar]);

  const navLink = (href: string, icon: React.ReactNode, label: string) => {
    const active = location === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(139,92,246,0.3)]"
            : "text-muted-foreground hover:bg-white/5 hover:text-white"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div
      className="flex h-screen w-full bg-background text-foreground overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseStart}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      <aside
        ref={sidebarRef}
        className="fixed top-0 left-0 h-full w-72 z-40 flex flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Darck Arana
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Core System</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            {navLink("/", <Home className="w-4 h-4" />, "Dashboard")}
            {navLink("/chat/new", <PlusCircle className="w-4 h-4" />, "New Session")}
            {navLink("/image", <ImageIcon className="w-4 h-4" />, "Generator")}
          </div>

          <div>
            <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              محادثاتي
            </h2>
            <div className="space-y-0.5">
              {conversations?.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    location === `/chat/${conv.id}`
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 opacity-50 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </Link>
              ))}
              {conversations?.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground/50 italic">No recent sessions</div>
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
            <Settings className="w-4 h-4" /> System Settings
          </button>
        </div>
      </aside>

      <div
        className={`fixed top-0 left-0 h-full z-50 flex items-start pt-4 pointer-events-none transition-all duration-300`}
        style={{ paddingLeft: isOpen ? "18rem" : "0" }}
      >
        <button
          className="pointer-events-auto ml-3 w-9 h-9 rounded-lg flex items-center justify-center bg-card/80 border border-border/60 text-muted-foreground hover:text-white hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all duration-200 backdrop-blur-md"
          onClick={() => setIsOpen((v) => !v)}
          title={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      <div
        className="fixed top-1/2 -translate-y-1/2 left-0 z-20 flex items-center pointer-events-none"
        style={{ opacity: isOpen ? 0 : 1, transition: "opacity 0.2s" }}
      >
        <div
          className="pointer-events-auto cursor-pointer flex items-center gap-1 pl-0.5 pr-2 py-6 bg-card/60 border border-l-0 border-border/60 rounded-r-xl text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 backdrop-blur-md shadow-lg"
          onClick={openSidebar}
          title="Open menu"
        >
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <main className="flex-1 relative flex flex-col bg-background/95 w-full">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
