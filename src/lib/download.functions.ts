import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface DownloadMeta {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  cover?: string | undefined;
  mimeType: string;
  bitrate: number;
  contentLength?: number | undefined;
  error?: string | undefined;
}

export const getDownloadMeta = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ videoId: z.string().min(5).max(30) }).parse(input),
  )
  .handler(async ({ data }): Promise<DownloadMeta> => {
    const { resolveAudioStream } = await import("./download.server");
    try {
      const info = await resolveAudioStream(data.videoId);
      return {
        videoId: info.videoId,
        title: info.title,
        author: info.author,
        lengthSeconds: info.lengthSeconds,
        cover: info.cover,
        mimeType: info.mimeType,
        bitrate: info.bitrate,
        contentLength: info.contentLength,
      };
    } catch (error) {
      return {
        videoId: data.videoId,
        title: "",
        author: "",
        lengthSeconds: 0,
        mimeType: "audio/mp4",
        bitrate: 0,
        error: error instanceof Error ? error.message : "download unavailable",
      };
    }
  });
