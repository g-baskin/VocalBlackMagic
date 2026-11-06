<script lang="ts">
  import { resolve } from '$app/paths';
  import GrimoirePlayer from '@vbm/ui/GrimoirePlayer.svelte';
  import Spectrogram from '@vbm/ui/Spectrogram.svelte';
  import { decodeAudioFromUrl } from '@vbm/ui/audio';
  import type { SongMeta } from '@vbm/contracts';
  import { audioUrl } from './api';

  let { song }: { song: SongMeta } = $props();
  let buffer: AudioBuffer | null = $state(null);
  let failed = $state(false);

  $effect(() => {
    const controller = new AbortController();
    buffer = null;
    failed = false;
    decodeAudioFromUrl(audioUrl(song.id), controller.signal)
      .then((decoded) => (buffer = decoded))
      .catch(() => {
        if (!controller.signal.aborted) failed = true;
      });
    return () => controller.abort();
  });
</script>

<div class="take">
  <GrimoirePlayer
    src={audioUrl(song.id)}
    title={song.title}
    subtitle={song.engine + ' · ' + song.kind}
    downloadName={song.title + '.' + (song.audio?.file.split('.').pop() ?? 'mp3')}
  />
  {#if failed}
    <p class="note">The spectrogram could not be drawn for this file.</p>
  {:else}
    <Spectrogram {buffer} height={140} />
  {/if}
  <a class="detail" href={resolve('/library/[id]', { id: song.id })}>Open in the grimoire →</a>
</div>

<style>
  .take {
    display: grid;
    gap: 0.75rem;
  }
  .note {
    opacity: 0.7;
    font-style: italic;
  }
  .detail {
    justify-self: end;
    color: var(--vbm-teal);
    font-family: var(--vbm-font-display);
    letter-spacing: 0.12em;
    font-size: 0.8rem;
  }
</style>
