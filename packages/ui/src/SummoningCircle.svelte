<script lang="ts">
  import { getMediaGraph, type MediaGraph } from './audio-graph';
  import { prefersReducedMotion } from './canvas';

  let { audio, size = 220 }: { audio: HTMLAudioElement | null; size?: number } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let playing = $state(false);

  $effect(() => {
    const el = audio;
    const cv = canvas;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(size * dpr);
    cv.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduced = prefersReducedMotion();
    let graph: MediaGraph | null = null;
    let bins: Uint8Array<ArrayBuffer> | null = null;
    let raf = 0;
    let rot = 0;
    const c = size / 2;
    const inner = size * 0.22;
    const outer = size * 0.46;

    const drawFrame = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(167,116,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c, c, inner, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(c, c, outer, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // hexagram
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(rot);
      ctx.strokeStyle = 'rgba(255,138,61,0.45)';
      for (const off of [0, Math.PI]) {
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = off + (k * Math.PI * 2) / 3 - Math.PI / 2;
          ctx.lineTo(Math.cos(a) * inner * 0.92, Math.sin(a) * inner * 0.92);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
      if (!graph || !bins || !playing) return;
      graph.analyser.getByteFrequencyData(bins);
      const n = 96;
      const used = Math.floor(bins.length * 0.7);
      let energy = 0;
      for (let i = 0; i < n; i++) {
        // log-spaced bins
        const idx = Math.min(used - 1, Math.floor(Math.pow(used, i / n)));
        const v = bins[idx] / 255;
        energy += v;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r1 = inner + 4;
        const r2 = r1 + v * (outer - inner);
        const hue = i / n;
        ctx.strokeStyle =
          hue < 0.5 ? `rgba(167,116,255,${0.4 + v})` : `rgba(63,240,210,${0.4 + v})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
        ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(c, c, 0, c, c, inner);
      g.addColorStop(0, `rgba(255,138,61,${Math.min(0.8, (energy / n) * 1.6)})`);
      g.addColorStop(1, 'rgba(255,138,61,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c, c, inner, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      if (!reduced) rot += 0.004;
      drawFrame();
      if (playing) raf = requestAnimationFrame(loop);
    };

    const onPlay = () => {
      try {
        graph = graph ?? getMediaGraph(el!);
      } catch {
        graph = null; // e.g. cross-origin media without CORS
      }
      if (graph) {
        bins = new Uint8Array(graph.analyser.frequencyBinCount);
        if (graph.ctx.state === 'suspended') void graph.ctx.resume();
      }
      playing = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      playing = false;
      cancelAnimationFrame(raf);
      drawFrame();
    };

    drawFrame();
    if (!el) return;
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onPause);
    if (!el.paused) onPlay();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onPause);
    };
  });
</script>

<div
  class="circle"
  role="img"
  aria-label={playing ? 'Live spectrum of the playing audio' : 'Live spectrum idle — audio paused'}
  style:width="{size}px"
  style:height="{size}px"
  class:playing
>
  <canvas bind:this={canvas} style:width="{size}px" style:height="{size}px"></canvas>
  {#if !playing}<span class="idle" aria-hidden="true">dormant</span>{/if}
</div>

<style>
  .circle {
    position: relative;
    flex: none;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(91 43 196 / 18%), transparent 70%);
  }
  canvas {
    display: block;
  }
  .idle {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--vbm-font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--vbm-faint);
  }
</style>
