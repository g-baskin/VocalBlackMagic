<script lang="ts">
  import type { BeatProjectSummary } from '@vbm/contracts';
  import Knob from '../../sampler/ui/Knob.svelte';

  let {
    name = $bindable(),
    bpm,
    swing = $bindable(),
    masterDb = $bindable(),
    metronome = $bindable(),
    playing,
    position,
    projects,
    projectId,
    dirty,
    busy,
    canUndo,
    canRedo,
    midiOn,
    midiLabel,
    onplay,
    onstop,
    onbpm,
    onbegin,
    onundo,
    onredo,
    onnew,
    onopen,
    onsave,
    ondelete,
    onexport,
    onmidi,
    extra
  }: {
    name: string;
    bpm: number;
    swing: number;
    masterDb: number;
    metronome: boolean;
    playing: boolean;
    position: string;
    projects: BeatProjectSummary[];
    projectId: string | null;
    dirty: boolean;
    busy: boolean;
    canUndo: boolean;
    canRedo: boolean;
    midiOn: boolean;
    midiLabel: string | null;
    onplay: () => void;
    onstop: () => void;
    onbpm: (bpm: number) => void;
    onbegin: () => void;
    onundo: () => void;
    onredo: () => void;
    onnew: () => void;
    onopen: (id: string) => void;
    onsave: () => void;
    ondelete: (id: string) => void;
    onexport: () => void;
    onmidi: () => void;
    extra?: import('svelte').Snippet;
  } = $props();

  let bpmDrag: { y: number; bpm: number } | null = null;
  function bpmDown(e: PointerEvent) {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    bpmDrag = { y: e.clientY, bpm };
    onbegin();
  }
  function bpmMove(e: PointerEvent) {
    if (!bpmDrag) return;
    const next = Math.round(bpmDrag.bpm + (bpmDrag.y - e.clientY) / (e.shiftKey ? 8 : 2));
    const clamped = Math.min(240, Math.max(40, next));
    if (clamped !== bpm) onbpm(clamped);
  }
  function bpmKey(e: KeyboardEvent) {
    const step = e.shiftKey ? 10 : 1;
    const next = e.key === 'ArrowUp' ? bpm + step : e.key === 'ArrowDown' ? bpm - step : Number.NaN;
    if (Number.isNaN(next)) return;
    e.preventDefault();
    const clamped = Math.min(240, Math.max(40, next));
    if (clamped !== bpm) {
      onbegin();
      onbpm(clamped);
    }
  }
</script>

