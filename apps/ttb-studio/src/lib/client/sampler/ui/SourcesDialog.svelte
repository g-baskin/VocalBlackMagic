<script lang="ts">
  import {
    maxSoundSeconds,
    soundCategories,
    stemNames,
    validateSliceRequest,
    type SliceRequest,
    type SongMeta,
    type SoundCategory,
    type SoundMeta
  } from '@vbm/contracts';
  import { api } from '../../api';

  let { open = $bindable(), onadded }: { open: boolean; onadded: (sounds: SoundMeta[]) => void } =
    $props();

  let dialog: HTMLDialogElement;
  let tab = $state<'slice' | 'upload'>('slice');
  let error = $state<string | null>(null);
  let busy = $state(false);
  let note = $state<string | null>(null);

  // Slice
  let songs = $state<SongMeta[]>([]);
  let voices = $state<{ id: string; performer: string }[]>([]);
  let from = $state<'song' | 'gold'>('song');
  let songId = $state('');
  let stem = $state<'main' | (typeof stemNames)[number]>('main');
  let voiceId = $state('');
  let mode = $state<'manual' | 'auto'>('manual');
  let start = $state(0);
  let end = $state(2);
  let name = $state('');
  let category = $state<SoundCategory>('impact');
  let player = $state<HTMLAudioElement | null>(null);

  // Upload
  let file = $state<File | null>(null);
  let uploadName = $state('');
  let uploadCategory = $state<SoundCategory>('drum');
  let attest = $state(false);
  let attestedName = $state('');

  const song = $derived(songs.find((s) => s.id === songId) ?? null);
  const stems = $derived(['main', ...(song?.stems?.map((s) => s.name) ?? [])]);
  const licence = $derived.by(() => {
    if (from !== 'song' || !song) return null;
    if (!song.runner) return 'This song has no licence record; treat its slices as unknown rights.';
    return song.runner.commercial
      ? 'Licence: ' + song.runner.license
      : 'Non-commercial: ' + song.runner.license + '. Slices carry this licence.';
  });
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      void loadSources();
    } else if (!open && dialog.open) dialog.close();
  });

  async function loadSources() {
    error = null;
    try {
      const [s, v] = await Promise.all([
        api<{ songs: SongMeta[] }>('/api/studio/songs'),
        api<{ voices: { id: string; performer: string }[] }>('/api/studio/voices')
      ]);
      songs = s.songs.filter((x) => x.audio);
      voices = v.voices;
      if (!songId && songs[0]) songId = songs[0].id;
      if (!voiceId && voices[0]) voiceId = voices[0].id;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load songs.';
    }
  }

  function mark(which: 'start' | 'end') {
    if (!player) return;
    const t = Math.round(player.currentTime * 100) / 100;
    if (which === 'start') start = t;
    else end = t;
  }

  async function slice() {
    const body: SliceRequest = {
      from,
      mode,
      start_seconds: Number(start),
      end_seconds: Number(end),
      name: name.trim() || (from === 'song' ? (song?.title ?? 'Slice') : 'Gold Vocal'),
      category,
      ...(from === 'song' ? { song_id: songId, stem } : { voice_id: voiceId })
    };
    const invalid = validateSliceRequest(body);
    if (invalid) {
      error = invalid;
      return;
    }
    busy = true;
    error = null;
    note = null;
    try {
      const out = await api<{ sounds: SoundMeta[] }>('/api/studio/sounds/slice', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      onadded(out.sounds);
      note = 'Added ' + out.sounds.length + (out.sounds.length === 1 ? ' sound.' : ' sounds.');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Slicing failed.';
    } finally {
      busy = false;
    }
  }

  function pick(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
    file = f;
    if (f && !uploadName) uploadName = f.name.replace(/\.[^.]+$/, '').slice(0, 80);
  }

  async function upload() {
    if (!file) return (error = 'Choose an audio file.');
    if (file.size > 20 * 1024 * 1024) return (error = 'Uploads can be at most 20 MB.');
    if (!attest || attestedName.trim().length < 2)
      return (error = 'Confirm your rights and type your full name.');
    busy = true;
    error = null;
    note = null;
    const q = new URLSearchParams({
      name: uploadName.trim() || 'Upload',
      category: uploadCategory,
      attested_name: attestedName.trim(),
      original_name: file.name
    });
    try {
      const response = await fetch('/api/studio/sounds/upload?' + q, {
        method: 'POST',
        headers: {
          'content-type': file.type || 'application/octet-stream',
          'x-vbm-intent': 'sound-upload',
          'x-vbm-rights': 'own-or-licensed'
        },
        body: file
      });
      const out = (await response.json().catch(() => ({}))) as {
        sound?: SoundMeta;
        detail?: string;
      };
      if (!response.ok || !out.sound)
        throw new Error(out.detail || 'Upload failed (' + response.status + ').');
      onadded([out.sound]);
      note = 'Added ' + out.sound.name + '.';
      file = null;
      uploadName = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Upload failed.';
    } finally {
      busy = false;
    }
  }
</script>

<dialog
  bind:this={dialog}
  class="sources"
  onclose={() => (open = false)}
  aria-labelledby="sources-title"
>
  <header>
    <h2 id="sources-title">Add sounds</h2>
    <button class="x" aria-label="Close" onclick={() => (open = false)}>✕</button>
  </header>
  <div class="tabs" role="tablist" aria-label="Source">
    <button role="tab" aria-selected={tab === 'slice'} onclick={() => (tab = 'slice')}
      >Slice a song</button
    >
    <button role="tab" aria-selected={tab === 'upload'} onclick={() => (tab = 'upload')}
      >Upload</button
    >
  </div>

  {#if tab === 'slice'}
    <div class="form">
      <fieldset class="row">
        <legend class="caps">From</legend>
        <label><input type="radio" bind:group={from} value="song" /> Library song or stem</label>
        <label
          ><input type="radio" bind:group={from} value="gold" disabled={!voices.length} /> Gold
          Vocal
          {#if !voices.length}<small>(no consented voice yet)</small>{/if}</label
        >
      </fieldset>
      {#if from === 'song'}
        <label>
          <span class="caps">Song</span>
          <select bind:value={songId}>
            {#each songs as s (s.id)}<option value={s.id}>{s.title}</option>{/each}
          </select>
        </label>
        <label>
          <span class="caps">Part</span>
          <select bind:value={stem}>
            {#each stems as st (st)}<option value={st}
                >{st === 'main' ? 'Full mix' : cap(st)}</option
              >{/each}
          </select>
        </label>
        {#if songId}
          <audio
            bind:this={player}
            controls
            preload="metadata"
            src={'/api/studio/songs/' + encodeURIComponent(songId) + '/audio?stem=' + stem}
          ></audio>
          <div class="row">
            <button type="button" onclick={() => mark('start')}>Set start here</button>
            <button type="button" onclick={() => mark('end')}>Set end here</button>
          </div>
        {/if}
        {#if licence}<p class="licence">{licence}</p>{/if}
      {:else}
        <label>
          <span class="caps">Voice</span>
          <select bind:value={voiceId}>
            {#each voices as v (v.id)}<option value={v.id}>{v.performer}</option>{/each}
          </select>
        </label>
        <p class="licence">
          Only voices with an own-voice consent record are listed. The consent reference is saved
          with each slice.
        </p>
      {/if}
      <div class="row">
        <label
          ><span class="caps">Start (s)</span><input
            type="number"
            min="0"
            step="0.01"
            bind:value={start}
          /></label
        >
        <label
          ><span class="caps">End (s)</span><input
            type="number"
            min="0"
            step="0.01"
            bind:value={end}
          /></label
        >
      </div>
      <fieldset class="row">
        <legend class="caps">Cut</legend>
        <label
          ><input type="radio" bind:group={mode} value="manual" /> One slice (up to {maxSoundSeconds}
          s)</label
        >
        <label
          ><input type="radio" bind:group={mode} value="auto" /> Split at silences (up to 64)</label
        >
      </fieldset>
      <div class="row">
        <label
          ><span class="caps">Name</span><input
            type="text"
            maxlength="80"
            bind:value={name}
          /></label
        >
        <label>
          <span class="caps">Category</span>
          <select bind:value={category}>
            {#each soundCategories as c (c)}<option value={c}>{cap(c)}</option>{/each}
          </select>
        </label>
      </div>
      <button class="go" disabled={busy || (from === 'song' ? !songId : !voiceId)} onclick={slice}
        >{busy ? 'Slicing…' : 'Slice'}</button
      >
    </div>
  {:else}
    <div class="form">
      <label>
        <span class="caps">Audio file (WAV, MP3, FLAC or OGG; 30 s and 20 MB at most)</span>
        <input
          type="file"
          accept="audio/wav,audio/mpeg,audio/flac,audio/ogg,.wav,.mp3,.flac,.ogg"
          onchange={pick}
        />
      </label>
      <div class="row">
        <label
          ><span class="caps">Name</span><input
            type="text"
            maxlength="80"
            bind:value={uploadName}
          /></label
        >
        <label>
          <span class="caps">Category</span>
          <select bind:value={uploadCategory}>
            {#each soundCategories as c (c)}<option value={c}>{cap(c)}</option>{/each}
          </select>
        </label>
      </div>
      <label class="check">
        <input type="checkbox" bind:checked={attest} />
        I made this audio or have the rights to use it, and it does not imitate anyone's voice without
        their permission.
      </label>
      <label
        ><span class="caps">Your full name</span><input
          type="text"
          maxlength="80"
          autocomplete="name"
          bind:value={attestedName}
        /></label
      >
      <button class="go" disabled={busy || !file} onclick={upload}
        >{busy ? 'Uploading…' : 'Upload'}</button
      >
    </div>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if note}<p class="note" role="status">{note}</p>{/if}
</dialog>

<style>
  .sources {
    --pads-font: var(--vbm-font-sans);
    --pads-text: var(--vbm-text);
    --pads-muted: var(--vbm-muted);
    --pads-line: var(--vbm-border-strong);
    --pads-field: rgb(255 255 255 / 4%);
    --pads-focus: var(--vbm-blue);
    width: min(560px, calc(100vw - 2rem));
    max-height: calc(100vh - 2rem);
    border: 1px solid var(--pads-line);
    border-radius: 16px;
    background: var(--vbm-surface);
    color: var(--pads-text);
    padding: 1.2rem 1.4rem;
    font-family: var(--pads-font);
  }
  .sources::backdrop {
    background: rgb(4 4 10 / 70%);
    backdrop-filter: blur(3px);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    margin: 0;
    font-size: 1.1rem;
    font-family: var(--pads-font);
    letter-spacing: 0;
  }
  .x {
    border: 0;
    background: none;
    color: var(--pads-muted);
    font-size: 1rem;
    cursor: pointer;
  }
  .tabs {
    display: flex;
    gap: 0.3rem;
    margin: 0.9rem 0;
    padding: 0.25rem;
    border: 1px solid var(--pads-line);
    border-radius: 10px;
  }
  .tabs button {
    flex: 1;
    border: 0;
    background: none;
    color: var(--pads-muted);
    padding: 0.45rem;
    border-radius: 7px;
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;
  }
  .tabs button[aria-selected='true'] {
    background: #eceaf5;
    color: #15131f;
  }
  .form {
    display: grid;
    gap: 0.75rem;
  }
  .form label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.82rem;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
  }
  .row {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    align-items: end;
  }
  .row > label {
    flex: 1;
    min-width: 8rem;
  }
  fieldset.row label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  legend {
    width: 100%;
    margin-bottom: 0.3rem;
  }
  .caps {
    font-family: var(--vbm-font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pads-muted);
  }
  input[type='text'],
  input[type='number'],
  select {
    border: 1px solid var(--pads-line);
    background: var(--pads-field);
    color: var(--pads-text);
    border-radius: 9px;
    padding: 0.5rem 0.65rem;
    font: inherit;
    font-size: 0.85rem;
  }
  audio {
    width: 100%;
  }
  option {
    background: #1a1830;
  }
  .row button {
    border: 1px solid var(--pads-line);
    background: rgb(255 255 255 / 3%);
    color: var(--pads-text);
    border-radius: 9px;
    padding: 0.45rem 0.7rem;
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .check {
    display: flex !important;
    grid-template-columns: none;
    align-items: flex-start;
    gap: 0.5rem !important;
  }
  .licence {
    margin: 0;
    font-size: 0.78rem;
    color: #ffd27a;
  }
  .go {
    border: 0;
    border-radius: 10px;
    padding: 0.65rem;
    font: inherit;
    font-weight: 600;
    background: var(--vbm-gradient);
    color: var(--vbm-on-accent);
    cursor: pointer;
  }
  .go:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .error {
    color: #ff8a8a;
    font-size: 0.82rem;
  }
  .note {
    color: #8fe6f2;
    font-size: 0.82rem;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--pads-focus);
    outline-offset: 1px;
  }
</style>
