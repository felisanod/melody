import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type {
  DetailPage,
  FeedPage,
  LyricsResult,
  SearchSummary,
  SongItem,
} from "./music-types";

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
    z.object({ query: z.string().min(1).max(200), filter: z.string().default("all") }).parse(input),
  )
  .handler(async ({ data }): Promise<SearchSummary> => {
    const { searchMusic } = await import("./innertube.server");
    try {
      return { sections: (await searchMusic(data.query, data.filter)).slice(0, 8) };
    } catch (error) {
      console.error("search failed", error);
      return { sections: [] };
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
      return [];
    }
  });

export const getDetailPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ browseId: z.string().min(2).max(120), fallbackTitle: z.string().default("") }).parse(input),
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
    const { fetchLyrics } = await import("./lyrics.server");
    try {
      return await fetchLyrics(data.title, data.artist, data.durationSeconds);
    } catch (error) {
      console.error("lyrics failed", error);
      return { synced: [] };
    }
  });
