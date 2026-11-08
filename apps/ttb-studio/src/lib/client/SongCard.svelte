<script lang="ts">
  import { resolve } from '$app/paths';
  import type { SongMeta } from '@vbm/contracts';
  import { audioUrl, coverUrl } from './api';

  let { song, eyebrow }: { song: SongMeta; eyebrow?: string } = $props();
  let audio: HTMLAudioElement | undefined = $state();
  let playing = $state(false);
  let current = $state(0);
  let total = $state(0);

  function toggle() {
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => (playing = false));
    else audio.pause();
  }
  const fmt = (s: number) =>
    Number.isFinite(s)
      ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')
      : '0:00';
</script>

<article class="card">
  <div class="art">
    {#if song.cover}
      <img src={coverUrl(song.id, String(song.cover.bytes))} alt="" loading="lazy" />
    {:else}
      <div class="placeholder" aria-hidden="true">♪</div>
    {/if}
    {#if song.audio}
      <button
        class="play"
        type="button"
        onclick={toggle}
        aria-label={(playing ? 'Pause ' : 'Play ') + song.title}
      >
        {#if playing}
          <svg viewBox="0 0 24 24" aria-hidden="true"
            ><rect x="6" y="4" width="4" height="16" rx="1" /><rect
              x="14"
              y="4"
              width="4"
              height="16"
              rx="1"
            /></svg
          >
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        {/if}
      </button>
    {/if}
  </div>
  <div class="info">
    {#if eyebrow}<p class="eyebrow">{eyebrow}</p>{/if}
    <h3><a href={resolve('/library/[id]', { id: song.id })}>{song.title}</a></h3>
    <p class="meta">{song.engine}{song.audio ? ' · ' + fmt(current) + ' / ' + fmt(total) : ''}</p>
    {#if song.audio}
      <div class="bar" aria-hidden="true">
        <span style:width="{total ? (current / total) * 100 : 0}%"></span>
      </div>
      <audio
        bind:this={audio}
        src={audioUrl(song.id)}
        preload="metadata"
        onplay={() => (playing = true)}
        onpause={() => (playing = false)}
        onended={() => (playing = false)}
        ontimeupdate={() => (current = audio?.currentTime ?? 0)}
        onloadedmetadata={() => (total = audio?.duration ?? 0)}
      ></audio>
    {/if}
  </div>
</article>

<style>
  .card {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 1rem;
    align-items: center;
    padding: 0.75rem;
    background: var(--vbm-surface);
    border: 1px solid var(--vbm-border);
    border-radius: var(--vbm-radius);
    box-shadow: var(--vbm-shadow);
  }
  .art {
    position: relative;
    width: 96px;
    aspect-ratio: 1;
    border-radius: var(--vbm-radius-sm);
    overflow: hidden;
    background: var(--vbm-gradient);
  }
  .art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .placeholder {
    display: grid;
    place-items: center;
    height: 100%;
    font-size: 2.5rem;
    color: rgb(255 255 255 / 85%);
  }
  .play {
    position: absolute;
    inset: auto 0.4rem 0.4rem auto;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: #fff;
    color: #121216;
    cursor: pointer;
    box-shadow: var(--vbm-shadow);
  }
  .play svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
  .info {
    min-width: 0;
  }
  .eyebrow {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--vbm-accent-text);
  }
  h3 {
    margin: 0.1rem 0 0.15rem;
    font-size: 1.05rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  h3 a {
    color: inherit;
    text-decoration: none;
  }
  .meta {
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    color: var(--vbm-muted);
    overflow-wrap: anywhere;
  }
  .bar {
    height: 4px;
    border-radius: 2px;
    background: var(--vbm-surface-3);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--vbm-gradient);
  }
</style>
