<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
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
  import { ApiError, api, sleep } from '../lib/client/api';
  import SongCard from '../lib/client/SongCard.svelte';
  import ModelPicker, { type PickerItem } from '../lib/client/ModelPicker.svelte';
  import StyleTagPicker from '../lib/client/StyleTagPicker.svelte';
  import { parseTags } from '../lib/client/style-tags';
  import { rewritePrompt, rewriteTagText } from '../lib/client/artist-styles';
  import {
    MAX_LYRICS_CHARS,
    MAX_STYLE_CHARS,
    fitProblem,
    sentStyle,
    splitFullPrompt,
    isPaste,
    splitLyricsPaste,
    suggestTitle,
    tagsAfterStylePaste,
    tagsFromStyle,
    type SplitPrompt
  } from '../lib/client/full-prompt';

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
  let capsTry = $state(0);
  let job = $state<StudioJob | null>(null);
  let songs = $state<SongMeta[]>([]);
  let error = $state<string | null>(null);
  let busy = $state(false);
  let writtenLyrics = $state<string | null>(null);
  let lyricsNote = $state(false);
  // What the form held before a pasted full prompt was split, so Undo can put it back.
  let beforeSplit = $state<{
    mode: 'simple' | 'custom';
    description: string;
    stylePrompt: string;
    title: string;
    lyrics: string;
    tagText: string;
    character: string;
    instrumental: boolean;
  } | null>(null);
  let splitTags = $state(0);
  // A prompt Undo restored, so it is not split again straight away.
  let skipSplit = '';
  let alive = true;
  const lyricPlaceholder = ['[Verse]', '…', '[Chorus]', '…'].join('\n');

  const isModel = (id: string): id is StudioModel =>
    (studioModels as readonly string[]).includes(id);
  const picked = $derived(
    isModel(engine) ? (caps?.models?.find((m) => m.id === engine) ?? null) : null
  );
  const legacy = $derived(caps?.engines.find((e) => e.id === engine) ?? null);
  const routedLimits = { max_prompt: 2000, max_lyrics: 4096 };
  // Routed models share one shape with legacy engines so the rest of the form stays the same.
  const spec = $derived(
    picked
      ? {
          status: picked.active_runner ? 'ready' : 'unavailable',
          duration: { min: 10, max: 240 },
          est_cost_usd: picked.est_cost_usd,
          max_prompt: routedLimits.max_prompt,
          max_lyrics: routedLimits.max_lyrics as number | null
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
            : mode === 'custom'
              ? fitFor(routedLimits)
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
            : mode === 'custom'
              ? fitFor(e)
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
  const tags = $derived(parseTags(tagText));
  // A pasted full prompt (style block, then "Lyrics" and [Verse]/[Chorus] sections).
  const fullSplit = $derived(splitFullPrompt(mode === 'custom' ? stylePrompt : description));
  const styleSent = $derived(
    sentStyle(mode === 'custom' ? stylePrompt : description, tags, character as SoundCharacter)
  );
  const lyricsSent = $derived(mode === 'custom' && !instrumental ? lyrics.trim().length : 0);
  const fitFor = (limits: { max_prompt: number; max_lyrics: number | null } | null | undefined) =>
    fitProblem(limits, styleSent.length, lyricsSent);
  // Simple mode sends a description to the lyricist, not to the model, so only Custom is checked.
  // Boxes take a whole pasted prompt (no maxlength cut-off) so it can be split; the limit is here.
  const overCap = $derived.by(() => {
    const length = (mode === 'custom' ? stylePrompt : description).length;
    if (fullSplit || length <= MAX_STYLE_CHARS) return null;
    return `${mode === 'custom' ? 'Style' : 'The description'} is ${length} characters; the most is ${MAX_STYLE_CHARS}.`;
  });
  const tooLong = $derived(overCap ?? (mode === 'custom' && !sungBy ? fitFor(spec) : null));
  const fitsElsewhere = $derived(
    tooLong && !overCap
      ? pickerItems
          .filter((item) => !item.disabled && item.value !== engine && !item.reason)
          .map((item) => item.name)
      : []
  );

  function useSplit(split: SplitPrompt | null = fullSplit) {
    if (!split) return;
    beforeSplit = {
      mode,
      description,
      stylePrompt,
      title,
      lyrics,
      tagText,
      character,
      instrumental
    };
    if (mode === 'simple') description = '';
    mode = 'custom';
    stylePrompt = split.style.slice(0, MAX_STYLE_CHARS);
    lyrics = split.lyrics.slice(0, MAX_LYRICS_CHARS);
    instrumental = false;
    if (!title.trim()) title = split.title ?? suggestTitle(split.lyrics) ?? '';
    // Tags come from the prompt itself: list tags it names are selected, other sound phrases
    // become new tags. Earlier tags and the sound character would contradict it, so they go.
    const found = tagsFromStyle(split.style);
    tagText = found.join(', ');
    splitTags = found.length;
    pastedTags = 0;
    character = 'custom';
  }

  function undoSplit() {
    const b = beforeSplit;
    if (!b) return;
    beforeSplit = null;
    skipSplit = b.mode === 'custom' ? b.stylePrompt : b.description;
    skipLyrics = b.lyrics;
    ({ mode, description, stylePrompt, title, lyrics, tagText, character, instrumental } = b);
    lastText = { simple: description, custom: stylePrompt };
    lastLyrics = lyrics;
  }

  // A whole prompt pasted into the Lyrics box is split too.
  let lastLyrics = untrack(() => lyrics);
  let skipLyrics = '';
  $effect(() => {
    const now = lyrics;
    const before = lastLyrics;
    lastLyrics = now;
    if (now === skipLyrics || !isPaste(before, now)) return;
    const split = splitLyricsPaste(now);
    if (split) untrack(() => useSplit(split));
  });

  // A style description pasted on its own (no lyrics) still selects and creates tags.
  // Compared per box, so switching between Simple and Custom is never mistaken for a paste.
  let lastText = untrack(() => ({ simple: description, custom: stylePrompt }));
  $effect(() => {
    const box = mode;
    const now = box === 'custom' ? stylePrompt : description;
    const before = lastText[box];
    lastText[box] = now;
    if (fullSplit || !isPaste(before, now)) return;
    untrack(() => {
      const next = tagsAfterStylePaste(before, now, tags);
      if (next.join(', ') === tags.join(', ')) return;
      tagText = next.join(', ');
      pastedTags = next.length;
    });
  });
  let pastedTags = $state(0);

  // Paste a whole prompt (style, "Lyrics", [Verse]/[Chorus]) and it is split straight away.
  $effect(() => {
    const split = fullSplit;
    const source = mode === 'custom' ? stylePrompt : description;
    if (split && source !== skipSplit) untrack(useSplit);
  });
  // Song models refuse prompts that name real artists; suggest a description of the sound instead.
  const artistFix = $derived.by(() => {
    const prompt = rewritePrompt(mode === 'custom' ? stylePrompt : description);
    const tagFix = rewriteTagText(tagText, prompt.hits);
    return { prompt: prompt.text, tags: tagFix.text, names: tagFix.hits.map((h) => h.name) };
  });

  function useArtistFix() {
    // Read both before writing: changing the prompt recomputes artistFix.
    const { prompt, tags: fixedTags } = artistFix;
    if (mode === 'custom') stylePrompt = prompt;
    else description = prompt;
    tagText = fixedTags;
  }
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
        if (data.prompt) stylePrompt = data.prompt.slice(0, MAX_STYLE_CHARS);
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
    await loadCaps();
  });

  // The model list never spins forever: each try gives up after 20 s, a waking server gets three
  // tries, and then the panel says what is wrong and offers Retry.
  const CAPS_TRIES = 3;
  async function loadCaps() {
    capsError = null;
    for (let attempt = 1; attempt <= CAPS_TRIES && alive; attempt++) {
      capsTry = attempt;
      try {
        caps = await api<Caps>('/api/studio/capabilities', {
          signal: AbortSignal.timeout(20_000)
        });
        return;
      } catch (e) {
        // A real answer from the studio (sign-in, refused) will not change by asking again.
        if (e instanceof ApiError && e.status < 500) {
          capsError = e.message;
          return;
        }
        if (attempt < CAPS_TRIES) await sleep(3000);
      }
    }
    if (alive)
      capsError =
        "The studio server isn't answering, so the models can't load. If you opened the copy on " +
        'this computer, its server may be stopped; the online studio still works. Try again in a minute.';
  }
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
    if (artistFix.names.length) return;
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

