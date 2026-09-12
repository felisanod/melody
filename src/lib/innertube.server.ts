// Server-only InnerTube (YouTube Music) client + renderer parsing.
// Mirrors the endpoints documented for Metrolist's :innertube module, but
// returns plain DTOs so the browser never sees raw renderers.

import type {
  AlbumItem,
  ArtistItem,
  ArtistRef,
  DetailPage,
  MusicItem,
  PlaylistItem,
  Shelf,
  SongItem,
} from "./music-types";

const BASE = "https://music.youtube.com/youtubei/v1";
const CLIENT_VERSION = "1.20240403.01.00";

type Json = Record<string, any>;

function context() {
  return {
    client: {
      clientName: "WEB_REMIX",
      clientVersion: CLIENT_VERSION,
      hl: "en",
      gl: "US",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    user: { lockedSafetyMode: false },
  };
}

export async function innertube(endpoint: string, payload: Json): Promise<Json> {
  const res = await fetch(`${BASE}/${endpoint}?prettyPrint=false`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-youtube-client-name": "67",
      "x-youtube-client-version": CLIENT_VERSION,
      origin: "https://music.youtube.com",
      referer: "https://music.youtube.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
    body: JSON.stringify({ context: context(), ...payload }),
  });
  if (!res.ok) throw new Error(`InnerTube ${endpoint} failed: ${res.status}`);
  return (await res.json()) as Json;
}

/* ------------------------------- helpers -------------------------------- */

function runsText(node: any): string {
  const runs = node?.runs;
  if (Array.isArray(runs)) return runs.map((r: any) => r?.text ?? "").join("");
  return node?.simpleText ?? "";
}

function bestThumbnail(node: any): string | undefined {
  const list: any[] =
    node?.musicThumbnailRenderer?.thumbnail?.thumbnails ??
    node?.thumbnail?.thumbnails ??
    node?.thumbnails ??
    node?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails ??
    [];
  const url: string | undefined = list.at(-1)?.url;
  if (!url) return undefined;
  return url.replace(/=w\d+-h\d+/, "=w544-h544").replace(/^\/\//, "https://");
}

function* walk(node: any, key: string): Generator<any> {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) yield* walk(child, key);
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === key) yield v;
    yield* walk(v, key);
  }
}

function first<T>(gen: Generator<T>): T | undefined {
  for (const v of gen) return v;
  return undefined;
}

const DURATION_RE = /^\d{1,2}(:\d{2}){1,2}$/;

function durationToSeconds(text: string): number | undefined {
  if (!DURATION_RE.test(text)) return undefined;
  return text
    .split(":")
    .map(Number)
    .reduce((acc, part) => acc * 60 + part, 0);
}

function pageType(endpoint: any): string | undefined {
  return endpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
    ?.browseEndpointContextMusicConfig?.pageType;
}

function collectArtists(runs: any[]): ArtistRef[] {
  const artists: ArtistRef[] = [];
  for (const run of runs ?? []) {
    const text = String(run?.text ?? "").trim();
    if (!text || text === "•" || text === "&" || text === ",") continue;
    const browseId = run?.navigationEndpoint?.browseEndpoint?.browseId;
    const type = pageType(run?.navigationEndpoint);
    if (type === "MUSIC_PAGE_TYPE_ARTIST" || type === "MUSIC_PAGE_TYPE_USER_CHANNEL") {
      artists.push({ name: text, id: browseId });
    }
  }
  return artists;
}

/* ------------------------------- parsers -------------------------------- */

function parseListItem(r: any): MusicItem | undefined {
  if (!r) return undefined;
  const flex = r.flexColumns ?? [];
  const columnRuns = (i: number) =>
    flex[i]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [];
  const title = runsText(flex[0]?.musicResponsiveListItemFlexColumnRenderer?.text);
  if (!title) return undefined;
  const thumbnail = bestThumbnail(r.thumbnail);
  const subRuns = [...columnRuns(1), ...columnRuns(2)];
  const subtitle = subRuns
    .map((x: any) => x?.text ?? "")
    .join("")
    .trim();
  const explicit = JSON.stringify(r.badges ?? []).includes("EXPLICIT");

  const videoId =
    r.playlistItemData?.videoId ??
    r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
      ?.playNavigationEndpoint?.watchEndpoint?.videoId ??
    r.navigationEndpoint?.watchEndpoint?.videoId;

  if (videoId) {
    const durationText = subRuns
      .map((x: any) => String(x?.text ?? "").trim())
      .find((t: string) => DURATION_RE.test(t));
    const albumRun = subRuns.find(
      (x: any) => pageType(x?.navigationEndpoint) === "MUSIC_PAGE_TYPE_ALBUM",
    );
    return {
      kind: "song",
      id: videoId,
      title,
      artists: collectArtists(subRuns),
      album: albumRun
        ? {
            name: String(albumRun.text),
            id: albumRun.navigationEndpoint?.browseEndpoint?.browseId,
          }
        : undefined,
      durationText,
      durationSeconds: durationText ? durationToSeconds(durationText) : undefined,
      thumbnail,
      explicit,
    } satisfies SongItem;
  }

  const endpoint = r.navigationEndpoint;
  const browseId: string | undefined = endpoint?.browseEndpoint?.browseId;
  if (!browseId) return undefined;
  const type = pageType(endpoint);

  if (type === "MUSIC_PAGE_TYPE_ALBUM") {
    return {
      kind: "album",
      browseId,
      title,
      artists: collectArtists(subRuns),
      year: subRuns.map((x: any) => String(x?.text ?? "")).find((t) => /^\d{4}$/.test(t.trim())),
      thumbnail,
      explicit,
    } satisfies AlbumItem;
  }
  if (type === "MUSIC_PAGE_TYPE_ARTIST" || type === "MUSIC_PAGE_TYPE_USER_CHANNEL") {
    return { kind: "artist", id: browseId, title, subtitle, thumbnail } satisfies ArtistItem;
  }
  if (type === "MUSIC_PAGE_TYPE_PLAYLIST" || browseId.startsWith("VL")) {
    return {
      kind: "playlist",
      id: browseId.replace(/^VL/, ""),
      title,
      author: subtitle,
      thumbnail,
    } satisfies PlaylistItem;
  }
  return undefined;
}