<header class="transport" aria-label="Transport">
  <div class="brand">
    <span class="logo" aria-hidden="true"></span>
    <label class="name">
      <span class="sr">Project name</span>
      <input
        type="text"
        maxlength="80"
        bind:value={name}
        onfocus={onbegin}
        aria-label="Project name"
      />
    </label>
  </div>

  <div class="group play">
    <button
      class="big"
      class:live={playing}
      aria-label={playing ? 'Stop' : 'Play'}
      title="Play or stop (Space)"
      onclick={playing ? onstop : onplay}
    >
      {#if playing}
        <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="5" width="10" height="10" /></svg
        >
      {:else}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" /></svg>
      {/if}
    </button>
    {@render extra?.()}
  </div>

  <output class="lcd" aria-label="Position, bar:beat:step">{position}</output>

  <div
    class="lcd bpm"
    role="spinbutton"
    tabindex="0"
    aria-label="Tempo in BPM"
    aria-valuemin={40}
    aria-valuemax={240}
    aria-valuenow={bpm}
    title="Drag up or down, or use the arrow keys (Shift for 10)"
    onpointerdown={bpmDown}
    onpointermove={bpmMove}
    onpointerup={() => (bpmDrag = null)}
    onpointercancel={() => (bpmDrag = null)}
    onkeydown={bpmKey}
  >
    {bpm}<small>BPM</small>
  </div>

  <div class="group knobs">
    <Knob
      bind:value={swing}
      min={0}
      max={75}
      step={1}
      defaultValue={0}
      label="Swing"
      size={38}
      format={(v) => Math.round(v) + '%'}
      {onbegin}
    />
    <Knob
      bind:value={masterDb}
      min={-60}
      max={6}
      step={0.5}
      defaultValue={0}
      label="Master"
      size={38}
      accent="ember"
      format={(v) => (v <= -60 ? '-∞' : (v > 0 ? '+' : '') + v.toFixed(1)) + ' dB'}
      {onbegin}
    />
  </div>

  <div class="group">
    <button
      class="tool"
      class:on={metronome}
      aria-pressed={metronome}
      title="Metronome"
      onclick={() => (metronome = !metronome)}>Metro</button
    >
    <button
      class="tool"
      class:on={midiOn}
      aria-pressed={midiOn}
      title={midiLabel ?? 'Play the selected channel from a MIDI keyboard'}
      onclick={onmidi}>MIDI</button
    >
    <button
      class="tool"
      aria-label="Undo"
      title="Undo (Ctrl/Cmd+Z)"
      disabled={!canUndo}
      onclick={onundo}>↶</button
    >
    <button
      class="tool"
      aria-label="Redo"
      title="Redo (Ctrl/Cmd+Shift+Z)"
      disabled={!canRedo}
      onclick={onredo}>↷</button
    >
  </div>

  <div class="group project">
    <label class="sr" for="beats-open">Open a project</label>
    <select
      id="beats-open"
      value={projectId ?? ''}
      disabled={busy}
      onchange={(e) => {
        const id = (e.currentTarget as HTMLSelectElement).value;
        if (id) onopen(id);
      }}
    >
      <option value="" disabled>{projectId ? 'Projects' : 'Unsaved project'}</option>
      {#each projects as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
    </select>
    <button class="tool" onclick={onnew} disabled={busy}>New</button>
    <button class="tool save" class:dirty onclick={onsave} disabled={busy} title="Save (Ctrl/Cmd+S)"
      >{dirty ? 'Save*' : 'Saved'}</button
    >
    {#if projectId}
      <button
        class="tool"
        aria-label="Delete project"
        title="Delete this project"
        disabled={busy}
        onclick={() => ondelete(projectId)}>✕</button
      >
    {/if}
    <button class="tool export" onclick={onexport} disabled={busy}>Export WAV</button>
  </div>
</header>

<style>
  .transport {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem 0.9rem;
    padding: 0.55rem 0.8rem;
    border: 1px solid var(--vbm-border);
    border-radius: 12px;
    background: linear-gradient(180deg, var(--vbm-surface-3), var(--vbm-surface));
    box-shadow: var(--vbm-shadow-sm);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .logo {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background:
      repeating-linear-gradient(90deg, #fff 0 2px, transparent 2px 5px) center / 70% 40% no-repeat,
      var(--vbm-gradient);
  }
  .name input {
    width: 11rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--vbm-text);
    font: inherit;
    font-weight: 600;
  }
  .name input:hover,
  .name input:focus {
    border-color: var(--vbm-border);
    background: var(--vbm-bg);
  }
  .group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .knobs {
    gap: 0.1rem;
  }
  .big {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.3rem;
    border: 1px solid var(--vbm-border-strong);
    border-radius: 8px;
    background: var(--vbm-surface-2);
    color: var(--vbm-success);
    cursor: pointer;
  }
  .big svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }
  .big.live {
    color: var(--vbm-warning);
    border-color: var(--vbm-warning);
  }
  .lcd {
    display: inline-flex;
    align-items: baseline;
    gap: 0.25rem;
    min-width: 6.2rem;
    justify-content: center;
    padding: 0.35rem 0.6rem;
    border: 1px solid #000;
    border-radius: 6px;
    background: #0b1410;
    color: #7dffb2;
    font-family: var(--vbm-font-mono);
    font-size: 1.05rem;
    box-shadow: inset 0 1px 4px rgb(0 0 0 / 70%);
  }
  .lcd small {
    font-size: 0.6rem;
    color: #4fbf80;
  }
  .bpm {
    min-width: 5.4rem;
    cursor: ns-resize;
    touch-action: none;
    user-select: none;
  }
  .tool {
    min-height: 2.1rem;
    padding: 0 0.65rem;
    border: 1px solid var(--vbm-border);
    border-radius: 7px;
    background: var(--vbm-surface-2);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .tool.on {
    border-color: var(--vbm-blue);
    color: var(--vbm-blue-text);
  }
  .tool:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .tool.save.dirty {
    border-color: var(--vbm-accent);
    color: var(--vbm-accent-text);
  }
  .tool.export {
    border: 0;
    background: var(--vbm-gradient);
    color: var(--vbm-on-accent);
    font-weight: 600;
  }
  .project {
    margin-left: auto;
    flex-wrap: wrap;
  }
  select {
    max-width: 11rem;
    min-height: 2.1rem;
    padding: 0 0.4rem;
    border: 1px solid var(--vbm-border);
    border-radius: 7px;
    background: var(--vbm-bg);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.8rem;
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible,
  .lcd:focus-visible {
    outline: 2px solid var(--vbm-focus, var(--vbm-blue));
    outline-offset: 2px;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .transport :global(.knob .label) {
    font-size: 0.66rem;
  }
  @media (max-width: 760px) {
    .project {
      margin-left: 0;
    }
    .name input {
      width: 8rem;
    }
  }
</style>
