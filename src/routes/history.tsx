import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, ShelfRow } from "@/components/music-cards";
import { getHistoryFeed } from "@/lib/library.functions";

const historyQuery = queryOptions({
  queryKey: ["history"],
  queryFn: () => getHistoryFeed(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — flex-web" },
      { name: "description", content: "Your listening history." },
      { property: "og:title", content: "History — flex-web" },
      { property: "og:description", content: "Your listening history." },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(historyQuery);
  },
  component: HistoryPage,
});

function HistoryPage() {
  const { data } = useSuspenseQuery(historyQuery);

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">History</h1>
      {data.sections.length ? (
        data.sections.map((shelf, i) => <ShelfRow key={`${shelf.title}-${i}`} shelf={shelf} />)
      ) : (
        <EmptyState message="Your history is empty." />
      )}
    </div>
  );
}
