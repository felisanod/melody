import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { SettingsProvider } from "@/context/settings-context";
import { PlayerProvider } from "@/player/player-context";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <SettingsProvider>
      <PlayerProvider>
        <AppShell>{children}</AppShell>
      </PlayerProvider>
    </SettingsProvider>
  );
};
