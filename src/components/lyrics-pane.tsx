import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Loader2, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLyrics } from "@/lib/music.functions";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/player/player-context";

export function LyricsPane() {
  const { current, positionMs, seek } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const manualScrollUntil = useRef(0);
  const artist = current?.artists.map((a) => a.name).join(", ") ?? "";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["lyrics", current?.id, current?.title, artist, current?.durationSeconds],
    enabled: Boolean(current), staleTime: 60 * 60 * 1000,
    queryFn: () => current ? getLyrics({ data: { title: current.title, artist, durationSeconds: current.durationSeconds } }) : Promise.resolve({ synced: [] }),
  });
  let activeIndex = -1;
  data?.synced.forEach((line, i) => { if (line.timeMs <= positionMs) activeIndex = i; });
  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeIndex < 0 || Date.now() < manualScrollUntil.current) return;
    const line = container.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`);
    if (!line) return;
    container.scrollTo({ top: line.offsetTop - container.offsetTop - container.clientHeight / 2 + line.clientHeight / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [activeIndex]);
  if (isLoading) return <div role="status" className="flex h-full items-center justify-center gap-3 text-muted-foreground"><Loader2 className="size-5 animate-spin motion-reduce:animate-none" />Looking for lyrics…</div>;
  if (isError) return <div role="alert" className="flex h-full flex-col items-center justify-center gap-4"><p className="text-muted-foreground">Lyrics couldn’t load.</p><Button onClick={() => void refetch()}>Try again</Button></div>;
  if (!data?.synced.length && !data?.plain) return <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground"><Mic2 className="size-8" /><p>No lyrics available for this song.</p></div>;
  return (
    <div ref={containerRef} onWheel={() => { manualScrollUntil.current = Date.now() + 4000; }} onTouchMove={() => { manualScrollUntil.current = Date.now() + 4000; }} className="relative h-full overflow-y-auto overscroll-contain px-6 sm:px-12">
      <div className="mx-auto max-w-3xl space-y-4 py-[30vh] sm:space-y-6">
        {data.synced.length ? data.synced.map((line, i) => (
          <Button key={`${line.timeMs}-${i}`} variant="ghost" data-line={i} aria-current={i === activeIndex ? "true" : undefined} onClick={() => { manualScrollUntil.current = 0; seek(line.timeMs); }} className={cn("block h-auto w-full whitespace-normal break-words rounded-lg px-2 py-2 text-left font-display text-2xl font-bold leading-relaxed transition-colors duration-300 motion-reduce:transition-none sm:text-4xl", i === activeIndex ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {line.text || "♪"}
          </Button>
        )) : <p className="whitespace-pre-wrap break-words font-display text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl">{data.plain}</p>}
        {data.source && <p className="px-2 pt-8 text-xs font-normal text-muted-foreground">Lyrics · {data.source}</p>}
      </div>
    </div>
  );
}