function parseTwoRowItem(r: any): MusicItem | undefined {
  if (!r) return undefined;
  const title = runsText(r.title);
  if (!title) return undefined;
  const thumbnail = bestThumbnail(r.thumbnailRenderer);
  const subRuns = r.subtitle?.runs ?? [];
  const subtitle = runsText(r.subtitle);
  const endpoint = r.navigationEndpoint;
  const explicit = JSON.stringify(r.subtitleBadges ?? []).includes("EXPLICIT");

  const videoId = endpoint?.watchEndpoint?.videoId;
  if (videoId) {
    return {
      kind: "song",
      id: videoId,
      title,
      artists: collectArtists(subRuns),
      thumbnail,
      explicit,
    } satisfies SongItem;
  }

  const browseId: string | undefined = endpoint?.browseEndpoint?.browseId;
  if (!browseId) return undefined;
  const type = pageType(endpoint);

  if (type === "MUSIC_PAGE_TYPE_ARTIST" || type === "MUSIC_PAGE_TYPE_USER_CHANNEL") {
    return { kind: "artist", id: browseId, title, subtitle, thumbnail } satisfies ArtistItem;
  }
  if (type === "MUSIC_PAGE_TYPE_ALBUM") {
    return {
      kind: "album",
      browseId,
      playlistId: first(walk(r.thumbnailOverlay, "watchPlaylistEndpoint"))?.playlistId,
      title,
      artists: collectArtists(subRuns),
      year: subRuns.map((x: any) => String(x?.text ?? "")).find((t) => /^\d{4}$/.test(t.trim())),
      thumbnail,
      explicit,
    } satisfies AlbumItem;
  }
  if (type === "MUSIC_PAGE_TYPE_PLAYLIST" || browseId.startsWith("VL")) {
    return {
      kind: "playlist",
      id: browseId.replace(/^VL/, ""),
      title,
      author: subtitle,
      thumbnail,
    } satisfies PlaylistItem;
  }
  return undefined;
}

function parseItemNode(node: any): MusicItem | undefined {
  if (node?.musicResponsiveListItemRenderer)
    return parseListItem(node.musicResponsiveListItemRenderer);
  if (node?.musicTwoRowItemRenderer) return parseTwoRowItem(node.musicTwoRowItemRenderer);
  if (node?.playlistPanelVideoRenderer) {
    const r = node.playlistPanelVideoRenderer;
    const videoId = r.videoId;
    if (!videoId) return undefined;
    const subRuns = r.longBylineText?.runs ?? r.shortBylineText?.runs ?? [];
    const durationText = runsText(r.lengthText);
    return {
      kind: "song",
      id: videoId,
      title: runsText(r.title),
      artists: collectArtists(subRuns),
      durationText: durationText || undefined,
      durationSeconds: durationText ? durationToSeconds(durationText) : undefined,
      thumbnail: bestThumbnail(r.thumbnail),
    } satisfies SongItem;
  }
  if (node?.musicMultiRowListItemRenderer) {
    const r = node.musicMultiRowListItemRenderer;
    const videoId = first(walk(r.onTap, "watchEndpoint"))?.videoId;
    if (!videoId) return undefined;
    return {
      kind: "song",
      id: videoId,
      title: runsText(r.title),
      artists: [{ name: runsText(r.subtitle) }],
      thumbnail: bestThumbnail(r.thumbnail),
    } satisfies SongItem;
  }
  return undefined;
}

