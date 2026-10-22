import { Link, useLocation } from "@tanstack/react-router";
import {
  Search,
  HardDriveDownload,
  Home,
  History,
  Music2,
  Settings,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/settings-context";

const SIDEBAR_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/charts", label: "Charts", icon: Music2 },
  { to: "/search", label: "Search", icon: Search },
  { to: "/moods", label: "Mood Mix", icon: Sparkles },
  { to: "/library", label: "Downloads", icon: HardDriveDownload },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function ThemeToggle() {
  const { setTheme, isDark } = useSettings();
  return (
    <Button variant="ghost" size="icon"
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function SidebarNav() {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 px-3 py-2">
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
        "group flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-5 shrink-0", active && "text-primary")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
        <BottomLink to="/" label="Home" icon={Home} />
        <BottomLink to="/charts" label="Charts" icon={Music2} />
        <BottomLink to="/search" label="Search" icon={Search} />
        <BottomLink to="/library" label="Downloads" icon={HardDriveDownload} />
        <BottomLink to="/moods" label="Mood Mix" icon={Sparkles} />
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
        "flex min-w-0 flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition-colors",
        active ? "text-accent" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-[20px]" />
      <span>{label}</span>
    </Link>
  );
}

