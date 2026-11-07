import type { StudioJob } from '@vbm/contracts';
import { ApiError, api, sleep } from './api';

const maxPollFailures = 8;

// A missing or forbidden job never recovers; network blips, 429 and 5xx may.
const permanent = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429;

/** Polls a studio job until it leaves the running state, reporting each update. */
export async function followJob(
  id: string,
  onUpdate: (job: StudioJob) => void,
  isAlive: () => boolean,
  pause: (ms: number) => Promise<unknown> = sleep
): Promise<StudioJob | null> {
  let job: StudioJob | null = null;
  let failures = 0;
  while (isAlive()) {
    await pause(4000);
    try {
      job = (await api<{ job: StudioJob }>('/api/studio/jobs/' + encodeURIComponent(id))).job;
      failures = 0;
    } catch (error) {
      if (permanent(error) || ++failures >= maxPollFailures) throw error;
      continue;
    }
    onUpdate(job);
    if (job.status !== 'running' && job.status !== 'queued') return job;
  }
  return job;
}

/** Encodes an AudioBuffer as 16-bit PCM WAV. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const bytes = 44 + frames * channels * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, bytes - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * channels * 2, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < frames; i += 1)
    for (let c = 0; c < channels; c += 1) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  return new Blob([view.buffer], { type: 'audio/wav' });
}
