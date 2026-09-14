import { dbGet, dbPut } from "./storage";
import type { SongItem } from "./music-types";

export interface AppData {
  version: string;
  exportedAt: string;
  settings: Record<string, unknown>;
  library: SongItem[];
  queue: SongItem[];
  history: SongItem[];
  playlists: Record<string, unknown>[];
  searchHistory: string[];
}

export function createExportData(
  settings: Record<string, unknown>,
  library: SongItem[],
  queue: SongItem[],
  history: SongItem[],
  playlists: Record<string, unknown>[],
  searchHistory: string[],
): AppData {
  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    settings,
    library,
    queue,
    history,
    playlists,
    searchHistory,
  };
}

export function validateImportData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") return { valid: false, error: "Data must be an object" };
  const d = data as Record<string, unknown>;
  if (typeof d["version"] !== "string") return { valid: false, error: "Missing version" };
  if (!Array.isArray(d["library"])) return { valid: false, error: "Missing library" };
  if (!Array.isArray(d["queue"])) return { valid: false, error: "Missing queue" };
  if (!Array.isArray(d["history"])) return { valid: false, error: "Missing history" };
  if (typeof d["settings"] !== "object" || d["settings"] === null) {
    return { valid: false, error: "Missing settings" };
  }
  return { valid: true };
}

export async function exportToJSON(
  settings: Record<string, unknown>,
  library: SongItem[],
  queue: SongItem[],
  history: SongItem[],
  playlists: Record<string, unknown>[],
  searchHistory: string[],
): Promise<string> {
  const data = createExportData(settings, library, queue, history, playlists, searchHistory);
  return JSON.stringify(data, null, 2);
}

export async function importFromJSON(
  json: string,
): Promise<{ success: true; data: AppData } | { success: false; error: string }> {
  try {
    const data = JSON.parse(json) as unknown;
    const validation = validateImportData(data);
    if (!validation.valid) return { success: false, error: validation.error ?? "Invalid data" };
    return { success: true, data: data as AppData };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function saveImportedData(data: AppData): Promise<void> {
  for (const track of data.library) {
    await dbPut("tracks", track as unknown as Record<string, unknown>);
  }
  for (const track of data.queue) {
    await dbPut("queue", track as unknown as Record<string, unknown>);
  }
  for (const track of data.history) {
    await dbPut("history", track as unknown as Record<string, unknown>);
  }
  if (data.settings && typeof data.settings === "object") {
    for (const [key, value] of Object.entries(data.settings)) {
      await dbPut("settings", { id: key, ...(value as Record<string, unknown>) });
    }
  }
}
