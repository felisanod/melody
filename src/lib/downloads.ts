// Offline downloads: stores audio, cover art, lyrics and full song details in IndexedDB.
import { dbDelete, dbGet, dbGetAll, dbPut } from "./storage";
import type { LyricsResult, SongItem } from "./music-types";
import { getDownloadMeta } from "./download.functions";
import { getLyrics } from "./music.functions";

export interface DownloadRecord {
  id: string;
  song: SongItem;
  title: string;
  artist: string;
  album?: string | undefined;
  durationSeconds?: number | undefined;
  mimeType: string;
  bitrate: number;
  bytes: number;
  audio: Blob;
  cover?: Blob | undefined;
  coverType?: string | undefined;
  lyrics?: LyricsResult | undefined;
  downloadedAt: number;
}

export function coverProxy(url: string): string {
  return `/api/public/cover?url=${encodeURIComponent(url)}`;
}

export async function listDownloads(): Promise<DownloadRecord[]> {
  const rows = (await dbGetAll("downloads")) as unknown as DownloadRecord[];
  return rows.sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export async function getDownload(id: string): Promise<DownloadRecord | undefined> {
  return (await dbGet("downloads", id)) as unknown as DownloadRecord | undefined;
}

export async function isDownloaded(id: string): Promise<boolean> {
  return Boolean(await getDownload(id));
}

export async function deleteDownload(id: string): Promise<void> {
  await dbDelete("downloads", id);
}

async function fetchWithProgress(
  url: string,
  onProgress?: (fraction: number) => void,
): Promise<{ blob: Blob; type: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text().catch(() => `request failed (${res.status})`));
  const type = res.headers.get("content-type") ?? "application/octet-stream";
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body || !total) {
    const blob = await res.blob();
    onProgress?.(1);
    return { blob, type };
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress?.(Math.min(1, received / total));
    }
  }
  return { blob: new Blob(chunks as BlobPart[], { type }), type };
}

/** Downloads a song for offline use: audio, cover art, lyrics and metadata. */
export async function downloadSong(
  song: SongItem,
  onProgress?: (fraction: number) => void,
): Promise<DownloadRecord> {
  const existing = await getDownload(song.id);
  if (existing) return existing;

  const meta = await getDownloadMeta({ data: { videoId: song.id } });
  if (meta.error) throw new Error(meta.error);

  const { blob: audio, type } = await fetchWithProgress(
    `/api/public/audio/${song.id}`,
    (f) => onProgress?.(f * 0.9),
  );

  const coverUrl = song.thumbnail ?? meta.cover;
  let cover: Blob | undefined;
  let coverType: string | undefined;
  if (coverUrl) {
    try {
      const res = await fetch(coverProxy(coverUrl));
      if (res.ok) {
        cover = await res.blob();
        coverType = cover.type;
      }
    } catch {
      /* cover art is optional */
    }
  }
  onProgress?.(0.95);

  const artist = song.artists?.map((a) => a.name).filter(Boolean).join(", ") || meta.author;
  let lyrics: LyricsResult | undefined;
  try {
    const durationSeconds = song.durationSeconds ?? meta.lengthSeconds ?? undefined;
    lyrics = await getLyrics({
      data: {
        title: song.title || meta.title,
        artist,
        ...(durationSeconds ? { durationSeconds } : {}),
      },
    });
  } catch {
    /* lyrics are optional */
  }

  const record: DownloadRecord = {
    id: song.id,
    song,
    title: song.title || meta.title,
    artist,
    album: song.album?.name,
    durationSeconds: song.durationSeconds ?? meta.lengthSeconds ?? undefined,
    mimeType: type || meta.mimeType,
    bitrate: meta.bitrate,
    bytes: audio.size,
    audio,
    cover,
    coverType,
    lyrics,
    downloadedAt: Date.now(),
  };

  await dbPut("downloads", record as unknown as Record<string, unknown>);
  onProgress?.(1);
  return record;
}

export function extensionFor(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("opus")) return "opus";
  return "m4a";
}

function lyricsText(lyrics: LyricsResult | undefined): string | undefined {
  if (!lyrics) return undefined;
  const l = lyrics as unknown as {
    plain?: string;
    synced?: { timeMs?: number; time?: number; text?: string }[];
  };
  if (l.plain) return l.plain;
  if (l.synced?.length) {
    return l.synced
      .map((line) => {
        const ms = line.timeMs ?? line.time ?? 0;
        const m = Math.floor(ms / 60000);
        const s = ((ms % 60000) / 1000).toFixed(2).padStart(5, "0");
        return `[${String(m).padStart(2, "0")}:${s}]${line.text ?? ""}`;
      })
      .join("\n");
  }
  return undefined;
}

/** Builds the exported file: the audio with cover art and song details embedded when supported. */
export async function buildTaggedFile(record: DownloadRecord): Promise<Blob> {
  if (extensionFor(record.mimeType) !== "m4a") return record.audio;
  try {
    const { writeMp4Tags } = await import("./mp4-tags");
    const bytes = new Uint8Array(await record.audio.arrayBuffer());
    const cover = record.cover ? new Uint8Array(await record.cover.arrayBuffer()) : undefined;
    const tagged = writeMp4Tags(bytes, {
      title: record.title,
      artist: record.artist,
      album: record.album,
      lyrics: lyricsText(record.lyrics),
      comment: record.durationSeconds ? `Duration ${record.durationSeconds}s` : undefined,
      cover,
      coverType: record.coverType,
    });
    return new Blob([tagged as BlobPart], { type: "audio/mp4" });
  } catch {
    return record.audio;
  }
}

/** Saves an already-downloaded track to the device as a tagged audio file. */
export async function saveToDevice(record: DownloadRecord): Promise<void> {
  const blob = await buildTaggedFile(record);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safe = `${record.artist} - ${record.title}`.replace(/[\\/:*?"<>|]/g, "_");
  link.href = url;
  link.download = `${safe}.${extensionFor(record.mimeType)}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}
