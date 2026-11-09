<script lang="ts">
  import { apiPath } from '../../../../lib/base';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import RuneToggle from '@vbm/ui/RuneToggle.svelte';
  import RitualProgress from '@vbm/ui/RitualProgress.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import Waveform from '@vbm/ui/Waveform.svelte';
  import GrimoirePlayer from '@vbm/ui/GrimoirePlayer.svelte';
  import VoiceSigil from '@vbm/ui/VoiceSigil.svelte';
  import { decodeAudioFromUrl, formatTime } from '@vbm/ui/audio';

  type Phrase = {
    id: string;
    take_id: string;
    source_file: string;
    start: number;
    end: number;
    rms_db: number;
    peak: number;
    clipped: number;
    snr_db: number;
    score: number;
    reasons: string[];
  };
  type Segment = {
    phrase_id: string;
    take_id: string;
    output_start: number;
    output_end: number;
  };
  type Gold = { version: string; phrases: Phrase[]; selected: string[]; segments: Segment[] };
  type Manifest = {
    id: string;
    mode: string;
    performer: string;
    gold?: Gold;
    profile?: Record<string, string>;
  };
  type Stage = { id: string; label: string; state: 'pending' | 'active' | 'done' | 'failed' };

  const id = $derived(page.params.id ?? '');
  const audioUrl = (area: string, file: string) =>
    apiPath(`/api/sessions/${encodeURIComponent(id)}/audio/${area}/${encodeURIComponent(file)}`);

  let manifest = $state<Manifest | null>(null);
  let loadError = $state('');
  let chosen = $state<Record<string, boolean>>({});
  let sources = $state<Record<string, AudioBuffer>>({});
  let goldBuffer = $state<AudioBuffer | null>(null);
  let running = $state(false);
  let stages = $state<Stage[]>([]);
  let message = $state<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const gold = $derived(manifest?.gold ?? null);
  const goldSrc = $derived(gold ? audioUrl('derived', gold.version) : '');
  const regions = $derived(
    gold?.segments.map((s, i) => ({
      start: s.output_start,
      end: s.output_end,
      label: String(i + 1)
    })) ?? []
  );
  const dirty = $derived(
    !!gold && gold.phrases.some((p) => chosen[p.id] !== gold.selected.includes(p.id))
  );

  async function load() {
    loadError = '';
    try {
      const res = await fetch(apiPath(`/api/sessions/${encodeURIComponent(id)}`));
      if (!res.ok)
        throw new Error((await res.json().catch(() => null))?.detail ?? `HTTP ${res.status}`);
      const m = (await res.json()) as Manifest;
      manifest = m;
      if (m.gold)
        chosen = Object.fromEntries(
          m.gold.phrases.map((p) => [p.id, m.gold!.selected.includes(p.id)])
        );
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Could not open this session.';
    }
  }

  $effect(() => {
    if (id) void load();
  });

  // Decode each source take once, for the per-phrase slices.
  $effect(() => {
    const g = gold;
    if (!g) return;
    const controller = new AbortController();
    const files = [...new Set(g.phrases.map((p) => p.source_file))].sort();
    for (const file of files) {
      if (sources[file]) continue;
      decodeAudioFromUrl(audioUrl('derived', file), controller.signal)
        .then((b) => (sources = { ...sources, [file]: b }))
        .catch(() => undefined);
    }
    return () => controller.abort();
  });

  $effect(() => {
    const src = goldSrc;
    goldBuffer = null;
    if (!src) return;
    const controller = new AbortController();
    decodeAudioFromUrl(src, controller.signal)
      .then((b) => (goldBuffer = b))
      .catch(() => undefined);
    return () => controller.abort();
  });

  function slice(buffer: AudioBuffer | undefined, start: number, end: number): AudioBuffer | null {
    if (!buffer) return null;
    const rate = buffer.sampleRate;
    const s = Math.max(0, Math.floor(start * rate));
    const e = Math.min(buffer.length, Math.ceil(end * rate));
    if (e <= s) return null;
    const out = new AudioBuffer({
      length: e - s,
      sampleRate: rate,
      numberOfChannels: buffer.numberOfChannels
    });
    for (let c = 0; c < buffer.numberOfChannels; c++)
      out.copyToChannel(buffer.getChannelData(c).subarray(s, e), c);
    return out;
  }

  const slices = $derived.by(() => {
    const out: Record<string, AudioBuffer | null> = {};
    for (const p of gold?.phrases ?? []) out[p.id] = slice(sources[p.source_file], p.start, p.end);
    return out;
  });

  const STAGES = [
    { id: 'sift', label: 'Find phrases' },
    { id: 'cut', label: 'Cut & join' },
    { id: 'profile', label: 'Analyse the voice' },
    { id: 'seal', label: 'Save Gold Vocal' }
  ];

  async function reassemble() {
    if (!gold || running) return;
    running = true;
    message = null;
    // The gold route runs synchronously, so stages advance on a clock while we wait, then settle on the real result.
    stages = STAGES.map((s, i) => ({ ...s, state: i === 0 ? 'active' : 'pending' }));
    let step = 0;
    const timer = setInterval(() => {
      if (step < STAGES.length - 1) {
        step++;
        stages = STAGES.map((s, i) => ({
          ...s,
          state: i < step ? 'done' : i === step ? 'active' : 'pending'
        }));
      }
    }, 1500);
    const included = gold.phrases.filter((p) => chosen[p.id]).map((p) => p.id);
    const excluded = gold.phrases.filter((p) => !chosen[p.id]).map((p) => p.id);
    try {
      const res = await fetch(apiPath(`/api/sessions/${encodeURIComponent(id)}/gold`), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ included, excluded })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail ?? `HTTP ${res.status}`);
      stages = STAGES.map((s) => ({ ...s, state: 'done' }));
      message = {
        tone: 'success',
        text: `Gold re-assembled from ${body.selected.length} phrases.`
      };
      await load();
    } catch (e) {
      stages = STAGES.map((s, i) => ({
        ...s,
        state: i < step ? 'done' : i === step ? 'failed' : 'pending'
      }));
      message = { tone: 'danger', text: e instanceof Error ? e.message : 'Re-assembly failed.' };
    } finally {
      clearInterval(timer);
      running = false;
    }
  }

  const PROFILE_LABELS: Record<string, string> = {
    range: 'Range',
    brightness: 'Tone',
    dynamics: 'Dynamics',
    breathiness: 'Breath',
    voiced_ratio: 'Pitched'
  };
