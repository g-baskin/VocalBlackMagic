<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import type { SongMeta } from '@vbm/contracts';
  import {
    defaultRiffSettings,
    generateRiff,
    readRiffDraft,
    riffKeys,
    riffScales,
    riffNotes,
    riffNoteName,
    riffMidi,
    validSettings,
    type RiffDraft,
    type RiffStep
  } from '../../lib/client/riff';
  import { renderRiff } from '../../lib/client/riff-audio';
  import RiffArranger from '../../lib/client/RiffArranger.svelte';

  let draft = $state<RiffDraft>(generateRiff(defaultRiffSettings, 1));
  let settings = $state({ ...defaultRiffSettings });
  let history = $state<RiffDraft[]>([]);
  let selected = $state(0);
  let ready = $state(false);
  let savedLocally = $state(false);
  let title = $state('My guitar riff');
  let rights = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let status = $state('');
  let song = $state<SongMeta | null>(null);
  let audioUrl = $state<string | null>(null);
  let audio = $state<HTMLAudioElement>();
  let wav: Blob | null = null;
  let alive = true;
  const pendingSettings = $derived(JSON.stringify(settings) !== JSON.stringify(draft.settings));
  const pitched = $derived(draft.steps.some((s) => s.midi !== null));
  const pitchOptions = $derived(
    [
      ...new Set([
        ...riffNotes(draft.settings),
        ...(draft.steps[selected]?.midi != null ? [draft.steps[selected].midi!] : [])
      ])
    ].sort((a, b) => a - b)
  );
  const bars = $derived(Array.from({ length: draft.settings.bars }, (_, i) => i));
  const clone = (d: RiffDraft): RiffDraft => JSON.parse(JSON.stringify(d));

  onMount(() => {
    try {
      const stored = localStorage.getItem('vbm-riff-draft-v1');
      const restored = stored ? readRiffDraft(stored) : null;
      if (restored) {
        draft = restored;
        settings = { ...restored.settings };
      }
    } catch {
      /* Local storage may be disabled. Exports remain available. */
    }
    ready = true;
  });
  $effect(() => {
    const text = JSON.stringify(draft);
    if (ready) {
      try {
        localStorage.setItem('vbm-riff-draft-v1', text);
        savedLocally = true;
      } catch {
        savedLocally = false;
      }
    }
  });
  function invalidate() {
    audio?.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = null;
    wav = null;
    song = null;
    status = '';
    error = null;
  }
  function remember() {
    history = [...history.slice(-19), clone(draft)];
    invalidate();
  }
  function vary() {
    if (!validSettings(settings) || busy) return;
    remember();
    draft = generateRiff(settings, crypto.getRandomValues(new Uint32Array(1))[0], draft.steps);
    selected = Math.min(selected, draft.steps.length - 1);
  }
  function edit(change: Partial<RiffStep>) {
    remember();
    draft = {
      ...draft,
      steps: draft.steps.map((s, i) => (i === selected ? { ...s, ...change } : s))
    };
  }
  function undo() {
    if (!history.length) return;
    invalidate();
    draft = history.at(-1)!;
    settings = { ...draft.settings };
    history = history.slice(0, -1);
    selected = Math.min(selected, draft.steps.length - 1);
  }
  async function rendered() {
    if (!wav) {
      const result = await renderRiff(clone(draft));
      if (!alive) throw Error('Preview closed.');
      wav = result;
      audioUrl = URL.createObjectURL(result);
    }
    return wav;
  }
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await fn();
    } catch (e) {
      if (alive) error = e instanceof Error ? e.message : 'That action failed. Try again.';
    } finally {
      if (alive) busy = false;
    }
  }
  function download(blob: Blob, extension: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      (title
        .trim()
        .replace(/[^\p{L}\p{N}_ -]/gu, '')
        .slice(0, 80) || 'VBM riff') +
      '.' +
      extension;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function save() {
    if (!rights || !title.trim()) {
      error = 'Give the riff a title and confirm your rights first.';
      return;
    }
    await action(async () => {
      const preview = await rendered();
      const midi = await riffMidi(clone(draft));
      const form = new FormData();
      form.set('type', 'midi');
      form.set('title', title.trim());
      form.set('rights', 'true');
      form.set(
        'tags',
        draft.settings.key +
          ' ' +
          draft.settings.scale +
          ', ' +
          draft.settings.bpm +
          ' BPM, ' +
          draft.settings.instrument
      );
      form.set('file', new File([preview], 'riff-preview.wav', { type: 'audio/wav' }));
      form.set('midi', new File([midi], 'riff.mid', { type: 'audio/midi' }));
      const response = await fetch('/api/studio/uploads', {
        method: 'POST',
        headers: { 'x-vbm-intent': 'upload' },
        body: form
      });
      const reply = await response.json();
      if (!response.ok || !reply.song)
        throw Error(reply.detail || 'Saving failed. Your draft and exports are still available.');
      if (alive) {
        song = reply.song;
        status = 'Riff saved. This is your source preview, not a generated full song.';
      }
    });
  }
  onDestroy(() => {
    alive = false;
    audio?.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  });
</script>

<svelte:head><title>Riff creator · VBM Studio</title></svelte:head>
<div class="riff-workbench">
  <header>
    <p class="eyebrow">Riff creator</p>
    <h1>Start with a hook.</h1>
    <p>Create a short melody, keep the notes you like, then explore variations.</p>
    <a href={resolve('/upload')}>Have a MIDI file already? Upload it</a>
    <p><a href="#riff-arranger">Arrange your riff with bass, chords and drums</a></p>
  </header>
  <section class="desk" aria-labelledby="riff-settings">
    <fieldset disabled={busy || !ready}>
      <legend id="riff-settings">Shape your next variation</legend>
      <div class="controls">
        <label
          >Instrument<select bind:value={settings.instrument}
            ><option value="guitar">Guitar</option><option value="bass">Bass</option><option
              value="keys">Keys</option
            ></select
          ></label
        >
        <label
          >Key<select bind:value={settings.key}
            >{#each riffKeys as key (key)}<option>{key}</option>{/each}</select
          ></label
        >
        <label
          >Scale<select bind:value={settings.scale}
            >{#each riffScales as scale (scale)}<option value={scale}
                >{scale === 'minor pentatonic'
                  ? 'Pentatonic'
                  : scale === 'minor'
                    ? 'Minor'
                    : 'Major'}</option
              >{/each}</select
          ></label
        >
        <label
          >Tempo (BPM)<input
            type="number"
            min="60"
            max="180"
            step="1"
            bind:value={settings.bpm}
          /></label
        >
        <label
          >Length<select bind:value={settings.bars}
            ><option value={2}>2 bars</option><option value={4}>4 bars</option><option value={8}
              >8 bars</option
            ></select
          ></label
        >
        <label
          >Note density<select bind:value={settings.density}
            ><option value="sparse">Spacious</option><option value="steady">Steady</option><option
              value="busy">Busy</option
            ></select
          ></label
        >
      </div>
      <label class="check"
        ><input type="checkbox" bind:checked={settings.swing} />Swing the offbeats</label
      >
      <p class="help">
        Settings apply to the next variation. Locked notes stay unchanged, even when you change key.
      </p>
      <div class="actions">
        <RuneButton onclick={vary} disabled={!validSettings(settings)}>Create variation</RuneButton
        ><RuneButton variant="ghost" onclick={undo} disabled={!history.length}>Undo</RuneButton>
      </div>
      {#if pendingSettings}<p class="notice">
          Settings changed. Create a variation to apply them to the riff below.
        </p>{/if}
    </fieldset>
  </section>
  <section class="desk sequence" aria-labelledby="riff-notes">
    <div class="section-head">
      <h2 id="riff-notes">Your notes</h2>
      <span>{draft.settings.key} {draft.settings.scale} · {draft.settings.bpm} BPM · 4/4</span>
    </div>
    <p class="help">
      Eight steps per bar. Select a step to change its note, make a rest or lock it.
    </p>
    <fieldset disabled={busy || !ready} class="bars">
      <legend class="sr-only">Edit riff notes</legend>
      {#each bars as bar (bar)}
        <section class="bar" aria-label={'Bar ' + (bar + 1)}>
          <h3>Bar {bar + 1}</h3>
          <div class="steps">
            {#each draft.steps.slice(bar * 8, bar * 8 + 8) as step, i (bar * 8 + i)}
              <button
                type="button"
                class:chosen={selected === bar * 8 + i}
                class:rest={step.midi === null}
                aria-pressed={selected === bar * 8 + i}
                aria-label={'Bar ' +
                  (bar + 1) +
                  ', step ' +
                  (i + 1) +
                  ', ' +
                  riffNoteName(step.midi) +
                  (step.locked ? ', locked' : '')}
                onclick={() => (selected = bar * 8 + i)}
                ><span class="step-index">{i + 1}</span><strong>{riffNoteName(step.midi)}</strong
                ><span class="lock-label">{step.locked ? 'Locked' : ' '}</span></button
              >
            {/each}
          </div>
          {#if Math.floor(selected / 8) === bar}
            <div class="inspector">
              <label
                >Step {(selected % 8) + 1} note<select
                  value={draft.steps[selected].midi ?? ''}
                  onchange={(e) =>
                    edit({
                      midi: e.currentTarget.value === '' ? null : Number(e.currentTarget.value)
                    })}
                  ><option value="">Rest</option>{#each pitchOptions as pitch (pitch)}<option
                      value={pitch}>{riffNoteName(pitch)}</option
                    >{/each}</select
                ></label
              >
              <label class="check"
                ><input
                  type="checkbox"
                  checked={draft.steps[selected].locked}
                  onchange={(e) => edit({ locked: e.currentTarget.checked })}
                />Keep this step in variations</label
              >
            </div>
          {/if}
        </section>
      {/each}
    </fieldset>
  </section>
  <section class="desk" aria-labelledby="riff-preview">
    <h2 id="riff-preview">Hear it. Keep it.</h2>
    <p class="help">
      Synthesized instrument preview, not a recorded guitar or an AI-produced song. Creating
      variations and previews makes no paid provider call.
    </p>
    <div class="actions">
      <RuneButton
        disabled={busy || !ready || !pitched}
        {busy}
        onclick={() =>
          action(async () => {
            await rendered();
            status = 'Preview ready. Press play below.';
          })}>Render preview</RuneButton
      >
      <RuneButton
        variant="ghost"
        disabled={busy || !ready || !pitched}
        onclick={() =>
          action(async () =>
            download(new Blob([await riffMidi(clone(draft))], { type: 'audio/midi' }), 'mid')
          )}>Export MIDI</RuneButton
      >
      <RuneButton
        variant="ghost"
        disabled={busy || !ready || !pitched}
        onclick={() => action(async () => download(await rendered(), 'wav'))}>Export WAV</RuneButton
      >
    </div>
    {#if audioUrl}<audio
        bind:this={audio}
        controls
        loop
        preload="metadata"
        src={audioUrl}
        aria-label="Riff preview"
      ></audio>{/if}
    <fieldset disabled={busy || !ready} class="save">
      <legend>Save a source riff</legend>
      <label>Riff title<input maxlength="120" bind:value={title} /></label>
      <label class="check"
        ><input type="checkbox" bind:checked={rights} />I created this riff or have permission to
        use it.</label
      >
      <RuneButton disabled={busy || !ready || !rights || !title.trim() || !pitched} onclick={save}
        >Save riff to Library</RuneButton
      >
    </fieldset>
    <p class="help">
      {savedLocally
        ? 'Note draft saved on this device only.'
        : 'On-device draft storage is unavailable.'} Export MIDI to keep your own copy.
    </p>
    <p role="status" class="status">{busy ? 'Working on your riff…' : status}</p>
    {#if error}<p role="alert" class="error">{error}</p>{/if}
    {#if song}<RuneButton variant="ghost" href={resolve('/library/[id]', { id: song.id })}
        >Open saved riff</RuneButton
      >{/if}
  </section>
  <RiffArranger {draft} riffTitle={title} />
  <section class="desk next" aria-labelledby="riff-song">
    <p class="eyebrow">AI generation</p>
    <h2 id="riff-song">Generate an AI song from this riff</h2>
    <p>
      The built-in arranger above works without AI. AI song generation, including vocals, is not
      available yet: the reference-audio tests failed. We will not substitute unrelated music.
    </p>
    <RuneButton disabled>Build a song (unavailable)</RuneButton>
    <p class="help">
      Your MIDI and source preview remain available. No song-generation charge is made here.
    </p>
  </section>
</div>

<style>
  .riff-workbench {
    max-width: 960px;
    margin: 0 auto;
    padding-bottom: 32px;
  }
  header {
    margin-bottom: 24px;
  }
  h1 {
    font-size: clamp(2rem, 6vw, 3rem);
    line-height: 1.1;
    letter-spacing: -0.04em;
    margin: 6px 0 12px;
  }
  h2 {
    font-size: 1.35rem;
    margin: 0 0 12px;
  }
  header > p:not(.eyebrow),
  .next > p:not(.eyebrow) {
    color: var(--vbm-muted);
    line-height: 1.6;
  }
  a {
    color: #75dfef;
  }
  .eyebrow {
    color: #75dfef;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 700;
    margin: 0;
  }
  .desk {
    background: #191e27;
    border: 1px solid #3b4351;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 20px;
    min-width: 0;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  legend {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 16px;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  label {
    display: grid;
    gap: 8px;
    color: #d1dbe5;
    font-size: 0.9rem;
  }
  select,
  input:not([type='checkbox']) {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    background: #10151d;
    color: #f2f4f7;
    border: 1px solid #77889d;
    border-radius: 10px;
    padding: 12px;
    min-height: 48px;
    font: inherit;
  }
  select {
    padding-inline-end: 28px;
  }
  :is(select, input, button, a):focus-visible {
    outline: 2px solid #75dfef;
    outline-offset: 3px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0;
    line-height: 1.5;
  }
  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    flex: none;
    accent-color: #75dfef;
  }
  .help {
    color: #b9c5d3;
    font-size: 0.85rem;
    line-height: 1.6;
    margin: 12px 0 16px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .notice,
  .status {
    color: #75dfef;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .section-head span {
    color: #b9c5d3;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }
  .bar {
    padding-block: 12px;
    border-top: 1px solid #3b4351;
  }
  h3 {
    font-size: 0.85rem;
    color: #b9c5d3;
    margin: 0 0 12px;
  }
  .steps {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 8px;
  }
  .steps button {
    display: grid;
    gap: 4px;
    min-width: 0;
    min-height: 80px;
    padding: 8px 4px;
    border: 1px solid #77889d;
    border-radius: 8px;
    color: #f2f4f7;
    background: #10151d;
    font: inherit;
    cursor: pointer;
  }
  .steps button.chosen {
    border-color: #75dfef;
    background: #263540;
  }
  .steps button.rest strong {
    color: #b9c5d3;
    font-weight: 400;
  }
  .step-index,
  .lock-label {
    color: #b9c5d3;
    font-size: 0.65rem;
    min-height: 1em;
  }
  .inspector {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 24px;
    margin-top: 16px;
  }
  .inspector > label:first-child {
    min-width: min(100%, 160px);
    flex: 1;
  }
  .inspector .check {
    flex: 2;
    min-width: min(100%, 220px);
  }
  .save {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #3b4351;
  }
  audio {
    width: 100%;
    margin-top: 16px;
  }
  .error {
    color: #ffacb9;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 620px) {
    .desk {
      padding: 20px 16px;
    }
    .controls {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .steps {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  @media (max-width: 350px) {
    .controls {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (forced-colors: active) {
    .steps button.chosen {
      border: 2px solid Highlight;
    }
  }
</style>
