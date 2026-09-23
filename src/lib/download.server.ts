/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-only helper that resolves a playable audio-only stream for a videoId.

export interface AudioStreamInfo {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  cover?: string | undefined;
  mimeType: string;
  bitrate: number;
  contentLength?: number | undefined;
  url: string;
}

const PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";

function iosContext() {
  return {
    client: {
      clientName: "IOS",
      clientVersion: "20.10.4",
      deviceMake: "Apple",
      deviceModel: "iPhone16,2",
      osName: "iPhone",
      osVersion: "18.3.2.22D82",
      hl: "en",
      gl: "US",
    },
  };
}

export async function resolveAudioStream(videoId: string): Promise<AudioStreamInfo> {
  const res = await fetch(PLAYER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent":
        "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)",
    },
    body: JSON.stringify({
      context: iosContext(),
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
  });
  if (!res.ok) throw new Error(`player request failed: ${res.status}`);
  const json: any = await res.json();
  const status = json?.playabilityStatus?.status;
  if (status && status !== "OK") {
    throw new Error(
      json?.playabilityStatus?.reason || `track is not available for download (${status})`,
    );
  }

  const formats: any[] = [
    ...(json?.streamingData?.adaptiveFormats ?? []),
    ...(json?.streamingData?.formats ?? []),
  ];
  const audio = formats
    .filter((f) => typeof f?.url === "string" && String(f?.mimeType ?? "").startsWith("audio"))
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
  const best = audio.find((f) => String(f.mimeType).includes("mp4")) ?? audio[0];
  if (!best) throw new Error("no downloadable audio stream found");

  const details = json?.videoDetails ?? {};
  const thumbs: any[] = details?.thumbnail?.thumbnails ?? [];

  return {
    videoId,
    title: details.title ?? "",
    author: details.author ?? "",
    lengthSeconds: Number(details.lengthSeconds ?? 0),
    cover: thumbs.at(-1)?.url,
    mimeType: String(best.mimeType),
    bitrate: Number(best.bitrate ?? 0),
    contentLength: best.contentLength ? Number(best.contentLength) : undefined,
    url: String(best.url),
  };
}
