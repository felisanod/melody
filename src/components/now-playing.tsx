import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  GripVertical,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { getLyrics } from "@/lib/music.functions";
import type { SongItem } from "@/lib/music-types";
import { cn } from "@/lib/utils";
import { formatTime, usePlayer } from "@/player/player-context";

function artistNames(song?: SongItem) {
  return song?.artists.map((a) => a.name).join(", ") ?? "";
}

function LyricsPane() {
  const { current, positionMs, seek } = usePlayer();
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lyrics", current?.id],
    enabled: Boolean(current),
    staleTime: 60 * 60 * 1000,
    queryFn: () =>
      getLyrics({
        data: {
          title: current!.title,
          artist: artistNames(current),
          durationSeconds: current!.durationSeconds,
        },
      }),
  });

  const activeIndex = useMemo(() => {
    if (!data?.synced.length) return -1;
    let found = -1;
    data.synced.forEach((line, i) => {
      if (line.timeMs <= positionMs + 200) found = i;
    });
    return found;
  }, [data, positionMs]);

  useEffect(() => {
    const container = listRef.current;
    if (!container || activeIndex < 0) return;
    const node = container.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`);
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  if (isLoading) return <p className="py-10 text-center text-sm text-muted-foreground">Looking for lyrics…</p>;

  if (data?.synced.length) {
    return (
      <div ref={listRef} className="max-h-[52vh] space-y-1 overflow-y-auto pr-2">
        {data.synced.map((line, i) => (
          <button
            key={`${line.timeMs}-${i}`}
            data-line={i}
            type="button"
            onClick={() => seek(line.timeMs)}
            className={cn(
              "block w-full text-balance rounded-lg px-3 py-2 text-left font-display text-lg leading-snug transition-colors",
              i === activeIndex
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {line.text || "♪"}
          </button>
        ))}
      </div>
    );
  }

  if (data?.plain) {
    return (
      <pre className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
        {data.plain}
      </pre>
    );
  }

  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      No lyrics found for this track yet.
    </p>
  );
}

function QueuePane() {
  const { queue, index, playAt, removeAt, moveItem, clearQueue } = usePlayer();
  const dragFrom = useRef<number | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {queue.length} in queue
        </p>
        <button
          type="button"
          onClick={clearQueue}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <Trash2 className="size-3.5" /> Clear
        </button>
      </div>
      <div className="max-h-[48vh] space-y-1 overflow-y-auto pr-2">
        {queue.map((song, i) => (
          <div
            key={`${song.id}-${i}`}
            draggable
            onDragStart={() => {
              dragFrom.current = i;
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragFrom.current !== null) moveItem(dragFrom.current, i);
              dragFrom.current = null;
            }}
            className={cn(
              "group flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/70",
              i === index && "bg-secondary",
            )}
          >
            <GripVertical className="size-4 cursor-grab text-muted-foreground/60" />
            <button
              type="button"
              onClick={() => playAt(i)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              {song.thumbnail ? (
                <img src={song.thumbnail} alt="" className="size-10 rounded-lg object-cover" />
              ) : (
                <span className="size-10 rounded-lg bg-secondary" />
              )}
              <span className="min-w-0">
                <span
                  className={cn(
                    "block line-clamp-1 text-sm font-medium",
                    i === index && "text-accent",
                  )}
                >
                  {song.title}
                </span>
                <span className="block line-clamp-1 text-xs text-muted-foreground">
                  {artistNames(song)}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NowPlaying() {
  const {
    current,
    playing,
    positionMs,
    durationMs,
    toggle,
    next,
    previous,
    seek,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
    setExpanded,
  } = usePlayer();
  const [tab, setTab] = useState<"queue" | "lyrics">("lyrics");

  if (!current) return null;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-2xl">
      {current.thumbnail && (
        <img
          src={current.thumbnail}
          alt=""
          aria-hidden
          className="pointer-events-none fixed inset-0 size-full scale-125 object-cover opacity-20 blur-3xl"
        />
      )}
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-8">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronDown className="size-4" /> Close
        </button>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-3xl bg-secondary shadow-2xl">
              {current.thumbnail && (
                <img src={current.thumbnail} alt={current.title} className="size-full object-cover" />
              )}
            </div>
            <h1 className="mt-6 text-balance font-display text-3xl font-semibold tracking-tight">
              {current.title}
            </h1>
            <p className="mt-1 text-muted-foreground">{artistNames(current)}</p>

            <Slider
              className="mt-6"
              value={[Math.min(positionMs, durationMs || positionMs)]}
              max={durationMs || (current.durationSeconds ?? 0) * 1000 || 1}
              step={1000}
              onValueChange={([value]) => seek(value)}
            />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{formatTime(positionMs)}</span>
              <span>{formatTime(durationMs)}</span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleShuffle}
                className={cn("rounded-full p-3 transition hover:bg-secondary", shuffle && "text-accent")}
              >
                <Shuffle className="size-5" />
              </button>
              <button type="button" onClick={previous} className="rounded-full p-3 transition hover:bg-secondary">
                <SkipBack className="size-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={toggle}
                className="rounded-full bg-accent p-5 text-accent-foreground transition hover:brightness-110"
              >
                {playing ? <Pause className="size-7 fill-current" /> : <Play className="size-7 fill-current" />}
              </button>
              <button type="button" onClick={next} className="rounded-full p-3 transition hover:bg-secondary">
                <SkipForward className="size-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                className={cn(
                  "rounded-full p-3 transition hover:bg-secondary",
                  repeat !== "off" && "text-accent",
                )}
              >
                <RepeatIcon className="size-5" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/60 p-4 sm:p-6">
            <div className="mb-4 inline-flex rounded-full bg-secondary p-1 text-sm">
              {(["lyrics", "queue"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-full px-4 py-1.5 capitalize transition",
                    tab === key ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
            {tab === "lyrics" ? <LyricsPane /> : <QueuePane />}
          </div>
        </div>
      </div>
    </div>
  );
}
