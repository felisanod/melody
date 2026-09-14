import { usePlayer } from "@/player/player-context";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Disc3, Music2, Volume2 } from "lucide-react";

export const Route = createFileRoute("/listen-together")({
  component: ListenTogetherPage,
});

function ListenTogetherPage() {
  const { current } = usePlayer();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl neu-raised text-accent-foreground">
          <Volume2 className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Listen Together</h1>
          <p className="text-sm text-muted-foreground">Listen to music in sync with friends</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="neu-raised rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Create Room</h2>
          <p className="text-sm text-muted-foreground">
            Start a synchronized listening session with friends.
          </p>
          <Link
            to="/listen-together/room"
            className="inline-flex items-center gap-2 rounded-full neu-raised-sm px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:neu-inset-sm"
          >
            <Music2 className="size-4" /> Create Room
          </Link>
        </div>

        <div className="neu-raised rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Join Room</h2>
          <p className="text-sm text-muted-foreground">Enter a room code to join a session.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room code"
              className="neu-inset-sm flex-1 rounded-lg border border-border/50 bg-transparent px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              className="rounded-lg neu-raised-sm px-4 py-2 text-sm font-medium text-accent-foreground transition hover:neu-inset-sm"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {current && (
        <div className="neu-raised rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 overflow-hidden rounded-lg neu-raised-sm">
            <img src={current.thumbnail} alt="" className="size-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {current.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {!current && (
        <div className="neu-raised rounded-2xl p-6 text-center">
          <Disc3 className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No song currently playing</p>
        </div>
      )}
    </div>
  );
}