{#snippet splitOffer()}
  {#if fullSplit}
    <div class="split-offer" role="status">
      <p>This is a whole prompt with lyrics. Split it into Style, Lyrics and tags?</p>
      <RuneButton variant="ghost" onclick={() => useSplit()}>Split it</RuneButton>
    </div>
  {:else if beforeSplit}
    <div class="split-offer" role="status">
      <p>
        Your prompt was split into Style and Lyrics, and {splitTags} style tags were picked from it (new
        ones included). Sound character is Custom so the prompt is sent as written.
      </p>
      <RuneButton variant="ghost" onclick={undoSplit}>Undo</RuneButton>
    </div>
  {:else if pastedTags}
    <p class="aside" role="status">
      Picked {pastedTags} style tags from what you pasted (new ones included). Change them below.
    </p>
  {/if}
{/snippet}

<svelte:head><title>Create · VBM Studio</title></svelte:head>

<div class="page create">
  <header class="hero">
    <h1>Make a song</h1>
    <RuneButton variant="ghost" href={resolve('/riffs')}>Create a riff</RuneButton>
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
              placeholder="An upbeat pop song about… (or paste a whole prompt with lyrics)"
            />
          </div>
          {@render splitOffer()}
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
            rows={fullSplit ? 8 : 3}
            placeholder="Or paste a whole prompt: style, then Lyrics with [Verse] and [Chorus]"
          />
          {@render splitOffer()}
          {#if !instrumental}
            <ArcaneTextarea
              label="Lyrics (leave empty and we write them)"
              bind:value={lyrics}
              rows={10}
              maxlength={MAX_LYRICS_CHARS}
              placeholder={lyricPlaceholder}
            />
            <div class="tagbar" aria-label="Insert section tag">
              {#each ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro'] as tag (tag)}
                <button type="button" onclick={() => insertTag(tag)}>[{tag}]</button>
              {/each}
            </div>
          {/if}
        {/if}
        <StyleTagPicker bind:value={tagText} />
        <RuneToggle
          label="Instrumental"
          bind:checked={instrumental}
          hint="No vocals. Some models only make instrumentals."
        />
      </div>
      {#if tooLong}
        <OracleStatus tone="warning"
          >{tooLong}
          {fitsElsewhere.length
            ? 'These models take it: ' + fitsElsewhere.join(', ') + '.'
            : 'Shorten the text or pick another model.'}</OracleStatus
        >
      {/if}
      {#if artistFix.names.length}
        <div class="artist-fix" role="status">
          <p class="artist-why">
            <strong>Describe the sound instead of naming {artistFix.names.join(', ')}.</strong>
            Song models refuse prompts that name real artists. Here's the same idea as a style:
          </p>
          <p class="artist-suggestion">{artistFix.prompt || '(no description)'}</p>
          <p class="artist-tags"><span>Tags:</span> {artistFix.tags}</p>
          <RuneButton variant="ghost" onclick={useArtistFix}>Use this instead</RuneButton>
        </div>
      {/if}
      <div class="go">
        <RuneButton
          onclick={summon}
          busy={busy || running}
          disabled={!caps?.allowed ||
            !spec ||
            spec.status !== 'ready' ||
            !!tooLong ||
            artistFix.names.length > 0}
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
        {:else if capsError}
          <div class="caps-retry">
            <p>Models couldn't load.</p>
            <RuneButton variant="ghost" onclick={loadCaps}>Retry</RuneButton>
          </div>
        {:else}
          <SigilLoader
            label={capsTry > 1
              ? 'Waking the studio up, try ' + capsTry + ' of ' + CAPS_TRIES + '…'
              : 'Loading models…'}
            size={40}
          />
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
  .aside {
    margin: 0;
    color: var(--vbm-muted);
    font-size: 0.9rem;
  }
  .artist-fix {
    display: grid;
    gap: 0.6rem;
    justify-items: start;
    margin-top: 1rem;
    padding: 0.9rem 1rem;
    background: rgb(79 139 255 / 10%);
    border: 1px solid rgb(79 139 255 / 35%);
    border-radius: var(--vbm-radius);
  }
  .artist-fix p {
    margin: 0;
  }
  .artist-why {
    font-size: 0.9rem;
    color: var(--vbm-muted);
  }
  .artist-why strong {
    display: block;
    color: var(--vbm-text);
  }
  .artist-suggestion {
    padding: 0.6rem 0.8rem;
    background: var(--vbm-surface-2);
    border-radius: var(--vbm-radius-sm);
    color: var(--vbm-text);
    justify-self: stretch;
  }
  .artist-tags {
    font-size: 0.85rem;
    color: var(--vbm-blue-text);
  }
  .artist-tags span {
    color: var(--vbm-muted);
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
  .split-offer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--vbm-border, rgba(255, 255, 255, 0.12));
    border-radius: 0.75rem;
  }
  .split-offer p {
    margin: 0;
    flex: 1 1 14rem;
    font-size: 0.9rem;
  }
  .caps-retry {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .caps-retry p {
    margin: 0;
    color: var(--vbm-muted);
  }
</style>
