<script lang="ts">
  import Waveform from '@vbm/ui/Waveform.svelte';
  import SignalScope from '@vbm/ui/SignalScope.svelte';
  import { decodeAudioFromUrl, formatTime } from '@vbm/ui/audio';

  /** One transport; A/B comparison retains the listening position. */
  let {
    a,
    b = null,
    labelA = 'This song',
    labelB = 'Original',
    buffer,
    downloadHref,
    downloadName,
    downloadBName,
    cover = null,
    title = 'Listen'
  }: {
    a: string;
    b?: string | null;
    labelA?: string;
    labelB?: string;
    buffer: AudioBuffer | null;
    downloadHref: string;
    downloadName: string;
    downloadBName?: string;
    cover?: string | null;
    title?: string;
  } = $props();

  let audio: HTMLAudioElement | null = $state(null);
  let useB = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let paused = $state(true);
  let waiting = $state(false);
  let failure = $state<string | null>(null);
  let showSpectrum = $state(true);
  let originalBuffer = $state<AudioBuffer | null>(null);
  let pendingPosition: number | null = null;
  let resumeAfterSwitch = false;
  const src = $derived(useB && b ? b : a);
  const selectedBuffer = $derived(useB ? originalBuffer : buffer);
  const total = $derived(selectedBuffer?.duration ?? (Number.isFinite(duration) ? duration : 0));
  const selectedLabel = $derived(useB ? labelB : labelA);
  const download = $derived(
    useB && b ? b + (b.includes('?') ? '&' : '?') + 'download=1' : downloadHref
  );
  const status = $derived(
    failure ? 'Playback unavailable' : waiting ? 'Loading audio' : paused ? 'Paused' : 'Playing'
  );

  $effect(() => {
    const url = b;
    if (!useB || !url) return;
    const controller = new AbortController();
    originalBuffer = null;
    decodeAudioFromUrl(url, controller.signal)
      .then((decoded) => {
        if (!controller.signal.aborted) originalBuffer = decoded;
      })
      .catch(() => undefined); // Playback still works when waveform decoding is unavailable.
    return () => controller.abort();
  });

  function play() {
    if (!audio) return;
    failure = null;
    void audio.play().catch(() => {
      waiting = false;
      failure = 'Audio could not play. Try again or download the track.';
    });
  }
  function toggle() {
    if (!audio) return;
    if (audio.paused) {
      if (audio.error) audio.load();
      play();
    } else audio.pause();
  }
  function seek(at: number) {
    if (!audio || total <= 0 || waiting) return;
    audio.currentTime = Math.max(0, Math.min(total, at));
    currentTime = audio.currentTime;
  }
  function selectSource(next: boolean) {
    if (!audio || !b || next === useB) return;
    pendingPosition = pendingPosition ?? audio.currentTime;
    resumeAfterSwitch = waiting ? resumeAfterSwitch : !audio.paused;
    failure = null;
    waiting = true;
    useB = next;
  }
  function ready() {
    if (!audio) return;
    waiting = false;
    if (pendingPosition !== null) {
      audio.currentTime = Math.min(
        pendingPosition,
        Number.isFinite(audio.duration) ? audio.duration : pendingPosition
      );
      currentTime = audio.currentTime;
      pendingPosition = null;
      if (resumeAfterSwitch) play();
      resumeAfterSwitch = false;
    }
  }
</script>

