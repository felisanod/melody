import { createFileRoute } from "@tanstack/react-router";

// Relays YouTube / Google requests needed for resolving downloads (browsers are blocked by CORS).
const ALLOWED = [
  "www.youtube.com",
  "music.youtube.com",
  "youtube.com",
  "youtubei.googleapis.com",
  "jnn-pa.googleapis.com",
  "www.google.com",
];

async function relay(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return new Response("missing url", { status: 400 });
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED.includes(target.hostname)) {
    return new Response("host not allowed", { status: 400 });
  }
  const headers = new Headers();
  const forwarded = request.headers.get("x-proxy-headers");
  if (forwarded) {
    try {
      for (const [k, v] of Object.entries(JSON.parse(forwarded) as Record<string, string>)) {
        if (!/^(host|cookie|origin|referer|content-length)$/i.test(k)) headers.set(k, String(v));
      }
    } catch {
      /* ignore bad header bag */
    }
  }
  if (!headers.has("user-agent")) {
    headers.set(
      "user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );
  }
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const upstream = await fetch(target.toString(), { method: request.method, headers, body });
  const out = new Headers();
  out.set("content-type", upstream.headers.get("content-type") ?? "application/octet-stream");
  out.set("cache-control", "no-store");
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: out });
}

export const Route = createFileRoute("/api/public/yt-proxy")({
  server: { handlers: { GET: ({ request }) => relay(request), POST: ({ request }) => relay(request) } },
});
