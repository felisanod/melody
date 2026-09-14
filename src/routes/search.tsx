import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState, ItemCard, SongRow } from "@/components/music-cards";
import { getSuggestions, searchCatalog } from "@/lib/music.functions";
import type { SongItem } from "@/lib/music-types";
import { cn } from "@/lib/utils";

const FILTERS = ["songs", "videos", "albums", "artists", "playlists"] as const;

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    filter: FILTERS.includes(search["filter"] as (typeof FILTERS)[number])
      ? (search["filter"] as (typeof FILTERS)[number])
      : ("songs" as const),
  }),
  head: () => ({
    meta: [
      { title: "Search music — flex-web" },
      {
        name: "description",
        content:
          "Search songs, albums, artists and playlists across YouTube Music and play them instantly.",
      },
      { property: "og:title", content: "Search music — flex-web" },
      {
        property: "og:description",
        content: "Search songs, albums, artists and playlists and play them instantly.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, filter } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [term, setTerm] = useState(q);
  const [debounced, setDebounced] = useState(q);
  const [focused, setFocused] = useState(false);

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(term), 250);
    return () => window.clearTimeout(id);
  }, [term]);

  const suggestions = useQuery({
    queryKey: ["suggestions", debounced],
    enabled: focused && debounced.trim().length > 1 && debounced !== q,
    queryFn: () => getSuggestions({ data: { input: debounced } }),
  });

  const results = useQuery({
    queryKey: ["search", q, filter],
    enabled: q.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () => searchCatalog({ data: { query: q, filter } }),
  });

  const submit = (value: string) => {
    if (!value.trim()) return;
    setFocused(false);
    void navigate({ search: (prev) => ({ ...prev, q: value.trim() }) });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-8">
      <div className="relative max-w-2xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(term);
          }}
        >
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            placeholder="Songs, albums, artists…"
            aria-label="Search music"
            className="w-full rounded-full border border-border/50 py-4 pl-12 pr-4 text-base outline-none transition focus:border-accent/50 neu-inset"
          />
        </form>
        {focused && (suggestions.data?.length ?? 0) > 0 && (
          <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border/40 bg-card neu-raised">
            {suggestions.data!.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onMouseDown={() => {
                    setTerm(item);
                    submit(item);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-secondary/50"
                >
                  <SearchIcon className="size-4 text-muted-foreground" />
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => void navigate({ search: (prev) => ({ ...prev, filter: key }) })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm capitalize transition neu-raised-sm",
              key === filter
                ? "text-accent-foreground neu-inset-sm"
                : "text-muted-foreground hover:text-foreground hover:neu-inset-sm",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {!q.trim() ? (
        <EmptyState message="Search for a song, album, artist or playlist to start listening." />
      ) : results.isLoading ? (
        <p className="text-sm text-muted-foreground">Searching…</p>
      ) : results.data?.sections.length ? (
        <div className="space-y-10">
          {results.data.sections.map((shelf, i) => {
            const songs = shelf.items.filter((item): item is SongItem => item.kind === "song");
            const songsOnly = songs.length === shelf.items.length;
            return (
              <section key={`${shelf.title}-${i}`} className="space-y-3">
                <h2 className="font-display text-xl font-semibold tracking-tight">{shelf.title}</h2>
                {songsOnly ? (
                  <div className="space-y-1">
                    {songs.map((song, position) => (
                      <SongRow key={`${song.id}-${position}`} song={song} songs={songs} />
                    ))}
                  </div>
                ) : (
                  <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {shelf.items.map((item, index) => (
                      <ItemCard
                        key={`${item.kind}-${"id" in item ? item.id : item.browseId}-${index}`}
                        item={item}
                        contextSongs={undefined}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState message={`No results for "${q}". Try a different spelling.`} />
      )}
    </div>
  );
}
