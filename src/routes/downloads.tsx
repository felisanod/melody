import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, HardDriveDownload, Music2, Pause, Play, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteDownload,
  formatBytes,
  listDownloads,
  saveToDevice,
  type DownloadRecord,
} from "@/lib/downloads";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads — flex-web" },
      {
        name: "description",
        content:
          "Songs you saved for offline listening in flex-web, with cover art, lyrics and full track details.",
      },
      { property: "og:title", content: "Downloads — flex-web" },
      {
        property: "og:description",
        content: "Your offline library: audio, cover art, lyrics and track details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  const [records, setRecords] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const refresh = () => {
    listDownloads()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const totalBytes = useMemo(() => records.reduce((sum, r) => sum + (r.bytes ?? 0), 0), [records]);

  const play = (record: DownloadRecord) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === record.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(record.audio);
    urlRef.current = url;
    audio.src = url;
    void audio.play().catch(() => toast.error("Could not play this saved file"));
    setPlayingId(record.id);
  };

  const remove = async (record: DownloadRecord) => {
    if (playingId === record.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    await deleteDownload(record.id);
    refresh();
    toast.success(`Removed "${record.title}" from downloads`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl neu-raised-sm">
          <HardDriveDownload className="size-5 text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Downloads</h1>
          <p className="text-sm text-muted-foreground">
            {records.length} saved {records.length === 1 ? "song" : "songs"} ·{" "}
            {formatBytes(totalBytes)} on this device
          </p>
        </div>
      </header>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading saved songs…</p>
      ) : records.length === 0 ? (
        <div className="rounded-2xl neu-raised-sm p-8 text-center">
          <Download className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 font-medium">No downloads yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the download button on any song to keep it on this device — cover art, lyrics and
            song details are saved too.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((record) => (
            <DownloadRow
              key={record.id}
              record={record}
              playing={playingId === record.id}
              onPlay={() => play(record)}
              onRemove={() => void remove(record)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DownloadRow({
  record,
  playing,
  onPlay,
  onRemove,
}: {
  record: DownloadRecord;
  playing: boolean;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!record.cover) return;
    const url = URL.createObjectURL(record.cover);
    setCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [record.cover]);

  const lyricCount = record.lyrics?.synced?.length ?? 0;

  return (
    <li className="flex items-center gap-3 rounded-2xl neu-raised-sm p-3">
      <button
        type="button"
        onClick={onPlay}
        className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary"
        aria-label={playing ? "Pause" : "Play"}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <Music2 className="absolute inset-0 m-auto size-5 text-muted-foreground" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
          {playing ? (
            <Pause className="size-5 text-white" />
          ) : (
            <Play className="size-5 text-white" />
          )}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{record.title}</p>
        <p className="truncate text-sm text-muted-foreground">{record.artist}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[
            record.album,
            record.durationSeconds ? formatDuration(record.durationSeconds) : null,
            formatBytes(record.bytes),
            record.bitrate ? `${Math.round(record.bitrate / 1000)} kbps` : null,
            lyricCount ? `${lyricCount} synced lyric lines` : record.lyrics?.plain ? "lyrics" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => saveToDevice(record)}
        className="rounded-full p-2 text-muted-foreground transition hover:text-foreground"
        title="Save file to device"
        aria-label="Save file to device"
      >
        <Save className="size-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-2 text-muted-foreground transition hover:text-destructive"
        title="Remove download"
        aria-label="Remove download"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
