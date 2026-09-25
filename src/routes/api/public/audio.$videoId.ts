import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/audio/$videoId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const videoId = String(params.videoId ?? "");
        if (!/^[A-Za-z0-9_-]{5,20}$/.test(videoId)) {
          return new Response("invalid id", { status: 400 });
        }
        try {
          const { resolveAudioStream } = await import("@/lib/download.server");
          const info = await resolveAudioStream(videoId);
          const range = request.headers.get("range");
          const upstream = await fetch(info.url, {
            headers: {
              "user-agent":
                "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)",
              ...(range ? { range } : {}),
            },
          });
          if (!upstream.ok && upstream.status !== 206) {
            return new Response("upstream error", { status: 502 });
          }
          const headers = new Headers();
          headers.set("content-type", info.mimeType.split(";")[0] ?? "audio/mp4");
          headers.set("accept-ranges", "bytes");
          headers.set("cache-control", "no-store");
          for (const key of ["content-length", "content-range"]) {
            const value = upstream.headers.get(key);
            if (value) headers.set(key, value);
          }
          return new Response(upstream.body, { status: upstream.status, headers });
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "failed", { status: 500 });
        }
      },
    },
  },
});
