<script lang="ts">
  import { decodeAudioFromUrl, formatTime } from './audio';
  import SummoningCircle from './SummoningCircle.svelte';
  import Waveform from './Waveform.svelte';
  import SigilLoader from './SigilLoader.svelte';

  let {
    src,
    title,
    subtitle,
    downloadName,
    onended
  }: {
    src: string;
    title?: string;
    subtitle?: string;
    downloadName?: string;
    onended?: () => void;
  } = $props();

  let audio: HTMLAudioElement | undefined = $state();
  let buffer = $state<AudioBuffer | null>(null);
  let error: string | null = $state(null);
  let loading = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  // Media duration can be NaN/Infinity (e.g. servers without Range support); the decoded buffer is authoritative.
  const total = $derived(
    buffer?.duration ?? (Number.isFinite(duration) && duration > 0 ? duration : 0)
  );
  let paused = $state(true);

  $effect(() => {
    const url = src;
    const controller = new AbortController();
    buffer = null;
    error = null;
    loading = true;
    decodeAudioFromUrl(url, controller.signal)
      .then((b) => {
        buffer = b;
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        error =
          e instanceof Error && e.message.startsWith('Could not fetch')
            ? e.message
            : 'This audio could not be decoded, so no waveform can be shown.';
      })
      .finally(() => {
        if (!controller.signal.aborted) loading = false;
      });
    return () => controller.abort();
  });

  // Smooth playhead while playing.
  $effect(() => {
    if (paused || !audio) return;
    const el = audio;
    let raf = 0;
    const tick = () => {
      currentTime = el.currentTime;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  function toggle() {
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {
        error = 'Playback was blocked or the audio is unplayable.';
      });
    } else audio.pause();
  }

  function seek(seconds: number) {
    if (!audio) return;
    audio.currentTime = seconds;
    currentTime = seconds;
  }
</script>

<div class="player">
  <audio
    bind:this={audio}
    {src}
    preload="metadata"
    crossorigin="anonymous"
    bind:currentTime
    bind:duration
    bind:paused
    {onended}
  ></audio>
  <div class="circle"><SummoningCircle audio={audio ?? null} size={150} /></div>
  <div class="main">
    <div class="head">
      <div>
        {#if title}<h3>{title}</h3>{/if}
        {#if subtitle}<p class="sub">{subtitle}</p>{/if}
      </div>
      <span class="time vbm-mono">{formatTime(currentTime)} / {formatTime(total)}</span>
    </div>
    <Waveform
      {buffer}
      {currentTime}
      duration={total || undefined}
      onseek={seek}
      height={96}
      label={title ?? 'Track'}
    />
    {#if loading}<SigilLoader label="Decoding" size={28} />{/if}
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="controls">
      <button class="play" type="button" onclick={toggle} aria-label={paused ? 'Play' : 'Pause'}>
        {#if paused}
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="7,4 20,12 7,20" /></svg>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true"
            ><rect x="6" y="4" width="4" height="16" /><rect
              x="14"
              y="4"
              width="4"
              height="16"
            /></svg
          >
        {/if}
      </button>
      <a class="dl" href={src} download={downloadName ?? ''}>Download ↓</a>
    </div>
  </div>
</div>

<style>
  .player {
    display: flex;
    gap: 1.25rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .circle {
    flex: none;
    margin-inline: auto;
  }
  .main {
    flex: 1 1 18rem;
    min-width: 0;
    display: grid;
    gap: 0.6rem;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h3 {
    margin: 0;
    font-size: 1.1rem;
  }
  .sub {
    margin: 0;
    color: var(--vbm-muted);
    font-style: italic;
  }
  .time {
    color: var(--vbm-teal);
    font-size: 0.8rem;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .play {
    width: 3rem;
    height: 3rem;
    border: 0;
    display: grid;
    place-items: center;
    cursor: pointer;
    color: var(--vbm-void);
    background: linear-gradient(135deg, var(--vbm-violet), var(--vbm-ember));
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  }
  .play svg {
    width: 1.1rem;
    height: 1.1rem;
    fill: currentColor;
  }
  .play:focus-visible {
    outline: none;
    background: var(--vbm-teal);
  }
  .dl {
    font-family: var(--vbm-font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--vbm-teal);
  }
  .err {
    margin: 0;
    color: var(--vbm-blood);
  }
</style>
