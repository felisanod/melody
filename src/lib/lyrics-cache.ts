import type { LyricsResult } from "./music-types";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function cacheKey(title: string, artist: string): string {
  return `${title.toLowerCase().trim()}|${artist.toLowerCase().trim()}`;
}

export async function getCachedLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    const key = cacheKey(title, artist);
    const stored = localStorage.getItem(`lyrics:${key}`);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { result: LyricsResult; timestamp: number };
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`lyrics:${key}`);
      return null;
    }
    return parsed.result;
  } catch {
    return null;
  }
}

export async function cacheLyrics(
  title: string,
  artist: string,
  result: LyricsResult,
): Promise<void> {
  try {
    const key = cacheKey(title, artist);
    localStorage.setItem(`lyrics:${key}`, JSON.stringify({ result, timestamp: Date.now() }));
  } catch {
    /* storage may be unavailable */
  }
}
