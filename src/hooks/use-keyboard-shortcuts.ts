/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { usePlayer } from "@/player/player-context";

export function useKeyboardShortcuts() {
  const { toggle, next, previous, seek, volumeUp, volumeDown, toggleMute } = usePlayer();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (target.isContentEditable) return;

      switch (event.key) {
        case " ":
        case "k": {
          event.preventDefault();
          toggle();
          break;
        }
        case "ArrowRight": {
          event.preventDefault();
          if (event.shiftKey) {
            const player = (window as any).YT?.Player?.("flex-web-playback-engine");
            if (player?.seekTo) {
              const current = player.getCurrentTime?.() ?? 0;
              seek(Math.min(current + 10, (player.getDuration?.() ?? 0) * 1000));
            }
          } else {
            const player = (window as any).YT?.Player?.("flex-web-playback-engine");
            if (player?.seekTo) {
              const current = player.getCurrentTime?.() ?? 0;
              seek(Math.min(current + 5, (player.getDuration?.() ?? 0) * 1000));
            }
          }
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          const player = (window as any).YT?.Player?.("flex-web-playback-engine");
          if (player?.seekTo) {
            const current = player.getCurrentTime?.() ?? 0;
            seek(Math.max(current - 5, 0));
          }
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          volumeUp();
          break;
        }
        case "ArrowDown": {
          event.preventDefault();
          volumeDown();
          break;
        }
        case "n": {
          event.preventDefault();
          next();
          break;
        }
        case "p": {
          event.preventDefault();
          previous();
          break;
        }
        case "m": {
          event.preventDefault();
          toggleMute();
          break;
        }
        case "l": {
          event.preventDefault();
          break;
        }
        case "q": {
          event.preventDefault();
          break;
        }
        case "/": {
          event.preventDefault();
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, next, previous, seek, volumeUp, volumeDown, toggleMute]);
}
