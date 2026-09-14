/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type {
  DetailPage,
  FeedPage,
  LyricsResult,
  SearchSummary,
  SongItem,
  TranslationResult,
  LastFmTrack,
  LastFmArtist,
  RoomState,
  DiscordPresenceData,
} from "./music-types";
import { dbGet, dbPut, dbDelete } from "./storage";
import { searchLocalCatalog, getLocalSuggestions } from "./local-catalog";

const emptyFeed: FeedPage = { sections: [] };

export const getExploreFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedPage> => {
    const { browsePage, collectShelves } = await import("./innertube.server");
    try {
      const [home, explore] = await Promise.all([
        browsePage("FEmusic_home"),
        browsePage("FEmusic_explore"),
      ]);
      const sections = [...collectShelves(explore), ...collectShelves(home)].slice(0, 12);
      return { sections };
    } catch (error) {
      console.error("explore feed failed", error);
      return emptyFeed;
    }
  },
);

export const getChartsFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedPage> => {
    const { browsePage, collectShelves } = await import("./innertube.server");
    try {
      const response = await browsePage("FEmusic_charts");
      return { sections: collectShelves(response).slice(0, 10) };
    } catch (error) {
      console.error("charts feed failed", error);
      return emptyFeed;
    }
  },
);

export const searchCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().min(1).max(200), filter: z.string().default("songs") }).parse(input),
  )
  .handler(async ({ data }): Promise<SearchSummary> => {
    const { searchMusic } = await import("./innertube.server");
    try {
      const results = await searchMusic(data.query, data.filter);
      if (results.length) return { sections: results.slice(0, 8) };
      return { sections: searchLocalCatalog(data.query) };
    } catch (error) {
      console.error("search failed", error);
      return { sections: searchLocalCatalog(data.query) };
    }
  });

export const getSuggestions = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ input: z.string().max(200) }).parse(input))
  .handler(async ({ data }): Promise<string[]> => {
    if (!data.input.trim()) return [];
    const { searchSuggestions } = await import("./innertube.server");
    try {
      return await searchSuggestions(data.input);
    } catch (error) {
      console.error("suggestions failed", error);
      return getLocalSuggestions(data.input);
    }
  });

export const getDetailPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ browseId: z.string().min(2).max(120), fallbackTitle: z.string().default("") })
      .parse(input),
  )
  .handler(async ({ data }): Promise<DetailPage> => {
    const { detailPage } = await import("./innertube.server");
    try {
      return await detailPage(data.browseId, data.fallbackTitle);
    } catch (error) {
      console.error("detail page failed", error);
      return { title: data.fallbackTitle, songs: [], sections: [] };
    }
  });

export const getRadio = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ videoId: z.string().min(5).max(30) }).parse(input))
  .handler(async ({ data }): Promise<SongItem[]> => {
    const { radioQueue } = await import("./innertube.server");
    try {
      return (await radioQueue(data.videoId)).slice(0, 25);
    } catch (error) {
      console.error("radio failed", error);
      return [];
    }
  });

export const getLyrics = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        artist: z.string().max(200).default(""),
        durationSeconds: z.number().int().min(0).max(36000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<LyricsResult> => {
    const { getCachedLyrics, cacheLyrics } = await import("./lyrics-cache");
    const { fetchLyrics } = await import("./lyrics.server");
    try {
      const cached = await getCachedLyrics(data.title, data.artist);
      if (cached) return cached;
      const result = await fetchLyrics(data.title, data.artist, data.durationSeconds);
      if (result.synced.length || result.plain) {
        cacheLyrics(data.title, data.artist, result);
      }
      return result;
    } catch (error) {
      console.error("lyrics failed", error);
      return { synced: [] };
    }
  });

export const translateLyrics = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().min(1),
        targetLanguage: z.string().min(2).max(10),
        provider: z.enum(["openrouter", "deepl"]).default("openrouter"),
        mode: z.enum(["original", "translated", "romanized", "transcribed"]).default("translated"),
        model: z.string().optional(),
        customPrompt: z.string().optional(),
        formality: z.enum(["default", "formal", "informal"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { translateLyrics: doTranslate } = await import("./translation");
      const result = await doTranslate(data.text, {
        targetLanguage: data.targetLanguage,
        provider: data.provider,
        model: data.model,
        mode: data.mode,
        formality: data.formality,
      } as import("./music-types").TranslationOptions);
      return result;
    } catch (error) {
      console.error("translation failed", error);
      return { original: data.text, translated: data.text, mode: data.mode, source: "error" };
    }
  });

