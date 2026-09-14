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
      { title: "Explore — flex-web music player" },
      {
        name: "description",
        content:
          "New releases, moods and genres, and trending shelves straight from YouTube Music, with a custom ad-free player.",
      },
      { property: "og:title", content: "Explore — flex-web music player" },
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
      {data.sections.length ? (
        data.sections.map((shelf, i) => <ShelfRow key={`${shelf.title}-${i}`} shelf={shelf} />)
      ) : (
        <EmptyState message="The explore feed is unavailable right now. Try a search instead." />
      )}
    </div>
  );
}
