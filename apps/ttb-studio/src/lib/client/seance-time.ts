/** Time helpers for the séance transport: each take keeps its own length. */
export function takeDuration(
  buffers: Partial<Record<string, { duration: number }>>,
  label: string | null
): number {
  const buffer = label ? buffers[label] : undefined;
  return buffer && Number.isFinite(buffer.duration) ? buffer.duration : 0;
}

/** Keeps the shared position inside the take being switched to. */
export function positionIn(position: number, duration: number): number {
  return Math.min(Math.max(0, position), Math.max(0, duration));
}

/** Every take has finished (succeeded, failed or cancelled) but fewer than two can be compared. */
export function cannotCompare(entries: { status: string; song_id: string | null }[]): boolean {
  const terminal = entries.every((e) => !['running', 'queued'].includes(e.status));
  return entries.length > 0 && terminal && entries.filter((e) => e.song_id).length < 2;
}
