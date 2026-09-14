/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getRadio } from "@/lib/music.functions";
import { likeVideo, removeSongFromLibrary } from "@/lib/music.functions";
import type { SongItem } from "@/lib/music-types";

export type RepeatMode = "off" | "all" | "one";

const STORAGE_KEY = "flex-web.player.v1";

interface PersistedState {
  queue: SongItem[];
  index: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
}

interface PlayerState {
  queue: SongItem[];
  index: number;
  current: SongItem | undefined;
  playing: boolean;
  ready: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  expanded: boolean;
}

interface PlayerApi extends PlayerState {
  playSong: (song: SongItem, contextQueue?: SongItem[]) => void;
  playQueue: (songs: SongItem[], startIndex?: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (ms: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: SongItem) => void;
  playNextInQueue: (song: SongItem) => void;
  removeAt: (index: number) => void;
  moveItem: (from: number, to: number) => void;
  clearQueue: () => void;
  setExpanded: (value: boolean) => void;
  likeCurrent: () => void;
  likeVideo: (videoId: string, like: boolean) => Promise<void>;
  removeSongFromLibrary: (videoId: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerApi | null>(null);

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SongItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [muted, setMuted] = useState(false);
  const previousVolume = useRef(80);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [expanded, setExpanded] = useState(false);

  const playerRef = useRef<any>(null);
  const loadedIdRef = useRef<string | null>(null);
  const autoplayRef = useRef(false);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const stateRef = useRef({ queue, index, shuffle, repeat });
  stateRef.current = { queue, index, shuffle, repeat };

  const current = queue[index];

  /* ---- restore persisted queue ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as PersistedState;
      if (Array.isArray(saved.queue)) setQueue(saved.queue);
      if (typeof saved.index === "number") setIndex(saved.index);
      if (typeof saved.volume === "number") setVolumeState(saved.volume);
      if (typeof saved.shuffle === "boolean") setShuffle(saved.shuffle);
      if (saved.repeat) setRepeat(saved.repeat);
    } catch {
      /* ignore corrupted state */
    }
  }, []);

  useEffect(() => {
    const payload: PersistedState = { queue, index, volume, shuffle, repeat };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage may be unavailable */
    }
  }, [queue, index, volume, shuffle, repeat]);

  /* ---- session playing marker (managed by visibilitychange handler) ---- */

  /* ---- auto-resume playback if session was active ---- */
  useEffect(() => {
    if (!queue.length || !ready) return;
    const wasPlaying = sessionStorage.getItem("flex-web.playing") === "1";
    if (wasPlaying && !playing) {
      const player = playerRef.current;
      if (player?.playVideo) {
        setTimeout(() => {
          player.playVideo();
        }, 200);
      }
    }
  }, [queue.length, ready, playing]);

  const advance = useCallback((direction: 1 | -1) => {
    const { queue: q, index: i, shuffle: sh, repeat: rp } = stateRef.current;
    if (!q.length) return;
    autoplayRef.current = true;
    if (sh && q.length > 1) {
      let candidate = i;
      while (candidate === i) candidate = Math.floor(Math.random() * q.length);
      setIndex(candidate);
      return;
    }
    const nextIndex = i + direction;
    if (nextIndex >= q.length) {
      if (rp === "all") setIndex(0);
      else {
        autoplayRef.current = false;
        setPlaying(false);
      }
      return;
    }
    if (nextIndex < 0) {
      setIndex(0);
      return;
    }
    setIndex(nextIndex);
  }, []);

  /* ---- hidden YouTube playback engine ---- */
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || playerRef.current) return;
      playerRef.current = new YT.Player("flex-web-playback-engine", {
        height: "1",
        width: "1",
        playerVars: { controls: 0, disablekb: 1, playsinline: 1, origin: window.location.origin },
        events: {
          onReady: () => {
            setReady(true);
            playerRef.current?.setVolume(volume);
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === 1) setPlaying(true);
            if (state === 2) setPlaying(false);
            if (state === 0) {
              if (stateRef.current.repeat === "one") {
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
              } else {
                advance(1);
              }
            }
          },
          onError: () => advance(1),
        },
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- load the current track ---- */
  useEffect(() => {
    if (!ready || !current) return;
    const player = playerRef.current;
    if (!player) return;
    if (loadedIdRef.current === current.id) return;
    loadedIdRef.current = current.id;
    setPositionMs(0);
    setDurationMs((current.durationSeconds ?? 0) * 1000);
    if (autoplayRef.current) {
      player.loadVideoById(current.id);
    } else {
      player.cueVideoById(current.id);
    }
  }, [ready, current, current?.id]);

  /* ---- position ticker ---- */
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      setPositionMs(Math.round(player.getCurrentTime() * 1000));
      const duration = player.getDuration?.() ?? 0;
      if (duration) setDurationMs(Math.round(duration * 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [playing]);

  /* ---- keep audio alive across app background/foreground ---- */
  const wasPlayingBeforeHidden = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const resumeAttemptsRef = useRef(0);
  useEffect(() => {
    const resumeIfPlaying = () => {
      if (!wasPlayingBeforeHidden.current) {
        const wasPlaying = sessionStorage.getItem("flex-web.playing") === "1";
        if (!wasPlaying) return;
      }
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        const player = playerRef.current;
        if (!player?.getPlayerState) return;
        const state = player.getPlayerState();
        if (state === 1) {
          resumeAttemptsRef.current = 0;
          return;
        }
        resumeAttemptsRef.current += 1;
        player.playVideo();
        if (resumeAttemptsRef.current < 5) {
          resumeTimerRef.current = window.setTimeout(() => {
            resumeIfPlaying();
          }, 1000 * resumeAttemptsRef.current);
        }
      }, 300 + resumeAttemptsRef.current * 200);
    };
    const onVisibility = () => {
      if (document.hidden) {
        const player = playerRef.current;
        if (player?.getPlayerState) {
          const state = player.getPlayerState();
          wasPlayingBeforeHidden.current = state === 1;
        } else {
          wasPlayingBeforeHidden.current = playingRef.current;
        }
        if (wasPlayingBeforeHidden.current) {
          try {
            sessionStorage.setItem("flex-web.playing", "1");
          } catch {
            /* storage unavailable */
          }
        }
        return;
      }
      resumeIfPlaying();
    };
    const onFocus = () => {
      resumeIfPlaying();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  /* ---- periodic state sync: resume if player paused while it should be playing ---- */
  useEffect(() => {
    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player?.getPlayerState) return;
      if (playingRef.current && player.getPlayerState() !== 1) {
        player.playVideo();
      }
    }, 5_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    playerRef.current?.setVolume?.(volume);
  }, [volume, ready]);

  /* ---- wake lock to prevent device sleep during playback ---- */
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if (!("wakeLock" in navigator)) return () => {};
    const update = async () => {
      try {
        if (playing && !wakeLock) {
          const wl = await (navigator as any).wakeLock.request("screen");
          wakeLock = wl;
          wl.addEventListener("release", () => {
            wakeLock = null;
          });
        } else if (!playing && wakeLock) {
          await wakeLock.release();
          wakeLock = null;
        }
      } catch {
        /* wake lock unavailable */
      }
    };
    update();
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    const metadata = new MediaMetadata({
      title: current.title,
      artist: current.artists.map((artist) => artist.name).join(", "),
      artwork: current.thumbnail ? [{ src: current.thumbnail }] : [],
    } as MediaMetadataInit & { album?: string });
    if (current.album?.name) metadata.album = current.album.name;
    navigator.mediaSession.metadata = metadata;
  }, [current]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const actions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => playerRef.current?.playVideo?.()],
      ["pause", () => playerRef.current?.pauseVideo?.()],
      ["previoustrack", () => advance(-1)],
      ["nexttrack", () => advance(1)],
      [
        "seekto",
        (details) => {
          if (typeof details.seekTime === "number")
            playerRef.current?.seekTo?.(details.seekTime, true);
        },
      ],
    ];
    for (const [action, handler] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* unsupported action */
      }
    }
    return () => {
      for (const [action] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          /* unsupported action */
        }
      }
    };
  }, [advance]);

  const playQueue = useCallback((songs: SongItem[], startIndex = 0) => {
    if (!songs.length) return;
    autoplayRef.current = true;
    setQueue(songs);
    setIndex(Math.max(0, Math.min(startIndex, songs.length - 1)));
    setPlaying(true);
  }, []);

  const playSong = useCallback(
    (song: SongItem, contextQueue?: SongItem[]) => {
      if (contextQueue?.length) {
        const at = contextQueue.findIndex((s) => s.id === song.id);
        playQueue(contextQueue, at >= 0 ? at : 0);
        return;
      }
      playQueue([song], 0);
      void getRadio({ data: { videoId: song.id } })
        .then((radio) => {
          if (!radio.length) return;
          setQueue((prev) => {
            if (prev.length !== 1 || prev[0]?.id !== song.id) return prev;
            const seen = new Set([song.id]);
            return [song, ...radio.filter((s) => !seen.has(s.id) && seen.add(s.id))];
          });
        })
        .catch(() => undefined);
    },
    [playQueue],
  );

  const playAt = useCallback((target: number) => {
    autoplayRef.current = true;
    setIndex(target);
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player || !current) return;
    autoplayRef.current = true;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }, [playing, current]);

  const seek = useCallback((ms: number) => {
    playerRef.current?.seekTo?.(ms / 1000, true);
    setPositionMs(ms);
  }, []);

  const value = useMemo<PlayerApi>(
    () => ({
      queue,
      index,
      current,
      playing,
      ready,
      positionMs,
      durationMs,
      volume,
      shuffle,
      repeat,
      expanded,
      playSong,
      playQueue,
      playAt,
      toggle,
      next: () => advance(1),
      previous: () => {
        if (positionMs > 4000) {
          seek(0);
          return;
        }
        advance(-1);
      },
      seek,
      setVolume: setVolumeState,
      toggleMute: () => {
        if (!muted) {
          previousVolume.current = volume;
          setMuted(true);
          playerRef.current?.setVolume?.(0);
        } else {
          setMuted(false);
          playerRef.current?.setVolume?.(previousVolume.current);
          setVolumeState(previousVolume.current);
        }
      },
      volumeUp: () => {
        const newVol = Math.min(volume + 10, 100);
        setVolumeState(newVol);
        setMuted(false);
        playerRef.current?.setVolume?.(newVol);
      },
      volumeDown: () => {
        const newVol = Math.max(volume - 10, 0);
        setVolumeState(newVol);
        playerRef.current?.setVolume?.(newVol);
      },
      likeCurrent: () => {},
      likeVideo: async (videoId: string, like: boolean) => {
        try {
          await likeVideo({ data: { videoId, like } });
        } catch {
          /* like failed */
        }
      },
      removeSongFromLibrary: async (videoId: string) => {
        try {
          await removeSongFromLibrary({ data: { videoId } });
        } catch {
          /* remove failed */
        }
      },
      toggleShuffle: () => setShuffle((v) => !v),
      cycleRepeat: () =>
        setRepeat((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off")),
      addToQueue: (song) =>
        setQueue((prev) => (prev.some((s) => s.id === song.id) ? prev : [...prev, song])),
      playNextInQueue: (song) =>
        setQueue((prev) => {
          const filtered = prev.filter((s) => s.id !== song.id);
          filtered.splice(index + 1, 0, song);
          return filtered;
        }),
      removeAt: (target) =>
        setQueue((prev) => {
          const copy = prev.filter((_, i) => i !== target);
          if (target < index) setIndex((i) => Math.max(0, i - 1));
          return copy;
        }),
      moveItem: (from, to) =>
        setQueue((prev) => {
          if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length)
            return prev;
          const copy = [...prev];
          const item = copy.splice(from, 1)[0];
          if (!item) return prev;
          copy.splice(to, 0, item);
          const currentId = prev[index]?.id;
          const newIndex = copy.findIndex((s) => s.id === currentId);
          if (newIndex >= 0) setIndex(newIndex);
          return copy;
        }),
      clearQueue: () => {
        playerRef.current?.stopVideo?.();
        loadedIdRef.current = null;
        setQueue([]);
        setIndex(0);
        setPlaying(false);
        setExpanded(false);
      },
      setExpanded,
    }),
    [
      queue,
      index,
      current,
      playing,
      ready,
      positionMs,
      durationMs,
      volume,
      shuffle,
      repeat,
      expanded,
      playSong,
      playQueue,
      playAt,
      toggle,
      advance,
      seek,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 -z-50 size-px overflow-hidden opacity-0"
      >
        <div id="flex-web-playback-engine" />
      </div>
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerApi {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
