<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import BrandHeader from '@vbm/ui/BrandHeader.svelte';
  import StatusPanel from '@vbm/ui/StatusPanel.svelte';
  import {
    soundCharacters,
    soundCharacterNames,
    validateGenerationRequest,
    minSongSeconds,
    maxSongSeconds,
    type SoundCharacter,
    type GenerationEngine,
    type SongMode,
    type TTBCapabilities,
    type GenerationRequest,
    type GenerationJob,
    type InlineAudio
  } from '@vbm/contracts';

  const vocalUrl = import.meta.env.VITE_VOCAL_FIX_URL || 'http://localhost:5173';
  let prompt = $state(
    'Dark 1990s East Coast hip-hop, haunting minor-key piano, hard drums, deep bass and imperfect live-room energy.'
  );
  let lyrics = $state('');
  let mode = $state<SongMode>('full-song');
  let engine = $state<GenerationEngine>('ace-step');
  let character = $state<SoundCharacter>('raw');
  let premium = $state(false);
  let texture = $state(70);
  let human = $state(65);
  let mastering = $state(25);
  let duration = $state(120);
  let audioSrc = $state<string | null>(null);
  let audioType = $state('audio/mpeg');
  let songLyrics = $state<string | null>(null);
  let run = 0;
  let busy = $state(false);
  let message = $state('Checking hosted models…');
  let tone = $state<'neutral' | 'warning' | 'success'>('neutral');
  let capabilities = $state<TTBCapabilities | null>(null);
  type Tone = 'neutral' | 'warning' | 'success';
  type JobReply = GenerationJob & { detail?: string };

  onMount(async () => {
    try {
      const response = await fetch('/api/capabilities');
      if (!response.ok) {
        message = 'Could not check hosted model availability. The editor remains available.';
        tone = 'warning';
        return;
      }
      capabilities = (await response.json()) as TTBCapabilities;
      message = capabilities.generation_ready
        ? 'Ready. Choose a model and generate a song.'
        : 'No hosted model is ready. Add FAL_KEY or GEMINI_API_KEY to the server environment.';
      tone = capabilities.generation_ready ? 'success' : 'neutral';
    } catch {
      message = 'Could not check hosted model availability.';
      tone = 'warning';
    }
  });

  onDestroy(() => {
    run += 1;
    clearAudio();
  });

  // Ignore results from a superseded or unmounted request.
  function report(token: number, text: string, nextTone: Tone = 'warning') {
    if (token !== run) return;
    message = text;
    tone = nextTone;
  }

  async function readJson<T>(response: Response): Promise<Partial<T>> {
    try {
      return (await response.json()) as Partial<T>;
    } catch {
      return {};
    }
  }

  function clearAudio() {
    if (audioSrc) URL.revokeObjectURL(audioSrc);
    audioSrc = null;
  }

  function showAudio(blob: Blob) {
    clearAudio();
    audioType = blob.type || 'audio/mpeg';
    audioSrc = URL.createObjectURL(blob);
  }

  function inlineBlob(audio: InlineAudio): Blob {
    const bytes = Uint8Array.from(atob(audio.data_base64), (char) => char.charCodeAt(0));
    return new Blob([bytes], { type: audio.content_type });
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const downloadExtensions: Record<string, string> = {
    'audio/wav': 'wav',
    'audio/flac': 'flac',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3'
  };
  const retryable = (status: number) => status === 429 || status >= 500;
  const maxPollFailures = 3;

  async function loadAudio(url: string, jobId: string, token: number) {
    report(token, 'Downloading and verifying audio…', 'neutral');
    try {
      const audio = await fetch(url);
      if (!audio.ok) {
        const body = await readJson<{ detail: string }>(audio);
        report(
          token,
          (body.detail || 'The finished audio could not be verified.') + ' Job id: ' + jobId
        );
        return;
      }
      const blob = await audio.blob();
      if (token !== run) return;
      showAudio(blob);
      report(token, 'Song ready.', 'success');
    } catch {
      report(token, 'The audio download was incomplete. Job id: ' + jobId);
    }
  }

  async function pollJob(jobId: string, token: number) {
    const deadline = Date.now() + 15 * 60_000;
    let failures = 0;
    // A paid job keeps running server-side, so transient errors retry and the id is shown on give-up.
    const giveUp = (text: string) => report(token, text + ' Job id: ' + jobId);
    while (token === run && Date.now() < deadline) {
      await sleep(3000 * 2 ** failures);
      if (token !== run) return;
      let response: Response;
      try {
        response = await fetch('/api/generations/' + encodeURIComponent(jobId));
      } catch {
        if (++failures > maxPollFailures) {
          giveUp('Lost connection while checking the song.');
          return;
        }
        continue;
      }
      const job = await readJson<JobReply>(response);
      if (!response.ok) {
        if (retryable(response.status) && ++failures <= maxPollFailures) continue;
        giveUp(job.detail || 'Could not check the generation job.');
        return;
      }
      failures = 0;
      if (job.status === 'failed') {
        report(token, job.detail || 'The provider could not generate this song.');
        return;
      }
      if (job.status === 'completed' && job.audio_url) {
        await loadAudio(job.audio_url, jobId, token);
        return;
      }
      report(
        token,
        job.status === 'queued' ? 'Waiting in the provider queue…' : 'Generating your song…',
        'neutral'
      );
    }
    if (token === run) giveUp('The song is taking longer than 15 minutes. Try again later.');
  }

  async function generate(event: SubmitEvent) {
    event.preventDefault();
    const payload: GenerationRequest = {
      prompt,
      lyrics: lyrics.trim() || null,
      mode,
      engine,
      sound_character: character,
      premium_studio: premium,
      texture,
      human_variation: human,
      mastering_intensity: mastering,
      duration_seconds: duration
    };
    const error = validateGenerationRequest(payload);
    if (error) {
      message = error;
      tone = 'warning';
      return;
    }
    const token = ++run;
    busy = true;
    const writing = engine === 'ace-step' && mode === 'full-song' && !payload.lyrics;
    report(
      token,
      engine === 'lyria-3.5'
        ? 'Generating with Lyria. This can take a few minutes…'
        : writing
          ? 'Writing lyrics, then submitting your song…'
          : 'Submitting your song…',
      'neutral'
    );
    songLyrics = null;
    clearAudio();
    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await readJson<JobReply>(response);
      if (token !== run) return;
      if (!response.ok) {
        const detail = body.detail || 'The song request failed (HTTP ' + response.status + ').';
        if (body.lyrics) {
          lyrics = body.lyrics;
          songLyrics = body.lyrics;
          report(
            token,
            detail + ' The written lyrics were put in the lyrics box so a retry reuses them.'
          );
        } else report(token, detail);
        return;
      }
      if (body.status === 'completed' && body.audio) {
        showAudio(inlineBlob(body.audio));
        songLyrics = body.lyrics ?? null;
        report(token, 'Song ready.', 'success');
        return;
      }
      if (!body.job_id) {
        report(token, 'The server returned an unexpected response.');
        return;
      }
      songLyrics = body.lyrics ?? null;
      report(token, 'Waiting in the provider queue…', 'neutral');
      await pollJob(body.job_id, token);
    } catch (error) {
      report(token, error instanceof Error ? error.message : 'Generation failed.');
    } finally {
      if (token === run) busy = false;
    }
  }
