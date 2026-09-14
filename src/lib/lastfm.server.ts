const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0";

interface LastFmOptions {
  apiKey: string;
  secret?: string | undefined;
}

let lastfmOptions: LastFmOptions | null = null;

export function initLastFm(options: LastFmOptions): void {
  lastfmOptions = options;
}

function getApiKey(): string {
  if (lastfmOptions) return lastfmOptions.apiKey;
  return import.meta.env["VITE_LASTFM_API_KEY"] ?? "";
}

export interface LastFmResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
}

async function lastFmGet<T = Record<string, unknown>>(
  method: string,
  params: Record<string, string>,
): Promise<LastFmResponse<T>> {
  try {
    const url = new URL(`${LASTFM_BASE}/?method=${method}&api_key=${getApiKey()}&format=json`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url.toString());
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const data = (await res.json()) as T & { error?: unknown };
    if ("error" in data && typeof data.error === "number") {
      const errMsg = (data as { message?: unknown }).message;
      return { success: false, error: String(errMsg ?? data.error) };
    }
    return { success: true, data: data as T };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export interface LastFmTrack {
  name: string;
  artist: string;
  image?: string;
  url?: string;
  duration?: number;
  streamable?: boolean;
}

export interface LastFmArtist {
  name: string;
  url?: string;
  image?: string;
  listeners?: number;
  playcount?: number;
}

export interface LastFmAlbum {
  name: string;
  artist?: string;
  url?: string;
  image?: string;
}

export interface LastFmScrobble {
  track: string;
  artist: string;
  timestamp: number;
  album?: string;
  duration?: number;
}

export async function scrobble(
  track: string,
  artist: string,
  options: { album?: string | undefined; duration?: number | undefined; timestamp?: number | undefined } = {},
): Promise<LastFmResponse> {
  return lastFmGet("track.scrobble", {
    track,
    artist,
    album: options.album ?? "",
    duration: (options.duration ?? 0).toString(),
    timestamp: (options.timestamp ?? Math.floor(Date.now() / 1000)).toString(),
  });
}

export async function nowPlaying(track: string, artist: string): Promise<LastFmResponse> {
  return lastFmGet("track.updateNowPlaying", {
    track,
    artist,
  });
}

export async function getTopCharts(): Promise<LastFmResponse<{ tracks: LastFmTrack[] }>> {
  return lastFmGet("chart.getTopTracks", { limit: "20" });
}

export async function getSimilarArtists(
  artist: string,
): Promise<LastFmResponse<{ artists: LastFmArtist[] }>> {
  return lastFmGet("artist.getSimilar", { artist, limit: "10" });
}

export async function getArtistTopTracks(
  artist: string,
): Promise<LastFmResponse<{ tracks: LastFmTrack[] }>> {
  return lastFmGet("artist.getTopTracks", { artist, limit: "10" });
}

export async function getTrackInfo(
  track: string,
  artist: string,
): Promise<LastFmResponse<{ track: LastFmTrack }>> {
  return lastFmGet("track.getInfo", { track, artist });
}

export async function getRecentScrobbles(
  limit = 50,
): Promise<LastFmResponse<{ scrobbles: LastFmScrobble[] }>> {
  return lastFmGet("user.getRecentTracks", { limit: String(limit), toptracks: "1" });
}

export interface LastFmNowPlayingResponse {
  track?: {
    name: string;
    artist: { name: string };
    duration: string;
    streamable: string;
    url: string;
    image?: { "#text": string }[];
  };
}
