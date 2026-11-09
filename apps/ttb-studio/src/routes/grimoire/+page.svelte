<script lang="ts">
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import ArcaneTextarea from '@vbm/ui/ArcaneTextarea.svelte';
  import ArcaneSelect from '@vbm/ui/ArcaneSelect.svelte';
  import RuneToggle from '@vbm/ui/RuneToggle.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import RuneMeter from '@vbm/ui/RuneMeter.svelte';
  import Waveform from '@vbm/ui/Waveform.svelte';
  import Spectrogram from '@vbm/ui/Spectrogram.svelte';
  import PitchTrace from '@vbm/ui/PitchTrace.svelte';
  import SummoningCircle from '@vbm/ui/SummoningCircle.svelte';
  import GrimoirePlayer from '@vbm/ui/GrimoirePlayer.svelte';
  import RuneDropzone from '@vbm/ui/RuneDropzone.svelte';
  import ABCompare from '@vbm/ui/ABCompare.svelte';
  import RuneRecorder from '@vbm/ui/RuneRecorder.svelte';
  import VoiceSigil from '@vbm/ui/VoiceSigil.svelte';
  import { decodeAudioFromBlob, formatTime } from '@vbm/ui/audio';
  import { onMount } from 'svelte';

  type StageState = 'pending' | 'active' | 'done' | 'failed';

  let name = $state('');
  let lyrics = $state('');
  let model = $state('ace');
  let premium = $state(false);
  let busy = $state(false);
  let buffer: AudioBuffer | null = $state(null);
  let compare: AudioBuffer | null = $state(null);
  let currentTime = $state(0);
  let fileError = $state('');
  let playerSrc = $state('');
  let fileAudio: HTMLAudioElement | undefined = $state();
  let files: File[] = $state([]);
  let takes: File[] = $state([]);
  let abUrls: { a: string; b: string } | null = $state(null);
  let stageIndex = $state(1);

  const stageNames = ['Upload', 'Separate', 'Clean up', 'Generate', 'Save'];
  const stages = $derived(
    stageNames.map((label, i) => ({
      id: label.toLowerCase(),
      label,
      state: (i < stageIndex ? 'done' : i === stageIndex ? 'active' : 'pending') as StageState
    }))
  );

  const SR = 44100;

  /** Builds a real buffer: a voiced chirp 220→660 Hz with a gap, plus a decaying harmonic. */
  function synthesize(): AudioBuffer {
    const seconds = 4;
    const buf = new AudioBuffer({ length: SR * seconds, sampleRate: SR, numberOfChannels: 1 });
    const out = buf.getChannelData(0);
    let phase = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const hz = 220 * 3 ** (t / seconds);
      phase += (2 * Math.PI * hz) / SR;
      const gap = t > 1.8 && t < 2.2 ? 0 : 1;
      const env = Math.min(1, t * 8) * Math.min(1, (seconds - t) * 4);
      out[i] =
        gap *
        env *
        (0.5 * Math.sin(phase) + 0.15 * Math.sin(2 * phase) + 0.08 * Math.sin(3 * phase));
    }
    return buf;
  }

  function quieter(src: AudioBuffer): AudioBuffer {
    const buf = new AudioBuffer({
      length: src.length,
      sampleRate: src.sampleRate,
      numberOfChannels: 1
    });
    const a = src.getChannelData(0);
    const b = buf.getChannelData(0);
    for (let i = 0; i < a.length; i++) b[i] = a[i] * 0.45;
    return buf;
  }

  function toWavUrl(buf: AudioBuffer): string {
    const data = buf.getChannelData(0);
    const bytes = new DataView(new ArrayBuffer(44 + data.length * 2));
    const w = (o: number, s: string) =>
      [...s].forEach((ch, i) => bytes.setUint8(o + i, ch.charCodeAt(0)));
    w(0, 'RIFF');
    bytes.setUint32(4, 36 + data.length * 2, true);
    w(8, 'WAVEfmt ');
    bytes.setUint32(16, 16, true);
    bytes.setUint16(20, 1, true);
    bytes.setUint16(22, 1, true);
    bytes.setUint32(24, buf.sampleRate, true);
    bytes.setUint32(28, buf.sampleRate * 2, true);
    bytes.setUint16(32, 2, true);
    bytes.setUint16(34, 16, true);
    w(36, 'data');
    bytes.setUint32(40, data.length * 2, true);
    for (let i = 0; i < data.length; i++)
      bytes.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
    return URL.createObjectURL(new Blob([bytes.buffer], { type: 'audio/wav' }));
  }

  function setPlayer(url: string) {
    if (playerSrc) URL.revokeObjectURL(playerSrc);
    playerSrc = url;
  }

  function useTone() {
    const tone = synthesize();
    buffer = tone;
    compare = quieter(tone);
    fileError = '';
    setPlayer(toWavUrl(tone));
    if (abUrls) {
      URL.revokeObjectURL(abUrls.a);
      URL.revokeObjectURL(abUrls.b);
    }
    abUrls = { a: toWavUrl(compare), b: toWavUrl(tone) };
  }

  async function loadFile(file: File) {
    try {
      const decoded = await decodeAudioFromBlob(file);
      if (files[0] !== file) return;
      buffer = decoded;
      compare = null;
      fileError = '';
      setPlayer(URL.createObjectURL(file));
    } catch {
      fileError = 'That file could not be decoded as audio.';
    }
  }

  $effect(() => {
    const file = files[0];
    if (file) void loadFile(file);
  });

  onMount(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') useTone();
  });

  function fakeBusy() {
    busy = true;
    setTimeout(() => {
      busy = false;
      stageIndex = (stageIndex + 1) % (stageNames.length + 1);
    }, 1200);
  }

  $effect(() => () => {
    if (playerSrc) URL.revokeObjectURL(playerSrc);
    if (abUrls) {
      URL.revokeObjectURL(abUrls.a);
      URL.revokeObjectURL(abUrls.b);
    }
  });
