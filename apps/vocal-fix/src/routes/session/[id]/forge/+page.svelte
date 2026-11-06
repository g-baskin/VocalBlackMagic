<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import RuneToggle from '@vbm/ui/RuneToggle.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import VoiceSigil from '@vbm/ui/VoiceSigil.svelte';
  import { decodeAudioFromUrl } from '@vbm/ui/audio';

  // Must equal CONSENT_STATEMENT in lib/server/forge.ts; the server rejects any other wording.
  const STATEMENT = 'This is my own voice and I hold the rights to these recordings.';
  const studioUrl = import.meta.env.VITE_TTB_STUDIO_URL || 'http://localhost:5174';

  type Stage = { id: string; label: string; state: 'pending' | 'active' | 'done' | 'failed' };
  type Job = {
    id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    stages: Stage[];
    detail: string;
    error?: string;
  };
  type Manifest = {
    id: string;
    mode: string;
    performer: string;
    gold?: { version: string; segments: unknown[] };
    voices: string[];
  };

  const id = $derived(page.params.id ?? '');
  let manifest = $state<Manifest | null>(null);
  let loadError = $state('');
  let name = $state('');
  let ownVoice = $state(false);
  let submitting = $state(false);
  let error = $state('');
  let job = $state<Job | null>(null);
  let goldBuffer = $state<AudioBuffer | null>(null);

  const normalize = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const nameMatches = $derived(!!manifest && normalize(name) === normalize(manifest.performer));
  const ready = $derived(!!manifest?.gold?.segments?.length);
  const canSign = $derived(ready && nameMatches && ownVoice && !submitting && !job);
  const done = $derived(job?.status === 'completed');

  $effect(() => {
    if (!id) return;
    fetch(`/api/sessions/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
        manifest = (await res.json()) as Manifest;
      })
      .catch(
        (e: unknown) =>
          (loadError = e instanceof Error ? e.message : 'Could not open this session.')
      );
  });

  $effect(() => {
    const file = manifest?.gold?.version;
    if (!file) return;
    const controller = new AbortController();
    decodeAudioFromUrl(
      `/api/sessions/${encodeURIComponent(id)}/audio/derived/${encodeURIComponent(file)}`,
      controller.signal
    )
      .then((b) => (goldBuffer = b))
      .catch(() => undefined);
    return () => controller.abort();
  });

  // Poll the job until it settles.
  $effect(() => {
    const j = job;
    if (!j || j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled') return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/sessions/${encodeURIComponent(id)}/jobs/${encodeURIComponent(j.id)}`
        );
        if (res.ok) job = (await res.json()) as Job;
        else job = { ...j };
      } catch {
        job = { ...j };
      }
    }, 2500);
    return () => clearTimeout(timer);
  });

  async function sign(e: SubmitEvent) {
    e.preventDefault();
    if (!canSign) return;
    submitting = true;
    error = '';
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/forge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attested_name: name, own_voice: true, statement: STATEMENT })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      job = body.job as Job;
    } catch (err) {
      error = err instanceof Error ? err.message : 'The forge refused.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head><title>Voice Forge · Vocal Fix · Vocal Black Magic</title></svelte:head>

<div class="page">
  <header class="intro">
    <p class="eyebrow">Voice forge · consent ritual</p>
    <h1>Bind Your Voice</h1>
    <a class="back" href={resolve('/session/[id]', { id })}>← Back to the session</a>
  </header>

  {#if loadError}
    <OracleStatus tone="danger">{loadError}</OracleStatus>
  {:else if !manifest}
    <SigilLoader label="Opening the session" />
  {:else}
    <div class="grid">
      <ArcanePanel title="What will happen" eyebrow="i · plainly" glow="teal">
        <ol class="plain">
          <li>
            The phrases in your <strong>Gold Vocal</strong> are packed into a training dataset.
          </li>
          <li>
            That dataset is sent to a hosted trainer (Replicate) to train a voice model. This is a
            paid run.
          </li>
          <li>The trained model is stored privately and listed in your Codex of voices.</li>
          <li>Only you can use it, in the Studio, to sing new songs in your own voice.</li>
          <li>You can revoke it at any time; revoking deletes the model files.</li>
        </ol>
        <p class="note">
          Only forge a voice that is yours. Five uploads are not permission to recreate anyone else.
        </p>
      </ArcanePanel>

      <ArcanePanel title="The oath" eyebrow="ii · sign" glow="ember">
        {#if !ready}
          <OracleStatus tone="warning"
            >Forge the Gold Vocal first; there is nothing to train from yet.</OracleStatus
          >
        {:else if done}
          <div class="done">
            <VoiceSigil buffer={goldBuffer} size={200} label="Your forged voice" />
            <OracleStatus tone="success">Your voice is forged and sealed in the Codex.</OracleStatus
            >
            <div class="row">
              <RuneButton href={studioUrl}>Use it in the Studio</RuneButton>
              <RuneButton variant="ghost" href={resolve('/voices')}>Open the Codex</RuneButton>
            </div>
          </div>
        {:else}
          {#if manifest.voices.length}
            <OracleStatus tone="neutral">
              This session already has {manifest.voices.length} forged voice{manifest.voices
                .length === 1
                ? ''
                : 's'}.
              <a href={resolve('/voices')}>See the Codex</a>. Signing again trains (and pays for) a
              new one.
            </OracleStatus>
          {/if}
          <form class="oath" onsubmit={sign}>
            <p class="performer">
              Performer on this session: <strong>{manifest.performer}</strong>
            </p>
            <ArcaneInput
              label="Type your full name to sign"
              bind:value={name}
              placeholder={manifest.performer}
              maxlength={120}
            />
            {#if name && !nameMatches}
              <p class="mismatch" aria-live="polite">The name must match the performer exactly.</p>
            {/if}
            <RuneToggle
              label={STATEMENT}
              bind:checked={ownVoice}
              hint="Required. Recorded with the time in the audit trail."
            />
            <RuneButton type="submit" disabled={!canSign} busy={submitting}
              >Seal the oath & forge</RuneButton
            >
          </form>
          {#if error}<OracleStatus tone="danger">{error}</OracleStatus>{/if}
          {#if job}
            <div class="ritual">
              <RitualProgress stages={job.stages} detail={job.error ?? job.detail} />
            </div>
            {#if job.status === 'failed' || job.status === 'cancelled'}
              <OracleStatus tone="danger"
                >The forge {job.status}: {job.error ?? job.detail}</OracleStatus
              >
            {/if}
          {/if}
        {/if}
      </ArcanePanel>
    </div>
  {/if}
</div>

<style>
  .page {
    display: grid;
    gap: 1.5rem;
    max-width: 78rem;
    margin: 0 auto;
  }
  .intro h1 {
    font-size: clamp(2rem, 5vw, 3.2rem);
    background: linear-gradient(90deg, var(--vbm-text), var(--vbm-ember));
    background-clip: text;
    color: transparent;
  }
  .eyebrow {
    font-family: var(--vbm-font-mono);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    font-size: 0.72rem;
    color: var(--vbm-ember);
  }
  .back {
    font-family: var(--vbm-font-mono);
    font-size: 0.78rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
    gap: 1.5rem;
  }
  .plain {
    margin: 0;
    padding-left: 1.2rem;
    display: grid;
    gap: 0.5rem;
  }
  .note {
    margin: 1rem 0 0;
    font-style: italic;
    color: var(--vbm-muted);
  }
  .oath {
    display: grid;
    gap: 1rem;
    justify-items: start;
  }
  .oath > :global(*) {
    width: 100%;
  }
  .oath > :global(button) {
    width: auto;
  }
  .performer {
    margin: 0;
    color: var(--vbm-muted);
  }
  .performer strong {
    color: var(--vbm-text);
  }
  .mismatch {
    margin: -0.5rem 0 0;
    color: var(--vbm-gold);
    font-size: 0.92rem;
  }
  .ritual {
    margin-top: 1.5rem;
  }
  .done {
    display: grid;
    justify-items: center;
    gap: 1rem;
  }
  .row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>
