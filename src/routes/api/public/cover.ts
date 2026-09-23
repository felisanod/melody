import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = [
  "i.ytimg.com",
  "yt3.ggpht.com",
  "lh3.googleusercontent.com",
  "music.youtube.com",
];

export const Route = createFileRoute("/api/public/cover")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("url");
        if (!raw) return new Response("missing url", { status: 400 });
        let target: URL;
        try {
          target = new URL(raw);
        } catch {
          return new Response("bad url", { status: 400 });
        }
        if (target.protocol !== "https:" || !ALLOWED_HOSTS.includes(target.hostname)) {
          return new Response("host not allowed", { status: 400 });
        }
        const upstream = await fetch(target.toString());
        if (!upstream.ok) return new Response("upstream error", { status: 502 });
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
