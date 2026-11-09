<script lang="ts">
  import { tick as settle } from 'svelte';
  import { barTicks, padNoteName, ppq, stepTicks, type BeatNote } from '@vbm/contracts';
  import {
    drawNote,
    eraseAt,
    hitTest,
    moveNotes,
    notesInRect,
    removeNotes,
    resizeNotes,
    setVelocity,
    snapDelta,
    snapDown,
    snapOptions
  } from '../pianoroll';

  let {
    notes = $bindable(),
    ticks,
    colour,
    rootKey,
    channelName,
    playTick,
    resetKey,
    onbegin,
    onaudition
  }: {
    notes: BeatNote[];
    ticks: number;
    colour: string;
    rootKey: number;
    channelName: string;
    playTick: number | null;
    /** Changes when another channel or pattern is shown; clears the selection and recentres. */
    resetKey: string;
    onbegin: () => void;
    onaudition: (key: number, velocity: number) => void;
  } = $props();

  const keyH = 14;
  const keysW = 58;
  const rulerH = 22;
  const laneH = 64;
  const zooms = [12, 18, 24, 36, 48, 72];

  let tool = $state<'draw' | 'select' | 'erase'>('draw');
  let snap = $state(24);
  let stepPx = $state(24);
  let selected = $state<number[]>([]);
  let lastLength = $state(stepTicks);
  let lastVelocity = $state(100);
  let cursor = $state('crosshair');
  let rubber = $state<{ t0: number; t1: number; k0: number; k1: number } | null>(null);
  let scroller: HTMLDivElement;
  let lane: HTMLDivElement;
  let grid: SVGSVGElement;

  const px = $derived(stepPx / stepTicks);
  const width = $derived(ticks * px);
  const height = 128 * keyH;
  const keys = Array.from({ length: 128 }, (_, i) => 127 - i);
  const black = (k: number) => [1, 3, 6, 8, 10].includes(k % 12);
  const lines = $derived(
    Array.from({ length: ticks / stepTicks + 1 }, (_, i) => ({
      x: i * stepTicks * px,
      kind: (i * stepTicks) % barTicks === 0 ? 'bar' : (i * stepTicks) % ppq === 0 ? 'beat' : 'step'
    }))
  );
  const bars = $derived(Array.from({ length: Math.ceil(ticks / barTicks) }, (_, i) => i));
  const chosen = $derived(new Set(selected));

  $effect(() => {
    void resetKey;
    selected = [];
    void settle().then(() => {
      if (!scroller) return;
      // Short patterns zoom in to fill the window; long ones start at 100%.
      const room = scroller.clientWidth - keysW - 16;
      stepPx = [...zooms].reverse().find((z) => (ticks / stepTicks) * z <= room) ?? 24;
      if (stepPx < 24) stepPx = 24;
      const list = notes;
      const centre = list.length ? list.reduce((s, n) => s + n.key, 0) / list.length : rootKey;
      scroller.scrollTop = Math.max(0, (127 - centre) * keyH - scroller.clientHeight / 2);
    });
  });

  function point(e: PointerEvent | MouseEvent) {
    const r = grid.getBoundingClientRect();
    const tick = Math.min(ticks - 1, Math.max(0, (e.clientX - r.left) / px));
    const key = Math.min(127, Math.max(0, 127 - Math.floor((e.clientY - r.top) / keyH)));
    return { tick, key };
  }

  type Drag = {
    kind: 'move' | 'resize';
    origin: { tick: number; key: number };
    base: BeatNote[];
    indices: number[];
    lastKey: number;
  };
  let drag: Drag | null = null;
  let erasing = false;

  function down(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    grid.focus();
    grid.setPointerCapture(e.pointerId);
    const p = point(e);
    if (e.button === 2 || tool === 'erase') {
      onbegin();
      erasing = true;
      notes = eraseAt(notes, p.tick, p.key);
      selected = [];
      return;
    }
    const hit = hitTest(notes, p.tick, p.key, 6 / px);
    if (hit) {
      if (e.shiftKey)
        selected = chosen.has(hit.index)
          ? selected.filter((i) => i !== hit.index)
          : [...selected, hit.index];
      else if (!chosen.has(hit.index)) selected = [hit.index];
      const n = notes[hit.index];
      lastLength = n.length;
      lastVelocity = n.velocity;
      onbegin();
      drag = {
        kind: hit.part === 'end' ? 'resize' : 'move',
        origin: p,
        base: notes.slice(),
        indices: selected.includes(hit.index) ? selected.slice() : [hit.index],
        lastKey: n.key
      };
      if (hit.part === 'body') onaudition(n.key, n.velocity);
      return;
    }
    if (tool === 'draw') {
      onbegin();
      const drawn = drawNote(notes, snapDown(p.tick, snap), p.key, lastLength, lastVelocity, ticks);
      notes = drawn.notes;
      selected = [drawn.index];
      drag = {
        kind: 'move',
        origin: p,
        base: notes.slice(),
        indices: [drawn.index],
        lastKey: p.key
      };
      onaudition(p.key, lastVelocity);
      return;
    }
    if (!e.shiftKey) selected = [];
    rubber = { t0: p.tick, t1: p.tick, k0: p.key, k1: p.key };
  }

  function move(e: PointerEvent) {
    const p = point(e);
    if (erasing) {
      notes = eraseAt(notes, p.tick, p.key);
      return;
    }
    if (drag) {
      const dTick = snapDelta(p.tick - drag.origin.tick, snap);
      if (drag.kind === 'move') {
        notes = moveNotes(drag.base, drag.indices, dTick, p.key - drag.origin.key, ticks);
        const lead = notes[drag.indices[0]];
        if (lead && lead.key !== drag.lastKey) {
          drag.lastKey = lead.key;
          onaudition(lead.key, lead.velocity);
        }
      } else {
        notes = resizeNotes(drag.base, drag.indices, dTick, Math.min(snap, stepTicks), ticks);
        lastLength = notes[drag.indices[0]]?.length ?? lastLength;
      }
      return;
    }
    if (rubber) {
      rubber = { ...rubber, t1: p.tick, k1: p.key };
      selected = notesInRect(notes, rubber.t0, rubber.t1, rubber.k0, rubber.k1);
      return;
    }
    const hit = hitTest(notes, p.tick, p.key, 6 / px);
    cursor =
      tool === 'erase'
        ? 'not-allowed'
        : hit?.part === 'end'
          ? 'ew-resize'
          : hit
            ? 'move'
            : tool === 'draw'
              ? 'crosshair'
              : 'default';
  }

  function up() {
    drag = null;
    erasing = false;
    rubber = null;
  }

  function keydown(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.code === 'KeyA') {
      e.preventDefault();
      e.stopPropagation();
      selected = notes.map((_, i) => i);
      return;
    }
    if (e.key === 'Escape') {
      if (selected.length) e.stopPropagation();
      selected = [];
      return;
    }
    if (!selected.length || mod) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      onbegin();
      notes = removeNotes(notes, selected);
      selected = [];
      return;
    }
    const big = e.shiftKey;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-(big ? barTicks : snap), 0],
      ArrowRight: [big ? barTicks : snap, 0],
      ArrowUp: [0, big ? 12 : 1],
      ArrowDown: [0, big ? -12 : -1]
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    e.stopPropagation();
    onbegin();
    notes = moveNotes(notes, selected, m[0], m[1], ticks);
    if (m[1]) onaudition(notes[selected[0]].key, notes[selected[0]].velocity);
  }

  let laneDrag = false;
  function laneAt(e: PointerEvent) {
    const r = lane.querySelector('svg')!.getBoundingClientRect();
    const x = e.clientX - r.left - keysW;
    const v = Math.round(Math.min(127, Math.max(1, ((laneH - (e.clientY - r.top)) / laneH) * 127)));
    const near = notes.flatMap((n, i) => (Math.abs(n.start * px - x) <= 5 ? [i] : []));
    const pick = near.some((i) => chosen.has(i)) ? near.filter((i) => chosen.has(i)) : near;
    if (pick.length) notes = setVelocity(notes, pick, v);
  }
  function laneDown(e: PointerEvent) {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onbegin();
    laneDrag = true;
    laneAt(e);
  }

  const label = (k: number) => (k % 12 === 0 ? padNoteName(k) : '');