// Library management functions
export const likeVideo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ videoId: z.string().min(1), like: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("feedback", {
        feedbackToken: data.like ? "like" : "unlike",
        videoId: data.videoId,
      });
      return { success: true };
    } catch (error: any) {
      console.error("likeVideo failed", error);
      return { success: false, error: error.message };
    }
  });

export const likePlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ playlistId: z.string().min(1), like: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("feedback", {
        feedbackToken: data.like ? "likePlaylist" : "unlikePlaylist",
        playlistId: data.playlistId,
      });
      return { success: true };
    } catch (error: any) {
      console.error("likePlaylist failed", error);
      return { success: false, error: error.message };
    }
  });

export const subscribeChannel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ channelId: z.string().min(1), subscribe: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("feedback", {
        feedbackToken: data.subscribe ? "subscribe" : "unsubscribe",
        channelId: data.channelId,
      });
      return { success: true };
    } catch (error: any) {
      console.error("subscribeChannel failed", error);
      return { success: false, error: error.message };
    }
  });

export const addSongToLibrary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ videoId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("feedback", { feedbackToken: "add_to_library", videoId: data.videoId });
      return { success: true };
    } catch (error: any) {
      console.error("addSongToLibrary failed", error);
      return { success: false, error: error.message };
    }
  });

export const removeSongFromLibrary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ videoId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("feedback", { feedbackToken: "remove_from_library", videoId: data.videoId });
      return { success: true };
    } catch (error: any) {
      console.error("removeSongFromLibrary failed", error);
      return { success: false, error: error.message };
    }
  });

export const toggleSongLibrary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ videoId: z.string().min(1), addToLibrary: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.addToLibrary) {
      return addSongToLibrary({ data });
    } else {
      return removeSongFromLibrary({ data });
    }
  });

// Playlist management
export const createPlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ title: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      const response: any = await innertube("playlist/create", { title: data.title });
      return { playlistId: response?.id, success: true };
    } catch (error: any) {
      console.error("createPlaylist failed", error);
      return { success: false, error: error.message };
    }
  });

export const renamePlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ playlistId: z.string().min(1), name: z.string().min(1).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("playlist/edit", { playlistId: data.playlistId, title: data.name });
      return { success: true };
    } catch (error: any) {
      console.error("renamePlaylist failed", error);
      return { success: false, error: error.message };
    }
  });

export const deletePlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ playlistId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("playlist/delete", { playlistId: data.playlistId });
      await dbDelete("playlists", data.playlistId);
      return { success: true };
    } catch (error: any) {
      console.error("deletePlaylist failed", error);
      return { success: false, error: error.message };
    }
  });

export const addToPlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ playlistId: z.string().min(1), videoId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("playlist/edit", {
        playlistId: data.playlistId,
        videoId: data.videoId,
        feedbackToken: "add_video",
      });
      return { success: true };
    } catch (error: any) {
      console.error("addToPlaylist failed", error);
      return { success: false, error: error.message };
    }
  });

export const removeFromPlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        playlistId: z.string().min(1),
        videoId: z.string().min(1),
        setVideoId: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("playlist/edit", {
        playlistId: data.playlistId,
        videoId: data.videoId,
        setVideoId: data.setVideoId,
        feedbackToken: "remove_video",
      });
      return { success: true };
    } catch (error: any) {
      console.error("removeFromPlaylist failed", error);
      return { success: false, error: error.message };
    }
  });

export const moveSongPlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        playlistId: z.string().min(1),
        setVideoId: z.string().min(1),
        successorSetVideoId: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { innertube } = await import("./innertube.server");
    try {
      await innertube("playlist/edit", {
        playlistId: data.playlistId,
        setVideoId: data.setVideoId,
        successorSetVideoId: data.successorSetVideoId,
        feedbackToken: "swap_video",
      });
      return { success: true };
    } catch (error: any) {
      console.error("moveSongPlaylist failed", error);
      return { success: false, error: error.message };
    }
  });

