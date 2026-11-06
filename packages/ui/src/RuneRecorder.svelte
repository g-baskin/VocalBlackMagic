<script lang="ts">
  import { detectPitch, formatTime, hzToNote } from './audio';
  import RuneButton from './RuneButton.svelte';

  let {
    files = $bindable([]),
    maxSeconds = 120,
    label = 'Record a take'
  }: { files: File[]; maxSeconds?: number; label?: string } = $props();

  type Phase = 'idle' | 'requesting' | 'recording' | 'review' | 'error';
  let phase: Phase = $state('idle');
  let message = $state('');
  let elapsed = $state(0);
  let note = $state('—');
  let hz = $state(0);
  let take: { blob: Blob; url: string; type: string } | null = $state(null);
  let canvas: HTMLCanvasElement | undefined = $state();

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let audioCtx: AudioContext | null = null;
  let raf = 0;
  let chunks: Blob[] = [];

  function supported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  function teardown() {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    void audioCtx?.close();
    audioCtx = null;
  }

  $effect(() => () => {
    if (recorder?.state === 'recording') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    teardown();
    if (take) URL.revokeObjectURL(take.url);
  });

  async function record() {
    if (!supported()) {
      phase = 'error';
      message = 'This browser cannot record audio (getUserMedia / MediaRecorder unavailable).';
      return;
    }
    discard();
    phase = 'requesting';
    message = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      phase = 'error';
      const name = e instanceof DOMException ? e.name : '';
      message =
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone permission was denied. Allow microphone access for this site and try again.'
          : name === 'NotFoundError'
            ? 'No microphone was found.'
            : 'The microphone could not be opened.';
      return;
    }
    const s = stream;
    chunks = [];
    recorder = new MediaRecorder(s);
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const type = recorder?.mimeType || chunks[0]?.type || 'audio/webm';
      const blob = new Blob(chunks, { type });
      teardown();
      if (blob.size === 0) {
        phase = 'error';
        message = 'The recording came back empty.';
        return;
      }
      take = { blob, url: URL.createObjectURL(blob), type };
      phase = 'review';
    };
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    let analyser: AnalyserNode | null = null;
    if (Ctor) {
      audioCtx = new Ctor();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      audioCtx.createMediaStreamSource(s).connect(analyser);
    }
    recorder.start(250);
    phase = 'recording';
    elapsed = 0;
    note = '—';
    hz = 0;
    const t0 = performance.now();
    const samples = new Float32Array(2048);
    let frame = 0;
    const loop = () => {
      elapsed = (performance.now() - t0) / 1000;
      if (elapsed >= maxSeconds) {
        stop();
        return;
      }
      if (analyser && audioCtx) {
        analyser.getFloatTimeDomainData(samples);
        if (frame++ % 6 === 0) {
          const p = detectPitch(samples, audioCtx.sampleRate, {
            frame: 2048,
            hop: 2048,
            minHz: 60,
            maxHz: 1000
          });
          hz = p.hz[0] ?? 0;
          note = hz > 0 ? hzToNote(hz) : '—';
        }
        draw(samples);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function draw(samples: Float32Array) {
    const cv = canvas;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = cv.clientWidth;
    if (cv.width !== Math.round(size * dpr)) {
      cv.width = Math.round(size * dpr);
      cv.height = Math.round(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const c = size / 2;
    const base = size * 0.3;
    ctx.strokeStyle = 'rgba(167,116,255,0.3)';
    ctx.beginPath();
    ctx.arc(c, c, base, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.strokeStyle = '#3ff0d2';
    ctx.shadowColor = '#3ff0d2';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const n = 256;
    for (let i = 0; i <= n; i++) {
      const v = samples[Math.floor((i / n) * (samples.length - 1))];
      const r = base + v * size * 0.18;
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function stop() {
    cancelAnimationFrame(raf);
    if (recorder?.state === 'recording') recorder.stop();
  }

  function keep() {
    if (!take) return;
    const ext = take.type.includes('ogg') ? 'ogg' : take.type.includes('mp4') ? 'm4a' : 'webm';
    files = [
      ...files,
      new File([take.blob], `take-${files.length + 1}.${ext}`, { type: take.type })
    ];
    URL.revokeObjectURL(take.url);
    take = null;
    phase = 'idle';
  }

  function discard() {
    if (take) URL.revokeObjectURL(take.url);
    take = null;
    if (phase === 'review') phase = 'idle';
  }
</script>

<div class="recorder">
  <span class="label">{label}</span>
  <div class="mirror" class:live={phase === 'recording'}>
    <canvas bind:this={canvas} aria-hidden="true"></canvas>
    <div class="readout" aria-live="off">
      {#if phase === 'recording'}
        <span class="note">{note}</span>
        <span class="hz vbm-mono">{hz > 0 ? `${hz.toFixed(1)} Hz` : 'unvoiced'}</span>
      {:else}
        <span class="dormant vbm-mono"
          >{phase === 'requesting' ? 'opening the mirror…' : 'mirror dormant'}</span
        >
      {/if}
    </div>
  </div>
  <div class="controls">
    {#if phase === 'recording'}
      <span class="timer vbm-mono" role="timer">
        <span class="dot" aria-hidden="true"></span>{formatTime(elapsed)} / {formatTime(maxSeconds)}
      </span>
      <RuneButton variant="danger" onclick={stop}>Stop</RuneButton>
    {:else if phase === 'review' && take}
      <audio src={take.url} controls></audio>
      <RuneButton onclick={keep}>Keep take</RuneButton>
      <RuneButton variant="ghost" onclick={discard}>Discard</RuneButton>
    {:else}
      <RuneButton onclick={record} busy={phase === 'requesting'}>Record</RuneButton>
    {/if}
  </div>
  {#if phase === 'recording'}<p class="vbm-sr-only" aria-live="polite">Recording started.</p>{/if}
  {#if message}<p class="err" role="alert">{message}</p>{/if}
</div>

<style>
  .recorder {
    display: grid;
    gap: 0.75rem;
    justify-items: center;
    min-width: 0;
  }
  .label {
    justify-self: start;
    font-family: var(--vbm-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  .mirror {
    position: relative;
    width: min(100%, 220px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(63 240 210 / 8%), transparent 65%), var(--vbm-void);
    box-shadow:
      inset 0 0 0 1px var(--vbm-line-bright),
      inset 0 0 40px rgb(91 43 196 / 35%);
  }
  .mirror.live {
    box-shadow:
      inset 0 0 0 1px var(--vbm-teal),
      0 0 24px rgb(63 240 210 / 25%),
      inset 0 0 40px rgb(91 43 196 / 45%);
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  .readout {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    pointer-events: none;
  }
  .note {
    font-family: var(--vbm-font-display);
    font-size: 2rem;
    color: var(--vbm-text);
    text-shadow: var(--vbm-glow-violet);
  }
  .hz {
    font-size: 0.7rem;
    color: var(--vbm-teal);
  }
  .dormant {
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--vbm-faint);
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: center;
  }
  audio {
    max-width: 100%;
  }
  .timer {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--vbm-text);
  }
  .dot {
    width: 0.6rem;
    height: 0.6rem;
    background: var(--vbm-blood);
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    animation: blink 1s steps(2) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.2;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
  .err {
    margin: 0;
    color: var(--vbm-blood);
    text-align: center;
  }
</style>
