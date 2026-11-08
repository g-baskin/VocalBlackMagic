<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import ArcaneTextarea from '@vbm/ui/ArcaneTextarea.svelte';
  import ArcaneSelect from '@vbm/ui/ArcaneSelect.svelte';
  import RuneToggle from '@vbm/ui/RuneToggle.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import {
    soundCharacters,
    soundCharacterNames,
    validateCreateSongRequest,
    type CreateSongRequest,
    type LyricSheet,
    type SongMeta,
    type SoundCharacter,
    type StudioEngine,
    type StudioEngineInfo,
    type StudioJob,
    type StudioModel,
    type StudioModelInfo,
    studioModels
  } from '@vbm/contracts';
  import { api, sleep } from '../lib/client/api';
  import SongCard from '../lib/client/SongCard.svelte';
  import ModelPicker, { type PickerItem } from '../lib/client/ModelPicker.svelte';

  type Caps = {
    allowed: boolean;
    engines: StudioEngineInfo[];
    models?: StudioModelInfo[];
    lyrics_ready: boolean;
  };

  let mode = $state<'simple' | 'custom'>('simple');
  let description = $state('An upbeat summer pop song about road trips with friends');
  let title = $state('');
  let stylePrompt = $state(
    'Bright summer pop, punchy drums, warm synths, catchy hook, female vocal'
  );
  let tagText = $state('pop, summer, upbeat');
  let lyrics = $state('');
  let instrumental = $state(false);
  let engine = $state<string>('minimax-music-1.5');
  let duration = $state('120');
  let takes = $state('2');
  let coverArt = $state(true);
  let sungBy = $state('');
  let referenceSong = $state('');
  let voices = $state<{ id: string; performer: string }[]>([]);
  let librarySongs = $state<SongMeta[]>([]);
  let character = $state<string>('clean');
  let caps = $state<Caps | null>(null);
  let capsError = $state<string | null>(null);
  let job = $state<StudioJob | null>(null);
  let songs = $state<SongMeta[]>([]);
  let error = $state<string | null>(null);
  let busy = $state(false);
  let writtenLyrics = $state<string | null>(null);
  let lyricsNote = $state(false);
  let alive = true;
  const lyricPlaceholder = ['[Verse]', '…', '[Chorus]', '…'].join('\n');

  const isModel = (id: string): id is StudioModel =>
    (studioModels as readonly string[]).includes(id);
  const picked = $derived(
    isModel(engine) ? (caps?.models?.find((m) => m.id === engine) ?? null) : null
  );
  const legacy = $derived(caps?.engines.find((e) => e.id === engine) ?? null);
  // Routed models share one shape with legacy engines so the rest of the form stays the same.
  const spec = $derived(
    picked
      ? {
          status: picked.active_runner ? 'ready' : 'unavailable',
          duration: { min: 10, max: 240 },
          est_cost_usd: picked.est_cost_usd,
          max_prompt: 2000,
          max_lyrics: 4096 as number | null
        }
      : legacy
  );
  const pickerItems = $derived<PickerItem[]>([
    ...(caps?.models ?? []).map((m) => {
      const run = m.runners.find((r) => r.kind === m.active_runner) ?? m.runners[0];
      const fits = instrumental ? m.instrumental : m.vocals;
      return {
        value: m.id,
        name: m.name,
        group: m.open ? ('open' as const) : ('hosted' as const),
        runner: m.active_runner,
        license: run.license,
        commercial: run.commercial,
        detail:
          (m.vocals
            ? m.instrumental
              ? 'Vocals or instrumental'
              : 'Vocals'
            : 'Instrumental only') +
          ' · ' +
          run.model_version +
          ' · about $' +
          m.est_cost_usd.toFixed(2) +
          ' per take' +
          m.runners
            .filter((r) => !r.commercial && r !== run)
            .map((r) => ' · ' + r.model_version + ' is Non-commercial (' + r.license + ')')
            .join(''),
        reason: !m.active_runner
          ? 'Unavailable: ' + m.runners.map((r) => r.status).join('; ')
          : !fits
            ? instrumental
              ? 'Cannot make instrumentals.'
              : 'Instrumental only.'
            : null,
        disabled: !m.active_runner || !fits
      };
    }),
    ...(caps?.engines ?? []).map((e) => ({
      value: e.id,
      name: e.name.split(' (')[0].split(' —')[0],
      group: 'hosted' as const,
      runner:
        e.status === 'ready'
          ? e.id.startsWith('fal')
            ? 'fal'
            : e.id === 'lyria-3.5'
              ? 'gemini'
              : 'replicate'
          : null,
      license: legacyLicense[e.id] ?? 'Hosted API',
      commercial: true,
      detail: e.name,
      reason:
        e.status !== 'ready'
          ? 'Unavailable: ' + e.status
          : (instrumental ? !e.instrumental : !e.vocals)
            ? instrumental
              ? 'Cannot make instrumentals.'
              : 'Instrumental only.'
            : null,
      disabled: e.status !== 'ready' || (instrumental ? !e.instrumental : !e.vocals)
    }))
  ]);
  // Weights licence for the open models behind the older engine ids; hosted APIs fall
  // back to 'Hosted API' (their terms, not an open licence). ACE-Step v1: Apache-2.0
  // (github.com/ace-step/ACE-Step); ACE-Step 1.5: MIT (huggingface.co/ACE-Step/Ace-Step1.5).
  const legacyLicense: Record<string, string> = {
    'ace-step-replicate': 'Apache-2.0',
    'fal-ace-step': 'MIT'
  };
  const characterOptions = soundCharacters.map((c) => ({
    value: c,
    label: soundCharacterNames[c]
  }));
  const takeOptions = [
    { value: '2', label: 'Two takes', hint: 'Like Suno: two variations, double the cost' },
    { value: '1', label: 'One take' }
  ];
  const tags = $derived(
    tagText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)
  );
  const voiceSummon = $derived(mode === 'custom' && !!sungBy && !instrumental);
  const estimate = $derived(
    voiceSummon
      ? (0.035 + (coverArt ? 0.003 : 0)) * Number(takes)
      : spec
        ? (spec.est_cost_usd + (coverArt ? 0.003 : 0)) * Number(takes)
        : 0
  );
  const sungByOptions = $derived([
    { value: '', label: "The engine's own voice" },
    ...voices.map((v) => ({
      value: v.id,
      label: v.performer,
      hint: 'Your trained voice, sung via its Gold Vocal (MiniMax Music-01, ~$0.035, lyrics up to ~380 characters)'
    }))
  ]);
  const referenceOptions = $derived(
    librarySongs
      .filter((s) => s.audio && s.kind !== 'stems')
      .map((s) => ({
        value: s.id,
        label: s.title,
        hint: 'Its music (drums, bass and other stems if split) guides the new song'
      }))
  );
  $effect(() => {
    if (sungBy && !referenceSong && referenceOptions[0]) referenceSong = referenceOptions[0].value;
  });
  const running = $derived(job?.status === 'running' || job?.status === 'queued');

  // Pick a usable engine whenever the instrumental switch changes what is allowed.
  $effect(() => {
    const options = pickerItems;
    if (options.length && options.find((o) => o.value === engine)?.disabled) {
      const next = options.find((o) => !o.disabled);
      if (next) engine = next.value;
    }
  });

  onMount(async () => {
    api<{ voices: { id: string; performer: string }[] }>('/api/studio/voices')
      .then((r) => (voices = r.voices))
      .catch(() => undefined);
    api<{ songs: SongMeta[] }>('/api/studio/songs')
      .then((r) => (librarySongs = r.songs))
      .catch(() => undefined);
    const prefill = sessionStorage.getItem('vbm-studio-prefill');
    if (prefill) {
      sessionStorage.removeItem('vbm-studio-prefill');
      try {
        const data = JSON.parse(prefill) as { title?: string; lyrics?: string; prompt?: string };
        mode = 'custom';
        title = data.title ?? '';
        lyrics = data.lyrics ?? '';
        if (data.prompt) stylePrompt = data.prompt.slice(0, 300);
      } catch {
        // ignore a malformed hand-off
      }
    }
    const sheetId = new URLSearchParams(location.search).get('lyrics');
    if (sheetId) {
      api<{ sheet: LyricSheet }>('/api/studio/uploads/lyrics/' + encodeURIComponent(sheetId))
        .then(({ sheet }) => {
          mode = 'custom';
          lyrics = sheet.text;
          if (!title.trim()) title = sheet.title;
          lyricsNote = true;
        })
        .catch(
          (e) => (error = e instanceof Error ? e.message : 'Those lyrics could not be loaded.')
        );
    }
    try {
      caps = await api<Caps>('/api/studio/capabilities');
    } catch (e) {
      capsError = e instanceof Error ? e.message : 'The studio could not be reached.';
    }
  });
  onDestroy(() => (alive = false));

  function buildRequest(): CreateSongRequest {
    const custom = mode === 'custom';
    return {
      mode,
      prompt: custom ? stylePrompt : description,
      title: custom ? title : '',
      lyrics: custom && !instrumental && lyrics.trim() ? lyrics : null,
      style_tags: tags,
      instrumental,
      engine: (isModel(engine) ? 'minimax-music-1.5' : engine) as StudioEngine,
      model: isModel(engine) ? engine : null,
      duration_seconds: spec?.duration ? Number(duration) : null,
      sound_character: character as SoundCharacter,
      takes: takes === '1' ? 1 : 2,
      cover: coverArt,
      voice_id: custom && sungBy ? sungBy : null,
      reference_song_id: custom && sungBy ? referenceSong : null
    };
  }

  async function poll(id: string) {
    while (alive) {
      await sleep(4000);
      try {
        const reply = await api<{ job: StudioJob }>('/api/studio/jobs/' + id);
        job = reply.job;
      } catch (e) {
        error = (e instanceof Error ? e.message : 'Lost contact with the studio.') + ' Retrying…';
        continue;
      }
      error = null;
      if (job.status !== 'running' && job.status !== 'queued') break;
    }
    if (!job) return;
    if (job.status === 'failed' || job.status === 'canceled')
      error = job.detail ?? 'Generation failed.';
    songs = [];
    for (const songId of job.song_ids)
      songs.push((await api<{ song: SongMeta }>('/api/studio/songs/' + songId)).song);
  }

  async function summon() {
    const request = buildRequest();
    const invalid = validateCreateSongRequest(request);
    if (invalid) {
      error = invalid;
      return;
    }
    busy = true;
    error = null;
    songs = [];
    writtenLyrics = null;
    job = null;
    try {
      const reply = await api<{ job: StudioJob; lyrics: string | null; title: string }>(
        '/api/studio/songs',
        { method: 'POST', body: JSON.stringify(request) }
      );
      job = reply.job;
      if (!request.lyrics && reply.lyrics) writtenLyrics = reply.lyrics;
      busy = false;
      await poll(reply.job.id);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not start the song.';
    } finally {
      busy = false;
    }
  }

  async function cancel() {
    if (!job) return;
    try {
      job = (await api<{ job: StudioJob }>('/api/studio/jobs/' + job.id, { method: 'DELETE' })).job;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not cancel.';
    }
  }

  function insertTag(tag: string) {
    lyrics = (lyrics.trimEnd() ? lyrics.trimEnd() + '\n\n' : '') + '[' + tag + ']\n';
  }
