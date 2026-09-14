import { Link, useLocation } from "@tanstack/react-router";
import {
  Compass,
  Home,
  History,
  Library,
  ListMusic,
  Music2,
  Settings,
  Shuffle,
  User,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/player/player-context";
import { useSettings } from "@/context/settings-context";

const SIDEBAR_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/charts", label: "Charts", icon: Music2 },
  { to: "/search", label: "Search", icon: Compass },
  { to: "/library", label: "Library", icon: Library },
  { to: "/history", label: "History", icon: History },
  { to: "/listen-together", label: "Listen Together", icon: Volume2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useSettings();
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex size-8 items-center justify-center rounded-full neu-raised-sm text-muted-foreground transition hover:text-foreground"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" x2="12" y1="1" y2="3" />
          <line x1="12" x2="12" y1="21" y2="23" />
          <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
          <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
          <line x1="1" x2="3" y1="12" y2="12" />
          <line x1="21" x2="23" y1="12" y2="12" />
          <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
          <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      <div className="px-3 pb-2 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
      </div>
      {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
        <SidebarLink key={to} to={to} label={label} icon={Icon} />
      ))}
    </nav>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
}) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "neu-inset-sm text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:neu-inset-sm",
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg transition-colors",
          "neu-raised-sm",
        )}
      >
        <Icon className="size-[18px] shrink-0" />
      </div>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const { current } = usePlayer();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 neu-raised">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 sm:py-3">
        <BottomLink to="/" label="Home" icon={Home} />
        <BottomLink to="/charts" label="Charts" icon={Music2} />
        <BottomLink to="/search" label="Search" icon={Compass} />
        <BottomLink to="/library" label="Library" icon={Library} />
        {current ? (
          <Link
            to="/player/$videoId"
            params={{ videoId: current.id }}
            className="flex flex-col items-center gap-0.5 text-accent"
          >
            <div className="flex size-11 items-center justify-center rounded-full neu-raised">
              <span className="block size-8 rounded-full bg-accent" />
            </div>
            <span className="text-[10px] font-medium">Now</span>
          </Link>
        ) : (
          <BottomLink to="/charts" label="Player" icon={ListMusic} />
        )}
      </div>
    </nav>
  );
}

function BottomLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
}) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
        active ? "text-accent" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-[20px]" />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarFooter() {
  return (
    <div className="mt-auto flex items-center gap-2 border-t border-border/40 p-3">
      <div className="flex size-9 items-center justify-center rounded-full neu-raised-sm">
        <User className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">Guest</p>
        <p className="truncate text-xs text-muted-foreground">Sign in</p>
      </div>
      <ThemeToggle />
    </div>
  );
}
