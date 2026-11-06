<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import ArcanePanel from '@vbm/ui/ArcanePanel.svelte';
  import RuneButton from '@vbm/ui/RuneButton.svelte';
  import SigilLoader from '@vbm/ui/SigilLoader.svelte';
  import OracleStatus from '@vbm/ui/OracleStatus.svelte';
  import type { SongMeta } from '@vbm/contracts';
  import { api, coverUrl } from '../../lib/client/api';
  import MiniWave from '../../lib/client/MiniWave.svelte';

  let songs = $state<SongMeta[] | null>(null);
  let error = $state<string | null>(null);
  let filter = $state<'all' | 'favourites'>('all');
  let editing = $state<string | null>(null);
  let draft = $state('');

  const kindGlyph: Record<string, string> = {
    original: 'ᛟ',
    reimagine: 'ᛉ',
    stems: 'ᛞ',
    voice: 'ᛗ',
    master: 'ᛝ'
  };
  const shown = $derived((songs ?? []).filter((s) => filter === 'all' || s.favourite));

  async function load() {
    try {
      songs = (await api<{ songs: SongMeta[] }>('/api/studio/songs')).songs;
    } catch (e) {
      error = e instanceof Error ? e.message : 'The library is sealed.';
    }
  }
  onMount(load);

  async function patch(song: SongMeta, body: { title?: string; favourite?: boolean }) {
    try {
      const updated = (
        await api<{ song: SongMeta }>('/api/studio/songs/' + song.id, {
          method: 'PATCH',
          body: JSON.stringify(body)
        })
      ).song;
      songs = (songs ?? []).map((s) => (s.id === updated.id ? updated : s));
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not change the song.';
    }
  }
  async function saveTitle(song: SongMeta) {
    await patch(song, { title: draft });
    editing = null;
  }
  async function remove(song: SongMeta) {
    if (!confirm('Banish "' + song.title + '" forever? Its audio files will be deleted.')) return;
    try {
      await api('/api/studio/songs/' + song.id, { method: 'DELETE' });
      songs = (songs ?? []).filter((s) => s.id !== song.id);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not delete the song.';
    }
  }
  const when = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
</script>

<svelte:head><title>Library · The Studio · Vocal Black Magic</title></svelte:head>

<div class="page">
  <header class="page-title">
    <h1>The Library</h1>
    <p>Every song you have summoned, and everything derived from it.</p>
  </header>

  <div class="filters" role="radiogroup" aria-label="Filter songs">
    <button
      role="radio"
      aria-checked={filter === 'all'}
      class:on={filter === 'all'}
      onclick={() => (filter = 'all')}>All</button
    >
    <button
      role="radio"
      aria-checked={filter === 'favourites'}
      class:on={filter === 'favourites'}
      onclick={() => (filter = 'favourites')}>★ Favourites</button
    >
  </div>

  {#if error}<OracleStatus tone="danger">{error}</OracleStatus>{/if}

  {#if songs === null && !error}
    <SigilLoader label="Opening the library…" />
  {:else if songs && shown.length === 0}
    <OracleStatus tone="neutral">
      {filter === 'favourites' ? 'No favourites yet.' : 'The library is empty.'}
      <a href={resolve('/')}>Summon a song</a>.
    </OracleStatus>
  {:else}
    <ul class="grid">
      {#each shown as song (song.id)}
        <li>
          <ArcanePanel
            eyebrow={kindGlyph[song.kind] + ' ' + song.kind}
            glow={song.kind === 'master' ? 'ember' : song.kind === 'stems' ? 'teal' : 'violet'}
          >
            {#snippet actions()}
              <button
                class="star"
                class:on={song.favourite}
                aria-pressed={song.favourite}
                aria-label={song.favourite ? 'Unfavourite' : 'Favourite'}
                onclick={() => patch(song, { favourite: !song.favourite })}>★</button
              >
            {/snippet}
            {#if song.cover}
              <a
                class="cover"
                href={resolve('/library/[id]', { id: song.id })}
                tabindex="-1"
                aria-hidden="true"
              >
                <img src={coverUrl(song.id, String(song.cover.bytes))} alt="" loading="lazy" />
              </a>
            {/if}
            {#if editing === song.id}
              <form
                class="rename"
                onsubmit={(e) => {
                  e.preventDefault();
                  saveTitle(song);
                }}
              >
                <input aria-label="New title" bind:value={draft} maxlength={120} />
                <RuneButton type="submit">Bind</RuneButton>
                <RuneButton variant="ghost" onclick={() => (editing = null)}>Cancel</RuneButton>
              </form>
            {:else}
              <h2 class="card-title">
                <a href={resolve('/library/[id]', { id: song.id })}>{song.title}</a>
              </h2>
            {/if}
            <p class="meta">{song.engine} · {when(song.created_at)}</p>
            {#if song.audio}
              <MiniWave id={song.id} label={song.title} />
            {:else if song.stems}
              <p class="meta">
                {song.stems.length} stems: {song.stems.map((s) => s.name).join(', ')}
              </p>
            {/if}
            <div class="row">
              <RuneButton variant="ghost" href={resolve('/library/[id]', { id: song.id })}
                >Open</RuneButton
              >
              <RuneButton
                variant="ghost"
                onclick={() => {
                  editing = song.id;
                  draft = song.title;
                }}>Rename</RuneButton
              >
              <RuneButton variant="danger" onclick={() => remove(song)}>Banish</RuneButton>
            </div>
          </ArcanePanel>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
  .filters button,
  .star {
    background: transparent;
    color: inherit;
    border: 1px solid var(--vbm-violet-deep);
    border-radius: 999px;
    padding: 0.35rem 1rem;
    font-family: var(--vbm-font-display);
    letter-spacing: 0.1em;
    cursor: pointer;
  }
  .filters button.on {
    background: var(--vbm-violet-deep);
    color: #fff;
  }
  .star {
    padding: 0.2rem 0.55rem;
    opacity: 0.5;
  }
  .star.on {
    opacity: 1;
    color: var(--vbm-ember);
    border-color: var(--vbm-ember);
  }
  .grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
    gap: 1.25rem;
  }
  .cover {
    display: block;
    margin: -0.25rem 0 0.75rem;
    aspect-ratio: 1;
    overflow: hidden;
    border: 1px solid var(--vbm-violet-deep);
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s ease;
  }
  .cover:hover img {
    transform: scale(1.04);
  }
  .card-title {
    font-size: 1.25rem;
    margin: 0 0 0.25rem;
  }
  .card-title a {
    color: inherit;
    text-decoration: none;
  }
  .grid > li {
    min-width: 0;
  }
  .meta {
    overflow-wrap: anywhere;
    margin: 0 0 0.6rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.75rem;
    opacity: 0.7;
  }
  .row,
  .rename {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }
  .rename input {
    flex: 1;
    min-width: 8rem;
    background: transparent;
    color: inherit;
    border: 1px solid var(--vbm-violet);
    padding: 0.4rem;
    font: inherit;
  }
</style>
