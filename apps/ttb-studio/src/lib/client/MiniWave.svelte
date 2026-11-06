<script lang="ts">
  import Waveform from '@vbm/ui/Waveform.svelte';
  import { decodeAudioFromUrl } from '@vbm/ui/audio';
  import { audioUrl } from './api';

  let { id, label }: { id: string; label: string } = $props();
  let buffer: AudioBuffer | null = $state(null);
  let host: HTMLDivElement | undefined = $state();

  // Decode only once the card scrolls into view, so a big library does not decode everything at once.
  $effect(() => {
    const el = host;
    if (!el) return;
    const controller = new AbortController();
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      decodeAudioFromUrl(audioUrl(id), controller.signal)
        .then((decoded) => (buffer = decoded))
        .catch(() => undefined);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      controller.abort();
    };
  });
</script>

<div bind:this={host}><Waveform {buffer} height={56} label={'Waveform of ' + label} /></div>
