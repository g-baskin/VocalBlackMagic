<script lang="ts">
  import {
    patternStepOptions,
    patternTicks,
    stepIndex,
    stepTicks,
    toggleStep,
    type BeatChannel,
    type BeatPattern,
    type InstrumentKind,
    type PatternSteps
  } from '@vbm/contracts';
  import Knob from '../../sampler/ui/Knob.svelte';

  let {
    channels = $bindable(),
    pattern = $bindable(),
    patternId = $bindable(),
    patterns,
    selectedId,
    playStep,
    canAddChannel,
    canAddPattern,
    onbegin,
    onselect,
    onopenroll,
    onaddchannel,
    onnewpattern,
    onclonepattern,
    ondeletepattern,
    onsteps
  }: {
    channels: BeatChannel[];
    pattern: BeatPattern;
    patternId: string;
    patterns: { id: string; name: string }[];
    selectedId: string;
    playStep: number | null;
    canAddChannel: boolean;
    canAddPattern: boolean;
    onbegin: () => void;
    onselect: (id: string) => void;
    onopenroll: (id: string) => void;
    onaddchannel: (kind: InstrumentKind) => void;
    onnewpattern: () => void;
    onclonepattern: () => void;
    ondeletepattern: () => void;
    onsteps: (steps: PatternSteps) => void;
  } = $props();

  const stepList = $derived(Array.from({ length: pattern.steps }, (_, i) => i));

  /** A channel whose notes are all plain steps shows step buttons; otherwise a note preview. */
  function onlySteps(channel: BeatChannel): boolean {
    return (pattern.notes[channel.id] ?? []).every(
      (n) => n.key === channel.root_key && n.start % stepTicks === 0 && n.length === stepTicks
    );
  }
  function velocityAt(channel: BeatChannel, step: number): number | null {
    const i = stepIndex(pattern, channel, step);
    return i >= 0 ? pattern.notes[channel.id][i].velocity : null;
  }

  let paint: { channel: string; on: boolean } | null = null;
  let velDrag: { channel: BeatChannel; step: number; y: number; v: number } | null = null;

  function down(e: PointerEvent, channel: BeatChannel, step: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    onbegin();
    const v = velocityAt(channel, step);
    if (e.altKey && v !== null) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      velDrag = { channel, step, y: e.clientY, v };
      return;
    }
    paint = { channel: channel.id, on: toggleStep(pattern, channel, step) };
  }
  function enter(e: PointerEvent, channel: BeatChannel, step: number) {
    if (!paint || paint.channel !== channel.id || !(e.buttons & 1)) return;
    if ((velocityAt(channel, step) !== null) !== paint.on) toggleStep(pattern, channel, step);
  }
  function move(e: PointerEvent) {
    if (!velDrag) return;
    const i = stepIndex(pattern, velDrag.channel, velDrag.step);
    if (i < 0) return;
    const v = Math.round(Math.min(127, Math.max(1, velDrag.v + (velDrag.y - e.clientY))));
    pattern.notes[velDrag.channel.id][i].velocity = v;
  }
  function up() {
    paint = null;
    velDrag = null;
  }
  function key(e: KeyboardEvent, channel: BeatChannel, step: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onbegin();
      toggleStep(pattern, channel, step);
      return;
    }
    const delta = e.key === 'ArrowUp' ? 8 : e.key === 'ArrowDown' ? -8 : 0;
    const i = stepIndex(pattern, channel, step);
    if (!delta || i < 0) return;
    e.preventDefault();
    onbegin();
    const note = pattern.notes[channel.id][i];
    note.velocity = Math.min(127, Math.max(1, note.velocity + delta));
  }

  function preview(channel: BeatChannel) {
    const notes = pattern.notes[channel.id] ?? [];
    if (!notes.length) return { lo: 0, span: 1, notes };
    const lo = Math.min(...notes.map((n) => n.key));
    const hi = Math.max(...notes.map((n) => n.key));
    return { lo, span: Math.max(1, hi - lo + 1), notes };
  }
</script>

<svelte:window onpointerup={up} />

