import { createFileRoute } from "@tanstack/react-router";

const UA = "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)";
const CHUNK = 1024 * 1024;

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
          const total = info.contentLength;
          if (!total) return new Response("unknown stream size", { status: 502 });

          // The source only serves ranged requests, so honour the client's range and fetch in chunks.
          let start = 0;
          let end = total - 1;
          const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
          if (range) {
            if (range[1]) start = Number(range[1]);
            if (range[2]) end = Math.min(Number(range[2]), total - 1);
          }
          if (start > end) return new Response("bad range", { status: 416 });

          const body = new ReadableStream<Uint8Array>({
            async start(controller) {
              try {
                for (let pos = start; pos <= end; pos += CHUNK) {
                  const to = Math.min(pos + CHUNK - 1, end);
                  const res = await fetch(`${info.url}&range=${pos}-${to}`, {
                    headers: { "user-agent": UA },
                  });
                  if (!res.ok) throw new Error(`upstream ${res.status}`);
                  controller.enqueue(new Uint8Array(await res.arrayBuffer()));
                }
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
          });

          const headers = new Headers();
          headers.set("content-type", info.mimeType.split(";")[0] ?? "audio/mp4");
          headers.set("accept-ranges", "bytes");
          headers.set("cache-control", "no-store");
          headers.set("content-length", String(end - start + 1));
          if (range) headers.set("content-range", `bytes ${start}-${end}/${total}`);
          return new Response(body, { status: range ? 206 : 200, headers });
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "failed", { status: 500 });
        }
      },
    },
  },
});
