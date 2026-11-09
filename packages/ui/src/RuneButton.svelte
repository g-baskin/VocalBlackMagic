<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'summon',
    type = 'button',
    disabled = false,
    busy = false,
    href,
    onclick,
    children
  }: {
    variant?: 'summon' | 'ghost' | 'danger';
    type?: 'button' | 'submit';
    disabled?: boolean;
    busy?: boolean;
    href?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  } = $props();

  const inert = $derived(disabled || busy);
</script>

{#if href && !inert}
  <a class="rune {variant}" {href} {onclick}>
    <span class="label">{@render children()}</span>
  </a>
{:else}
  <button class="rune {variant}" {type} disabled={inert} aria-busy={busy || undefined} {onclick}>
    {#if busy}<span class="spinner" aria-hidden="true"></span>{/if}
    <span class="label">{@render children()}</span>
  </button>
{/if}

<style>
  .rune {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: var(--vbm-tap);
    padding: 0.6rem 1.35rem;
    border: 0;
    border-radius: var(--vbm-radius-pill);
    font-family: var(--vbm-font-sans);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.2;
    text-decoration: none;
    cursor: pointer;
    transition:
      filter 0.15s,
      transform 0.15s,
      background-color 0.15s,
      box-shadow 0.15s;
  }
  .summon {
    color: #1a0b12;
    background: var(--vbm-gradient);
    box-shadow: var(--vbm-shadow-accent);
  }
  .summon:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .ghost {
    color: var(--vbm-text);
    background: var(--vbm-surface-2);
    box-shadow: inset 0 0 0 1px var(--vbm-border-strong);
  }
  .ghost:hover:not(:disabled) {
    background: var(--vbm-surface-3);
  }
  .danger {
    color: #fff;
    background: #c9304a;
  }
  .danger:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .rune:active:not(:disabled) {
    transform: scale(0.97);
  }
  .rune:focus-visible {
    outline: 2px solid var(--vbm-blue);
    outline-offset: 3px;
  }
  .rune:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none;
  }
  .rune[aria-busy='true'] {
    opacity: 0.85;
    cursor: progress;
  }
  .spinner {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-right-color: transparent;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
      border-right-color: currentColor;
      opacity: 0.6;
    }
  }
</style>
