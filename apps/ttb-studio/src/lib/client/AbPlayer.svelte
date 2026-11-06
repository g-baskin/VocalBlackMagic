<script lang="ts">
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import Waveform from '@vbm/ui/Waveform.svelte';
  import SummoningCircle from '@vbm/ui/SummoningCircle.svelte';
  import { formatTime } from '@vbm/ui/audio';

  /** One transport; B is optional (A/B against the parent keeps the same time position). */
  let {
    a,
    b = null,
    labelA = 'This song',
    labelB = 'Original',
    buffer,
    downloadHref,
    downloadName,
    cover = null
  }: {
    a: string;
    b?: string | null;
    labelA?: string;
    labelB?: string;
    buffer: AudioBuffer | null;
    downloadHref: string;
    downloadName: string;
    cover?: string | null;
  } = $props();

  let audio: HTMLAudioElement | null = $state(null);
  let useB = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let paused = $state(true);
  const src = $derived(useB && b ? b : a);

  function toggleSource() {
    if (!audio) return;
    const at = audio.currentTime;
    const resume = !audio.paused;
    useB = !useB;
    // Restore position once the new source has metadata.
    audio.addEventListener(
      'loadedmetadata',
      () => {
        if (!audio) return;
        audio.currentTime = Math.min(at, audio.duration || at);
        if (resume) void audio.play();
      },
      { once: true }
    );
  }
</script>

<div class="ab">
  <div class="altar" class:with-cover={!!cover}>
    {#if cover}<img src={cover} alt="Cover art" />{/if}
    <div class="circle"><SummoningCircle {audio} size={220} /></div>
  </div>
  <div class="body">
    <audio bind:this={audio} {src} preload="metadata" bind:currentTime bind:duration bind:paused
    ></audio>
    <Waveform
      {buffer}
      {currentTime}
      {duration}
      onseek={(t) => audio && (audio.currentTime = t)}
      height={110}
    />
    <div class="row">
      <RuneButton onclick={() => (audio?.paused ? audio.play() : audio?.pause())}
        >{paused ? 'Play' : 'Pause'}</RuneButton
      >
      <span class="time">{formatTime(currentTime)} / {formatTime(duration)}</span>
      {#if b}
        <div class="switch" role="radiogroup" aria-label="Compare">
          <button
            role="radio"
            aria-checked={!useB}
            class:on={!useB}
            onclick={() => useB && toggleSource()}>A · {labelA}</button
          >
          <button
            role="radio"
            aria-checked={useB}
            class:on={useB}
            onclick={() => !useB && toggleSource()}>B · {labelB}</button
          >
        </div>
      {/if}
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- not an app route -->
      <a class="dl" href={downloadHref} download={downloadName}>Download</a>
    </div>
  </div>
</div>

<style>
  .ab {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }
  .altar {
    position: relative;
    display: grid;
    place-items: center;
  }
  .altar.with-cover {
    width: min(100%, 320px);
    aspect-ratio: 1;
  }
  .altar img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid var(--vbm-violet-deep);
    box-shadow: 0 0 40px rgba(167, 116, 255, 0.35);
    filter: saturate(1.1) contrast(1.05);
  }
  .altar.with-cover .circle {
    position: relative;
    mix-blend-mode: screen;
    opacity: 0.9;
  }
  .body {
    flex: 1 1 320px;
    min-width: 0;
    display: grid;
    gap: 0.75rem;
  }
  .row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .time {
    font-family: var(--vbm-font-mono);
  }
  .switch {
    display: inline-flex;
    border: 1px solid var(--vbm-ember);
    border-radius: 999px;
    overflow: hidden;
  }
  .switch button {
    background: transparent;
    color: inherit;
    border: 0;
    padding: 0.35rem 0.8rem;
    cursor: pointer;
    font-family: var(--vbm-font-display);
  }
  .switch button.on {
    background: var(--vbm-ember-deep);
  }
  .dl {
    color: var(--vbm-teal);
    margin-left: auto;
  }
</style>
