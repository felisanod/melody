import { ChevronDown, GripVertical, Moon, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DownloadButton } from "@/components/download-button";
import { LyricsPane } from "@/components/lyrics-pane";
import type { SongItem } from "@/lib/music-types";
import { cn } from "@/lib/utils";
import { useSleepTimer } from "@/hooks/use-sleep-timer";
import { formatTime, usePlayer } from "@/player/player-context";

function artistNames(song?: SongItem) {
  return song?.artists.map((a) => a.name).join(", ") ?? "";
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
        <Button variant="ghost"
          type="button"
          onClick={clearQueue}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary/50 hover:text-foreground"
        >
          <Trash2 className="size-3.5" /> Clear
        </Button>
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
              "group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50",
              i === index && "bg-secondary",
            )}
          >
            <GripVertical className="size-4 cursor-grab text-muted-foreground/60" />
            <Button variant="ghost"
              type="button"
              onClick={() => playAt(i)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              {song.thumbnail ? (
                <img
                  src={song.thumbnail}
                  alt=""
                  className="size-10 rounded-lg object-cover bg-card"
                />
              ) : (
                <span className="size-10 rounded-lg bg-card bg-secondary" />
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
            </Button>
            <Button variant="ghost"
              type="button"
              onClick={() => removeAt(i)}
              className="rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100 bg-card"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NowPlaying() {
  const { current, playing, positionMs, durationMs, toggle, next, previous, seek, shuffle, repeat,
    toggleShuffle, cycleRepeat, setExpanded, nowPlayingView: tab, setNowPlayingView: setTab } = usePlayer();
  const sleep = useSleepTimer();
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
  }, [setExpanded]);
  if (!current) return null;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const max = durationMs || (current.durationSeconds ?? 0) * 1000 || 1;
  return (
    <section role="dialog" aria-modal="true" aria-label="Now playing" className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl shrink-0 items-center gap-3 border-b border-border/40 px-4 py-3 sm:px-8">
        <Button variant="ghost" size="icon" onClick={() => setExpanded(false)} aria-label="Close player" title="Close player"><ChevronDown /></Button>
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{current.title}</p><p className="truncate text-xs text-muted-foreground">{artistNames(current)}</p></div>
        <DownloadButton key={current.id} song={current} />
      </header>
      <div role="tablist" aria-label="Now playing views" className="mx-auto flex w-full max-w-5xl shrink-0 border-b border-border/40 px-4 sm:px-8">
        {(["song", "lyrics", "queue"] as const).map((key) => (
          <Button key={key} id={`player-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls="player-panel" variant="ghost" onClick={() => setTab(key)} className={cn("h-12 flex-1 rounded-none border-b-2 capitalize", tab === key ? "border-accent text-foreground" : "border-transparent text-muted-foreground")}>{key === "queue" ? "Up next" : key}</Button>
        ))}
      </div>
      <div id="player-panel" role="tabpanel" aria-labelledby={`player-tab-${tab}`} className="min-h-0 flex-1 overflow-y-auto">
        {tab === "lyrics" ? <LyricsPane key={current.id} /> : tab === "queue" ? <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8"><QueuePane /></div> : (
          <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-6">
            <div className="aspect-square w-full max-w-80 overflow-hidden rounded-lg bg-secondary bg-card">
              {current.thumbnail && <img src={current.thumbnail} alt={current.title} className="size-full object-cover" />}
            </div>
            <h1 className="mt-6 w-full break-words text-center font-display text-2xl font-semibold">{current.title}</h1>
            <p className="mt-1 text-center text-muted-foreground">{artistNames(current)}</p>
            <DownloadButton key={current.id} song={current} withLabel className="mt-4" />
            <Slider aria-label="Song position" className="mt-6" value={[Math.min(positionMs, max)]} max={max} step={1000} onValueChange={([value]) => seek(value ?? 0)} />
            <div className="mt-2 flex w-full justify-between text-xs tabular-nums text-muted-foreground"><span>{formatTime(positionMs)}</span><span>{formatTime(max)}</span></div>
            <div className="mt-4 flex items-center justify-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" aria-label="Shuffle" title="Shuffle" aria-pressed={shuffle} onClick={toggleShuffle} className={cn(shuffle && "text-accent")}><Shuffle /></Button>
              <Button variant="ghost" size="icon" aria-label="Previous song" title="Previous song" onClick={previous}><SkipBack /></Button>
              <Button size="icon" aria-label={playing ? "Pause" : "Play"} onClick={toggle} className="size-14 rounded-full">{playing ? <Pause /> : <Play />}</Button>
              <Button variant="ghost" size="icon" aria-label="Next song" title="Next song" onClick={next}><SkipForward /></Button>
              <Button variant="ghost" size="icon" aria-label={`Repeat: ${repeat}`} title={`Repeat: ${repeat}`} onClick={cycleRepeat} className={cn(repeat !== "off" && "text-accent")}><RepeatIcon /></Button>
              <Button variant="ghost" size="icon" aria-label="Sleep timer" title={sleep.active ? `Sleep timer: ${sleep.formatTime(sleep.remaining)}` : "Sleep timer"} onClick={() => sleep.active ? sleep.stop() : sleep.start("30m")} className={cn(sleep.active && "text-accent")}><Moon /></Button>
            </div>
            {sleep.active && <p className="mt-2 text-xs text-accent">Sleep: {sleep.formatTime(sleep.remaining)}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
