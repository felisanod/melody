import { createFileRoute } from "@tanstack/react-router";
import { usePlayer } from "@/player/player-context";
import { PlayerBar } from "@/components/player-bar";
import { NowPlaying } from "@/components/now-playing";
import { getLyrics } from "@/lib/music.functions";
import type { SongItem } from "@/lib/music-types";

export const Route = createFileRoute("/player/$videoId")({
  head: () => ({
    meta: [{ title: "Now Playing — flex-web" }, { name: "description", content: "Playing now." }],
  }),
  loader: ({ context, params }) => {
    void params;
    void context;
  },
  component: PlayerPage,
});

function PlayerPage() {
  const { current, playing } = usePlayer();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="neu-raised-lg mx-auto flex size-48 items-center justify-center rounded-3xl">
          {current?.thumbnail ? (
            <img
              src={current.thumbnail}
              alt={current.title}
              className="size-full rounded-3xl object-cover"
            />
          ) : (
            <p className="text-muted-foreground">No track</p>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {current?.title ?? "Select a song"}
          </h1>
          <p className="text-muted-foreground">
            {current?.artists.map((a) => a.name).join(", ") ?? ""}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{playing ? "Playing..." : "Paused"}</p>
        <p className="text-xs text-muted-foreground">
          Full player UI opens from the mini player at the bottom.
        </p>
      </div>
      <PlayerBar />
      {import.meta.env.DEV && <NowPlaying />}
    </div>
  );
}
