import { createFileRoute } from "@tanstack/react-router";
import { usePlayer } from "@/player/player-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/player/$videoId")({
  head: () => ({
    meta: [
      { title: "Now Playing — flex-web" },
      { name: "description", content: "Your current song in flex-web." },
      { property: "og:title", content: "Now Playing — flex-web" },
      { property: "og:description", content: "Your current song in flex-web." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context, params }) => {
    void params;
    void context;
  },
  component: PlayerPage,
});

function PlayerPage() {
  const { current, playing, setExpanded, setNowPlayingView } = usePlayer();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="bg-card mx-auto flex size-48 items-center justify-center rounded-lg">
          {current?.thumbnail ? (
            <img
              src={current.thumbnail}
              alt={current.title}
              className="size-full rounded-lg object-cover"
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
        {current && <div className="flex justify-center gap-2">
          <Button onClick={() => { setNowPlayingView("song"); setExpanded(true); }}>Open player</Button>
          <Button onClick={() => { setNowPlayingView("lyrics"); setExpanded(true); }}>Lyrics</Button>
        </div>}
      </div>
    </div>
  );
}