// ====== Last.fm ======
export const lastFmInit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ apiKey: z.string().min(1), secret: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { initLastFm } = await import("./lastfm.server");
      initLastFm({ apiKey: data.apiKey, secret: data.secret });
      return { success: true };
    } catch (error: any) {
      console.error("lastFmInit failed", error);
      return { success: false, error: error.message };
    }
  });

export const lastFmScrobble = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        track: z.string().min(1),
        artist: z.string().min(1),
        album: z.string().optional(),
        duration: z.number().int().optional(),
      })
      .parse(input),
  )
  // @ts-expect-error: TanStack Start Zod optional type inference quirk
  .handler(async ({ data }): Promise<import("./lastfm.server").LastFmResponse> => {
    try {
      const { scrobble } = await import("./lastfm.server");
      return await scrobble(data.track, data.artist, {
        album: data.album,
        duration: data.duration,
      });
    } catch (error: any) {
      console.error("lastFmScrobble failed", error);
      return { success: false, error: error.message };
    }
  });

export const lastFmNowPlaying = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ track: z.string().min(1), artist: z.string().min(1) }).parse(input),
  )
  // @ts-expect-error: TanStack Start Zod optional type inference quirk
  .handler(async ({ data }): Promise<import("./lastfm.server").LastFmResponse> => {
    try {
      const { nowPlaying } = await import("./lastfm.server");
      return await nowPlaying(data.track, data.artist);
    } catch (error: any) {
      console.error("lastFmNowPlaying failed", error);
      return { success: false, error: error.message };
    }
  });

export const lastFmGetTopCharts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getTopCharts } = await import("./lastfm.server");
    const result = await getTopCharts();
    if (!result.success) return { tracks: [] as LastFmTrack[] };
    return { tracks: (result.data as { tracks: LastFmTrack[] }).tracks };
  } catch (error: any) {
    console.error("lastFmGetTopCharts failed", error);
    return { tracks: [] };
  }
});

export const lastFmGetSimilarArtists = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ artist: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { getSimilarArtists } = await import("./lastfm.server");
      const result = await getSimilarArtists(data.artist);
      if (!result.success) return { artists: [] as LastFmArtist[] };
      return { artists: (result.data as { artists: LastFmArtist[] }).artists };
    } catch (error: any) {
      console.error("lastFmGetSimilarArtists failed", error);
      return { artists: [] };
    }
  });

// ====== Room Sync ======
export const roomCreate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ hostId: z.string().min(1), hostName: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<RoomState | null> => {
    try {
      const { createRoom } = await import("./room-sync");
      return createRoom(data.hostId, data.hostName);
    } catch (error: any) {
      console.error("roomCreate failed", error);
      return null;
    }
  });

export const roomJoin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ roomId: z.string().min(1), userId: z.string().min(1), userName: z.string().min(1) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<RoomState | null> => {
    try {
      const { joinRoom } = await import("./room-sync");
      return joinRoom(data.roomId, data.userId, data.userName);
    } catch (error: any) {
      console.error("roomJoin failed", error);
      return null;
    }
  });

export const roomLeave = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ roomId: z.string().min(1), userId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { leaveRoom } = await import("./room-sync");
      return leaveRoom(data.roomId, data.userId);
    } catch (error: any) {
      console.error("roomLeave failed", error);
      return null;
    }
  });

export const roomUpdateState = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        roomId: z.string().min(1),
        currentTrack: z
          .object({
            videoId: z.string(),
            title: z.string(),
            artist: z.string(),
            artistId: z.string(),
            duration: z.number(),
            durationText: z.string(),
            thumbnail: z.string(),
          })
          .optional(),
        isPlaying: z.boolean().optional(),
        currentTime: z.number().optional(),
        queue: z.array(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<RoomState | null> => {
    try {
      const { updateRoomState } = await import("./room-sync");
      return updateRoomState(data.roomId, {
        currentTrack: data.currentTrack as {
          videoId: string;
          title: string;
          artist: string;
          artistId: string;
          duration: number;
          durationText: string;
          thumbnail: string;
        } | undefined,
        isPlaying: data.isPlaying as boolean | undefined,
        currentTime: data.currentTime as number | undefined,
        queue: data.queue as string[] | undefined,
      } as Partial<Pick<import("./music-types").RoomState, "queue" | "currentTrack" | "isPlaying" | "currentTime">>);
    } catch (error: any) {
      console.error("roomUpdateState failed", error);
      return null;
    }
  });

