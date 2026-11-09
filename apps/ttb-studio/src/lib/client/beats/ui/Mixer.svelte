<script lang="ts">
  import type { BeatChannel } from '@vbm/contracts';
  import Knob from '../../sampler/ui/Knob.svelte';

  let {
    channels = $bindable(),
    masterDb = $bindable(),
    levels,
    masterLevel,
    selectedId,
    onselect,
    onbegin
  }: {
    channels: BeatChannel[];
    masterDb: number;
    /** Peak 0 to 1 per channel id. */
    levels: Record<string, number>;
    masterLevel: number;
    selectedId: string;
    onselect: (id: string) => void;
    onbegin: () => void;
  } = $props();

  // One undo step per fader gesture: remember on the first input, reset on change.
  let moving = false;
  function fader(e: Event, set: (v: number) => void) {
    if (!moving) {
      onbegin();
      moving = true;
    }
    set(Number((e.currentTarget as HTMLInputElement).value));
  }
  const meter = (peak: number) => {
    const db = peak > 0 ? 20 * Math.log10(peak) : -60;
    return Math.max(0, Math.min(1, (db + 60) / 60));
  };
  const dbLabel = (v: number) => (v <= -60 ? '-∞' : (v > 0 ? '+' : '') + v.toFixed(1));
</script>

<section class="mixer" aria-labelledby="mixer-title">
  <div class="head"><h2 id="mixer-title">Mixer</h2></div>
  <div class="strips">
    {#each channels as c (c.id)}
      <div
        class="strip"
        class:selected={c.id === selectedId}
        style:--c={c.colour}
        role="group"
        aria-label="{c.name} strip"
      >
        <button class="name" onclick={() => onselect(c.id)} title="Select {c.name}">{c.name}</button
        >
        <div class="pan">
          <Knob
            bind:value={c.mixer.pan}
            min={-1}
            max={1}
            step={0.01}
            defaultValue={0}
            bipolar
            size={30}
            label="Pan"
            format={(v) => (v === 0 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100))}
            {onbegin}
          />
        </div>
        <div class="fader-row">
          <div class="meter" aria-hidden="true">
            <i style:transform="scaleY({meter(levels[c.id] ?? 0)})"></i>
          </div>
          <input
            class="fader"
            type="range"
            min="-60"
            max="6"
            step="0.5"
            value={c.mixer.volume_db}
            aria-label="{c.name} volume"
            aria-valuetext="{dbLabel(c.mixer.volume_db)} dB"
            oninput={(e) => fader(e, (v) => (c.mixer.volume_db = v))}
            onchange={() => (moving = false)}
          />
        </div>
        <span class="db">{dbLabel(c.mixer.volume_db)}</span>
        <div class="ms">
          <button
            class:on={c.mixer.mute}
            aria-pressed={c.mixer.mute}
            aria-label="Mute {c.name}"
            onclick={() => {
              onbegin();
              c.mixer.mute = !c.mixer.mute;
            }}>M</button
          >
          <button
            class:on={c.mixer.solo}
            class="solo"
            aria-pressed={c.mixer.solo}
            aria-label="Solo {c.name}"
            onclick={() => {
              onbegin();
              c.mixer.solo = !c.mixer.solo;
            }}>S</button
          >
        </div>
      </div>
    {/each}
    <div class="strip master" role="group" aria-label="Master strip">
      <span class="name">Master</span>
      <div class="pan"></div>
      <div class="fader-row">
        <div class="meter" aria-hidden="true">
          <i style:transform="scaleY({meter(masterLevel)})"></i>
        </div>
        <input
          class="fader"
          type="range"
          min="-60"
          max="6"
          step="0.5"
          value={masterDb}
          aria-label="Master volume"
          aria-valuetext="{dbLabel(masterDb)} dB"
          oninput={(e) => fader(e, (v) => (masterDb = v))}
          onchange={() => (moving = false)}
        />
      </div>
      <span class="db">{dbLabel(masterDb)}</span>
      <div class="ms"></div>
    </div>
  </div>
</section>

<style>
  .mixer {
    border: 1px solid var(--vbm-border);
    border-radius: 12px;
    background: var(--vbm-surface);
    min-width: 0;
    overflow: hidden;
  }
  .head {
    padding: 0.5rem 0.7rem;
    border-bottom: 1px solid var(--vbm-border);
    background: linear-gradient(180deg, var(--vbm-surface-3), var(--vbm-surface-2));
  }
  h2 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
  }
  .strips {
    display: flex;
    gap: 4px;
    padding: 0.5rem;
    overflow-x: auto;
  }
  .strip {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    width: 64px;
    flex: none;
    padding: 0.35rem 0.2rem;
    border: 1px solid #0d0d10;
    border-top: 3px solid var(--c, var(--vbm-accent));
    border-radius: 6px;
    background: linear-gradient(180deg, #303038, #24242b);
  }
  .strip.selected {
    box-shadow: 0 0 0 1px var(--c);
  }
  .strip.master {
    width: 74px;
    margin-left: 0.5rem;
    border-top-color: var(--vbm-accent-2);
  }
  .name {
    width: 100%;
    padding: 0.15rem 0;
    border: 0;
    background: none;
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.68rem;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }
  .master .name {
    cursor: default;
    font-weight: 600;
  }
  .pan {
    min-height: 34px;
  }
  .pan :global(.label),
  .pan :global(.value) {
    display: none;
  }
  .fader-row {
    display: flex;
    gap: 5px;
    height: 150px;
  }
  .meter {
    position: relative;
    width: 7px;
    border-radius: 2px;
    background: #111;
    overflow: hidden;
  }
  .meter i {
    position: absolute;
    inset: 0;
    transform-origin: bottom;
    background: linear-gradient(0deg, #3ecf8e 0 65%, #ffc04d 80%, #ff5a6e 95%);
    transition: transform 60ms linear;
  }
  .fader {
    writing-mode: vertical-lr;
    direction: rtl;
    width: 22px;
    height: 150px;
    margin: 0;
    accent-color: var(--c, var(--vbm-accent-2));
    cursor: ns-resize;
  }
  .db {
    font-family: var(--vbm-font-mono);
    font-size: 0.62rem;
    color: var(--vbm-muted);
  }
  .ms {
    display: flex;
    gap: 3px;
    min-height: 22px;
  }
  .ms button {
    width: 24px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--vbm-border);
    border-radius: 4px;
    background: var(--vbm-surface-2);
    color: var(--vbm-muted);
    font: inherit;
    font-size: 0.66rem;
    font-weight: 700;
    cursor: pointer;
  }
  .ms button.on {
    background: var(--vbm-danger);
    color: #fff;
  }
  .ms button.solo.on {
    background: var(--vbm-warning);
    color: #111;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 1px;
  }
</style>
