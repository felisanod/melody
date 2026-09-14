import { dbGetAll } from "./storage";
import type { SongItem } from "./music-types";

export interface BackupData {
  version: string;
  createdAt: string;
  tracks: Record<string, unknown>[];
  artists: Record<string, unknown>[];
  albums: Record<string, unknown>[];
  playlists: Record<string, unknown>[];
  lyrics: Record<string, unknown>[];
  history: Record<string, unknown>[];
  downloads: Record<string, unknown>[];
  settings: Record<string, unknown>[];
  searchHistory: Record<string, unknown>[];
  queue: Record<string, unknown>[];
}

const BACKUP_VERSION = "1.0.0";

export async function createBackup(): Promise<string> {
  const [
    tracks,
    artists,
    albums,
    playlists,
    lyrics,
    history,
    downloads,
    settings,
    searchHistory,
    queue,
  ] = await Promise.all([
    dbGetAll("tracks"),
    dbGetAll("artists"),
    dbGetAll("albums"),
    dbGetAll("playlists"),
    dbGetAll("lyrics"),
    dbGetAll("history"),
    dbGetAll("downloads"),
    dbGetAll("settings"),
    dbGetAll("searchHistory"),
    dbGetAll("queue"),
  ]);

  const backup: BackupData = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    tracks,
    artists,
    albums,
    playlists,
    lyrics,
    history,
    downloads,
    settings,
    searchHistory,
    queue,
  };

  return JSON.stringify(backup, null, 2);
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  restored?: Record<string, number>;
}

export async function restoreBackup(json: string): Promise<RestoreResult> {
  try {
    const backup = JSON.parse(json) as BackupData;
    if (!backup.version || !backup.createdAt) {
      return { success: false, error: "Invalid backup format", restored: {} };
    }

    const restored: Record<string, number> = {};
    const storeNames = [
      "tracks",
      "artists",
      "albums",
      "playlists",
      "lyrics",
      "history",
      "downloads",
      "settings",
      "searchHistory",
      "queue",
    ] as const;

    for (const storeName of storeNames) {
      const items = backup[storeName] ?? [];
      let count = 0;
      for (const item of items) {
        if (item && typeof item === "object" && "id" in item) {
          try {
            await import("./storage").then(({ dbPut }) =>
              dbPut(storeName, item as Record<string, unknown>),
            );
            count++;
          } catch {
            // skip individual item errors
          }
        }
      }
      restored[storeName] = count;
    }

    return { success: true, restored };
  } catch (error) {
    return { success: false, error: String(error), restored: {} };
  }
}

export function formatBackupSize(json: string): string {
  const bytes = new Blob([json]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
