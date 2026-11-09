<script lang="ts">
  import {
    beatLimits,
    channelColours,
    ppq,
    type BeatPattern,
    type PlaylistClip
  } from '@vbm/contracts';

  let {
    clips = $bindable(),
    patternId = $bindable(),
    patterns,
    playTick,
    onbegin
  }: {
    clips: PlaylistClip[];
    patternId: string;
    patterns: BeatPattern[];
    /** Song position in ticks while the song plays, else null. */
    playTick: number | null;
    onbegin: () => void;
  } = $props();

  const trackH = 30;
  const labelW = 74;
  const rulerH = 20;
  const zooms = [20, 32, 48, 72];
  const maxBars = beatLimits.maxStartBeat / 4;

  let tool = $state<'draw' | 'erase'>('draw');
  let snapBeats = $state(4);
  let barPx = $state(32);
  let selected = $state<number | null>(null);
  let grid: SVGSVGElement;

  const byId = $derived(new Map(patterns.map((p) => [p.id, p])));
  const colourOf = (id: string) =>
    channelColours[
      Math.max(
        0,
        patterns.findIndex((p) => p.id === id)
      ) % channelColours.length
    ];
  const beatsOf = (p: BeatPattern | undefined) => (p ? p.steps / 4 : 4);
  const songBars = $derived(
    clips.reduce((n, c) => Math.max(n, (c.start_beat + beatsOf(byId.get(c.pattern_id))) / 4), 0)
  );
  const bars = $derived(Math.min(maxBars, Math.max(32, Math.ceil(songBars) + 8)));
  const width = $derived(bars * barPx);
  const height = beatLimits.tracks * trackH;
  const beatPx = $derived(barPx / 4);

  function point(e: PointerEvent) {
    const r = grid.getBoundingClientRect();
    const beat = Math.max(0, (e.clientX - r.left) / beatPx);
    const track = Math.min(
      beatLimits.tracks - 1,
      Math.max(0, Math.floor((e.clientY - r.top) / trackH))
    );
    return { beat, track };
  }
  function clipAt(beat: number, track: number): number | null {
    for (let i = clips.length - 1; i >= 0; i--) {
      const c = clips[i];
      if (
        c.track === track &&
        beat >= c.start_beat &&
        beat < c.start_beat + beatsOf(byId.get(c.pattern_id))
      )
        return i;
    }
    return null;
  }
  // Clip labels are cut to the clip width (about 6.5 px a character).
  const fit = (name: string, w: number) => {
    const room = Math.floor((w - 8) / 6.5);
    return room >= name.length ? name : room > 1 ? name.slice(0, room - 1) + '…' : '';
  };
  const snap = (beat: number) => Math.floor(beat / snapBeats) * snapBeats;
  const clampStart = (beat: number) => Math.min(beatLimits.maxStartBeat, Math.max(0, beat));

  let drag: {
    index: number;
    origin: { beat: number; track: number };
    start: number;
    track: number;
  } | null = null;
  let erasing = false;

  function remove(index: number) {
    clips = clips.filter((_, i) => i !== index);
    selected = null;
  }

  function down(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    grid.focus({ preventScroll: true });
    grid.setPointerCapture(e.pointerId);
    const p = point(e);
    const hit = clipAt(p.beat, p.track);
    if (e.button === 2 || tool === 'erase') {
      erasing = true;
      if (hit !== null) {
        onbegin();
        remove(hit);
      }
      return;
    }
    onbegin();
    if (hit !== null) {
      selected = hit;
      patternId = clips[hit].pattern_id;
      drag = { index: hit, origin: p, start: clips[hit].start_beat, track: clips[hit].track };
      return;
    }
    if (clips.length >= beatLimits.clips || !byId.has(patternId)) return;
    const clip = { pattern_id: patternId, track: p.track, start_beat: clampStart(snap(p.beat)) };
    clips = [...clips, clip];
    selected = clips.length - 1;
    drag = { index: selected, origin: p, start: clip.start_beat, track: clip.track };
  }
  function move(e: PointerEvent) {
    const p = point(e);
    if (erasing) {
      const hit = clipAt(p.beat, p.track);
      if (hit !== null) {
        onbegin();
        remove(hit);
      }
      return;
    }
    if (!drag) return;
    const shift = Math.round((p.beat - drag.origin.beat) / snapBeats) * snapBeats;
    const start = clampStart(drag.start + shift);
    const track = Math.min(
      beatLimits.tracks - 1,
      Math.max(0, drag.track + p.track - drag.origin.track)
    );
    const c = clips[drag.index];
    if (c && (c.start_beat !== start || c.track !== track))
      clips = clips.map((x, i) => (i === drag!.index ? { ...x, start_beat: start, track } : x));
  }
  function up() {
    drag = null;
    erasing = false;
  }
  function keydown(e: KeyboardEvent) {
    if (selected === null || !clips[selected] || e.metaKey || e.ctrlKey) return;
    const c = clips[selected];
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      onbegin();
      remove(selected);
      return;
    }
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-snapBeats, 0],
      ArrowRight: [snapBeats, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    e.stopPropagation();
    onbegin();
    const next = {
      ...c,
      start_beat: clampStart(c.start_beat + m[0]),
      track: Math.min(beatLimits.tracks - 1, Math.max(0, c.track + m[1]))
    };
    clips = clips.map((x, i) => (i === selected ? next : x));
  }
</script>

