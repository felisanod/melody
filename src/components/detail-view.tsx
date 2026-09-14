import { Play, Shuffle } from "lucide-react";

import { EmptyState, ShelfRow, SongRow } from "@/components/music-cards";
import type { DetailPage } from "@/lib/music-types";
import { usePlayer } from "@/player/player-context";

export function DetailView({ page, round }: { page: DetailPage; round?: boolean }) {
  const { playQueue, current } = usePlayer();
  const songs = page.songs;

  const shufflePlay = () => {
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div
          className={`size-48 shrink-0 overflow-hidden neu-raised shadow-lg sm:size-60 ${
            round ? "rounded-full" : "rounded-2xl"
          }`}
        >
          {page.thumbnail && (
            <img src={page.thumbnail} alt={page.title} className="size-full object-cover" />
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {page.title || "Untitled"}
          </h1>
          {page.subtitle && <p className="text-sm text-muted-foreground">{page.subtitle}</p>}
          {page.description && (
            <p className="line-clamp-3 max-w-2xl text-sm text-muted-foreground">
              {page.description}
            </p>
          )}
          {songs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => playQueue(songs, 0)}
                className="inline-flex items-center gap-2 rounded-full neu-raised px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:neu-inset-sm"
              >
                <Play className="size-4 fill-current" /> Play
              </button>
              <button
                type="button"
                onClick={shufflePlay}
                className="inline-flex items-center gap-2 rounded-full neu-raised px-5 py-2.5 text-sm font-medium transition hover:neu-inset-sm"
              >
                <Shuffle className="size-4" /> Shuffle
              </button>
            </div>
          )}
        </div>
      </header>

      {songs.length > 0 && (
        <section className="space-y-1">
          {songs.map((song, i) => (
            <SongRow
              key={`${song.id}-${i}`}
              song={song}
              songs={songs}
              position={i + 1}
              active={current?.id === song.id}
            />
          ))}
        </section>
      )}

      {page.sections.map((shelf, i) => (
        <ShelfRow key={`${shelf.title}-${i}`} shelf={shelf} />
      ))}

      {songs.length === 0 && page.sections.length === 0 && (
        <EmptyState message="We couldn't load this page from YouTube Music. Try again in a moment." />
      )}
    </div>
  );
}