</script>

<svelte:head><title>Analyzer · VBM Studio</title></svelte:head>

<div class="grimoire">
  <div class="intro">
    <p class="eyebrow">Design system</p>
    <h1>Analyzer</h1>
    <p>Every VBM Studio audio tool on one page. Graphs render only real audio.</p>
  </div>

  <div class="grid">
    <ArcanePanel title="Source sound" eyebrow="1 · input" glow="ember">
      <div class="stack">
        <RuneDropzone
          label="Choose a local audio file"
          accept="audio/*,.wav,.mp3,.flac,.ogg,.m4a"
          bind:files
          hint="Decoded in your browser; never uploaded."
        />
        <RuneButton variant="ghost" onclick={useTone}>Synthesize test chirp</RuneButton>
        {#if fileError}<OracleStatus tone="danger">{fileError}</OracleStatus>{/if}
        {#if buffer}
          <OracleStatus tone="success">
            {buffer.numberOfChannels} ch · {buffer.sampleRate} Hz · {formatTime(buffer.duration)}
          </OracleStatus>
        {/if}
      </div>
    </ArcanePanel>

    <ArcanePanel title="Controls" eyebrow="2 · inputs">
      {#snippet actions()}
        <RuneButton variant="ghost" onclick={() => (name = '')}>Clear</RuneButton>
      {/snippet}
      <div class="stack">
        <ArcaneInput
          label="Song name"
          bind:value={name}
          placeholder="Untitled song"
          maxlength={60}
        />
        <ArcaneTextarea
          label="Lyrics"
          bind:value={lyrics}
          rows={4}
          placeholder="Write some words…"
          maxlength={500}
        />
        <ArcaneSelect
          label="Engine"
          bind:value={model}
          options={[
            { value: 'ace', label: 'ACE-Step 1.5', hint: 'Complete songs with vocals.' },
            { value: 'lyria', label: 'Lyria 3.5', hint: 'Instrumental clips.' },
            { value: 'v2', label: 'External V2', hint: 'Not integrated.', disabled: true }
          ]}
        />
        <RuneToggle
          label="Premium Studio"
          bind:checked={premium}
          hint="Opt-in finishing on a derived copy."
        />
        <div class="row">
          <RuneButton {busy} onclick={fakeBusy}>Create</RuneButton>
          <RuneButton variant="ghost" href="#graphs">Secondary link</RuneButton>
          <RuneButton variant="danger">Delete</RuneButton>
          <RuneButton disabled>Disabled</RuneButton>
        </div>
      </div>
    </ArcanePanel>
  </div>

  <ArcanePanel title="Progress" eyebrow="3 · progress" glow="teal">
    <RitualProgress
      {stages}
      detail={stageIndex >= stageNames.length
        ? 'All steps are complete.'
        : `Stage ${stageIndex + 1}: ${stageNames[stageIndex]}…`}
    />
    <div class="row spaced">
      <SigilLoader />
      <RuneMeter label="Clarity" value={0.82} tone="good" />
      <RuneMeter label="Noise" value={0.46} tone="warn" display="-38 dB" />
      <RuneMeter label="Clipping" value={0.12} tone="bad" />
    </div>
    <div class="stack">
      <OracleStatus tone="neutral">The circle is drawn.</OracleStatus>
      <OracleStatus tone="warning">The source is quiet; consider a hotter take.</OracleStatus>
      <OracleStatus tone="danger">The engine refused the offering (HTTP 503).</OracleStatus>
    </div>
  </ArcanePanel>

  <section id="graphs" class="stack">
    <ArcanePanel title="Waveform" eyebrow="4 · voice graphs" glow="violet">
      <Waveform
        {buffer}
        {currentTime}
        onseek={(s) => (currentTime = s)}
        compareBuffer={compare}
        regions={buffer
          ? [{ start: buffer.duration * 0.1, end: buffer.duration * 0.3, label: 'gold vocal' }]
          : []}
      />
      <p class="note vbm-mono">
        playhead {formatTime(currentTime)} — click or use arrow keys to seek
      </p>
    </ArcanePanel>
    <div class="grid">
      <ArcanePanel title="Spectrogram" eyebrow="5 · STFT" glow="ember">
        <Spectrogram {buffer} />
      </ArcanePanel>
      <ArcanePanel title="Pitch trace" eyebrow="6 · YIN" glow="teal">
        <PitchTrace {buffer} />
      </ArcanePanel>
    </div>
    <ArcanePanel title="Player" eyebrow="7 · playback">
      {#if playerSrc}
        <GrimoirePlayer
          src={playerSrc}
          title="Your audio"
          subtitle="Local, never uploaded"
          downloadName="audio"
        />
      {:else}
        <p class="note">Choose a file or synthesize the chirp to load it into the player.</p>
      {/if}
    </ArcanePanel>
    <ArcanePanel title="Live spectrum" eyebrow="8 · live spectrum">
      <div class="row">
        <SummoningCircle audio={fileAudio ?? null} />
        {#if playerSrc}
          <audio bind:this={fileAudio} src={playerSrc} controls></audio>
        {/if}
      </div>
    </ArcanePanel>
    <ArcanePanel title="A | B compare" eyebrow="9 · before / after" glow="teal">
      {#if abUrls}
        <ABCompare
          title="Chirp: quieted vs original"
          a={{ src: abUrls.a, label: 'Before' }}
          b={{ src: abUrls.b, label: 'After' }}
        />
      {:else}
        <p class="note">Synthesize the chirp to compare two real renders.</p>
      {/if}
    </ArcanePanel>
    <div class="grid">
      <ArcanePanel title="Voice fingerprint" eyebrow="10 · voice print" glow="violet">
        <div class="center"><VoiceSigil {buffer} /></div>
      </ArcanePanel>
      <ArcanePanel title="Recorder" eyebrow="11 · record" glow="ember">
        <RuneRecorder bind:files={takes} maxSeconds={60} />
        {#if takes.length}
          <p class="note vbm-mono">{takes.length} take{takes.length === 1 ? '' : 's'} kept</p>
        {/if}
      </ArcanePanel>
    </div>
  </section>
</div>

<style>
  .intro {
    max-width: 44rem;
    margin-bottom: 2rem;
  }
  .intro h1 {
    font-size: clamp(2.2rem, 6vw, 4rem);
    background: linear-gradient(90deg, var(--vbm-text), var(--vbm-violet));
    background-clip: text;
    color: transparent;
  }
  .eyebrow {
    font-family: var(--vbm-font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.72rem;
    color: var(--vbm-ember);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .stack {
    display: grid;
    gap: 1rem;
  }
  section.stack {
    margin-top: 1.5rem;
    gap: 1.5rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }
  .spaced {
    justify-content: space-around;
    margin: 1.5rem 0;
  }
  .center {
    display: grid;
    place-items: center;
  }
  .note {
    color: var(--vbm-muted);
    font-size: 0.8rem;
    margin: 0.6rem 0 0;
  }
</style>
