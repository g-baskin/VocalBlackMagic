<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import ABCompare from '@vbm/ui/ABCompare.svelte';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import ArcaneSelect from '@vbm/ui/ArcaneSelect.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import PitchTrace from '@vbm/ui/PitchTrace.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import RuneMeter from '@vbm/ui/RuneMeter.svelte';
  import RuneToggle from '@vbm/ui/RuneToggle.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import Spectrogram from '@vbm/ui/Spectrogram.svelte';
  import Waveform from '@vbm/ui/Waveform.svelte';
  import { decodeAudioFromUrl } from '@vbm/ui/audio';
  import {
    api,
    audioUrl,
    meterTone,
    type RecordingView,
    type SessionView,
    type VersionView
  } from '../../../lib/client';

  interface JobView {
    id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    stages: { id: string; label: string; state: 'pending' | 'active' | 'done' | 'failed' }[];
    detail: string;
    error?: string;
  }
  interface Caps {
    hosted_ready: boolean;
    presets: { id: string; name: string; description: string }[];
  }

  const id = $derived(page.params.id ?? '');
  let session = $state<SessionView | null>(null);
  let caps = $state<Caps | null>(null);
  let error = $state('');
  let selected = $state('take-1');
  let buffers = $state<Record<string, AudioBuffer | null>>({});
  let preset = $state('natural');
  let isolate = $state(false);
  let enhance = $state(false);
  let job = $state<JobView | null>(null);
  let deleting = $state(false);

  const take = $derived(session?.recordings.find((r) => r.id === selected) ?? null);
  const repair = $derived(
    session?.versions.filter((v) => v.kind === 'repair' && v.source_ids[0] === selected).at(-1) ??
      null
  );
  const allRepaired = $derived(
    !!session &&
      session.recordings.every((r) =>
        session?.versions.some((v) => v.kind === 'repair' && v.source_ids[0] === r.id)
      )
  );
  const running = $derived(job?.status === 'queued' || job?.status === 'running');

  async function load() {
    try {
      session = await api<SessionView>('/api/sessions/' + id);
      if (!session.recordings.some((r) => r.id === selected))
        selected = session.recordings[0]?.id ?? '';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  $effect(() => {
    if (!id) return;
    void load();
    void api<Caps>('/api/capabilities')
      .then((c) => (caps = c))
      .catch(() => undefined);
  });

  async function decode(key: string, url: string) {
    if (key in buffers) return;
    buffers[key] = null;
    try {
      buffers[key] = await decodeAudioFromUrl(url);
    } catch {
      buffers[key] = null;
    }
  }

  $effect(() => {
    if (session && take)
      void decode('o:' + take.id, audioUrl(session.id, 'originals', take.stored_name));
    if (session && repair)
      void decode('d:' + repair.file, audioUrl(session.id, 'derived', repair.file));
  });

  async function rediagnose() {
    try {
      session = await api<SessionView>('/api/sessions/' + id + '/diagnose', {
        method: 'POST',
        json: {}
      });
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  async function startRepair(all: boolean) {
    error = '';
    try {
      job = await api<JobView>('/api/sessions/' + id + '/repair', {
        method: 'POST',
        json: { preset, isolate, enhance, take_ids: all ? undefined : [selected] }
      });
      while (job && (job.status === 'queued' || job.status === 'running')) {
        await new Promise((r) => setTimeout(r, 1500));
        job = await api<JobView>('/api/sessions/' + id + '/jobs/' + job.id);
      }
      if (job?.status === 'failed') error = job.error ?? 'Repair failed.';
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  async function cancel() {
    if (job)
      await api('/api/sessions/' + id + '/jobs/' + job.id, { method: 'DELETE' }).catch(
        () => undefined
      );
  }

  async function destroy() {
    if (!confirm('Delete this session, its originals and every derived file?')) return;
    deleting = true;
    try {
      await api('/api/sessions/' + id, { method: 'DELETE' });
      location.href = '/';
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      deleting = false;
    }
  }

  const pct = (v: number) => Math.round(v * 100) + '%';
  const delta = (a?: number, b?: number) =>
    a === undefined || b === undefined ? '' : (b - a >= 0 ? '+' : '') + Math.round((b - a) * 100);
  const meters = (d: NonNullable<RecordingView['diagnosis']>) =>
    [
      ['Overall', d.scores.overall],
      ['Clipping', d.scores.clipping],
      ['Noise', d.scores.noise],
      ['Loudness', d.scores.loudness]
    ] as const;
  const after = (v: VersionView | null) => v?.diagnosis ?? null;
</script>

<svelte:head><title>Session · Vocal Fix · VBM Studio</title></svelte:head>

{#if error}
  <OracleStatus tone="danger">{error}</OracleStatus>
{/if}

{#if !session}
  {#if !error}<SigilLoader label="Loading session…" />{/if}
{:else}
  <header class="head">
    <div>
      <p class="eyebrow vbm-mono">
        {session.mode === 'fix' ? 'Fix a take' : 'Build a Gold Vocal'} · {session.performer}
      </p>
      <h1>Diagnosis</h1>
    </div>
    <div class="head-actions">
      {#if session.mode === 'forge'}
        <RuneButton
          variant={allRepaired ? 'summon' : 'ghost'}
          href="./{session.id}/gold"
          disabled={!allRepaired}>Gold Vocal board</RuneButton
        >
        <RuneButton variant="ghost" href="./{session.id}/forge" disabled={!session.gold}
          >Voice training</RuneButton
        >
      {/if}
      <RuneButton variant="danger" busy={deleting} onclick={destroy}>Delete session</RuneButton>
    </div>
  </header>

  {#if session.recordings.length > 1}
    <div class="tabs" role="tablist" aria-label="Takes">
      {#each session.recordings as r (r.id)}
        <button
          role="tab"
          type="button"
          aria-selected={selected === r.id}
          class:active={selected === r.id}
          onclick={() => (selected = r.id)}
        >
          <span class="vbm-mono">{r.id}</span>
          {#if r.diagnosis}<span class="score">{pct(r.diagnosis.scores.overall)}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}

  {#if take}
    <ArcanePanel eyebrow={take.original_name} title="Diagnosis" glow="violet">
      <p class="probe vbm-mono">
        {take.probe.codec} · {take.probe.sample_rate} Hz · {take.probe.channels} ch · {take.probe.duration_seconds.toFixed(
          1
        )} s · {take.integrity_verified ? 'decoded and verified' : 'unverified'}
      </p>
      {#if take.diagnosis}
        <div class="meters">
          {#each meters(take.diagnosis) as [label, value] (label)}
            <RuneMeter {label} {value} display={pct(value)} tone={meterTone(value)} />
          {/each}
        </div>
        <ul class="findings">
          {#each take.diagnosis.findings as f, i (i)}
            <li class={f.severity}>{f.text}</li>
          {/each}
        </ul>
      {:else}
        <RuneButton variant="ghost" onclick={rediagnose}>Run diagnosis</RuneButton>
      {/if}
      <Waveform
        buffer={buffers['o:' + take.id] ?? null}
        regions={take.diagnosis?.regions ?? []}
        label="Original waveform with problem regions"
        height={130}
      />
      <div class="pair">
        <div>
          <h3 class="vbm-mono">Spectrogram</h3>
          <Spectrogram buffer={buffers['o:' + take.id] ?? null} height={170} />
        </div>
        <div>
          <h3 class="vbm-mono">Pitch trace</h3>
          <PitchTrace buffer={buffers['o:' + take.id] ?? null} height={170} />
        </div>
      </div>
    </ArcanePanel>

    <ArcanePanel eyebrow="Processing" title="Repair" glow="ember">
      <div class="repair-grid">
        <ArcaneSelect
          label="Polish preset"
          bind:value={preset}
          options={(caps?.presets ?? [{ id: 'natural', name: 'Natural', description: '' }]).map(
            (p) => ({
              value: p.id,
              label: p.name,
              hint: p.description
            })
          )}
        />
        <RuneToggle
          label="Isolate the vocal (Demucs)"
          hint={caps?.hosted_ready ? 'Hosted, about $0.03 per take.' : 'Needs REPLICATE_API_TOKEN.'}
          disabled={!caps?.hosted_ready}
          bind:checked={isolate}
        />
        <RuneToggle
          label="AI denoise + enhance"
          hint={caps?.hosted_ready ? 'Hosted, about $0.02 per take.' : 'Needs REPLICATE_API_TOKEN.'}
          disabled={!caps?.hosted_ready}
          bind:checked={enhance}
        />
      </div>
      <div class="row">
        <RuneButton busy={running} disabled={running} onclick={() => startRepair(false)}
          >Repair {selected}</RuneButton
        >
        {#if session.recordings.length > 1}
          <RuneButton variant="ghost" disabled={running} onclick={() => startRepair(true)}
            >Repair all takes</RuneButton
          >
        {/if}
        {#if running}<RuneButton variant="danger" onclick={cancel}>Cancel</RuneButton>{/if}
      </div>
      {#if job}
        <RitualProgress stages={job.stages} detail={job.detail} />
      {/if}
    </ArcanePanel>

    {#if repair}
      <ArcanePanel eyebrow={repair.file} title="Before and after" glow="teal">
        <ABCompare
          title="A/B audition"
          a={{ src: audioUrl(session.id, 'originals', take.stored_name), label: 'Original' }}
          b={{ src: audioUrl(session.id, 'derived', repair.file), label: 'Repaired' }}
        />
        <Waveform
          buffer={buffers['d:' + repair.file] ?? null}
          compareBuffer={buffers['o:' + take.id] ?? null}
          regions={after(repair)?.regions ?? []}
          label="Repaired waveform over the original"
          height={130}
          color="teal"
        />
        {#if take.diagnosis && after(repair)}
          <table class="deltas vbm-mono">
            <thead><tr><th>Score</th><th>Before</th><th>After</th><th>Δ</th></tr></thead>
            <tbody>
              {#each ['overall', 'clipping', 'noise', 'loudness', 'dynamics'] as const as k (k)}
                <tr>
                  <td>{k}</td>
                  <td>{pct(take.diagnosis.scores[k])}</td>
                  <td>{pct(after(repair)?.scores[k] ?? 0)}</td>
                  <td>{delta(take.diagnosis.scores[k], after(repair)?.scores[k])}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
        <a
          class="dl vbm-mono"
          href={resolve('/api/sessions/[id]/audio/[area]/[file]', {
            id: session.id,
            area: 'derived',
            file: repair.file
          })}
          download={repair.file}>Download {repair.file}</a
        >
      </ArcanePanel>
    {/if}
  {/if}
{/if}

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .head-actions,
  .row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin: 0.8rem 0;
  }
  .eyebrow {
    color: var(--vbm-teal);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.75rem;
  }
  h1 {
    font-family: var(--vbm-font-display);
    margin: 0.2rem 0 0;
    font-size: clamp(2rem, 5vw, 3rem);
  }
  h3 {
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-muted);
    margin: 1rem 0 0.4rem;
  }
  .tabs {
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  .tabs button {
    all: unset;
    cursor: pointer;
    padding: 0.5rem 0.9rem;
    border: 1px solid var(--vbm-line);
    display: flex;
    gap: 0.5rem;
    white-space: nowrap;
  }
  .tabs button.active {
    border-color: var(--vbm-gold);
    color: var(--vbm-gold);
  }
  .tabs button:focus-visible {
    outline: 2px solid var(--vbm-focus);
  }
  .score {
    color: var(--vbm-muted);
  }
  .probe {
    color: var(--vbm-muted);
    font-size: 0.8rem;
  }
  .meters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-around;
    margin: 1rem 0;
  }
  .findings {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.3rem;
    margin: 0 0 1rem;
  }
  .findings li::before {
    content: '◆ ';
  }
  .findings .problem {
    color: var(--vbm-blood);
  }
  .findings .warning {
    color: var(--vbm-ember);
  }
  .findings .info {
    color: var(--vbm-muted);
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 1rem;
  }
  .repair-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    gap: 1rem;
  }
  .deltas {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.85rem;
  }
  .deltas th,
  .deltas td {
    text-align: left;
    padding: 0.3rem 0.5rem;
    border-bottom: 1px solid var(--vbm-line);
  }
  .dl {
    color: var(--vbm-gold);
  }
</style>
