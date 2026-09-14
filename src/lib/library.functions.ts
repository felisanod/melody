import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { FeedPage, SongItem } from "./music-types";
import { browsePage, collectShelves } from "./innertube.server";

const emptyFeed: FeedPage = { sections: [] };

export const getLibraryFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedPage> => {
    try {
      const response = await browsePage("FEmusic_liked");
      const sections = collectShelves(response).slice(0, 10);
      if (sections.length) return { sections };
      const fallback = await browsePage("FEmusic_history");
      return { sections: collectShelves(fallback).slice(0, 10) };
    } catch {
      return emptyFeed;
    }
  },
);

export const getHistoryFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedPage> => {
    try {
      const response = await browsePage("FEmusic_history");
      return { sections: collectShelves(response).slice(0, 20) };
    } catch {
      return emptyFeed;
    }
  },
);
