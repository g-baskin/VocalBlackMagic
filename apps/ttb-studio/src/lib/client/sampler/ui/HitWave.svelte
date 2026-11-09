<script lang="ts">
  import { computePeaks, mixToMono } from '@vbm/ui/audio';
  import { observeCanvas, prefersReducedMotion } from '@vbm/ui/canvas';
  import { hitTicks } from '../launch';

  let {
    buffer,
    hit,
    bpm,
    rate,
    playing = null,
    clock = () => 0
  }: {
    buffer: AudioBuffer | null;
    /** Hit time in buffer seconds. */
    hit: number;
    bpm: number;
    /** Playback rate, so the ticks show played time. */
    rate: number;
    /** Context times of the last trigger, for the playhead. */
    playing?: { startAt: number; rate: number } | null;
    clock?: () => number;
  } = $props();

  let canvas: HTMLCanvasElement;
  let peaks: { min: Float32Array; max: Float32Array } | null = null;
  let peaksFor: AudioBuffer | null = null;
  let peaksWidth = 0;
  let redraw = () => {};

  function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    const top = 22;
    const mid = top + (h - top) / 2;
    const half = (h - top) / 2 - 6;
    if (!buffer) {
      ctx.fillStyle = 'rgb(169 159 194 / 70%)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const long = 'Choose a sound in the browser and send it to this pad.';
      ctx.fillText(
        ctx.measureText(long).width < w - 24 ? long : 'Send a sound to this pad.',
        w / 2,
        mid
      );
      return;
    }
    const duration = buffer.duration;
    const x = (t: number) => (t / duration) * w;
    const hx = x(hit);
    const buckets = Math.max(32, Math.floor(w / 2));
    if (peaksFor !== buffer || peaksWidth !== buckets) {
      peaks = computePeaks(mixToMono(buffer), buckets);
      peaksFor = buffer;
      peaksWidth = buckets;
    }
    // Beat lines (faint) and bar lines (labelled) counting back from the hit.
    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (const tick of hitTicks(hit, bpm, rate)) {
      const tx = x(tick.at);
      ctx.strokeStyle = tick.bar ? 'rgb(255 255 255 / 16%)' : 'rgb(255 255 255 / 5%)';
      ctx.beginPath();
      ctx.moveTo(tx, top);
      ctx.lineTo(tx, h);
      ctx.stroke();
      if (tick.bar) {
        ctx.fillStyle = 'rgb(236 230 247 / 75%)';
        ctx.fillText(String(tick.bar), tx, 13);
      }
    }
    const f = Math.min(0.999, Math.max(0.001, hit / duration));
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#2c2d6e');
    g.addColorStop(f * 0.55, '#6f5cff');
    g.addColorStop(f * 0.85, '#ff4fa3');
    g.addColorStop(f * 0.98, '#ffd9a0');
    g.addColorStop(f, '#ffffff');
    g.addColorStop(Math.min(1, f + 0.02), '#ffb15a');
    g.addColorStop(1, '#e8361c');
    ctx.fillStyle = g;
    ctx.beginPath();
    const p = peaks!;
    const step = w / p.max.length;
    for (let i = 0; i < p.max.length; i++)
      ctx.lineTo(i * step, mid - Math.max(0.004, p.max[i]) * half);
    for (let i = p.min.length - 1; i >= 0; i--)
      ctx.lineTo(i * step, mid - Math.min(-0.004, p.min[i]) * half);
    ctx.closePath();
    ctx.fill();
    // The hit line with a soft glow.
    const glow = ctx.createLinearGradient(hx - 40, 0, hx + 40, 0);
    glow.addColorStop(0, 'rgb(255 220 170 / 0%)');
    glow.addColorStop(0.5, 'rgb(255 220 170 / 30%)');
    glow.addColorStop(1, 'rgb(255 220 170 / 0%)');
    ctx.fillStyle = glow;
    ctx.fillRect(hx - 40, top, 80, h - top);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, top - 6);
    ctx.lineTo(hx, h);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = hx > w - 30 ? 'right' : 'left';
    ctx.fillText('HIT', hx + (hx > w - 30 ? -6 : 6), 13);
    if (playing) {
      const pos = (clock() - playing.startAt) * playing.rate;
      if (pos >= 0 && pos <= duration) {
        ctx.strokeStyle = 'rgb(63 240 210 / 85%)';
        ctx.beginPath();
        ctx.moveTo(x(pos), top);
        ctx.lineTo(x(pos), h);
        ctx.stroke();
      }
    }
  }

  $effect(() => {
    let last: CanvasRenderingContext2D | null = null;
    let lw = 0;
    let lh = 0;
    const stop = observeCanvas(canvas, (ctx, w, h) => {
      last = ctx;
      lw = w;
      lh = h;
      draw(ctx, w, h);
    });
    redraw = () => {
      if (last) draw(last, lw, lh);
    };
    return () => {
      stop();
      redraw = () => {};
    };
  });

  $effect(() => {
    // Redraw whenever an input changes.
    void [buffer, hit, bpm, rate];
    redraw();
  });

  $effect(() => {
    if (!playing || !buffer || prefersReducedMotion()) return;
    const until = playing.startAt + buffer.duration / playing.rate + 0.1;
    let raf = 0;
    const frame = () => {
      redraw();
      if (clock() < until) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<canvas bind:this={canvas} class="wave" aria-hidden="true"></canvas>

<style>
  .wave {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 180px;
  }
</style>
