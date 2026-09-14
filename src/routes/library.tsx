import { getLibraryFeed } from "@/lib/library.functions";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, ShelfRow } from "@/components/music-cards";

const libraryQuery = queryOptions({
  queryKey: ["library"],
  queryFn: () => getLibraryFeed(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — flex-web" },
      { name: "description", content: "Your songs, albums, artists, playlists and history." },
      { property: "og:title", content: "Library — flex-web" },
      { property: "og:description", content: "Your music collection." },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(libraryQuery);
  },
  component: LibraryPage,
});

function LibraryPage() {
  const { data } = useSuspenseQuery(libraryQuery);

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Library</h1>
      {data.sections.length ? (
        data.sections.map((shelf, i) => <ShelfRow key={`${shelf.title}-${i}`} shelf={shelf} />)
      ) : (
        <EmptyState message="Your library is empty. Start exploring to add songs." />
      )}
    </div>
  );
}
