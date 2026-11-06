<script lang="ts">
  import { detectPitch, hzToMidi, hzToNote, mixToMono } from './audio';
  import { observeCanvas } from './canvas';
  import EmptyState from './EmptyState.svelte';

  let { buffer, height = 200 }: { buffer: AudioBuffer | null; height?: number } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();

  const track = $derived.by(() => {
    if (!buffer) return null;
    let samples = mixToMono(buffer);
    let rate = buffer.sampleRate;
    // Halve high sample rates (2-tap average low-pass) to keep YIN fast on long takes.
    if (rate > 32000) {
      const half = new Float32Array(Math.floor(samples.length / 2));
      for (let i = 0; i < half.length; i++) half[i] = (samples[2 * i] + samples[2 * i + 1]) / 2;
      samples = half;
      rate /= 2;
    }
    const frame = 1024;
    const hop = Math.max(128, Math.ceil((samples.length - frame) / 1500));
    const { times, hz } = detectPitch(samples, rate, { frame, hop, minHz: 60, maxHz: 1000 });
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of hz) {
      if (v <= 0) continue;
      const m = hzToMidi(v);
      if (m < lo) lo = m;
      if (m > hi) hi = m;
    }
    const voiced = lo !== Infinity;
    const minMidi = voiced ? Math.floor(lo) - 2 : 48;
    const maxMidi = voiced ? Math.ceil(hi) + 2 : 72;
    return { times, hz, voiced, minMidi, maxMidi: Math.max(maxMidi, minMidi + 6) };
  });

  $effect(() => {
    if (!canvas) return;
    const data = track;
    const dur = buffer?.duration ?? 0;
    return observeCanvas(canvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (!data || dur <= 0) return;
      const gutter = 38;
      const span = data.maxMidi - data.minMidi;
      const yOf = (midi: number) => h - ((midi - data.minMidi) / span) * h;
      const labelEvery = span > 24 ? 12 : span > 12 ? 2 : 1;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      for (let m = Math.ceil(data.minMidi); m <= data.maxMidi; m++) {
        const y = yOf(m);
        const isC = m % 12 === 0;
        ctx.fillStyle = isC ? 'rgba(167,116,255,0.22)' : 'rgba(167,116,255,0.07)';
        ctx.fillRect(gutter, y, w - gutter, 1);
        if (m % labelEvery === 0 || isC) {
          ctx.fillStyle = isC ? '#ece6f7' : '#a99fc2';
          ctx.fillText(hzToNote(440 * 2 ** ((m - 69) / 12)), 4, y);
        }
      }
      ctx.save();
      ctx.strokeStyle = '#3ff0d2';
      ctx.shadowColor = '#3ff0d2';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < data.hz.length; i++) {
        const v = data.hz[i];
        if (v <= 0) {
          pen = false; // unvoiced: leave a gap
          continue;
        }
        const x = gutter + (data.times[i] / dur) * (w - gutter);
        const y = yOf(hzToMidi(v));
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
      ctx.restore();
    });
  });
</script>

<div
  class="pitch"
  role="img"
  aria-label={!buffer
    ? 'Pitch trace: no audio'
    : track?.voiced
      ? `Pitch trace from ${hzToNote(440 * 2 ** ((track.minMidi + 2 - 69) / 12))} to ${hzToNote(440 * 2 ** ((track.maxMidi - 2 - 69) / 12))}`
      : 'Pitch trace: no voiced pitch detected'}
  style:height="{height}px"
>
  <canvas bind:this={canvas}></canvas>
  {#if !buffer}
    <EmptyState />
  {:else if track && !track.voiced}
    <EmptyState message="no voiced pitch found" />
  {/if}
</div>

<style>
  .pitch {
    position: relative;
    width: 100%;
    background: var(--vbm-void);
    clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px);
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
