import { test } from "node:test";
import assert from "node:assert/strict";
import { DOWNLOAD_CLIENTS, REFUSED_MESSAGE, firstWorking } from "./stream-fallback";

test("skips clients that error or whose audio is refused", async () => {
  const tried: string[] = [];
  const result = await firstWorking(
    ["YTMUSIC", "VISIONOS", "TV_SIMPLY"],
    async (c) => {
      tried.push(c);
      if (c === "YTMUSIC") throw new Error("Streaming data not available");
      return { url: c };
    },
    async (s) => s.url === "TV_SIMPLY",
  );
  assert.equal(result.client, "TV_SIMPLY");
  assert.deepEqual(tried, ["YTMUSIC", "VISIONOS", "TV_SIMPLY"]);
});

test("fails with a clear message when every client is refused", async () => {
  await assert.rejects(
    firstWorking(DOWNLOAD_CLIENTS, async () => ({ url: "x" }), async () => false),
    { message: REFUSED_MESSAGE },
  );
});

test("YouTube Music is tried first", () => {
  assert.equal(DOWNLOAD_CLIENTS[0], "YTMUSIC");
});
