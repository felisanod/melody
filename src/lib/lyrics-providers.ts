import type { SongItem } from "./music-types";

const LRCLIB = "https://lrclib.net/api";

interface LrcLibRecord {
  trackName?: string;
  artistName?: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

export interface LyricsLine {
  timeMs: number;
  text: string;
}

export interface LyricsSearchResult {
  synced: LyricsLine[];
  plain?: string | undefined;
  source: string;
}

function parseLrc(lrc: string): LyricsLine[] {
  const lines: LyricsLine[] = [];
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
    headers: { "user-agent": "flex-web/1.0 (https://flex-web.dev)" },
  });
  if (!res.ok) return null;
  return (await res.json()) as unknown;
}

export async function fetchLrcLib(
  title: string,
  artist: string,
  durationSeconds?: number,
): Promise<LyricsSearchResult | null> {
  const cleanTitle = title
    .replace(/\((?:official|lyric|audio|visualizer|music video)[^)]*\)/gi, "")
    .replace(/\s+(?:feat\.?|ft\.?)\s+.+$/i, "")
    .trim();
  const cleanArtist = artist.split(/\s*[,&•]\s*/)[0]?.trim() ?? artist.trim();

  const exactParams = new URLSearchParams({
    track_name: cleanTitle,
    artist_name: cleanArtist,
  });
  if (durationSeconds) exactParams.set("duration", String(durationSeconds));
  const exact = (await getJson(`${LRCLIB}/get?${exactParams}`)) as LrcLibRecord | null;
  if (exact) {
    const synced = exact.syncedLyrics ? parseLrc(exact.syncedLyrics) : [];
    const plain = exact.plainLyrics?.trim() || undefined;
    if (synced.length || plain) return { synced, plain, source: "LrcLib" };
  }

  const searchParams = new URLSearchParams({ track_name: cleanTitle });
  if (cleanArtist) searchParams.set("artist_name", cleanArtist);
  const list = (await getJson(`${LRCLIB}/search?${searchParams}`)) as LrcLibRecord[] | null;
  if (Array.isArray(list)) {
    const withSync = list.find((r) => r.syncedLyrics);
    const result = withSync
      ? {
          synced: withSync.syncedLyrics ? parseLrc(withSync.syncedLyrics) : [],
          plain: withSync.plainLyrics?.trim() ?? undefined,
          source: "LrcLib",
        }
      : list[0]?.syncedLyrics
        ? { synced: parseLrc(list[0].syncedLyrics!), plain: list[0].plainLyrics?.trim() ?? undefined, source: "LrcLib" }
        : null;
    if (result?.synced.length || result?.plain) return result;
  }

  return null;
}

export async function fetchBetterLyrics(
  title: string,
  artist: string,
  durationSeconds?: number,
): Promise<LyricsSearchResult | null> {
  const url = `https://lyrics-api.boidu.dev/getLyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
  const res = await fetch(url, { headers: { "user-agent": "flex-web/1.0" } });
  if (!res.ok) return null;
  const data: { lyrics?: string; ttml?: string } = await res.json();
  if (!data.lyrics && !data.ttml) return null;

  const synced: LyricsLine[] = [];
  if (data.ttml) {
    const timeMatches = data.ttml.match(/(\d{2}):(\d{2})[.:](\d{2})/g) ?? [];
    const lines = data.ttml.split(/\n/).filter(Boolean);
    for (let i = 0; i < Math.min(timeMatches.length, lines.length); i++) {
      const parts = timeMatches[i]?.split(/[:.]/).map(Number);
      if (!parts || parts.length < 3) continue;
      const m = parts[0]!;
      const s = parts[1]!;
      const ms = parts[2]!;
      synced.push({ timeMs: m * 60_000 + s * 1000 + ms * 1000, text: lines[i] ?? "" });
    }
  }

  return {
    synced,
    plain: data.lyrics,
    source: "BetterLyrics",
  };
}

export async function fetchKuGou(
  title: string,
  artist: string,
): Promise<LyricsSearchResult | null> {
  try {
    const searchUrl = `https://mobileservice.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(title)}`;
    const searchRes = await fetch(searchUrl, { headers: { "user-agent": "flex-web/1.0" } });
    if (!searchRes.ok) return null;
    const searchData: { data?: { info?: Array<{ lyricsId?: string }> } } = await searchRes.json();
    const lyricsId = searchData.data?.info?.[0]?.lyricsId;
    if (!lyricsId) return null;

    const lyricsUrl = `https://lyrics.kugou.com/search?keywords=${encodeURIComponent(title)}`;
    const lyricsRes = await fetch(lyricsUrl, { headers: { "user-agent": "flex-web/1.0" } });
    if (!lyricsRes.ok) return null;
    const lyricsData: { lyrics?: string } = await lyricsRes.json();
    if (!lyricsData.lyrics) return null;

    return {
      synced: [],
      plain: lyricsData.lyrics,
      source: "KuGou",
    };
  } catch {
    return null;
  }
}

