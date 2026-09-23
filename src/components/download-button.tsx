import { useEffect, useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { SongItem } from "@/lib/music-types";
import { downloadSong, isDownloaded } from "@/lib/downloads";

interface DownloadButtonProps {
  song: SongItem;
  className?: string;
  withLabel?: boolean;
}

export function DownloadButton({ song, className, withLabel }: DownloadButtonProps) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let alive = true;
    isDownloaded(song.id)
      .then((saved) => {
        if (alive && saved) setState("done");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [song.id]);

  const start = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (state !== "idle") return;
    setState("busy");
    setProgress(0);
    try {
      await downloadSong(song, setProgress);
      setState("done");
      toast.success(`Saved "${song.title}" for offline listening`);
    } catch (error) {
      setState("idle");
      toast.error(error instanceof Error ? error.message : "Download failed");
    }
  };

  return (
    <button
      type="button"
      onClick={start}
      title={state === "done" ? "Available offline" : "Download"}
      aria-label={state === "done" ? "Available offline" : "Download"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2 py-2 text-muted-foreground transition hover:text-foreground",
        state === "done" && "text-accent",
        className,
      )}
    >
      {state === "busy" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="size-4" />
      ) : (
        <Download className="size-4" />
      )}
      {withLabel ? (
        <span className="text-xs font-medium">
          {state === "busy"
            ? `${Math.round(progress * 100)}%`
            : state === "done"
              ? "Downloaded"
              : "Download"}
        </span>
      ) : null}
    </button>
  );
}