function dedupe(items: MusicItem[]): MusicItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${"id" in item ? item.id : item.browseId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shelfTitle(shelf: any): string {
  return (
    runsText(shelf?.header?.musicCarouselShelfBasicHeaderRenderer?.title) ||
    runsText(shelf?.title) ||
    ""
  );
}

/** Collects every recognised shelf in a response into flat sections. */
export function collectShelves(response: Json): Shelf[] {
  const sections: Shelf[] = [];

  const push = (title: string, contents: any[]) => {
    const items = dedupe(
      (contents ?? []).map(parseItemNode).filter((x): x is MusicItem => Boolean(x)),
    );
    if (items.length) sections.push({ title: title || "More", items });
  };

  for (const shelf of walk(response, "musicCarouselShelfRenderer")) {
    push(shelfTitle(shelf), shelf.contents);
  }
  for (const shelf of walk(response, "musicShelfRenderer")) {
    push(shelfTitle(shelf), shelf.contents);
  }
  for (const grid of walk(response, "gridRenderer")) {
    push(runsText(grid?.header?.gridHeaderRenderer?.title), grid.items);
  }
  return sections;
}

export function collectSongs(response: Json): SongItem[] {
  const songs: SongItem[] = [];
  for (const key of [
    "musicPlaylistShelfRenderer",
    "musicShelfRenderer",
    "playlistPanelRenderer",
  ] as const) {
    for (const shelf of walk(response, key)) {
      for (const node of shelf.contents ?? []) {
        const item = parseItemNode(node);
        if (item?.kind === "song") songs.push(item);
      }
    }
  }
  return dedupe(songs) as SongItem[];
}

function parseHeader(response: Json): {
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
} {
  const responsive = first(walk(response, "musicResponsiveHeaderRenderer"));
  if (responsive) {
    return {
      title: runsText(responsive.title),
      subtitle: [runsText(responsive.straplineTextOne), runsText(responsive.subtitle)]
        .filter(Boolean)
        .join(" • "),
      description: runsText(
        responsive.description?.musicDescriptionShelfRenderer?.description,
      ),
      thumbnail: bestThumbnail(responsive.thumbnail?.musicThumbnailRenderer ?? responsive.thumbnail),
    };
  }
  const detail = first(walk(response, "musicDetailHeaderRenderer"));
  if (detail) {
    return {
      title: runsText(detail.title),
      subtitle: runsText(detail.subtitle),
      description: runsText(detail.description),
      thumbnail: bestThumbnail(detail.thumbnail?.croppedSquareThumbnailRenderer ?? detail.thumbnail),
    };
  }
  const immersive = first(walk(response, "immersiveHeaderRenderer"));
  if (immersive) {
    return {
      title: runsText(immersive.title),
      subtitle: runsText(immersive.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText),
      description: runsText(immersive.description),
      thumbnail: bestThumbnail(immersive.thumbnail?.musicThumbnailRenderer ?? immersive.thumbnail),
    };
  }
  return { title: "" };
}

/* -------------------------------- pages --------------------------------- */

export async function browsePage(browseId: string, params?: string): Promise<Json> {
  return innertube("browse", params ? { browseId, params } : { browseId });
}

export async function detailPage(browseId: string, fallbackTitle: string): Promise<DetailPage> {
  const response = await browsePage(browseId);
  const header = parseHeader(response);
  const songs = collectSongs(response);
  const songIds = new Set(songs.map((s) => s.id));
  const sections = collectShelves(response)
    .map((section) => ({
      ...section,
      items: section.items.filter((i) => !(i.kind === "song" && songIds.has(i.id))),
    }))
    .filter((section) => section.items.length > 0);

  return {
    title: header.title || fallbackTitle,
    subtitle: header.subtitle,
    description: header.description,
    thumbnail: header.thumbnail ?? songs[0]?.thumbnail,
    songs,
    sections,
  };
}

export const SEARCH_FILTER_PARAMS: Record<string, string | undefined> = {
  all: undefined,
  songs: "EgWKAQIIAWoKEAkQBRAKEAMQBA==",
  videos: "EgWKAQIQAWoKEAkQChAFEAMQBA==",
  albums: "EgWKAQIYAWoKEAkQChAFEAMQBA==",
  artists: "EgWKAQIgAWoKEAkQChAFEAMQBA==",
  playlists: "Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo=",
};

export async function searchMusic(query: string, filter: string): Promise<Shelf[]> {
  const params = SEARCH_FILTER_PARAMS[filter];
  const response = await innertube("search", params ? { query, params } : { query });
  return collectShelves(response);
}

export async function searchSuggestions(input: string): Promise<string[]> {
  const response = await innertube("music/get_search_suggestions", { input });
  const out: string[] = [];
  for (const s of walk(response, "searchSuggestionRenderer")) {
    const text = runsText(s?.suggestion);
    if (text) out.push(text);
  }
  return [...new Set(out)].slice(0, 8);
}

export async function radioQueue(videoId: string): Promise<SongItem[]> {
  const response = await innertube("next", {
    videoId,
    playlistId: `RDAMVM${videoId}`,
    isAudioOnly: true,
    enablePersistentPlaylistPanel: true,
    params: "wAEB",
  });
  return collectSongs(response).filter((s) => s.id !== videoId);
}