</script>

<BrandHeader product="TTB Studio" sisterUrl={vocalUrl} sisterName="Vocal Fix" />
<main>
  <span class="eyebrow">Application 02 / Text-to-beat and complete songs</span>
  <h1>Make music<br />with <em>character.</em></h1>
  <p class="lead">
    A Suno-style studio designed for expression instead of automatic polish. Control the raw feel,
    compare generation models and choose Premium Studio only when the recording needs it.
  </p>
  <div class="panels">
    <form class="panel" onsubmit={generate}>
      <div class="field">
        <label for="prompt">What should the music feel like?</label>
        <textarea id="prompt" bind:value={prompt} minlength="5" maxlength="3000" required
        ></textarea>
      </div>
      <div class="field">
        <label for="lyrics">Original lyrics (optional)</label>
        <textarea
          id="lyrics"
          bind:value={lyrics}
          maxlength="15000"
          placeholder="Paste your lyrics, or leave empty to have original lyrics written for you…"
        ></textarea>
      </div>
      <div class="duo">
        <div class="field">
          <label for="mode">Output</label>
          <select id="mode" bind:value={mode}>
            <option value="full-song">Complete song</option>
            <option value="instrumental">Beat / instrumental</option>
          </select>
        </div>
        <div class="field">
          <label for="engine">Generation model</label>
          <select id="engine" bind:value={engine}>
            <option value="ace-step">ACE-Step 1.5 via fal</option>
            <option value="lyria-3.5">Google Lyria 3.5</option>
            <option value="heartmula">HeartMuLa</option>
            <option value="external-v2">External V2 (verify provider)</option>
          </select>
        </div>
      </div>
      <div class="field">
        <div class="meter">
          <label for="duration">Song length</label><span class="value">{duration} s</span>
        </div>
        <input
          class="slider"
          id="duration"
          type="range"
          min={minSongSeconds}
          max={maxSongSeconds}
          step="10"
          bind:value={duration}
        />
      </div>
      <div class="field">
        <label>Sound character</label>
        <div class="presets">
          {#each soundCharacters as id (id)}
            <button
              class="preset"
              class:selected={character === id}
              type="button"
              onclick={() => (character = id)}
              aria-pressed={character === id}
            >
              {soundCharacterNames[id]}
            </button>
          {/each}
        </div>
      </div>
      <label class="checkbox">
        <input type="checkbox" bind:checked={premium} />
        <span
          ><strong>Premium Studio finishing</strong><small
            >Optional, separate from sound character. When implemented, it will preserve the
            original unmastered recording.</small
          ></span
        >
      </label>
      <button class="primary" type="submit" disabled={busy || prompt.trim().length < 5}>
        {busy ? 'Generating…' : 'Generate song'}
      </button>
    </form>
    <aside class="panel">
      <span class="badge">Production controls</span>
      <h2>Make it yours.</h2>
      <p>
        These represent future model/DSP controls and are only effective when supported by the
        selected engine.
      </p>
      <div class="meter">
        <label for="texture">Rawness / texture</label><span class="value">{texture}%</span>
      </div>
      <input
        class="slider"
        id="texture"
        type="range"
        min="0"
        max="100"
        step="1"
        bind:value={texture}
      />
      <div class="meter">
        <label for="human">Human variation</label><span class="value">{human}%</span>
      </div>
      <input class="slider" id="human" type="range" min="0" max="100" step="1" bind:value={human} />
      <div class="meter">
        <label for="master">Mastering intensity</label><span class="value">{mastering}%</span>
      </div>
      <input
        class="slider"
        id="master"
        type="range"
        min="0"
        max="100"
        step="1"
        bind:value={mastering}
      />
      <div style="margin:25px 0"><StatusPanel title="Generation status" {message} {tone} /></div>
      {#if audioSrc}
        <audio controls src={audioSrc} aria-label="Generated song"></audio>
        <p>
          <a
            href={audioSrc}
            rel="external"
            download={'song.' + (downloadExtensions[audioType] ?? 'mp3')}>Download song</a
          >
        </p>
      {/if}
      {#if songLyrics}
        <details>
          <summary>Lyrics and structure</summary>
          <pre>{songLyrics}</pre>
        </details>
      {/if}
      <h2>Engine availability</h2>
      {#if capabilities}
        {#each capabilities.engines as item (item.id)}
          <p><strong>{item.name}</strong> · {item.status}</p>
        {/each}
      {:else}
        <p class="note">Checking hosted model availability…</p>
      {/if}
      <p class="note">
        Songs are generated by hosted providers, not on this computer. Audio is verified before
        playback and is not saved yet. Premium Studio, storage and billing are later phases.
      </p>
    </aside>
  </div>
</main>
