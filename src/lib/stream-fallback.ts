// Pure fallback logic: YouTube refuses different client types from different servers and for different songs,
// so downloads try several clients and only accept a stream whose bytes are actually served.

/** Order matters: the first clients were the most reliable from both the preview and published servers. */
export const DOWNLOAD_CLIENTS = ["YTMUSIC", "VISIONOS", "TV_SIMPLY", "MWEB", "ANDROID_VR"] as const;

export const REFUSED_MESSAGE = "YouTube refused this song's audio on every source. Please try again in a moment.";

export async function firstWorking<T>(
  clients: readonly string[],
  resolve: (client: string) => Promise<T>,
  verify: (stream: T) => Promise<boolean>,
): Promise<T & { client: string }> {
  for (const client of clients) {
    try {
      const stream = await resolve(client);
      if (await verify(stream)) return { ...stream, client };
    } catch {
      // try the next client type
    }
  }
  throw new Error(REFUSED_MESSAGE);
}
