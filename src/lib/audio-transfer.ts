/** Never store a partial response as an offline song. */
export function assertCompleteAudio(actualBytes: number, expectedBytes: number): void {
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes <= 0 || actualBytes !== expectedBytes) {
    throw new Error("The song download was incomplete. Please try again.");
  }
}