export async function fetchPaxsenix(
  title: string,
  artist: string,
): Promise<LyricsSearchResult | null> {
  try {
    const searchUrl = `https://amp-api.music.apple.com/v1/catalog/search?term=${encodeURIComponent(`${title} ${artist}`)}&types=songs`;
    const searchRes = await fetch(searchUrl, { headers: { "user-agent": "flex-web/1.0" } });
    if (!searchRes.ok) return null;
    const searchData: { results?: { songs?: { data?: Array<{ id: string }> } } } =
      await searchRes.json();
    const songId = searchData.results?.songs?.data?.[0]?.id;
    if (!songId) return null;

    const lyricsUrl = `https://lyrics.paxsenix.org/lyrics?id=${songId}`;
    const lyricsRes = await fetch(lyricsUrl, { headers: { "user-agent": "flex-web/1.0" } });
    if (!lyricsRes.ok) return null;
    const data: { lyrics?: { ttml?: string; elrc?: string; plain?: string } } =
      await lyricsRes.json();

    const synced: LyricsLine[] = [];
    if (data.lyrics?.ttml) {
      const timeMatches = data.lyrics.ttml.match(/(\d{2}):(\d{2})[.:](\d{2})/g) ?? [];
      const lines = data.lyrics.ttml.split(/\n/).filter(Boolean);
      for (let i = 0; i < Math.min(timeMatches.length, lines.length); i++) {
        const parts = timeMatches[i]?.split(/[:.]/).map(Number);
        if (!parts || parts.length < 3) continue;
        const m = parts[0]!;
        const s = parts[1]!;
        const ms = parts[2]!;
        synced.push({ timeMs: m * 60_000 + s * 1000 + ms * 1000, text: lines[i] ?? "" });
      }
    }

    return {
      synced,
      plain: data.lyrics?.plain ?? data.lyrics?.elrc,
      source: "Paxsenix",
    };
  } catch {
    return null;
  }
}

export async function fetchLyricsPlus(
  title: string,
  artist: string,
): Promise<LyricsSearchResult | null> {
  const mirrors = ["https://lyricsplus.binimum.org", "https://lyricsplus.atomix.one"];
  for (const base of mirrors) {
    try {
      const url = `${base}/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
      const res = await fetch(url, { headers: { "user-agent": "flex-web/1.0" } });
      if (!res.ok) continue;
      const data: { lyrics?: { synced?: string; plain?: string } } = await res.json();
      if (!data.lyrics) continue;

      const synced = data.lyrics.synced ? parseLrc(data.lyrics.synced) : [];
      return {
        synced,
        plain: data.lyrics.plain,
        source: "LyricsPlus",
      };
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchYouTubeLyrics(videoId: string): Promise<LyricsSearchResult | null> {
  try {
    const url = `https://music.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url, { headers: { "user-agent": "flex-web/1.0" } });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"lyrics"(?:.*?)"(.+?)"/s);
    if (match) {
      try {
        const data = JSON.parse(decodeURIComponent(match[1] ?? ""));
        return {
          synced: [],
          plain: typeof data === "string" ? data : data.text,
          source: "YouTube",
        };
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
