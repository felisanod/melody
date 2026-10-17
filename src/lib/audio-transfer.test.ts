import { describe, expect, test } from "bun:test";
import { assertCompleteAudio } from "./audio-transfer";

describe("full song downloads", () => {
  test("accepts a complete multi-chunk song", () => {
    expect(() => assertCompleteAudio(3459077, 3459077)).not.toThrow();
  });
  test("rejects the previously truncated first megabyte", () => {
    expect(() => assertCompleteAudio(1048576, 3459077)).toThrow();
  });
  test("rejects an empty song", () => {
    expect(() => assertCompleteAudio(0, 0)).toThrow();
  });
});