</script>

<section class="roll" aria-labelledby="roll-title" style:--c={colour}>
  <div class="head">
    <h2 id="roll-title">Piano roll <span>· {channelName}</span></h2>
    <div class="tools" role="group" aria-label="Tool">
      {#each [['draw', 'Draw'], ['select', 'Select'], ['erase', 'Erase']] as [t, name] (t)}
        <button
          class="tool"
          class:on={tool === t}
          aria-pressed={tool === t}
          onclick={() => (tool = t as typeof tool)}>{name}</button
        >
      {/each}
    </div>
    <label class="field"
      ><span>Snap</span>
      <select bind:value={snap}>
        {#each snapOptions as o (o.ticks)}<option value={o.ticks}>{o.label}</option>{/each}
      </select></label
    >
    <label class="field"
      ><span>Zoom</span>
      <select bind:value={stepPx}>
        {#each zooms as z (z)}<option value={z}>{Math.round((z / 24) * 100)}%</option>{/each}
      </select></label
    >
    <span class="count"
      >{notes.length}
      {notes.length === 1 ? 'note' : 'notes'}{selected.length
        ? ' · ' + selected.length + ' selected'
        : ''}</span
    >
  </div>

  <div
    class="scroller"
    bind:this={scroller}
    onscroll={() => (lane.scrollLeft = scroller.scrollLeft)}
  >
    <div
      class="canvas"
      style:grid-template-columns="{keysW}px {width}px"
      style:grid-template-rows="{rulerH}px {height}px"
    >
      <div class="corner"></div>
      <svg class="ruler" {width} height={rulerH} aria-hidden="true">
        {#each bars as b (b)}
          <line x1={b * barTicks * px} x2={b * barTicks * px} y1="0" y2={rulerH} />
          <text x={b * barTicks * px + 4} y="15">{b + 1}</text>
        {/each}
        {#if playTick !== null}
          <path d="M{playTick * px - 5} 0 h10 l-5 8z" class="ph" />
        {/if}
      </svg>
      <div class="keys" aria-hidden="true">
        {#each keys as k (k)}
          <!-- svelte-ignore a11y_no_static_element_interactions (mouse audition; the computer keys play notes) -->
          <div
            class="key"
            class:black={black(k)}
            class:root={k === rootKey}
            style:height={keyH + 'px'}
            onpointerdown={() => onaudition(k, 100)}
          >
            {label(k)}
          </div>
        {/each}
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (an application region with its own keyboard handling) -->
      <svg
        bind:this={grid}
        class="grid"
        {width}
        {height}
        tabindex="0"
        role="application"
        aria-label="Piano roll for {channelName}: {notes.length} notes. Draw with the pointer; arrow keys move the selection, Delete removes it, Ctrl or Cmd+A selects all."
        style:cursor
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={up}
        onkeydown={keydown}
        oncontextmenu={(e) => e.preventDefault()}
      >
        {#each keys as k, row (k)}
          <rect
            x="0"
            y={row * keyH}
            {width}
            height={keyH}
            class="lane"
            class:black={black(k)}
            class:c={k % 12 === 0}
          />
        {/each}
        {#each lines as l, i (i)}
          <line x1={l.x} x2={l.x} y1="0" y2={height} class={l.kind} />
        {/each}
        {#each notes as n, i (i)}
          <rect
            x={n.start * px}
            y={(127 - n.key) * keyH + 1}
            width={Math.max(3, n.length * px - 1)}
            height={keyH - 2}
            rx="2"
            class="note"
            class:sel={chosen.has(i)}
            style:opacity={0.45 + (0.55 * n.velocity) / 127}
          />
        {/each}
        {#if rubber}
          <rect
            x={Math.min(rubber.t0, rubber.t1) * px}
            y={(127 - Math.max(rubber.k0, rubber.k1)) * keyH}
            width={Math.abs(rubber.t1 - rubber.t0) * px}
            height={(Math.abs(rubber.k1 - rubber.k0) + 1) * keyH}
            class="rubber"
          />
        {/if}
        {#if playTick !== null}
          <line x1={playTick * px} x2={playTick * px} y1="0" y2={height} class="playhead" />
        {/if}
      </svg>
    </div>
  </div>

  <div class="lane-wrap" bind:this={lane}>
    <svg
      width={keysW + width}
      height={laneH}
      role="slider"
      tabindex="-1"
      aria-label="Velocity lane: drag a note's bar to set its velocity"
      aria-valuemin={1}
      aria-valuemax={127}
      aria-valuenow={selected.length ? notes[selected[0]]?.velocity : lastVelocity}
      onpointerdown={laneDown}
      onpointermove={(e) => laneDrag && laneAt(e)}
      onpointerup={() => (laneDrag = false)}
      onpointercancel={() => (laneDrag = false)}
    >
      <text x="6" y="14" class="lane-label">Velocity</text>
      {#each notes as n, i (i)}
        {@const h = (n.velocity / 127) * (laneH - 6)}
        <line
          x1={keysW + n.start * px + 1}
          x2={keysW + n.start * px + 1}
          y1={laneH}
          y2={laneH - h}
          class="stem"
          class:sel={chosen.has(i)}
        />
        <circle
          cx={keysW + n.start * px + 1}
          cy={laneH - h}
          r="3"
          class="stem-dot"
          class:sel={chosen.has(i)}
        />
      {/each}
    </svg>
  </div>
</section>

<svelte:window onpointerup={() => (laneDrag = false)} />

<style>
  .roll {
    display: grid;
    border: 1px solid var(--vbm-border);
    border-radius: 12px;
    background: var(--vbm-surface);
    min-width: 0;
    overflow: hidden;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    border-bottom: 1px solid var(--vbm-border);
    background: linear-gradient(180deg, var(--vbm-surface-3), var(--vbm-surface-2));
  }
  h2 {
    margin: 0 0.4rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
  }
  h2 span {
    color: var(--c);
  }
  .tools {
    display: flex;
    gap: 0.2rem;
  }
  .tool {
    min-height: 1.9rem;
    padding: 0 0.6rem;
    border: 1px solid var(--vbm-border);
    border-radius: 6px;
    background: var(--vbm-surface-2);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.76rem;
    cursor: pointer;
  }
  .tool.on {
    border-color: var(--c);
    color: var(--c);
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    color: var(--vbm-muted);
  }
  .field select {
    min-height: 1.9rem;
    padding: 0 0.3rem;
    border: 1px solid var(--vbm-border);
    border-radius: 6px;
    background: var(--vbm-bg);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.76rem;
  }
  .count {
    margin-left: auto;
    font-size: 0.72rem;
    color: var(--vbm-muted);
  }
  .scroller {
    height: min(52vh, 460px);
    overflow: auto;
    background: #1d1d23;
  }
  .canvas {
    display: grid;
    width: max-content;
  }
  .corner {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 3;
    background: var(--vbm-surface-2);
    border-bottom: 1px solid var(--vbm-border);
  }
  .ruler {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--vbm-surface-2);
    border-bottom: 1px solid var(--vbm-border);
  }
  .ruler line {
    stroke: var(--vbm-border-strong);
  }
  .ruler text {
    fill: var(--vbm-muted);
    font-size: 11px;
    font-family: var(--vbm-font-mono);
  }
  .ph {
    fill: var(--vbm-success);
  }
  .keys {
    position: sticky;
    left: 0;
    z-index: 2;
    display: grid;
    background: #e9e9ee;
    border-right: 1px solid #000;
  }
  .key {
    box-sizing: border-box;
    border-bottom: 1px solid #b8b8c0;
    font-size: 9px;
    line-height: 13px;
    text-align: right;
    padding-right: 4px;
    color: #333;
    cursor: pointer;
    user-select: none;
  }
  .key.black {
    background: linear-gradient(90deg, #1a1a1f 62%, #e9e9ee 62%);
    border-bottom-color: #1a1a1f;
  }
  .key.root {
    box-shadow: inset 4px 0 0 var(--c);
  }
  .grid {
    display: block;
    touch-action: none;
  }
  .grid:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: -2px;
  }
  .lane {
    fill: #2a2a31;
  }
  .lane.black {
    fill: #222228;
  }
  .lane.c {
    fill: #2e2e36;
  }
  line.step {
    stroke: #33333b;
  }
  line.beat {
    stroke: #43434d;
  }
  line.bar {
    stroke: #62626e;
  }
  .note {
    fill: var(--c);
    stroke: rgb(0 0 0 / 55%);
  }
  .note.sel {
    stroke: #fff;
    stroke-width: 1.5;
  }
  .rubber {
    fill: rgb(79 139 255 / 15%);
    stroke: var(--vbm-blue);
    stroke-dasharray: 4 3;
  }
  .playhead {
    stroke: var(--vbm-success);
    stroke-width: 1.5;
  }
  .lane-wrap {
    overflow: hidden;
    border-top: 1px solid var(--vbm-border);
    background: #18181d;
    touch-action: none;
  }
  .lane-wrap svg {
    display: block;
    cursor: ns-resize;
  }
  .lane-label {
    fill: var(--vbm-muted);
    font-size: 10px;
  }
  .stem {
    stroke: var(--c);
    stroke-width: 2;
  }
  .stem-dot {
    fill: var(--c);
  }
  .stem.sel,
  .stem-dot.sel {
    stroke: #fff;
  }
  button:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 1px;
  }
</style>
