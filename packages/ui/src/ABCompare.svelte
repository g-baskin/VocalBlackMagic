<script lang="ts">
  import { decodeAudioFromUrl, formatTime, mixToMono, rmsDbfs } from './audio';
  import SigilLoader from './SigilLoader.svelte';
  import Waveform from './Waveform.svelte';

  type Source = { src: string; label: string };
  let { a, b, title }: { a: Source; b: Source; title?: string } = $props();

  let bufA = $state<AudioBuffer | null>(null);
  let bufB = $state<AudioBuffer | null>(null);
  let error: string | null = $state(null);
  let loading = $state(false);
  let active: 'a' | 'b' = $state('a');
  let playing = $state(false);
  let position = $state(0);

  const duration = $derived(Math.max(bufA?.duration ?? 0, bufB?.duration ?? 0));
  const levelA = $derived(bufA ? rmsDbfs(mixToMono(bufA)) : null);
  const levelB = $derived(bufB ? rmsDbfs(mixToMono(bufB)) : null);

  // Web Audio transport: both sources run in lock-step; switching only swaps gains.
  let ctx: AudioContext | null = null;
  let nodes: { src: AudioBufferSourceNode; gain: GainNode }[] = [];
  let startedAt = 0;
  let raf = 0;

  $effect(() => {
    const urlA = a.src;
    const urlB = b.src;
    const controller = new AbortController();
    stop();
    bufA = null;
    bufB = null;
    error = null;
    loading = true;
    position = 0;
    Promise.all([
      decodeAudioFromUrl(urlA, controller.signal),
      decodeAudioFromUrl(urlB, controller.signal)
    ])
      .then(([x, y]) => {
        bufA = x;
        bufB = y;
      })
      .catch(() => {
        if (!controller.signal.aborted)
          error = 'One of the sources could not be fetched or decoded.';
      })
      .finally(() => {
        if (!controller.signal.aborted) loading = false;
      });
    return () => controller.abort();
  });

  $effect(() => () => {
    stop();
    void ctx?.close();
    ctx = null;
  });

  function stop() {
    for (const n of nodes) {
      n.src.onended = null;
      try {
        n.src.stop();
      } catch {
        // already stopped
      }
      n.src.disconnect();
      n.gain.disconnect();
    }
    nodes = [];
    cancelAnimationFrame(raf);
    playing = false;
  }

  function start(offset: number) {
    if (!bufA || !bufB) return;
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      error = 'Web Audio is not supported in this browser.';
      return;
    }
    ctx = ctx ?? new Ctor();
    const c = ctx;
    void c.resume();
    stop();
    const when = c.currentTime + 0.03;
    nodes = [bufA, bufB].map((buf, i) => {
      const src = c.createBufferSource();
      src.buffer = buf;
      const gain = c.createGain();
      gain.gain.value = (i === 0) === (active === 'a') ? 1 : 0;
      src.connect(gain).connect(c.destination);
      if (offset < buf.duration) src.start(when, offset);
      return { src, gain };
    });
    startedAt = when - offset;
    playing = true;
    const tick = () => {
      position = Math.min(duration, Math.max(0, c.currentTime - startedAt));
      if (position >= duration) {
        stop();
        position = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function toggle() {
    if (playing) {
      stop();
    } else start(position >= duration ? 0 : position);
  }

  function seek(seconds: number) {
    position = seconds;
    if (playing) start(seconds);
  }

  function choose(side: 'a' | 'b') {
    active = side;
    if (!ctx) return;
    const now = ctx.currentTime;
    nodes.forEach((n, i) => {
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.setTargetAtTime((i === 0) === (side === 'a') ? 1 : 0, now, 0.008);
    });
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'b') {
      e.preventDefault();
      choose(key);
    }
  }

  const fmt = (db: number | null) =>
    db === null ? '…' : Number.isFinite(db) ? `${db.toFixed(1)} dBFS` : 'silent';
  const delta = $derived(
    levelA !== null && levelB !== null && Number.isFinite(levelA) && Number.isFinite(levelB)
      ? levelB - levelA
      : null
  );
</script>

<div class="ab">
  {#if title}<h3>{title}</h3>{/if}
  <div class="bar">
    <button
      class="play"
      type="button"
      onclick={toggle}
      disabled={!bufA || !bufB}
      aria-label={playing ? 'Pause' : 'Play'}
    >
      {#if playing}
        <svg viewBox="0 0 24 24" aria-hidden="true"
          ><rect x="6" y="4" width="4" height="16" /><rect
            x="14"
            y="4"
            width="4"
            height="16"
          /></svg
        >
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="7,4 20,12 7,20" /></svg>
      {/if}
    </button>
    <div class="switch" role="group" aria-label="Choose source (press A or B)">
      <button
        type="button"
        aria-pressed={active === 'a'}
        aria-keyshortcuts="A"
        onclick={() => choose('a')}
        {onkeydown}
      >
        <span class="key">A</span>{a.label}
      </button>
      <button
        type="button"
        aria-pressed={active === 'b'}
        aria-keyshortcuts="B"
        onclick={() => choose('b')}
        {onkeydown}
      >
        <span class="key">B</span>{b.label}
      </button>
    </div>
    <span class="time vbm-mono">{formatTime(position)} / {formatTime(duration)}</span>
  </div>
  <Waveform
    buffer={active === 'a' ? bufA : bufB}
    compareBuffer={active === 'a' ? bufB : bufA}
    currentTime={position}
    duration={duration || undefined}
    onseek={seek}
    color={active === 'a' ? 'violet' : 'teal'}
    height={110}
    label="{active === 'a' ? a.label : b.label} (ghost: {active === 'a' ? b.label : a.label})"
  />
  <dl class="levels vbm-mono">
    <div class:on={active === 'a'}>
      <dt>A · {a.label}</dt>
      <dd>{fmt(levelA)}</dd>
    </div>
    <div class:on={active === 'b'}>
      <dt>B · {b.label}</dt>
      <dd>{fmt(levelB)}</dd>
    </div>
    {#if delta !== null}
      <div>
        <dt>Δ B − A</dt>
        <dd>{delta >= 0 ? '+' : ''}{delta.toFixed(1)} dB</dd>
      </div>
    {/if}
  </dl>
  {#if loading}<SigilLoader label="Decoding both" size={28} />{/if}
  {#if error}<p class="err" role="alert">{error}</p>{/if}
</div>

<style>
  .ab {
    display: grid;
    gap: 0.75rem;
    min-width: 0;
  }
  h3 {
    margin: 0;
    font-size: 1.05rem;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .play {
    width: 3rem;
    height: 3rem;
    border: 0;
    display: grid;
    place-items: center;
    cursor: pointer;
    color: var(--vbm-void);
    background: linear-gradient(135deg, var(--vbm-violet), var(--vbm-teal));
    border-radius: 50%;
  }
  .play:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .play:focus-visible {
    outline: none;
    background: var(--vbm-ember);
  }
  .play svg {
    width: 1.1rem;
    height: 1.1rem;
    fill: currentColor;
  }
  .switch {
    display: flex;
    min-width: 0;
  }
  .switch button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.6rem;
    padding: 0.4rem 1.1rem;
    border: 0;
    cursor: pointer;
    font-family: var(--vbm-font-display);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    color: var(--vbm-muted);
    background: var(--vbm-obsidian-3);
    border-radius: var(--vbm-radius-sm);
  }
  .switch button[aria-pressed='true'] {
    color: var(--vbm-void);
    background: linear-gradient(90deg, var(--vbm-violet), var(--vbm-teal));
  }
  .switch button:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--vbm-ember);
  }
  .key {
    font-family: var(--vbm-font-mono);
    font-weight: 600;
  }
  .time {
    margin-left: auto;
    color: var(--vbm-teal);
    font-size: 0.8rem;
  }
  .levels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    margin: 0;
    font-size: 0.75rem;
  }
  .levels div {
    display: grid;
    color: var(--vbm-muted);
  }
  .levels .on {
    color: var(--vbm-text);
  }
  dt {
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.65rem;
  }
  dd {
    margin: 0;
    font-size: 0.95rem;
  }
  .err {
    margin: 0;
    color: var(--vbm-blood);
  }
</style>
