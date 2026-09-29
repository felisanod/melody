import { createFileRoute } from "@tanstack/react-router";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CHUNK = 1024 * 1024;

export const Route = createFileRoute("/api/public/audio/$videoId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const videoId = String(params.videoId ?? "");
        if (!/^[A-Za-z0-9_-]{5,20}$/.test(videoId)) {
          return new Response("invalid id", { status: 400 });
        }
        const q = new URL(request.url).searchParams;
        const src = q.get("src");
        const total = Number(q.get("len") ?? 0);
        if (!src || !total) return new Response("missing stream", { status: 400 });
        let target: URL;
        try {
          target = new URL(src);
        } catch {
          return new Response("bad stream", { status: 400 });
        }
        if (target.protocol !== "https:" || !target.hostname.endsWith(".googlevideo.com")) {
          return new Response("host not allowed", { status: 400 });
        }
        const first = await fetch(`${target}&range=0-${Math.min(CHUNK, total) - 1}`, {
          headers: { "user-agent": UA },
        });
        if (!first.ok) {
          return new Response("YouTube refused this song's audio. Please try again.", { status: 502 });
        }
        const firstBytes = new Uint8Array(await first.arrayBuffer());
        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              controller.enqueue(firstBytes);
              for (let pos = CHUNK; pos < total; pos += CHUNK) {
                const to = Math.min(pos + CHUNK, total) - 1;
                const res = await fetch(`${target}&range=${pos}-${to}`, { headers: { "user-agent": UA } });
                if (!res.ok) throw new Error(`upstream ${res.status}`);
                controller.enqueue(new Uint8Array(await res.arrayBuffer()));
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });
        return new Response(body, {
          headers: {
            "content-type": "audio/mp4",
            "content-length": String(total),
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
