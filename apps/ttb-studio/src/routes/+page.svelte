<script lang="ts">
  import { onMount } from 'svelte';
  import BrandHeader from '@vbm/ui/BrandHeader.svelte';
  import StatusPanel from '@vbm/ui/StatusPanel.svelte';
  import {
    soundCharacters,
    soundCharacterNames,
    validateGenerationRequest,
    type SoundCharacter,
    type GenerationEngine,
    type SongMode,
    type TTBCapabilities,
    type GenerationRequest
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
  let busy = $state(false);
  let message = $state('Checking local audio engines…');
  let tone = $state<'neutral' | 'warning' | 'success'>('neutral');
  let capabilities = $state<TTBCapabilities | null>(null);

  onMount(async () => {
    try {
      const response = await fetch('/api/capabilities');
      if (!response.ok) {
        message = 'Python audio service is offline. The design editor remains available.';
        tone = 'warning';
        return;
      }
      capabilities = (await response.json()) as TTBCapabilities;
      message =
        'The model adapters are not configured yet. You can prepare settings, but audio generation remains unavailable.';
      tone = 'neutral';
    } catch {
      message = 'Audio backend unavailable.';
      tone = 'warning';
    }
  });

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
      mastering_intensity: mastering
    };
    const error = validateGenerationRequest(payload);
    if (error) {
      message = error;
      tone = 'warning';
      return;
    }
    busy = true;
    message = 'Checking generation readiness…';
    tone = 'neutral';
    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      if (!response.ok) {
        message = body.detail || 'No generation provider configured.';
        tone = 'warning';
        return;
      }
      message = 'Generation job accepted. Inspect the job dashboard for status.';
      tone = 'success';
    } catch (error) {
      message = error instanceof Error ? error.message : 'Generation failed.';
      tone = 'warning';
    } finally {
      busy = false;
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
          placeholder="Add lyrics to generate a full song…"></textarea>
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
            <option value="ace-step">ACE-Step 1.5</option>
            <option value="heartmula">HeartMuLa</option>
            <option value="external-v2">External V2 (verify provider)</option>
          </select>
        </div>
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
        {busy ? 'Checking…' : 'Check generation readiness'}
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
      <div style="margin:25px 0"><StatusPanel title="Generation readiness" {message} {tone} /></div>
      <h2>Engine availability</h2>
      {#if capabilities}
        {#each capabilities.engines as item (item.id)}
          <p><strong>{item.name}</strong> · {item.status}</p>
        {/each}
      {:else}
        <p class="note">
          Start the Python prototype on 127.0.0.1:8002 for local capability discovery.
        </p>
      {/if}
      <p class="note">
        No real audio is generated by this scaffold. Model deployment, premium processing, storage,
        and billing are implementation phases.
      </p>
    </aside>
  </div>
</main>