</script>

<svelte:head><title>Create · VBM Studio</title></svelte:head>

<div class="page create">
  <header class="hero">
    <h1>Make a song</h1>
    <p>Describe it in a sentence, or switch to Custom and write your own lyrics.</p>
    <RuneButton variant="ghost" href={resolve('/upload')}>Upload audio or lyrics</RuneButton>
  </header>

  {#if lyricsNote}
    <div class="loaded-note" role="status">
      <span>Lyrics loaded from your upload</span>
      <button type="button" aria-label="Dismiss" onclick={() => (lyricsNote = false)}>×</button>
    </div>
  {/if}

  {#if capsError}
    <OracleStatus tone="danger">{capsError}</OracleStatus>
  {:else if caps && !caps.allowed}
    <OracleStatus tone="warning"
      >Creating songs is turned off outside development mode.</OracleStatus
    >
  {/if}

  <div class="layout">
    <section class="composer" aria-label="Song prompt">
      <div class="modes" role="radiogroup" aria-label="Creation mode">
        <button
          role="radio"
          aria-checked={mode === 'simple'}
          class:on={mode === 'simple'}
          onclick={() => (mode = 'simple')}>Simple</button
        >
        <button
          role="radio"
          aria-checked={mode === 'custom'}
          class:on={mode === 'custom'}
          onclick={() => (mode = 'custom')}>Custom</button
        >
      </div>
      <div class="fields">
        {#if mode === 'simple'}
          <div class="prompt">
            <ArcaneTextarea
              label="Song description"
              bind:value={description}
              rows={5}
              maxlength={3000}
              placeholder="An upbeat pop song about…"
            />
          </div>
          <p class="aside">We write the lyrics and a title, then the model sings them.</p>
        {:else}
          <ArcaneInput
            label="Title (optional)"
            bind:value={title}
            maxlength={120}
            placeholder="Untitled song"
          />
          <ArcaneTextarea
            label="Style of music"
            bind:value={stylePrompt}
            rows={3}
            maxlength={spec?.max_prompt ?? 3000}
          />
          {#if !instrumental}
            <ArcaneTextarea
              label="Lyrics (leave empty and we write them)"
              bind:value={lyrics}
              rows={10}
              maxlength={spec?.max_lyrics ?? 15000}
              placeholder={lyricPlaceholder}
            />
            <div class="tagbar" aria-label="Insert section tag">
              {#each ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro'] as tag (tag)}
                <button type="button" onclick={() => insertTag(tag)}>[{tag}]</button>
              {/each}
            </div>
          {/if}
        {/if}
        <ArcaneInput label="Style tags (comma separated)" bind:value={tagText} maxlength={400} />
        {#if tags.length}
          <ul class="chips" aria-label="Style tags">
            {#each tags as tag (tag)}<li>{tag}</li>{/each}
          </ul>
        {/if}
        <RuneToggle
          label="Instrumental"
          bind:checked={instrumental}
          hint="No vocals. Some models only make instrumentals."
        />
      </div>
      <div class="go">
        <RuneButton
          onclick={summon}
          busy={busy || running}
          disabled={!caps?.allowed || !spec || spec.status !== 'ready'}
        >
          ♪ Create
        </RuneButton>
        {#if running}<RuneButton variant="ghost" onclick={cancel}>Cancel</RuneButton>{/if}
        <p class="price">Estimated cost <strong>${estimate.toFixed(3)}</strong></p>
      </div>
    </section>

    <ArcanePanel eyebrow="Settings" title="Model & options" glow="ember">
      <div class="fields">
        {#if mode === 'custom' && !instrumental}
          <ArcaneSelect label="Sung by" bind:value={sungBy} options={sungByOptions} />
          {#if sungBy}
            {#if referenceOptions.length}
              <ArcaneSelect
                label="Music reference"
                bind:value={referenceSong}
                options={referenceOptions}
              />
            {:else}
              <p class="aside">
                Create a song first: singing with your voice needs a library song as its music
                reference.
              </p>
            {/if}
          {:else if !voices.length}
            <p class="aside">
              Create your own voice in Vocal Fix's Voice training to sing with it here.
            </p>
          {/if}
        {/if}
        {#if voiceSummon}
          <p class="aside">Model: MiniMax Music-01 with your voice's Gold Vocal as reference.</p>
        {:else if caps}
          <ModelPicker items={pickerItems} bind:value={engine} />
        {:else if !capsError}
          <SigilLoader label="Loading models…" size={40} />
        {/if}
        {#if spec?.duration}
          <ArcaneInput
            label={'Length in seconds (' + spec.duration.min + '–' + spec.duration.max + ')'}
            type="number"
            bind:value={duration}
          />
        {:else if spec}
          <p class="aside">This model chooses the song length itself.</p>
        {/if}
        <ArcaneSelect label="Sound character" bind:value={character} options={characterOptions} />
        <RuneToggle
          label="Generate cover art"
          bind:checked={coverArt}
          hint="One cover per take with FLUX Schnell, about $0.003 each."
        />
        <ArcaneSelect label="Takes" bind:value={takes} options={takeOptions} />
      </div>
    </ArcanePanel>
  </div>

  {#if error}<OracleStatus tone="danger">{error}</OracleStatus>{/if}

  {#if job}
    <ArcanePanel eyebrow="Progress" title="Making your song" glow="teal">
      <div class="progress">
        {#if running}<SigilLoader label="Generating…" />{/if}
        <RitualProgress stages={job.stages} detail={job.detail} />
      </div>
      {#if writtenLyrics}
        <details class="written">
          <summary>Lyrics we wrote</summary>
          <pre>{writtenLyrics}</pre>
        </details>
      {/if}
    </ArcanePanel>
  {/if}

  {#if songs.length}
    <section class="takes" aria-label="Your new songs">
      {#each songs as song (song.id)}
        <SongCard {song} eyebrow={'Take ' + (song.params.take ?? 1)} />
      {/each}
    </section>
  {/if}
</div>

<style>
  .loaded-note {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0 0 1rem;
    padding: 0.6rem 0.9rem;
    border-radius: 12px;
    background: var(--vbm-surface-2);
    border: 1px solid var(--vbm-border);
    color: var(--vbm-text);
    font-size: 0.9rem;
  }
  .loaded-note button {
    background: none;
    border: 0;
    color: var(--vbm-muted);
    font-size: 1.2rem;
    cursor: pointer;
  }
  .hero {
    text-align: center;
    margin: 0.5rem 0 0;
  }
  .hero h1 {
    margin: 0;
    font-size: clamp(1.75rem, 6vw, 2.75rem);
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .hero p {
    margin: 0.4rem auto 0;
    max-width: 36rem;
    color: var(--vbm-muted);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 1.25rem;
    align-items: start;
  }
  .composer {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--vbm-surface);
    border: 1px solid var(--vbm-border);
    border-radius: var(--vbm-radius-lg);
    box-shadow: var(--vbm-shadow-lg);
  }
  .fields {
    display: grid;
    gap: 1rem;
  }
  .prompt :global(textarea) {
    font-size: 1.15rem;
    min-height: 8rem;
  }
  .modes {
    justify-self: start;
    display: inline-flex;
    padding: 0.25rem;
    gap: 0.25rem;
    background: var(--vbm-surface-2);
    border: 1px solid var(--vbm-border);
    border-radius: var(--vbm-radius-pill);
  }
  .modes button {
    min-height: 40px;
    min-width: 6rem;
    border: 0;
    border-radius: var(--vbm-radius-pill);
    background: transparent;
    color: var(--vbm-muted);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .modes button.on {
    background: var(--vbm-text);
    color: #121216;
  }
  .tagbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .tagbar button {
    min-height: 36px;
    padding: 0.25rem 0.7rem;
    background: var(--vbm-surface-2);
    color: var(--vbm-text);
    border: 1px solid var(--vbm-border-strong);
    border-radius: var(--vbm-radius-pill);
    font-family: var(--vbm-font-mono);
    font-size: 0.8rem;
    cursor: pointer;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .chips li {
    background: rgb(79 139 255 / 14%);
    color: var(--vbm-blue-text);
    padding: 0.2rem 0.7rem;
    border-radius: var(--vbm-radius-pill);
    font-size: 0.85rem;
    font-weight: 500;
  }
  .aside {
    margin: 0;
    color: var(--vbm-muted);
    font-size: 0.9rem;
  }
  .go {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .go :global(.summon) {
    min-height: 52px;
    padding-inline: 2.25rem;
    font-size: 1.05rem;
  }
  .price {
    margin: 0 0 0 auto;
    font-size: 0.85rem;
    color: var(--vbm-muted);
  }
  .progress {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .written pre {
    white-space: pre-wrap;
    font-family: var(--vbm-font-sans);
    font-size: 1rem;
  }
  .takes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: 1rem;
  }
  @media (max-width: 860px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 520px) {
    .composer {
      padding: 1rem;
    }
    .go :global(.summon) {
      flex: 1 1 100%;
    }
    .price {
      margin: 0;
    }
  }
</style>
