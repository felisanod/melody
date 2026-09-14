import { useState } from "react";

import { ChevronDown, ChevronRight, Moon, Settings2, Sun } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme, isDark } = useSettings();
  const [openSection, setOpenSection] = useState<string | null>("appearance");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="neu-raised rounded-2xl overflow-hidden">
        <SectionHeader
          title="Appearance"
          icon={<Moon className="size-5" />}
          open={openSection === "appearance"}
          onToggle={() => toggleSection("appearance")}
        />
        {openSection === "appearance" && (
          <div className="px-6 pb-6 space-y-4">
            <ThemeSelector theme={theme} setTheme={setTheme} isDark={isDark} />
          </div>
        )}
      </div>

      <div className="neu-raised rounded-2xl overflow-hidden">
        <SectionHeader
          title="Playback"
          icon={<Settings2 className="size-5" />}
          open={openSection === "playback"}
          onToggle={() => toggleSection("playback")}
        />
        {openSection === "playback" && (
          <div className="px-6 pb-6 pt-4 text-sm text-muted-foreground">
            <p>
              Audio quality, autoplay, shuffle, repeat, crossfade, and volume normalization settings
              will appear here.
            </p>
          </div>
        )}
      </div>

      <div className="neu-raised rounded-2xl overflow-hidden">
        <SectionHeader
          title="Integrations"
          icon={<Sun className="size-5" />}
          open={openSection === "integrations"}
          onToggle={() => toggleSection("integrations")}
        />
        {openSection === "integrations" && (
          <div className="px-6 pb-6 pt-4 space-y-6">
            <div className="neu-raised-sm rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">Last.fm</p>
              <p className="text-xs text-muted-foreground">
                Scrobble tracks, view Now Playing, Top Charts, and similar artists.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="API Key"
                  className="neu-inset-sm flex-1 rounded-lg border border-border/50 bg-transparent px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  className="rounded-lg neu-raised-sm px-4 py-2 text-sm font-medium text-accent-foreground transition hover:neu-inset-sm"
                >
                  Connect
                </button>
              </div>
            </div>
            <div className="neu-raised-sm rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">Discord Rich Presence</p>
              <p className="text-xs text-muted-foreground">
                Sync your currently playing song to Discord.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Client ID"
                  className="neu-inset-sm flex-1 rounded-lg border border-border/50 bg-transparent px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  className="rounded-lg neu-raised-sm px-4 py-2 text-sm font-medium text-accent-foreground transition hover:neu-inset-sm"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="neu-raised rounded-2xl overflow-hidden">
        <SectionHeader
          title="Data"
          icon={<Settings2 className="size-5" />}
          open={openSection === "data"}
          onToggle={() => toggleSection("data")}
        />
        {openSection === "data" && (
          <div className="px-6 pb-6 pt-4 space-y-3">
            <DataButton
              label="Export data"
              description="Download your library, queue, history, and settings as JSON."
            />
            <DataButton
              label="Import data"
              description="Restore from a previously exported JSON file."
            />
            <DataButton
              label="Create backup"
              description="Create a full backup of all app data (IndexedDB)."
            />
            <DataButton label="Restore backup" description="Restore from a backup file." />
          </div>
        )}
      </div>

      <div className="neu-raised rounded-2xl overflow-hidden">
        <SectionHeader
          title="Account"
          icon={<Sun className="size-5" />}
          open={openSection === "account"}
          onToggle={() => toggleSection("account")}
        />
        {openSection === "account" && (
          <div className="px-6 pb-6 pt-4 text-sm text-muted-foreground">
            <p>YouTube account connections will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  icon,
  open,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-secondary/30"
    >
      <div className="flex size-9 items-center justify-center rounded-lg neu-raised-sm text-accent-foreground">
        {icon}
      </div>
      <span className="text-base font-semibold">{title}</span>
      {open ? (
        <ChevronDown className="ml-auto size-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
      )}
    </button>
  );
}

function ThemeSelector({
  theme,
  setTheme,
}: {
  theme: "dark" | "light" | "system";
  setTheme: (t: "dark" | "light" | "system") => void;
  isDark: boolean;
}) {
  const options = [
    { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
    { value: "light", label: "Light", icon: <Sun className="size-4" /> },
    { value: "system", label: "System", icon: <Settings2 className="size-4" /> },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Theme</p>
      <div className="flex gap-2">
        {options.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value as typeof theme)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition neu-raised-sm",
              theme === value
                ? "text-accent-foreground neu-inset-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DataButton({ label, description }: { label: string; description: string }) {
  return (
    <div className="neu-raised-sm rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        className="rounded-lg neu-raised-sm px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:neu-inset-sm shrink-0"
      >
        {label}
      </button>
    </div>
  );
}
