<script lang="ts">
  import {
    detectPitch,
    energyEnvelope,
    mixToMono,
    pitchClassHistogram,
    spectralCentroid
  } from './audio';
  import EmptyState from './EmptyState.svelte';

  let {
    buffer,
    size = 240,
    label = 'Voice sigil'
  }: { buffer: AudioBuffer | null; size?: number; label?: string } = $props();

  const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  let canvas: HTMLCanvasElement | undefined = $state();

  /** Real, deterministic analysis of the buffer. */
  const print = $derived.by(() => {
    if (!buffer) return null;
    let samples = mixToMono(buffer);
    let rate = buffer.sampleRate;
    if (rate > 32000) {
      const half = new Float32Array(Math.floor(samples.length / 2));
      for (let i = 0; i < half.length; i++) half[i] = (samples[2 * i] + samples[2 * i + 1]) / 2;
      samples = half;
      rate /= 2;
    }
    const hop = Math.max(256, Math.ceil(samples.length / 800));
    const { hz } = detectPitch(samples, rate, { frame: 1024, hop, minHz: 60, maxHz: 1000 });
    const hist = pitchClassHistogram(hz);
    const envelope = energyEnvelope(samples, 72);
    const centroid = spectralCentroid(samples, rate);
    let top = 0;
    for (let i = 1; i < 12; i++) if (hist[i] > hist[top]) top = i;
    return { hist, envelope, centroid, voiced: hist[top] > 0, top };
  });

  $effect(() => {
    const cv = canvas;
    const p = print;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(size * dpr);
    cv.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (!p) return;
    const c = size / 2;
    const rMax = size * 0.3;
    const ring = size * 0.36;
    const spoke = (i: number) => (i / 12) * Math.PI * 2 - Math.PI / 2;

    // energy envelope ring (outer, radial bars)
    ctx.strokeStyle = 'rgba(255,138,61,0.75)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < p.envelope.length; i++) {
      const a = (i / p.envelope.length) * Math.PI * 2 - Math.PI / 2;
      const len = 2 + p.envelope[i] * size * 0.1;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * ring, c + Math.sin(a) * ring);
      ctx.lineTo(c + Math.cos(a) * (ring + len), c + Math.sin(a) * (ring + len));
      ctx.stroke();
    }
    // spokes and note names
    ctx.font = `${Math.max(8, size * 0.042)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const a = spoke(i);
      ctx.strokeStyle = 'rgba(167,116,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a) * rMax, c + Math.sin(a) * rMax);
      ctx.stroke();
      ctx.fillStyle = p.voiced && i === p.top ? '#3ff0d2' : '#a99fc2';
      const lr = size * 0.47;
      ctx.fillText(NOTES[i], c + Math.cos(a) * lr, c + Math.sin(a) * lr);
    }
    // pitch-class polygon (normalised to the strongest class)
    if (p.voiced) {
      const peak = p.hist[p.top];
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const r = rMax * (0.08 + 0.92 * (p.hist[i] / peak));
        const a = spoke(i);
        ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(167,116,255,0.22)';
      ctx.strokeStyle = '#a774ff';
      ctx.shadowColor = '#a774ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.6;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // spectral centroid glyph: brighter voices get a wider inner hexagram
    const t = p.centroid > 0 ? Math.min(1, Math.log2(p.centroid / 100) / Math.log2(80)) : 0;
    const gr = size * (0.04 + 0.1 * Math.max(0, t));
    ctx.strokeStyle = '#3ff0d2';
    ctx.lineWidth = 1.2;
    for (const off of [0, Math.PI]) {
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = off + (k * Math.PI * 2) / 3 - Math.PI / 2;
        ctx.lineTo(c + Math.cos(a) * gr, c + Math.sin(a) * gr);
      }
      ctx.closePath();
      ctx.stroke();
    }
  });

  const description = $derived(
    !print
      ? `${label}: no audio`
      : `${label}: ${print.voiced ? `strongest pitch class ${NOTES[print.top]}` : 'no voiced pitch'}, spectral centroid ${Math.round(print.centroid)} Hz`
  );
</script>

<figure class="sigil" style:width="{size}px">
  <div
    class="disc"
    style:width="{size}px"
    style:height="{size}px"
    role="img"
    aria-label={description}
  >
    <canvas bind:this={canvas} style:width="{size}px" style:height="{size}px"></canvas>
    {#if !buffer}<EmptyState message="no voice" />{/if}
  </div>
  {#if print}
    <figcaption>
      <span>{print.voiced ? NOTES[print.top] : '—'}</span>
      <span>{Math.round(print.centroid)} Hz</span>
    </figcaption>
  {/if}
</figure>

<style>
  .sigil {
    margin: 0;
    display: grid;
    justify-items: center;
    gap: 0.4rem;
    max-width: 100%;
  }
  .disc {
    position: relative;
    max-width: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(91 43 196 / 20%), transparent 70%);
  }
  canvas {
    display: block;
    max-width: 100%;
  }
  figcaption {
    display: flex;
    gap: 1rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.15em;
    color: var(--vbm-muted);
  }
</style>
