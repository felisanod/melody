// Browser-only: passes YouTube's "not a robot" check (no login) and resolves a full audio stream URL.
/* eslint-disable @typescript-eslint/no-explicit-any */

const REQUEST_KEY = "O43z0dpjhgX20SCx4KAo";
const WAA_KEY = "AIzaSyDyT5W0Jh49F30Pqqtyfdf7pDLFKLJoAnw";

export interface ResolvedStream {
  url: string;
  mimeType: string;
  bitrate: number;
  contentLength: number;
  title?: string | undefined;
  author?: string | undefined;
  lengthSeconds?: number | undefined;
}

function proxied(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const req = input instanceof Request ? input : null;
  const url = req ? req.url : input.toString();
  const headers: Record<string, string> = {};
  new Headers(init?.headers ?? req?.headers).forEach((v, k) => (headers[k] = v));
  const method = init?.method ?? req?.method ?? "GET";
  const body = init?.body ?? (req && method !== "GET" ? req.clone().arrayBuffer() : undefined);
  return Promise.resolve(body).then((b) =>
    fetch(`/api/public/yt-proxy?url=${encodeURIComponent(url)}`, {
      method,
      headers: { "x-proxy-headers": JSON.stringify(headers) },
      body: b as BodyInit | undefined,
    }),
  );
}

let minterPromise: Promise<any> | null = null;

async function createMinter(): Promise<any> {
  const { BotGuardClient, getChallenge } = await import("bgutils-js/botguard");
  const { WebPoMinter } = await import("bgutils-js/webpo");
  const challenge: any = await getChallenge({ requestKey: REQUEST_KEY, fetchFunction: proxied as typeof fetch });
  let js = challenge?.interpreterJavascript?.privateDoNotAccessOrElseSafeScriptWrappedValue;
  if (!js) {
    const src = challenge?.interpreterUrl?.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue;
    if (!src) throw new Error("robot check unavailable");
    js = await (await proxied(`https:${src}`)).text();
  }
  new Function(js)();
  const bg = await BotGuardClient.create({
    program: challenge.program,
    globalName: challenge.globalName,
    globalObject: window,
  });
  const signals: any[] = [];
  const snapshot = await bg.snapshot({ webPoSignalOutput: signals });
  const res = await proxied("https://jnn-pa.googleapis.com/$rpc/google.internal.waa.v1.Waa/GenerateIT", {
    method: "POST",
    headers: {
      "content-type": "application/json+protobuf",
      "x-goog-api-key": WAA_KEY,
      "x-user-agent": "grpc-web-javascript/0.1",
    },
    body: JSON.stringify([REQUEST_KEY, snapshot]),
  });
  const json: any = await res.json();
  if (!json?.[0]) throw new Error("robot check failed");
  return WebPoMinter.create({ integrityToken: json[0] }, signals);
}

let ytPromise: Promise<any> | null = null;

async function getClient(): Promise<any> {
  const mod: any = await import("youtubei.js/web");
  const { Innertube, Platform } = mod;
  Platform.shim.eval = async (data: any, env: any) => {
    const props: string[] = [];
    if (env.n) props.push(`n: exportedVars.nFunction(${JSON.stringify(env.n)})`);
    if (env.sig) props.push(`sig: exportedVars.sigFunction(${JSON.stringify(env.sig)})`);
    return new Function(`${data.output}\nreturn { ${props.join(", ")} }`)();
  };
  return Innertube.create({
    fetch: proxied,
    retrieve_player: true,
    generate_session_locally: true,
  });
}

export async function resolveStreamInBrowser(videoId: string): Promise<ResolvedStream> {
  minterPromise ??= createMinter().catch((e) => {
    minterPromise = null;
    throw e;
  });
  ytPromise ??= getClient().catch((e) => {
    ytPromise = null;
    throw e;
  });
  const [minter, yt] = await Promise.all([minterPromise, ytPromise]);
  const pot: string = await minter.mintAsWebsafeString(videoId);
  const info = await yt.getBasicInfo(videoId, { client: "YTMUSIC", po_token: pot });
  const format = info.chooseFormat({ type: "audio", quality: "best", format: "mp4" });
  let url: string = await format.decipher(yt.session.player);
  if (!url.includes("pot=")) url += `&pot=${encodeURIComponent(pot)}`;
  return {
    url,
    mimeType: String(format.mime_type ?? "audio/mp4"),
    bitrate: Number(format.bitrate ?? 0),
    contentLength: Number(format.content_length ?? 0),
    title: info.basic_info?.title,
    author: info.basic_info?.author,
    lengthSeconds: info.basic_info?.duration,
  };
}
