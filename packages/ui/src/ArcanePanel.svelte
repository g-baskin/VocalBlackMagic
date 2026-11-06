<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    eyebrow,
    glow = 'violet',
    children,
    actions
  }: {
    title?: string;
    eyebrow?: string;
    glow?: 'violet' | 'ember' | 'teal';
    children: Snippet;
    actions?: Snippet;
  } = $props();
</script>

<section class="panel {glow}">
  <span class="corner tl" aria-hidden="true"></span>
  <span class="corner br" aria-hidden="true"></span>
  {#if title || eyebrow || actions}
    <header>
      <div>
        {#if eyebrow}<p class="eyebrow">{eyebrow}</p>{/if}
        {#if title}<h2>{title}</h2>{/if}
      </div>
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </header>
  {/if}
  <div class="body">{@render children()}</div>
</section>

<style>
  .panel {
    --c: var(--vbm-violet);
    --c-rgb: 167 116 255;
    position: relative;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 1px;
    clip-path: var(--vbm-clip);
    background: conic-gradient(
      from var(--vbm-angle),
      rgb(var(--c-rgb) / 10%),
      var(--c),
      rgb(var(--c-rgb) / 10%) 30%,
      rgb(var(--c-rgb) / 10%) 60%,
      var(--c) 80%,
      rgb(var(--c-rgb) / 10%)
    );
    animation: vbm-spin 9s linear infinite;
  }
  .ember {
    --c: var(--vbm-ember);
    --c-rgb: 255 138 61;
  }
  .teal {
    --c: var(--vbm-teal);
    --c-rgb: 63 240 210;
  }
  .panel > header,
  .body {
    background: linear-gradient(160deg, var(--vbm-obsidian-2), var(--vbm-obsidian) 60%);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1.1rem 1.4rem 0.6rem;
    clip-path: polygon(var(--vbm-cut) 0, 100% 0, 100% 100%, 0 100%, 0 var(--vbm-cut));
  }
  header + .body {
    padding-top: 0.6rem;
    clip-path: polygon(
      0 0,
      100% 0,
      100% calc(100% - var(--vbm-cut)),
      calc(100% - var(--vbm-cut)) 100%,
      0 100%
    );
  }
  .body {
    flex: 1;
    min-width: 0;
    padding: 1.2rem 1.4rem 1.4rem;
    clip-path: var(--vbm-clip);
  }
  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--vbm-text);
    text-shadow: 0 0 14px rgb(var(--c-rgb) / 50%);
  }
  .eyebrow {
    margin: 0 0 0.25rem;
    font-family: var(--vbm-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--c);
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .corner {
    position: absolute;
    width: 10px;
    height: 10px;
    border: 1px solid var(--c);
    z-index: 1;
    pointer-events: none;
  }
  .tl {
    top: 8px;
    right: 8px;
    border-left: 0;
    border-bottom: 0;
  }
  .br {
    bottom: 8px;
    left: 8px;
    border-right: 0;
    border-top: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .panel {
      animation: none;
    }
  }
</style>
