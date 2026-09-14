import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light" | "system";

interface SettingsState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const SettingsContext = createContext<SettingsState | null>(null);

function getPreferredTheme(): ThemeMode {
  try {
    if (typeof localStorage === "undefined") return "system";
    const stored = localStorage.getItem("flex-web.theme") as ThemeMode | null;
    if (stored && ["dark", "light", "system"].includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolveTheme(mode: ThemeMode): boolean {
  if (mode === "light") return false;
  if (mode === "dark") return true;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getPreferredTheme());
  const [isDark, setIsDark] = useState<boolean>(() => resolveTheme(theme));

  useEffect(() => {
    const handler = () => setIsDark(resolveTheme(theme));
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handler);
    return () =>
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("flex-web.theme", theme);
    } catch {
      /* ignore */
    }
  }, [isDark, theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const value = useMemo<SettingsState>(
    () => ({
      theme,
      setTheme,
      isDark,
    }),
    [theme, setTheme, isDark],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}