<section class="rack" aria-labelledby="rack-title">
  <div class="head">
    <h2 id="rack-title">Channel rack</h2>
    <label class="field">
      <span class="sr">Pattern</span>
      <select bind:value={patternId} aria-label="Pattern">
        {#each patterns as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
      </select>
    </label>
    <label class="field">
      <span class="sr">Pattern name</span>
      <input
        type="text"
        maxlength="40"
        bind:value={pattern.name}
        onfocus={onbegin}
        aria-label="Pattern name"
      />
    </label>
    <label class="field">
      <span class="sr">Steps</span>
      <select
        aria-label="Pattern length in steps"
        value={pattern.steps}
        onchange={(e) =>
          onsteps(Number((e.currentTarget as HTMLSelectElement).value) as PatternSteps)}
      >
        {#each patternStepOptions as s (s)}<option value={s}>{s} steps</option>{/each}
      </select>
    </label>
    <button class="tool" disabled={!canAddPattern} onclick={onnewpattern} title="New empty pattern"
      >+ Pattern</button
    >
    <button
      class="tool"
      disabled={!canAddPattern}
      onclick={onclonepattern}
      title="Copy this pattern">Clone</button
    >
    <button
      class="tool"
      disabled={patterns.length < 2}
      onclick={ondeletepattern}
      aria-label="Delete pattern"
      title="Delete this pattern">✕</button
    >
    <label class="field add">
      <span class="sr">Add a channel</span>
      <select
        aria-label="Add a channel"
        disabled={!canAddChannel}
        value=""
        onchange={(e) => {
          const el = e.currentTarget as HTMLSelectElement;
          if (el.value) onaddchannel(el.value as InstrumentKind);
          el.value = '';
        }}
      >
        <option value="" disabled>+ Channel</option>
        <option value="drum">Drum synth</option>
        <option value="synth">3-osc synth</option>
        <option value="sampler">Sampler (Pads sound)</option>
      </select>
    </label>
  </div>

  <div class="rows">
    {#each channels as channel (channel.id)}
      {@const steps = onlySteps(channel)}
      <div
        class="row"
        class:selected={channel.id === selectedId}
        role="group"
        aria-label={channel.name}
      >
        <div class="left">
          <button
            class="led"
            class:on={!channel.mixer.mute}
            aria-pressed={!channel.mixer.mute}
            aria-label="{channel.name} on"
            title="Mute or unmute (right-click to solo)"
            onclick={() => {
              onbegin();
              channel.mixer.mute = !channel.mixer.mute;
            }}
            oncontextmenu={(e) => {
              e.preventDefault();
              onbegin();
              channel.mixer.solo = !channel.mixer.solo;
            }}
          ></button>
          <span class="solo" class:on={channel.mixer.solo} title="Solo"
            >{channel.mixer.solo ? 'S' : ''}</span
          >
          <div class="mini">
            <Knob
              bind:value={channel.mixer.pan}
              min={-1}
              max={1}
              step={0.01}
              defaultValue={0}
              bipolar
              size={26}
              label="{channel.name} pan"
              format={(v) => (v === 0 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100))}
              {onbegin}
            />
            <Knob
              bind:value={channel.mixer.volume_db}
              min={-60}
              max={6}
              step={0.5}
              defaultValue={-3}
              size={26}
              accent="ember"
              label="{channel.name} volume"
              format={(v) => (v <= -60 ? '-∞' : v.toFixed(1)) + ' dB'}
              {onbegin}
            />
          </div>
          <button
            class="name"
            style:--c={channel.colour}
            aria-pressed={channel.id === selectedId}
            title="Select {channel.name} (keys and MIDI play it). Double-click for the piano roll."
            onclick={() => onselect(channel.id)}
            ondblclick={() => onopenroll(channel.id)}>{channel.name}</button
          >
        </div>
        {#if steps}
          <div class="steps">
            {#each stepList as s (s)}
              {@const v = velocityAt(channel, s)}
              <button
                class="step"
                class:alt={Math.floor(s / 4) % 2 === 1}
                class:on={v !== null}
                class:now={playStep === s}
                style:--c={channel.colour}
                style:--v={v === null ? 0 : 0.35 + (0.65 * v) / 127}
                aria-pressed={v !== null}
                aria-label="{channel.name} step {s + 1}{v !== null ? ', velocity ' + v : ''}"
                title={v !== null ? 'Velocity ' + v + ' (Alt+drag or arrow keys)' : undefined}
                onpointerdown={(e) => down(e, channel, s)}
                onpointerenter={(e) => enter(e, channel, s)}
                onpointermove={move}
                onkeydown={(e) => key(e, channel, s)}
                oncontextmenu={(e) => {
                  e.preventDefault();
                  if (v !== null) {
                    onbegin();
                    toggleStep(pattern, channel, s);
                  }
                }}><i style:height={v === null ? 0 : (v / 127) * 100 + '%'}></i></button
              >
            {/each}
          </div>
        {:else}
          {@const pv = preview(channel)}
          <button
            class="preview"
            style:--c={channel.colour}
            style:width={pattern.steps * 26 + 'px'}
            aria-label="{channel.name}: {pv.notes.length} notes, open in the piano roll"
            title="Notes edited in the piano roll. Click to open it."
            onclick={() => onopenroll(channel.id)}
          >
            <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
              {#each pv.notes as n, i (i)}
                <rect
                  x={(n.start / patternTicks(pattern)) * 1000}
                  y={90 - ((n.key - pv.lo + 1) / pv.span) * 80}
                  width={Math.max(4, (n.length / patternTicks(pattern)) * 1000)}
                  height={Math.max(6, 80 / pv.span)}
                />
              {/each}
              {#if playStep !== null}
                <line
                  x1={((playStep + 0.5) / pattern.steps) * 1000}
                  x2={((playStep + 0.5) / pattern.steps) * 1000}
                  y1="0"
                  y2="100"
                  class="head-line"
                />
              {/if}
            </svg>
          </button>
        {/if}
      </div>
    {/each}
    {#if !channels.length}
      <p class="empty">No channels. Add one with “+ Channel”.</p>
    {/if}
  </div>
</section>

<style>
  .rack {
    border: 1px solid var(--vbm-border);
    border-radius: 12px;
    background: var(--vbm-surface);
    min-width: 0;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.7rem;
    border-bottom: 1px solid var(--vbm-border);
    background: linear-gradient(180deg, var(--vbm-surface-3), var(--vbm-surface-2));
    border-radius: 12px 12px 0 0;
  }
  h2 {
    margin: 0 0.4rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
  }
  .field select,
  .field input {
    min-height: 1.9rem;
    padding: 0 0.4rem;
    border: 1px solid var(--vbm-border);
    border-radius: 6px;
    background: var(--vbm-bg);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.78rem;
  }
  .field input {
    width: 8rem;
  }
  .add {
    margin-left: auto;
  }
  .tool {
    min-height: 1.9rem;
    padding: 0 0.55rem;
    border: 1px solid var(--vbm-border);
    border-radius: 6px;
    background: var(--vbm-surface-2);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.76rem;
    cursor: pointer;
  }
  .tool:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .rows {
    overflow-x: auto;
    padding: 0.4rem 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: max-content;
    min-width: 100%;
    padding: 0.12rem 0.7rem 0.12rem 0;
  }
  .left {
    position: sticky;
    left: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0 0.3rem 0 0.7rem;
    background: var(--vbm-surface);
  }
  .led {
    width: 14px;
    height: 14px;
    border: 1px solid #000;
    border-radius: 50%;
    background: #2a3a2a;
    cursor: pointer;
    padding: 0;
  }
  .led.on {
    background: radial-gradient(circle at 35% 35%, #c8ffb0, #3ecf3e 60%, #1a6b1a);
    box-shadow: 0 0 6px rgb(62 207 62 / 60%);
  }
  .solo {
    width: 0.7rem;
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--vbm-warning);
  }
  .mini {
    display: flex;
    gap: 0.1rem;
  }
  .mini :global(.knob) {
    min-width: 28px;
  }
  .mini :global(.label),
  .mini :global(.value) {
    display: none;
  }
  .name {
    width: 7.5rem;
    min-height: 1.75rem;
    padding: 0 0.5rem;
    border: 1px solid var(--vbm-border-strong);
    border-left: 4px solid var(--c);
    border-radius: 4px;
    background: linear-gradient(180deg, #3a3a44, #2a2a32);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.76rem;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }
  .row.selected .name {
    background: linear-gradient(180deg, #4b4b58, #383842);
    border-color: var(--c);
    box-shadow: 0 0 0 1px var(--c);
  }
  .steps {
    display: flex;
    gap: 3px;
    touch-action: none;
  }
  .step {
    position: relative;
    width: 23px;
    height: 28px;
    padding: 0;
    border: 1px solid #0d0d10;
    border-radius: 3px;
    background: linear-gradient(180deg, #4a4a55, #34343d);
    cursor: pointer;
    overflow: hidden;
  }
  .step.alt {
    background: linear-gradient(180deg, #5a3a40, #3e2a2f);
  }
  .step:nth-child(4n + 1):not(:first-child) {
    margin-left: 5px;
  }
  .step.on {
    background: var(--c);
    opacity: var(--v);
    box-shadow: 0 0 8px color-mix(in srgb, var(--c) 60%, transparent);
  }
  .step i {
    position: absolute;
    inset: auto 0 0 0;
    background: rgb(255 255 255 / 35%);
  }
  .step.now {
    outline: 2px solid #fff;
    outline-offset: -2px;
  }
  .preview {
    height: 28px;
    padding: 0;
    border: 1px solid #0d0d10;
    border-radius: 3px;
    background: #24242b;
    cursor: pointer;
  }
  .preview svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .preview rect {
    fill: var(--c);
  }
  .head-line {
    stroke: #fff;
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
  }
  .empty {
    padding: 1rem;
    color: var(--vbm-muted);
    font-size: 0.85rem;
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 1px;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
