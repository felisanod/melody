import { Link } from "@tanstack/react-router";
import { Disc3, ListMusic, Play, Plus, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MusicItem, Shelf, SongItem } from "@/lib/music-types";
import { usePlayer } from "@/player/player-context";
import { SongContextMenu } from "@/components/song-context-menu";

function Artwork({
  src,
  alt,
  rounded,
  className,
}: {
  src: string | undefined;
  alt: string;
  rounded?: "full" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden neu-raised",
        rounded === "full" ? "rounded-full" : "rounded-xl",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Disc3 className="size-8" />
        </div>
      )}
    </div>
  );
}

export function ItemCard({ item, contextSongs }: { item: MusicItem; contextSongs: SongItem[] | undefined }) {
  const { playSong } = usePlayer();

  if (item.kind === "song") {
    return (
      <SongContextMenu song={item}>
        <button
          type="button"
          onClick={() => playSong(item, contextSongs)}
          className="group w-40 shrink-0 text-left sm:w-44"
        >
          <div className="relative">
            <Artwork src={item.thumbnail} alt={item.title} className="aspect-square w-full" />
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="size-9 fill-current text-accent-foreground" />
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.artists.map((a) => a.name).join(", ")}
          </p>
        </button>
      </SongContextMenu>
    );
  }

  const shared = (
    <>
      <Artwork
        src={item.thumbnail}
        alt={item.title}
        rounded={item.kind === "artist" ? "full" : "lg"}
        className="aspect-square w-full"
      />
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
      <p className="line-clamp-1 text-xs text-muted-foreground">
        {item.kind === "album"
          ? [item.artists.map((a) => a.name).join(", "), item.year].filter(Boolean).join(" • ")
          : item.kind === "artist"
            ? (item.subtitle ?? "Artist")
            : (item.author ?? "Playlist")}
      </p>
    </>
  );

  if (item.kind === "album")
    return (
      <Link
        to="/album/$browseId"
        params={{ browseId: item.browseId }}
        className="group w-40 shrink-0 sm:w-44"
      >
        {shared}
      </Link>
    );
  if (item.kind === "artist")
    return (
      <Link
        to="/artist/$artistId"
        params={{ artistId: item.id }}
        className="group w-40 shrink-0 sm:w-44"
      >
        {shared}
      </Link>
    );
  return (
    <Link
      to="/playlist/$playlistId"
      params={{ playlistId: item.id }}
      className="group w-40 shrink-0 sm:w-44"
    >
      {shared}
    </Link>
  );
}

export function ShelfRow({ shelf }: { shelf: Shelf }) {
  const songs = shelf.items.filter((i): i is SongItem => i.kind === "song");
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
        {shelf.title}
      </h2>
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shelf.items.map((item, i) => (
          <ItemCard
            key={`${item.kind}-${"id" in item ? item.id : item.browseId}-${i}`}
            item={item}
            contextSongs={songs.length > 1 ? songs : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export function SongRow({
  song,
  songs,
  position,
  active,
}: {
  song: SongItem;
  songs?: SongItem[];
  position?: number;
  active?: boolean;
}) {
  const { playSong, addToQueue } = usePlayer();
  return (
    <SongContextMenu song={song}>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/50",
          active && "neu-inset-sm",
        )}
      >
        {position !== undefined && (
          <span className="w-6 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
            {position}
          </span>
        )}
        <button
          type="button"
          onClick={() => playSong(song, songs)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="relative size-11 shrink-0">
            <Artwork src={song.thumbnail} alt={song.title} className="size-11" />
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="size-5 fill-current" />
            </span>
          </div>
          <div className="min-w-0">
            <p className={cn("line-clamp-1 text-sm font-medium", active && "text-accent")}>
              {song.title}
              {song.explicit && (
                <span className="ml-2 rounded neu-inset-sm px-1 text-[10px] uppercase text-muted-foreground">
                  E
                </span>
              )}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {song.artists.map((a) => a.name).join(", ") || song.album?.name}
            </p>
          </div>
        </button>
        <span className="hidden w-12 text-right text-xs tabular-nums text-muted-foreground sm:block">
          {song.durationText ?? ""}
        </span>
        <button
          type="button"
          onClick={() => addToQueue(song)}
          title="Add to queue"
          className="rounded-full p-2 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100 neu-raised-sm"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </SongContextMenu>
  );
}

export function EmptyState({
  icon = "list",
  message,
}: {
  icon?: "list" | "user";
  message: string;
}) {
  const Icon = icon === "user" ? User : ListMusic;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-card/60 px-6 py-16 text-center neu-inset">
      <Icon className="size-8 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
