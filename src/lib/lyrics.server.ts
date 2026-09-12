import type { LyricLine, LyricsResult } from "./music-types";

const LRCLIB = "https://lrclib.net/api";

interface LrcLibRecord {
  trackName?: string;
  artistName?: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (!stamps.length) continue;
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    for (const stamp of stamps) {
      const minutes = Number(stamp[1]);
      const seconds = Number(stamp[2]);
      const fraction = stamp[3] ? Number(stamp[3].padEnd(3, "0")) : 0;
      lines.push({ timeMs: minutes * 60_000 + seconds * 1000 + fraction, text });
    }
  }
  return lines.sort((a, b) => a.timeMs - b.timeMs);
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "user-agent": "MetrolistWeb/1.0 (https://lovable.dev)" },
  });
  if (!res.ok) return null;
  return (await res.json()) as unknown;
}

function toResult(record: LrcLibRecord | null | undefined): LyricsResult | null {
  if (!record) return null;
  const synced = record.syncedLyrics ? parseLrc(record.syncedLyrics) : [];
  const plain = record.plainLyrics?.trim() || undefined;
  if (!synced.length && !plain) return null;
  return { synced, plain, source: "LrcLib" };
}

export async function fetchLyrics(
  title: string,
  artist: string,
  durationSeconds?: number,
): Promise<LyricsResult> {
  const cleanTitle = title.replace(/\((?:official|lyric|audio)[^)]*\)/gi, "").trim();

  const exactParams = new URLSearchParams({
    track_name: cleanTitle,
    artist_name: artist,
  });
  if (durationSeconds) exactParams.set("duration", String(durationSeconds));
  const exact = toResult((await getJson(`${LRCLIB}/get?${exactParams}`)) as LrcLibRecord | null);
  if (exact) return exact;

  const searchParams = new URLSearchParams({ track_name: cleanTitle });
  if (artist) searchParams.set("artist_name", artist);
  const list = (await getJson(`${LRCLIB}/search?${searchParams}`)) as LrcLibRecord[] | null;
  if (Array.isArray(list)) {
    const withSync = list.find((r) => r.syncedLyrics);
    const result = toResult(withSync ?? list[0]);
    if (result) return result;
  }

  const loose = (await getJson(
    `${LRCLIB}/search?${new URLSearchParams({ q: `${cleanTitle} ${artist}`.trim() })}`,
  )) as LrcLibRecord[] | null;
  if (Array.isArray(loose)) {
    const result = toResult(loose.find((r) => r.syncedLyrics) ?? loose[0]);
    if (result) return result;
  }

  return { synced: [] };
}
