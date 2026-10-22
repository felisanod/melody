import { Button } from "@/components/ui/button";
import { useState } from "react";

import { ChevronDown, ChevronRight, Moon, Settings2, Sun } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — flex-web" },
    { name: "description", content: "Music playback and appearance preferences in flex-web." },
    { property: "og:title", content: "Settings — flex-web" },
    { property: "og:description", content: "Music playback and appearance preferences in flex-web." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
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
        <p className="mt-1 text-sm text-muted-foreground">Playback and appearance preferences</p>
      </div>

      <div className="border-b border-border overflow-hidden">
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

      <div className="border-b border-border overflow-hidden">
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

      <div className="border-b border-border overflow-hidden">
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
    <Button variant="ghost"
      type="button"
      onClick={onToggle}
      className="flex h-auto w-full justify-start gap-3 px-2 py-5 text-left transition hover:bg-secondary/30"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-card text-accent-foreground">
        {icon}
      </div>
      <span className="text-base font-semibold">{title}</span>
      {open ? (
        <ChevronDown className="ml-auto size-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
      )}
    </Button>
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
          <Button variant="ghost"
            key={value}
            type="button"
            onClick={() => setTheme(value as typeof theme)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition bg-card",
              theme === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function DataButton({ label, description }: { label: string; description: string }) {
  return (
    <div className="bg-card rounded-lg p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button variant="ghost"
        type="button"
        className="rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-secondary shrink-0"
      >
        {label}
      </Button>
    </div>
  );
}
