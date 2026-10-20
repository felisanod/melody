import { createServerFn } from "@tanstack/react-start";
import { streamText, Output } from "ai";
import { z } from "zod";

import type { SongItem } from "./music-types";

const suggestionSchema = z.object({
  songs: z.array(
    z.object({
      title: z.string(),
      artist: z.string(),
      reason: z.string(),
    }),
  ),
});

export interface MoodRecommendation {
  title: string;
  artist: string;
  reason: string;
  song: SongItem | null;
}

export const getMoodRecommendations = createServerFn({ method: "POST" })
  .inputValidator((data: { mood: string }) => {
    if (!data || typeof data.mood !== "string" || !data.mood.trim()) {
      throw new Error("Describe a mood or what you feel like listening to.");
    }
    return { mood: data.mood.trim().slice(0, 500) };
  })
  .handler(async ({ data }): Promise<{ recommendations: MoodRecommendation[] }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI recommendations are not configured yet.");

    const { createGatewayProvider, createLovableAiGatewayRunIdFetch } = await import(
      "./ai-gateway.server"
    );
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createGatewayProvider(apiKey, runIdFetch);

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions:
        "You are a music recommendation expert for a YouTube Music streaming app. " +
        "Given a listener's mood or musical preference, recommend 8 real, well-known songs that match it. " +
        "Prefer songs that are easy to find on YouTube Music. Give a short reason for each pick.",
      messages: [
        {
          role: "user",
          content: `Recommend songs for this mood or preference: "${data.mood}"`,
        },
      ],
      output: Output.object({ schema: suggestionSchema }),
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const output = await result.output;
    const suggestions = output?.songs ?? [];

    const { searchMusic } = await import("./innertube.server");
    const recommendations: MoodRecommendation[] = await Promise.all(
      suggestions.slice(0, 8).map(async (s) => {
        try {
          const shelves = await searchMusic(`${s.title} ${s.artist}`, "songs");
          const song = shelves.flatMap((shelf) => shelf.items).find((item): item is SongItem => item.kind === "song") ?? null;
          return { title: s.title, artist: s.artist, reason: s.reason, song };
        } catch {
          return { title: s.title, artist: s.artist, reason: s.reason, song: null };
        }
      }),
    );

    return { recommendations };
  });
