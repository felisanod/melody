import { ChevronUp, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatTime, usePlayer } from "@/player/player-context";

export function PlayerBar() {
  const {
    current,
    playing,
    positionMs,
    durationMs,
    volume,
    shuffle,
    repeat,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    setExpanded,
  } = usePlayer();

  if (!current) return null;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const max = durationMs || (current.durationSeconds ?? 0) * 1000 || 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2 sm:gap-5 sm:px-6 sm:py-3">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
            {current.thumbnail && (
              <img src={current.thumbnail} alt={current.title} className="size-full object-cover" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition group-hover:opacity-100">
              <ChevronUp className="size-5" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-medium">{current.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {current.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleShuffle}
            className={cn("hidden rounded-full p-2 transition hover:bg-secondary sm:block", shuffle && "text-accent")}
          >
            <Shuffle className="size-4" />
          </button>
          <button type="button" onClick={previous} className="rounded-full p-2 transition hover:bg-secondary">
            <SkipBack className="size-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="rounded-full bg-accent p-3 text-accent-foreground transition hover:brightness-110"
          >
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </button>
          <button type="button" onClick={next} className="rounded-full p-2 transition hover:bg-secondary">
            <SkipForward className="size-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            className={cn(
              "hidden rounded-full p-2 transition hover:bg-secondary sm:block",
              repeat !== "off" && "text-accent",
            )}
          >
            <RepeatIcon className="size-4" />
          </button>
        </div>

        <div className="hidden flex-1 items-center gap-3 md:flex">
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {formatTime(positionMs)}
          </span>
          <Slider
            value={[Math.min(positionMs, max)]}
            max={max}
            step={1000}
            onValueChange={([value]) => seek(value)}
            className="flex-1"
          />
          <span className="w-10 text-xs tabular-nums text-muted-foreground">{formatTime(durationMs)}</span>
        </div>

        <div className="hidden w-32 items-center gap-2 lg:flex">
          <Volume2 className="size-4 text-muted-foreground" />
          <Slider value={[volume]} max={100} step={1} onValueChange={([value]) => setVolume(value)} />
        </div>
      </div>
      <div className="h-0.5 w-full bg-secondary md:hidden">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${(positionMs / max) * 100}%` }} />
      </div>
    </div>
  );
}
