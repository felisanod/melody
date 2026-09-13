import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, ShelfRow } from "@/components/music-cards";
import { getChartsFeed } from "@/lib/music.functions";

const chartsQuery = queryOptions({
  queryKey: ["charts"],
  queryFn: () => getChartsFeed(),
  staleTime: 10 * 60 * 1000,
});

export const Route = createFileRoute("/charts")({
  head: () => ({
    meta: [
      { title: "Charts — trending songs and artists | Metrolist" },
      {
        name: "description",
        content: "Today's trending tracks, top songs, videos and artists from the YouTube Music charts.",
      },
      { property: "og:title", content: "Charts — trending songs and artists | Metrolist" },
      {
        property: "og:description",
        content: "Today's trending tracks, top songs and artists from YouTube Music.",
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(chartsQuery);
  },
  component: ChartsPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-8 text-sm text-muted-foreground">
      {error.message}
    </p>
  ),
});

function ChartsPage() {
  const { data } = useSuspenseQuery(chartsQuery);

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Charts</h1>
      {data.sections.length ? (
        data.sections.map((shelf, i) => <ShelfRow key={`${shelf.title}-${i}`} shelf={shelf} />)
      ) : (
        <EmptyState message="Charts are unavailable right now. Try again in a moment." />
      )}
    </div>
  );
}
