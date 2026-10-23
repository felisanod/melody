interface TrackEngine {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
}

// Invoke during the listener's click when ready, preserving browser user activation.
export function selectTrack(engine: TrackEngine, id: string, loadedId: string | null, autoplay: boolean) {
  if (id === loadedId) {
    if (autoplay) engine.playVideo();
    return;
  }
  if (autoplay) engine.loadVideoById(id);
  else engine.cueVideoById(id);
}