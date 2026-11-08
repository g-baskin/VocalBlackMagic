<script lang="ts">
  import { onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import Spectrogram from '@vbm/ui/Spectrogram.svelte';
  import PitchTrace from '@vbm/ui/PitchTrace.svelte';
  import ArcaneSelect from '@vbm/ui/ArcaneSelect.svelte';
  import ArcaneTextarea from '@vbm/ui/ArcaneTextarea.svelte';
  import RegionSelect from '@vbm/ui/RegionSelect.svelte';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import { decodeAudioFromUrl } from '@vbm/ui/audio';
  import type { EditAction, SongMeta, StudioEditInfo, StudioJob } from '@vbm/contracts';
  import { api, audioUrl, coverUrl } from '../../../lib/client/api';
  import { followJob } from '../../../lib/client/jobs';
  import AbPlayer from '../../../lib/client/AbPlayer.svelte';
  import StemMixer from '../../../lib/client/StemMixer.svelte';

  type Voice = { id: string; performer: string; created_at: string };
  const vocalFixUrl = import.meta.env.VITE_VOCAL_FIX_URL || 'http://localhost:5173';

  let song = $state<SongMeta | null>(null);
  let parent = $state<SongMeta | null>(null);
  let children = $state<SongMeta[]>([]);
  let buffer = $state<AudioBuffer | null>(null);
  let error = $state<string | null>(null);
  let voices = $state<Voice[] | null>(null);
  let voiceId = $state('');
  let reimagineLyrics = $state('');
  let ritual = $state<{ name: string; job: StudioJob | null; error: string | null } | null>(null);
  let mastering = $state(false);
  let edits = $state<StudioEditInfo[] | null>(null);
  let editsError = $state<string | null>(null);
  let extendBefore = $state('0');
  let extendAfter = $state('30');
  let extendLyrics = $state('');
  let regionStart = $state(0);
  let regionEnd = $state(0);
  let repaintLyrics = $state('');
  let repaintStyle = $state('');
  let restyleStyle = $state('');
  let restyleStrength = $state('0.5');
  let alive = true;
  onDestroy(() => (alive = false));

  const id = $derived(page.params.id ?? '');
  const busy = $derived(mastering || (ritual?.job?.status === 'running' && !ritual.error));

  async function load(songId: string) {
    error = null;
    try {
      const reply = await api<{ song: SongMeta; children: SongMeta[] }>(
        '/api/studio/songs/' + encodeURIComponent(songId)
      );
      song = reply.song;
      children = reply.children;
      reimagineLyrics = reply.song.lyrics ?? '';
      parent = reply.song.parent_id
        ? ((
            await api<{ song: SongMeta }>('/api/studio/songs/' + reply.song.parent_id).catch(
              () => null
            )
          )?.song ?? null)
        : null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Song not found.';
    }
  }

  $effect(() => {
    const songId = id;
    song = null;
    buffer = null;
    ritual = null;
    edits = null;
    editsError = null;
    regionStart = 0;
    regionEnd = 0;
    void load(songId);
    // Ignore a reply for a song the user has already navigated away from.
    api<{ edits: StudioEditInfo[] }>('/api/studio/songs/' + encodeURIComponent(songId) + '/edit')
      .then((r) => {
        if (id === songId) edits = r.edits;
      })
      .catch((e) => {
        if (id === songId) editsError = e instanceof Error ? e.message : 'Edits are unavailable.';
      });
    api<{ voices: Voice[] }>('/api/studio/voices')
      .then((r) => {
        voices = r.voices;
        voiceId = r.voices[0]?.id ?? '';
      })
      .catch(() => (voices = []));
  });

  $effect(() => {
    if (!song?.audio) return;
    const controller = new AbortController();
    decodeAudioFromUrl(audioUrl(song.id), controller.signal)
      .then((decoded) => (buffer = decoded))
      .catch(() => undefined);
    return () => controller.abort();
  });

  async function startRitual(name: string, path: string, body: object = {}) {
    if (!song) return;
    ritual = { name, job: null, error: null };
    try {
      const reply = await api<{ job: StudioJob }>('/api/studio/songs/' + song.id + '/' + path, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (ritual) ritual.job = reply.job;
      const done = await followJob(
        reply.job.id,
        (job) => ritual && (ritual.job = job),
        () => alive
      );
      if (ritual && done && done.status !== 'completed')
        ritual.error = done.detail ?? 'The job failed.';
      if (song) await load(song.id);
    } catch (e) {
      if (ritual) ritual.error = e instanceof Error ? e.message : 'The job failed.';
    }
  }

  async function master() {
    if (!song) return;
    mastering = true;
    ritual = { name: 'Studio Master', job: null, error: null };
    try {
      await api('/api/studio/songs/' + song.id + '/master', { method: 'POST', body: '{}' });
      await load(song.id);
      ritual = null;
    } catch (e) {
      ritual = {
        name: 'Studio Master',
        job: null,
        error: e instanceof Error ? e.message : 'Mastering failed.'
      };
    } finally {
      mastering = false;
    }
  }

  let conjuring = $state(false);
  async function reconjure() {
    if (!song) return;
    conjuring = true;
    try {
      song = (
        await api<{ song: SongMeta }>('/api/studio/songs/' + song.id + '/cover', {
          method: 'POST',
          body: '{}'
        })
      ).song;
    } catch (e) {
      ritual = {
        name: 'Cover art',
        job: null,
        error: e instanceof Error ? e.message : 'The cover failed.'
      };
    } finally {
      conjuring = false;
    }
  }

  const editInfo = (action: EditAction) => edits?.find((e) => e.action === action) ?? null;
  const runnerLabel = (info: StudioEditInfo | null) =>
    info?.model_version ? 'via ' + info.model_version : '';
  const extendTotal = $derived(Number(extendBefore) + Number(extendAfter));
  const extendInvalid = $derived(
    !(Number(extendBefore) >= 0 && Number(extendAfter) >= 0) ||
      extendTotal <= 0 ||
      extendTotal > 240
  );
  const strength = $derived(Math.min(1, Math.max(0, Number(restyleStrength) || 0)));

  function startExtend() {
    void startRitual('Extend', 'edit', {
      action: 'extend',
      extend: { before_seconds: Number(extendBefore), after_seconds: Number(extendAfter) },
      ...(extendLyrics.trim() ? { lyrics: extendLyrics } : {})
    });
  }
  function startRepaint() {
    void startRitual('Replace section', 'edit', {
      action: 'repaint',
      repaint: { start_seconds: regionStart, end_seconds: regionEnd },
      ...(repaintLyrics.trim() ? { lyrics: repaintLyrics } : {}),
      ...(repaintStyle.trim() ? { prompt: repaintStyle } : {})
    });
  }
  function startRestyle() {
    void startRitual('Restyle', 'edit', { action: 'cover', prompt: restyleStyle, strength });
  }

  const masterChild = $derived(children.find((c) => c.kind === 'master'));
  const ext = (s: SongMeta) => s.audio?.file.split('.').pop() ?? 'mp3';
</script>

<svelte:head><title>Song · VBM Studio</title></svelte:head>

<div class="page">
  {#if error}
    <OracleStatus tone="danger">{error}</OracleStatus>
  {:else if !song}
    <SigilLoader label="Loading song…" />
  {:else}
    <header class="page-title">
      <h1>{song.title}</h1>
      <p>{song.prompt}</p>
      <p class="tags">
        {song.kind === 'upload' ? 'Uploaded ' + (song.upload?.type ?? 'audio') : song.kind} · {song.engine}
        · {new Date(song.created_at).toLocaleString()}
      </p>
    </header>

    {#if song.audio}
      <section class="listening-panel" aria-label="Song player">
        <AbPlayer
          title={song.title}
          a={audioUrl(song.id)}
          b={song.kind === 'master' && parent?.audio ? audioUrl(parent.id) : null}
          labelA={song.kind === 'master' ? 'Master' : 'This song'}
          labelB="Original"
          {buffer}
          downloadHref={audioUrl(song.id) + '?download=1'}
          downloadName={song.title + '.' + ext(song)}
          downloadBName={parent ? parent.title + '.' + ext(parent) : undefined}
          cover={song.cover ? coverUrl(song.id, String(song.cover.bytes)) : null}
        />
        {#if song.master}
          <div class="master-report" aria-label="Mastering results">
            <div>
              <span>Loudness</span><strong
                >{song.master.output_lufs?.toFixed(1) ?? 'Unavailable'}<small> LUFS</small></strong
              >
            </div>
            <div>
              <span>True peak</span><strong
                >{song.master.output_true_peak?.toFixed(1) ?? 'Unavailable'}<small>
                  dBTP</small
                ></strong
              >
            </div>
            <p>
              Original preserved{song.master.input_lufs != null
                ? ' at ' + song.master.input_lufs.toFixed(1) + ' LUFS'
                : ''}.
            </p>
          </div>
        {/if}
      </section>
    {/if}

    {#if song.stems?.length}
      <ArcanePanel eyebrow="Stems" title="Stem mixer" glow="teal">
        <StemMixer {song} />
      </ArcanePanel>
    {/if}

    <div class="split">
      {#if song.audio}
        <ArcanePanel eyebrow="Analysis" title="Spectrogram & pitch" glow="teal">
          <Spectrogram {buffer} height={170} />
          <PitchTrace {buffer} height={120} />
        </ArcanePanel>
      {/if}
      {#if song.lyrics}
        <ArcanePanel eyebrow="Words" title="Lyrics">
          <pre class="lyrics">{song.lyrics}</pre>
        </ArcanePanel>
      {/if}
    </div>

    <ArcanePanel eyebrow="Lineage" title="Versions" glow="ember">
      <ul class="lineage">
        {#if parent}<li>
            Born of <a href={resolve('/library/[id]', { id: parent.id })}>{parent.title}</a>
            ({parent.kind})
          </li>{/if}
        {#each children as child (child.id)}
          <li>
            Begat <a href={resolve('/library/[id]', { id: child.id })}>{child.title}</a>
            ({child.kind})
          </li>
        {:else}
          {#if !parent}<li>No ancestors or descendants yet.</li>{/if}
        {/each}
      </ul>
    </ArcanePanel>

    {#if song.audio}
      <ArcanePanel eyebrow="Edit" title="Alter the song" glow="ember">
        <p class="note">Each edit makes a new version; this one is untouched.</p>
        {#if editsError}
          <OracleStatus tone="danger">{editsError}</OracleStatus>
        {:else if !edits}
          <SigilLoader size={32} label="Checking which edits are available…" />
        {:else}
          <div class="alter">
            <section class="wide">
              <h3>Replace section</h3>
              {#if editInfo('repaint')?.available}
                <p>
                  Select a range; only that part is sung again. {runnerLabel(editInfo('repaint'))}
                </p>
                <RegionSelect
                  {buffer}
                  bind:start={regionStart}
                  bind:end={regionEnd}
                  label="Section to replace"
                />
                <div class="pair">
                  <ArcaneTextarea
                    label="New lyrics for this section (optional)"
                    bind:value={repaintLyrics}
                    rows={3}
                    maxlength={6000}
                  />
                  <ArcaneInput
                    label="Style for this section (optional)"
                    bind:value={repaintStyle}
                  />
                </div>
                <RuneButton
                  disabled={busy || !buffer || regionEnd - regionStart < 1}
                  onclick={startRepaint}>Replace section</RuneButton
                >
              {:else}
                <p class="why">Unavailable: {editInfo('repaint')?.reason}</p>
              {/if}
            </section>
            <section>
              <h3>Extend</h3>
              {#if editInfo('extend')?.available}
                <p>
                  Add music before and/or after (240 s in total at most). {runnerLabel(
                    editInfo('extend')
                  )}
                </p>
                <div class="pair">
                  <ArcaneInput label="Seconds before" type="number" bind:value={extendBefore} />
                  <ArcaneInput label="Seconds after" type="number" bind:value={extendAfter} />
                </div>
                <ArcaneTextarea
                  label="Lyrics for the new part (optional)"
                  bind:value={extendLyrics}
                  rows={3}
                  maxlength={6000}
                />
                {#if extendInvalid}<p class="why">Add 1 to 240 seconds in total.</p>{/if}
                <RuneButton disabled={busy || extendInvalid} onclick={startExtend}
                  >Extend</RuneButton
                >
              {:else}
                <p class="why">Unavailable: {editInfo('extend')?.reason}</p>
              {/if}
            </section>
            <section>
              <h3>Restyle</h3>
              {#if editInfo('cover')?.available}
                <p>Same structure, a new style. {runnerLabel(editInfo('cover'))}</p>
                <ArcaneInput label="New style" bind:value={restyleStyle} />
                <label class="strength">
                  <span>Strength {strength.toFixed(2)} (0 keeps it, 1 ignores the original)</span>
                  <input type="range" min="0" max="1" step="0.05" bind:value={restyleStrength} />
                </label>
                <RuneButton disabled={busy || !restyleStyle.trim()} onclick={startRestyle}
                  >Restyle</RuneButton
                >
              {:else}
                <p class="why">Unavailable: {editInfo('cover')?.reason}</p>
              {/if}
            </section>
          </div>
        {/if}
      </ArcanePanel>

      <ArcanePanel eyebrow="Tools" title="Remix & export" glow="violet">
        <div class="rituals">
          <section>
            <h3>Split stems</h3>
            <p>Demucs separates vocals, drums, bass and the rest (~$0.03).</p>
            <RuneButton disabled={busy} onclick={() => startRitual('Split stems', 'stems')}
              >Split</RuneButton
            >
          </section>
          <section>
            <h3>Studio Master</h3>
            <p>Local, free: gentle EQ, compression, −14 LUFS, −1 dBTP. A/B it against this song.</p>
            {#if masterChild}
              <RuneButton variant="ghost" href={resolve('/library/[id]', { id: masterChild.id })}
                >Open master (A/B)</RuneButton
              >
            {/if}
            <RuneButton disabled={busy} busy={mastering} onclick={master}>Master</RuneButton>
          </section>
          <section>
            <h3>Cover art</h3>
            <p>
              {song.cover?.inherited_from ? 'Inherited from its parent. ' : ''}Generate a new cover
              with FLUX Schnell (~$0.003).
            </p>
            <RuneButton disabled={busy} busy={conjuring} onclick={reconjure}>
              {song.cover ? 'New cover' : 'Generate cover'}
            </RuneButton>
          </section>
          <section>
            <h3>Reimagine</h3>
            <p>
              A new song in the style of this one (MiniMax Music-01, ~$0.035). Up to ~380 characters
              of lyrics.
            </p>
            <ArcaneTextarea
              label="Lyrics for the new song"
              bind:value={reimagineLyrics}
              rows={4}
              maxlength={15000}
            />
            <RuneButton
              disabled={busy}
              onclick={() => startRitual('Reimagine', 'reimagine', { lyrics: reimagineLyrics })}
              >Reimagine</RuneButton
            >
          </section>
          <section>
            <h3>Sing in my voice</h3>
            {#if voices === null}
              <SigilLoader size={32} label="Listening for voices…" />
            {:else if voices.length === 0}
              <p>
                No consented voice is ready. Voices are created, with your own-voice consent, in
                Vocal Fix's Voice training.
              </p>
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- not an app route -->
              <a class="forge" href={vocalFixUrl}>Go to Voice training →</a>
            {:else}
              <ArcaneSelect
                label="Voice"
                bind:value={voiceId}
                options={voices.map((v) => ({ value: v.id, label: v.performer }))}
              />
              <RuneButton
                disabled={busy || !voiceId}
                onclick={() => startRitual('Sing in my voice', 'voice', { voice_id: voiceId })}
                >Sing (~$0.045)</RuneButton
              >
            {/if}
          </section>
        </div>
        {#if ritual}
          <div class="progress">
            <h3>{ritual.name}</h3>
            {#if ritual.job}
              <RitualProgress stages={ritual.job.stages} detail={ritual.job.detail} />
            {:else if !ritual.error}
              <SigilLoader label="Starting…" size={40} />
            {/if}
            {#if ritual.error}<OracleStatus tone="danger">{ritual.error}</OracleStatus>{/if}
            {#if ritual.job?.status === 'completed'}
              <OracleStatus tone="success">
                Done.
                {#each ritual.job.song_ids as childId (childId)}
                  <a href={resolve('/library/[id]', { id: childId })}>Open the result</a>
                {/each}
              </OracleStatus>
            {/if}
          </div>
        {/if}
      </ArcanePanel>
    {/if}
  {/if}
</div>

<style>
  .alter {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
    margin-top: 0.75rem;
  }
  .alter section {
    display: grid;
    gap: 0.6rem;
    align-content: start;
  }
  .alter .wide {
    grid-column: 1 / -1;
  }
  .alter h3 {
    margin: 0;
  }
  .alter p {
    margin: 0;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    align-items: start;
  }
  .why {
    font-style: italic;
    color: #ffb08a;
    font-size: 0.88rem;
  }
  .strength {
    display: grid;
    gap: 0.3rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.78rem;
  }
  .strength input {
    accent-color: var(--vbm-ember);
  }
  @media (max-width: 720px) {
    .alter,
    .pair {
      grid-template-columns: 1fr;
    }
  }
  .tags {
    font-family: var(--vbm-font-mono);
    font-size: 0.8rem;
    font-style: normal;
  }
  .split {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
    gap: 1.5rem;
  }
  .split > :global(*) {
    min-width: 0;
  }
  .lyrics {
    white-space: pre-wrap;
    font-family: var(--vbm-font-body);
    font-size: 1.1rem;
    margin: 0;
  }
  .listening-panel {
    min-width: 0;
  }
  .master-report {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 32px;
    padding: 20px 24px 0;
  }
  .master-report div {
    display: grid;
    gap: 4px;
  }
  .master-report span,
  .master-report p {
    color: var(--vbm-muted);
    font-size: 0.75rem;
  }
  .master-report strong {
    font-size: 1rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .master-report small {
    margin-left: 4px;
    color: var(--vbm-muted);
    font-size: 0.75rem;
    font-weight: 400;
  }
  .master-report p {
    margin: 0;
  }
  @media (max-width: 440px) {
    .master-report {
      padding-inline: 16px;
    }
  }
  .lineage {
    margin: 0;
    padding-left: 1.2rem;
  }
  .lineage a,
  .forge,
  .progress a {
    color: var(--vbm-teal);
  }
  .rituals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    gap: 1.25rem;
  }
  .rituals section {
    display: grid;
    gap: 0.6rem;
    align-content: start;
    border-left: 1px solid var(--vbm-violet-deep);
    padding-left: 1rem;
  }
  .rituals h3,
  .progress h3 {
    margin: 0;
  }
  .rituals p {
    margin: 0;
    opacity: 0.8;
  }
  .progress {
    margin-top: 1.5rem;
    display: grid;
    gap: 0.75rem;
  }
</style>
