import { useCallback, useEffect, useRef, useState } from "react";

export type SleepPreset = "5m" | "10m" | "15m" | "30m" | "45m" | "60m" | "eos" | null;

export function useSleepTimer() {
  const [active, setActive] = useState(false);
  const [preset, setPreset] = useState<SleepPreset>(null);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (preset: SleepPreset) => {
      if (!preset) return;
      setPreset(preset);

      let seconds: number;
      if (preset === "eos") {
        seconds = Infinity;
      } else {
        const map: Record<string, number> = {
          "5m": 300,
          "10m": 600,
          "15m": 900,
          "30m": 1800,
          "45m": 2700,
          "60m": 3600,
        };
        seconds = map[preset] ?? 300;
      }

      endTimeRef.current = Date.now() + seconds * 1000;
      setRemaining(seconds);
      setActive(true);

      clearTimer();
      timerRef.current = setInterval(() => {
        const remainingMs = endTimeRef.current - Date.now();
        if (remainingMs <= 0) {
          clearTimer();
          setActive(false);
          setPreset(null);
          setRemaining(0);
          return;
        }
        setRemaining(Math.ceil(remainingMs / 1000));
      }, 1000);
    },
    [clearTimer],
  );

  const stop = useCallback(() => {
    clearTimer();
    setActive(false);
    setPreset(null);
    setRemaining(0);
    endTimeRef.current = 0;
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const formatTime = (seconds: number): string => {
    if (seconds === Infinity) return "End of song";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return {
    active,
    preset,
    remaining,
    start,
    stop,
    formatTime,
  };
}
