<script lang="ts">
  import { onDestroy } from 'svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import Waveform from '@vbm/ui/Waveform.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import { formatTime } from '@vbm/ui/audio';
  import type { SongMeta, StemName } from '@vbm/contracts';
  import { audioUrl } from './api';
  import { encodeWav } from './jobs';

  let { song }: { song: SongMeta } = $props();

  type Track = {
    name: StemName;
    buffer: AudioBuffer;
    volume: number;
    muted: boolean;
    solo: boolean;
  };
  let tracks = $state<Track[]>([]);
  let error = $state<string | null>(null);
  let playing = $state(false);
  let position = $state(0);
  let exporting = $state(false);
  let ctx: AudioContext | null = null;
  let gains: GainNode[] = [];
  let sources: AudioBufferSourceNode[] = [];
  let startedAt = 0;
  let offset = 0;
  let raf = 0;

  const duration = $derived(Math.max(0, ...tracks.map((t) => t.buffer.duration)));
  const anySolo = $derived(tracks.some((t) => t.solo));
  const audible = (t: Track) => !t.muted && (!anySolo || t.solo);

  $effect(() => {
    const stems = song.stems ?? [];
    const context = new AudioContext();
    ctx = context;
    let cancelled = false;
    Promise.all(
      stems.map(async (stem) => {
        const response = await fetch(audioUrl(song.id, stem.name));
        if (!response.ok) throw new Error('The ' + stem.name + ' stem could not be loaded.');
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        return { name: stem.name, buffer, volume: 0.9, muted: false, solo: false };
      })
    )
      .then((loaded) => {
        if (cancelled) return;
        gains = loaded.map(() => {
          const gain = context.createGain();
          gain.connect(context.destination);
          return gain;
        });
        tracks = loaded;
      })
      .catch((e) => (error = e instanceof Error ? e.message : 'Stems could not be loaded.'));
    return () => {
      cancelled = true;
      stopSources();
      cancelAnimationFrame(raf);
      void context.close();
    };
  });

  // Gains follow the mute/solo/volume controls.
  $effect(() => {
    tracks.forEach((t, i) => {
      if (gains[i] && ctx)
        gains[i].gain.setTargetAtTime(audible(t) ? t.volume : 0, ctx.currentTime, 0.015);
    });
  });

  function stopSources() {
    for (const source of sources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    sources = [];
  }

  function tick() {
    if (!ctx || !playing) return;
    position = Math.min(duration, offset + ctx.currentTime - startedAt);
    if (position >= duration) {
      pause();
      position = 0;
      offset = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  async function play(from = offset) {
    if (!ctx || !tracks.length) return;
    await ctx.resume();
    stopSources();
    // One shared start time keeps every stem sample-aligned.
    const when = ctx.currentTime + 0.06;
    sources = tracks.map((t, i) => {
      const source = ctx!.createBufferSource();
      source.buffer = t.buffer;
      source.connect(gains[i]);
      source.start(when, from);
      return source;
    });
    startedAt = when;
    offset = from;
    playing = true;
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    if (ctx && playing) offset = Math.min(duration, offset + ctx.currentTime - startedAt);
    playing = false;
    stopSources();
    cancelAnimationFrame(raf);
  }

  function seek(seconds: number) {
    position = seconds;
    if (playing) void play(seconds);
    else offset = seconds;
  }

  async function exportMix() {
    if (!tracks.length) return;
    exporting = true;
    try {
      const rate = tracks[0].buffer.sampleRate;
      const offline = new OfflineAudioContext(2, Math.ceil(duration * rate), rate);
      for (const t of tracks) {
        if (!audible(t)) continue;
        const source = offline.createBufferSource();
        const gain = offline.createGain();
        gain.gain.value = t.volume;
        source.buffer = t.buffer;
        source.connect(gain).connect(offline.destination);
        source.start(0);
      }
      const url = URL.createObjectURL(encodeWav(await offline.startRendering()));
      const link = document.createElement('a');
      link.href = url;
      link.download = song.title.replace(/[^\w -]/g, '_') + ' - mix.wav';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      error = 'The mix could not be rendered.';
    } finally {
      exporting = false;
    }
  }

  onDestroy(() => pause());
</script>

{#if error}
  <p class="err">{error}</p>
{:else if !tracks.length}
  <SigilLoader label="Gathering the stems…" />
{:else}
  <div class="transport">
    <RuneButton onclick={() => (playing ? pause() : play())}
      >{playing ? 'Pause' : 'Play all'}</RuneButton
    >
    <span class="time">{formatTime(position)} / {formatTime(duration)}</span>
    <RuneButton variant="ghost" busy={exporting} onclick={exportMix}>Export mix (WAV)</RuneButton>
  </div>
  <ul class="stems">
    {#each tracks as track (track.name)}
      <li class:silent={!audible(track)}>
        <div class="controls">
          <strong>{track.name}</strong>
          <button
            aria-pressed={track.muted}
            class:on={track.muted}
            onclick={() => (track.muted = !track.muted)}>M</button
          >
          <button
            aria-pressed={track.solo}
            class:on={track.solo}
            onclick={() => (track.solo = !track.solo)}>S</button
          >
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            bind:value={track.volume}
            aria-label={track.name + ' volume'}
          />
        </div>
        <Waveform
          buffer={track.buffer}
          currentTime={position}
          {duration}
          onseek={seek}
          height={52}
          color={track.name === 'vocals' ? 'ember' : track.name === 'drums' ? 'teal' : 'violet'}
          label={track.name + ' stem'}
        />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .transport {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  .time {
    font-family: var(--vbm-font-mono);
  }
  .stems {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.9rem;
  }
  .silent {
    opacity: 0.4;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
  }
  .controls strong {
    font-family: var(--vbm-font-display);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    min-width: 5rem;
  }
  .controls button {
    background: transparent;
    color: inherit;
    border: 1px solid var(--vbm-violet-deep);
    width: 2rem;
    height: 2rem;
    cursor: pointer;
    font-family: var(--vbm-font-mono);
  }
  .controls button.on {
    background: var(--vbm-ember-deep);
    border-color: var(--vbm-ember);
  }
  .controls input {
    flex: 1;
    min-width: 4rem;
    accent-color: var(--vbm-violet);
  }
  .err {
    color: var(--vbm-ember);
  }
</style>
