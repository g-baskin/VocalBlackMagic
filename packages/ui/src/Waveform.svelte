<script lang="ts">
  import { computePeaks, formatTime, mixToMono } from './audio';
  import { GLOW, observeCanvas, type GlowName } from './canvas';
  import EmptyState from './EmptyState.svelte';

  let {
    buffer,
    currentTime = 0,
    duration,
    onseek,
    height = 120,
    color = 'violet',
    compareBuffer = null,
    regions = [],
    label = 'Waveform'
  }: {
    buffer: AudioBuffer | null;
    currentTime?: number;
    duration?: number;
    onseek?: (seconds: number) => void;
    height?: number;
    color?: GlowName;
    compareBuffer?: AudioBuffer | null;
    regions?: { start: number; end: number; label?: string }[];
    label?: string;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  const mono = $derived(buffer ? mixToMono(buffer) : null);
  const ghost = $derived(compareBuffer ? mixToMono(compareBuffer) : null);
  const total = $derived(
    duration && Number.isFinite(duration) && duration > 0 ? duration : (buffer?.duration ?? 0)
  );
  const progress = $derived(total > 0 ? Math.min(1, Math.max(0, currentTime / total)) : 0);
  const regionLabels = $derived(
    total > 0
      ? regions.map((r) => ({
          left: (Math.max(0, r.start) / total) * 100,
          width: ((Math.min(total, r.end) - Math.max(0, r.start)) / total) * 100,
          label: r.label
        }))
      : []
  );

  function drawPeaks(
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    w: number,
    h: number,
    cols: number,
    seconds: number
  ) {
    const span = seconds > 0 && total > 0 ? Math.min(1, seconds / total) : 1;
    const n = Math.max(1, Math.floor(cols * span));
    const { min, max } = computePeaks(data, n);
    const step = (w * span) / n;
    const mid = h / 2;
    for (let i = 0; i < n; i++) {
      const top = mid - Math.max(0.004, max[i]) * mid * 0.92;
      const bottom = mid - Math.min(-0.004, min[i]) * mid * 0.92;
      ctx.fillRect(i * step, top, Math.max(1, step - 1), bottom - top);
    }
  }

  $effect(() => {
    if (!canvas) return;
    const data = mono;
    const ghostData = ghost;
    const p = progress;
    const c = GLOW[color];
    const regs = regions;
    const t = total;
    return observeCanvas(canvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,79,139,0.12)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      if (!data) return;
      for (const r of regs) {
        if (t <= 0) break;
        const x0 = (Math.max(0, r.start) / t) * w;
        const x1 = (Math.min(t, r.end) / t) * w;
        ctx.fillStyle = 'rgba(255,138,61,0.12)';
        ctx.fillRect(x0, 0, x1 - x0, h);
        ctx.fillStyle = 'rgba(255,138,61,0.7)';
        ctx.fillRect(x0, 0, 1, h);
        ctx.fillRect(x1 - 1, 0, 1, h);
      }
      const cols = Math.floor(w / 3);
      if (ghostData && compareBuffer) {
        ctx.fillStyle = 'rgba(236,230,247,0.16)';
        drawPeaks(ctx, ghostData, w, h, cols, compareBuffer.duration);
      }
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, c.main);
      grad.addColorStop(0.5, c.deep);
      grad.addColorStop(1, c.main);
      ctx.save();
      ctx.shadowColor = c.main;
      ctx.shadowBlur = 8;
      ctx.fillStyle = `rgba(${c.rgb},0.38)`;
      drawPeaks(ctx, data, w, h, cols, buffer?.duration ?? 0);
      ctx.beginPath();
      ctx.rect(0, 0, w * p, h);
      ctx.clip();
      ctx.fillStyle = grad;
      drawPeaks(ctx, data, w, h, cols, buffer?.duration ?? 0);
      ctx.restore();
      if (p > 0) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = c.main;
        ctx.shadowBlur = 12;
        ctx.fillRect(w * p - 1, 0, 2, h);
        ctx.shadowBlur = 0;
      }
    });
  });

  function seekFromPointer(e: PointerEvent) {
    if (!onseek || !buffer || total <= 0 || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    onseek(Math.min(total, Math.max(0, ((e.clientX - rect.left) / rect.width) * total)));
  }

  function onkeydown(e: KeyboardEvent) {
    if (!onseek || total <= 0) return;
    const step = e.shiftKey ? 10 : 5;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = currentTime + step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = currentTime - step;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = total;
    if (next === null) return;
    e.preventDefault();
    onseek(Math.min(total, Math.max(0, next)));
  }
</script>

<div class="wave" style:height="{height}px">
  {#if buffer && onseek}
    <div
      class="hit"
      role="slider"
      tabindex="0"
      aria-label="{label} — seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext="{formatTime(currentTime)} of {formatTime(total)}"
      onpointerdown={seekFromPointer}
      {onkeydown}
    ></div>
  {/if}
  <canvas bind:this={canvas}></canvas>
  {#each regionLabels as r, i (i)}
    {#if r.label}
      <span class="region" style:left="{r.left}%" style:max-width="{Math.max(r.width, 8)}%"
        >{r.label}</span
      >
    {/if}
  {/each}
  <span class="vbm-sr-only">{buffer ? `${label}, ${formatTime(total)}` : `${label}: no audio`}</span
  >
  {#if !buffer}<EmptyState />{/if}
</div>

<style>
  .wave {
    position: relative;
    width: 100%;
    background:
      linear-gradient(90deg, rgb(255 79 139 / 5%) 1px, transparent 1px) 0 0 / 40px 100%,
      var(--vbm-void);
    border-radius: var(--vbm-radius-sm);
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .hit {
    position: absolute;
    inset: 0;
    z-index: 2;
    cursor: pointer;
  }
  .hit:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--vbm-teal);
  }
  .region {
    position: absolute;
    top: 4px;
    padding: 0 0.3rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.62rem;
    color: var(--vbm-ember);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }
</style>
