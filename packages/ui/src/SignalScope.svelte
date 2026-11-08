<script lang="ts">
  import { getMediaGraph, type MediaGraph } from './audio-graph';

  let { audio, enabled = true }: { audio: HTMLAudioElement | null; enabled?: boolean } = $props();
  let canvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    const el = audio;
    const cv = canvas;
    const visible = enabled;
    if (!cv || !el) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let graph: MediaGraph | null = null;
    let bins: Uint8Array<ArrayBuffer> | null = null;
    let frame = 0;
    let width = 1;
    let height = 1;
    let inView = true;
    let last = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const mid = height * 0.52;
      ctx.strokeStyle = '#526174';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();
      if (!visible || motion.matches || el.paused || !graph || !bins) return;
      graph.analyser.getByteFrequencyData(bins);
      const n = 100;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i <= n; i++) {
        const bin = Math.min(bins.length - 1, Math.floor(Math.pow(bins.length, i / n)));
        const amplitude = bins[bin] / 255;
        points.push({ x: (i / n) * width, y: amplitude * height * 0.42 });
      }
      const color = ctx.createLinearGradient(0, 0, width, 0);
      color.addColorStop(0, '#ff829e');
      color.addColorStop(0.45, '#b2adff');
      color.addColorStop(1, '#69d9ed');
      // One measured spectrum, reflected below its baseline. Not separate stereo channels.
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, mid);
        for (const p of points) ctx.lineTo(p.x, mid + side * p.y * (side === 1 ? 0.48 : 1));
        ctx.lineTo(width, mid);
        ctx.closePath();
        ctx.globalAlpha = side === -1 ? 0.16 : 0.06;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = side === -1 ? 2 : 1;
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const y = mid + side * p.y * (side === 1 ? 0.48 : 1);
          if (i === 0) ctx.moveTo(p.x, y);
          else ctx.lineTo(p.x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i += 2) {
        const p = points[i];
        ctx.beginPath();
        ctx.moveTo(p.x, mid - p.y);
        ctx.lineTo(p.x, mid + p.y * 0.48);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    const animate = (now: number) => {
      // Cap at 30 fps and stop work when this panel or the page is hidden.
      if (now - last >= 32) {
        draw();
        last = now;
      }
      frame = requestAnimationFrame(animate);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      if (!el.paused && visible && !motion.matches && !document.hidden && inView) {
        try {
          graph ??= getMediaGraph(el);
          if (graph && !bins) bins = new Uint8Array(graph.analyser.frequencyBinCount);
          if (graph?.ctx.state === 'suspended') void graph.ctx.resume().catch(() => undefined);
        } catch {
          graph = null;
        }
        if (graph) frame = requestAnimationFrame(animate);
      }
      draw();
    };
    const resize = new ResizeObserver(() => {
      const rect = cv.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(width * dpr);
      cv.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    resize.observe(cv);
    intersection.observe(cv);
    el.addEventListener('play', sync);
    el.addEventListener('pause', sync);
    el.addEventListener('ended', sync);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      el.removeEventListener('play', sync);
      el.removeEventListener('pause', sync);
      el.removeEventListener('ended', sync);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
