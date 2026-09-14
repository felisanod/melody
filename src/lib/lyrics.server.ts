import type { LyricLine, LyricsResult } from "./music-types";

const LRCLIB = "https://lrclib.net/api";
const BETTERLYRICS = "https://lyrics-api.boidu.dev";
const KUGOU_SEARCH = "https://mobileservice.kugou.com/api/v3/search/song";
const KUGOU_LYRICS_SEARCH = "https://lyrics.kugou.com/search";
const KUGOU_LYRICS_DOWNLOAD = "https://lyrics.kugou.com/download";
const PAXSENIX = "https://lyrics.paxsenix.org";
const APPLE_SEARCH = "https://amp-api.music.apple.com/v1/catalog/us/search";
const LYRICSPLUS_MIRRORS = [
  "https://lyricsplus.binimum.org",
  "https://lyricsplus.atomix.one",
  "https://lyricsplus.prjktla.my.id",
  "https://lyricsplus-seven.vercel.app",
];

interface LrcLibRecord {
  trackName?: string;
  artistName?: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

interface BetterLyricsResponse {
  ttml?: string;
}

interface KuGouSearchResponse {
  data?: {
    info?: Array<{
      hash?: string;
      songname?: string;
      singername?: string;
      album_name?: string;
      duration?: number;
    }>;
  };
}

interface KuGouLyricsSearchResponse {
  data?: { candidates?: Array<{ id?: string; accesskey?: string; duration?: number }> };
}

interface KuGouLyricsDownloadResponse {
  content?: string;
}

interface PaxsenixLyricsResponse {
  ttml?: string;
  plain?: string;
}

interface AppleTrackAttributes {
  name: string;
  artistName: string;
  albumName?: string;
  durationInMillis?: number;
}

interface AppleTrack {
  id: string;
  attributes: AppleTrackAttributes;
}

interface AppleSearchResponse {
  results?: { songs?: { data?: AppleTrack[] } };
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

function parseTtml(ttml: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const pNodes = [...ttml.matchAll(/<p[^>]*begin="([^"]*)"[^>]*end="([^"]*)"[^>]*>([^<]*)<\/p>/g)];
  for (const node of pNodes) {
    if (!node[1] || !node[3]) continue;
    const begin = parseTtmlTime(node[1]);
    const text = node[3].trim();
    if (text && begin !== null) {
      lines.push({ timeMs: begin, text });
    }
  }
  return lines.sort((a, b) => a.timeMs - b.timeMs);
}

function parseTtmlTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d+)h(\d+)m(\d+(?:\.\d+)?)s/);
  if (match) {
    return (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000;
  }
  return null;
}

async function getJson(url: string, headers?: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { headers: { "user-agent": "flex-web/1.0", ...headers } });
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

async function fetchLrcLib(
  title: string,
  artist: string,
  durationSeconds?: number,
): Promise<LyricsResult> {
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
  const exact = toResult((await getJson(`${LRCLIB}/get?${exactParams}`)) as LrcLibRecord | null);
  if (exact) return exact;

  const searchParams = new URLSearchParams({ track_name: cleanTitle });
  if (cleanArtist) searchParams.set("artist_name", cleanArtist);
  const list = (await getJson(`${LRCLIB}/search?${searchParams}`)) as LrcLibRecord[] | null;
  if (Array.isArray(list)) {
    const withSync = list.find((r) => r.syncedLyrics);
    const result = toResult(withSync ?? list[0]);
    if (result) return result;
  }

  const loose = (await getJson(
    `${LRCLIB}/search?${new URLSearchParams({ q: `${cleanTitle} ${cleanArtist}`.trim() })}`,
  )) as LrcLibRecord[] | null;
  if (Array.isArray(loose)) {
    const result = toResult(loose.find((r) => r.syncedLyrics) ?? loose[0]);
    if (result) return result;
  }

  return { synced: [] };
}

async function fetchBetterLyrics(
  title: string,
  artist: string,
  durationSeconds?: number,
  album?: string,
): Promise<LyricsResult> {
  try {
    const params = new URLSearchParams({ s: title, a: artist });
    if (durationSeconds) params.set("d", String(durationSeconds));
    if (album) params.set("al", album);
    const res = await fetch(`${BETTERLYRICS}/getLyrics?${params}`, {
      headers: { "user-agent": "flex-web/1.0" },
    });
    if (!res.ok) return { synced: [] };
    const ttml = await res.text();
    if (!ttml.trim()) return { synced: [] };
    const synced = parseTtml(ttml);
    return { synced, source: "BetterLyrics" };
  } catch {
    return { synced: [] };
  }
}