export const roomSendChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ roomId: z.string().min(1), senderId: z.string().min(1), text: z.string().max(500) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { sendChatMessage } = await import("./room-sync");
      return sendChatMessage(data.roomId, data.senderId, data.text);
    } catch (error: any) {
      console.error("roomSendChat failed", error);
      return null;
    }
  });

export const roomGetState = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ roomId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { getRoomState } = await import("./room-sync");
      return getRoomState(data.roomId);
    } catch (error: any) {
      console.error("roomGetState failed", error);
      return null;
    }
  });

export const roomGetMessages = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ roomId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { getRoomMessages } = await import("./room-sync");
      return getRoomMessages(data.roomId);
    } catch (error: any) {
      console.error("roomGetMessages failed", error);
      return { messages: [], members: [] };
    }
  });

// ====== Discord Rich Presence ======
export const discordInit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ clientId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { initDiscordPresence } = await import("./discord-presence");
      initDiscordPresence(data.clientId);
      return { success: true };
    } catch (error: any) {
      console.error("discordInit failed", error);
      return { success: false, error: error.message };
    }
  });

export const discordUpdatePresence = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        details: z.string().optional(),
        state: z.string().optional(),
        largeImageKey: z.string().optional(),
        largeImageText: z.string().optional(),
        smallImageKey: z.string().optional(),
        smallImageText: z.string().optional(),
        startTimestamp: z.number().optional(),
        endTimestamp: z.number().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { updateDiscordPresence } = await import("./discord-presence");
      updateDiscordPresence(data as DiscordPresenceData);
      return { success: true };
    } catch (error: any) {
      console.error("discordUpdatePresence failed", error);
      return { success: false, error: error.message };
    }
  });

// ====== Import/Export ======
export const exportData = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { exportToJSON } = await import("./import-export");
    const { dbGetAll } = await import("./storage");
    const [library, queue, history, playlists] = await Promise.all([
      dbGetAll("tracks"),
      dbGetAll("queue"),
      dbGetAll("history"),
      dbGetAll("playlists"),
    ]);
    const json = await exportToJSON(
      {},
      library as unknown as SongItem[],
      queue as unknown as SongItem[],
      history as unknown as SongItem[],
      playlists as unknown as Record<string, unknown>[],
      [],
    );
    return { success: true, json };
  } catch (error: any) {
    console.error("exportData failed", error);
    return { success: false, error: error.message };
  }
});

export const importData = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ json: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { importFromJSON, saveImportedData } = await import("./import-export");
      const result = await importFromJSON(data.json);
      if (!result.success) return result;
      await saveImportedData(result.data);
      return { success: true };
    } catch (error: any) {
      console.error("importData failed", error);
      return { success: false, error: error.message };
    }
  });

// ====== Backup/Restore ======
export const backupCreate = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { createBackup } = await import("./backup");
    const json = await createBackup();
    return { success: true, json };
  } catch (error: any) {
    console.error("backupCreate failed", error);
    return { success: false, error: error.message };
  }
});

export const backupRestore = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ json: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { restoreBackup } = await import("./backup");
      return await restoreBackup(data.json);
    } catch (error: any) {
      console.error("backupRestore failed", error);
      return { success: false, error: error.message };
    }
  });

// ====== Smart Playlists ======
export const smartPlaylistGenerate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        rules: z
          .array(
            z.object({
              field: z.string().min(1),
              operator: z.string().min(1),
              value: z.string(),
            }),
          )
          .min(1),
        matchAny: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { generateSmartPlaylist } = await import("./smart-playlists");
      const { dbGetAll } = await import("./storage");
      const library = (await dbGetAll("tracks")) as unknown as SongItem[];
      const playlist = {
        id: data.id,
        name: data.name,
        rules: data.rules as { field: string; operator: import("./smart-playlists").RuleOperator; value: string }[],
        matchAny: data.matchAny,
        createdAt: Date.now(),
      };
      const matches = generateSmartPlaylist(playlist, library);
      return { success: true, matches };
    } catch (error: any) {
      console.error("smartPlaylistGenerate failed", error);
      return { success: false, error: error.message };
    }
  });
