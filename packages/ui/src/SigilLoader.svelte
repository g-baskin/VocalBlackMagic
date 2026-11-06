<script lang="ts">
  let { label = 'Conjuring…', size = 64 }: { label?: string; size?: number } = $props();
</script>

<div class="loader" role="status" aria-live="polite">
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <circle class="ring outer" cx="50" cy="50" r="44" />
    <circle class="ring inner" cx="50" cy="50" r="32" />
    <g class="star">
      <polygon points="50,14 61,40 89,40 66,57 75,84 50,67 25,84 34,57 11,40 39,40" />
    </g>
    <circle class="core" cx="50" cy="50" r="5" />
  </svg>
  {#if label}<span class="label">{label}</span>{/if}
</div>

<style>
  .loader {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--vbm-violet);
  }
  svg {
    overflow: visible;
    filter: drop-shadow(0 0 8px rgb(167 116 255 / 60%));
  }
  .ring {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    transform-origin: 50px 50px;
  }
  .outer {
    stroke-dasharray: 8 6;
    animation: spin 6s linear infinite;
  }
  .inner {
    stroke: var(--vbm-ember);
    stroke-dasharray: 2 5;
    animation: spin 4s linear infinite reverse;
  }
  .star {
    fill: none;
    stroke: var(--vbm-teal);
    stroke-width: 1.2;
    transform-origin: 50px 50px;
    animation: pulse 1.8s ease-in-out infinite;
  }
  .core {
    fill: var(--vbm-ember);
  }
  .label {
    font-family: var(--vbm-font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--vbm-muted);
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes pulse {
    50% {
      opacity: 0.4;
      transform: scale(0.88) rotate(36deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .outer,
    .inner,
    .star {
      animation: none;
    }
  }
</style>
