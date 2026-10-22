import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import { PlayerBar } from "@/components/player-bar";
import { NowPlaying } from "@/components/now-playing";
import { BottomNav, SidebarNav, ThemeToggle } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import appIcon from "@/assets/flex-web-icon.jpg";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePlayer } from "@/player/player-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { expanded } = usePlayer();

  useKeyboardShortcuts();

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3" aria-label="flex-web home">
          <img src={appIcon} alt="" width={1024} height={1024} className="size-10 rounded-lg object-cover" />
          <span className="font-display text-xl font-bold">flex-web</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="lg:hidden" title="Settings">
            <Link to="/settings" aria-label="Settings"><Settings className="size-5" /></Link>
          </Button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-16 hidden w-56 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex flex-1 flex-col py-4">
          <SidebarNav />
        </div>
      </aside>

      <main className="pb-40 lg:pb-28 lg:pl-56">{children}</main>

      {/* Mobile bottom nav */}
      <BottomNav />

      <PlayerBar />
      {expanded && <NowPlaying />}
    </div>
  );
}
