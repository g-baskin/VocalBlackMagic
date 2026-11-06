export interface PhraseCandidate {
  id: string;
  take_id: string;
  source_file: string;
  start: number;
  end: number;
  rms_db: number;
  peak: number;
  clipped: number;
  snr_db: number;
}

export interface RankedPhrase extends PhraseCandidate {
  score: number;
  reasons: string[];
}

export interface GoldSegment {
  phrase_id: string;
  take_id: string;
  source_file: string;
  source_start: number;
  source_end: number;
  output_start: number;
  output_end: number;
}

export const MIN_PHRASE = 0.6;
export const MAX_PHRASE = 12;
export const GAP_SECONDS = 0.35;

/** Non-silent spans between silencedetect intervals, filtered to phrase-sized pieces. */
export function phrasesFromSilences(
  silences: { start: number; end: number }[],
  duration: number
): { start: number; end: number }[] {
  const sorted = [...silences].sort((a, b) => a.start - b.start);
  const out: { start: number; end: number }[] = [];
  let cursor = 0;
  const push = (s: number, e: number) => {
    for (let t = s; e - t >= MIN_PHRASE; t += MAX_PHRASE)
      out.push({ start: round3(t), end: round3(Math.min(e, t + MAX_PHRASE)) });
  };
  for (const s of sorted) {
    if (s.start > cursor) push(cursor, s.start);
    cursor = Math.max(cursor, s.end);
  }
  if (duration > cursor) push(cursor, duration);
  return out.filter((p) => p.end - p.start >= MIN_PHRASE);
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

/** Level, peak and clip count for one phrase from mono PCM. */
export function measurePhrase(pcm: Float32Array, rate: number, start: number, end: number) {
  const a = Math.max(0, Math.floor(start * rate));
  const b = Math.min(pcm.length, Math.ceil(end * rate));
  let sum = 0;
  let peak = 0;
  let clipped = 0;
  for (let i = a; i < b; i++) {
    const v = Math.abs(pcm[i]);
    sum += v * v;
    if (v > peak) peak = v;
    if (v >= 0.989) clipped++;
  }
  const rms = b > a ? Math.sqrt(sum / (b - a)) : 0;
  return {
    rms_db: rms > 0 ? Math.round(200 * Math.log10(rms)) / 10 : -120,
    peak: Math.round(peak * 1000) / 1000,
    clipped
  };
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Score phrases: clipping, SNR, loudness consistency with the pool, and phrase length. */
export function rankPhrases(candidates: PhraseCandidate[]): RankedPhrase[] {
  const med = median(candidates.map((c) => c.rms_db));
  return candidates
    .map((c) => {
      const reasons: string[] = [];
      const dur = c.end - c.start;
      const clip = c.clipped > 0 ? 0 : 1;
      if (c.clipped > 0) reasons.push('clipped peaks');
      const snr = Math.max(0, Math.min(1, (c.snr_db - 10) / 40));
      if (c.snr_db < 20) reasons.push('noisy');
      const consistency = Math.max(0, 1 - Math.abs(c.rms_db - med) / 12);
      if (Math.abs(c.rms_db - med) > 6) reasons.push('level far from the other phrases');
      const length = dur < 1.5 ? dur / 1.5 : dur > 8 ? Math.max(0.4, 1 - (dur - 8) / 8) : 1;
      if (dur < 1.5) reasons.push('very short');
      const score =
        Math.round((0.35 * clip + 0.3 * snr + 0.2 * consistency + 0.15 * length) * 1000) / 1000;
      if (!reasons.length) reasons.push('clean, consistent phrase');
      return { ...c, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

/** Pick representative phrases round-robin across takes (best first), then restore take/time order. */
export function selectPhrases(
  ranked: RankedPhrase[],
  opts: { excluded?: string[]; included?: string[]; maxPhrases?: number; minScore?: number } = {}
): RankedPhrase[] {
  const excluded = new Set(opts.excluded ?? []);
  const included = new Set(opts.included ?? []);
  const max = opts.maxPhrases ?? 15;
  const minScore = opts.minScore ?? 0.55;
  const forced = ranked.filter((p) => included.has(p.id) && !excluded.has(p.id));
  const pool = ranked.filter(
    (p) => !excluded.has(p.id) && !included.has(p.id) && p.score >= minScore && p.clipped === 0
  );
  const byTake = new Map<string, RankedPhrase[]>();
  for (const p of pool) byTake.set(p.take_id, [...(byTake.get(p.take_id) ?? []), p]);
  const takes = [...byTake.keys()].sort();
  const picked = [...forced];
  for (let round = 0; picked.length < max; round++) {
    let added = false;
    for (const t of takes) {
      const p = byTake.get(t)?.[round];
      if (p && picked.length < max) {
        picked.push(p);
        added = true;
      }
    }
    if (!added) break;
  }
  return picked.sort((a, b) => a.take_id.localeCompare(b.take_id) || a.start - b.start);
}

/** Output timeline: phrases back to back with GAP_SECONDS of silence between them. */
export function layoutSegments(selected: PhraseCandidate[]): GoldSegment[] {
  let t = 0;
  return selected.map((p, i) => {
    if (i > 0) t += GAP_SECONDS;
    const len = p.end - p.start;
    const seg = {
      phrase_id: p.id,
      take_id: p.take_id,
      source_file: p.source_file,
      source_start: p.start,
      source_end: p.end,
      output_start: round3(t),
      output_end: round3(t + len)
    };
    t += len;
    return seg;
  });
}

/** ffmpeg args: trim each phrase from its own take, separate with true silence, concat (no blending). */
export function assemblyArgs(
  inputs: Map<string, string>,
  segments: GoldSegment[],
  output: string
): string[] {
  const files = [...new Set(segments.map((s) => s.source_file))];
  const args: string[] = [];
  for (const f of files) {
    const path = inputs.get(f);
    if (!path) throw new Error('Missing input for ' + f);
    args.push('-i', path);
  }
  const parts: string[] = [];
  const labels: string[] = [];
  segments.forEach((s, i) => {
    const idx = files.indexOf(s.source_file);
    parts.push(
      '[' +
        idx +
        ':a]atrim=start=' +
        s.source_start +
        ':end=' +
        s.source_end +
        ',asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=mono,afade=t=in:d=0.01,afade=t=out:st=' +
        Math.max(0, round3(s.source_end - s.source_start - 0.015)) +
        ':d=0.015[s' +
        i +
        ']'
    );
    labels.push('[s' + i + ']');
    if (i < segments.length - 1) {
      parts.push('anullsrc=r=48000:cl=mono,atrim=duration=' + GAP_SECONDS + '[g' + i + ']');
      labels.push('[g' + i + ']');
    }
  });
  parts.push(labels.join('') + 'concat=n=' + labels.length + ':v=0:a=1[out]');
  args.push(
    '-filter_complex',
    parts.join(';'),
    '-map',
    '[out]',
    '-ar',
    '48000',
    '-c:a',
    'pcm_s24le',
    output
  );
  return args;
}
