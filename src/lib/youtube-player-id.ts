/** YouTube changes how player paths are escaped in its iframe script and page data. */
export function extractPlayerId(source: string): string | undefined {
  const normalized = source
    .replace(/\\u002f/gi, "/")
    .replace(/\\\//g, "/");
  return normalized.match(/\/s\/player\/([a-zA-Z0-9_-]+)\//)?.[1];
}

export async function discoverPlayerId(fetcher: typeof fetch): Promise<string> {
  // Page data is a fallback when iframe_api is unavailable or changes its format.
  for (const url of [
    "https://www.youtube.com/iframe_api",
    "https://music.youtube.com/",
    "https://www.youtube.com/embed/",
  ]) {
    try {
      const response = await fetcher(url);
      if (!response.ok) continue;
      const id = extractPlayerId(await response.text());
      if (id) return id;
    } catch {
      // Try the next independent source, without caching a failed lookup.
    }
  }
  throw new Error("YouTube's download player is temporarily unavailable. Please try again shortly.");
}