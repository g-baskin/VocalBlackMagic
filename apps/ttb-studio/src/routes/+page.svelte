<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
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
  import SongTake from '../lib/client/SongTake.svelte';
  import ModelPicker, { type PickerItem } from '../lib/client/ModelPicker.svelte';

  type Caps = {
    allowed: boolean;
    engines: StudioEngineInfo[];
    models?: StudioModelInfo[];
    lyrics_ready: boolean;
  };

  let mode = $state<'simple' | 'custom'>('simple');
  let description = $state('A haunted gothic synth-pop hymn about lighting candles for the lost');
  let title = $state('');
  let stylePrompt = $state(
    'Dark gothic synth-pop, choir pads, pulsing bass, ethereal female vocal'
  );
  let tagText = $state('gothic, synth-pop, cinematic');
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
      hint: 'Your forged voice, sung via its Gold Vocal (MiniMax Music-01, ~$0.035, lyrics up to ~380 characters)'
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
        error = (e instanceof Error ? e.message : 'Lost contact with the ritual.') + ' Retrying…';
        continue;
      }
      error = null;
      if (job.status !== 'running' && job.status !== 'queued') break;
    }
    if (!job) return;
    if (job.status === 'failed' || job.status === 'canceled')
      error = job.detail ?? 'The ritual failed.';
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
      error = e instanceof Error ? e.message : 'The summoning failed.';
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

<svelte:head><title>The Studio · Vocal Black Magic</title></svelte:head>

<div class="page">
  <header class="page-title">
    <h1>The Studio</h1>
    <p>
      Speak a description into the circle, or write every line yourself. Each take is bound to your
      library.
    </p>
  </header>

  {#if capsError}
    <OracleStatus tone="danger">{capsError}</OracleStatus>
  {:else if caps && !caps.allowed}
    <OracleStatus tone="warning">Summoning is sealed outside development mode.</OracleStatus>
  {/if}

  <div class="altar">
    <ArcanePanel
      eyebrow="Incantation"
      title={mode === 'simple' ? 'Simple summoning' : 'Custom ritual'}
    >
      {#snippet actions()}
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
      {/snippet}
      <div class="fields">
        {#if mode === 'simple'}
          <ArcaneTextarea
            label="Describe the song"
            bind:value={description}
            rows={4}
            maxlength={3000}
            placeholder="A song about…"
          />
          <p class="aside">The oracle writes the lyrics and a title, then the engine sings them.</p>
        {:else}
          <ArcaneInput
            label="Title (optional)"
            bind:value={title}
            maxlength={120}
            placeholder="Untitled spell"
          />
          <ArcaneTextarea
            label="Style of music"
            bind:value={stylePrompt}
            rows={3}
            maxlength={spec?.max_prompt ?? 3000}
          />
          {#if !instrumental}
            <ArcaneTextarea
              label="Lyrics (leave empty and the oracle writes them)"
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
      </div>
    </ArcanePanel>

    <ArcanePanel eyebrow="Vessel" title="Model & form" glow="ember">
      <div class="fields">
        <RuneToggle
          label="Instrumental"
          bind:checked={instrumental}
          hint="No vocals. Some engines only make instrumentals."
        />
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
                Summon a song first: a voice summon needs a library song as its music reference.
              </p>
            {/if}
          {:else if !voices.length}
            <p class="aside">
              Forge your own voice in Vocal Fix's Voice Forge to sing with it here.
            </p>
          {/if}
        {/if}
        {#if voiceSummon}
          <p class="aside">Engine: MiniMax Music-01 with your voice's Gold Vocal as reference.</p>
        {:else if caps}
          <ModelPicker items={pickerItems} bind:value={engine} />
        {:else if !capsError}
          <SigilLoader label="Reading the engines…" size={40} />
        {/if}
        {#if spec?.duration}
          <ArcaneInput
            label={'Length in seconds (' + spec.duration.min + '–' + spec.duration.max + ')'}
            type="number"
            bind:value={duration}
          />
        {:else if spec}
          <p class="aside">This engine chooses the song length itself.</p>
        {/if}
        <ArcaneSelect label="Sound character" bind:value={character} options={characterOptions} />
        <RuneToggle
          label="Conjure cover art"
          bind:checked={coverArt}
          hint="An arcane cover per take with FLUX Schnell, about $0.003 each."
        />
        <ArcaneSelect label="Takes" bind:value={takes} options={takeOptions} />
        <p class="price">Estimated cost: <strong>${estimate.toFixed(3)}</strong></p>
        <div class="summon">
          <RuneButton
            onclick={summon}
            busy={busy || running}
            disabled={!caps?.allowed || !spec || spec.status !== 'ready'}
          >
            Summon the song
          </RuneButton>
          {#if running}<RuneButton variant="ghost" onclick={cancel}>Banish</RuneButton>{/if}
        </div>
      </div>
    </ArcanePanel>
  </div>

  {#if error}<OracleStatus tone="danger">{error}</OracleStatus>{/if}

  {#if job}
    <ArcanePanel eyebrow="Ritual" title="The summoning" glow="teal">
      <div class="ritual">
        {#if running}<SigilLoader label="The engine is singing…" />{/if}
        <RitualProgress stages={job.stages} detail={job.detail} />
      </div>
      {#if writtenLyrics}
        <details class="written">
          <summary>Lyrics written by the oracle</summary>
          <pre>{writtenLyrics}</pre>
        </details>
      {/if}
    </ArcanePanel>
  {/if}

  {#if songs.length}
    <section class="takes" aria-label="Summoned takes">
      {#each songs as song (song.id)}
        <ArcanePanel eyebrow={'Take ' + (song.params.take ?? 1)} title={song.title} glow="violet">
          <SongTake {song} />
        </ArcanePanel>
      {/each}
    </section>
  {/if}
</div>

<style>
  .altar {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: 1.5rem;
  }
  .fields {
    display: grid;
    gap: 1rem;
  }
  .modes {
    display: inline-flex;
    border: 1px solid var(--vbm-violet-deep);
    border-radius: 999px;
    overflow: hidden;
  }
  .modes button,
  .tagbar button {
    background: transparent;
    color: inherit;
    border: 0;
    padding: 0.4rem 0.9rem;
    font-family: var(--vbm-font-display);
    letter-spacing: 0.1em;
    cursor: pointer;
  }
  .modes button.on {
    background: var(--vbm-violet-deep);
    color: #fff;
  }
  .tagbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .tagbar button {
    border: 1px dashed var(--vbm-violet);
    border-radius: 4px;
    font-family: var(--vbm-font-mono);
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
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
    border: 1px solid var(--vbm-teal-deep);
    color: var(--vbm-teal);
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.85rem;
  }
  .aside {
    margin: 0;
    opacity: 0.72;
    font-style: italic;
  }
  .price {
    margin: 0;
    font-family: var(--vbm-font-mono);
    font-size: 0.85rem;
  }
  .summon {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .ritual {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .written pre {
    white-space: pre-wrap;
    font-family: var(--vbm-font-body);
    font-size: 1.05rem;
  }
  .takes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
    gap: 1.5rem;
  }
  @media (max-width: 820px) {
    .altar {
      grid-template-columns: 1fr;
    }
  }
</style>