async function fetchKuGou(
  title: string,
  artist: string,
  durationSeconds?: number,
): Promise<LyricsResult> {
  try {
    const keyword = `${title} ${artist}`.trim();
    const searchParams = new URLSearchParams({
      keyword,
      page: "1",
      pagesize: "10",
      showtype: "1",
      correct: "1",
    });
    const searchRes = (await getJson(
      `${KUGOU_SEARCH}?${searchParams}`,
    )) as KuGouSearchResponse | null;
    const song = searchRes?.data?.info?.[0];
    if (!song?.hash) return { synced: [] };

    const lyricsSearchParams = new URLSearchParams({ hash: song.hash });
    const lyricsSearch = (await getJson(
      `${KUGOU_LYRICS_SEARCH}?${lyricsSearchParams}`,
    )) as KuGouLyricsSearchResponse | null;
    const candidate = lyricsSearch?.data?.candidates?.[0];
    if (!candidate?.id) return { synced: [] };

    const downloadParams = new URLSearchParams({
      id: candidate.id,
      accesskey: candidate.accesskey ?? "",
    });
    const download = (await getJson(
      `${KUGOU_LYRICS_DOWNLOAD}?${downloadParams}`,
    )) as KuGouLyricsDownloadResponse | null;
    if (!download?.content) return { synced: [] };

    const lrc = atob(download.content);
    const synced = parseLrc(lrc);
    return { synced, source: "KuGou" };
  } catch {
    return { synced: [] };
  }
}

async function fetchPaxsenix(
  title: string,
  artist: string,
  durationSeconds?: number,
): Promise<LyricsResult> {
  try {
    const searchParams = new URLSearchParams({
      term: `${title} ${artist}`,
      types: "songs",
      limit: "5",
    });
    const searchRes = (await getJson(
      `${APPLE_SEARCH}?${searchParams}`,
    )) as AppleSearchResponse | null;
    const track = searchRes?.results?.songs?.data?.[0];
    if (!track?.id) return { synced: [] };

    const lyricsRes = (await getJson(
      `${PAXSENIX}/api/lyrics/${track.id}`,
    )) as PaxsenixLyricsResponse | null;
    if (!lyricsRes) return { synced: [] };

    let synced: LyricLine[] = [];
    if (lyricsRes.ttml) synced = parseTtml(lyricsRes.ttml);
    if (!synced.length && lyricsRes.plain) {
      return { synced: [], plain: lyricsRes.plain, source: "Paxsenix" };
    }
    return { synced, plain: lyricsRes.plain, source: "Paxsenix" };
  } catch {
    return { synced: [] };
  }
}

async function fetchLyricsPlus(
  title: string,
  artist: string,
  durationSeconds?: number,
): Promise<LyricsResult> {
  for (const mirror of LYRICSPLUS_MIRRORS) {
    try {
      const params = new URLSearchParams({ title, artist });
      if (durationSeconds) params.set("duration", String(durationSeconds));
      const res = await getJson(`${mirror}/api/lyrics?${params}`);
      if (res && typeof res === "object" && "syncedLyrics" in res) {
        const record = res as { syncedLyrics?: string; plainLyrics?: string };
        const synced = record.syncedLyrics ? parseLrc(record.syncedLyrics) : [];
        const plain = record.plainLyrics?.trim();
        if (synced.length || plain) {
          return { synced, plain, source: "LyricsPlus" };
        }
      }
    } catch {
      continue;
    }
  }
  return { synced: [] };
}

const LYRICS_PROVIDERS = [
  { name: "LrcLib", fn: fetchLrcLib },
  { name: "BetterLyrics", fn: fetchBetterLyrics },
  { name: "Paxsenix", fn: fetchPaxsenix },
  { name: "KuGou", fn: fetchKuGou },
  { name: "LyricsPlus", fn: fetchLyricsPlus },
] as const;

export async function fetchLyrics(
  title: string,
  artist: string,
  durationSeconds?: number,
  album?: string,
): Promise<LyricsResult> {
  for (const { name, fn } of LYRICS_PROVIDERS) {
    try {
      const result = await fn(title, artist, durationSeconds, album);
      if (result.synced.length || result.plain) {
        return { ...result, source: name };
      }
    } catch {
      // try next provider
    }
  }
  return { synced: [] };
}