<div class="deck" class:playing={!paused}>
  <audio
    bind:this={audio}
    {src}
    preload="metadata"
    bind:currentTime
    bind:duration
    bind:paused
    onloadedmetadata={ready}
    oncanplay={() => (waiting = false)}
    onwaiting={() => (waiting = true)}
    onplaying={() => (waiting = false)}
    onerror={() => {
      waiting = false;
      failure = 'Audio could not load. Try again or download the track.';
    }}
  ></audio>
  <header class="deck-head">
    <div class="track">
      {#if cover}<img class="cover" src={cover} alt="" width="48" height="48" />{/if}
      <div class="track-text">
        <p class="deck-label">Signal deck</p>
        <h2>{title}</h2>
      </div>
    </div>
    <span class="status" role="status"><i aria-hidden="true"></i>{status}</span>
  </header>

  <div class="display" class:quiet={!showSpectrum}>
    <div class="display-top">
      <span>Live spectrum</span>
      <button
        type="button"
        class="visual-toggle"
        aria-pressed={showSpectrum}
        onclick={() => (showSpectrum = !showSpectrum)}
      >
        {showSpectrum ? 'Hide visuals' : 'Show visuals'}
      </button>
    </div>
    <div class="scope">
      <SignalScope {audio} enabled={showSpectrum} />
      {#if paused && showSpectrum}<span class="idle-note">Your sound, in motion.</span>{/if}
      <span class="reduced-note">Visual motion reduced</span>
    </div>
    <div class="display-bottom" aria-hidden="true">
      <span>LOW</span><span>MID</span><span>HIGH</span>
    </div>
  </div>

  <div class="transport">
    <div class="timeline">
      <div class="clock">
        <span class="elapsed">{formatTime(currentTime)}</span><span class="total"
          >/ {formatTime(total)}</span
        >
      </div>
      <span class="source-name">{selectedLabel}</span>
    </div>
    <div class="waveform">
      {#if selectedBuffer}
        <Waveform
          buffer={selectedBuffer}
          {currentTime}
          duration={total}
          onseek={seek}
          height={64}
          color="teal"
          unplayedOpacity={0.85}
          label={title}
        />
      {:else}
        <input
          type="range"
          min="0"
          max={total || 1}
          step="0.1"
          value={currentTime}
          aria-label="Playback position"
          aria-valuetext={formatTime(currentTime) + ' of ' + formatTime(total)}
          disabled={!total || waiting}
          oninput={(event) => seek(Number(event.currentTarget.value))}
        />
        <span class="wave-note">Playback timeline</span>
      {/if}
    </div>
    <div class="playback-controls">
      <button
        type="button"
        class="skip"
        aria-label="Back 10 seconds"
        onclick={() => seek(currentTime - 10)}
        disabled={!total || waiting}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9a8 8 0 1 1 0 7M4 4v5h5" /></svg
        ><span>10</span>
      </button>
      <button
        type="button"
        class="play"
        aria-label={paused ? 'Play' : 'Pause'}
        onclick={toggle}
        disabled={waiting && paused}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#if paused}<path d="m8 5 12 7-12 7Z" />{:else}<path
              d="M7 5h4v14H7zM15 5h4v14h-4z"
            />{/if}
        </svg>
      </button>
      <button
        type="button"
        class="skip"
        aria-label="Forward 10 seconds"
        onclick={() => seek(currentTime + 10)}
        disabled={!total || waiting}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 9a8 8 0 1 0 0 7M20 4v5h-5" /></svg
        ><span>10</span>
      </button>
    </div>
    {#if failure}<p class="failure" role="alert">{failure}</p>{/if}
    <div class="deck-footer">
      {#if b}
        <div class="compare" role="group" aria-label="Compare versions">
          <button type="button" aria-pressed={!useB} onclick={() => selectSource(false)}
            ><span class="source-letter">A</span>{labelA}</button
          >
          <button type="button" aria-pressed={useB} onclick={() => selectSource(true)}
            ><span class="source-letter">B</span>{labelB}</button
          >
        </div>
      {/if}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- audio download, not a page -->
      <a
        class="download"
        href={download}
        download={useB ? (downloadBName ?? downloadName) : downloadName}
        aria-label={'Download ' + selectedLabel}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"
          ><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" /></svg
        ><span>Download</span>
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  </div>
</div>

<style>
  .deck {
    --deck-surface: oklch(0.22 0.014 260);
    --deck-raised: oklch(0.27 0.016 260);
    --deck-text: oklch(0.97 0.003 260);
    --deck-muted: oklch(0.76 0.016 260);
    --deck-ice: oklch(0.85 0.11 210);
    --deck-coral: oklch(0.76 0.17 15);
    --deck-edge: #647488;
    color: var(--deck-text);
    background: var(--deck-surface);
    border: 1px solid #3b4351;
    border-radius: 20px;
    overflow: clip;
    min-width: 0;
    container-type: inline-size;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .deck > * {
    grid-column: 1 / -1;
  }
  .deck-head {
    padding: 24px 24px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .track {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1 1 200px;
  }
  .track-text {
    min-width: 0;
  }
  .cover {
    flex: none;
    border-radius: 10px;
    object-fit: cover;
  }
  .deck-label {
    margin: 0 0 4px;
    color: var(--deck-ice);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h2 {
    margin: 0;
    font-size: clamp(1.1rem, 4cqi, 1.5rem);
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--deck-muted);
  }
  .status i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  .playing .status {
    color: var(--deck-ice);
  }
  .display {
    margin: 0 24px;
    border-top: 1px solid #3b4351;
    border-bottom: 1px solid #3b4351;
  }
  .display-top,
  .display-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--deck-muted);
    font-size: 0.7rem;
  }
  .display-top {
    min-height: 44px;
  }
  .display-bottom {
    padding: 0 0 12px;
    letter-spacing: 0.1em;
  }
  .visual-toggle {
    min-height: 44px;
    padding: 0 8px;
    border: 0;
    background: transparent;
    color: var(--deck-muted);
    cursor: pointer;
    font-size: 0.75rem;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .scope {
    position: relative;
    height: 160px;
  }
  .idle-note {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    color: var(--deck-muted);
    font-size: 0.8rem;
  }
  .idle-note::before {
    content: '';
    position: absolute;
    inset: 30% 20%;
    background: var(--deck-surface);
  }
  .idle-note {
    isolation: isolate;
  }
  .idle-note::before {
    z-index: -1;
  }
  .quiet .scope,
  .quiet .display-bottom {
    display: none;
  }
  .reduced-note {
    display: none;
  }
  .transport {
    padding: 20px 24px 16px;
  }
  .timeline {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 12px;
  }
  .clock {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .elapsed {
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: -0.05em;
  }
  .total {
    color: var(--deck-muted);
    font-size: 0.85rem;
  }
  .source-name {
    color: var(--deck-muted);
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }
  .waveform {
    min-height: 64px;
  }
  .waveform :global(.wave) {
    background: transparent;
  }
  .waveform input {
    width: 100%;
    min-height: 44px;
    accent-color: var(--deck-ice);
    margin: 0;
  }
  .wave-note {
    display: block;
    color: var(--deck-muted);
    font-size: 0.75rem;
    text-align: center;
  }
  .playback-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 16px 0 20px;
  }
  button {
    font: inherit;
  }
  button,
  a {
    -webkit-tap-highlight-color: transparent;
    scroll-margin-block: 120px;
  }
  .waveform :global([role='slider']),
  .waveform input {
    scroll-margin-block: 120px;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--deck-ice);
    outline-offset: 4px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .play {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    flex: none;
    border-radius: 50%;
    border: 1px solid var(--deck-ice);
    background: var(--deck-ice);
    color: #15252d;
    cursor: pointer;
    box-shadow: 0 0 0 6px var(--deck-raised);
    transition: background 120ms;
  }
  .play:hover:not(:disabled) {
    background: #c2f3fc;
  }
  .play:active:not(:disabled) {
    background: #8bc8d3;
  }
  .play svg {
    width: 28px;
    height: 28px;
    fill: currentColor;
  }
  .skip {
    position: relative;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border: 0;
    background: transparent;
    color: var(--deck-text);
    cursor: pointer;
    border-radius: 10px;
  }
  .skip svg {
    width: 32px;
    height: 32px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .skip span {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 0.6rem;
    padding-top: 2px;
  }
  .skip:hover:not(:disabled),
  .download:hover {
    background: var(--deck-raised);
  }
  .deck-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    border-top: 1px solid #3b4351;
    padding-top: 16px;
  }
  .compare {
    display: flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--deck-edge);
    border-radius: 12px;
    flex: 0 1 420px;
    flex-wrap: wrap;
  }
  .compare button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 1 1 5rem;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--deck-muted);
    cursor: pointer;
    font-size: 0.8rem;
    overflow-wrap: anywhere;
  }
  .compare button[aria-pressed='true'] {
    background: var(--deck-raised);
    border-color: var(--deck-coral);
    color: var(--deck-text);
  }
  .source-letter {
    font-size: 0.7rem;
    font-weight: 700;
  }
  .compare button[aria-pressed='true'] .source-letter {
    color: var(--deck-coral);
  }
  .download {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    color: var(--deck-text);
    text-decoration: none;
    font-size: 0.8rem;
    margin-left: auto;
  }
  .download svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .failure {
    font-size: 0.875rem;
    color: var(--vbm-danger);
    margin: 0 0 16px;
  }
  @container (max-width: 440px) {
    .deck-head {
      padding: 20px 16px 12px;
    }
    .display {
      margin-inline: 16px;
    }
    .scope {
      height: 128px;
    }
    .transport {
      padding: 16px;
    }
    .track {
      flex-basis: 100%;
    }
    .deck-footer {
      gap: 8px;
    }
    .compare {
      flex: 1 1 190px;
    }
    .download {
      margin-left: auto;
    }
    .download span {
      display: none;
    }
  }
  @container (min-width: 800px) {
    .display {
      grid-column: 1;
      grid-row: 2;
      margin: 0 0 24px 24px;
      border-bottom: 0;
    }
    .scope {
      height: 236px;
    }
    .transport {
      grid-column: 2;
      grid-row: 2;
      padding-top: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scope {
      height: 64px;
    }
    .scope :global(canvas),
    .idle-note {
      display: none;
    }
    .reduced-note {
      display: grid;
      position: absolute;
      inset: 0;
      place-items: center;
      color: var(--deck-muted);
      font-size: 0.75rem;
    }
  }
  @media (forced-colors: active) {
    .deck,
    .play,
    .compare,
    .compare button[aria-pressed='true'] {
      border-color: ButtonText;
    }
    .compare button[aria-pressed='true'] {
      border-width: 2px;
      text-decoration: underline;
    }
    button:focus-visible,
    a:focus-visible {
      outline-color: Highlight;
    }
  }
</style>
