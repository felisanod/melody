export interface DiscordPresenceData {
  details?: string | undefined;
  state?: string | undefined;
  largeImageKey?: string | undefined;
  largeImageText?: string | undefined;
  smallImageKey?: string | undefined;
  smallImageText?: string | undefined;
  startTimestamp?: number | undefined;
  endTimestamp?: number | undefined;
}

let presenceInterval: ReturnType<typeof setInterval> | null = null;
let currentPresence: DiscordPresenceData = {};
let isInitialized = false;

export function initDiscordPresence(clientId: string, _token?: string): void {
  if (isInitialized) return;
  isInitialized = true;
  presenceInterval = setInterval(() => {
    void updatePresenceInternal(clientId, currentPresence);
  }, 15_000);
}

export function updateDiscordPresence(data: DiscordPresenceData): void {
  currentPresence = data;
}

export function clearDiscordPresence(): void {
  currentPresence = {};
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
  isInitialized = false;
}

async function updatePresenceInternal(_clientId: string, data: DiscordPresenceData): Promise<void> {
  if (!data.details && !data.state) return;
  try {
    const payload = JSON.stringify({
      cmd: "SET_ACTIVITY",
      nonce: Math.random().toString(36).slice(2),
      args: {
        pid: process.pid ?? 0,
        activity: {
          cmd: "SET_ACTIVITY",
          application_id: _clientId,
          name: data.details ?? "",
          details: data.details ?? "",
          state: data.state ?? "",
          timestamps: data.startTimestamp
            ? { start: data.startTimestamp }
            : data.endTimestamp
              ? { end: data.endTimestamp }
              : undefined,
          assets: {
            large_image: data.largeImageKey,
            large_text: data.largeImageText,
            small_image: data.smallImageKey,
            small_text: data.smallImageText,
          },
        },
      },
    });
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    void res;
  } catch {
    // Silently fail — Discord RPC requires native client
  }
}

export function presenceFromPlayer(
  title: string,
  artist: string,
  isPlaying: boolean,
  currentTimeSeconds?: number,
  durationSeconds?: number,
): DiscordPresenceData {
  const presence: DiscordPresenceData = {
    details: title,
    state: `by ${artist}`,
    startTimestamp: currentTimeSeconds
      ? Math.floor(Date.now() / 1000) - currentTimeSeconds
      : undefined,
    endTimestamp: durationSeconds
      ? Math.floor(Date.now() / 1000) + (durationSeconds - (currentTimeSeconds ?? 0))
      : undefined,
  };
  if (!isPlaying) {
    delete presence.startTimestamp;
    delete presence.endTimestamp;
    presence.state = "paused";
  }
  return presence;
}
