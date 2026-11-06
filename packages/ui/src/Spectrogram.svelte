<script lang="ts">
  import { computeSpectrogram, mixToMono } from './audio';
  import { arcaneColor, observeCanvas } from './canvas';
  import EmptyState from './EmptyState.svelte';

  let { buffer, height = 200 }: { buffer: AudioBuffer | null; height?: number } = $props();

  const MIN_HZ = 40;
  const ROWS = 160;
  const FLOOR_DB = -100;
  let canvas: HTMLCanvasElement | undefined = $state();

  /** Renders the STFT once per buffer into an offscreen image (time × log-frequency). */
  const image = $derived.by(() => {
    if (!buffer || typeof document === 'undefined') return null;
    const samples = mixToMono(buffer);
    const fftSize = 2048;
    const hop = Math.max(256, Math.ceil((samples.length - fftSize) / 1200));
    const { frames, binHz } = computeSpectrogram(samples, buffer.sampleRate, { fftSize, hop });
    if (frames.length === 0) return null;
    const maxHz = Math.min(buffer.sampleRate / 2, 16000);
    let peak = FLOOR_DB;
    for (const f of frames) for (const v of f) if (v > peak) peak = v;
    const off = document.createElement('canvas');
    off.width = frames.length;
    off.height = ROWS;
    const octx = off.getContext('2d');
    if (!octx) return null;
    const img = octx.createImageData(frames.length, ROWS);
    const range = Math.max(1, peak - FLOOR_DB);
    for (let row = 0; row < ROWS; row++) {
      const t0 = (ROWS - 1 - row) / ROWS;
      const t1 = (ROWS - row) / ROWS;
      const b0 = Math.max(1, Math.floor((MIN_HZ * (maxHz / MIN_HZ) ** t0) / binHz));
      const b1 = Math.max(b0 + 1, Math.ceil((MIN_HZ * (maxHz / MIN_HZ) ** t1) / binHz));
      for (let x = 0; x < frames.length; x++) {
        const f = frames[x];
        let m = FLOOR_DB;
        for (let b = b0; b < b1 && b < f.length; b++) if (f[b] > m) m = f[b];
        const [r, g, bl] = arcaneColor((m - FLOOR_DB) / range);
        const i = (row * frames.length + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = bl;
        img.data[i + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    return { off, maxHz };
  });

  const TICKS = [100, 250, 500, 1000, 2000, 4000, 8000, 16000];

  $effect(() => {
    if (!canvas) return;
    const data = image;
    return observeCanvas(canvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (!data) return;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(data.off, 0, 0, w, h);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      for (const hz of TICKS) {
        if (hz > data.maxHz) continue;
        const y = h - (Math.log(hz / MIN_HZ) / Math.log(data.maxHz / MIN_HZ)) * h;
        ctx.fillStyle = 'rgba(236,230,247,0.18)';
        ctx.fillRect(0, y, w, 1);
        ctx.fillStyle = 'rgba(5,4,10,0.7)';
        ctx.fillRect(2, y - 7, 34, 14);
        ctx.fillStyle = '#ece6f7';
        ctx.fillText(hz >= 1000 ? `${hz / 1000}k` : `${hz}`, 5, y);
      }
    });
  });
</script>

<div
  class="spec"
  role="img"
  aria-label={buffer
    ? 'Spectrogram: time left to right, log frequency bottom to top, brightness is energy'
    : 'Spectrogram: no audio'}
  style:height="{height}px"
>
  <canvas bind:this={canvas}></canvas>
  {#if !buffer}<EmptyState />{/if}
</div>

<style>
  .spec {
    position: relative;
    width: 100%;
    background: var(--vbm-void);
    clip-path: polygon(
      0 0,
      calc(100% - 10px) 0,
      100% 10px,
      100% 100%,
      10px 100%,
      0 calc(100% - 10px)
    );
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
