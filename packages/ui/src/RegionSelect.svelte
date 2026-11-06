<script lang="ts">
  import Waveform from './Waveform.svelte';
  import { clampRegion, formatPrecise, nudge, timeAt } from './region';

  let {
    buffer,
    start = $bindable(0),
    end = $bindable(0),
    minLength = 1,
    maxLength = Infinity,
    height = 120,
    label = 'Section'
  }: {
    /** The REAL decoded audio; the waveform and the time scale come from it. */
    buffer: AudioBuffer | null;
    start?: number;
    end?: number;
    minLength?: number;
    maxLength?: number;
    height?: number;
    label?: string;
  } = $props();

  let surface: HTMLDivElement | undefined = $state();
  let drag: { mode: 'new' | 'start' | 'end'; anchor: number } | null = null;
  const total = $derived(buffer?.duration ?? 0);
  const left = $derived(total > 0 ? (start / total) * 100 : 0);
  const width = $derived(total > 0 ? ((end - start) / total) * 100 : 0);

  function set(next: { start: number; end: number }, moved: 'start' | 'end') {
    const r = clampRegion(next, total, minLength, maxLength, moved);
    start = r.start;
    end = r.end;
  }

  // Start with a sensible selection once the buffer is known, and re-clamp if limits change.
  $effect(() => {
    if (total <= 0) return;
    if (end <= start)
      set({ start: total * 0.25, end: total * 0.25 + Math.min(15, total / 4) }, 'end');
    else {
      const r = clampRegion({ start, end }, total, minLength, maxLength);
      if (r.start !== start || r.end !== end) set(r, 'end');
    }
  });

  function at(e: PointerEvent): number {
    const rect = surface!.getBoundingClientRect();
    return timeAt(e.clientX, rect.left, rect.width, total);
  }

  function down(e: PointerEvent) {
    if (!surface || total <= 0) return;
    const t = at(e);
    const handle = (e.target as HTMLElement).dataset.handle as 'start' | 'end' | undefined;
    drag = handle ? { mode: handle, anchor: t } : { mode: 'new', anchor: t };
    surface.setPointerCapture(e.pointerId);
    if (!handle) set({ start: t, end: t + minLength }, 'end');
    e.preventDefault();
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    const t = at(e);
    if (drag.mode === 'start') set({ start: t, end }, 'start');
    else if (drag.mode === 'end') set({ start, end: t }, 'end');
    else if (t >= drag.anchor) set({ start: drag.anchor, end: t }, 'end');
    else set({ start: t, end: drag.anchor }, 'start');
  }
  function up(e: PointerEvent) {
    drag = null;
    surface?.releasePointerCapture(e.pointerId);
  }

  function key(which: 'start' | 'end', e: KeyboardEvent) {
    const value = which === 'start' ? start : end;
    const next = nudge(e.key, e.shiftKey, value, total);
    if (next === null) return;
    e.preventDefault();
    set(which === 'start' ? { start: next, end } : { start, end: next }, which);
  }
</script>

<div class="region-select">
  <div
    class="surface"
    style:height="{height}px"
    bind:this={surface}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    role="presentation"
  >
    <Waveform {buffer} {height} label="{label} waveform" />
    {#if total > 0}
      <div class="shade" style:left="0" style:width="{left}%"></div>
      <div class="shade" style:left="{left + width}%" style:right="0"></div>
      <div class="sel" style:left="{left}%" style:width="{width}%"></div>
      <span
        class="handle"
        data-handle="start"
        style:left="{left}%"
        role="slider"
        tabindex="0"
        aria-label="{label} start"
        aria-valuemin={0}
        aria-valuemax={Math.round(end * 10) / 10}
        aria-valuenow={Math.round(start * 10) / 10}
        aria-valuetext={formatPrecise(start)}
        onkeydown={(e) => key('start', e)}
      ></span>
      <span
        class="handle"
        data-handle="end"
        style:left="{left + width}%"
        role="slider"
        tabindex="0"
        aria-label="{label} end"
        aria-valuemin={Math.round(start * 10) / 10}
        aria-valuemax={Math.round(total * 10) / 10}
        aria-valuenow={Math.round(end * 10) / 10}
        aria-valuetext={formatPrecise(end)}
        onkeydown={(e) => key('end', e)}
      ></span>
    {/if}
  </div>
  <p class="readout" aria-live="polite">
    {#if total > 0}
      <span>{formatPrecise(start)}</span> → <span>{formatPrecise(end)}</span>
      <em>({(end - start).toFixed(1)} s of {formatPrecise(total)})</em>
    {:else}
      Waiting for the decoded audio…
    {/if}
  </p>
  <p class="help">Drag across the waveform, or focus a handle: arrows 0.1 s, Shift+arrows 1 s.</p>
</div>

<style>
  .region-select {
    display: grid;
    gap: 0.35rem;
  }
  .surface {
    position: relative;
    touch-action: none;
    cursor: crosshair;
    user-select: none;
  }
  .shade {
    position: absolute;
    top: 0;
    bottom: 0;
    background: rgb(5 2 12 / 55%);
    pointer-events: none;
    z-index: 3;
  }
  .sel {
    position: absolute;
    top: 0;
    bottom: 0;
    border-top: 1px solid var(--vbm-ember);
    border-bottom: 1px solid var(--vbm-ember);
    background: rgb(255 140 70 / 10%);
    box-shadow: inset 0 0 18px rgb(255 140 70 / 25%);
    pointer-events: none;
    z-index: 3;
  }
  .handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 14px;
    margin-left: -7px;
    z-index: 4;
    cursor: ew-resize;
    background: linear-gradient(
      90deg,
      transparent 6px,
      var(--vbm-ember) 6px,
      var(--vbm-ember) 8px,
      transparent 8px
    );
  }
  .handle::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 50%;
    width: 10px;
    height: 22px;
    margin-top: -11px;
    border-radius: 3px;
    background: var(--vbm-ember);
    box-shadow: 0 0 10px var(--vbm-ember);
  }
  .handle:focus-visible {
    outline: 2px solid var(--vbm-teal);
    outline-offset: 1px;
  }
  .readout {
    margin: 0;
    font-family: var(--vbm-font-mono);
    font-size: 0.85rem;
    color: var(--vbm-ember);
  }
  .readout em {
    opacity: 0.7;
    font-style: normal;
  }
  .help {
    margin: 0;
    font-size: 0.78rem;
    opacity: 0.65;
    font-style: italic;
  }
</style>
