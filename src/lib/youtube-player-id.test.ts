import { describe, it } from "node:test";
import { equal, rejects } from "node:assert/strict";
import { discoverPlayerId, extractPlayerId } from "./youtube-player-id";

describe("download player discovery", () => {
  it("reads both escaped iframe paths and unescaped page paths", () => {
    equal(extractPlayerId(String.raw`https:\/\/www.youtube.com\/s\/player\/dce23b30\/www-widgetapi.js`), "dce23b30");
    equal(extractPlayerId('"jsUrl":"/s/player/new_player-42/base.js"'), "new_player-42");
    equal(extractPlayerId(String.raw`\u002Fs\u002Fplayer\u002Fab123456\u002Fbase.js`), "ab123456");
  });
  it("uses page data when the iframe response has no player ID", async () => {
    const calls: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      calls.push(String(input));
      return new Response(calls.length === 1 ? "changed iframe script" : '"jsUrl":"/s/player/fallback123/base.js"');
    };
    equal(await discoverPlayerId(fetcher), "fallback123");
    equal(calls.length, 2);
    equal(calls[1], "https://music.youtube.com/");
  });
  it("recovers from a rejected iframe request", async () => {
    let calls = 0;
    const fetcher: typeof fetch = async () => {
      calls++;
      if (calls === 1) throw new Error("network unavailable");
      return new Response("/s/player/recovered123/base.js");
    };
    equal(await discoverPlayerId(fetcher), "recovered123");
  });
  it("does not accept error pages or reuse a stale hardcoded ID", async () => {
    const fetcher: typeof fetch = async () => new Response("unavailable", { status: 503 });
    await rejects(discoverPlayerId(fetcher), /temporarily unavailable/);
  });
});