</script>

<svelte:head><title>Gold Vocal · Vocal Fix · VBM Studio</title></svelte:head>

<div class="page">
  <header class="intro">
    <p class="eyebrow">Gold vocal · phrase board</p>
    <h1>Gold Vocal phrases</h1>
    <p>
      Each card below is a real phrase cut from one of your repaired takes. Choose which ones form
      the Gold Vocal; nothing is averaged or blended between takes.
    </p>
    <a class="back" href={resolve('/session/[id]', { id })}>← Back to the session</a>
  </header>

  {#if loadError}
    <OracleStatus tone="danger">{loadError}</OracleStatus>
  {:else if !manifest}
    <SigilLoader label="Loading session…" />
  {:else if !gold}
    <OracleStatus tone="warning">
      This session has no Gold Vocal yet. Repair all five takes and build it from the session page.
    </OracleStatus>
  {:else}
    <ArcanePanel title="The Gold Vocal" eyebrow="1 · result" glow="ember">
      <div class="result">
        <div class="result-main">
          <GrimoirePlayer
            src={goldSrc}
            title="Gold Vocal"
            subtitle={manifest.performer}
            downloadName={gold.version}
          />
          <p class="cap">Phrase map</p>
          <Waveform
            buffer={goldBuffer}
            {regions}
            color="ember"
            height={90}
            label="Gold vocal phrase map"
          />
        </div>
        <div class="result-side">
          <VoiceSigil buffer={goldBuffer} size={200} label="Gold Vocal fingerprint" />
          {#if manifest.profile}
            <dl class="profile">
              {#each Object.entries(manifest.profile) as [k, v] (k)}
                <div>
                  <dt>{PROFILE_LABELS[k] ?? k}</dt>
                  <dd>{v}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </div>
      </div>
    </ArcanePanel>

    <ArcanePanel title="Phrase board" eyebrow="2 · {gold.phrases.length} phrases" glow="violet">
      {#snippet actions()}
        <RuneButton onclick={reassemble} busy={running} disabled={!dirty}>Re-assemble</RuneButton>
      {/snippet}
      {#if stages.length}
        <div class="ritual"><RitualProgress {stages} /></div>
      {/if}
      {#if message}<OracleStatus tone={message.tone}>{message.text}</OracleStatus>{/if}
      <ul class="board">
        {#each gold.phrases as p (p.id)}
          <li class="rune" class:off={!chosen[p.id]}>
            <div class="rune-head">
              <span class="pid vbm-mono">{p.id}</span>
              <span class="score" title="Quality score">{Math.round(p.score * 100)}</span>
            </div>
            <Waveform
              buffer={slices[p.id]}
              height={54}
              color={chosen[p.id] ? 'violet' : 'teal'}
              label="Phrase {p.id}"
            />
            <p class="meta vbm-mono">
              {p.take_id} · {formatTime(p.start)}–{formatTime(p.end)} · {(p.end - p.start).toFixed(
                1
              )}s · SNR
              {p.snr_db} dB{p.clipped ? ` · ${p.clipped} clipped` : ''}
            </p>
            <p class="reasons">{p.reasons.join('; ')}</p>
            <RuneToggle label="Include" bind:checked={chosen[p.id]} disabled={running} />
          </li>
        {/each}
      </ul>
    </ArcanePanel>
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
    background: linear-gradient(90deg, var(--vbm-gold), var(--vbm-ember));
    background-clip: text;
    color: transparent;
  }
  .intro p {
    max-width: 46rem;
    color: var(--vbm-muted);
  }
  .eyebrow {
    font-family: var(--vbm-font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.72rem;
    color: var(--vbm-ember) !important;
  }
  .back {
    font-family: var(--vbm-font-mono);
    font-size: 0.78rem;
  }
  .result {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  .result-main {
    flex: 1 1 28rem;
    min-width: 0;
    display: grid;
    gap: 0.6rem;
  }
  .result-side {
    flex: 0 1 16rem;
    display: grid;
    justify-items: center;
    gap: 1rem;
    margin-inline: auto;
  }
  .cap {
    margin: 0.5rem 0 0;
    font-family: var(--vbm-font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  .profile {
    margin: 0;
    display: grid;
    gap: 0.5rem;
    width: 100%;
  }
  .profile dt {
    font-family: var(--vbm-font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-ember);
  }
  .profile dd {
    margin: 0;
    color: var(--vbm-text);
  }
  .ritual {
    margin-bottom: 1rem;
  }
  .board {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
    gap: 1rem;
  }
  .rune {
    display: grid;
    gap: 0.5rem;
    padding: 0.9rem;
    min-width: 0;
    background: linear-gradient(160deg, var(--vbm-obsidian-3), var(--vbm-obsidian));
    box-shadow: inset 0 0 0 1px var(--vbm-line-bright);
    border-radius: var(--vbm-radius-sm);
    transition: opacity 0.2s;
  }
  .rune.off {
    opacity: 0.55;
  }
  .rune-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .pid {
    font-size: 0.78rem;
    color: var(--vbm-text);
  }
  .score {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    font-family: var(--vbm-font-mono);
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--vbm-void);
    background: linear-gradient(135deg, var(--vbm-gold), var(--vbm-ember));
    border-radius: 50%;
  }
  .meta {
    margin: 0;
    font-size: 0.68rem;
    color: var(--vbm-muted);
  }
  .reasons {
    margin: 0;
    font-style: italic;
    font-size: 0.92rem;
    color: var(--vbm-muted);
  }
</style>
