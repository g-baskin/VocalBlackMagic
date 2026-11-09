<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    defaultInstrument,
    drumKinds,
    oscWaves,
    padNoteName,
    samplerModes,
    type BeatChannel,
    type DrumKind,
    type InstrumentKind,
    type OscWave,
    type SamplerMode,
    type SoundMeta
  } from '@vbm/contracts';
  import Knob from '../../sampler/ui/Knob.svelte';

  let {
    channel = $bindable(),
    sounds,
    soundsError,
    onbegin,
    onremove,
    onaudition
  }: {
    channel: BeatChannel;
    sounds: SoundMeta[];
    soundsError: string | null;
    onbegin: () => void;
    onremove: () => void;
    onaudition: () => void;
  } = $props();

  const kindNames: Record<InstrumentKind, string> = {
    synth: '3-osc synth',
    drum: 'Drum synth',
    sampler: 'Sampler'
  };
  const waveNames: Record<OscWave, string> = {
    sine: 'Sine',
    triangle: 'Triangle',
    sawtooth: 'Saw',
    square: 'Square'
  };
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  const ms = (v: number) => (v >= 1000 ? (v / 1000).toFixed(2) + ' s' : Math.round(v) + ' ms');
  const hzLabel = (v: number) =>
    v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : Math.round(v) + ' Hz';

  const byCategory = $derived(
    [...new Set(sounds.map((s) => s.category))]
      .sort()
      .map((category) => [category, sounds.filter((s) => s.category === category)] as const)
  );
  const missing = $derived(
    channel.instrument.kind === 'sampler' &&
      !!channel.instrument.sound_id &&
      !sounds.some((s) => s.id === (channel.instrument as { sound_id: string }).sound_id)
  );
</script>

