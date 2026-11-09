<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    tone,
    children
  }: { tone: 'neutral' | 'warning' | 'success' | 'danger'; children: Snippet } = $props();

  const glyph = $derived({ neutral: 'i', warning: '!', success: '✓', danger: '✕' }[tone]);
  const word = $derived(
    { neutral: 'Info', warning: 'Warning', success: 'Done', danger: 'Failed' }[tone]
  );
</script>

<div class="status {tone}" role="status" aria-live="polite">
  <span class="glyph" aria-hidden="true">{glyph}</span>
  <span class="vbm-sr-only">{word}:</span>
  <div class="msg">{@render children()}</div>
</div>

<style>
  .status {
    --c: var(--vbm-blue);
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.8rem 1rem;
    background: color-mix(in srgb, var(--c) 12%, var(--vbm-surface));
    border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
    border-radius: var(--vbm-radius-sm);
    color: var(--vbm-text);
  }
  .warning {
    --c: var(--vbm-warning);
  }
  .success {
    --c: var(--vbm-success);
  }
  .danger {
    --c: var(--vbm-danger);
  }
  .glyph {
    flex: none;
    width: 1.4rem;
    height: 1.4rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--c);
    color: #121216;
    font-size: 0.8rem;
    font-weight: 800;
    margin-top: 0.05rem;
  }
  .msg {
    flex: 1;
    min-width: 0;
  }
</style>
