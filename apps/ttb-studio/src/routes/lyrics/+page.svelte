<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import ArcaneInput from '@vbm/ui/ArcaneInput.svelte';
  import ArcaneTextarea from '@vbm/ui/ArcaneTextarea.svelte';
  import ArcaneSelect from '@vbm/ui/ArcaneSelect.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import { validateLyricsRequest, type LyricsAction, type LyricsRequest } from '@vbm/contracts';
  import { api } from '../../lib/client/api';

  let description = $state('A haunted gothic synth-pop hymn about lighting candles for the lost');
  let instruction = $state('');
  let title = $state('');
  let lyrics = $state('');
  let target = $state('600');
  let busy = $state<LyricsAction | null>(null);
  let error = $state<string | null>(null);
  const targets = [
    {
      value: '600',
      label: 'Short (≤600 chars)',
      hint: 'Fits MiniMax Music 1.5, the default engine'
    },
    { value: '1500', label: 'Medium (≤1500 chars)', hint: 'For ACE-Step or Lyria' },
    { value: '3000', label: 'Long (≤3000 chars)' }
  ];
  const sections = $derived((lyrics.match(/^\s*\[[^\]]+\]\s*$/gm) ?? []).map((s) => s.trim()));

  async function run(action: LyricsAction) {
    const request: LyricsRequest = {
      action,
      description,
      lyrics,
      instruction,
      max_chars: Number(target)
    };
    const invalid = validateLyricsRequest(request);
    if (invalid) {
      error = invalid;
      return;
    }
    busy = action;
    error = null;
    try {
      const reply = await api<{ title: string | null; lyrics: string }>('/api/studio/lyrics', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      lyrics = reply.lyrics;
      if (reply.title && (!title || action === 'write')) title = reply.title;
    } catch (e) {
      error = e instanceof Error ? e.message : 'The oracle is silent.';
    } finally {
      busy = null;
    }
  }

  function sendToStudio() {
    sessionStorage.setItem(
      'vbm-studio-prefill',
      JSON.stringify({ title, lyrics, prompt: description })
    );
    void goto(resolve('/'));
  }
</script>

<svelte:head><title>Lyrics · The Studio · Vocal Black Magic</title></svelte:head>

<div class="page">
  <header class="page-title">
    <h1>Lyric Workshop</h1>
    <p>Write, rewrite or extend lyrics with the oracle, then carry them into the Studio.</p>
  </header>
  <div class="bench">
    <ArcanePanel eyebrow="Inspiration" title="What is it about?" glow="ember">
      <div class="fields">
        <ArcaneTextarea
          label="Song description"
          bind:value={description}
          rows={4}
          maxlength={3000}
        />
        <ArcaneInput
          label="Instruction (optional)"
          bind:value={instruction}
          maxlength={1000}
          placeholder="e.g. darker imagery, add internal rhyme"
        />
        <ArcaneSelect label="Length" bind:value={target} options={targets} />
        <div class="row">
          <RuneButton busy={busy === 'write'} disabled={!!busy} onclick={() => run('write')}
            >Write anew</RuneButton
          >
          <RuneButton
            variant="ghost"
            busy={busy === 'rewrite'}
            disabled={!!busy}
            onclick={() => run('rewrite')}>Rewrite</RuneButton
          >
          <RuneButton
            variant="ghost"
            busy={busy === 'extend'}
            disabled={!!busy}
            onclick={() => run('extend')}>Extend</RuneButton
          >
        </div>
        <p class="aside">Each call costs under a cent (Claude 3.5 Haiku on Replicate).</p>
      </div>
    </ArcanePanel>
    <ArcanePanel eyebrow="The page" title="Lyrics" glow="violet">
      <div class="fields">
        <ArcaneInput label="Title" bind:value={title} maxlength={120} />
        {#if busy}<SigilLoader label="The oracle writes…" size={40} />{/if}
        <ArcaneTextarea
          label="Lyrics with section tags"
          bind:value={lyrics}
          rows={16}
          maxlength={15000}
        />
        {#if sections.length}
          <ol class="sections" aria-label="Sections">
            {#each sections as section, i (i)}<li>{section}</li>{/each}
          </ol>
        {/if}
        <RuneButton disabled={lyrics.trim().length < 10} onclick={sendToStudio}
          >Send to Studio</RuneButton
        >
      </div>
    </ArcanePanel>
  </div>
  {#if error}<OracleStatus tone="danger">{error}</OracleStatus>{/if}
</div>

<style>
  .bench {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
    gap: 1.5rem;
  }
  .fields {
    display: grid;
    gap: 1rem;
  }
  .row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .aside {
    margin: 0;
    opacity: 0.7;
    font-style: italic;
  }
  .sections {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .sections li {
    font-family: var(--vbm-font-mono);
    font-size: 0.75rem;
    border: 1px solid var(--vbm-violet-deep);
    padding: 0.15rem 0.5rem;
    color: var(--vbm-violet);
  }
  @media (max-width: 820px) {
    .bench {
      grid-template-columns: 1fr;
    }
  }
</style>
