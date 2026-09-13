import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, ShelfRow } from "@/components/music-cards";
import { getExploreFeed } from "@/lib/music.functions";

const exploreQuery = queryOptions({
  queryKey: ["explore"],
  queryFn: () => getExploreFeed(),
  staleTime: 10 * 60 * 1000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Explore — Metrolist music player" },
      {
        name: "description",
        content:
          "New releases, moods and genres, and trending shelves straight from YouTube Music, with a custom ad-free player.",
      },
      { property: "og:title", content: "Explore — Metrolist music player" },
      {
        property: "og:description",
        content: "New releases, moods and genres, and trending shelves from YouTube Music.",
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(exploreQuery);
  },
  component: ExplorePage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-8 text-sm text-muted-foreground">
      {error.message}
    </p>
  ),
});

function ExplorePage() {
  const { data } = useSuspenseQuery(exploreQuery);

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Now on Metrolist</p>
        <h1 className="mt-2 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Explore what the world is listening to
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Fresh releases, mood mixes and chart movers — press play and Metrolist builds a queue around
          it, with synced lyrics ready to sing.
        </p>
      </div>

      {data.sections.length ? (
        data.sections.map((shelf, i) => <ShelfRow key={`${shelf.title}-${i}`} shelf={shelf} />)
      ) : (
        <EmptyState message="The explore feed is unavailable right now. Try a search instead." />
      )}
    </div>
  );
}
