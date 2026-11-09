<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import type { RiffDraft } from './riff';
  import {
    createArrangement,
    readArrangement,
    arrangementIssue,
    arrangementSeconds,
    arrangementMidi,
    chordLabel,
    sectionNames,
    trackNames,
    type Arrangement,
    type ArrangementSection
  } from './arrangement';
  import { renderArrangement } from './arrangement-audio';

  let { draft, riffTitle }: { draft: RiffDraft; riffTitle: string } = $props();
  let project = $state<Arrangement | null>(null);
  let history = $state<Arrangement[]>([]);
  let selected = $state(0);
  let ready = $state(false);
  let stored = $state(false);
  let busy = $state(false);
  let rights = $state(false);
  let error = $state('');
  let status = $state('');
  let savedId = $state('');
  let audioUrl = $state('');
  let audio = $state<HTMLAudioElement>();
  let wav: Blob | null = null;
  let alive = true;
  const clone = (p: Arrangement): Arrangement => JSON.parse(JSON.stringify(p));
  const issue = $derived(project ? arrangementIssue(project) : 'Create an arrangement first.');
  const changedSource = $derived(
    project && JSON.stringify(project.source) !== JSON.stringify(draft)
  );
  const section = $derived(project?.sections[selected]);
  const labels = { riff: 'Riff', bass: 'Bass', chords: 'Chords', drums: 'Drums' };
  onMount(() => {
    try {
      const raw = localStorage.getItem('vbm-arrangement-v1');
      if (raw) {
        project = readArrangement(raw);
        if (!project)
          error =
            'The saved arrangement could not be read. Open an exported project or create a new arrangement.';
      }
    } catch {
      /* Export remains available without local storage. */
    }
    ready = true;
  });
  $effect(() => {
    const raw = project ? JSON.stringify(project) : null;
    if (ready && raw) {
      try {
        localStorage.setItem('vbm-arrangement-v1', raw);
        stored = true;
      } catch {
        stored = false;
      }
    }
  });
  function clearRender() {
    audio?.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = '';
    wav = null;
    savedId = '';
    error = '';
    status = '';
  }
  function replace(next: Arrangement) {
    if (busy) return;
    if (project) history = [...history.slice(-19), clone(project)];
    clearRender();
    project = next;
    selected = Math.min(selected, next.sections.length - 1);
  }
  function updateSection(change: Partial<ArrangementSection>) {
    if (!project) return;
    const next = clone(project);
    Object.assign(next.sections[selected], change);
    replace(next);
  }
  function move(delta: number) {
    if (!project) return;
    const to = selected + delta;
    if (to < 0 || to >= project.sections.length) return;
    const next = clone(project);
    [next.sections[selected], next.sections[to]] = [next.sections[to], next.sections[selected]];
    replace(next);
    selected = to;
  }
  function undo() {
    const prior = history.at(-1);
    if (!prior || busy) return;
    clearRender();
    project = prior;
    history = history.slice(0, -1);
    selected = Math.min(selected, prior.sections.length - 1);
  }
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = '';
    try {
      await fn();
    } catch (e) {
      if (alive)
        error =
          e instanceof Error
            ? e.message
            : 'The arrangement action failed. Your project is still here.';
    } finally {
      if (alive) busy = false;
    }
  }
  async function rendered() {
    if (!project) throw Error('Create an arrangement first.');
    if (!wav) {
      const output = await renderArrangement(clone(project));
      if (!alive) throw Error('Arranger closed.');
      wav = output;
      audioUrl = URL.createObjectURL(output);
    }
    return wav;
  }
  function download(blob: Blob, extension: string) {
    const url = URL.createObjectURL(blob),
      link = document.createElement('a');
    link.href = url;
    link.download =
      (project?.title
        .trim()
        .replace(/[^\p{L}\p{N}_ -]/gu, '')
        .slice(0, 80) || 'VBM arrangement') +
      '.' +
      extension;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function openFile(file?: File) {
    if (!file || busy) return;
    let next: Arrangement | null = null;
    await action(async () => {
      if (file.size > 50000) throw Error('Project files must be 50 KB or smaller.');
      next = readArrangement(await file.text());
      if (!next)
        throw Error(
          'This is not a valid VBM arrangement project. Your current project is unchanged.'
        );
    });
    if (next && alive) {
      replace(next);
      rights = false;
      status = 'Project opened. Your previous arrangement is available with Undo.';
    }
  }
  async function save() {
    if (!project || !rights || !project.title.trim() || issue) return;
    const snapshot = clone(project);
    await action(async () => {
      const preview = await rendered();
      const midi = await arrangementMidi(snapshot);
      const form = new FormData();
      form.set('type', 'midi');
      form.set('title', snapshot.title.trim());
      form.set('rights', 'true');
      form.set(
        'tags',
        'VBM synthesized instrumental arrangement, ' +
          snapshot.source.settings.key +
          ', ' +
          snapshot.source.settings.bpm +
          ' BPM'
      );
      form.set('file', new File([preview], 'arrangement.wav', { type: 'audio/wav' }));
      form.set('midi', new File([midi], 'arrangement.mid', { type: 'audio/midi' }));
      const response = await fetch('/api/studio/uploads', {
        method: 'POST',
        headers: { 'x-vbm-intent': 'upload' },
        body: form
      });
      const result = await response.json();
      if (!response.ok || !result.song?.id)
        throw Error(
          result.detail || 'Library save failed. Keep your project export and try again.'
        );
      if (alive) {
        savedId = result.song.id;
        status =
          'Mix and multitrack MIDI saved to Library. Export the project to keep its editable sections and source riff.';
      }
    });
  }
  onDestroy(() => {
    alive = false;
    audio?.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  });
</script>

<section class="arranger" id="riff-arranger" aria-labelledby="arranger-title">
  <h2 id="arranger-title">Build an instrumental arrangement</h2>
  <p class="help">
    Keep your riff’s pitch and rhythm. Add synthesized bass, chords and drums here in Studio. No AI
    singing or paid model calls.
  </p>
  {#if !project}
    <RuneButton
      disabled={!ready || busy || !draft.steps.some((s) => s.midi !== null)}
      onclick={() => replace(createArrangement(draft, riffTitle + ' arrangement'))}
      >Arrange this riff</RuneButton
    >
  {:else}
    <fieldset disabled={!ready || busy}>
      <legend class="sr-only">Arrangement controls</legend>
      <div class="summary">
        <strong>{Math.round(arrangementSeconds(project))} seconds</strong>
        <span
          >{project.sections.reduce((n, s) => n + s.bars, 0)} bars at {project.source.settings.bpm} BPM</span
        >
        <RuneButton variant="ghost" disabled={!history.length} onclick={undo}
          >Undo arrangement edit</RuneButton
        >
      </div>
      {#if changedSource}
        <p class="help">
          The riff editor has changed. This arrangement still uses its saved source riff.
        </p>
        <RuneButton
          variant="ghost"
          disabled={!draft.steps.some((s) => s.midi !== null)}
          onclick={() => {
            const next = clone(project!);
            next.source = JSON.parse(JSON.stringify(draft));
            replace(next);
          }}>Use current riff</RuneButton
        >
      {/if}
      <p><a href="#arrangement-output">Preview and export this arrangement</a></p>
      <div class="sections" aria-label="Song sections">
        {#each project.sections as s, i (i)}
          <button
            type="button"
            aria-pressed={selected === i}
            class:chosen={selected === i}
            onclick={() => (selected = i)}
            aria-label={'Section ' + (i + 1) + ' ' + s.name + ', ' + s.bars + ' bars'}
          >
            <span>{i + 1}. {s.name}</span><small>{s.bars} bars</small>
          </button>
        {/each}
      </div>
      {#if section}
        <div class="inspector">
          <label
            >Section name<select
              value={section.name}
              onchange={(e) =>
                updateSection({ name: e.currentTarget.value as ArrangementSection['name'] })}
              >{#each sectionNames as name (name)}<option>{name}</option>{/each}</select
            ></label
          >
          <label
            >Section length<select
              value={section.bars}
              onchange={(e) => updateSection({ bars: Number(e.currentTarget.value) })}
              >{#each [2, 4, 8, 16] as bars (bars)}<option value={bars}>{bars} bars</option
                >{/each}</select
            ></label
          >
          <label
            >Backing chord<select
              value={section.chord}
              onchange={(e) => updateSection({ chord: Number(e.currentTarget.value) })}
              >{#each [0, 1, 2, 3, 4, 5, 6] as degree (degree)}<option value={degree}
                  >{chordLabel(project, degree)}</option
                >{/each}</select
            ></label
          >
          <label
            >Section energy<select
              value={section.energy}
              onchange={(e) =>
                updateSection({ energy: e.currentTarget.value as ArrangementSection['energy'] })}
              ><option value="quiet">Quiet</option><option value="full">Full band</option></select
            ></label
          >
        </div>
        <div class="actions section-actions">
          <RuneButton variant="ghost" disabled={selected === 0} onclick={() => move(-1)}
            >Move earlier</RuneButton
          >
          <RuneButton
            variant="ghost"
            disabled={selected === project.sections.length - 1}
            onclick={() => move(1)}>Move later</RuneButton
          >
          <RuneButton
            variant="ghost"
            disabled={project.sections.length === 1}
            onclick={() => {
              const next = clone(project!);
              next.sections.splice(selected, 1);
              replace(next);
            }}>Remove section</RuneButton
          >
        </div>
      {/if}
      <RuneButton
        variant="ghost"
        disabled={project.sections.length >= 8}
        onclick={() => {
          const next = clone(project!);
          next.sections.push({ name: 'Verse', bars: 4, chord: 0, energy: 'full' });
          replace(next);
          selected = next.sections.length - 1;
        }}>Add section</RuneButton
      >
      <details class="mix">
        <summary>Mix and drum groove</summary>
        <div class="inspector">
          <label
            >Drum groove<select
              value={project.groove}
              onchange={(e) => {
                const next = clone(project!);
                next.groove = e.currentTarget.value as Arrangement['groove'];
                replace(next);
              }}
              ><option value="straight">Straight</option><option value="half-time">Half-time</option
              ></select
            ></label
          >
          {#each trackNames as track (track)}
            <label
              >{labels[track]} level ({project.levels[track]}%)<input
                aria-label={labels[track] + ' level'}
                type="range"
                min="0"
                max="100"
                step="1"
                value={project.levels[track]}
                oninput={(e) => {
                  const next = clone(project!);
                  next.levels[track] = Number(e.currentTarget.value);
                  replace(next);
                }}
              /></label
            >
          {/each}
        </div>
        <p class="help">
          Set a track to 0% to mute it. Chord changes affect the backing, not your riff’s notes.
          Listen for clashes and adjust.
        </p>
      </details>
      {#if issue}<p class="error">{issue}</p>{/if}
      <div class="actions" id="arrangement-output">
        <RuneButton
          disabled={!!issue}
          {busy}
          onclick={() =>
            action(async () => {
              await rendered();
              status = 'Arrangement rendered. Press play to listen.';
            })}>Render arrangement</RuneButton
        >
        <RuneButton
          variant="ghost"
          disabled={!!issue}
          onclick={() =>
            action(async () =>
              download(new Blob([await arrangementMidi(project!)], { type: 'audio/midi' }), 'mid')
            )}>Export multitrack MIDI</RuneButton
        >
        <RuneButton
          variant="ghost"
          disabled={!!issue}
          onclick={() => action(async () => download(await rendered(), 'wav'))}
          >Export arrangement WAV</RuneButton
        >
      </div>
    </fieldset>
    {#if audioUrl}<audio
        bind:this={audio}
        controls
        preload="metadata"
        src={audioUrl}
        aria-label="Arrangement preview"
      ></audio>{/if}
    <fieldset class="save" disabled={busy || !ready}>
      <legend>Keep this arrangement</legend>
      <label
        >Arrangement title<input
          maxlength="120"
          value={project.title}
          oninput={(e) => {
            const next = clone(project!);
            next.title = e.currentTarget.value;
            replace(next);
          }}
        /></label
      >
      <label class="check"
        ><input type="checkbox" bind:checked={rights} />I created this riff or have permission to
        arrange it.</label
      >
      <div class="actions">
        <RuneButton
          disabled={!rights || !project.title.trim() || !!issue || !!savedId}
          onclick={save}>Save arrangement to Library</RuneButton
        >
        <RuneButton
          variant="ghost"
          onclick={() =>
            download(
              new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }),
              'vbm.json'
            )}>Export editable project</RuneButton
        >
      </div>
      <p class="help">
        Library keeps the audio mix and MIDI. Editable sections and the source riff are {stored
          ? 'saved on this device only'
          : 'not saved on this device'}. Export the project to keep a portable backup.
      </p>
    </fieldset>
  {/if}
  <label class="import"
    >Open an exported VBM project<input
      type="file"
      accept=".json,application/json"
      disabled={!ready || busy}
      onchange={(e) => {
        const file = e.currentTarget.files?.[0];
        e.currentTarget.value = '';
        void openFile(file);
      }}
    /></label
  >
  <p role="status" class="status">{busy ? 'Working on your arrangement…' : status}</p>
  {#if error}<p role="alert" class="error">{error}</p>{/if}
  {#if savedId}<RuneButton variant="ghost" href={resolve('/library/[id]', { id: savedId })}
      >Open saved arrangement</RuneButton
    >{/if}
</section>

<style>
  .arranger {
    background: #191e27;
    border: 1px solid #3b4351;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 20px;
    scroll-margin-top: 96px;
    min-width: 0;
  }
  a {
    color: #75dfef;
  }
  h2 {
    margin: 0 0 12px;
    font-size: 1.35rem;
  }
  .help {
    color: #b9c5d3;
    font-size: 0.85rem;
    line-height: 1.6;
    margin: 12px 0 16px;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  legend {
    font-weight: 700;
    margin-bottom: 16px;
  }
  .summary,
  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .summary {
    margin: 16px 0;
    font-variant-numeric: tabular-nums;
  }
  .summary span,
  small {
    color: #b9c5d3;
  }
  .sections {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 16px 0;
  }
  .sections button {
    display: grid;
    gap: 8px;
    text-align: start;
    padding: 12px;
    min-height: 64px;
    border-radius: 8px;
    border: 1px solid #77889d;
    background: #10151d;
    color: #f2f4f7;
    font: inherit;
    cursor: pointer;
  }
  .sections button.chosen {
    border-color: #75dfef;
    background: #263540;
  }
  .inspector {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-block: 16px;
  }
  label {
    display: grid;
    gap: 8px;
    color: #d1dbe5;
    font-size: 0.9rem;
    min-width: 0;
  }
  select,
  input:not([type='checkbox']):not([type='range']) {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    min-height: 48px;
    padding: 12px;
    background: #10151d;
    color: #f2f4f7;
    border: 1px solid #77889d;
    border-radius: 10px;
    font: inherit;
  }
  select {
    padding-inline-end: 32px;
  }
  input[type='range'] {
    width: 100%;
    min-height: 44px;
    margin: 0;
    accent-color: #75dfef;
  }
  :is(select, input, button, summary):focus-visible {
    outline: 2px solid #75dfef;
    outline-offset: 3px;
  }
  .section-actions {
    margin-bottom: 16px;
  }
  .mix {
    border-block: 1px solid #3b4351;
    margin-block: 20px;
    padding-block: 12px;
  }
  summary {
    cursor: pointer;
    padding-block: 12px;
  }
  .save {
    margin-top: 24px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-block: 16px;
    line-height: 1.5;
  }
  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    flex: none;
    accent-color: #75dfef;
  }
  .import {
    margin-top: 20px;
  }
  .status {
    color: #75dfef;
    line-height: 1.5;
  }
  .error {
    color: #ffb3bd;
    line-height: 1.5;
  }
  audio {
    width: 100%;
    margin-top: 16px;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  @media (max-width: 600px) {
    .arranger {
      padding: 16px;
    }
    .sections {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 380px) {
    .inspector {
      grid-template-columns: 1fr;
    }
  }
  #arrangement-output {
    scroll-margin-top: 90px;
  }
</style>
