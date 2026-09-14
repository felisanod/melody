import { Link } from "@tanstack/react-router";
import { AudioLines, BarChart3, Compass, Search } from "lucide-react";
import type { ReactNode } from "react";

import { PlayerBar } from "@/components/player-bar";
import { NowPlaying } from "@/components/now-playing";
import { usePlayer } from "@/player/player-context";

const NAV = [
  { to: "/", label: "Explore", icon: Compass },
  { to: "/charts", label: "Charts", icon: BarChart3 },
  { to: "/search", label: "Search", icon: Search },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { expanded, current } = usePlayer();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-4 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <AudioLines className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">flex-web</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className={current ? "pb-32" : "pb-12"}>{children}</main>

      <PlayerBar />
      {expanded && <NowPlaying />}
    </div>
  );
}
