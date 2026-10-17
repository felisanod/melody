import { describe, it as test } from "node:test";
import { doesNotThrow, throws } from "node:assert/strict";
import { assertCompleteAudio } from "./audio-transfer";

describe("full song downloads", () => {
  test("accepts a complete multi-chunk song", () => {
    doesNotThrow(() => assertCompleteAudio(3459077, 3459077));
  });
  test("rejects the previously truncated first megabyte", () => {
    throws(() => assertCompleteAudio(1048576, 3459077));
  });
  test("rejects an empty song", () => {
    throws(() => assertCompleteAudio(0, 0));
  });
});