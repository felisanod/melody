import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { getMoodRecommendations, type MoodRecommendation } from "@/lib/recommend.functions";
import { SongRow } from "@/components/music-cards";
import { Button } from "@/components/ui/button";
import type { SongItem } from "@/lib/music-types";

export const Route = createFileRoute("/moods")({
  head: () => ({
    meta: [
      { title: "Mood Mix — flex-web" },
      {
        name: "description",
        content: "Describe a mood or musical preference and get AI-powered song recommendations.",
      },
      { property: "og:title", content: "Mood Mix — flex-web" },
      { property: "og:description", content: "AI-powered song recommendations for any mood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoodsPage,
});

const EXAMPLES = [
  "Rainy evening, something calm and jazzy",
  "High-energy workout hype",
  "Nostalgic 2000s throwbacks",
  "Focus music for deep work",
];

function MoodsPage() {
  const recommend = useServerFn(getMoodRecommendations);
  const [mood, setMood] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<MoodRecommendation[] | null>(null);

  const submit = async (value: string) => {
    const query = value.trim();
    if (!query || busy) return;
    setBusy(true);
    setResults(null);
    try {
      const { recommendations } = await recommend({ data: { mood: query } });
      setResults(recommendations);
      if (!recommendations.length) toast.error("No recommendations came back. Try rephrasing.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not get recommendations");
    } finally {
      setBusy(false);
    }
  };

  const playable: SongItem[] = (results ?? [])
    .map((r) => r.song)
    .filter((s): s is SongItem => Boolean(s));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl neu-raised-sm">
          <Sparkles className="size-5 text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Mood Mix</h1>
          <p className="text-sm text-muted-foreground">
            Describe a mood or what you feel like — AI picks matching songs.
          </p>
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(mood);
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="e.g. Late-night drive, mellow and atmospheric…"
          className="w-full resize-none rounded-2xl bg-secondary/40 p-4 text-sm outline-none neu-inset-sm placeholder:text-muted-foreground"
        />
        <Button
          type="submit"
          disabled={busy || !mood.trim()}
          className="inline-flex items-center gap-2 self-start rounded-full px-5"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {busy ? "Finding songs…" : "Recommend songs"}
        </Button>
      </form>

      {!results && !busy ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setMood(example);
                void submit(example);
              }}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground neu-raised-sm"
            >
              {example}
            </button>
          ))}
        </div>
      ) : null}

      {results ? (
        <ul className="mt-8 flex flex-col gap-1">
          {results.map((rec, i) => (
            <li key={`${rec.title}-${rec.artist}-${i}`}>
              {rec.song ? (
                <div>
                  <SongRow song={rec.song} songs={playable} position={i + 1} />
                  <p className="ml-11 -mt-1 pb-1 pl-2 text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              ) : (
                <div className="rounded-xl px-2 py-2">
                  <p className="text-sm font-medium">
                    {rec.title} — <span className="text-muted-foreground">{rec.artist}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rec.reason} · not found in the catalog
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
