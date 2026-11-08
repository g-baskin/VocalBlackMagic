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
    --c: var(--vbm-accent-text);
    position: relative;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--vbm-surface);
    border: 1px solid var(--vbm-border);
    border-radius: var(--vbm-radius);
    box-shadow: var(--vbm-shadow);
  }
  .ember {
    --c: var(--vbm-accent-2);
  }
  .teal {
    --c: var(--vbm-blue-text);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 0.75rem 1rem;
    flex-wrap: wrap;
    padding: 1.1rem 1.25rem 0.25rem;
  }
  .body {
    flex: 1;
    min-width: 0;
    padding: 1rem 1.25rem 1.25rem;
  }
  h2 {
    margin: 0;
    font-size: 1.15rem;
    color: var(--vbm-text);
  }
  .eyebrow {
    margin: 0 0 0.2rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--c);
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  @media (max-width: 520px) {
    header {
      padding: 1rem 1rem 0.25rem;
    }
    .body {
      padding: 0.85rem 1rem 1rem;
    }
  }
</style>
