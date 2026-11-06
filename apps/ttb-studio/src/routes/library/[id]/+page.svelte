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
  import { decodeAudioFromUrl } from '@vbm/ui/audio';
  import type { SongMeta, StudioJob } from '@vbm/contracts';
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
    void load(songId);
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
        ritual.error = done.detail ?? 'The ritual failed.';
      if (song) await load(song.id);
    } catch (e) {
      if (ritual) ritual.error = e instanceof Error ? e.message : 'The ritual failed.';
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

  const masterChild = $derived(children.find((c) => c.kind === 'master'));
  const ext = (s: SongMeta) => s.audio?.file.split('.').pop() ?? 'mp3';
</script>

<svelte:head><title>Song · The Studio · Vocal Black Magic</title></svelte:head>

<div class="page">
  {#if error}
    <OracleStatus tone="danger">{error}</OracleStatus>
  {:else if !song}
    <SigilLoader label="Opening the grimoire…" />
  {:else}
    <header class="page-title">
      <h1>{song.title}</h1>
      <p>{song.prompt}</p>
      <p class="tags">{song.kind} · {song.engine} · {new Date(song.created_at).toLocaleString()}</p>
    </header>

    {#if song.audio}
      <ArcanePanel eyebrow="The vessel" title="Listen" glow="violet">
        <AbPlayer
          a={audioUrl(song.id)}
          b={song.kind === 'master' && parent?.audio ? audioUrl(parent.id) : null}
          labelA="Master"
          labelB="Original"
          {buffer}
          downloadHref={audioUrl(song.id) + '?download=1'}
          downloadName={song.title + '.' + ext(song)}
          cover={song.cover ? coverUrl(song.id, String(song.cover.bytes)) : null}
        />
        {#if song.master}
          <p class="note">
            Mastered from {song.master.input_lufs?.toFixed(1)} to {song.master.output_lufs?.toFixed(
              1
            )} LUFS, true peak
            {song.master.output_true_peak?.toFixed(1)} dBTP. The original is untouched.
          </p>
        {/if}
      </ArcanePanel>
    {/if}

    {#if song.stems?.length}
      <ArcanePanel eyebrow="Dismembered" title="Stem mixer" glow="teal">
        <StemMixer {song} />
      </ArcanePanel>
    {/if}

    <div class="split">
      {#if song.audio}
        <ArcanePanel eyebrow="Seen" title="Spectrogram & pitch" glow="teal">
          <Spectrogram {buffer} height={170} />
          <PitchTrace {buffer} height={120} />
        </ArcanePanel>
      {/if}
      {#if song.lyrics}
        <ArcanePanel eyebrow="Spoken" title="Lyrics">
          <pre class="lyrics">{song.lyrics}</pre>
        </ArcanePanel>
      {/if}
    </div>

    <ArcanePanel eyebrow="Lineage" title="Bloodline" glow="ember">
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
      <ArcanePanel eyebrow="Rituals" title="Derive" glow="violet">
        <div class="rituals">
          <section>
            <h3>ᛞ Split stems</h3>
            <p>Demucs separates vocals, drums, bass and the rest (~$0.03).</p>
            <RuneButton disabled={busy} onclick={() => startRitual('Split stems', 'stems')}
              >Split</RuneButton
            >
          </section>
          <section>
            <h3>ᛝ Studio Master</h3>
            <p>Local, free: gentle EQ, compression, −14 LUFS, −1 dBTP. A/B it against this song.</p>
            {#if masterChild}
              <RuneButton variant="ghost" href={resolve('/library/[id]', { id: masterChild.id })}
                >Open master (A/B)</RuneButton
              >
            {/if}
            <RuneButton disabled={busy} busy={mastering} onclick={master}>Master</RuneButton>
          </section>
          <section>
            <h3>ᛜ Cover art</h3>
            <p>
              {song.cover?.inherited_from ? 'Inherited from its parent. ' : ''}Conjure a new arcane
              cover with FLUX Schnell (~$0.003).
            </p>
            <RuneButton disabled={busy} busy={conjuring} onclick={reconjure}>
              {song.cover ? 'Re-conjure cover' : 'Conjure cover'}
            </RuneButton>
          </section>
          <section>
            <h3>ᛉ Reimagine</h3>
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
            <h3>ᛗ Sing in my voice</h3>
            {#if voices === null}
              <SigilLoader size={32} label="Listening for voices…" />
            {:else if voices.length === 0}
              <p>
                No consented voice is ready. Voices are forged, with your own-voice consent, in
                Vocal Fix's Voice Forge.
              </p>
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- not an app route -->
              <a class="forge" href={vocalFixUrl}>Go to the Voice Forge →</a>
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
              <SigilLoader label="Beginning the ritual…" size={40} />
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
  .note {
    font-style: italic;
    opacity: 0.8;
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
