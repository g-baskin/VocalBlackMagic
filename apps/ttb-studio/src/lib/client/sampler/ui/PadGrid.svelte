<script lang="ts">
  import { padNoteName, type Kit, type SoundMeta } from '@vbm/contracts';
  import { SvelteSet } from 'svelte/reactivity';
  import { keyLabel } from '../keys';

  let {
    kit,
    sounds,
    selected,
    active,
    playing,
    octave,
    onpress,
    onrelease,
    ondropsound
  }: {
    kit: Kit;
    sounds: ReadonlyMap<string, SoundMeta>;
    selected: number;
    /** Pads currently sounding. */
    active: ReadonlySet<number>;
    /** Pads sounding now: progress 0–1, or null for loops. */
    playing: ReadonlyMap<number, number | null>;
    octave: number;
    onpress: (pad: number, velocity: number) => void;
    onrelease: (pad: number) => void;
    ondropsound: (pad: number, soundId: string) => void;
  } = $props();

  // Top row is F#3–B3, bottom row C1–F1, as on a hardware pad grid.
  const order = Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, col) => (5 - row) * 6 + col)
  ).flat();
  const first = (pad: number) => {
    const id = kit.pads[pad].layers.find(Boolean);
    return id ? (sounds.get(id)?.name ?? 'Missing sound') : '';
  };
  const layersUsed = (pad: number) => kit.pads[pad].layers.filter(Boolean).length;
  let dropTarget = $state<number | null>(null);
  const held = new SvelteSet<number>();

  function down(e: PointerEvent, pad: number) {
    if (e.button !== 0) return;
    held.add(pad);
    // Pointer position inside the pad gives a velocity: lower is harder, like a real pad.
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const v = Math.round(60 + 67 * Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)));
    onpress(pad, e.pointerType === 'mouse' ? 100 : v);
  }
  function up(pad: number) {
    if (held.delete(pad)) onrelease(pad);
  }
  function key(e: KeyboardEvent, pad: number) {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      held.add(pad);
      onpress(pad, 100);
    }
  }
  function keyup(e: KeyboardEvent, pad: number) {
    if (e.key === 'Enter' || e.key === ' ') up(pad);
  }
  function drop(e: DragEvent, pad: number) {
    e.preventDefault();
    dropTarget = null;
    const id = e.dataTransfer?.getData('application/x-vbm-sound');
    if (id) ondropsound(pad, id);
  }
</script>

<div class="grid" role="group" aria-label="Pads C1 to B3">
  {#each order as pad (pad)}
    {@const name = first(pad)}
    {@const hint = keyLabel(pad, octave)}
    <button
      type="button"
      class="pad"
      class:selected={pad === selected}
      class:active={active.has(pad)}
      class:playing={playing.has(pad)}
      class:filled={!!name}
      class:drop={dropTarget === pad}
      aria-pressed={pad === selected}
      aria-label={padNoteName(kit.pads[pad].note) +
        (name ? ', ' + name : ', empty') +
        (playing.has(pad) ? ', playing' : '')}
      onpointerdown={(e) => down(e, pad)}
      onpointerup={() => up(pad)}
      onpointerleave={() => up(pad)}
      onpointercancel={() => up(pad)}
      onkeydown={(e) => key(e, pad)}
      onkeyup={(e) => keyup(e, pad)}
      ondragover={(e) => {
        e.preventDefault();
        dropTarget = pad;
      }}
      ondragleave={() => (dropTarget = null)}
      ondrop={(e) => drop(e, pad)}
    >
      <span class="note">{padNoteName(kit.pads[pad].note)}</span>
      {#if hint}<span class="key" aria-hidden="true">{hint}</span>{/if}
      {#if name}
        <span class="dots" aria-hidden="true" style:width={layersUsed(pad) * 6 - 2 + 'px'}></span>
        <span class="name">{name}</span>
      {/if}
      {#if playing.has(pad)}
        {@const p = playing.get(pad)}
        <span class="progress" class:loop={p === null} aria-hidden="true"
          ><i style:width={p === null ? '100%' : (p ?? 0) * 100 + '%'}></i></span
        >
      {/if}
    </button>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.45rem;
  }
  .pad {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    min-height: 3.1rem;
    padding: 0.4rem 0.5rem;
    border-radius: 9px;
    border: 1px solid rgb(255 255 255 / 7%);
    background: linear-gradient(180deg, rgb(255 255 255 / 4%), rgb(255 255 255 / 1.5%));
    color: var(--pads-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    transition:
      background 0.08s,
      transform 0.06s;
  }
  .pad:hover {
    background: linear-gradient(180deg, rgb(255 255 255 / 7%), rgb(255 255 255 / 3%));
  }
  .pad:focus-visible {
    outline: 2px solid var(--pads-focus);
    outline-offset: 2px;
  }
  .pad.filled {
    background: linear-gradient(180deg, rgb(255 255 255 / 6%), rgb(255 255 255 / 2.5%));
  }
  .pad.selected {
    border: 2px solid transparent;
    background:
      linear-gradient(#171527, #171527) padding-box,
      linear-gradient(120deg, #8f6bff, #ff4f6a, #ff7a2e) border-box;
    box-shadow: 0 0 18px rgb(255 79 106 / 22%);
  }
  .pad.active {
    background: linear-gradient(180deg, rgb(143 107 255 / 45%), rgb(255 79 106 / 25%));
    transform: scale(0.98);
  }
  .pad.playing {
    border-color: rgb(255 111 159 / 70%);
    box-shadow:
      0 0 0 1px rgb(255 79 139 / 35%),
      0 0 16px rgb(255 79 139 / 30%);
  }
  .progress {
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 4px;
    height: 3px;
    border-radius: 2px;
    background: rgb(255 255 255 / 10%);
    overflow: hidden;
  }
  .progress i {
    display: block;
    height: 100%;
    background: var(--vbm-gradient, linear-gradient(90deg, #ff4f8b, #ff8a3d));
  }
  .progress.loop i {
    animation: pulse 1s ease-in-out infinite alternate;
  }
  @keyframes pulse {
    from {
      opacity: 0.4;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .progress.loop i {
      animation: none;
    }
  }
  .pad.drop {
    outline: 2px dashed var(--pads-focus);
  }
  .note,
  .key {
    font-family: var(--vbm-font-mono);
    font-size: 0.6rem;
    color: var(--pads-muted);
  }
  .key {
    position: absolute;
    top: 0.4rem;
    right: 1.4rem;
    opacity: 0.6;
  }
  .dots {
    position: absolute;
    top: 0.45rem;
    right: 0.45rem;
    height: 8px;
    background: repeating-linear-gradient(90deg, #5fd4e6 0 4px, transparent 4px 6px);
    border-radius: 2px;
  }
  .name {
    font-size: 0.72rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