<section class="settings" aria-labelledby="settings-title" style:--c={channel.colour}>
  <div class="head">
    <h2 id="settings-title">Channel settings</h2>
    <button class="tool" onclick={onaudition} title="Play the root key">Audition</button>
  </div>

  <div class="line">
    <label class="field grow"
      ><span>Name</span><input
        type="text"
        maxlength="40"
        bind:value={channel.name}
        onfocus={onbegin}
      /></label
    >
    <label class="field"
      ><span>Colour</span><input
        type="color"
        {@attach (el: HTMLInputElement) => {
          // Set as a property: a server-rendered value attribute warns when hydration removes it.
          el.value = channel.colour;
        }}
        onfocus={onbegin}
        oninput={(e) => (channel.colour = (e.currentTarget as HTMLInputElement).value)}
      /></label
    >
  </div>
  <div class="line">
    <label class="field"
      ><span>Instrument</span>
      <select
        value={channel.instrument.kind}
        onchange={(e) => {
          onbegin();
          channel.instrument = defaultInstrument(
            (e.currentTarget as HTMLSelectElement).value as InstrumentKind
          );
        }}
      >
        {#each Object.entries(kindNames) as [k, label] (k)}<option value={k}>{label}</option>{/each}
      </select></label
    >
    <label class="field"
      ><span>Root key</span>
      <input
        type="number"
        min="0"
        max="127"
        value={channel.root_key}
        onchange={(e) => {
          const el = e.currentTarget as HTMLInputElement;
          const v = Math.round(Number(el.value));
          if (v >= 0 && v <= 127) {
            onbegin();
            channel.root_key = v;
          } else el.value = String(channel.root_key);
        }}
      /><small>{padNoteName(channel.root_key)}</small></label
    >
  </div>

  {#if channel.instrument.kind === 'synth'}
    {@const s = channel.instrument.synth}
    <h3>Oscillators</h3>
    {#each s.osc as osc, i (i)}
      <div class="osc">
        <label class="field"
          ><span>Osc {i + 1}</span>
          <select
            value={osc.wave}
            onchange={(e) => {
              onbegin();
              osc.wave = (e.currentTarget as HTMLSelectElement).value as OscWave;
            }}
          >
            {#each oscWaves as w (w)}<option value={w}>{waveNames[w]}</option>{/each}
          </select></label
        >
        <Knob
          bind:value={osc.coarse}
          min={-24}
          max={24}
          step={1}
          defaultValue={0}
          bipolar
          label="Coarse"
          size={36}
          format={(v) => (v > 0 ? '+' : '') + v + ' st'}
          {onbegin}
        />
        <Knob
          bind:value={osc.fine}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          bipolar
          label="Fine"
          size={36}
          format={(v) => (v > 0 ? '+' : '') + v + ' ct'}
          {onbegin}
        />
        <Knob
          bind:value={osc.level}
          min={0}
          max={1}
          step={0.01}
          defaultValue={0.5}
          label="Level"
          size={36}
          accent="ember"
          format={(v) => Math.round(v * 100) + '%'}
          {onbegin}
        />
      </div>
    {/each}
    <h3>Envelope and filter</h3>
    <div class="knobs">
      <Knob
        bind:value={s.attack_ms}
        min={0}
        max={5000}
        step={1}
        defaultValue={4}
        label="Attack"
        size={40}
        format={ms}
        {onbegin}
      />
      <Knob
        bind:value={s.decay_ms}
        min={0}
        max={5000}
        step={1}
        defaultValue={220}
        label="Decay"
        size={40}
        format={ms}
        {onbegin}
      />
      <Knob
        bind:value={s.sustain}
        min={0}
        max={1}
        step={0.01}
        defaultValue={0.6}
        label="Sustain"
        size={40}
        format={(v) => Math.round(v * 100) + '%'}
        {onbegin}
      />
      <Knob
        bind:value={s.release_ms}
        min={0}
        max={10000}
        step={1}
        defaultValue={180}
        label="Release"
        size={40}
        format={ms}
        {onbegin}
      />
      <Knob
        bind:value={s.cutoff_hz}
        min={20}
        max={20000}
        step={1}
        defaultValue={3200}
        log
        label="Cutoff"
        size={40}
        accent="pink"
        format={hzLabel}
        {onbegin}
      />
      <Knob
        bind:value={s.reso}
        min={0.1}
        max={20}
        step={0.1}
        defaultValue={1}
        label="Reso"
        size={40}
        accent="pink"
        format={(v) => v.toFixed(1)}
        {onbegin}
      />
      <Knob
        bind:value={s.glide_ms}
        min={0}
        max={2000}
        step={1}
        defaultValue={60}
        label="Glide"
        size={40}
        disabled={!s.mono}
        format={ms}
        {onbegin}
      />
    </div>
    <label class="check"
      ><input
        type="checkbox"
        checked={s.mono}
        onchange={(e) => {
          onbegin();
          s.mono = (e.currentTarget as HTMLInputElement).checked;
        }}
      /> Mono (overlapping notes glide)</label
    >
  {:else if channel.instrument.kind === 'drum'}
    {@const d = channel.instrument}
    <div class="line">
      <label class="field"
        ><span>Drum</span>
        <select
          value={d.drum}
          onchange={(e) => {
            onbegin();
            d.drum = (e.currentTarget as HTMLSelectElement).value as DrumKind;
          }}
        >
          {#each drumKinds as k (k)}<option value={k}
              >{k === 'openhat' ? 'Open hat' : cap(k)}</option
            >{/each}
        </select></label
      >
    </div>
    <div class="knobs">
      <Knob
        bind:value={d.tune_st}
        min={-24}
        max={24}
        step={1}
        defaultValue={0}
        bipolar
        label="Tune"
        size={44}
        format={(v) => (v > 0 ? '+' : '') + v + ' st'}
        {onbegin}
      />
      <Knob
        bind:value={d.decay}
        min={0.1}
        max={4}
        step={0.05}
        defaultValue={1}
        label="Decay"
        size={44}
        accent="ember"
        format={(v) => '×' + v.toFixed(2)}
        {onbegin}
      />
    </div>
  {:else}
    {@const sm = channel.instrument}
    <div class="line">
      <label class="field grow"
        ><span>Sound</span>
        <select
          value={sm.sound_id ?? ''}
          onchange={(e) => {
            onbegin();
            sm.sound_id = (e.currentTarget as HTMLSelectElement).value || null;
          }}
        >
          <option value="">No sound</option>
          {#if missing}<option value={sm.sound_id}>Missing sound</option>{/if}
          {#each byCategory as [category, list] (category)}
            <optgroup label={cap(category)}>
              {#each list as s (s.id)}<option value={s.id}>{s.name}</option>{/each}
            </optgroup>
          {/each}
        </select></label
      >
      <label class="field"
        ><span>Mode</span>
        <select
          value={sm.mode}
          onchange={(e) => {
            onbegin();
            sm.mode = (e.currentTarget as HTMLSelectElement).value as SamplerMode;
          }}
        >
          {#each samplerModes as m (m)}<option value={m}>{cap(m)}</option>{/each}
        </select></label
      >
    </div>
    {#if soundsError}<p class="note">{soundsError}</p>{/if}
    {#if !sounds.length && !soundsError}
      <p class="note">
        The sound library is empty. Add sounds on the <a href={resolve('/pads')}>Pads</a> page first.
      </p>
    {/if}
    {#if missing}<p class="note">This channel's sound is no longer in the library.</p>{/if}
    <p class="note">
      The sample plays at its own pitch on the root key ({padNoteName(channel.root_key)}).
    </p>
  {/if}

  <h3>Mixer</h3>
  <div class="knobs">
    <Knob
      bind:value={channel.mixer.volume_db}
      min={-60}
      max={6}
      step={0.5}
      defaultValue={-3}
      label="Volume"
      size={40}
      accent="ember"
      format={(v) => (v <= -60 ? '-∞' : v.toFixed(1)) + ' dB'}
      {onbegin}
    />
    <Knob
      bind:value={channel.mixer.pan}
      min={-1}
      max={1}
      step={0.01}
      defaultValue={0}
      bipolar
      label="Pan"
      size={40}
      format={(v) => (v === 0 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100))}
      {onbegin}
    />
    <div class="toggles">
      <button
        class="tool"
        class:on={channel.mixer.mute}
        aria-pressed={channel.mixer.mute}
        onclick={() => {
          onbegin();
          channel.mixer.mute = !channel.mixer.mute;
        }}>Mute</button
      >
      <button
        class="tool"
        class:on={channel.mixer.solo}
        aria-pressed={channel.mixer.solo}
        onclick={() => {
          onbegin();
          channel.mixer.solo = !channel.mixer.solo;
        }}>Solo</button
      >
    </div>
  </div>
  <button class="tool danger" onclick={onremove}>Remove channel</button>
</section>

<style>
  .settings {
    display: grid;
    align-content: start;
    gap: 0.55rem;
    padding: 0.6rem 0.8rem 0.8rem;
    border: 1px solid var(--vbm-border);
    border-top: 3px solid var(--c);
    border-radius: 12px;
    background: var(--vbm-surface);
    min-width: 0;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2,
  h3 {
    margin: 0;
    letter-spacing: 0;
    text-transform: none;
  }
  h2 {
    font-size: 0.85rem;
    font-weight: 600;
  }
  h3 {
    margin-top: 0.3rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--vbm-muted);
  }
  .line {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .field {
    display: grid;
    gap: 0.15rem;
    font-size: 0.7rem;
    color: var(--vbm-muted);
  }
  .field.grow {
    flex: 1;
    min-width: 8rem;
  }
  .field small {
    font-family: var(--vbm-font-mono);
  }
  .field input,
  .field select {
    min-height: 1.9rem;
    padding: 0 0.4rem;
    border: 1px solid var(--vbm-border);
    border-radius: 6px;
    background: var(--vbm-bg);
    color: var(--vbm-text);
    font: inherit;
    font-size: 0.8rem;
  }
  .field input[type='number'] {
    width: 4.5rem;
  }
  .field input[type='color'] {
    width: 3rem;
    padding: 0.1rem;
  }
  .osc {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }
  .knobs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.1rem;
    align-items: center;
  }
  .settings :global(.knob .label) {
    font-size: 0.68rem;
  }
  .toggles {
    display: grid;
    gap: 0.3rem;
    margin-left: 0.4rem;
  }
  .check {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    font-size: 0.78rem;
  }
  .note {
    margin: 0;
    font-size: 0.74rem;
    color: var(--vbm-muted);
  }
  .note a {
    color: var(--vbm-blue-text);
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
    border-color: var(--vbm-warning);
    color: var(--vbm-warning);
  }
  .tool.danger {
    justify-self: start;
    margin-top: 0.3rem;
    color: var(--vbm-danger);
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 1px;
  }
</style>