<section class="playlist" aria-labelledby="playlist-title">
  <div class="head">
    <h2 id="playlist-title">Playlist</h2>
    <div class="tools" role="group" aria-label="Tool">
      <button
        class="tool"
        class:on={tool === 'draw'}
        aria-pressed={tool === 'draw'}
        onclick={() => (tool = 'draw')}>Place</button
      >
      <button
        class="tool"
        class:on={tool === 'erase'}
        aria-pressed={tool === 'erase'}
        onclick={() => (tool = 'erase')}>Erase</button
      >
    </div>
    <label class="field"
      ><span>Snap</span>
      <select bind:value={snapBeats}>
        <option value={4}>Bar</option>
        <option value={1}>Beat</option>
      </select></label
    >
    <label class="field"
      ><span>Zoom</span>
      <select bind:value={barPx}>
        {#each zooms as z (z)}<option value={z}>{Math.round((z / 32) * 100)}%</option>{/each}
      </select></label
    >
    <span class="count"
      >{clips.length}
      {clips.length === 1 ? 'clip' : 'clips'} · {Math.ceil(songBars)}
      {Math.ceil(songBars) === 1 ? 'bar' : 'bars'}</span
    >
  </div>
  <div class="scroller">
    <div
      class="canvas"
      style:grid-template-columns="{labelW}px {width}px"
      style:grid-template-rows="{rulerH}px {height}px"
    >
      <div class="corner"></div>
      <svg class="ruler" {width} height={rulerH} aria-hidden="true">
        {#each Array.from({ length: bars }, (_, i) => i) as b (b)}
          <line x1={b * barPx} x2={b * barPx} y1={b % 4 === 0 ? 0 : 10} y2={rulerH} />
          {#if b % 4 === 0 || barPx >= 48}<text x={b * barPx + 3} y="13">{b + 1}</text>{/if}
        {/each}
        {#if playTick !== null}
          <path d="M{(playTick / ppq) * beatPx - 5} 0 h10 l-5 8z" class="ph" />
        {/if}
      </svg>
      <div class="labels" aria-hidden="true">
        {#each Array.from({ length: beatLimits.tracks }, (_, i) => i) as t (t)}
          <div class="label" style:height={trackH + 'px'}>Track {t + 1}</div>
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
        aria-label="Playlist: {clips.length} clips. Click to place the current pattern, drag to move, right-click to erase; arrow keys move the selected clip and Delete removes it."
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={up}
        onkeydown={keydown}
        oncontextmenu={(e) => e.preventDefault()}
      >
        {#each Array.from({ length: beatLimits.tracks }, (_, i) => i) as t (t)}
          <rect
            x="0"
            y={t * trackH}
            {width}
            height={trackH}
            class="track"
            class:odd={t % 2 === 1}
          />
        {/each}
        {#each Array.from({ length: bars + 1 }, (_, i) => i) as b (b)}
          <line x1={b * barPx} x2={b * barPx} y1="0" y2={height} class:four={b % 4 === 0} />
        {/each}
        {#each clips as c, i (i)}
          {@const p = byId.get(c.pattern_id)}
          <g class="clip" class:sel={selected === i} class:current={c.pattern_id === patternId}>
            <rect
              x={c.start_beat * beatPx + 1}
              y={c.track * trackH + 2}
              width={Math.max(4, beatsOf(p) * beatPx - 2)}
              height={trackH - 4}
              rx="3"
              style:fill={colourOf(c.pattern_id)}
            />
            <text x={c.start_beat * beatPx + 5} y={c.track * trackH + 19}
              >{fit(p?.name ?? '?', beatsOf(p) * beatPx)}</text
            >
          </g>
        {/each}
        {#if playTick !== null}
          <line
            x1={(playTick / ppq) * beatPx}
            x2={(playTick / ppq) * beatPx}
            y1="0"
            y2={height}
            class="playhead"
          />
        {/if}
      </svg>
    </div>
  </div>
</section>

<style>
  .playlist {
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
    border-color: var(--vbm-accent);
    color: var(--vbm-accent-text);
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
    max-height: min(46vh, 420px);
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
    font-size: 10px;
    font-family: var(--vbm-font-mono);
  }
  .ph {
    fill: var(--vbm-success);
  }
  .labels {
    position: sticky;
    left: 0;
    z-index: 2;
    display: grid;
    background: var(--vbm-surface-2);
    border-right: 1px solid #000;
  }
  .label {
    box-sizing: border-box;
    padding: 0 0.5rem;
    border-bottom: 1px solid var(--vbm-border);
    font-size: 0.7rem;
    line-height: 30px;
    color: var(--vbm-muted);
  }
  .grid {
    display: block;
    touch-action: none;
    cursor: crosshair;
  }
  .grid:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: -2px;
  }
  .track {
    fill: #26262d;
  }
  .track.odd {
    fill: #2b2b33;
  }
  .grid line {
    stroke: #35353e;
  }
  .grid line.four {
    stroke: #55555f;
  }
  .clip rect {
    stroke: rgb(0 0 0 / 60%);
    opacity: 0.85;
  }
  .clip.current rect {
    opacity: 1;
  }
  .clip.sel rect {
    stroke: #fff;
    stroke-width: 1.5;
  }
  .clip text {
    fill: #111;
    font-size: 11px;
    font-weight: 600;
    pointer-events: none;
  }
  .grid line.playhead {
    stroke: var(--vbm-success);
    stroke-width: 1.5;
  }
  button:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 1px;
  }
</style>
