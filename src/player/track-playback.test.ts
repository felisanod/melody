import { describe, it } from "node:test";
import { deepEqual } from "node:assert/strict";
import { selectTrack } from "./track-playback";

function mockEngine() {
  const calls: string[] = [];
  return { calls, engine: {
    loadVideoById: (id: string) => calls.push(`load:${id}`),
    cueVideoById: (id: string) => calls.push(`cue:${id}`),
    playVideo: () => calls.push("play"),
  } };
}

describe("track selection", () => {
  it("resumes the selected song even when it is already loaded", () => {
    const { engine, calls } = mockEngine();
    selectTrack(engine, "Rgrt_8mXrK8", "Rgrt_8mXrK8", true);
    deepEqual(calls, ["play"]);
  });
  it("loads a different selected song immediately", () => {
    const { engine, calls } = mockEngine();
    selectTrack(engine, "4D7u5KF7SP8", "Rgrt_8mXrK8", true);
    deepEqual(calls, ["load:4D7u5KF7SP8"]);
  });
  it("restores a song without starting playback automatically", () => {
    const { engine, calls } = mockEngine();
    selectTrack(engine, "Rgrt_8mXrK8", null, false);
    deepEqual(calls, ["cue:Rgrt_8mXrK8"]);
  });
});