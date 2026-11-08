<script lang="ts">
  import { resolve } from '$app/paths';
  import type { VoiceModel } from '@vbm/contracts';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import Sigil from '@vbm/ui/Sigil.svelte';

  let voices = $state<VoiceModel[] | null>(null);
  let error = $state('');
  let notice = $state('');
  let revoking = $state<string | null>(null);

  const STATUS_TEXT = { training: 'Training', ready: 'Ready', failed: 'Failed' } as const;
  const PROFILE_LABELS: Record<string, string> = {
    range: 'Range',
    brightness: 'Tone',
    dynamics: 'Dynamics',
    breathiness: 'Breath',
    voiced_ratio: 'Pitched'
  };
  const when = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

  async function load() {
    try {
      const res = await fetch('/api/voices');
      if (!res.ok)
        throw new Error((await res.json().catch(() => null))?.detail ?? `HTTP ${res.status}`);
      voices = (await res.json()) as VoiceModel[];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load your voices.';
    }
  }

  $effect(() => {
    void load();
  });

  async function revoke(v: VoiceModel) {
    if (
      !confirm(
        `Revoke the voice of ${v.performer}? Its trained model files will be deleted. This cannot be undone.`
      )
    )
      return;
    revoking = v.id;
    notice = '';
    error = '';
    try {
      const res = await fetch(`/api/voices/${encodeURIComponent(v.id)}`, { method: 'DELETE' });
      if (!res.ok)
        throw new Error((await res.json().catch(() => null))?.detail ?? `HTTP ${res.status}`);
      voices = (voices ?? []).filter((x) => x.id !== v.id);
      notice = `The voice of ${v.performer} was revoked.`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Revoke failed.';
    } finally {
      revoking = null;
    }
  }
</script>

<svelte:head><title>My voices · Vocal Fix · VBM Studio</title></svelte:head>

<div class="page">
  <header class="intro">
    <p class="eyebrow">Your voices</p>
    <h1>My voices</h1>
    <p>
      Every voice here was consented to by its own performer. Revoke one and its model is deleted.
    </p>
  </header>

  {#if notice}<OracleStatus tone="success">{notice}</OracleStatus>{/if}
  {#if error}<OracleStatus tone="danger">{error}</OracleStatus>{/if}

  {#if !voices && !error}
    <SigilLoader label="Loading voices…" />
  {:else if voices && voices.length === 0}
    <div class="empty">
      <Sigil size={72} dim />
      <p>No voices yet. Build a voice from a Gold Vocal session to add the first one.</p>
    </div>
  {:else if voices}
    <ul class="codex">
      {#each voices as v (v.id)}
        <li>
          <ArcanePanel
            title={v.performer}
            eyebrow={v.id.slice(0, 14) + '…'}
            glow={v.status === 'ready' ? 'teal' : v.status === 'failed' ? 'ember' : 'violet'}
          >
            {#snippet actions()}
              <span class="status {v.status}">{STATUS_TEXT[v.status]}</span>
            {/snippet}
            <dl class="facts">
              <div>
                <dt>Created</dt>
                <dd>{when(v.created_at)}</dd>
              </div>
              <div>
                <dt>Consent signed by</dt>
                <dd>{v.consent.attested_name}</dd>
              </div>
              <div>
                <dt>Signed at</dt>
                <dd>{when(v.consent.attested_at)}</dd>
              </div>
              <div class="wide">
                <dt>Consent statement</dt>
                <dd class="oath">“{v.consent.statement}”</dd>
              </div>
              {#if v.profile}
                {#each Object.entries(v.profile) as [k, val] (k)}
                  <div>
                    <dt>{PROFILE_LABELS[k] ?? k}</dt>
                    <dd>{val}</dd>
                  </div>
                {/each}
              {/if}
              {#if v.error}<div class="wide">
                  <dt>Error</dt>
                  <dd class="err">{v.error}</dd>
                </div>{/if}
            </dl>
            <div class="row">
              <a class="src vbm-mono" href={resolve('/session/[id]', { id: v.consent.session_id })}
                >Source session ↗</a
              >
              <RuneButton variant="danger" busy={revoking === v.id} onclick={() => revoke(v)}
                >Revoke</RuneButton
              >
            </div>
          </ArcanePanel>
        </li>
      {/each}
    </ul>
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
    background: linear-gradient(90deg, var(--vbm-text), var(--vbm-teal));
    background-clip: text;
    color: transparent;
  }
  .intro p {
    color: var(--vbm-muted);
    max-width: 44rem;
  }
  .eyebrow {
    font-family: var(--vbm-font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.72rem;
    color: var(--vbm-teal) !important;
  }
  .empty {
    display: grid;
    justify-items: center;
    gap: 1rem;
    padding: 3rem 1rem;
    color: var(--vbm-muted);
    text-align: center;
  }
  .codex {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 26rem), 1fr));
    gap: 1.5rem;
  }
  .status {
    font-family: var(--vbm-font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.3rem 0.8rem;
    border-radius: var(--vbm-radius-sm);
    color: var(--vbm-void);
    background: var(--vbm-violet);
  }
  .status.ready {
    background: var(--vbm-teal);
  }
  .status.failed {
    background: var(--vbm-blood);
  }
  .facts {
    margin: 0 0 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
    gap: 0.7rem 1.2rem;
  }
  .facts .wide {
    grid-column: 1 / -1;
  }
  dt {
    font-family: var(--vbm-font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .oath {
    font-style: italic;
  }
  .err {
    color: var(--vbm-blood);
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .src {
    font-size: 0.75rem;
  }
</style>
