import { Link } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import type { ReactNode } from "react";

import { PlayerBar } from "@/components/player-bar";
import { NowPlaying } from "@/components/now-playing";
import { BottomNav, SidebarFooter, SidebarNav, ThemeToggle } from "@/components/sidebar-nav";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePlayer } from "@/player/player-context";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppShell({ children }: { children: ReactNode }) {
  const { expanded, current } = usePlayer();
  const isMobile = useIsMobile();

  useKeyboardShortcuts();

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 px-4 neu-raised-sm sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl neu-raised-sm text-accent-foreground">
            <ListMusic className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">flex-web</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-border/40">
        <div className="flex flex-1 flex-col py-4">
          <SidebarNav />
          <SidebarFooter />
        </div>
      </aside>

      <main className={`${isMobile ? "pb-32" : "pb-12"} lg:pl-60 lg:pr-6`}>{children}</main>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav />}

      <PlayerBar />
      {expanded && <NowPlaying />}
    </div>
  );
}
