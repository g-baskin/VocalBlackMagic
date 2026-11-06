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
    --c: var(--vbm-violet);
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-height: 2.75rem;
    padding: 0.6rem 1.5rem;
    border: 0;
    font-family: var(--vbm-font-display);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    clip-path: polygon(
      12px 0,
      calc(100% - 12px) 0,
      100% 50%,
      calc(100% - 12px) 100%,
      12px 100%,
      0 50%
    );
    transition:
      filter 0.2s,
      transform 0.15s;
  }
  .summon {
    color: var(--vbm-void);
    background:
      linear-gradient(100deg, transparent 30%, rgb(255 255 255 / 35%) 50%, transparent 70%) -200%
        0 / 200% 100% no-repeat,
      linear-gradient(90deg, var(--vbm-violet), #d38cff 50%, var(--vbm-ember));
  }
  .summon:hover:not(:disabled) {
    background-position:
      200% 0,
      0 0;
    transition: background-position 0.8s;
    filter: drop-shadow(0 0 10px rgb(167 116 255 / 70%));
  }
  .ghost {
    color: var(--vbm-text);
    background: linear-gradient(var(--vbm-obsidian-2), var(--vbm-obsidian-2)) padding-box;
    box-shadow: inset 0 0 0 1px var(--vbm-line-bright);
  }
  .ghost:hover:not(:disabled) {
    color: var(--vbm-teal);
    box-shadow: inset 0 0 0 1px var(--vbm-teal);
  }
  .danger {
    color: #fff;
    background: linear-gradient(90deg, #8c1d2c, #c2410c);
  }
  .danger:hover:not(:disabled) {
    filter: drop-shadow(0 0 10px rgb(255 90 110 / 60%)) brightness(1.15);
  }
  .rune:active:not(:disabled) {
    transform: scale(0.97);
  }
  .rune:focus-visible {
    outline: none;
    box-shadow:
      inset 0 0 0 2px var(--vbm-teal),
      inset 0 0 0 4px var(--vbm-void);
  }
  .rune:focus-visible .label {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .rune:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .rune[aria-busy='true'] {
    opacity: 0.85;
    cursor: progress;
  }
  .spinner {
    width: 0.9rem;
    height: 0.9rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    transform: rotate(45deg);
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(405deg);
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
