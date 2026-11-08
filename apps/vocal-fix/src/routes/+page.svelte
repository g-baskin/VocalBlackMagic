<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import RuneDropzone from '@vbm/ui/RuneDropzone.svelte';
  import RuneRecorder from '@vbm/ui/RuneRecorder.svelte';
  import RuneToggle from '@vbm/ui/RuneToggle.svelte';
  import { api, type SessionView } from '../lib/client';

  type Mode = 'fix' | 'forge';
  let mode = $state<Mode>('fix');
  let dropped = $state<File[]>([]);
  let recorded = $state<File[]>([]);
  let performer = $state('');
  let rights = $state(false);
  let busy = $state(false);
  let error = $state('');
  let stage = $state<'upload' | 'probe' | 'diagnose' | null>(null);

  const need = $derived(mode === 'fix' ? 1 : 5);
  const files = $derived([...dropped, ...recorded]);
  const ready = $derived(files.length === need && performer.trim().length >= 2 && rights && !busy);
  const problem = $derived(
    files.length > need
      ? 'Too many recordings: this mode takes exactly ' + need + '.'
      : files.length < need
        ? need -
          files.length +
          ' more recording' +
          (need - files.length === 1 ? '' : 's') +
          ' needed.'
        : ''
  );
  const stages = $derived(
    (['upload', 'probe', 'diagnose'] as const).map((id, i, all) => {
      const at = stage ? all.indexOf(stage) : -1;
      const failed = !!error && i === at;
      return {
        id,
        label:
          id === 'upload'
            ? 'Upload the recordings'
            : id === 'probe'
              ? 'Probe and decode'
              : 'Diagnose',
        state: failed
          ? ('failed' as const)
          : i < at
            ? ('done' as const)
            : i === at
              ? ('active' as const)
              : ('pending' as const)
      };
    })
  );

  function pick(m: Mode) {
    mode = m;
    error = '';
  }

  async function begin() {
    if (!ready) return;
    busy = true;
    error = '';
    stage = 'upload';
    try {
      const form = new FormData();
      form.set('mode', mode);
      form.set('performer', performer.trim());
      form.set('acknowledged_rights', 'true');
      for (const f of files) form.append('files', f, f.name);
      const session = await api<SessionView>('/api/sessions', { method: 'POST', body: form });
      stage = 'diagnose';
      await api('/api/sessions/' + session.id + '/diagnose', { method: 'POST', json: {} });
      await goto(resolve('/session/[id]', { id: session.id }));
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      busy = false;
    }
  }
</script>

<svelte:head><title>Vocal Fix · VBM Studio</title></svelte:head>

<section class="hero">
  <p class="eyebrow vbm-mono">Vocal Fix · part of VBM Studio</p>
  <h1>Fix your take. Build your voice.</h1>
  <p class="lede">
    Your recordings stay untouched. Every repair is a new, versioned derivative you can audition,
    compare and discard.
  </p>
</section>

<div class="portals" role="radiogroup" aria-label="Choose a mode">
  <button
    type="button"
    role="radio"
    aria-checked={mode === 'fix'}
    class="portal"
    class:chosen={mode === 'fix'}
    onclick={() => pick('fix')}
  >
    <span class="glyph" aria-hidden="true">🎙️</span>
    <span class="portal-title">Fix a take</span>
    <span class="portal-sub"
      >One recording. Diagnose clipping, room noise and level, then repair it.</span
    >
  </button>
  <button
    type="button"
    role="radio"
    aria-checked={mode === 'forge'}
    class="portal ember"
    class:chosen={mode === 'forge'}
    onclick={() => pick('forge')}
  >
    <span class="glyph" aria-hidden="true">★</span>
    <span class="portal-title">Build a Gold Vocal</span>
    <span class="portal-sub"
      >Exactly five takes of your own voice. Best phrases are chosen and combined into one
      reference.</span
    >
  </button>
</div>

<div class="grid">
  <ArcanePanel
    eyebrow="Step 1 · Upload"
    title={mode === 'fix' ? 'Your take' : 'Your five takes'}
    glow="violet"
  >
    <RuneDropzone
      label="Drop recordings here"
      accept=".wav,.mp3,.flac,.m4a,.ogg,.opus,.aac,.webm,audio/*"
      multiple={mode === 'forge'}
      max={need}
      hint="WAV, MP3, FLAC, M4A, OGG. Up to 10 minutes and 100 MB each."
      disabled={busy}
      bind:files={dropped}
    />
    <div class="or vbm-mono">or record right here</div>
    <RuneRecorder bind:files={recorded} maxSeconds={600} label="Record a take" />
    <p class="count vbm-mono" aria-live="polite">
      {files.length} / {need} recordings{problem ? ' · ' + problem : ''}
    </p>
  </ArcanePanel>

  <ArcanePanel eyebrow="Step 2 · Consent" title="Who is singing" glow="teal">
    <ArcaneInput label="Performer’s full name" bind:value={performer} maxlength={120} />
    <RuneToggle
      label="I am the performer or have their permission, and I hold the rights to process these recordings."
      hint="Required. Uploading is not consent to recreate anyone else’s voice."
      bind:checked={rights}
    />
    <div class="actions">
      <RuneButton variant="summon" disabled={!ready} {busy} onclick={begin}>
        {mode === 'fix' ? 'Start diagnosis' : 'Build Gold Vocal'}
      </RuneButton>
    </div>
    {#if stage}
      <RitualProgress {stages} detail={error || undefined} />
    {/if}
    {#if error}
      <OracleStatus tone="danger">{error}</OracleStatus>
    {/if}
  </ArcanePanel>
</div>

<style>
  .hero {
    margin: 1rem 0 2rem;
  }
  .eyebrow {
    color: var(--vbm-teal);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.75rem;
  }
  h1 {
    font-family: var(--vbm-font-display);
    font-size: clamp(2rem, 6vw, 3.6rem);
    margin: 0.3rem 0;
    line-height: 1.05;
  }
  .lede {
    color: var(--vbm-muted);
    max-width: 60ch;
  }
  .portals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .portal {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: grid;
    gap: 0.4rem;
    padding: 1.4rem;
    border: 1px solid var(--vbm-line);
    background:
      radial-gradient(
        circle at 15% 0%,
        color-mix(in srgb, var(--vbm-violet-deep) 45%, transparent),
        transparent 70%
      ),
      var(--vbm-obsidian);
    border-radius: var(--vbm-radius-sm);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .portal.ember {
    background:
      radial-gradient(
        circle at 85% 0%,
        color-mix(in srgb, var(--vbm-ember-deep) 45%, transparent),
        transparent 70%
      ),
      var(--vbm-obsidian);
  }
  .portal:hover,
  .portal:focus-visible {
    border-color: var(--vbm-line-bright);
  }
  .portal:focus-visible {
    outline: 2px solid var(--vbm-focus);
  }
  .portal.chosen {
    border-color: var(--vbm-accent);
    box-shadow: var(--vbm-shadow-accent);
  }
  .portal.ember.chosen {
    box-shadow: var(--vbm-glow-ember);
  }
  .glyph {
    font-size: 1.75rem;
    color: var(--vbm-accent-2);
  }
  .portal-title {
    font-weight: 700;
    font-size: 1.25rem;
  }
  .portal-sub {
    color: var(--vbm-muted);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: 1.25rem;
    align-items: start;
  }
  .or {
    text-align: center;
    color: var(--vbm-faint);
    margin: 0.9rem 0;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .count {
    color: var(--vbm-muted);
    font-size: 0.8rem;
  }
  .actions {
    margin: 1.2rem 0 0.8rem;
  }
  @media (max-width: 420px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
