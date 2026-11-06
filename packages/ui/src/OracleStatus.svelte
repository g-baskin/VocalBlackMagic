<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    tone,
    children
  }: { tone: 'neutral' | 'warning' | 'success' | 'danger'; children: Snippet } = $props();

  const glyph = $derived({ neutral: '◈', warning: '△', success: '✧', danger: '✕' }[tone]);
  const word = $derived(
    { neutral: 'Omen', warning: 'Warning', success: 'Fulfilled', danger: 'Failed' }[tone]
  );
</script>

<div class="oracle {tone}" role="status" aria-live="polite">
  <span class="glyph" aria-hidden="true">{glyph}</span>
  <span class="vbm-sr-only">{word}:</span>
  <div class="msg">{@render children()}</div>
</div>

<style>
  .oracle {
    --c: var(--vbm-violet);
    display: flex;
    gap: 0.8rem;
    align-items: flex-start;
    padding: 0.8rem 1rem;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--c) 14%, transparent),
      transparent 80%
    );
    border-left: 2px solid var(--c);
    clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
    color: var(--vbm-text);
  }
  .warning {
    --c: var(--vbm-gold);
  }
  .success {
    --c: var(--vbm-teal);
  }
  .danger {
    --c: var(--vbm-blood);
  }
  .glyph {
    color: var(--c);
    font-size: 1.1rem;
    line-height: 1.4;
    text-shadow: 0 0 10px var(--c);
  }
  .msg {
    flex: 1;
    min-width: 0;
  }
</style>
